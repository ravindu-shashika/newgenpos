<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Sale;
use App\Models\Product_Sale;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Customer;
use App\Models\Currency;
use App\Models\Account;
use App\Models\PosSetting;
use App\Enums\CustomerTypeEnum;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class SaleDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccessSales(string $permission = 'sales-index'): bool
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
            // fall through
        }

        return $user->can($permission)
            || $user->can('sales-index')
            || $user->can('sales-add')
            || $user->can('sales-edit');
    }

    protected function saleQuery()
    {
        return Sale::query()->with(['customer', 'warehouse', 'user', 'payments']);
    }

    protected function applyStaffAccessFilter($query): void
    {
        $user = Auth::user();
        if (!$user || !$user->role_id || $user->role_id <= 2) {
            return;
        }

        if (config('staff_access') === 'own') {
            $query->where('user_id', $user->id);
        } elseif (config('staff_access') === 'warehouse' && $user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }
    }

    protected function returnedAmount(int $saleId): float
    {
        if (!Schema::hasTable('returns') || !Schema::hasColumn('returns', 'sale_id')) {
            return 0.0;
        }

        return (float) DB::table('returns')->where('sale_id', $saleId)->sum('grand_total');
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessSales('sales-index')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $startingDate = $request->input('starting_date')
                ?: date('Y-m-d', strtotime('-1 year'));
            $endingDate = $request->input('ending_date') ?: date('Y-m-d');
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $saleStatus = (int) $request->input('sale_status', 0);
            $paymentStatus = (int) $request->input('payment_status', 0);
            $search = trim((string) $request->input('search', ''));

            $q = $this->saleQuery();

            $q->where(function ($query) {
                $query->where('sale_type', '!=', 'opening balance')
                    ->orWhereNull('sale_type');
            });

            $q->where('created_at', '>=', $startingDate . ' 00:00:00')
                ->where('created_at', '<=', $endingDate . ' 23:59:59');

            $this->applyStaffAccessFilter($q);

            if ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            }
            if ($saleStatus) {
                $q->where('sale_status', $saleStatus);
            }
            if ($paymentStatus) {
                $q->where('payment_status', $paymentStatus);
            }
            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('reference_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('customer', function ($c) use ($search) {
                            $c->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('phone_number', 'LIKE', "%{$search}%");
                        });
                });
            }

            $sales = $q->orderBy('created_at', 'desc')->get();

            $warehouseQuery = Warehouse::query();
            if (Schema::hasColumn('warehouses', 'is_active')) {
                $warehouseQuery->where('is_active', true);
            }
            $warehouses = $warehouseQuery->get(['id', 'name']);

            return $this->spaJson($request, [
                'data' => $sales->map(fn ($s) => $this->formatSaleRow($s)),
                'filters' => [
                    'starting_date' => $startingDate,
                    'ending_date' => $endingDate,
                    'warehouse_id' => $warehouseId,
                    'sale_status' => $saleStatus,
                    'payment_status' => $paymentStatus,
                ],
                'warehouses' => $warehouses->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load sales'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createForm(Request $request)
    {
        if (!$this->userCanAccessSales('sales-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            return $this->spaJson($request, $this->saleFormMeta());
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load sale form'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function editForm(Request $request, $id)
    {
        if (!$this->userCanAccessSales('sales-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $saleQuery = Sale::query()->where('id', $id);
            $this->applyStaffAccessFilter($saleQuery);
            $sale = $saleQuery->first();
            if (!$sale) {
                return $this->spaJson($request, ['message' => __('db.Sale not found')], 404);
            }

            $lines = Product_Sale::where('sale_id', $id)->get()
                ->map(fn ($ps) => $this->formatSaleLine($ps))
                ->filter()
                ->values()
                ->all();

            $createdAt = $sale->created_at
                ? $sale->created_at->format('Y-m-d')
                : date('Y-m-d');

            return $this->spaJson($request, [
                'sale' => [
                    'id' => $sale->id,
                    'reference_no' => $sale->reference_no,
                    'created_at' => $createdAt,
                    'customer_id' => $sale->customer_id,
                    'warehouse_id' => $sale->warehouse_id,
                    'biller_id' => $sale->biller_id,
                    'currency_id' => $sale->currency_id,
                    'exchange_rate' => (float) ($sale->exchange_rate ?: 1),
                    'sale_status' => (int) $sale->sale_status,
                    'payment_status' => (int) $sale->payment_status,
                    'order_tax_rate' => (float) ($sale->order_tax_rate ?? 0),
                    'order_tax' => (float) ($sale->order_tax ?? 0),
                    'order_discount' => (float) ($sale->order_discount ?? 0),
                    'shipping_cost' => (float) ($sale->shipping_cost ?? 0),
                    'grand_total' => (float) ($sale->grand_total ?? 0),
                    'paid_amount' => (float) ($sale->paid_amount ?? 0),
                    'sale_note' => $sale->sale_note ?? '',
                    'staff_note' => $sale->staff_note ?? '',
                    'document' => $sale->document,
                ],
                'lines' => $lines,
                'meta' => $this->saleFormMeta(),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load sale'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function productSearch(Request $request)
    {
        if (!$this->userCanAccessSales('sales-add') && !$this->userCanAccessSales('sales-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return app(QuotationDashboardController::class)->productSearch($request);
    }

    public function warehouseProducts(Request $request)
    {
        if (!$this->userCanAccessSales('sales-add') && !$this->userCanAccessSales('sales-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return app(QuotationDashboardController::class)->warehouseProducts($request);
    }

    public function customerGroup(Request $request, $customerId)
    {
        if (!$this->userCanAccessSales('sales-add') && !$this->userCanAccessSales('sales-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return app(QuotationDashboardController::class)->customerGroup($request, $customerId);
    }

    private function formatSaleLine(Product_Sale $ps): ?array
    {
        $product = Product::find($ps->product_id);
        if (!$product) {
            return null;
        }

        $decimals = (int) (config('decimal') ?? 2);
        $code = $product->code;
        $variantId = null;
        $productVariantId = null;

        if ($ps->variant_id) {
            $variant = ProductVariant::select('id', 'item_code', 'variant_id')
                ->FindExactProduct($product->id, $ps->variant_id)
                ->first();
            if ($variant) {
                $code = $variant->item_code;
                $variantId = $ps->variant_id;
                $productVariantId = $variant->id;
            }
        }

        $qty = max((float) $ps->qty, 1);
        if ((int) $product->tax_method === 1) {
            $productPrice = (float) $ps->net_unit_price + ((float) $ps->discount / $qty);
        } else {
            $productPrice = ((float) $ps->total / $qty) + ((float) $ps->discount / $qty);
        }

        $unitNames = [];
        $unitOperators = [];
        $unitOpValues = [];
        $saleUnit = 'n/a';

        if ($product->type === 'standard') {
            $units = Unit::where('base_unit', $product->unit_id)->orWhere('id', $product->unit_id)->get();
            foreach ($units as $unit) {
                if ($ps->sale_unit_id == $unit->id) {
                    array_unshift($unitNames, $unit->unit_name);
                    array_unshift($unitOperators, $unit->operator);
                    array_unshift($unitOpValues, (float) $unit->operation_value);
                } else {
                    $unitNames[] = $unit->unit_name;
                    $unitOperators[] = $unit->operator;
                    $unitOpValues[] = (float) $unit->operation_value;
                }
            }
            if (!empty($unitOperators)) {
                if ($unitOperators[0] === '*') {
                    $productPrice = $productPrice / max($unitOpValues[0], 1);
                } elseif ($unitOperators[0] === '/') {
                    $productPrice = $productPrice * $unitOpValues[0];
                }
            }
            $saleUnit = $unitNames[0] ?? 'n/a';
        }

        $tax = Tax::where('rate', $ps->tax_rate)->first();
        $batchNo = '';
        if ($ps->product_batch_id) {
            $batchNo = ProductBatch::find($ps->product_batch_id)?->batch_no ?? '';
        }

        return [
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'product_variant_id' => $productVariantId,
            'code' => $code,
            'name' => $product->name,
            'qty' => (float) $ps->qty,
            'product_batch_id' => $ps->product_batch_id,
            'batch_no' => $batchNo,
            'net_unit_price' => round((float) $ps->net_unit_price, $decimals),
            'discount' => round((float) $ps->discount, $decimals),
            'tax' => round((float) $ps->tax, $decimals),
            'tax_rate' => (float) $ps->tax_rate,
            'tax_name' => $tax?->name ?? 'No Tax',
            'subtotal' => round((float) $ps->total, $decimals),
            'product_price' => round($productPrice, $decimals),
            'row_product_price' => round($productPrice, $decimals),
            'tax_method' => (int) $product->tax_method,
            'sale_unit' => $saleUnit,
            'sale_unit_id' => $ps->sale_unit_id,
            'unit_names' => $unitNames,
            'unit_operators' => $unitOperators,
            'unit_operation_values' => $unitOpValues,
            'is_batch' => (bool) $product->is_batch,
            'is_imei' => (bool) ($product->is_imei ?? false),
            'imei_number' => $ps->imei_number ?? '',
            'type' => $product->type,
            'net_unit_cost' => (float) ($ps->net_unit_cost ?? 0),
        ];
    }

    protected function formatPosSettingResponse(?PosSetting $posSetting): ?array
    {
        return $posSetting?->toDeviceArray();
    }

    protected function formatInvoiceSettingResponse(): ?array
    {
        return \App\Models\InvoiceSetting::activeDeviceArray();
    }

    protected function posSettingDefaults(?PosSetting $posSetting, $user): array
    {
        $customerId = $posSetting?->customer_id ? (int) $posSetting->customer_id : null;
        // Prefer POS setting defaults; fall back to the signed-in user's assignments.
        $billerId = $posSetting?->biller_id
            ? (int) $posSetting->biller_id
            : ($user?->biller_id ? (int) $user->biller_id : null);
        $warehouseId = $posSetting?->warehouse_id
            ? (int) $posSetting->warehouse_id
            : ($user?->warehouse_id ? (int) $user->warehouse_id : null);

        return [
            'default_customer_id' => $customerId,
            'default_biller_id' => $billerId,
            'default_warehouse_id' => $warehouseId,
        ];
    }

    public function saleFormMeta(): array
    {
        $user = Auth::user();
        $decimals = (int) (config('decimal') ?? 2);
        $posSetting = PosSetting::latest()->first();
        $posPayload = $this->formatPosSettingResponse($posSetting);
        $posDefaults = $this->posSettingDefaults($posSetting, $user);

        $warehouseQuery = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $warehouseQuery->where('is_active', true);
        }
        if ($user && $user->role_id > 2 && $user->warehouse_id) {
            $warehouseQuery->where('id', $user->warehouse_id);
        }

        $billerQuery = Biller::query();
        if (Schema::hasColumn('billers', 'is_active')) {
            $billerQuery->where('is_active', true);
        }
        if ($user && $user->role_id > 2 && $user->biller_id) {
            $billerQuery->where('id', $user->biller_id);
        }

        $currencyQuery = Currency::query();
        if (Schema::hasColumn('currencies', 'is_active')) {
            $currencyQuery->where('is_active', true);
        }
        $defaultCurrency = Currency::where('exchange_rate', 1)->first() ?? $currencyQuery->first();

        $taxes = Tax::where('is_active', true)->get(['id', 'name', 'rate']);
        $accounts = Account::where('is_active', true)->get(['id', 'name', 'is_default']);

        $paymentOptions = $posPayload['payment_options'] ?? ['cash', 'card', 'cheque', 'deposit'];

        $paymentMethodOptions = [
            ['value' => '1', 'label' => 'Cash'],
            ['value' => '2', 'label' => 'Gift Card'],
            ['value' => '3', 'label' => 'Credit Card'],
            ['value' => '4', 'label' => 'Cheque'],
            ['value' => '5', 'label' => 'Paypal'],
            ['value' => '6', 'label' => 'Deposit'],
            ['value' => '7', 'label' => 'Points'],
        ];

        return [
            'decimal' => $decimals,
            'default_created_at' => date('Y-m-d'),
            'can_change_sale_date' => $user && ($user->role_id <= 2 || $user->can('change_sale_date')),
            'billers' => $billerQuery->get(['id', 'name', 'company_name']),
            'customers' => Customer::where(['is_active' => true, 'type' => CustomerTypeEnum::REGULAR->value])
                ->orderBy('name')
                ->get(['id', 'name', 'phone_number', 'deposit', 'expense']),
            'warehouses' => $warehouseQuery->get(['id', 'name']),
            'currencies' => $currencyQuery->get(['id', 'code', 'exchange_rate']),
            'accounts' => $accounts,
            'taxes' => $taxes,
            'order_tax_options' => array_merge(
                [['rate' => 0, 'name' => 'No Tax']],
                $taxes->map(fn ($t) => ['rate' => (float) $t->rate, 'name' => $t->name])->all()
            ),
            'payment_method_options' => $paymentMethodOptions,
            'payment_options' => $paymentOptions,
            'default_customer_id' => $posDefaults['default_customer_id'],
            'default_warehouse_id' => $posDefaults['default_warehouse_id'],
            'default_biller_id' => $posDefaults['default_biller_id'],
            'default_currency_id' => $defaultCurrency?->id,
            'default_exchange_rate' => $defaultCurrency?->exchange_rate ?? 1,
            'default_account_id' => $accounts->firstWhere('is_default', true)?->id ?? $accounts->first()?->id,
            'lock_warehouse_id' => $user && $user->role_id > 2 && $user->warehouse_id ? $user->warehouse_id : null,
            'lock_biller_id' => $user && $user->role_id > 2 && $user->biller_id ? $user->biller_id : null,
            'installment_enabled' => true,
            'invoice_setting' => $this->formatInvoiceSettingResponse(),
        ];
    }

    private function formatSaleRow(Sale $sale): array
    {
        $rate = $sale->exchange_rate ?: 1;
        $returned = $this->returnedAmount((int) $sale->id);
        $paid = (float) ($sale->paid_amount ?? 0);
        $due = max(0, ($sale->grand_total - $returned - $paid) / $rate);
        $decimals = (int) (config('decimal') ?? 2);

        $saleStatusLabels = [
            1 => 'Completed',
            2 => 'Pending',
            3 => 'Draft',
            4 => 'Returned',
            5 => 'Processing',
            6 => 'Cooked',
            7 => 'Served',
        ];

        $paymentStatusLabels = [
            1 => 'Pending',
            2 => 'Due',
            3 => 'Partial',
            4 => 'Paid',
        ];

        $paymentMethods = $sale->payments
            ->map(function (Payment $payment) use ($rate, $decimals) {
                $method = ucfirst((string) ($payment->paying_method ?? ''));

                return $method . ' (' . number_format((float) $payment->amount / $rate, $decimals) . ')';
            })
            ->filter()
            ->implode(', ');

        return [
            'id' => $sale->id,
            'date' => $sale->created_at
                ? $sale->created_at->format('d-m-Y')
                : '—',
            'reference_no' => $sale->reference_no,
            'customer_name' => $sale->customer->name ?? '—',
            'warehouse_name' => $sale->warehouse->name ?? '—',
            'created_by' => $sale->user->name ?? '—',
            'sale_status' => $sale->sale_status,
            'sale_status_label' => $saleStatusLabels[$sale->sale_status] ?? 'Unknown',
            'payment_status' => $sale->payment_status,
            'payment_status_label' => $paymentStatusLabels[$sale->payment_status] ?? 'Paid',
            'payment_method' => $paymentMethods ?: '—',
            'grand_total' => round($sale->grand_total / $rate, $decimals),
            'paid_amount' => round($paid / $rate, $decimals),
            'due' => round($due, $decimals),
        ];
    }
}
