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
use App\Models\ProductBatch;
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
 * Uses keyset (cursor) pagination when cursor_id is provided.
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
            'product_batches',
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
            'cursor_pagination' => true,
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
        $cursorId = isset($options['cursor_id']) ? (int) $options['cursor_id'] : null;

        $result = match ($resource) {
            'warehouses' => $this->chunkWarehouses($page, $perPage, $options, $cursorId),
            'users' => $this->chunkUsers($page, $perPage, $options, $cursorId),
            'categories' => $this->chunkCategories($page, $perPage, $options, $cursorId),
            'brands' => $this->chunkBrands($page, $perPage, $options, $cursorId),
            'taxes' => $this->chunkTaxes($page, $perPage, $options, $cursorId),
            'units' => $this->chunkUnits($page, $perPage, $options, $cursorId),
            'customers' => $this->chunkCustomers($page, $perPage, $options, $cursorId),
            'billers' => $this->chunkBillers($page, $perPage, $options, $cursorId),
            'coupons' => $this->chunkCoupons($page, $perPage, $options, $cursorId),
            'products' => $this->chunkProducts($page, $perPage, $options, $cursorId),
            'product_variants' => $this->chunkProductVariants($page, $perPage, $options, $cursorId),
            'product_batches' => $this->chunkProductBatches($page, $perPage, $options, $cursorId),
            'product_stock' => $this->chunkProductStock($page, $perPage, $options, $cursorId),
            'settings' => $this->chunkSettings($page, $perPage, $options, $cursorId),
            default => ['data' => []],
        };

        return $result;
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
            'product_batches' => $this->productBatchesQuery($warehouseId, $since)->count(),
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
        $query = Product::query()
            ->select('products.*')
            ->join('product_warehouse as pw', 'pw.product_id', '=', 'products.id')
            ->where('pw.warehouse_id', $warehouseId)
            ->where('products.is_active', true)
            ->whereIn('products.type', ['standard', 'combo', 'service', 'digital']);

        return $this->applySince($query, $since, 'products');
    }

    private function productVariantsQuery(int $warehouseId, ?string $since): Builder
    {
        $query = ProductVariant::query()
            ->select('product_variants.*')
            ->join('product_warehouse as pw', 'pw.product_id', '=', 'product_variants.product_id')
            ->where('pw.warehouse_id', $warehouseId);

        return $this->applySince($query, $since, 'product_variants');
    }

    private function productBatchesQuery(int $warehouseId, ?string $since): Builder
    {
        $query = ProductBatch::query()
            ->select('product_batches.*')
            ->join('product_warehouse as pw', 'pw.product_id', '=', 'product_batches.product_id')
            ->where('pw.warehouse_id', $warehouseId);

        return $this->applySince($query, $since, 'product_batches');
    }

    private function activeQuery($query)
    {
        if (Schema::hasColumn($query->getModel()->getTable(), 'is_active')) {
            $query->where('is_active', true);
        }

        return $query;
    }

    private function applySince($query, ?string $since, ?string $table = null)
    {
        if (!$since) {
            return $query;
        }

        $table = $table ?? $query->getModel()->getTable();
        if (Schema::hasColumn($table, 'updated_at')) {
            $query->where($table . '.updated_at', '>=', $since);
        }

        return $query;
    }

    /**
     * @return array{data: array, next_cursor_id: ?int, has_more: bool}
     */
    private function chunkByCursor(
        Builder $query,
        int $perPage,
        ?int $cursorId,
        int $page,
        string $idColumn = 'id'
    ): array {
        if ($cursorId !== null && $cursorId > 0) {
            $query->where($query->getModel()->getTable() . '.' . $idColumn, '>', $cursorId);
            $rows = $query->orderBy($query->getModel()->getTable() . '.' . $idColumn)
                ->limit($perPage + 1)
                ->get();
        } else {
            $rows = $query->orderBy($query->getModel()->getTable() . '.' . $idColumn)
                ->forPage($page, $perPage + 1)
                ->get();
        }

        $hasMore = $rows->count() > $perPage;
        if ($hasMore) {
            $rows = $rows->take($perPage);
        }

        $nextCursor = $rows->isNotEmpty() ? (int) $rows->last()->{$idColumn} : null;

        return [
            'data' => $rows->toArray(),
            'next_cursor_id' => $hasMore ? $nextCursor : null,
            'has_more' => $hasMore,
        ];
    }

    private function chunkWarehouses(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $columns = ['id', 'name', 'phone', 'email', 'address'];
        if (Schema::hasColumn('warehouses', 'updated_at')) {
            $columns[] = 'updated_at';
        }

        $query = $this->applySince($this->activeQuery(Warehouse::query()), $opts['since'] ?? null);

        return $this->chunkByCursor($query->select($columns), $perPage, $cursorId, $page);
    }

    private function chunkUsers(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince(User::where('is_active', true), $opts['since'] ?? null);
        $result = $this->chunkByCursor(
            $query->select(['id', 'name', 'username', 'email', 'password', 'access_pin', 'warehouse_id', 'role_id', 'biller_id', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
        $result['data'] = collect($result['data'])->map(function ($row) {
            $user = new User($row);
            return $user->makeVisible(['password', 'access_pin'])->toArray();
        })->values()->all();

        return $result;
    }

    private function chunkCategories(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince(Category::where('is_active', true), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'name', 'image', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkBrands(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince(Brand::where('is_active', true), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'title as name', 'image', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkTaxes(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince($this->activeQuery(Tax::query()), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'name', 'rate', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkUnits(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince($this->activeQuery(Unit::query()), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'unit_code', 'unit_name', 'base_unit', 'operator', 'operation_value', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkCustomers(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince($this->activeQuery(Customer::query()), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'name', 'phone_number', 'email', 'city', 'customer_group_id', 'deposit', 'points', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkBillers(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince($this->activeQuery(Biller::query()), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'name', 'company_name', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkCoupons(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $query = $this->applySince(Coupon::where('is_active', true), $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['id', 'code', 'type', 'amount', 'minimum_amount', 'quantity', 'used', 'expired_date', 'updated_at']),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkProducts(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);

        $query = $this->productsQuery($warehouseId, $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select([
                'products.id', 'products.name', 'products.code', 'products.alt_code', 'products.type',
                'products.brand_id', 'products.category_id', 'products.unit_id', 'products.sale_unit_id',
                'products.cost', 'products.price', 'products.max_price', 'products.wholesale_price',
                'products.tax_id', 'products.tax_method', 'products.image', 'products.is_variant',
                'products.is_batch', 'products.is_imei', 'products.is_embeded', 'products.featured',
                'products.updated_at',
            ]),
            $perPage,
            $cursorId,
            $page,
            'id'
        );
    }

    private function chunkProductVariants(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);
        $query = $this->productVariantsQuery($warehouseId, $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['product_variants.id', 'product_variants.product_id', 'product_variants.variant_id', 'product_variants.item_code', 'product_variants.additional_price', 'product_variants.updated_at']),
            $perPage,
            $cursorId,
            $page,
            'id'
        );
    }

    private function chunkProductBatches(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);
        $query = $this->productBatchesQuery($warehouseId, $opts['since'] ?? null);

        return $this->chunkByCursor(
            $query->select(['product_batches.id', 'product_batches.product_id', 'product_batches.batch_no', 'product_batches.expired_date', 'product_batches.qty', 'product_batches.updated_at']),
            $perPage,
            $cursorId,
            $page,
            'id'
        );
    }

    private function chunkProductStock(int $page, int $perPage, array $opts, ?int $cursorId): array
    {
        $warehouseId = (int) ($opts['warehouse_id'] ?? 0);

        $query = $this->applySince(
            Product_Warehouse::where('warehouse_id', $warehouseId),
            $opts['since'] ?? null
        );

        return $this->chunkByCursor(
            $query->select([
                'id', 'product_id', 'variant_id', 'warehouse_id', 'qty', 'price',
                'product_batch_id', 'imei_number', 'updated_at',
            ]),
            $perPage,
            $cursorId,
            $page
        );
    }

    private function chunkSettings(int $page, int $perPage, array $opts, ?int $cursorId): array
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
            'next_cursor_id' => null,
            'has_more' => false,
        ];
    }
}
