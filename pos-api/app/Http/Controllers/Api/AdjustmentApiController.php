<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Adjustment;
use App\Models\Product;
use App\Models\ProductAdjustment;
use App\Models\ProductVariant;
use App\Models\ProductWarehouse;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdjustmentApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Adjustment::with([
            'warehouse:id,name',
            'productAdjustments' => function ($relation) {
                $relation->select('id', 'adjustment_id', 'product_id', 'variant_id', 'qty', 'unit_cost', 'action')
                    ->with([
                        'product:id,name,code',
                        'productVariant:id,product_id,variant_id,item_code',
                    ]);
            },
        ]);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($inner) use ($search) {
                $inner->where('reference_no', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $adjustments = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $adjustments->getCollection()->map(function (Adjustment $adjustment) {
            $lines = $adjustment->productAdjustments->map(function (ProductAdjustment $line) {
                $productName = optional($line->product)->name;
                $code = $line->productVariant?->item_code ?? $line->product->code ?? null;

                return [
                    'id' => $line->id,
                    'product_id' => $line->product_id,
                    'variant_id' => $line->variant_id,
                    'product_name' => $productName,
                    'product_code' => $code,
                    'qty' => $line->qty,
                    'unit_cost' => $line->unit_cost,
                    'action' => $line->action,
                ];
            });

            $summary = $lines->map(function ($line) {
                $symbol = $line['action'] === '+' ? '+' : '-';
                $code = $line['product_code'] ?? '';

                return trim(sprintf(
                    '%s (%s) %s%s',
                    $line['product_name'] ?? __('db.product'),
                    $code,
                    $symbol,
                    number_format((float) $line['qty'], 2)
                ));
            })->implode(', ');

            return [
                'id' => $adjustment->id,
                'reference_no' => $adjustment->reference_no,
                'note' => $adjustment->note,
                'total_qty' => (float) ($adjustment->total_qty ?? $adjustment->productAdjustments->sum('qty')),
                'item' => (int) ($adjustment->item ?? $adjustment->productAdjustments->count()),
                'created_at' => $adjustment->created_at,
                'warehouse' => [
                    'id' => $adjustment->warehouse_id,
                    'name' => optional($adjustment->warehouse)->name,
                ],
                'product_summary' => $summary,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $adjustments->currentPage(),
                'per_page' => $adjustments->perPage(),
                'total' => $adjustments->total(),
                'last_page' => $adjustments->lastPage(),
            ],
        ]);
    }

    public function formData(): JsonResponse
    {
        $warehouses = Warehouse::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'warehouses' => $warehouses,
        ]);
    }

    public function warehouseProducts(Warehouse $warehouse): JsonResponse
    {
        $payload = $this->buildWarehouseProductPayload($warehouse->id);

        return response()->json([
            'products' => $payload,
        ]);
    }

    public function productLookup(Request $request): JsonResponse
    {
        $code = $request->string('code')->trim();
        $warehouseId = $request->integer('warehouse_id');

        $productVariant = ProductVariant::where('item_code', $code)->first();
        if ($productVariant) {
            $product = Product::find($productVariant->product_id);
            if ($product) {
                $warehouseStock = ProductWarehouse::where([
                    'product_id' => $product->id,
                    'warehouse_id' => $warehouseId,
                    'variant_id' => $productVariant->variant_id,
                ])->first();

                return response()->json([
                    'product' => [
                        'product_id' => $product->id,
                        'variant_id' => $productVariant->variant_id,
                        'name' => $product->name,
                        'code' => $productVariant->item_code,
                        'qty' => optional($warehouseStock)->qty ?? 0,
                        'unit_cost' => $product->cost,
                    ],
                ]);
            }
        }

        $product = Product::where('code', $code)->first();
        if ($product) {
            $warehouseStock = ProductWarehouse::where([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
            ])->first();

            return response()->json([
                'product' => [
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'name' => $product->name,
                    'code' => $product->code,
                    'qty' => optional($warehouseStock)->qty ?? 0,
                    'unit_cost' => $product->cost,
                ],
            ]);
        }

        return response()->json([
            'product' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $adjustment = DB::transaction(function () use ($validated, $request) {
            $documentName = null;
            if ($request->hasFile('document')) {
                $documentName = $this->storeDocument($request->file('document'));
            }

            /** @var Adjustment $adjustment */
            $adjustment = Adjustment::create([
                'reference_no' => 'adr-' . date('Ymd') . '-' . date('His'),
                'warehouse_id' => $validated['warehouse_id'],
                'note' => $validated['note'],
                'document' => $documentName,
                'total_qty' => $validated['items']->sum('qty'),
                'item' => $validated['items']->count(),
            ]);

            $this->applyItems($adjustment, $validated['items'], false);

            return $adjustment;
        });

        $adjustment->load('warehouse:id,name', 'productAdjustments');

        return response()->json([
            'message' => __('db.Data inserted successfully'),
            'data' => $this->serializeAdjustment($adjustment),
        ], 201);
    }

    public function show(Adjustment $adjustment): JsonResponse
    {
        $adjustment->load([
            'warehouse:id,name',
            'productAdjustments' => function ($relation) use ($adjustment) {
                $relation->with([
                    'product:id,name,code',
                    'productVariant:id,product_id,variant_id,item_code',
                ]);
            },
        ]);

        $items = $adjustment->productAdjustments->map(function (ProductAdjustment $line) use ($adjustment) {
            $product = $line->product;
            $variant = $line->productVariant;

            $warehouseStockQuery = ProductWarehouse::where([
                'product_id' => $line->product_id,
                'warehouse_id' => $adjustment->warehouse_id,
            ]);

            if ($line->variant_id) {
                $warehouseStockQuery->where('variant_id', $line->variant_id);
            }

            $warehouseStock = $warehouseStockQuery->first();

            return [
                'id' => $line->id,
                'product_id' => $line->product_id,
                'variant_id' => $line->variant_id,
                'product_name' => $product->name ?? null,
                'product_code' => $variant?->item_code ?? $product->code ?? null,
                'qty' => $line->qty,
                'unit_cost' => $line->unit_cost,
                'action' => $line->action,
                'available_qty' => optional($warehouseStock)->qty ?? 0,
            ];
        });

        return response()->json([
            'data' => [
                'id' => $adjustment->id,
                'reference_no' => $adjustment->reference_no,
                'note' => $adjustment->note,
                'total_qty' => (float) ($adjustment->total_qty ?? $items->sum('qty')),
                'item' => (int) ($adjustment->item ?? $items->count()),
                'created_at' => $adjustment->created_at,
                'warehouse' => [
                    'id' => $adjustment->warehouse_id,
                    'name' => optional($adjustment->warehouse)->name,
                ],
                'document' => $adjustment->document,
                'document_url' => $adjustment->document ? asset('documents/adjustment/' . $adjustment->document) : null,
                'items' => $items,
            ],
        ]);
    }

    public function update(Request $request, Adjustment $adjustment): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $adjustment = DB::transaction(function () use ($validated, $request, $adjustment) {
            $adjustment->load('productAdjustments');
            $this->revertStock($adjustment);
            $adjustment->productAdjustments()->delete();

            if ($request->hasFile('document')) {
                $this->deleteDocument($adjustment->document);
                $adjustment->document = $this->storeDocument($request->file('document'));
            }

            $adjustment->warehouse_id = $validated['warehouse_id'];
            $adjustment->note = $validated['note'];
            $adjustment->total_qty = $validated['items']->sum('qty');
            $adjustment->item = $validated['items']->count();
            $adjustment->save();

            $this->applyItems($adjustment, $validated['items'], false);

            return $adjustment;
        });

        $adjustment->load('warehouse:id,name', 'productAdjustments');

        return response()->json([
            'message' => __('db.Data updated successfully'),
            'data' => $this->serializeAdjustment($adjustment),
        ]);
    }

    public function destroy(Adjustment $adjustment): JsonResponse
    {
        DB::transaction(function () use ($adjustment) {
            $adjustment->load('productAdjustments');
            $this->revertStock($adjustment);
            $adjustment->productAdjustments()->delete();
            $this->deleteDocument($adjustment->document);
            $adjustment->delete();
        });

        return response()->json([
            'message' => __('db.Data deleted successfully'),
        ]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $ids = collect($request->input('ids', []))->filter()->values();

        DB::transaction(function () use ($ids) {
            Adjustment::whereIn('id', $ids)->get()->each(function (Adjustment $adjustment) {
                $adjustment->load('productAdjustments');
                $this->revertStock($adjustment);
                $adjustment->productAdjustments()->delete();
                $this->deleteDocument($adjustment->document);
                $adjustment->delete();
            });
        });

        return response()->json([
            'message' => __('db.Data deleted successfully'),
        ]);
    }

    /**
     * Validate the incoming payload.
     *
     * @return array{warehouse_id:int,note:?string,items:Collection<int,array{product_id:int,variant_id:?int,product_code:string,qty:float,unit_cost:float,action:string}>}
     */
    protected function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.product_code' => ['nullable', 'string'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.action' => ['required', Rule::in(['+', '-'])],
            'document' => ['nullable', 'file', 'mimes:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt'],
        ]);

        $items = collect($validated['items'])->map(function (array $item) {
            return [
                'product_id' => (int) $item['product_id'],
                'variant_id' => $item['variant_id'] !== null ? (int) $item['variant_id'] : null,
                'product_code' => $item['product_code'] ?? '',
                'qty' => (float) $item['qty'],
                'unit_cost' => isset($item['unit_cost']) ? (float) $item['unit_cost'] : 0,
                'action' => $item['action'],
            ];
        });

        return [
            'warehouse_id' => (int) $validated['warehouse_id'],
            'note' => $validated['note'] ?? null,
            'items' => $items,
        ];
    }

    /**
     * Apply the provided items to an adjustment.
     *
     * @param  Collection<int, array{product_id:int,variant_id:?int,product_code:string,qty:float,unit_cost:float,action:string}>  $items
     */
    protected function applyItems(Adjustment $adjustment, Collection $items, bool $isReversal): void
    {
        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);

            $variant = null;
            if ($product->is_variant) {
                if ($item['variant_id']) {
                    $variant = ProductVariant::where('product_id', $product->id)
                        ->where('variant_id', $item['variant_id'])
                        ->first();
                } elseif (!empty($item['product_code'])) {
                    $variant = ProductVariant::where('product_id', $product->id)
                        ->where('item_code', $item['product_code'])
                        ->first();
                }

                if (!$variant) {
                    throw new \RuntimeException(__('db.Invalid product variant selection'));
                }
            }

            $warehouseAttributes = [
                'product_id' => $product->id,
                'warehouse_id' => $adjustment->warehouse_id,
                'variant_id' => $variant?->variant_id,
            ];

            $warehouseStock = ProductWarehouse::firstOrCreate($warehouseAttributes, [
                'qty' => 0,
            ]);

            $action = $item['action'];
            $this->applyStockChange($product, $variant, $warehouseStock, $item['qty'], $action);

            if (!$isReversal) {
                ProductAdjustment::create([
                    'adjustment_id' => $adjustment->id,
                    'product_id' => $product->id,
                    'variant_id' => $variant?->variant_id,
                    'qty' => $item['qty'],
                    'unit_cost' => $item['unit_cost'],
                    'action' => $action,
                ]);
            }
        }
    }

    protected function revertStock(Adjustment $adjustment): void
    {
        foreach ($adjustment->productAdjustments as $line) {
            $product = Product::find($line->product_id);
            if (!$product) {
                continue;
            }

            $variant = null;
            if ($line->variant_id) {
                $variant = ProductVariant::where('product_id', $line->product_id)
                    ->where('variant_id', $line->variant_id)
                    ->first();
            }

            $warehouseQuery = ProductWarehouse::where([
                'product_id' => $line->product_id,
                'warehouse_id' => $adjustment->warehouse_id,
            ]);

            if ($line->variant_id) {
                $warehouseQuery->where('variant_id', $line->variant_id);
            }

            $warehouseStock = $warehouseQuery->first();

            if (!$warehouseStock) {
                $warehouseStock = ProductWarehouse::create([
                    'product_id' => $line->product_id,
                    'warehouse_id' => $adjustment->warehouse_id,
                    'variant_id' => $line->variant_id,
                    'qty' => 0,
                ]);
            }

            $inverseAction = $line->action === '+' ? '-' : '+';
            $this->applyStockChange($product, $variant, $warehouseStock, $line->qty, $inverseAction);
        }
    }

    protected function applyStockChange(
        Product $product,
        ?ProductVariant $variant,
        ProductWarehouse $warehouseStock,
        float $qty,
        string $action
    ): void {
        $sign = $action === '+' ? 1 : -1;

        $product->qty = ($product->qty ?? 0) + ($sign * $qty);
        $warehouseStock->qty = ($warehouseStock->qty ?? 0) + ($sign * $qty);

        if ($variant) {
            $variant->qty = ($variant->qty ?? 0) + ($sign * $qty);
            $variant->save();
        }

        $product->save();
        $warehouseStock->save();
    }

    protected function storeDocument(\Illuminate\Http\UploadedFile $file): string
    {
        $directory = public_path('documents/adjustment');
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = date('YmdHis') . '_' . uniqid('', true) . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return $filename;
    }

    protected function deleteDocument(?string $filename): void
    {
        if (!$filename) {
            return;
        }

        $path = public_path('documents/adjustment/' . $filename);
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    protected function serializeAdjustment(Adjustment $adjustment): array
    {
        $adjustment->loadMissing('warehouse:id,name');

        return [
            'id' => $adjustment->id,
            'reference_no' => $adjustment->reference_no,
            'note' => $adjustment->note,
            'total_qty' => (float) ($adjustment->total_qty ?? 0),
            'item' => (int) ($adjustment->item ?? 0),
            'created_at' => $adjustment->created_at,
            'warehouse' => [
                'id' => $adjustment->warehouse_id,
                'name' => optional($adjustment->warehouse)->name,
            ],
            'document' => $adjustment->document,
        ];
    }

    protected function buildWarehouseProductPayload(int $warehouseId): Collection
    {
        $purchaseSummary = DB::table('product_purchases')
            ->join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
            ->where('purchases.warehouse_id', $warehouseId)
            ->whereNull('purchases.deleted_at')
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

        $products = DB::table('products')
            ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->whereNull('products.is_variant')
            ->where('products.is_active', 1)
            ->where('product_warehouse.warehouse_id', $warehouseId)
            ->groupBy('products.id', 'products.code', 'products.name', 'products.cost')
            ->select(
                'products.id',
                'products.code',
                'products.name',
                'products.cost',
                DB::raw('SUM(product_warehouse.qty) as qty')
            )
            ->get()
            ->map(function ($product) use ($purchaseSummary) {
                $key = $product->id . '_0';
                $summary = $purchaseSummary[$key] ?? null;

                $cost = ($summary && $summary->total_qty > 0)
                    ? round($summary->total_cost / $summary->total_qty, 4)
                    : $product->cost;

                return [
                    'product_id' => $product->id,
                    'variant_id' => null,
                    'name' => $product->name,
                    'code' => $product->code,
                    'qty' => (float) $product->qty,
                    'unit_cost' => (float) $cost,
                ];
            });

        $variantProducts = DB::table('products')
            ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->join('product_variants', 'product_warehouse.variant_id', '=', 'product_variants.variant_id')
            ->whereNotNull('products.is_variant')
            ->where('products.is_active', 1)
            ->where('product_warehouse.warehouse_id', $warehouseId)
            ->groupBy(
                'products.id',
                'products.name',
                'products.cost',
                'product_variants.item_code',
                'product_variants.id',
                'product_variants.variant_id'
            )
            ->select(
                'products.id',
                'products.name',
                'products.cost',
                DB::raw('SUM(product_warehouse.qty) as qty'),
                'product_variants.item_code',
                'product_variants.variant_id'
            )
            ->get()
            ->map(function ($product) use ($purchaseSummary) {
                $key = $product->id . '_' . $product->variant_id;
                $summary = $purchaseSummary[$key] ?? null;

                $cost = ($summary && $summary->total_qty > 0)
                    ? round($summary->total_cost / $summary->total_qty, 4)
                    : $product->cost;

                return [
                    'product_id' => $product->id,
                    'variant_id' => $product->variant_id,
                    'name' => $product->name,
                    'code' => $product->item_code,
                    'qty' => (float) $product->qty,
                    'unit_cost' => (float) $cost,
                ];
            });

        return $products->concat($variantProducts)->values();
    }
}
