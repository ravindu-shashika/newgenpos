<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Biller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\GeneralSetting;
use App\Models\PosSetting;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Product_Warehouse;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Paginated bulk export for Flutter POS (full or delta since last sync).
 */
class PosDownloadService
{
    public const CHUNK_SIZE = 2000;

    public const MODE_FULL = 'full';

    public const MODE_DELTA = 'delta';

    public function resourceNames(): array
    {
        return [
            'warehouses',
            'users',
            'categories',
            'brands',
            'taxes',
            'units',
            'customers',
            'billers',
            'coupons',
            'products',
            'product_variants',
            'product_stock',
            'settings',
        ];
    }

    public function manifest(int $warehouseId, string $mode = self::MODE_FULL, ?string $since = null): array
    {
        $since = $this->normalizeSince($mode, $since);
        $opts = ['warehouse_id' => $warehouseId, 'since' => $since, 'mode' => $mode];

        $chunks = [];
        foreach ($this->resourceNames() as $name) {
            $total = $this->countResource($name, $opts);
            $perPage = $name === 'settings' ? 1 : self::CHUNK_SIZE;
            $pages = $total > 0 ? (int) ceil($total / $perPage) : 0;
            if ($name === 'settings') {
                $pages = 1;
                $total = 1;
            }

            $chunks[] = [
                'resource' => $name,
                'total' => $total,
                'per_page' => $perPage,
                'pages' => $pages,
            ];
        }

        $totalRows = array_sum(array_column($chunks, 'total'));

        return [
            'generated_at' => now()->toIso8601String(),
            'warehouse_id' => $warehouseId,
            'mode' => $mode,
            'since' => $since,
            'chunk_size' => self::CHUNK_SIZE,
            'total_rows' => $totalRows,
            'resources' => $chunks,
        ];
    }

    public function download(string $resource, int $page, int $perPage, array $options = []): array
    {
        if (!in_array($resource, $this->resourceNames(), true)) {
            throw new \InvalidArgumentException("Unknown resource: {$resource}");
        }

        $mode = $options['mode'] ?? self::MODE_FULL;
        $options['since'] = $this->normalizeSince($mode, $options['since'] ?? null);
        $options['mode'] = $mode;

        $perPage = max(1, min(5000, $perPage));
        $page = max(1, $page);

        return match ($resource) {
            'warehouses' => $this->chunkWarehouses($page, $perPage, $options),
            'users' => $this->chunkUsers($page, $perPage, $options),
            'categories' => $this->chunkCategories($page, $perPage, $options),
            'brands' => $this->chunkBrands($page, $perPage, $options),
            'taxes' => $this->chunkTaxes($page, $perPage, $options),
            'units' => $this->chunkUnits($page, $perPage, $options),
            'customers' => $this->chunkCustomers($page, $perPage, $options),
            'billers' => $this->chunkBillers($page, $perPage, $options),
            'coupons' => $this->chunkCoupons($page, $perPage, $options),
            'products' => $this->chunkProducts($page, $perPage, $options),
            'product_variants' => $this->chunkProductVariants($page, $perPage, $options),
            'product_stock' => $this->chunkProductStock($page, $perPage, $options),
            'settings' => $this->chunkSettings($page, $perPage, $options),
            default => ['data' => []],
        };
    }

    private function normalizeSince(string $mode, ?string $since): ?string
    {
        if ($mode !== self::MODE_DELTA) {
            return null;
        }

        if (!$since) {
            throw new \InvalidArgumentException('since is required for delta download');
        }

        return Carbon::parse($since)->toDateTimeString();
    }

