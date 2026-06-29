<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Payment;
use App\Models\Returns;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class ReturnSaleDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $permission = 'returns-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        $names = [$permission, 'returns-index', 'returns-view', 'returns.view'];

        foreach ($names as $name) {
            try {
                if ($role && $role->hasPermissionTo($name)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
                // continue
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
        $aliases = [
            'returns-add' => ['returns-create'],
            'returns-delete' => ['returns-destroy'],
            'returns-edit' => ['returns-update'],
        ];
        foreach (array_merge([$permission], $aliases[$permission] ?? []) as $name) {
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

    protected function userDisplayName(?User $user): string
    {
        if (!$user) {
            return '';
        }

        return trim((string) ($user->name ?? $user->username ?? ''));
    }

    protected function applyStaffAccessFilter($query): void
    {
        $user = Auth::user();
        if (!$user || !$user->role_id || $user->role_id <= 2) {
            return;
        }

        if (config('staff_access') === 'own') {
            $query->where('returns.user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $query->where('returns.warehouse_id', $user->warehouse_id);
        }
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $startingDate = $request->input('starting_date')
                ?: date('Y-m-d', strtotime('-1 year'));
            $endingDate = $request->input('ending_date') ?: date('Y-m-d');
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $search = trim((string) $request->input('search', ''));

            $q = Returns::query()->with([
                'biller:id,name',
                'customer:id,name,phone_number',
                'warehouse:id,name',
                'sale:id,reference_no',
            ]);

            $q->whereDate('returns.created_at', '>=', $startingDate)
                ->whereDate('returns.created_at', '<=', $endingDate);

            $this->applyStaffAccessFilter($q);

            if ($warehouseId) {
                $q->where('returns.warehouse_id', $warehouseId);
            }

            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('returns.reference_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('customer', function ($c) use ($search) {
                            $c->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('phone_number', 'LIKE', "%{$search}%");
                        })
                        ->orWhereHas('biller', function ($b) use ($search) {
                            $b->where('name', 'LIKE', "%{$search}%");
                        })
                        ->orWhereHas('sale', function ($s) use ($search) {
                            $s->where('reference_no', 'LIKE', "%{$search}%")
                                ->whereNull('deleted_at');
                        });
                });
            }

            $returns = $q->orderBy('returns.created_at', 'desc')->get();

            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }
            $warehouses = $warehouseQuery->get(['id', 'name']);

            $user = Auth::user();

            return $this->spaJson($request, [
                'data' => $returns->map(fn ($r) => $this->formatRow($r)),
                'warehouses' => $warehouses->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
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
                'message' => __('db.Failed to load sale returns'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $return = Returns::with(['biller', 'customer', 'warehouse', 'user', 'sale'])->find($id);
        if (!$return) {
            return response()->json(['message' => __('db.Return not found')], 404);
        }

        $rawLines = app(ReturnController::class)->productReturnData($id);
        $products = [];
        if (is_array($rawLines) && isset($rawLines[0])) {
            $count = count($rawLines[0]);
            $decimals = (int) (config('decimal') ?? 2);
            for ($i = 0; $i < $count; $i++) {
                $qty = (float) ($rawLines[1][$i] ?? 0);
                $subtotal = (float) ($rawLines[6][$i] ?? 0);
                $products[] = [
                    'name' => strip_tags((string) ($rawLines[0][$i] ?? '')),
                    'batch_no' => $rawLines[7][$i] ?? 'N/A',
                    'qty' => $qty,
                    'unit' => $rawLines[2][$i] ?? '',
                    'unit_price' => $qty > 0 ? round($subtotal / $qty, $decimals) : 0,
                    'tax' => (float) ($rawLines[3][$i] ?? 0),
                    'tax_rate' => (float) ($rawLines[4][$i] ?? 0),
                    'discount' => (float) ($rawLines[5][$i] ?? 0),
                    'subtotal' => $subtotal,
                ];
            }
        }

        $rate = $return->exchange_rate ?: 1;
        $decimals = (int) (config('decimal') ?? 2);
        $saleReference = 'N/A';
        if ($return->sale_id) {
            $sale = $return->sale ?: Sale::whereNull('deleted_at')->select('reference_no')->find($return->sale_id);
            $saleReference = $sale->reference_no ?? 'N/A';
        }

        $currencyCode = 'N/A';
        if ($return->currency_id) {
            $currencyCode = Currency::where('id', $return->currency_id)->value('code') ?? 'N/A';
        }

        $biller = $return->biller;
        $customer = $return->customer;
        $warehouse = $return->warehouse;

        return $this->spaJson($request, [
            'return' => [
                'id' => $return->id,
                'reference_no' => $return->reference_no,
                'sale_reference' => $saleReference,
                'date' => $return->created_at
                    ? date(config('date_format') ?: 'd-m-Y', strtotime($return->created_at->toDateString()))
                    : '',
                'total_tax' => round((float) $return->total_tax / (float) $rate, $decimals),
                'total_discount' => round((float) $return->total_discount / (float) $rate, $decimals),
                'total_price' => round((float) $return->total_price / (float) $rate, $decimals),
                'order_tax' => round((float) $return->order_tax / (float) $rate, $decimals),
                'order_tax_rate' => (float) $return->order_tax_rate,
                'grand_total' => round((float) $return->grand_total / (float) $rate, $decimals),
                'return_note' => $return->return_note,
                'staff_note' => $return->staff_note,
                'document' => $return->document,
                'currency_code' => $currencyCode,
                'exchange_rate' => $return->exchange_rate,
            ],
            'warehouse' => $warehouse ? [
                'name' => $warehouse->name,
                'phone' => $warehouse->phone ?? '',
                'address' => $warehouse->address ?? '',
            ] : null,
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
            'user' => $return->user ? [
                'name' => $this->userDisplayName($return->user),
                'email' => $return->user->email ?? '',
            ] : null,
            'products' => $products,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('returns-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $return = Returns::find($id);
        if (!$return) {
            return response()->json(['message' => __('db.Return not found')], 404);
        }

        $refund = Payment::where('return_id', $return->id)->latest()->first();
        if ($refund) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! This return cannot be deleted due to existing refund payment. Please delete the refund payment first.'),
            ], 422);
        }

        try {
            app(ReturnController::class)->destroy($id);

            return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to delete return'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function formatRow(Returns $return): array
    {
        $rate = $return->exchange_rate ?: 1;
        $decimals = (int) (config('decimal') ?? 2);

        $saleReference = 'N/A';
        if ($return->sale_id) {
            $sale = $return->sale;
            if (!$sale) {
                $sale = Sale::whereNull('deleted_at')
                    ->select('reference_no')
                    ->find($return->sale_id);
            }
            $saleReference = $sale->reference_no ?? 'N/A';
        }

        return [
            'id' => $return->id,
            'date' => $return->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($return->created_at->toDateString()))
                : '—',
            'reference_no' => $return->reference_no,
            'sale_reference' => $saleReference,
            'warehouse_name' => $return->warehouse->name ?? '—',
            'biller_name' => $return->biller->name ?? '—',
            'customer_name' => $return->customer->name ?? '—',
            'grand_total' => round((float) $return->grand_total / (float) $rate, $decimals),
        ];
    }
}
