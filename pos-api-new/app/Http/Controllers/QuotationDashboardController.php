<?php

namespace App\Http\Controllers;

use App\Enums\CustomerTypeEnum;
use App\Models\Account;
use App\Models\Biller;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductQuotation;
use App\Models\ProductVariant;
use App\Models\Quotation;
use App\Models\Supplier;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class QuotationDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $permission = 'quotes-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach ([$permission, 'quotes-index'] as $name) {
            try {
                if ($role && $role->hasPermissionTo($name)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
            }
            if ($user->can($name)) {
                return true;
            }
        }
        return false;
    }

    protected function userCan(string $permission): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        try {
            if ($role && $role->hasPermissionTo($permission)) {
                return true;
            }
        } catch (PermissionDoesNotExist $e) {
        }
        return $user->can($permission);
    }

    protected function applyStaffAccessFilter($query): void
    {
        $user = Auth::user();
        if (!$user || !$user->role_id || $user->role_id <= 2) {
            return;
        }
        if (config('staff_access') === 'own') {
            $query->where('quotations.user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $query->where('quotations.warehouse_id', $user->warehouse_id);
        }
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $startingDate = $request->input('starting_date') ?: date('Y-m-d', strtotime('-1 year'));
            $endingDate = $request->input('ending_date') ?: date('Y-m-d');
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $search = trim((string) $request->input('search', ''));

            $q = Quotation::query()->with([
                'biller:id,name',
                'customer:id,name',
                'supplier:id,name',
                'warehouse:id,name',
            ]);

            $q->where('quotations.created_at', '>=', $startingDate . ' 00:00:00')
                ->where('quotations.created_at', '<=', $endingDate . ' 23:59:59');

            $this->applyStaffAccessFilter($q);

            if ($warehouseId) {
                $q->where('quotations.warehouse_id', $warehouseId);
            }

            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('quotations.reference_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('biller', fn ($b) => $b->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('customer', fn ($c) => $c->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('supplier', fn ($s) => $s->where('name', 'LIKE', "%{$search}%"));
                });
            }

            $quotations = $q->orderBy('quotations.created_at', 'desc')->get();

            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }

            $user = Auth::user();
            $decimals = (int) (config('decimal') ?? 2);

            return $this->spaJson($request, [
                'data' => $quotations->map(fn ($row) => $this->formatRow($row, $decimals)),
                'warehouses' => $warehouseQuery->get(['id', 'name'])->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                'filters' => [
                    'starting_date' => $startingDate,
                    'ending_date' => $endingDate,
                    'warehouse_id' => $warehouseId,
                ],
                'show_warehouse_filter' => $user && $user->role_id && $user->role_id <= 2,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return $this->spaJson($request, [
                'message' => __('db.Failed to load quotations'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function createForm(Request $request)
    {
        if (!$this->userCan('quotes-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return $this->spaJson($request, $this->formMeta());
    }

    public function editForm(Request $request, $id)
    {
        if (!$this->userCan('quotes-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $quotation = Quotation::find($id);
        if (!$quotation) {
            return response()->json(['message' => __('db.Quotation not found')], 404);
        }

        $lines = ProductQuotation::where('quotation_id', $id)->get()
            ->map(fn ($pq) => $this->formatQuotationLine($pq))
            ->filter()
            ->values()
            ->all();

        return $this->spaJson($request, array_merge($this->formMeta(), [
            'quotation' => [
                'id' => $quotation->id,
                'reference_no' => $quotation->reference_no,
                'biller_id' => $quotation->biller_id,
                'customer_id' => $quotation->customer_id,
                'supplier_id' => $quotation->supplier_id,
                'warehouse_id' => $quotation->warehouse_id,
                'order_tax_rate' => (float) $quotation->order_tax_rate,
                'order_discount' => (float) $quotation->order_discount,
                'shipping_cost' => (float) $quotation->shipping_cost,
                'quotation_status' => (int) $quotation->quotation_status,
                'note' => $quotation->note,
                'document' => $quotation->document,
            ],
            'lines' => $lines,
        ]));
    }

    public function createSaleForm(Request $request, $id)
    {
        if (!$this->userCanAccess() && !$this->userCan('quotes-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $quotation = Quotation::find($id);
        if (!$quotation) {
            return response()->json(['message' => __('db.Quotation not found')], 404);
        }

        $lines = ProductQuotation::where('quotation_id', $id)->get()
            ->map(fn ($pq) => $this->formatQuotationLine($pq))
            ->filter()
            ->values()
            ->all();

        $customers = Customer::where('is_active', true)->get(['id', 'name', 'phone_number', 'deposit', 'expense']);
        $accounts = Account::where('is_active', true)->get(['id', 'name', 'is_default']);

        return $this->spaJson($request, array_merge($this->formMeta(), [
            'quotation' => $this->quotationHeader($quotation),
            'lines' => $lines,
            'customers' => $customers->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone_number' => $c->phone_number,
                'deposit' => (float) $c->deposit - (float) $c->expense,
            ]),
            'accounts' => $accounts,
        ]));
    }

    public function createPurchaseForm(Request $request, $id)
    {
        if (!$this->userCanAccess() && !$this->userCan('quotes-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $quotation = Quotation::find($id);
        if (!$quotation) {
            return response()->json(['message' => __('db.Quotation not found')], 404);
        }

        $lines = ProductQuotation::where('quotation_id', $id)->get()
            ->map(fn ($pq) => $this->formatPurchaseLineFromQuotation($pq))
            ->filter()
            ->values()
            ->all();

        $purchaseData = [];
        try {
            $createRequest = Request::create('/api/purchases/create', 'GET');
            $createRequest->headers->set('Accept', 'application/json');
            $createResponse = app(PurchaseController::class)->create($createRequest);
            if (method_exists($createResponse, 'getData')) {
                $purchaseData = (array) $createResponse->getData(true);
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return $this->spaJson($request, array_merge($this->formMeta(), $purchaseData, [
            'quotation' => $this->quotationHeader($quotation),
            'lines' => $lines,
        ]));
    }

    public function warehouseProducts(Request $request)
    {
        if (!$this->userCan('quotes-add') && !$this->userCan('quotes-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseId = (int) $request->input('warehouse_id', 0);
        if (!$warehouseId) {
            return $this->spaJson($request, ['options' => []]);
        }

        $raw = app(QuotationController::class)->getProduct($warehouseId);
        $options = [];
        if (is_array($raw) && isset($raw[0]) && is_array($raw[0])) {
            $count = count($raw[0]);
            for ($i = 0; $i < $count; $i++) {
                $code = $raw[0][$i] ?? '';
                $name = $raw[1][$i] ?? '';
                $imei = $raw[12][$i] ?? 'null';
                $embed = $raw[11][$i] ?? '0';
                $options[] = [
                    'code' => $code,
                    'name' => $name,
                    'label' => "{$code}|{$name}|{$imei}|{$embed}",
                ];
            }
        }

        return $this->spaJson($request, ['options' => $options]);
    }

    public function productSearch(Request $request)
    {
        if (!$this->userCan('quotes-add') && !$this->userCan('quotes-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $code = (string) $request->input('code', '');
        $name = (string) $request->input('name', '');
        $customerId = (string) $request->input('customer_id', '');
        $qty = (string) $request->input('qty', '1');
        $imei = (string) $request->input('imei', 'null');
        $embed = (string) $request->input('embed', '0');

        if ($code === '' || $customerId === '') {
            return $this->spaJson($request, ['message' => 'Product code and customer are required.'], 422);
        }

        $searchData = "{$code}|{$name}|{$imei}|{$embed}?{$customerId}?{$qty}";
        $result = app(QuotationController::class)->limsProductSearch(new Request(['data' => $searchData]));

        if ($result === null || !is_array($result)) {
            return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
        }

        return $this->spaJson($request, [
            'name' => $result[0] ?? '',
            'code' => $result[1] ?? '',
            'price' => (float) ($result[2] ?? 0),
            'tax_rate' => (float) ($result[3] ?? 0),
            'tax_name' => $result[4] ?? 'No Tax',
            'tax_method' => (int) ($result[5] ?? 1),
            'unit_names' => $this->csvToArray($result[6] ?? 'n/a,'),
            'unit_operators' => $this->csvToArray($result[7] ?? 'n/a,'),
            'unit_operation_values' => array_map('floatval', $this->csvToArray($result[8] ?? 'n/a,')),
            'product_id' => (int) ($result[9] ?? 0),
            'product_variant_id' => $result[10] ?? null,
            'variant_id' => null,
            'is_batch' => (bool) ($result[12] ?? false),
            'is_imei' => (bool) ($result[13] ?? false),
            'is_variant' => (bool) ($result[14] ?? false),
            'qty' => (float) ($result[15] ?? 1),
            'type' => 'standard',
        ]);
    }

    public function customerGroup(Request $request, $customerId)
    {
        $customer = Customer::find($customerId);
        if (!$customer || !$customer->customer_group_id) {
            return $this->spaJson($request, ['percentage' => 0]);
        }
        $group = CustomerGroup::find($customer->customer_group_id);

        return $this->spaJson($request, ['percentage' => (float) ($group->percentage ?? 0)]);
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $quotation = Quotation::with(['biller', 'customer', 'warehouse', 'user'])->find($id);
        if (!$quotation) {
            return response()->json(['message' => __('db.Quotation not found')], 404);
        }

        $products = ProductQuotation::where('quotation_id', $id)->get()
            ->map(fn ($pq) => $this->formatQuotationLine($pq))
            ->filter()
            ->values()
            ->map(fn ($line) => [
                'name' => $line['name'] . ' [' . $line['code'] . ']',
                'batch_no' => $line['batch_no'] ?: 'N/A',
                'qty' => $line['qty'],
                'unit' => $line['sale_unit'] !== 'n/a' ? $line['sale_unit'] : '',
                'unit_price' => $line['qty'] > 0 ? round($line['subtotal'] / $line['qty'], (int) (config('decimal') ?? 2)) : 0,
                'tax' => $line['tax'],
                'tax_rate' => $line['tax_rate'],
                'discount' => $line['discount'],
                'subtotal' => $line['subtotal'],
            ])
            ->all();

        $biller = $quotation->biller;
        $customer = $quotation->customer;
        $status = (int) $quotation->quotation_status === 1 ? __('db.Pending') : __('db.Sent');

        return $this->spaJson($request, [
            'quotation' => [
                'id' => $quotation->id,
                'reference_no' => $quotation->reference_no,
                'date' => $quotation->created_at
                    ? date(config('date_format') ?: 'd-m-Y', strtotime($quotation->created_at->toDateString()))
                    : '',
                'status' => $status,
                'total_tax' => (float) $quotation->total_tax,
                'total_discount' => (float) $quotation->total_discount,
                'total_price' => (float) $quotation->total_price,
                'order_tax' => (float) $quotation->order_tax,
                'order_tax_rate' => (float) $quotation->order_tax_rate,
                'order_discount' => (float) $quotation->order_discount,
                'shipping_cost' => (float) $quotation->shipping_cost,
                'grand_total' => (float) $quotation->grand_total,
                'note' => $quotation->note,
                'document' => $quotation->document,
            ],
            'biller' => $biller ? [
                'name' => $biller->name,
                'company_name' => $biller->company_name ?? '',
                'email' => $biller->email ?? '',
                'phone_number' => $biller->phone_number ?? '',
                'address' => $biller->address ?? '',
                'city' => $biller->city ?? '',
            ] : null,
            'customer' => $customer ? [
                'name' => $customer->name,
                'phone_number' => $customer->phone_number ?? '',
                'address' => $customer->address ?? '',
                'city' => $customer->city ?? '',
            ] : null,
            'user' => $quotation->user ? [
                'name' => $quotation->user->name,
                'email' => $quotation->user->email,
            ] : null,
            'products' => $products,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('quotes-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        if (!Quotation::find($id)) {
            return response()->json(['message' => __('db.Quotation not found')], 404);
        }

        try {
            app(QuotationController::class)->destroy($id);

            return $this->spaJson($request, ['message' => __('db.Quotation deleted successfully')]);
        } catch (\Throwable $e) {
            report($e);
            return $this->spaJson($request, [
                'message' => __('db.Failed to delete quotation'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formMeta(): array
    {
        $decimals = (int) (config('decimal') ?? 2);
        $taxes = Tax::where('is_active', true)->get(['id', 'name', 'rate']);

        return [
            'decimal' => $decimals,
            'billers' => Biller::where('is_active', true)->get(['id', 'name', 'company_name']),
            'customers' => Customer::where(['is_active' => true, 'type' => CustomerTypeEnum::REGULAR->value])
                ->orderBy('name')
                ->get(['id', 'name', 'phone_number']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name', 'company_name']),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
            'taxes' => $taxes,
            'order_tax_options' => array_merge(
                [['rate' => 0, 'name' => 'No Tax']],
                $taxes->map(fn ($t) => ['rate' => (float) $t->rate, 'name' => $t->name])->all()
            ),
        ];
    }

    private function quotationHeader(Quotation $quotation): array
    {
        return [
            'id' => $quotation->id,
            'reference_no' => $quotation->reference_no,
            'biller_id' => $quotation->biller_id,
            'customer_id' => $quotation->customer_id,
            'supplier_id' => $quotation->supplier_id,
            'warehouse_id' => $quotation->warehouse_id,
            'order_tax_rate' => (float) $quotation->order_tax_rate,
            'order_discount' => (float) $quotation->order_discount,
            'shipping_cost' => (float) $quotation->shipping_cost,
            'total_qty' => (float) $quotation->total_qty,
            'total_discount' => (float) $quotation->total_discount,
            'total_tax' => (float) $quotation->total_tax,
            'total_price' => (float) $quotation->total_price,
            'order_tax' => (float) $quotation->order_tax,
            'grand_total' => (float) $quotation->grand_total,
            'note' => $quotation->note,
        ];
    }

    private function formatQuotationLine(ProductQuotation $pq): ?array
    {
        $product = Product::find($pq->product_id);
        if (!$product) {
            return null;
        }

        $decimals = (int) (config('decimal') ?? 2);
        $code = $product->code;
        $variantId = null;
        $productVariantId = null;

        if ($pq->variant_id) {
            $variant = ProductVariant::select('id', 'item_code', 'variant_id')
                ->FindExactProduct($product->id, $pq->variant_id)
                ->first();
            if ($variant) {
                $code = $variant->item_code;
                $variantId = $pq->variant_id;
                $productVariantId = $variant->id;
            }
        }

        if ((int) $product->tax_method === 1) {
            $productPrice = (float) $pq->net_unit_price + ((float) $pq->discount / max((float) $pq->qty, 1));
        } else {
            $productPrice = ((float) $pq->total / max((float) $pq->qty, 1))
                + ((float) $pq->discount / max((float) $pq->qty, 1));
        }

        $unitNames = [];
        $unitOperators = [];
        $unitOpValues = [];
        $saleUnit = 'n/a';

        if ($product->type === 'standard') {
            $units = Unit::where('base_unit', $product->unit_id)->orWhere('id', $product->unit_id)->get();
            foreach ($units as $unit) {
                if ($pq->sale_unit_id == $unit->id) {
                    array_unshift($unitNames, $unit->unit_name);
                    array_unshift($unitOperators, $unit->operator);
                    array_unshift($unitOpValues, (float) $unit->operation_value);
                } else {
                    $unitNames[] = $unit->unit_name;
                    $unitOperators[] = $unit->operator;
                    $unitOpValues[] = (float) $unit->operation_value;
                }
            }
            if (!empty($unitOperators)) {
                if ($unitOperators[0] === '*') {
                    $productPrice = $productPrice / max($unitOpValues[0], 1);
                } elseif ($unitOperators[0] === '/') {
                    $productPrice = $productPrice * $unitOpValues[0];
                }
            }
            $saleUnit = $unitNames[0] ?? 'n/a';
        }

        $tax = Tax::where('rate', $pq->tax_rate)->first();
        $batchNo = '';
        if ($pq->product_batch_id) {
            $batchNo = ProductBatch::find($pq->product_batch_id)?->batch_no ?? '';
        }

        return [
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'product_variant_id' => $productVariantId,
            'code' => $code,
            'name' => $product->name,
            'qty' => (float) $pq->qty,
            'product_batch_id' => $pq->product_batch_id,
            'batch_no' => $batchNo,
            'net_unit_price' => round((float) $pq->net_unit_price, $decimals),
            'discount' => round((float) $pq->discount, $decimals),
            'tax' => round((float) $pq->tax, $decimals),
            'tax_rate' => (float) $pq->tax_rate,
            'tax_name' => $tax?->name ?? 'No Tax',
            'subtotal' => round((float) $pq->total, $decimals),
            'product_price' => round($productPrice, $decimals),
            'row_product_price' => round($productPrice, $decimals),
            'tax_method' => (int) $product->tax_method,
            'sale_unit' => $saleUnit,
            'sale_unit_id' => $pq->sale_unit_id,
            'unit_names' => $unitNames,
            'unit_operators' => $unitOperators,
            'unit_operation_values' => $unitOpValues,
            'is_batch' => (bool) $product->is_batch,
            'type' => $product->type,
        ];
    }

    private function formatPurchaseLineFromQuotation(ProductQuotation $pq): ?array
    {
        $product = Product::find($pq->product_id);
        if (!$product || $product->type !== 'standard') {
            return null;
        }

        $line = $this->formatQuotationLine($pq);
        if (!$line) {
            return null;
        }

        $productCost = (float) $product->cost;
        if ($pq->variant_id) {
            $variant = ProductVariant::select('additional_cost')
                ->FindExactProduct($product->id, $pq->variant_id)
                ->first();
            if ($variant) {
                $productCost += (float) ($variant->additional_cost ?? 0);
            }
        }

        $unitOp = $line['unit_operation_values'][0] ?? 1;
        $unitOperator = $line['unit_operators'][0] ?? '*';
        $rowCost = $unitOperator === '*' ? $productCost * $unitOp : $productCost / max($unitOp, 1);

        $qty = (float) $pq->qty;
        $taxRate = (float) $pq->tax_rate;
        $discount = (float) $pq->discount;

        if ((int) $product->tax_method === 1) {
            $netUnitCost = ($productCost * ($unitOperator === '*' ? $unitOp : 1 / max($unitOp, 1))) - ($discount / max($qty, 1));
            $tax = $netUnitCost * $qty * ($taxRate / 100);
            $subtotal = ($netUnitCost * $qty) + $tax;
        } else {
            $subTotalUnit = ($productCost * ($unitOperator === '*' ? $unitOp : 1 / max($unitOp, 1))) - ($discount / max($qty, 1));
            $netUnitCost = (100 / (100 + $taxRate)) * $subTotalUnit;
            $tax = ($subTotalUnit - $netUnitCost) * $qty;
            $subtotal = $subTotalUnit * $qty;
        }

        $decimals = (int) (config('decimal') ?? 2);

        return array_merge($line, [
            'product_cost' => round($productCost, $decimals),
            'row_product_cost' => round($rowCost, $decimals),
            'net_unit_cost' => round($netUnitCost, $decimals),
            'net_unit_margin' => (float) ($product->profit_margin ?? 0),
            'net_unit_price' => round((float) $product->price, $decimals),
            'tax' => round($tax, $decimals),
            'subtotal' => round($subtotal, $decimals),
            'recieved' => $qty,
        ]);
    }

    private function csvToArray(string $csv): array
    {
        $parts = array_filter(explode(',', rtrim($csv, ',')), fn ($v) => $v !== '' && $v !== 'n/a');

        return array_values($parts);
    }

    private function formatRow(Quotation $quotation, int $decimals): array
    {
        $statusCode = (int) $quotation->quotation_status;

        return [
            'id' => $quotation->id,
            'date' => $quotation->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($quotation->created_at->toDateString()))
                : '—',
            'reference_no' => $quotation->reference_no,
            'warehouse_name' => $quotation->warehouse->name ?? '—',
            'biller_name' => $quotation->biller->name ?? '—',
            'customer_name' => $quotation->customer->name ?? '—',
            'supplier_name' => $quotation->supplier->name ?? 'N/A',
            'status' => $statusCode === 1 ? 'Pending' : 'Sent',
            'status_code' => $statusCode,
            'grand_total' => number_format((float) $quotation->grand_total, $decimals, '.', ''),
        ];
    }
}
