<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockCount;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockCountApiController extends Controller
{
    /**
     * Display a listing of the stock counts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeAccess($user);

        $query = StockCount::query()
            ->with(['user:id,name'])
            ->orderByDesc('created_at');

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->integer('warehouse_id'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim();
            $query->where(function ($inner) use ($search) {
                $inner->where('reference_no', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date('date_to'));
        }

        $generalSetting = DB::table('general_settings')->latest()->first();
        if (
            $user->role_id > 2 &&
            $generalSetting &&
            ($generalSetting->staff_access ?? '') === 'own'
        ) {
            $query->where('user_id', $user->id);
        }

        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $paginator = $query->paginate($perPage);

        $items = $paginator->getCollection()->map(function (StockCount $stockCount) {
            return $this->transformStockCount($stockCount);
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * Return dropdown options.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'warehouses' => Warehouse::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'categories' => Category::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'brands' => Brand::where('is_active', true)
                ->orderBy('title')
                ->get(['id', 'title']),
        ]);
    }

    /**
     * Store a newly created stock count.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeAccess($user);

        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'brand_ids' => ['nullable', 'array'],
            'brand_ids.*' => ['integer', 'exists:brands,id'],
        ]);

        $categoryIds = collect($validated['category_ids'] ?? [])
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values();

        $brandIds = collect($validated['brand_ids'] ?? [])
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->values();

        $type = ($categoryIds->isNotEmpty() || $brandIds->isNotEmpty()) ? 'partial' : 'full';

        $products = $this->fetchProductsForCount(
            (int) $validated['warehouse_id'],
            $categoryIds,
            $brandIds
        );

        if ($products->isEmpty()) {
            return response()->json([
                'message' => __('db.No product found!'),
            ], 422);
        }

        $filename = $this->generateInitialCsv($products);

        $stockCount = StockCount::create([
            'reference_no' => 'scr-' . date('Ymd') . '-' . date('His'),
            'warehouse_id' => (int) $validated['warehouse_id'],
            'category_id' => $categoryIds->isNotEmpty() ? $categoryIds->implode(',') : null,
            'brand_id' => $brandIds->isNotEmpty() ? $brandIds->implode(',') : null,
            'user_id' => $user->id,
            'type' => $type,
            'initial_file' => $filename,
            'is_adjusted' => false,
        ]);

        return response()->json([
            'message' => __('db.Stock Count created successfully! Please download the initial file to complete it'),
            'data' => $this->transformStockCount($stockCount),
            'initial_file_url' => asset('stock_count/' . $filename),
        ], 201);
    }

    /**
     * Display the specified stock count.
     */
    public function show(StockCount $stockCount): JsonResponse
    {
        $this->authorizeAccess(Auth::user());

        return response()->json([
            'data' => $this->transformStockCount($stockCount),
        ]);
    }

    /**
     * Finalize a stock count by uploading the counted CSV.
     */
    public function finalize(Request $request, StockCount $stockCount): JsonResponse
    {
        $this->authorizeAccess($request->user());

        $validated = $request->validate([
            'final_file' => ['required', 'file', 'mimes:csv', 'max:5120'],
            'note' => ['nullable', 'string'],
        ]);

        $documentName = date('Ymd') . '-' . date('His') . '.csv';
        $request->file('final_file')->move(public_path('stock_count/'), $documentName);

        $stockCount->final_file = $documentName;
        $stockCount->note = $validated['note'] ?? $stockCount->note;
        $stockCount->save();

        return response()->json([
            'message' => __('db.Stock Count finalized successfully!'),
            'data' => $this->transformStockCount($stockCount),
            'final_file_url' => asset('stock_count/' . $documentName),
        ]);
    }

    /**
     * Return difference data for a finalized stock count.
     */
    public function difference(StockCount $stockCount): JsonResponse
    {
        $this->authorizeAccess(Auth::user());

        if (!$stockCount->final_file) {
            return response()->json([
                'message' => __('db.Please finalize the stock count first.'),
            ], 422);
        }

        $differences = $this->calculateDifferences($stockCount);

        return response()->json([
            'data' => $differences,
        ]);
    }

    /**
     * Provide adjustment suggestion data for a stock count.
     */
    public function adjustmentData(StockCount $stockCount): JsonResponse
    {
        $this->authorizeAccess(Auth::user());

        if (!$stockCount->final_file) {
            return response()->json([
                'message' => __('db.Please finalize the stock count first.'),
            ], 422);
        }

        $differences = $this->calculateDifferences($stockCount);

        $items = collect($differences['rows'] ?? [])
            ->filter(fn ($row) => isset($row['difference']) && (float) $row['difference'] !== 0.0)
            ->map(function (array $row) {
                $product = Product::where('code', $row['code'])->first();

                if (!$product) {
                    $product = Product::where('code', 'LIKE', '%' . $row['code'] . '%')->first();
                }

                if (!$product) {
                    return null;
                }

                $variant = ProductVariant::where('product_id', $product->id)
                    ->where('item_code', $row['code'])
                    ->first();

                $difference = (float) $row['difference'];
                $action = $difference >= 0 ? '+' : '-';
                $qty = abs($difference);

                return [
                    'product_id' => $product->id,
                    'variant_id' => $variant?->variant_id,
                    'name' => $row['name'],
                    'code' => $row['code'],
                    'qty' => $qty,
                    'action' => $action,
                    'unit_cost' => 0,
                    'available_qty' => (float) $row['expected'],
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'warehouse_id' => $stockCount->warehouse_id,
            'items' => $items,
        ]);
    }

    /**
     * Delete a stock count record (and associated files).
     */
    public function destroy(StockCount $stockCount): JsonResponse
    {
        $this->authorizeAccess(Auth::user());

        $this->deleteFileIfExists($stockCount->initial_file);
        $this->deleteFileIfExists($stockCount->final_file);

        $stockCount->delete();

        return response()->json([
            'message' => __('db.Data deleted successfully'),
        ]);
    }

    /**
     * Ensure the current user has permission to manage stock counts.
     */
    protected function authorizeAccess($user): void
    {
        if (!$user || !$user->can('stock_count')) {
            abort(403, __("db.Sorry! You are not allowed to access this module"));
        }
    }

    /**
     * Transform a stock count model into response data.
     */
    protected function transformStockCount(StockCount $stockCount): array
    {
        $warehouse = Warehouse::find($stockCount->warehouse_id);

        $categoryNames = collect(explode(',', (string) $stockCount->category_id))
            ->filter()
            ->map(function ($id) {
                return optional(Category::find((int) $id))->name;
            })
            ->filter()
            ->values();

        $brandNames = collect(explode(',', (string) $stockCount->brand_id))
            ->filter()
            ->map(function ($id) {
                return optional(Brand::find((int) $id))->title;
            })
            ->filter()
            ->values();

        return [
            'id' => $stockCount->id,
            'reference_no' => $stockCount->reference_no,
            'warehouse' => [
                'id' => $warehouse?->id,
                'name' => $warehouse?->name,
            ],
            'type' => $stockCount->type,
            'categories' => $categoryNames,
            'brands' => $brandNames,
            'initial_file' => $stockCount->initial_file,
            'initial_file_url' => $stockCount->initial_file ? asset('stock_count/' . $stockCount->initial_file) : null,
            'final_file' => $stockCount->final_file,
            'final_file_url' => $stockCount->final_file ? asset('stock_count/' . $stockCount->final_file) : null,
            'note' => $stockCount->note,
            'is_adjusted' => (bool) $stockCount->is_adjusted,
            'created_at' => $stockCount->created_at,
        ];
    }

    /**
     * Fetch products for a stock count request.
     *
     * @param  Collection<int,int>  $categoryIds
     * @param  Collection<int,int>  $brandIds
     */
    protected function fetchProductsForCount(int $warehouseId, Collection $categoryIds, Collection $brandIds): Collection
    {
        $query = DB::table('products')
            ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->where('products.is_active', true)
            ->where('product_warehouse.warehouse_id', $warehouseId)
            ->select(
                'products.id',
                'products.name',
                'products.code',
                'product_warehouse.imei_number',
                'product_warehouse.qty'
            );

        if ($categoryIds->isNotEmpty()) {
            $query->whereIn('products.category_id', $categoryIds);
        }

        if ($brandIds->isNotEmpty()) {
            $query->whereIn('products.brand_id', $brandIds);
        }

        return collect($query->get());
    }

    /**
     * Generate the initial CSV file and return its filename.
     */
    protected function generateInitialCsv(Collection $products): string
    {
        $directory = public_path('stock_count');
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $filename = date('Ymd') . '-' . date('His') . '.csv';
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        $file = fopen($path, 'w+');
        fputcsv($file, ['Product Name', 'Product Code', 'IMEI or Serial Numbers', 'Counted']);

        foreach ($products as $product) {
            fputcsv($file, [
                $product->name,
                $product->code,
                str_replace(',', '/', $product->imei_number),
                '',
            ]);
        }

        fclose($file);

        return $filename;
    }

    /**
     * Calculate difference data for a stock count.
     */
    protected function calculateDifferences(StockCount $stockCount): array
    {
        $filePath = public_path('stock_count/' . $stockCount->final_file);
        if (!file_exists($filePath)) {
            return [
                'rows' => [],
                'is_adjusted' => (bool) $stockCount->is_adjusted,
            ];
        }

        $handle = fopen($filePath, 'r');
        $rows = [];
        $line = 0;
        $hasDifference = false;

        while (!feof($handle)) {
            $current = fgetcsv($handle);
            if (!$current) {
                continue;
            }

            if ($line === 0) {
                $line++;
                continue;
            }

            [$name, $code, $imei, $counted] = array_pad($current, 4, null);
            $name = $name ?? '';
            $code = $code ?? '';

            if (!$code) {
                $line++;
                continue;
            }

            $product = Product::where('code', $code)->first();
            if (!$product) {
                $product = Product::where('code', 'LIKE', '%' . $code . '%')->first();
            }

            if (!$product) {
                $line++;
                continue;
            }

            $expected = (float) ($product->qty ?? 0);
            $countedQty = $counted !== null && $counted !== '' ? (float) $counted : 0;
            $difference = $counted !== null && $counted !== '' ? $countedQty - $expected : -$expected;
            $cost = ($product->cost ?? 0) * $difference;

            if (abs($difference) > 0.00001) {
                $hasDifference = true;
            }

            $rows[] = [
                'name' => $name . ' [' . $product->code . ']',
                'code' => $product->code,
                'expected' => $expected,
                'counted' => $counted !== null && $counted !== '' ? $countedQty : 0,
                'difference' => $difference,
                'cost' => $cost,
            ];

            $line++;
        }

        fclose($handle);

        if (!$hasDifference && !$stockCount->is_adjusted) {
            $stockCount->is_adjusted = true;
            $stockCount->save();
        }

        return [
            'headers' => [
                'date' => optional($stockCount->created_at)->toDateTimeString(),
                'reference_no' => $stockCount->reference_no,
                'warehouse_name' => optional(Warehouse::find($stockCount->warehouse_id))->name,
                'type' => $stockCount->type,
                'categories' => $this->mapIdListToNames($stockCount->category_id, Category::class, 'name'),
                'brands' => $this->mapIdListToNames($stockCount->brand_id, Brand::class, 'title'),
                'initial_file_url' => $stockCount->initial_file ? asset('stock_count/' . $stockCount->initial_file) : null,
                'final_file_url' => $stockCount->final_file ? asset('stock_count/' . $stockCount->final_file) : null,
                'stock_count_id' => $stockCount->id,
            ],
            'rows' => $rows,
            'is_adjusted' => (bool) $stockCount->is_adjusted,
        ];
    }

    /**
     * Map comma separated IDs into their names.
     *
     * @param  class-string  $model
     */
    protected function mapIdListToNames(?string $ids, string $model, string $column): array
    {
        return collect(explode(',', (string) $ids))
            ->filter()
            ->map(function ($id) use ($model, $column) {
                return optional($model::find((int) $id))->{$column};
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Delete a stock count file if it exists.
     */
    protected function deleteFileIfExists(?string $filename): void
    {
        if (!$filename) {
            return;
        }

        $path = public_path('stock_count/' . $filename);
        if (file_exists($path)) {
            @unlink($path);
        }
    }
}
