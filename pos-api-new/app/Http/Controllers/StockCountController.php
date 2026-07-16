<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Product;
use App\Models\Category;
use App\Models\Product_Warehouse;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Variant;
use App\Models\Warehouse;
use App\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Traits\SpaResponse;
use Spatie\Permission\Models\Role;

class StockCountController extends Controller
{
    use SpaResponse;

    protected function userCanAccessStockCount(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return ($role && $role->hasPermissionTo('stock_count'))
            || $user->can('stock_count');
    }

    private function formatStockCountForSpa(StockCount $row): array
    {
        $warehouse = Warehouse::find($row->warehouse_id);
        $categoryNames = [];
        $brandNames = [];

        if ($row->category_id) {
            foreach (explode(',', $row->category_id) as $categoryId) {
                $category = Category::find($categoryId);
                if ($category) {
                    $categoryNames[] = $category->name;
                }
            }
        }

        if ($row->brand_id) {
            foreach (explode(',', $row->brand_id) as $brandId) {
                $brand = Brand::find($brandId);
                if ($brand) {
                    $brandNames[] = $brand->title;
                }
            }
        }

        $fileBase = url('stock_count');
        $scope = $row->count_scope ?? 'all';
        $scopeLabels = [
            'all' => 'All products',
            'with_variants' => 'With variants',
            'without_variants' => 'Without variants',
            'batch' => 'Batch-wise',
        ];

        return [
            'id' => $row->id,
            'date' => $row->created_at->format('d-m-Y H:i:s'),
            'reference_no' => $row->reference_no,
            'warehouse_id' => $row->warehouse_id,
            'warehouse_name' => $warehouse->name ?? '',
            'category_names' => $categoryNames,
            'category_label' => implode(', ', $categoryNames),
            'brand_names' => $brandNames,
            'brand_label' => implode(', ', $brandNames),
            'type' => $row->type,
            'type_label' => $row->type === 'full' ? 'Full' : 'Partial',
            'count_scope' => $scope,
            'count_scope_label' => $scopeLabels[$scope] ?? 'All products',
            'initial_file' => $row->initial_file,
            'initial_file_url' => $row->initial_file ? "{$fileBase}/{$row->initial_file}" : null,
            'final_file' => $row->final_file,
            'final_file_url' => $row->final_file ? "{$fileBase}/{$row->final_file}" : null,
            'note' => $row->note ?? '',
            'is_adjusted' => (bool) $row->is_adjusted,
            'has_final_file' => (bool) $row->final_file,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $generalSetting = DB::table('general_settings')->latest()->first();
        $query = StockCount::orderBy('id', 'desc');

        if (Auth::user()->role_id > 2 && ($generalSetting->staff_access ?? '') === 'own') {
            $query->where('user_id', Auth::id());
        }

        $lims_stock_count_all = $query->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_stock_count_all->map(fn ($row) => $this->formatStockCountForSpa($row)),
                'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
                'categories' => Category::where('is_active', true)->get(['id', 'name']),
                'brands' => Brand::where('is_active', true)->get(['id', 'title']),
                'file_base_url' => url('stock_count'),
                'decimal' => (int) (config('decimal') ?? ($generalSetting->decimal ?? 2)),
            ]);
        }

        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_brand_list = Brand::where('is_active', true)->get();
        $lims_category_list = Category::where('is_active', true)->get();

        return view('backend.stock_count.index', compact(
            'lims_warehouse_list',
            'lims_brand_list',
            'lims_category_list',
            'lims_stock_count_all'
        ));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $data = $request->all();
        $warehouseId = (int) ($data['warehouse_id'] ?? 0);
        if (!$warehouseId) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'Warehouse is required.'], 422);
            }

            return redirect()->back()->with('not_permitted', 'Warehouse is required.');
        }

        $countScope = $this->normalizeCountScope($data['count_scope'] ?? 'all');
        $hasCategory = !empty($data['category_id']);
        $hasBrand = !empty($data['brand_id']);
        $data['type'] = ($hasCategory || $hasBrand) ? 'partial' : 'full';
        $data['count_scope'] = $countScope;

        $categoryIds = $hasCategory ? array_values(array_filter((array) $data['category_id'])) : [];
        $brandIds = $hasBrand ? array_values(array_filter((array) $data['brand_id'])) : [];

        $rows = $this->buildStockCountRows($warehouseId, $countScope, $categoryIds, $brandIds);

        if (!count($rows)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.No product found!')], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.No product found!'));
        }

        $csvData = [['Product Name', 'Product Code', 'IMEI / Variant / Batch', 'Counted']];
        foreach ($rows as $row) {
            $csvData[] = [
                $row['name'],
                $row['code'],
                $row['extra'],
                '',
            ];
        }

        if (!file_exists(public_path() . '/stock_count/')) {
            mkdir(public_path() . '/stock_count/', 0777, true);
        }

        $filename = date('Ymd') . '-' . date('his') . '.csv';
        $file_path = public_path() . '/stock_count/' . $filename;
        $file = fopen($file_path, 'w+');
        foreach ($csvData as $cellData) {
            fputcsv($file, $cellData);
        }
        fclose($file);

        $data['user_id'] = Auth::id();
        $data['reference_no'] = 'scr-' . date('Ymd') . '-' . date('his');
        $data['initial_file'] = $filename;
        $data['is_adjusted'] = false;
        $data['category_id'] = $categoryIds ? implode(',', $categoryIds) : null;
        $data['brand_id'] = $brandIds ? implode(',', $brandIds) : null;
        unset($data['category_ids'], $data['brand_ids']);

        $createPayload = [
            'reference_no' => $data['reference_no'],
            'warehouse_id' => $warehouseId,
            'brand_id' => $data['brand_id'],
            'category_id' => $data['category_id'],
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'initial_file' => $data['initial_file'],
            'is_adjusted' => false,
        ];
        if (Schema::hasColumn('stock_counts', 'count_scope')) {
            $createPayload['count_scope'] = $countScope;
        }

        $record = StockCount::create($createPayload);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Stock Count created successfully! Please download the initial file to complete it'),
                'id' => $record->id,
                'reference_no' => $record->reference_no,
                'count_scope' => $countScope,
                'initial_file_url' => url('stock_count/' . $filename),
            ]);
        }

        return redirect()->back()->with('message', __('db.Stock Count created successfully! Please download the initial file to complete it'));
    }

    private function normalizeCountScope($scope): string
    {
        $allowed = ['all', 'with_variants', 'without_variants', 'batch'];
        $scope = strtolower(trim((string) $scope));

        return in_array($scope, $allowed, true) ? $scope : 'all';
    }

    /**
     * Build CSV rows for a stock count by scope.
     *
     * @return array<int, array{name:string,code:string,extra:string,product_id:int,variant_id:?int,product_batch_id:?int,qty:float}>
     */
    private function buildStockCountRows(
        int $warehouseId,
        string $countScope,
        array $categoryIds = [],
        array $brandIds = []
    ): array {
        $query = DB::table('products')
            ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->where('products.is_active', true)
            ->where('product_warehouse.warehouse_id', $warehouseId);

        if ($categoryIds) {
            $query->whereIn('products.category_id', $categoryIds);
        }
        if ($brandIds) {
            $query->whereIn('products.brand_id', $brandIds);
        }

        if ($countScope === 'with_variants') {
            $query->where('products.is_variant', true)
                ->whereNotNull('product_warehouse.variant_id');
        } elseif ($countScope === 'without_variants') {
            $query->where(function ($q) {
                $q->where('products.is_variant', false)->orWhereNull('products.is_variant');
            })
                ->whereNull('product_warehouse.variant_id')
                ->where(function ($q) {
                    $q->where('products.is_batch', false)
                        ->orWhereNull('products.is_batch')
                        ->orWhereNull('product_warehouse.product_batch_id');
                });
        } elseif ($countScope === 'batch') {
            $query->where('products.is_batch', true)
                ->whereNotNull('product_warehouse.product_batch_id');
        }

        $stockRows = $query
            ->select(
                'products.id as product_id',
                'products.name',
                'products.code',
                'products.is_variant',
                'products.is_batch',
                'product_warehouse.variant_id',
                'product_warehouse.product_batch_id',
                'product_warehouse.imei_number',
                'product_warehouse.qty'
            )
            ->orderBy('products.name')
            ->get();

        $rows = [];
        foreach ($stockRows as $stock) {
            $variantId = $stock->variant_id ? (int) $stock->variant_id : null;
            $batchId = $stock->product_batch_id ? (int) $stock->product_batch_id : null;

            // "all" expands every warehouse line; skip null-batch for other batch products when all?
            // Keep every warehouse row as-is for "all".

            $name = (string) $stock->name;
            $code = (string) $stock->code;
            $extra = str_replace(',', '/', (string) ($stock->imei_number ?? ''));

            if ($variantId) {
                $pv = ProductVariant::select('id', 'item_code', 'variant_id')
                    ->FindExactProduct((int) $stock->product_id, $variantId)
                    ->first();
                $variantName = Variant::find($variantId)?->name ?? '';
                if ($pv?->item_code) {
                    $code = $pv->item_code;
                }
                if ($variantName) {
                    $name = $name . ' (' . $variantName . ')';
                    $extra = trim(($extra ? $extra . ' / ' : '') . 'Variant: ' . $variantName);
                }
            } elseif ($batchId) {
                $batch = ProductBatch::find($batchId);
                $batchNo = $batch?->batch_no ?? (string) $batchId;
                $extra = 'Batch: ' . $batchNo;
                if ($batch?->expired_date) {
                    $extra .= ' / Exp: ' . date('Y-m-d', strtotime($batch->expired_date));
                }
            }

            $rows[] = [
                'name' => $name,
                'code' => $code,
                'extra' => $extra,
                'product_id' => (int) $stock->product_id,
                'variant_id' => $variantId,
                'product_batch_id' => $batchId,
                'qty' => (float) $stock->qty,
            ];
        }

        return $rows;
    }

    public function finalize(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $ext = pathinfo($request->file('final_file')->getClientOriginalName(), PATHINFO_EXTENSION);
        if (strtolower($ext) !== 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Please upload a CSV file')], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }

        $data = $request->all();
        $document = $request->final_file;
        $documentName = date('Ymd') . '-' . date('his') . '.csv';
        $document->move(public_path('stock_count/'), $documentName);
        $data['final_file'] = $documentName;
        $lims_stock_count_data = StockCount::find($data['stock_count_id']);
        $lims_stock_count_data->update($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Stock Count finalized successfully!'),
                'id' => $lims_stock_count_data->id,
                'final_file_url' => url('stock_count/' . $documentName),
            ]);
        }

        return redirect()->back()->with('message', __('db.Stock Count finalized successfully!'));
    }

    public function stockDif(Request $request, $id)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            abort(403);
        }

        $result = $this->buildStockDifference($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $result);
        }

        return [
            $result['products'],
            $result['expected'],
            $result['counted'],
            $result['difference'],
            $result['cost'],
            $result['is_adjusted'],
        ];
    }

    private function buildStockDifference($id): array
    {
        $lims_stock_count_data = StockCount::findOrFail($id);
        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_path = public_path('stock_count/') . $lims_stock_count_data->final_file;

        $product = [];
        $expected = [];
        $counted = [];
        $difference = [];
        $cost = [];

        if (!$lims_stock_count_data->final_file || !file_exists($file_path)) {
            return [
                'products' => [],
                'expected' => [],
                'counted' => [],
                'difference' => [],
                'cost' => [],
                'is_adjusted' => (bool) $lims_stock_count_data->is_adjusted,
            ];
        }

        $file_handle = fopen($file_path, 'r');
        $i = 0;
        $hasDifference = false;

        while (($current_line = fgetcsv($file_handle)) !== false) {
            if ($i === 0) {
                $i++;
                continue;
            }

            if (!isset($current_line[1])) {
                continue;
            }

            $resolved = $this->resolveCsvStockLine($warehouse_id, $current_line);
            if (!$resolved) {
                continue;
            }

            $expected_qty = (float) ($resolved['qty'] ?? 0);
            $counted_qty = 0;

            if (isset($current_line[3])) {
                $csvQty = str_replace(',', '', trim($current_line[3]));
                if (is_numeric($csvQty)) {
                    $counted_qty = (float) $csvQty;
                }
            }

            $diff = $counted_qty - $expected_qty;

            if ($diff != 0) {
                $hasDifference = true;
            }

            $label = $current_line[0] . ' [' . $resolved['display_code'] . ']';
            if (!empty($resolved['extra_label'])) {
                $label .= ' — ' . $resolved['extra_label'];
            }

            $product[] = $label;
            $expected[] = $expected_qty;
            $counted[] = $counted_qty;
            $difference[] = $diff;
            $cost[] = $diff * (float) $resolved['cost'];
            $i++;
        }

        fclose($file_handle);

        if (!$hasDifference) {
            $lims_stock_count_data->is_adjusted = true;
            $lims_stock_count_data->save();
        }

        return [
            'products' => $product,
            'expected' => $expected,
            'counted' => $counted,
            'difference' => $difference,
            'cost' => $cost,
            'is_adjusted' => (bool) $lims_stock_count_data->fresh()->is_adjusted,
        ];
    }

    /**
     * Resolve a CSV row (name, code, extra, counted) to warehouse stock.
     *
     * @return array{product_id:int,display_code:string,qty:float,cost:float,extra_label:string,variant_id:?int,product_batch_id:?int}|null
     */
    private function resolveCsvStockLine(int $warehouseId, array $line): ?array
    {
        $code = trim((string) ($line[1] ?? ''));
        $extra = trim((string) ($line[2] ?? ''));
        if ($code === '') {
            return null;
        }

        $batchNo = null;
        if (preg_match('/Batch:\s*([^\/]+)/i', $extra, $m)) {
            $batchNo = trim($m[1]);
        }

        // Variant item_code first
        $productVariant = ProductVariant::where('item_code', $code)->first();
        if ($productVariant) {
            $product = Product::select('id', 'code', 'cost')->find($productVariant->product_id);
            if (!$product) {
                return null;
            }
            $stock = Product_Warehouse::where([
                ['warehouse_id', $warehouseId],
                ['product_id', $product->id],
                ['variant_id', $productVariant->variant_id],
            ])->first();

            return [
                'product_id' => (int) $product->id,
                'display_code' => $code,
                'qty' => (float) ($stock->qty ?? 0),
                'cost' => (float) $product->cost,
                'extra_label' => $extra,
                'variant_id' => (int) $productVariant->variant_id,
                'product_batch_id' => null,
            ];
        }

        $product = Product::select('id', 'code', 'cost')
            ->where('code', $code)
            ->first();
        if (!$product) {
            $product = Product::select('id', 'code', 'cost')
                ->where('code', 'LIKE', "%{$code}%")
                ->first();
        }
        if (!$product) {
            return null;
        }

        $stockQuery = Product_Warehouse::where([
            ['warehouse_id', $warehouseId],
            ['product_id', $product->id],
        ]);

        $batchId = null;
        if ($batchNo !== null && $batchNo !== '') {
            $batch = ProductBatch::where('product_id', $product->id)
                ->where('batch_no', $batchNo)
                ->first();
            if ($batch) {
                $batchId = (int) $batch->id;
                $stockQuery->where('product_batch_id', $batchId);
            }
        } else {
            $stockQuery->whereNull('variant_id');
        }

        $stock = $stockQuery->first();
        if (!$stock && $batchId === null) {
            $stock = Product_Warehouse::where([
                ['warehouse_id', $warehouseId],
                ['product_id', $product->id],
            ])->first();
        }

        return [
            'product_id' => (int) $product->id,
            'display_code' => $product->code,
            'qty' => (float) ($stock->qty ?? 0),
            'cost' => (float) $product->cost,
            'extra_label' => $extra,
            'variant_id' => $stock?->variant_id ? (int) $stock->variant_id : null,
            'product_batch_id' => $batchId ?? ($stock?->product_batch_id ? (int) $stock->product_batch_id : null),
        ];
    }

    public function adjustmentForm(Request $request, $id)
    {
        if (!$this->userCanAccessStockCount()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $lims_stock_count_data = StockCount::findOrFail($id);

        if (!$lims_stock_count_data->final_file) {
            return $this->spaJson($request, ['message' => __('db.Final file not found')], 404);
        }

        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_handle = fopen(public_path('stock_count/') . $lims_stock_count_data->final_file, 'r');
        $i = 0;
        $lines = [];

        while (($current_line = fgetcsv($file_handle)) !== false) {
            if ($i === 0) {
                $i++;
                continue;
            }
            if (!$current_line || !isset($current_line[1])) {
                $i++;
                continue;
            }

            $resolved = $this->resolveCsvStockLine($warehouse_id, $current_line);
            if (!$resolved) {
                $i++;
                continue;
            }

            $counted_qty = 0;
            if (isset($current_line[3])) {
                $csvQty = str_replace(',', '', trim($current_line[3]));
                if (is_numeric($csvQty)) {
                    $counted_qty = (float) $csvQty;
                }
            }

            $temp_qty = $counted_qty - (float) $resolved['qty'];
            if ($temp_qty < 0) {
                $qty = $temp_qty * (-1);
                $action = '-';
            } else {
                $qty = $temp_qty;
                $action = '+';
            }

            if ($qty == 0) {
                $i++;
                continue;
            }

            $lines[] = [
                'product_id' => $resolved['product_id'],
                'product_code' => $resolved['display_code'],
                'name' => $current_line[0],
                'qty' => (float) $qty,
                'action' => $action,
                'unit_cost' => 0,
                'variant_id' => $resolved['variant_id'],
                'product_batch_id' => $resolved['product_batch_id'],
            ];
            $i++;
        }
        fclose($file_handle);

        return $this->spaJson($request, [
            'stock_count_id' => $lims_stock_count_data->id,
            'reference_no' => $lims_stock_count_data->reference_no,
            'warehouse_id' => $warehouse_id,
            'lines' => $lines,
        ]);
    }

    public function qtyAdjustment($id)
    {
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_stock_count_data = StockCount::find($id);
        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_handle = fopen(public_path('stock_count/') . $lims_stock_count_data->final_file, 'r');
        $i = 0;
        $product_id = [];
        $names = [];
        $code = [];
        $qty = [];
        $action = [];

        while (!feof($file_handle)) {
            $current_line = fgetcsv($file_handle);
            if ($current_line && $i > 0) {
                $product_data = Product::select('id', 'code', 'qty')->where('code', $current_line[1])->first();
                $product_id[] = $product_data->id;
                $names[] = $current_line[0];
                $code[] = $current_line[1];

                $product_warehouse_data = Product_Warehouse::select('qty')->where([
                    'warehouse_id' => $warehouse_id,
                    'product_id' => $product_data->id,
                ])->first();

                if (isset($current_line[3])) {
                    $temp_qty = $current_line[3] - $product_warehouse_data->qty;
                } else {
                    $temp_qty = $product_warehouse_data->qty * (-1);
                }

                if ($temp_qty < 0) {
                    $qty[] = $temp_qty * (-1);
                    $action[] = '-';
                } else {
                    $qty[] = $temp_qty;
                    $action[] = '+';
                }
            }
            $i++;
        }

        return view('backend.stock_count.qty_adjustment', compact(
            'lims_warehouse_list',
            'warehouse_id',
            'id',
            'product_id',
            'names',
            'code',
            'qty',
            'action'
        ));
    }
}