    private function countResource(string $name, array $opts): int
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);
        $since = $opts['since'] ?? null;

        return match ($name) {
            'warehouses' => $this->applySince($this->activeQuery(Warehouse::query()), $since)->count(),
            'users' => $this->applySince(User::where('is_active', true), $since)->count(),
            'categories' => $this->applySince(Category::where('is_active', true), $since)->count(),
            'brands' => $this->applySince(Brand::where('is_active', true), $since)->count(),
            'taxes' => $this->applySince($this->activeQuery(Tax::query()), $since)->count(),
            'units' => $this->applySince($this->activeQuery(Unit::query()), $since)->count(),
            'customers' => $this->applySince($this->activeQuery(Customer::query()), $since)->count(),
            'billers' => $this->applySince($this->activeQuery(Biller::query()), $since)->count(),
            'coupons' => $this->applySince(Coupon::where('is_active', true), $since)->count(),
            'products' => $this->productsQuery($warehouseId, $since)->count(),
            'product_variants' => $this->productVariantsQuery($warehouseId, $since)->count(),
            'product_stock' => $this->applySince(
                Product_Warehouse::where('warehouse_id', $warehouseId),
                $since
            )->count(),
            'settings' => 1,
            default => 0,
        };
    }

    private function productsQuery(int $warehouseId, ?string $since): Builder
    {
        $ids = $this->productIdsForWarehouse($warehouseId);

        $query = Product::where('is_active', true)
            ->whereIn('id', $ids)
            ->whereIn('type', ['standard', 'combo', 'service', 'digital']);

        return $this->applySince($query, $since);
    }

    private function productVariantsQuery(int $warehouseId, ?string $since): Builder
    {
        $ids = $this->productIdsForWarehouse($warehouseId);

        return $this->applySince(
            ProductVariant::whereIn('product_id', $ids),
            $since
        );
    }

    private function activeQuery($query)
    {
        if (Schema::hasColumn($query->getModel()->getTable(), 'is_active')) {
            $query->where('is_active', true);
        }

        return $query;
    }

    private function applySince($query, ?string $since)
    {
        if (!$since) {
            return $query;
        }

        $table = $query->getModel()->getTable();
        if (Schema::hasColumn($table, 'updated_at')) {
            $query->where($table . '.updated_at', '>=', $since);
        }

        return $query;
    }

    private function productIdsForWarehouse(int $warehouseId)
    {
        return Product_Warehouse::where('warehouse_id', $warehouseId)->distinct()->pluck('product_id');
    }

    private function chunkWarehouses(int $page, int $perPage, array $opts): array
    {
        $columns = ['id', 'name', 'phone', 'email', 'address'];
        if (Schema::hasColumn('warehouses', 'updated_at')) {
            $columns[] = 'updated_at';
        }

        $rows = $this->applySince($this->activeQuery(Warehouse::query()), $opts['since'] ?? null)
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get($columns);

        return ['data' => $rows->toArray()];
    }

    private function chunkUsers(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince(User::where('is_active', true), $opts['since'] ?? null)
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get(['id', 'name', 'username', 'email', 'password', 'access_pin', 'warehouse_id', 'role_id', 'biller_id', 'updated_at'])
            ->map(fn (User $user) => $user->makeVisible(['password', 'access_pin'])->toArray());

        return ['data' => $rows->values()->all()];
    }

    private function chunkCategories(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince(Category::where('is_active', true), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'name', 'image', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkBrands(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince(Brand::where('is_active', true), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'title as name', 'image', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkTaxes(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince($this->activeQuery(Tax::query()), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'name', 'rate', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkUnits(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince($this->activeQuery(Unit::query()), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'unit_code', 'unit_name', 'base_unit', 'operator', 'operation_value', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkCustomers(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince($this->activeQuery(Customer::query()), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'name', 'phone_number', 'email', 'city', 'customer_group_id', 'deposit', 'points', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkBillers(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince($this->activeQuery(Biller::query()), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'name', 'company_name', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkCoupons(int $page, int $perPage, array $opts): array
    {
        $rows = $this->applySince(Coupon::where('is_active', true), $opts['since'] ?? null)
            ->orderBy('id')->forPage($page, $perPage)
            ->get(['id', 'code', 'type', 'amount', 'minimum_amount', 'quantity', 'used', 'expired_date', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkProducts(int $page, int $perPage, array $opts): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);

        $rows = $this->productsQuery($warehouseId, $opts['since'] ?? null)
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get([
                'id', 'name', 'code', 'type', 'brand_id', 'category_id', 'unit_id', 'sale_unit_id',
                'cost', 'price', 'wholesale_price', 'tax_id', 'tax_method', 'image', 'is_variant', 'is_batch', 'is_imei',
                'is_embeded', 'featured', 'updated_at',
            ]);

        return ['data' => $rows];
    }

    private function chunkProductVariants(int $page, int $perPage, array $opts): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);

        $rows = $this->productVariantsQuery($warehouseId, $opts['since'] ?? null)
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get(['id', 'product_id', 'variant_id', 'item_code', 'additional_price', 'updated_at']);

        return ['data' => $rows];
    }

    private function chunkProductStock(int $page, int $perPage, array $opts): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);

        $rows = $this->applySince(
            Product_Warehouse::where('warehouse_id', $warehouseId),
            $opts['since'] ?? null
        )
            ->orderBy('id')
            ->forPage($page, $perPage)
            ->get([
                'id', 'product_id', 'variant_id', 'warehouse_id', 'qty', 'price',
                'product_batch_id', 'imei_number', 'updated_at',
            ]);

        return ['data' => $rows];
    }

    private function chunkSettings(int $page, int $perPage, array $opts): array
    {
        $general = GeneralSetting::latest()->first();
        $pos = PosSetting::latest()->first();

        return [
            'data' => [[
                'general_setting' => $general ? [
                    'site_title' => $general->site_title ?? config('app.name'),
                    'decimal' => (int) ($general->decimal ?? 2),
                    'currency' => $general->currency ?? '',
                    'currency_position' => $general->currency_position ?? 'prefix',
                ] : null,
                'pos_setting' => $pos?->toDeviceArray(),
                'invoice_setting' => \App\Models\InvoiceSetting::activeDeviceArray(),
            ]],
        ];
    }
}
