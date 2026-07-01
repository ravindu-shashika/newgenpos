<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Warehouse;
use App\Models\Product_Warehouse;
use App\Models\Product;
use App\Models\Adjustment;
use App\Models\ProductAdjustment;
use Illuminate\Support\Facades\DB;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\StockCount;
use App\Models\ProductVariant;
use App\Models\ProductBatch;
use App\Models\ProductPurchase;
use Auth;
use App\Traits\SpaResponse;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdjustmentController extends Controller
{
    use SpaResponse;

    protected function userCanAccessAdjustment(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return ($role && $role->hasPermissionTo('adjustment'))
            || $user->can('adjustment')
            || $user->can('adjustments.view')
            || $user->can('adjustments-index');
    }

    protected function adjustmentStoresBatchId(): bool
    {
        return Schema::hasColumn('product_adjustments', 'product_batch_id');
    }

    protected function warehouseBatchesForProduct(int $productId, int $warehouseId): array
    {
        $pwTable = Product_Warehouse::resolveTable();

        return DB::table($pwTable)
            ->join('product_batches', "{$pwTable}.product_batch_id", '=', 'product_batches.id')
            ->where("{$pwTable}.product_id", $productId)
            ->where("{$pwTable}.warehouse_id", $warehouseId)
            ->whereNotNull("{$pwTable}.product_batch_id")
            ->where("{$pwTable}.qty", '>', 0)
            ->orderBy('product_batches.expired_date')
            ->get([
                'product_batches.id',
                'product_batches.batch_no',
                'product_batches.expired_date',
                DB::raw("{$pwTable}.qty as warehouse_qty"),
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'batch_no' => $row->batch_no,
                'expired_date' => $row->expired_date,
                'qty' => (float) $row->warehouse_qty,
            ])
            ->values()
            ->all();
    }

    protected function findOrCreateProductBatch(int $productId, string $batchNo, ?string $expiredDate): ProductBatch
    {
        $batch = ProductBatch::where('product_id', $productId)
            ->where('batch_no', $batchNo)
            ->first();

        if ($batch) {
            if ($expiredDate) {
                $batch->expired_date = $expiredDate;
            }
            $batch->save();

            return $batch;
        }

        return ProductBatch::create([
            'product_id' => $productId,
            'batch_no' => $batchNo,
            'expired_date' => $expiredDate,
            'qty' => 0,
        ]);
    }

    protected function resolveBatchWarehouseRow(int $productId, int $warehouseId, int $productBatchId): Product_Warehouse
    {
        return Product_Warehouse::firstOrCreate(
            [
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'product_batch_id' => $productBatchId,
            ],
            ['qty' => 0]
        );
    }

    protected function resolveStandardWarehouseRow(int $productId, int $warehouseId): Product_Warehouse
    {
        $existing = Product_Warehouse::where([
            ['product_id', $productId],
            ['warehouse_id', $warehouseId],
        ])
            ->whereNull('variant_id')
            ->whereNull('product_batch_id')
            ->first();

        if ($existing) {
            return $existing;
        }

        return Product_Warehouse::create([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'qty' => 0,
        ]);
    }

    /**
     * @return array{warehouse: Product_Warehouse, product_batch_id: ?int}
     */
    protected function resolveAdjustmentWarehouseRow(
        Product $product,
        int $warehouseId,
        string $action,
        float $qty,
        ?string $batchNo,
        ?string $expiredDate,
        ?int $productBatchId
    ): array {
        if (!$product->is_batch || $product->is_variant) {
            return [
                'warehouse' => $this->resolveStandardWarehouseRow($product->id, $warehouseId),
                'product_batch_id' => null,
            ];
        }

        if ($action === '+') {
            if ($batchNo === null || trim($batchNo) === '' || $expiredDate === null || trim($expiredDate) === '') {
                throw new \InvalidArgumentException('Batch No and Expired Date are required for batch products.');
            }

            $batch = $this->findOrCreateProductBatch($product->id, trim($batchNo), trim($expiredDate));
            $batch->qty += $qty;
            $batch->save();

            return [
                'warehouse' => $this->resolveBatchWarehouseRow($product->id, $warehouseId, $batch->id),
                'product_batch_id' => $batch->id,
            ];
        }

        if (!$productBatchId) {
            throw new \InvalidArgumentException('Batch selection is required for batch products.');
        }

        $warehouse = Product_Warehouse::where([
            ['product_id', $product->id],
            ['warehouse_id', $warehouseId],
            ['product_batch_id', $productBatchId],
        ])->first();

        if (!$warehouse) {
            throw new \InvalidArgumentException('Batch stock not found in the selected warehouse.');
        }

        $batch = ProductBatch::find($productBatchId);
        if (!$batch) {
            throw new \InvalidArgumentException('Batch not found.');
        }

        $batch->qty -= $qty;
        $batch->save();

        return [
            'warehouse' => $warehouse,
            'product_batch_id' => $productBatchId,
        ];
    }

    protected function adjustmentLineKey(int $productId, ?int $variantId, ?int $productBatchId): string
    {
        return implode('_', [
            $productId,
            $variantId ?? 0,
            $productBatchId ?? 0,
        ]);
    }

    /**
     * @return array{variant_id: ?int, product_batch_id: ?int}
     */
    protected function resolveSubmittedAdjustmentLineMeta(
        int $productId,
        string $productCode,
        string $action,
        ?string $batchNo,
        ?int $productBatchId
    ): array {
        $product = Product::find($productId);
        if (!$product) {
            return ['variant_id' => null, 'product_batch_id' => null];
        }

        if ($product->is_variant) {
            $variant = ProductVariant::select('variant_id')
                ->FindExactProductWithCode($productId, $productCode)
                ->first();

            return [
                'variant_id' => $variant?->variant_id,
                'product_batch_id' => null,
            ];
        }

        if (!$product->is_batch) {
            return ['variant_id' => null, 'product_batch_id' => null];
        }

        if ($action === '-' && $productBatchId) {
            return ['variant_id' => null, 'product_batch_id' => $productBatchId];
        }

        if ($action === '+' && $batchNo !== null && trim($batchNo) !== '') {
            $batch = ProductBatch::where('product_id', $productId)
                ->where('batch_no', trim($batchNo))
                ->first();

            return ['variant_id' => null, 'product_batch_id' => $batch?->id];
        }

        return ['variant_id' => null, 'product_batch_id' => null];
    }

    protected function reverseProductAdjustmentLine(ProductAdjustment $line, int $warehouseId): void
    {
        $product = Product::find($line->product_id);
        if (!$product) {
            return;
        }

        $this->applyAdjustmentStockEffect(
            $product,
            $warehouseId,
            $line->variant_id,
            $this->adjustmentStoresBatchId() ? $line->product_batch_id : null,
            $line->action,
            (float) $line->qty,
            reverse: true
        );
    }

    protected function applyAdjustmentStockEffect(
        Product $product,
        int $warehouseId,
        ?int $variantId,
        ?int $productBatchId,
        string $action,
        float $qty,
        bool $reverse = false
    ): void {
        if ($qty == 0.0) {
            return;
        }

        $delta = $action === '+' ? $qty : -$qty;
        if ($reverse) {
            $delta *= -1;
        }

        $product->qty += $delta;
        $product->save();

        $warehouse = null;

        if ($variantId) {
            $variant = ProductVariant::select('id', 'qty')
                ->FindExactProduct($product->id, $variantId)
                ->first();
            if ($variant) {
                $variant->qty += $delta;
                $variant->save();
            }
            $warehouse = Product_Warehouse::where([
                ['product_id', $product->id],
                ['variant_id', $variantId],
                ['warehouse_id', $warehouseId],
            ])->first();
        } elseif ($product->is_batch && $productBatchId) {
            $batch = ProductBatch::find($productBatchId);
            if ($batch) {
                $batch->qty += $delta;
                $batch->save();
            }
            $warehouse = Product_Warehouse::where([
                ['product_id', $product->id],
                ['warehouse_id', $warehouseId],
                ['product_batch_id', $productBatchId],
            ])->first();
        } else {
            $warehouse = $this->resolveStandardWarehouseRow($product->id, $warehouseId);
        }

        if ($warehouse) {
            $warehouse->qty += $delta;
            $warehouse->save();
        }
    }

    /**
     * @return array{variant_id: ?int, product_batch_id: ?int}
     */
    protected function applyAdjustmentLineStock(
        Product $product,
        int $warehouseId,
        string $productCode,
        float $qty,
        string $action,
        ?string $batchNo = null,
        ?string $expiredDate = null,
        ?int $productBatchId = null
    ): array {
        $variantId = null;
        $lineBatchId = null;

        if ($product->is_variant) {
            $variant = ProductVariant::select('id', 'variant_id', 'qty')
                ->FindExactProductWithCode($product->id, $productCode)
                ->first();
            Product_Warehouse::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'variant_id' => $variant->variant_id,
                    'warehouse_id' => $warehouseId,
                ],
                ['qty' => 0]
            );
            if ($action === '-') {
                $variant->qty -= $qty;
            } else {
                $variant->qty += $qty;
            }
            $variant->save();
            $variantId = $variant->variant_id;
            $warehouse = Product_Warehouse::where([
                ['product_id', $product->id],
                ['variant_id', $variantId],
                ['warehouse_id', $warehouseId],
            ])->first();
        } else {
            $resolved = $this->resolveAdjustmentWarehouseRow(
                $product,
                $warehouseId,
                $action,
                $qty,
                $batchNo,
                $expiredDate,
                $productBatchId
            );
            $warehouse = $resolved['warehouse'];
            $lineBatchId = $resolved['product_batch_id'];
        }

        if ($action === '-') {
            $product->qty -= $qty;
            $warehouse->qty -= $qty;
        } else {
            $product->qty += $qty;
            $warehouse->qty += $qty;
        }
        $product->save();
        $warehouse->save();

        return [
            'variant_id' => $variantId,
            'product_batch_id' => $lineBatchId,
        ];
    }

    protected function findProductAdjustmentLine(
        int $adjustmentId,
        int $productId,
        ?int $variantId,
        ?int $productBatchId
    ): ?ProductAdjustment {
        $query = ProductAdjustment::where('adjustment_id', $adjustmentId)
            ->where('product_id', $productId);

        if ($variantId) {
            $query->where('variant_id', $variantId);
        } else {
            $query->whereNull('variant_id');
        }

        if ($this->adjustmentStoresBatchId()) {
            if ($productBatchId) {
                $query->where('product_batch_id', $productBatchId);
            } else {
                $query->whereNull('product_batch_id');
            }
        }

        return $query->first();
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessAdjustment()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_adjustment_all = Adjustment::orderBy('id', 'desc')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_adjustment_all->map(fn ($row) => $this->formatAdjustmentForSpa($row)),
            ]);
        }

        return view('backend.adjustment.index', compact('lims_adjustment_all'));
    }

    private function formatAdjustmentForSpa(Adjustment $adjustment): array
    {
        $warehouse = Warehouse::find($adjustment->warehouse_id);
        $productLines = [];

        foreach (ProductAdjustment::where('adjustment_id', $adjustment->id)->get() as $productAdjustment) {
            if ($productAdjustment->variant_id) {
                $product = Product::join('product_variants', 'products.id', '=', 'product_variants.product_id')
                    ->select('products.name', 'product_variants.item_code as code')
                    ->where([
                        ['products.id', $productAdjustment->product_id],
                        ['product_variants.id', $productAdjustment->variant_id],
                    ])
                    ->first();
            } else {
                $product = Product::select('name', 'code')->find($productAdjustment->product_id);
            }

            if ($product) {
                $productLines[] = [
                    'name' => $product->name,
                    'qty' => $productAdjustment->qty,
                    'unit_cost' => $productAdjustment->unit_cost,
                    'label' => "{$product->name} — {$productAdjustment->qty} x {$productAdjustment->unit_cost}",
                ];
            }
        }

        return [
            'id' => $adjustment->id,
            'date' => $adjustment->created_at->format('d-m-Y H:i:s'),
            'reference_no' => $adjustment->reference_no,
            'warehouse_id' => $adjustment->warehouse_id,
            'warehouse_name' => $warehouse->name ?? '',
            'products' => $productLines,
            'products_summary' => collect($productLines)->pluck('label')->join("\n"),
            'note' => $adjustment->note ?? '',
        ];
    }

    public function getProduct(Request $request, $warehouseId)
    {
        try {
            $pwTable = Product_Warehouse::resolveTable();

            $purchaseQuery = DB::table('product_purchases')
                ->join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                ->where('purchases.warehouse_id', $warehouseId);

            if (Schema::hasColumn('purchases', 'deleted_at')) {
                $purchaseQuery->whereNull('purchases.deleted_at');
            }

            $purchaseSummary = $purchaseQuery
                ->groupBy('product_purchases.product_id', 'product_purchases.variant_id')
                ->selectRaw('
                    product_purchases.product_id,
                    product_purchases.variant_id,
                    SUM(product_purchases.qty) AS total_qty,
                    SUM(product_purchases.total) AS total_cost
                ')
                ->get()
                ->keyBy(function ($row) {
                    return $row->product_id . '_' . ($row->variant_id ?? 0);
                });

            $strictPrevious = config('database.connections.mysql.strict');
            config()->set('database.connections.mysql.strict', false);
            DB::reconnect();

            $products = DB::table('products')
                ->join($pwTable, 'products.id', '=', "{$pwTable}.product_id")
                ->where(function ($q) {
                    $q->whereNull('products.is_variant')->orWhere('products.is_variant', 0);
                })
                ->where('products.is_active', 1)
                ->where("{$pwTable}.warehouse_id", $warehouseId)
                ->groupBy('products.id', 'products.code', 'products.name', 'products.cost')
                ->select(
                    'products.id',
                    'products.code',
                    'products.name',
                    'products.cost',
                    DB::raw("SUM({$pwTable}.qty) as qty")
                )
                ->get();

            $variantProducts = DB::table('products')
                ->join('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin($pwTable, function ($join) use ($pwTable, $warehouseId) {
                    $join->on('product_variants.product_id', '=', "{$pwTable}.product_id")
                        ->on('product_variants.variant_id', '=', "{$pwTable}.variant_id")
                        ->where("{$pwTable}.warehouse_id", '=', $warehouseId);
                })
                ->where('products.is_variant', 1)
                ->where('products.is_active', 1)
                ->groupBy(
                    'products.id',
                    'products.name',
                    'products.cost',
                    'product_variants.item_code',
                    'product_variants.variant_id'
                )
                ->select(
                    'products.id',
                    'products.name',
                    'products.cost',
                    DB::raw("COALESCE(SUM({$pwTable}.qty), 0) as qty"),
                    'product_variants.item_code',
                    'product_variants.variant_id as variant_id'
                )
                ->get();

            config()->set('database.connections.mysql.strict', $strictPrevious);
            DB::reconnect();

            $product_code = [];
            $product_name = [];
            $product_qty = [];
            $product_cost = [];

            foreach ($products as $p) {
                $key = $p->id . '_0';
                $summary = $purchaseSummary[$key] ?? null;

                $cost = ($summary && $summary->total_qty > 0)
                    ? round($summary->total_cost / $summary->total_qty, 4)
                    : $p->cost;

                $product_code[] = $p->code;
                $product_name[] = $p->name;
                $product_qty[] = $p->qty;
                $product_cost[] = $cost;
            }

            foreach ($variantProducts as $p) {
                $key = $p->id . '_' . $p->variant_id;
                $summary = $purchaseSummary[$key] ?? null;

                $cost = ($summary && $summary->total_qty > 0)
                    ? round($summary->total_cost / $summary->total_qty, 4)
                    : $p->cost;

                $product_code[] = $p->item_code;
                $product_name[] = $p->name;
                $product_qty[] = $p->qty;
                $product_cost[] = $cost;
            }

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'product_code' => $product_code,
                    'product_name' => $product_name,
                    'product_qty' => $product_qty,
                    'unit_cost' => $product_cost,
                ]);
            }

            return [$product_code, $product_name, $product_qty, $product_cost];
        } catch (\Throwable $e) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Failed to load warehouse products'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }

            throw $e;
        }
    }

    public function limsProductSearch(Request $request)
    {
        $product_code = explode("(", $request['data']);
        $product_info = explode("|", $request['data']);
        $product_code[0] = rtrim($product_code[0], " ");

        //return $product_info;
        $lims_product_data = Product::where([
            ['code', $product_code[0]],
            ['is_active', true]
        ])->first();
        if(!$lims_product_data) {
            $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
                ->select('products.id', 'products.name', 'products.is_variant', 'product_variants.id as product_variant_id', 'product_variants.item_code')
                ->where([
                    ['product_variants.item_code', $product_code[0]],
                    ['products.is_active', true]
                ])->first();
        }

        if (!$lims_product_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
            }

            return [];
        }

        $product[] = $lims_product_data->name;
        $product_variant_id = null;
        if($lims_product_data->is_variant) {
            $product[] = $lims_product_data->item_code;
            $product_variant_id = $lims_product_data->product_variant_id;
        }
        else
            $product[] = $lims_product_data->code;

        $product[] = $lims_product_data->id;
        $product[] = $product_variant_id;
        $product[] = $product_info[1];
        $quantity = explode("|", $request['data']);
        if (count($quantity) >= 3) {
            $product[] =  $quantity[2];
        }

        if ($this->wantsSpaResponse($request)) {
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $payload = [
                'data' => $product,
                'is_batch' => (bool) ($lims_product_data->is_batch ?? false),
                'batches' => [],
            ];
            if ($payload['is_batch'] && $warehouseId) {
                $payload['batches'] = $this->warehouseBatchesForProduct(
                    (int) $lims_product_data->id,
                    $warehouseId
                );
            }

            return $this->spaJson($request, $payload);
        }

        return $product;
    }

    // public function limsProductSearch(Request $request)
    // {
    //     $product_code = explode("|", $request['data']);
    //     $product_code[0] = rtrim($product_code[0], " ");
    //     $lims_product_data = Product::where([
    //                             ['code', $product_code[0]],
    //                             ['is_active', true]
    //                         ])
    //                         ->whereNull('is_variant')
    //                         ->first();
    //     if(!$lims_product_data) {
    //         $lims_product_data = Product::where([
    //                             ['name', $product_code[1]],
    //                             ['is_active', true]
    //                         ])
    //                         ->whereNotNull(['is_variant'])
    //                         ->first();
    //         $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
    //             ->where([
    //                 ['product_variants.item_code', $product_code[0]],
    //                 ['products.is_active', true]
    //             ])
    //             ->whereNotNull('is_variant')
    //             ->select('products.*', 'product_variants.item_code', 'product_variants.additional_cost')
    //             ->first();
    //         $lims_product_data->cost += $lims_product_data->additional_cost;
    //     }
    //     $product[] = $lims_product_data->name;
    //     if($lims_product_data->is_variant)
    //         $product[] = $lims_product_data->item_code;
    //     else
    //         $product[] = $lims_product_data->code;
    //     $product[] = $lims_product_data->cost;

    //     if ($lims_product_data->tax_id) {
    //         $lims_tax_data = Tax::find($lims_product_data->tax_id);
    //         $product[] = $lims_tax_data->rate;
    //         $product[] = $lims_tax_data->name;
    //     } else {
    //         $product[] = 0;
    //         $product[] = 'No Tax';
    //     }
    //     $product[] = $lims_product_data->tax_method;

    //     $units = Unit::where("base_unit", $lims_product_data->unit_id)
    //                 ->orWhere('id', $lims_product_data->unit_id)
    //                 ->get();
    //     $unit_name = array();
    //     $unit_operator = array();
    //     $unit_operation_value = array();
    //     foreach ($units as $unit) {
    //         if ($lims_product_data->purchase_unit_id == $unit->id) {
    //             array_unshift($unit_name, $unit->unit_name);
    //             array_unshift($unit_operator, $unit->operator);
    //             array_unshift($unit_operation_value, $unit->operation_value);
    //         } else {
    //             $unit_name[]  = $unit->unit_name;
    //             $unit_operator[] = $unit->operator;
    //             $unit_operation_value[] = $unit->operation_value;
    //         }
    //     }

    //     $product[] = implode(",", $unit_name) . ',';
    //     $product[] = implode(",", $unit_operator) . ',';
    //     $product[] = implode(",", $unit_operation_value) . ',';
    //     $product[] = $lims_product_data->id;
    //     $product[] = $lims_product_data->is_batch;
    //     $product[] = $lims_product_data->is_imei;
    //     // return dd($product);
    //     return $product;
    // }

    public function create(Request $request)
    {
        if (!$this->userCanAccessAdjustment()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'warehouses' => $lims_warehouse_list->map(fn ($w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                ]),
            ]);
        }

        $lims_product_list_without_variant = $this->productWithoutVariant();
        $lims_product_list_with_variant = $this->productWithVariant();

        return view('backend.adjustment.create', compact('lims_warehouse_list', 'lims_product_list_without_variant', 'lims_product_list_with_variant'));
    }

    public function productWithoutVariant()
    {
        return Product::ActiveStandard()->select('id', 'name', 'code')
                ->whereNull('is_variant')->get();
    }

    public function productWithVariant()
    {
        return Product::join('product_variants', 'products.id', 'product_variants.product_id')
            ->ActiveStandard()
            ->whereNotNull('is_variant')
            ->select('products.id', 'products.name', 'product_variants.item_code')
            ->orderBy('position')
            ->get();
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessAdjustment()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        try{
            DB::beginTransaction();
            $data = $request->except('document');
            //return $data;
            if( isset($data['stock_count_id']) ){
                $lims_stock_count_data = StockCount::find($data['stock_count_id']);
                $lims_stock_count_data->is_adjusted = true;
                $lims_stock_count_data->save();
            }
            $data['reference_no'] = 'adr-' . date("Ymd") . '-'. date("his");
            $document = $request->document;
            if ($document) {
                $documentName = $document->getClientOriginalName();
                $document->move(public_path('documents/adjustment'), $documentName);
                $data['document'] = $documentName;
            }
            $lims_adjustment_data = Adjustment::create($data);

            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            if(isset($data['unit_cost']))
                $unit_cost = $data['unit_cost'];
            $action = $data['action'];
            $batch_no = $data['batch_no'] ?? [];
            $expired_date = $data['expired_date'] ?? [];
            $product_batch_id = $data['product_batch_id'] ?? [];

            foreach ($product_id as $key => $pro_id) {
                $lims_product_data = Product::find($pro_id);
                $lineMeta = $this->applyAdjustmentLineStock(
                    $lims_product_data,
                    (int) $data['warehouse_id'],
                    $product_code[$key],
                    (float) $qty[$key],
                    $action[$key],
                    $batch_no[$key] ?? null,
                    $expired_date[$key] ?? null,
                    !empty($product_batch_id[$key]) ? (int) $product_batch_id[$key] : null
                );

                $product_adjustment = [
                    'product_id' => $pro_id,
                    'variant_id' => $lineMeta['variant_id'],
                    'adjustment_id' => $lims_adjustment_data->id,
                    'qty' => $qty[$key],
                    'action' => $action[$key],
                ];
                if (isset($data['unit_cost'])) {
                    $product_adjustment['unit_cost'] = $unit_cost[$key];
                }
                if ($this->adjustmentStoresBatchId()) {
                    $product_adjustment['product_batch_id'] = $lineMeta['product_batch_id'];
                }
                ProductAdjustment::create($product_adjustment);
            }
            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Data inserted successfully'),
                    'id' => $lims_adjustment_data->id,
                    'reference_no' => $lims_adjustment_data->reference_no,
                ]);
            }

            return redirect('qty_adjustment')->with('message', __('db.Data inserted successfully'));
        }catch(\Throwable $e){
            DB::rollBack();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Someting Error Please try again'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 422);
            }

             return redirect('qty_adjustment')->with('not_permitted', __('db.Someting Error Please try again'));
        }
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccessAdjustment()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_adjustment_data = Adjustment::findOrFail($id);
        $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            $lines = [];

            foreach ($lims_product_adjustment_data as $productAdjustment) {
                $product = Product::find($productAdjustment->product_id);
                if (!$product) {
                    continue;
                }

                $productVariantId = null;
                $code = $product->code;

                if ($productAdjustment->variant_id) {
                    $productVariant = ProductVariant::select('id', 'item_code')
                        ->FindExactProduct($productAdjustment->product_id, $productAdjustment->variant_id)
                        ->first();
                    if ($productVariant) {
                        $code = $productVariant->item_code;
                        $productVariantId = $productVariant->id;
                    }
                }

                $warehouseQuery = Product_Warehouse::where([
                    ['product_id', $productAdjustment->product_id],
                    ['warehouse_id', $lims_adjustment_data->warehouse_id],
                ]);
                if ($productAdjustment->variant_id) {
                    $warehouseQuery->where('variant_id', $productAdjustment->variant_id);
                } elseif ($this->adjustmentStoresBatchId() && $productAdjustment->product_batch_id) {
                    $warehouseQuery->where('product_batch_id', $productAdjustment->product_batch_id);
                }
                $availableQty = $warehouseQuery->value('qty') ?? 0;

                $batchNo = '';
                $expiredDate = '';
                $isBatch = (bool) ($product->is_batch ?? false);
                if ($this->adjustmentStoresBatchId() && $productAdjustment->product_batch_id) {
                    $batch = ProductBatch::find($productAdjustment->product_batch_id);
                    $batchNo = $batch->batch_no ?? '';
                    $expiredDate = $batch->expired_date ?? '';
                }

                $lines[] = [
                    'product_id' => $productAdjustment->product_id,
                    'product_code' => $code,
                    'name' => $product->name,
                    'unit_cost' => $productAdjustment->unit_cost,
                    'available_qty' => (float) $availableQty,
                    'adjustment_qty' => (float) $productAdjustment->qty,
                    'action' => $productAdjustment->action,
                    'variant_id' => $productAdjustment->variant_id,
                    'product_variant_id' => $productVariantId,
                    'is_batch' => $isBatch,
                    'product_batch_id' => $this->adjustmentStoresBatchId()
                        ? ($productAdjustment->product_batch_id ?? null)
                        : null,
                    'batch_no' => $batchNo,
                    'expired_date' => $expiredDate,
                    'batches' => $isBatch
                        ? $this->warehouseBatchesForProduct(
                            (int) $productAdjustment->product_id,
                            (int) $lims_adjustment_data->warehouse_id
                        )
                        : [],
                ];
            }

            return $this->spaJson($request, [
                'adjustment' => [
                    'id' => $lims_adjustment_data->id,
                    'reference_no' => $lims_adjustment_data->reference_no,
                    'warehouse_id' => $lims_adjustment_data->warehouse_id,
                    'note' => $lims_adjustment_data->note ?? '',
                ],
                'warehouses' => $lims_warehouse_list->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ]),
                'lines' => $lines,
            ]);
        }

        return view('backend.adjustment.edit', compact('lims_adjustment_data', 'lims_warehouse_list', 'lims_product_adjustment_data'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessAdjustment()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        try{
            DB::beginTransaction();
            $data = $request->except([
                'document',
                'product_id',
                'product_variant_id',
                'product_code',
                'qty',
                'unit_cost',
                'action',
                'batch_no',
                'expired_date',
                'product_batch_id',
                '_method',
            ]);
                $lims_adjustment_data = Adjustment::find($id);

                $document = $request->document;
                if ($document) {
                    $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

                    $documentName = $document->getClientOriginalName();
                    $document->move(public_path('documents/adjustment'), $documentName);
                    $data['document'] = $documentName;
                }

                $lims_adjustment_data = Adjustment::find($id);
                $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();

                $product_id = $request->input('product_id', []);
                $product_variant_id = $request->input('product_variant_id', []);
                $product_code = $request->input('product_code', []);
                $qty = $request->input('qty', []);
                $unit_cost = $request->input('unit_cost', []);
                $action = $request->input('action', []);
                $batch_no = $request->input('batch_no', []);
                $expired_date = $request->input('expired_date', []);
                $product_batch_id = $request->input('product_batch_id', []);

                if (!is_array($product_id) || $product_id === []) {
                    throw new \InvalidArgumentException('product_id is required');
                }

                $warehouseId = (int) $data['warehouse_id'];
                $submittedKeys = [];
                foreach ($product_id as $key => $pro_id) {
                    $meta = $this->resolveSubmittedAdjustmentLineMeta(
                        (int) $pro_id,
                        (string) ($product_code[$key] ?? ''),
                        (string) ($action[$key] ?? '-'),
                        $batch_no[$key] ?? null,
                        !empty($product_batch_id[$key]) ? (int) $product_batch_id[$key] : null
                    );
                    $submittedKeys[$this->adjustmentLineKey(
                        (int) $pro_id,
                        $meta['variant_id'],
                        $meta['product_batch_id']
                    )] = $key;
                }

                foreach ($lims_product_adjustment_data as $product_adjustment_data) {
                    $lineKey = $this->adjustmentLineKey(
                        (int) $product_adjustment_data->product_id,
                        $product_adjustment_data->variant_id,
                        $this->adjustmentStoresBatchId()
                            ? $product_adjustment_data->product_batch_id
                            : null
                    );

                    if (!isset($submittedKeys[$lineKey])) {
                        $this->reverseProductAdjustmentLine(
                            $product_adjustment_data,
                            $warehouseId
                        );
                        $product_adjustment_data->markDeleted();
                    }
                }

                foreach ($product_id as $key => $pro_id) {
                    $delta = (float) ($qty[$key] ?? 0);
                    $lineAction = (string) ($action[$key] ?? '-');
                    $lims_product_data = Product::find($pro_id);
                    if (!$lims_product_data) {
                        continue;
                    }

                    $submittedMeta = $this->resolveSubmittedAdjustmentLineMeta(
                        (int) $pro_id,
                        (string) ($product_code[$key] ?? ''),
                        $lineAction,
                        $batch_no[$key] ?? null,
                        !empty($product_batch_id[$key]) ? (int) $product_batch_id[$key] : null
                    );

                    $lineMeta = $submittedMeta;
                    if ($delta != 0.0) {
                        $lineMeta = $this->applyAdjustmentLineStock(
                            $lims_product_data,
                            $warehouseId,
                            (string) ($product_code[$key] ?? ''),
                            $delta,
                            $lineAction,
                            $batch_no[$key] ?? null,
                            $expired_date[$key] ?? null,
                            !empty($product_batch_id[$key]) ? (int) $product_batch_id[$key] : null
                        );
                    }

                    $existing = $this->findProductAdjustmentLine(
                        (int) $id,
                        (int) $pro_id,
                        $lineMeta['variant_id'],
                        $lineMeta['product_batch_id']
                    );

                    if ($existing) {
                        if ($delta != 0.0) {
                            $existing->qty = (float) $existing->qty + $delta;
                        }
                        $existing->unit_cost = $unit_cost[$key] ?? $existing->unit_cost;
                        $existing->action = $lineAction;
                        if ($this->adjustmentStoresBatchId()) {
                            $existing->product_batch_id = $lineMeta['product_batch_id'];
                        }
                        $existing->save();
                        continue;
                    }

                    if ($delta == 0.0) {
                        continue;
                    }

                    $product_adjustment = [
                        'product_id' => $pro_id,
                        'variant_id' => $lineMeta['variant_id'],
                        'adjustment_id' => $id,
                        'qty' => $delta,
                        'unit_cost' => $unit_cost[$key] ?? 0,
                        'action' => $lineAction,
                    ];
                    if ($this->adjustmentStoresBatchId()) {
                        $product_adjustment['product_batch_id'] = $lineMeta['product_batch_id'];
                    }
                    ProductAdjustment::create($product_adjustment);
                }

                $lims_adjustment_data->update($data);
             DB::commit();

             if ($this->wantsSpaResponse($request)) {
                 return $this->spaJson($request, [
                     'message' => __('db.Data updated successfully'),
                     'id' => $lims_adjustment_data->id,
                 ]);
             }

             return redirect('qty_adjustment')->with('message', __('db.Data updated successfully'));
        }catch(\Throwable $e){
            DB::rollBack();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Someting Error Please try again'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 422);
            }

            return redirect('qty_adjustment')->with('not_permitted', __('db.Someting Error Please try again'));
        }
    }

    public function deleteBySelection(Request $request)
    {
        $adjustment_id = $request['adjustmentIdArray'];
        foreach ($adjustment_id as $id) {
            $lims_adjustment_data = Adjustment::find($id);
            $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

            $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
            foreach ($lims_product_adjustment_data as $product_adjustment_data) {
                $this->reverseProductAdjustmentLine(
                    $product_adjustment_data,
                    (int) $lims_adjustment_data->warehouse_id
                );
                $product_adjustment_data->markDeleted();
            }
            $lims_adjustment_data->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
        }

        return 'Data deleted successfully';
    }

    public function destroy(Request $request, $id)
    {
        $lims_adjustment_data = Adjustment::find($id);
        $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
        foreach ($lims_product_adjustment_data as $product_adjustment_data) {
            $this->reverseProductAdjustmentLine(
                $product_adjustment_data,
                (int) $lims_adjustment_data->warehouse_id
            );
            $product_adjustment_data->markDeleted();
        }
        $lims_adjustment_data->delete();
        $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
        }

        return redirect('qty_adjustment')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
