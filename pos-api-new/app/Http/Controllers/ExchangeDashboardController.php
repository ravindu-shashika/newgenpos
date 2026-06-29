<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class ExchangeDashboardController extends Controller
{
    use SpaResponse;

    public function userCanAccess(string $permission = 'exchange-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        $names = [$permission, 'exchange-index', 'exchange-view', 'exchanges-view'];

        foreach ($names as $name) {
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

    protected function applyStaffAccessFilter($query): void
    {
        $user = Auth::user();
        if (!$user || !$user->role_id || $user->role_id <= 2) {
            return;
        }

        if (config('staff_access') === 'own') {
            $query->where('sale_exchanges.user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $query->where('sale_exchanges.warehouse_id', $user->warehouse_id);
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

            $q = SaleExchange::query()->with([
                'biller:id,name',
                'customer:id,name,phone_number',
                'warehouse:id,name',
                'sale:id,reference_no',
            ]);

            $q->whereDate('sale_exchanges.created_at', '>=', $startingDate)
                ->whereDate('sale_exchanges.created_at', '<=', $endingDate);

            $this->applyStaffAccessFilter($q);

            if ($warehouseId) {
                $q->where('sale_exchanges.warehouse_id', $warehouseId);
            }

            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('sale_exchanges.reference_no', 'LIKE', "%{$search}%")
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

            $exchanges = $q->orderBy('sale_exchanges.created_at', 'desc')->get();

            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }
            $warehouses = $warehouseQuery->get(['id', 'name']);

            $user = Auth::user();

            return $this->spaJson($request, [
                'data' => $exchanges->map(fn ($row) => $this->formatRow($row)),
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
                'message' => __('db.Failed to load sale exchanges'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess('exchange-view')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $exchange = SaleExchange::with([
                'biller',
                'customer',
                'warehouse',
                'user',
                'sale',
                'products.product',
                'products.saleUnit',
            ])->findOrFail($id);

            $payload = $this->buildProductsPayload($exchange);
            $decimals = (int) (config('decimal') ?? 2);

            $saleReference = 'N/A';
            if ($exchange->sale_id) {
                $sale = $exchange->sale;
                if (!$sale) {
                    $sale = Sale::whereNull('deleted_at')
                        ->select('reference_no')
                        ->find($exchange->sale_id);
                }
                $saleReference = $sale->reference_no ?? 'N/A';
            }

            $payload['exchange'] = [
                'id' => $exchange->id,
                'date' => $exchange->created_at
                    ? date(config('date_format') ?: 'd-m-Y', strtotime($exchange->created_at->toDateString()))
                    : '—',
                'reference_no' => $exchange->reference_no,
                'sale_reference' => $saleReference,
                'warehouse_name' => $exchange->warehouse->name ?? '—',
                'biller_name' => $exchange->biller->name ?? '—',
                'biller_company' => $exchange->biller->company_name ?? '',
                'biller_email' => $exchange->biller->email ?? '',
                'biller_phone' => $exchange->biller->phone_number ?? '',
                'biller_address' => $exchange->biller->address ?? '',
                'biller_city' => $exchange->biller->city ?? '',
                'customer_name' => $exchange->customer->name ?? '—',
                'customer_phone' => $exchange->customer->phone_number ?? '',
                'customer_address' => $exchange->customer->address ?? '',
                'customer_city' => $exchange->customer->city ?? '',
                'payment_type' => $exchange->payment_type,
                'payment_type_label' => $exchange->payment_type === 'pay' ? 'Pay' : 'Receive',
                'amount' => number_format((float) $exchange->amount, $decimals, '.', ''),
                'grand_total' => number_format((float) $exchange->grand_total, $decimals, '.', ''),
                'exchange_note' => $exchange->exchange_note,
                'staff_note' => $exchange->staff_note,
                'document' => $exchange->document,
                'staff_name' => $exchange->user->name ?? '',
                'staff_email' => $exchange->user->email ?? '',
            ];

            return $this->spaJson($request, $payload);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Exchange not found'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function buildProductsPayload(SaleExchange $exchange): array
    {
        $productsData = [
            'new' => [],
            'returned' => [],
        ];

        foreach ($exchange->products as $item) {
            $productInfo = [
                'name' => $item->product->name ?? '—',
                'code' => $item->product->code ?? '',
                'name_code' => ($item->product->name ?? '—') . ' [' . ($item->product->code ?? '') . ']',
                'batch_no' => $item->product->batch_no ?? 'N/A',
                'qty' => $item->qty,
                'unit_code' => $item->saleUnit->unit_code ?? '',
                'unit_price' => number_format((float) $item->net_unit_price, (int) (config('decimal') ?? 2), '.', ''),
                'tax' => number_format((float) $item->tax, (int) (config('decimal') ?? 2), '.', ''),
                'tax_rate' => $item->tax_rate,
                'discount' => number_format((float) $item->discount, (int) (config('decimal') ?? 2), '.', ''),
                'subtotal' => number_format((float) $item->total, (int) (config('decimal') ?? 2), '.', ''),
                'type' => $item->type,
            ];

            if ($item->type === 'new') {
                $productsData['new'][] = $productInfo;
            } else {
                $productsData['returned'][] = $productInfo;
            }
        }

        $decimals = (int) (config('decimal') ?? 2);
        $newTotal = $exchange->products->where('type', 'new')->sum('total');
        $returnedTotal = $exchange->products->where('type', 'returned')->sum('total');

        $productsData['totals'] = [
            'new' => number_format($newTotal, $decimals, '.', ''),
            'returned' => number_format($returnedTotal, $decimals, '.', ''),
            'tax' => number_format((float) $exchange->total_tax, $decimals, '.', ''),
            'discount' => number_format((float) $exchange->total_discount, $decimals, '.', ''),
            'amount' => number_format((float) $exchange->amount, $decimals, '.', ''),
            'order_tax' => number_format((float) $exchange->order_tax, $decimals, '.', ''),
            'order_tax_rate' => $exchange->order_tax_rate,
            'grand_total' => number_format((float) $exchange->grand_total, $decimals, '.', ''),
        ];

        return $productsData;
    }

    private function formatRow(SaleExchange $exchange): array
    {
        $decimals = (int) (config('decimal') ?? 2);

        $saleReference = 'N/A';
        if ($exchange->sale_id) {
            $sale = $exchange->sale;
            if (!$sale) {
                $sale = Sale::whereNull('deleted_at')
                    ->select('reference_no')
                    ->find($exchange->sale_id);
            }
            $saleReference = $sale->reference_no ?? 'N/A';
        }

        return [
            'id' => $exchange->id,
            'date' => $exchange->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($exchange->created_at->toDateString()))
                : '—',
            'reference_no' => $exchange->reference_no,
            'sale_reference' => $saleReference,
            'warehouse_name' => $exchange->warehouse->name ?? '—',
            'biller_name' => $exchange->biller->name ?? '—',
            'customer_name' => $exchange->customer->name ?? '—',
            'payment_type' => $exchange->payment_type,
            'payment_type_label' => $exchange->payment_type === 'pay' ? 'Pay' : 'Receive',
            'amount' => round((float) $exchange->amount, $decimals),
        ];
    }
}
