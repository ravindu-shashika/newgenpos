<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductTransfer;
use App\Models\ProductVariant;
use App\Models\Transfer;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class TransferDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $permission = 'transfers-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach ([$permission, 'transfers-index'] as $name) {
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
            $query->where('transfers.user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $warehouseId = $user->warehouse_id;
            $query->where(function ($q) use ($warehouseId) {
                $q->where('transfers.from_warehouse_id', $warehouseId)
                    ->orWhere('transfers.to_warehouse_id', $warehouseId);
            });
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
            $fromWarehouseId = (int) $request->input('from_warehouse_id', 0);
            $toWarehouseId = (int) $request->input('to_warehouse_id', 0);
            $search = trim((string) $request->input('search', ''));

            $q = Transfer::query()->with([
                'fromWarehouse:id,name',
                'toWarehouse:id,name',
            ]);

            $q->where('transfers.created_at', '>=', $startingDate . ' 00:00:00')
                ->where('transfers.created_at', '<=', $endingDate . ' 23:59:59');

            $this->applyStaffAccessFilter($q);

            if ($fromWarehouseId) {
                $q->where('transfers.from_warehouse_id', $fromWarehouseId);
            }
            if ($toWarehouseId) {
                $q->where('transfers.to_warehouse_id', $toWarehouseId);
            }
            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('transfers.reference_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('fromWarehouse', fn ($w) => $w->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('toWarehouse', fn ($w) => $w->where('name', 'LIKE', "%{$search}%"));
                });
            }

            $transfers = $q->orderBy('transfers.created_at', 'desc')->get();
            $decimals = (int) (config('decimal') ?? 2);
            $user = Auth::user();

            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }

            return $this->spaJson($request, [
                'data' => $transfers->map(fn ($row) => $this->formatRow($row, $decimals, $user)),
                'warehouses' => $warehouseQuery->get(['id', 'name'])->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                'filters' => [
                    'starting_date' => $startingDate,
                    'ending_date' => $endingDate,
                    'from_warehouse_id' => $fromWarehouseId,
                    'to_warehouse_id' => $toWarehouseId,
                ],
                'show_warehouse_filter' => $user && $user->role_id && $user->role_id <= 2,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load transfers'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $transfer = Transfer::with(['fromWarehouse', 'toWarehouse', 'user'])->find($id);
        if (!$transfer) {
            return response()->json(['message' => __('db.Transfer not found')], 404);
        }

        $decimals = (int) (config('decimal') ?? 2);
        $rawLines = app(TransferController::class)->productTransferData($id);
        $products = [];
        if (is_array($rawLines) && isset($rawLines[0])) {
            $count = count($rawLines[0]);
            for ($i = 0; $i < $count; $i++) {
                $qty = (float) ($rawLines[1][$i] ?? 0);
                $subtotal = (float) ($rawLines[5][$i] ?? 0);
                $products[] = [
                    'name' => strip_tags($rawLines[0][$i] ?? ''),
                    'batch_no' => $rawLines[6][$i] ?? 'N/A',
                    'qty' => $qty,
                    'unit' => $rawLines[2][$i] ?? '',
                    'unit_cost' => $qty > 0 ? number_format($subtotal / $qty, $decimals, '.', '') : '0',
                    'tax' => number_format((float) ($rawLines[3][$i] ?? 0), $decimals, '.', ''),
                    'tax_rate' => $rawLines[4][$i] ?? 0,
                    'subtotal' => number_format($subtotal, $decimals, '.', ''),
                ];
            }
        }

        $from = $transfer->fromWarehouse;
        $to = $transfer->toWarehouse;

        return $this->spaJson($request, [
            'transfer' => [
                'id' => $transfer->id,
                'date' => $transfer->created_at
                    ? date(config('date_format') ?: 'd-m-Y', strtotime($transfer->created_at->toDateString()))
                    : '—',
                'reference_no' => $transfer->reference_no,
                'status' => $this->statusLabel((int) $transfer->status),
                'status_code' => (int) $transfer->status,
                'is_sent' => (int) $transfer->is_sent === 1,
                'total_tax' => number_format((float) $transfer->total_tax, $decimals, '.', ''),
                'total_cost' => number_format((float) $transfer->total_cost, $decimals, '.', ''),
                'shipping_cost' => number_format((float) $transfer->shipping_cost, $decimals, '.', ''),
                'grand_total' => number_format((float) $transfer->grand_total, $decimals, '.', ''),
                'note' => $transfer->note ?? '',
                'document' => $transfer->document,
            ],
            'from_warehouse' => $from ? [
                'name' => $from->name,
                'phone' => $from->phone ?? '',
                'address' => $from->address ?? '',
            ] : null,
            'to_warehouse' => $to ? [
                'name' => $to->name,
                'phone' => $to->phone ?? '',
                'address' => $to->address ?? '',
            ] : null,
            'user' => $transfer->user ? [
                'name' => $transfer->user->name,
                'email' => $transfer->user->email ?? '',
            ] : null,
            'products' => $products,
        ]);
    }

    public function approve(Request $request, $id)
    {
        if (!$this->userCan('transfers-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $user = Auth::user();
        if (!$user || $user->role_id >= 3) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $approveRequest = Request::create('/api/transfers/change-status/' . $id, 'PUT', [
                'id' => $id,
                'status' => 1,
            ]);
            $approveRequest->setUserResolver(fn () => $user);
            app(TransferController::class)->changeStatus($approveRequest);

            return $this->spaJson($request, ['message' => __('db.Transfer updated successfully')]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to approve transfer'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('transfers-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        if (!Transfer::find($id)) {
            return response()->json(['message' => __('db.Transfer not found')], 404);
        }

        try {
            app(TransferController::class)->destroy($id);

            return $this->spaJson($request, ['message' => __('db.Transfer deleted successfully')]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to delete transfer'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function statusLabel(int $status): string
    {
        return match ($status) {
            1 => __('db.Completed'),
            2 => __('db.Pending'),
            3 => __('db.Sent'),
            default => '—',
        };
    }

    private function formatRow(Transfer $transfer, int $decimals, $user): array
    {
        $statusCode = (int) $transfer->status;

        return [
            'id' => $transfer->id,
            'date' => $transfer->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($transfer->created_at->toDateString()))
                : '—',
            'reference_no' => $transfer->reference_no,
            'from_warehouse_name' => $transfer->fromWarehouse->name ?? '—',
            'to_warehouse_name' => $transfer->toWarehouse->name ?? '—',
            'shipping_cost' => number_format((float) $transfer->shipping_cost, $decimals, '.', ''),
            'grand_total' => number_format((float) $transfer->grand_total, $decimals, '.', ''),
            'status' => $this->statusLabel($statusCode),
            'status_code' => $statusCode,
            'is_sent' => (int) $transfer->is_sent === 1 ? __('db.Yes') : __('db.No'),
            'is_sent_code' => (int) $transfer->is_sent,
            'can_approve' => $user && $user->role_id < 3 && $statusCode === 2,
        ];
    }

    public function createForm(Request $request)
    {
        if (!$this->userCan('transfers-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $user = Auth::user();
        $canSetAllStatus = $user && $user->role_id < 3;
        $statusOptions = $canSetAllStatus
            ? [
                ['value' => '1', 'label' => __('db.Completed')],
                ['value' => '2', 'label' => __('db.Pending')],
                ['value' => '3', 'label' => __('db.Sent')],
            ]
            : [
                ['value' => '2', 'label' => __('db.Pending')],
            ];

        $warehouseQuery = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $warehouseQuery->where('is_active', true);
        }
        $warehouses = $warehouseQuery->orderBy('name')->get(['id', 'name']);

        if ($user && $user->role_id > 2 && $user->warehouse_id) {
            $warehouses = $warehouses->where('id', $user->warehouse_id)->values();
        }

        return $this->spaJson($request, [
            'decimal' => (int) (config('decimal') ?? 2),
            'warehouses' => $warehouses->map(fn ($w) => ['id' => $w->id, 'name' => $w->name])->values(),
            'default_from_warehouse_id' => $user->warehouse_id ?? ($warehouses->first()->id ?? null),
            'default_created_at' => date(config('date_format') ?: 'd-m-Y'),
            'status_options' => $statusOptions,
            'can_set_all_status' => $canSetAllStatus,
        ]);
    }

    public function warehouseProducts(Request $request)
    {
        if (!$this->userCan('transfers-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseId = (int) $request->input('warehouse_id', 0);
        if (!$warehouseId) {
            return $this->spaJson($request, ['options' => []]);
        }

        $raw = app(TransferController::class)->getProduct($warehouseId);
        $options = [];
        if (is_array($raw) && isset($raw[0]) && is_array($raw[0])) {
            $count = count($raw[0]);
            for ($i = 0; $i < $count; $i++) {
                $code = $raw[0][$i] ?? '';
                $name = html_entity_decode(strip_tags($raw[1][$i] ?? ''), ENT_QUOTES, 'UTF-8');
                $qty = $raw[2][$i] ?? 0;
                $imei = $raw[12][$i] ?? 'null';
                $embed = $raw[11][$i] ?? '0';
                $options[] = [
                    'code' => $code,
                    'name' => $name,
                    'stock_qty' => (float) $qty,
                    'label' => "{$code}|{$name}|{$imei}|{$embed}|{$qty}|",
                ];
            }
        }

        return $this->spaJson($request, ['options' => $options]);
    }

    public function productSearch(Request $request)
    {
        if (!$this->userCan('transfers-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $code = (string) $request->input('code', '');
        $name = (string) $request->input('name', '');
        $imei = (string) $request->input('imei', 'null');
        $embed = (string) $request->input('embed', '0');
        $stockQty = (string) $request->input('stock_qty', '0');
        $qty = (string) $request->input('qty', '1');

        if ($code === '') {
            return $this->spaJson($request, ['message' => 'Product code is required.'], 422);
        }

        $searchData = "{$code}|{$name}|{$imei}|{$embed}|{$stockQty}|?0?{$qty}";
        $result = app(TransferController::class)->limsProductSearch(new Request(['data' => $searchData]));

        if ($result === null || !is_array($result)) {
            return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
        }

        return $this->spaJson($request, [
            'name' => $result[0] ?? '',
            'code' => $result[1] ?? '',
            'cost' => (float) ($result[2] ?? 0),
            'tax_rate' => (float) ($result[3] ?? 0),
            'tax_name' => $result[4] ?? 'No Tax',
            'tax_method' => (int) ($result[5] ?? 1),
            'unit_names' => $this->csvToArray($result[6] ?? 'n/a,'),
            'unit_operators' => $this->csvToArray($result[7] ?? 'n/a,'),
            'unit_operation_values' => array_map('floatval', $this->csvToArray($result[8] ?? 'n/a,')),
            'product_id' => (int) ($result[9] ?? 0),
            'product_variant_id' => $result[10] ?? null,
            'is_batch' => (bool) ($result[12] ?? false),
            'is_imei' => (bool) ($result[13] ?? false),
            'is_variant' => (bool) ($result[14] ?? false),
            'stock_qty' => (float) ($result[15] ?? 0),
            'imei_number' => ($result[18] ?? 'null') !== 'null' ? ($result[18] ?? '') : '',
        ]);
    }

    private function csvToArray(string $csv): array
    {
        $parts = array_filter(explode(',', rtrim($csv, ',')), fn ($v) => $v !== '' && $v !== 'n/a');

        return array_values($parts);
    }

    public function importForm(Request $request)
    {
        if (!$this->userCan('transfers-import') && !$this->userCan('transfers-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $warehouseQuery = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $warehouseQuery->where('is_active', true);
        }
        $warehouses = $warehouseQuery->orderBy('name')->get(['id', 'name']);

        return $this->spaJson($request, [
            'warehouses' => $warehouses->map(fn ($w) => ['id' => $w->id, 'name' => $w->name])->values(),
            'status_options' => [
                ['value' => '1', 'label' => __('db.Completed')],
                ['value' => '2', 'label' => __('db.Pending')],
                ['value' => '3', 'label' => __('db.Sent')],
            ],
            'sample_file_url' => '/sample_file/sample_transfer_products.csv',
        ]);
    }
}
