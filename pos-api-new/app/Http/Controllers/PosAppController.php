<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Biller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\GeneralSetting;
use App\Models\PosSetting;
use App\Models\PosSyncExchange;
use App\Models\PosSyncReturn;
use App\Models\PosSyncSale;
use App\Models\Terminal;
use App\Services\PosExchangeSyncService;
use App\Services\PosReturnService;
use App\Services\PosReturnSettlementService;
use App\Services\PosReturnSyncService;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Product_Warehouse;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\PosSaleSyncService;
use App\Services\PosSyncUserResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Flutter POS app API — catalog sync, barcode scan, offline sale upload.
 */
class PosAppController extends SaleDashboardController
{
    protected function userCanPosApp(): bool
    {
        if ($this->requestTerminal()?->is_active) {
            return true;
        }

        return $this->userCanAccessSales('sales-add');
    }

    protected function requestTerminal(): ?Terminal
    {
        $terminal = request()->attributes->get('pos_terminal');

        return $terminal instanceof Terminal ? $terminal : null;
    }

    /** User block for bootstrap — Sanctum user or POS terminal when device token is used. */
    protected function bootstrapUserPayload($user, ?Terminal $terminal): ?array
    {
        if ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'warehouse_id' => $user->warehouse_id,
                'biller_id' => $user->biller_id,
            ];
        }

        if ($terminal) {
            return [
                'id' => null,
                'name' => $terminal->name,
                'email' => null,
                'warehouse_id' => $terminal->warehouse_id,
                'biller_id' => null,
            ];
        }

        return null;
    }

    /** Connection probe for offline queue worker. */
    public function health(Request $request)
    {
        return $this->spaJson($request, [
            'online' => true,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /** Device bootstrap: settings + default warehouse + sync token. */
    public function bootstrap(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $user = Auth::user();
        $terminal = $this->requestTerminal();
        $general = GeneralSetting::latest()->first();
        $posSetting = PosSetting::latest()->first();
        $warehouses = Warehouse::query()
            ->when(Schema::hasColumn('warehouses', 'is_active'), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get(['id', 'name']);

        $posPayload = $this->formatPosSettingResponse($posSetting);
        $posDefaults = $this->posSettingDefaults($posSetting, $user);
        $defaultWarehouseId = $posDefaults['default_warehouse_id']
            ?: $terminal?->warehouse_id
            ?: ($warehouses->first()->id ?? null);

        return $this->spaJson($request, [
            'user' => $this->bootstrapUserPayload($user, $terminal),
            'terminal' => $terminal ? [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'code' => $terminal->code,
                'warehouse_id' => $terminal->warehouse_id,
            ] : null,
            'warehouses' => $warehouses,
            'default_customer_id' => $posDefaults['default_customer_id'],
            'default_biller_id' => $posDefaults['default_biller_id'],
            'default_warehouse_id' => $defaultWarehouseId,
            'general_setting' => $general ? [
                'site_title' => $general->site_title ?? config('app.name'),
                'decimal' => (int) ($general->decimal ?? 2),
                'currency' => $general->currency ?? '',
                'currency_position' => $general->currency_position ?? 'prefix',
                'staff_access' => config('staff_access'),
            ] : null,
            'pos_setting' => $posPayload,
            'invoice_setting' => \App\Models\InvoiceSetting::activeDeviceArray(),
            'sync_version' => now()->toIso8601String(),
            'product_image_base' => url('/images/product'),
            'default_product_image' => url('/images/product/zummXD2dvAtI.png'),
        ]);
    }

    /**
     * Full catalog pull for local PostgreSQL/SQLite cache on device.
     * GET /api/pos-app/catalog?warehouse_id=1&since=2026-01-01T00:00:00Z
     */
    public function catalog(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseId = (int) $request->input('warehouse_id', 0);
        if (!$warehouseId) {
            return $this->spaJson($request, ['message' => __('db.Warehouse') . ' is required.'], 422);
        }

        $since = $request->input('since');
        $syncVersion = now()->toIso8601String();

        try {
            return $this->spaJson($request, [
                'sync_version' => $syncVersion,
                'warehouse_id' => $warehouseId,
                'categories' => $this->pullCategories($since),
                'brands' => $this->pullBrands($since),
                'taxes' => $this->pullTaxes($since),
                'units' => $this->pullUnits($since),
                'customers' => $this->pullCustomers($since),
                'billers' => $this->pullBillers($since),
                'coupons' => $this->pullCoupons($since),
                'products' => $this->pullProducts($warehouseId, $since),
                'product_variants' => $this->pullProductVariants($since),
                'product_batches' => $this->pullProductBatches($warehouseId, $since),
                'product_stock' => $this->pullProductStock($warehouseId, $since),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load catalog'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /** Fast barcode / SKU scan — indexed lookup by product code or variant item_code. */
    public function scan(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $code = trim((string) $request->input('code', ''));
        $warehouseId = (int) $request->input('warehouse_id', 0);
        $customerId = (int) $request->input('customer_id', 0);

        if ($code === '' || !$warehouseId || !$customerId) {
            return $this->spaJson($request, [
                'message' => 'code, warehouse_id and customer_id are required.',
            ], 422);
        }

        return app(PosDashboardController::class)->lookupProduct(new Request([
            'code' => $code,
            'warehouse_id' => $warehouseId,
            'customer_id' => $customerId,
            'qty' => (float) $request->input('qty', 1),
            'embedded' => (int) $request->input('embedded', 0),
            'batch_id' => $request->input('batch_id'),
            'pre_qty' => (float) $request->input('pre_qty', 0),
            'price' => (float) $request->input('price', 0),
            'imei' => $request->input('imei'),
        ]));
    }

    /** Text search for product name / code (local cache fallback uses same shape). */
    public function search(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $term = trim((string) $request->input('q', ''));
        $warehouseId = (int) $request->input('warehouse_id', 0);
        $limit = min(50, max(5, (int) $request->input('limit', 20)));

        if ($term === '' || !$warehouseId) {
            return $this->spaJson($request, ['items' => []]);
        }

        $like = '%' . $term . '%';

        $products = Product::query()
            ->where('is_active', true)
            ->where(function ($q) use ($like) {
                $q->where('name', 'LIKE', $like)
                    ->orWhere('code', 'LIKE', $like)
                    ->orWhere('alt_code', 'LIKE', $like);
            })
            ->whereIn('type', ['standard', 'combo', 'service', 'digital'])
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'code', 'price', 'image', 'is_variant', 'is_batch', 'is_imei']);

        $items = $products->map(function ($p) use ($warehouseId) {
            $qty = (float) Product_Warehouse::where('product_id', $p->id)
                ->where('warehouse_id', $warehouseId)
                ->whereNull('variant_id')
                ->sum('qty');

            return [
                'product_id' => $p->id,
                'name' => $p->name,
                'code' => $p->code,
                'price' => (float) $p->price,
                'qty' => $qty,
                'image' => $p->image,
                'is_variant' => (bool) $p->is_variant,
                'is_batch' => (bool) $p->is_batch,
                'is_imei' => (bool) $p->is_imei,
            ];
        })->values();

        return $this->spaJson($request, ['items' => $items]);
    }

    /**
     * Push offline sales from Flutter queue (idempotent by client_uuid).
     * POST /api/pos-app/sales/sync  { device_id, sales: [...] }
     */
    public function syncSales(Request $request, PosSaleSyncService $syncService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $deviceId = $request->input('device_id');
        $terminal = $this->requestTerminal();
        if ($terminal && $deviceId && $terminal->device_id !== $deviceId) {
            return response()->json([
                'message' => 'Device not authorized for this terminal.',
            ], 403);
        }

        if ($terminalError = $this->assertActiveTerminal($request)) {
            return $terminalError;
        }

        $sales = $request->input('sales', []);
        if (!is_array($sales) || count($sales) === 0) {
            return $this->spaJson($request, ['message' => 'sales array is required.'], 422);
        }

        $userId = $request->input('user_id');
        $user = app(PosSyncUserResolver::class)->resolve(
            $this->requestTerminal(),
            is_numeric($userId) ? (int) $userId : null,
        );
        if (!$user) {
            return response()->json([
                'message' => 'Could not resolve user for sale sync. Log in on the POS device or send user_id.',
            ], 403);
        }

        $deviceId = $request->input('device_id');
        $useQueue = (bool) config('pos.sale_sync_use_queue', true);
        // sync driver runs jobs inline — no queue worker; database jobs would stall.
        $processInline = ! $useQueue || config('queue.default') === 'sync';
        $results = [];

        foreach ($sales as $salePayload) {
            if (!is_array($salePayload)) {
                continue;
            }
            try {
                $results[] = $processInline
                    ? $syncService->syncOne($salePayload, $deviceId, (int) $user->id)
                    : $syncService->acceptAndQueue($salePayload, $deviceId, (int) $user->id);
            } catch (\Throwable $e) {
                report($e);
                $results[] = [
                    'client_uuid' => $salePayload['client_uuid'] ?? '',
                    'sale_id' => null,
                    'reference_no' => null,
                    'status' => 'failed',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $this->spaJson($request, [
            'results' => $results,
            'queued' => ! $processInline,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /** Check sync status for client UUIDs after reconnect. */
    public function syncStatus(Request $request, PosSaleSyncService $syncService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $uuids = $request->input('client_uuids', []);
        if (!is_array($uuids) || count($uuids) === 0) {
            return $this->spaJson($request, ['items' => []]);
        }

        if (!Schema::hasTable('pos_sync_sales')) {
            return $this->spaJson($request, [
                'items' => [],
                'warning' => 'pos_sync_sales table missing. Run: php artisan migrate',
            ]);
        }

        if (config('queue.default') === 'sync') {
            $userId = $request->input('user_id');
            $user = app(PosSyncUserResolver::class)->resolve(
                $this->requestTerminal(),
                is_numeric($userId) ? (int) $userId : null,
            );
            if ($user) {
                foreach ($uuids as $uuid) {
                    if (! is_string($uuid) || $uuid === '') {
                        continue;
                    }
                    try {
                        $row = PosSyncSale::where('client_uuid', $uuid)->first();
                        if ($row && ! $row->sale_id && $row->sync_status === 'pending') {
                            $syncService->processByClientUuid($uuid, (int) $user->id);
                        }
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            }
        }

        $rows = PosSyncSale::whereIn('client_uuid', $uuids)->get([
            'client_uuid', 'sale_id', 'reference_no', 'sync_status', 'error_message', 'updated_at',
        ]);

        return $this->spaJson($request, [
            'items' => $rows->map(fn ($row) => [
                'client_uuid' => $row->client_uuid,
                'sale_id' => $row->sale_id,
                'reference_no' => $row->reference_no,
                'sync_status' => $row->sync_status,
                'error_message' => $row->error_message,
                'updated_at' => $row->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /** Lookup a completed sale for return entry. */
    public function returnSaleLookup(Request $request, PosReturnService $returnService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $referenceNo = trim((string) $request->input('reference_no', ''));
        if ($referenceNo === '') {
            return $this->spaJson($request, ['message' => 'reference_no is required.'], 422);
        }

        try {
            return $this->spaJson($request, $returnService->lookupSaleForReturn($referenceNo));
        } catch (\Throwable $e) {
            return $this->spaJson($request, ['message' => $e->getMessage()], 422);
        }
    }

    /** Pending return credits (unsettled) for checkout settlement. */
    public function returnCredits(Request $request, PosReturnSettlementService $settlementService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseId = (int) $request->input('warehouse_id', 0);
        if ($warehouseId <= 0) {
            return $this->spaJson($request, ['message' => 'warehouse_id is required.'], 422);
        }

        $customerId = $request->input('customer_id');
        $items = $settlementService->pendingCredits(
            $warehouseId,
            is_numeric($customerId) ? (int) $customerId : null,
        );

        return $this->spaJson($request, ['items' => $items]);
    }

    /** Lookup a return bill by reference for checkout settlement. */
    public function returnLookup(Request $request, PosReturnSettlementService $settlementService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $referenceNo = trim((string) $request->input('reference_no', ''));
        $warehouseId = (int) $request->input('warehouse_id', 0);
        if ($referenceNo === '' || $warehouseId <= 0) {
            return $this->spaJson($request, ['message' => 'reference_no and warehouse_id are required.'], 422);
        }

        $customerId = $request->input('customer_id');
        $item = $settlementService->lookupByReference(
            $referenceNo,
            $warehouseId,
            is_numeric($customerId) ? (int) $customerId : null,
        );

        return $this->spaJson($request, ['item' => $item]);
    }

    /** Push offline returns from Flutter queue (idempotent by client_uuid). */
    public function syncReturns(Request $request, PosReturnSyncService $syncService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        if ($terminalError = $this->assertActiveTerminal($request)) {
            return $terminalError;
        }

        $returns = $request->input('returns', []);
        if (!is_array($returns) || $returns === []) {
            return $this->spaJson($request, ['message' => 'returns array is required.'], 422);
        }

        $userId = $request->input('user_id');
        $user = app(PosSyncUserResolver::class)->resolve(
            $this->requestTerminal(),
            is_numeric($userId) ? (int) $userId : null,
        );
        if (!$user) {
            return response()->json([
                'message' => 'Could not resolve user for return sync.',
            ], 403);
        }

        $deviceId = $request->input('device_id');
        $results = [];
        foreach ($returns as $payload) {
            if (!is_array($payload)) {
                continue;
            }
            try {
                $results[] = $syncService->acceptAndQueue($payload, $deviceId, (int) $user->id);
            } catch (\Throwable $e) {
                report($e);
                $results[] = [
                    'client_uuid' => $payload['client_uuid'] ?? '',
                    'return_id' => null,
                    'reference_no' => null,
                    'status' => 'failed',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $this->spaJson($request, [
            'results' => $results,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /** Check return sync status for client UUIDs. */
    public function syncReturnStatus(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $uuids = $request->input('client_uuids', []);
        if (!is_array($uuids) || $uuids === []) {
            return $this->spaJson($request, ['items' => []]);
        }

        if (!Schema::hasTable('pos_sync_returns')) {
            return $this->spaJson($request, [
                'items' => [],
                'warning' => 'pos_sync_returns table missing. Run: php artisan migrate',
            ]);
        }

        $rows = PosSyncReturn::whereIn('client_uuid', $uuids)->get([
            'client_uuid', 'return_id', 'reference_no', 'sync_status', 'error_message', 'updated_at',
        ]);

        return $this->spaJson($request, [
            'items' => $rows->map(fn ($row) => [
                'client_uuid' => $row->client_uuid,
                'return_id' => $row->return_id,
                'reference_no' => $row->reference_no,
                'sync_status' => $row->sync_status,
                'error_message' => $row->error_message,
                'updated_at' => $row->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /** Push offline exchanges from Flutter queue (idempotent by client_uuid). */
    public function syncExchanges(Request $request, PosExchangeSyncService $syncService)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        if ($terminalError = $this->assertActiveTerminal($request)) {
            return $terminalError;
        }

        $exchanges = $request->input('exchanges', []);
        if (!is_array($exchanges) || $exchanges === []) {
            return $this->spaJson($request, ['message' => 'exchanges array is required.'], 422);
        }

        $userId = $request->input('user_id');
        $user = app(PosSyncUserResolver::class)->resolve(
            $this->requestTerminal(),
            is_numeric($userId) ? (int) $userId : null,
        );
        if (!$user) {
            return response()->json([
                'message' => 'Could not resolve user for exchange sync.',
            ], 403);
        }

        $deviceId = $request->input('device_id');
        $results = [];
        foreach ($exchanges as $payload) {
            if (!is_array($payload)) {
                continue;
            }
            try {
                $results[] = $syncService->acceptAndQueue($payload, $deviceId, (int) $user->id);
            } catch (\Throwable $e) {
                report($e);
                $results[] = [
                    'client_uuid' => $payload['client_uuid'] ?? '',
                    'exchange_id' => null,
                    'reference_no' => null,
                    'status' => 'failed',
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $this->spaJson($request, [
            'results' => $results,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /** Check exchange sync status for client UUIDs. */
    public function syncExchangeStatus(Request $request)
    {
        if (!$this->userCanPosApp()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $uuids = $request->input('client_uuids', []);
        if (!is_array($uuids) || $uuids === []) {
            return $this->spaJson($request, ['items' => []]);
        }

        if (!Schema::hasTable('pos_sync_exchanges')) {
            return $this->spaJson($request, [
                'items' => [],
                'warning' => 'pos_sync_exchanges table missing. Run: php artisan migrate',
            ]);
        }

        $rows = PosSyncExchange::whereIn('client_uuid', $uuids)->get([
            'client_uuid', 'exchange_id', 'reference_no', 'sync_status', 'error_message', 'updated_at',
        ]);

        return $this->spaJson($request, [
            'items' => $rows->map(fn ($row) => [
                'client_uuid' => $row->client_uuid,
                'exchange_id' => $row->exchange_id,
                'reference_no' => $row->reference_no,
                'sync_status' => $row->sync_status,
                'error_message' => $row->error_message,
                'updated_at' => $row->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /** Ensure POS device is linked to an active terminal when terminal_code is sent. */
    private function assertActiveTerminal(Request $request)
    {
        $code = $request->input('terminal_code');
        $deviceId = $request->input('device_id');

        $terminal = $request->attributes->get('pos_terminal');
        if ($terminal instanceof Terminal) {
            return null;
        }

        if (!$code || !$deviceId) {
            return null;
        }

        $terminal = Terminal::where('code', $code)->where('is_active', true)->first();
        if (!$terminal) {
            return response()->json([
                'message' => 'Terminal is inactive or unknown. Contact your administrator.',
            ], 403);
        }

        if ($terminal->device_id && $terminal->device_id !== $deviceId) {
            return response()->json([
                'message' => 'This device is not authorized for the terminal.',
            ], 403);
        }

        $terminal->update([
            'last_active' => now(),
            'ip' => $request->ip(),
        ]);

        return null;
    }

    private function applySince($query, ?string $since, string $column = 'updated_at'): void
    {
        if ($since) {
            $query->where($column, '>=', $since);
        }
    }

    private function pullCategories(?string $since)
    {
        $q = Category::where('is_active', true)->orderBy('name');
        $this->applySince($q, $since);

        return $q->get(['id', 'name', 'image', 'updated_at']);
    }

    private function pullBrands(?string $since)
    {
        $q = Brand::where('is_active', true)->orderBy('title');
        $this->applySince($q, $since);

        return $q->get(['id', 'title as name', 'image', 'updated_at']);
    }

    private function pullTaxes(?string $since)
    {
        $q = Tax::query()->when(Schema::hasColumn('taxes', 'is_active'), fn ($b) => $b->where('is_active', true));
        $this->applySince($q, $since);

        return $q->get(['id', 'name', 'rate', 'updated_at']);
    }

    private function pullUnits(?string $since)
    {
        $q = Unit::query()->when(Schema::hasColumn('units', 'is_active'), fn ($b) => $b->where('is_active', true));
        $this->applySince($q, $since);

        return $q->get(['id', 'unit_code', 'unit_name', 'base_unit', 'operator', 'operation_value', 'updated_at']);
    }

    private function pullCustomers(?string $since)
    {
        $q = Customer::query()->when(Schema::hasColumn('customers', 'is_active'), fn ($b) => $b->where('is_active', true));
        $this->applySince($q, $since);

        return $q->orderBy('name')->limit(5000)->get([
            'id', 'name', 'phone_number', 'email', 'city', 'customer_group_id', 'updated_at',
        ]);
    }

    private function pullBillers(?string $since)
    {
        $q = Biller::query()->when(Schema::hasColumn('billers', 'is_active'), fn ($b) => $b->where('is_active', true));
        $this->applySince($q, $since);

        return $q->orderBy('name')->get(['id', 'name', 'company_name', 'updated_at']);
    }

    private function pullCoupons(?string $since)
    {
        $q = Coupon::where('is_active', true);
        $this->applySince($q, $since);

        return $q->get(['id', 'code', 'type', 'amount', 'minimum_amount', 'quantity', 'used', 'expired_date', 'updated_at']);
    }

    private function pullProducts(int $warehouseId, ?string $since)
    {
        $productIds = Product_Warehouse::where('warehouse_id', $warehouseId)
            ->distinct()
            ->pluck('product_id');

        $q = Product::query()
            ->where('is_active', true)
            ->whereIn('id', $productIds)
            ->whereIn('type', ['standard', 'combo', 'service', 'digital']);

        $this->applySince($q, $since);

        return $q->get([
            'id', 'name', 'code', 'alt_code', 'type', 'brand_id', 'category_id', 'unit_id', 'sale_unit_id',
            'cost', 'price', 'max_price', 'wholesale_price', 'tax_id', 'tax_method', 'image', 'is_variant', 'is_batch', 'is_imei',
            'is_embeded', 'featured', 'updated_at',
        ]);
    }

    private function pullProductBatches(int $warehouseId, ?string $since)
    {
        $productIds = Product_Warehouse::where('warehouse_id', $warehouseId)
            ->distinct()
            ->pluck('product_id');

        $q = ProductBatch::query()->whereIn('product_id', $productIds);
        $this->applySince($q, $since);

        return $q->get(['id', 'product_id', 'batch_no', 'expired_date', 'qty', 'updated_at']);
    }

    private function pullProductStock(int $warehouseId, ?string $since)
    {
        $q = Product_Warehouse::where('warehouse_id', $warehouseId);
        $this->applySince($q, $since);

        return $q->get([
            'id', 'product_id', 'variant_id', 'warehouse_id', 'qty', 'price',
            'product_batch_id', 'imei_number', 'updated_at',
        ]);
    }

    private function pullProductVariants(?string $since)
    {
        $q = ProductVariant::query();
        $this->applySince($q, $since);

        return $q->get(['id', 'product_id', 'variant_id', 'item_code', 'additional_price', 'updated_at']);
    }
}
