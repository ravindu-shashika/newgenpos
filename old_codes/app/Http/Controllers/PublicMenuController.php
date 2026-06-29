<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\GeneralSetting;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicMenuController extends Controller
{
    /**
     * Resolve a warehouse by its slug, or abort 404.
     */
    private function resolveWarehouse(string $slug): Warehouse
    {
        $warehouses = Warehouse::where('is_active', 1)->get();
        $warehouse  = $warehouses->first(function ($w) use ($slug) {
            return Str::slug($w->name) === $slug;
        });

        if (! $warehouse) {
            abort(404, 'Business not found.');
        }

        return $warehouse;
    }

    /**
     * Build the grouped variants_data structure expected by the front-end.
     * Applied to a single Product model instance.
     */
    private function buildVariantsData(Product $product): array
    {
        if (! $product->is_variant || $product->variant->isEmpty() || ! $product->variant_option) {
            return [];
        }

        $groups       = json_decode($product->variant_option, true) ?? [];
        $valueStrings = json_decode($product->variant_value,  true) ?? [];
        $pivotRows    = $product->variant->values(); // ordered by position
        $offset       = 0;
        $grouped      = [];

        foreach ($groups as $i => $groupLabel) {
            $optionNames = array_filter(
                array_map('trim', explode(',', $valueStrings[$i] ?? ''))
            );
            $options = [];
            foreach (array_values($optionNames) as $j => $optName) {
                $pv = $pivotRows->get($offset + $j);
                if (! $pv) {
                    continue;
                }
                $options[] = [
                    'id'               => $pv->pivot->id,
                    'name'             => $optName,
                    'additional_price' => (float) ($pv->pivot->additional_price ?? 0),
                ];
            }
            $offset += count($optionNames);
            if (count($options)) {
                $grouped[] = ['group' => $groupLabel, 'options' => $options];
            }
        }

        return $grouped;
    }

    // ─── Public page ─────────────────────────────────────────────────────────

    public function index(Request $request, $slug)
    {
        $warehouse = $this->resolveWarehouse($slug);

        // Handle optional table (restaurant module)
        $table           = null;
        $isRestaurant    = false;
        $general_setting = GeneralSetting::latest()->first();

        if ($general_setting && $general_setting->modules) {
            $modules      = explode(',', $general_setting->modules);
            $isRestaurant = in_array('restaurant', $modules);
        }

        if ($isRestaurant && $request->table_id) {
            $table = DB::table('tables')
                ->join('floors', 'tables.floor_id', '=', 'floors.id')
                ->where('tables.id', $request->table_id)
                ->where('floors.warehouse_id', $warehouse->id)
                ->where('tables.is_active', 1)
                ->select('tables.id', 'tables.name', 'tables.floor_id')
                ->first();
        }

        // Build categories that actually have active products in this warehouse.
        // This prevents empty categories from appearing in the nav.
        $productIds = DB::table('product_warehouse')
            ->where('warehouse_id', $warehouse->id)
            ->pluck('product_id');

        $activeCategoryIds = Product::whereIn('id', $productIds)
            ->where('is_active', 1)
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->filter()
            ->unique();

        $categories = Category::whereIn('id', $activeCategoryIds)
            ->where('is_active', 1)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return view('public_menu.index', compact(
            'warehouse',
            'table',
            'categories',
            'general_setting',
            'slug'
        ));
    }

    // ─── AJAX products endpoint ───────────────────────────────────────────────

    public function getProducts(Request $request, $slug)
    {
        $warehouse  = $this->resolveWarehouse($slug);
        $categoryId = (int) $request->query('category_id');
        $page       = max(1, (int) $request->query('page', 1));
        $limit      = 5;

        $productIds = DB::table('product_warehouse')
            ->where('warehouse_id', $warehouse->id)
            ->pluck('product_id');

        $query = Product::whereIn('id', $productIds)
            ->where('is_active', 1)
            ->with(['variant' => function ($q) {
                $q->orderBy('product_variants.position');
            }])
            ->select('id', 'name', 'image', 'price', 'category_id', 'is_variant',
                     'variant_option', 'variant_value');

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        } else {
            // null category – uncategorised products
            $query->whereNull('category_id');
        }

        $paginated = $query->paginate($limit, ['*'], 'page', $page);

        $data = $paginated->map(function (Product $product) {
            $imageUrl = ($product->image && file_exists(public_path('images/product/' . $product->image)))
                ? asset('images/product/' . $product->image)
                : null;

            return [
                'id'                => $product->id,
                'name'              => $product->name,
                'price'             => (float) $product->price,
                'image'             => $imageUrl,
                'is_variant'        => (bool) $product->is_variant,
                'has_variants'      => count($this->buildVariantsData($product)) > 0,
                'variants_data'     => $this->buildVariantsData($product),
            ];
        });

        return response()->json([
            'data'         => $data->values(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
        ]);
    }
}
