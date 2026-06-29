<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\PosSetting;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Product_Sale;
use App\Models\Sale;
use Illuminate\Http\Request;

class PosDashboardController extends SaleDashboardController
{
    protected function userCanPos(): bool
    {
        return $this->userCanAccessSales('sales-add');
    }

    public function bootstrap(Request $request)
    {
        if (!$this->userCanPos()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $meta = $this->saleFormMeta();
            $posSetting = PosSetting::latest()->first();

            return $this->spaJson($request, array_merge($meta, [
                'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name', 'image']),
                'brands' => Brand::where('is_active', true)->orderBy('title')->get(['id', 'title as name', 'image']),
                'coupons' => Coupon::where('is_active', true)->get(['id', 'code', 'type', 'amount as value', 'minimum_amount', 'quantity', 'used', 'expired_date']),
                'pos_setting' => $this->formatPosSettingResponse($posSetting),
                'product_image_base' => url('/images/product'),
                'default_product_image' => url('/images/product/zummXD2dvAtI.png'),
                'brand_image_base' => url('/images/brand'),
                'category_image_base' => url('/images/category'),
                'default_brand_image' => url('/images/product/zummXD2dvAtI.png'),
                'default_category_image' => url('/images/product/zummXD2dvAtI.png'),
                'site_title' => config('app.name', 'SalePro POS'),
            ]));
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load POS'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function products(Request $request)
    {
        if (!$this->userCanPos()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseId = (int) $request->input('warehouse_id', 0);
        if (!$warehouseId) {
            return $this->spaJson($request, ['message' => __('db.Warehouse') . ' is required.'], 422);
        }

        $filter = $request->input('filter', 'featured');
        $filterId = $request->input('filter_id', 1);

        try {
            $response = app(SaleController::class)->getProducts($warehouseId, $filter, $filterId);
            $payload = $response->getData(true);
            $items = $this->normalizeProductGrid($payload['data'] ?? []);
            $currentPage = max(1, (int) $request->input('page', 1));
            $nextPage = !empty($payload['next_page_url']) ? $currentPage + 1 : null;

            return $this->spaJson($request, [
                'items' => $items,
                'next_page' => $nextPage,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load products'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function lookupProduct(Request $request)
    {
        if (!$this->userCanPos()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $code = trim((string) $request->input('code', ''));
        $customerId = (int) $request->input('customer_id', 0);
        if ($code === '' || !$customerId) {
            return $this->spaJson($request, ['message' => 'Product code and customer are required.'], 422);
        }

        try {
            $lookupRequest = new Request([
                'data' => [
                    'code' => $code,
                    'qty' => (float) $request->input('qty', 1),
                    'embedded' => (int) $request->input('embedded', 0),
                    'batch' => $request->input('batch_id'),
                    'customer_id' => $customerId,
                    'pre_qty' => (float) $request->input('pre_qty', 0),
                    'price' => (float) $request->input('price', 0),
                    'imei' => $request->input('imei'),
                ],
            ]);

            $response = app(SaleController::class)->limsProductSearch($lookupRequest);
            $result = $response->getData(true);

            if (!is_array($result) || !isset($result[0])) {
                return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
            }

            return $this->spaJson($request, $this->mapPosProductLookup($result));
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Product not found'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 404);
        }
    }

    public function draft(Request $request, $id)
    {
        if (!$this->userCanPos()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $sale = Sale::find($id);
        if (!$sale || (int) $sale->sale_status !== 3) {
            return $this->spaJson($request, ['message' => __('db.Sale not found')], 404);
        }

        $lines = Product_Sale::where('sale_id', $id)->get()->map(function ($ps) {
            $product = Product::find($ps->product_id);
            $code = $product->code ?? '';
            $name = $product->name ?? '';
            $taxMethod = $product->tax_method ?? 1;

            if ($ps->variant_id) {
                $variant = ProductVariant::where('product_id', $ps->product_id)
                    ->where('variant_id', $ps->variant_id)
                    ->first();
                if ($variant?->item_code) {
                    $code = $variant->item_code;
                }
            }

            $unitDiscount = (float) $ps->qty > 0
                ? (float) $ps->discount / (float) $ps->qty
                : 0;

            return [
                'product_id' => $ps->product_id,
                'code' => $code,
                'name' => $name,
                'qty' => (float) $ps->qty,
                'net_unit_price' => (float) $ps->net_unit_price,
                'unit_discount' => $unitDiscount,
                'discount' => (float) $ps->discount,
                'tax_rate' => (float) $ps->tax_rate,
                'tax' => (float) $ps->tax,
                'tax_method' => (int) $taxMethod,
                'subtotal' => (float) $ps->total,
                'product_batch_id' => $ps->product_batch_id,
                'variant_id' => $ps->variant_id,
                'product_variant_id' => $ps->variant_id,
                'product_price' => (float) $ps->net_unit_price,
                'sale_unit' => 'n/a',
            ];
        })->values();

        return $this->spaJson($request, [
            'sale_id' => $sale->id,
            'customer_id' => $sale->customer_id,
            'warehouse_id' => $sale->warehouse_id,
            'biller_id' => $sale->biller_id,
            'currency_id' => $sale->currency_id,
            'exchange_rate' => $sale->exchange_rate,
            'order_tax_rate' => (float) $sale->order_tax_rate,
            'order_discount' => (float) $sale->order_discount,
            'shipping_cost' => (float) $sale->shipping_cost,
            'lines' => $lines,
        ]);
    }

    private function normalizeProductGrid(array $data): array
    {
        $items = [];
        if (!isset($data['name']) || !is_array($data['name'])) {
            return $items;
        }

        foreach (array_keys($data['name']) as $i) {
            $items[] = [
                'name' => $data['name'][$i] ?? '',
                'code' => $data['code'][$i] ?? '',
                'qty' => $data['qty'][$i] ?? 0,
                'price' => (float) ($data['price'][$i] ?? 0),
                'batch_id' => $data['batch'][$i] ?? '',
                'is_imei' => (bool) ($data['is_imei'][$i] ?? false),
                'is_embedded' => (bool) ($data['is_embeded'][$i] ?? false),
                'image' => $data['image'][$i] ?? null,
            ];
        }

        return $items;
    }

    private function mapPosProductLookup(array $result): array
    {
        $units = $this->csvToArray($result[6] ?? 'n/a,');
        $operators = $this->csvToArray($result[7] ?? 'n/a,');
        $values = array_map('floatval', $this->csvToArray($result[8] ?? 'n/a,'));

        return [
            'name' => $result[0] ?? '',
            'code' => $result[1] ?? '',
            'price' => (float) ($result[2] ?? 0),
            'tax_rate' => (float) ($result[3] ?? 0),
            'tax_name' => $result[4] ?? 'No Tax',
            'tax_method' => (int) ($result[5] ?? 1),
            'unit_names' => $units,
            'unit_operators' => $operators,
            'unit_operation_values' => $values,
            'product_id' => (int) ($result[9] ?? 0),
            'product_variant_id' => $result[10] ?? null,
            'variant_id' => $result[10] ?? null,
            'is_batch' => (bool) ($result[12] ?? false),
            'is_imei' => (bool) ($result[13] ?? false),
            'is_variant' => (bool) ($result[14] ?? false),
            'qty' => (float) ($result[15] ?? 1),
            'warehouse_qty' => (float) ($result[19] ?? 0),
            'type' => $result[20] ?? 'standard',
            'batch_id' => $result[21] ?? null,
            'batch_no' => $result[22] ?? '',
            'imei_number' => $result[18] ?? '',
        ];
    }

    private function csvToArray(?string $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        return array_values(array_filter(explode(',', rtrim($value, ',')), fn ($v) => $v !== ''));
    }
}
