<?php

namespace App\Http\Controllers;

use App\Models\Biller;
use App\Models\Category;
use App\Models\Challan;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\CustomField;
use App\Models\Expense;
use App\Models\GeneralSetting;
use App\Models\Income;
use App\Models\PackingSlip;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\Product_Sale;
use App\Models\Product_Warehouse;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\ReturnPurchase;
use App\Models\Returns;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Variant;
use App\Models\Warehouse;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class ReportController extends Controller
{
    use SpaResponse;

    private $own_data = false;
    private $current_user_id = null;

    public function __construct()
    {
        if (Auth::check()) {
            $this->current_user_id = Auth::id();
            $this->own_data = (Auth::user()->role_id > 2 && config('staff_access') == 'own');
        }
    }

    private function reportDecimal(): int
    {
        static $decimal = null;
        if ($decimal !== null) {
            return $decimal;
        }

        $setting = cache()->get('general_setting');
        if ($setting !== null) {
            $decimal = (int) ($setting->decimal ?? config('decimal', 2));

            return $decimal;
        }

        $decimal = (int) (GeneralSetting::latest()->value('decimal') ?? config('decimal', 2));

        return $decimal;
    }

    public function productQuantityAlert(Request $request)
    {
        if (!$this->userCanProductQtyAlert()) {
            return $this->denyProductQtyAlertAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildProductQuantityAlertPayload($warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        $lims_product_data = collect($payload['rows'])->map(fn ($row) => (object) $row);
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.qty_alert_table', compact('lims_product_data', 'lims_warehouse_list', 'warehouse_id'))->render();
        }

        return view('backend.report.qty_alert_report', compact('lims_product_data', 'lims_warehouse_list', 'warehouse_id'));
    }

    private function buildProductQuantityAlertPayload(int $warehouse_id): array
    {
        $q = Product::select('name', 'code', 'image', 'qty', 'alert_quantity')
            ->where('is_active', true)
            ->whereColumn('alert_quantity', '>', 'qty');

        if ($warehouse_id) {
            $q->whereHas('warehouses', function ($query) use ($warehouse_id) {
                $query->where('warehouse_id', $warehouse_id);
            });
        }

        $decimal = $this->reportDecimal();

        return [
            'warehouse_id' => $warehouse_id,
            'decimal' => $decimal,
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'rows' => $q->get()->map(function ($product) use ($decimal) {
                $images = explode(',', (string) $product->image);
                $baseImage = $images[0] ?? '';

                return [
                    'id' => $product->code,
                    'name' => $product->name,
                    'code' => $product->code,
                    'image' => $baseImage,
                    'qty' => number_format((float) $product->qty, $decimal, '.', ''),
                    'alert_quantity' => number_format((float) $product->alert_quantity, $decimal, '.', ''),
                ];
            })->values(),
        ];
    }

    private function userCanProductQtyAlert(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('product-qty-alert');
    }

    private function denyProductQtyAlertAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function dailySaleObjective(Request $request)
    {
        if (!$this->userCanDailySaleObjective()) {
            return $this->denyDailySaleObjectiveAccess($request);
        }

        if ($request->input('starting_date')) {
            $starting_date = $request->input('starting_date');
            $ending_date = $request->input('ending_date');
        } else {
            $starting_date = date('Y-m-d', strtotime('-1 month'));
            $ending_date = date('Y-m-d');
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'starting_date' => $starting_date,
                'ending_date' => $ending_date,
                'decimal' => $this->reportDecimal(),
            ]);
        }

        return view('backend.report.daily_sale_objective', compact('starting_date', 'ending_date'));
    }

    public function dailySaleObjectiveData(Request $request)
    {
        if (!$this->userCanDailySaleObjective()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $starting_date = date('Y-m-d', strtotime('+1 day', strtotime($request->input('starting_date'))));
        $ending_date = date('Y-m-d', strtotime('+1 day', strtotime($request->input('ending_date'))));

        $columns = [
            1 => 'created_at',
        ];
        $totalData = DB::table('dso_alerts')
            ->whereDate('created_at', '>=', $starting_date)
            ->whereDate('created_at', '<=', $ending_date)
            ->count();
        $totalFiltered = $totalData;

        if ($request->input('length') != -1) {
            $limit = $request->input('length');
        } else {
            $limit = $totalData;
        }
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')] ?? 'created_at';
        $dir = $request->input('order.0.dir') === 'asc' ? 'asc' : 'desc';
        if (empty($request->input('search.value'))) {
            $lims_dso_alert_data = DB::table('dso_alerts')
                ->whereDate('created_at', '>=', $starting_date)
                ->whereDate('created_at', '<=', $ending_date)
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir)
                ->get();
        } else {
            $search = $request->input('search.value');
            $lims_dso_alert_data = DB::table('dso_alerts')
                ->whereDate('dso_alerts.created_at', '=', date('Y-m-d', strtotime(str_replace('/', '-', $search))))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir)
                ->get();
            $totalFiltered = DB::table('dso_alerts')
                ->whereDate('dso_alerts.created_at', '=', date('Y-m-d', strtotime(str_replace('/', '-', $search))))
                ->count();
        }
        $data = [];
        if (!empty($lims_dso_alert_data)) {
            foreach ($lims_dso_alert_data as $key => $dso_alert_data) {
                $productParts = [];
                foreach (json_decode($dso_alert_data->product_info) as $product_info) {
                    $productParts[] = $product_info->name.' ['.$product_info->code.']';
                }

                $data[] = [
                    'id' => $dso_alert_data->id,
                    'key' => $key,
                    'date' => date(config('date_format'), strtotime('-1 day', strtotime($dso_alert_data->created_at))),
                    'product_info' => implode(', ', $productParts),
                    'number_of_products' => $dso_alert_data->number_of_products,
                ];
            }
        }

        return response()->json([
            'draw' => intval($request->input('draw')),
            'recordsTotal' => intval($totalData),
            'recordsFiltered' => intval($totalFiltered),
            'data' => $data,
        ]);
    }

    private function userCanDailySaleObjective(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('dso-report');
    }

    private function denyDailySaleObjectiveAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function productExpiry(Request $request)
    {
        if (!$this->userCanProductExpiryReport()) {
            return $this->denyProductExpiryReportAccess($request);
        }

        $payload = $this->buildProductExpiryReportPayload();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        $lims_product_data = collect($payload['rows'])->map(fn ($row) => (object) $row);

        return view('backend.report.product_expiry_report', compact('lims_product_data'));
    }

    private function buildProductExpiryReportPayload(): array
    {
        $decimal = $this->reportDecimal();
        $dateFormat = config('date_format', 'd/m/Y');
        $today = date('Y-m-d');

        $rows = DB::table('products')
            ->join('product_batches', 'products.id', '=', 'product_batches.product_id')
            ->where([
                ['products.is_active', true],
                ['product_batches.qty', '>', 0],
            ])
            ->select(
                'products.name',
                'products.code',
                'products.image',
                'product_batches.batch_no',
                'product_batches.expired_date',
                'product_batches.qty'
            )
            ->get()
            ->map(function ($product, $index) use ($decimal, $dateFormat, $today) {
                $images = explode(',', (string) $product->image);

                return [
                    'id' => $product->code.'-'.$product->batch_no.'-'.$index,
                    'name' => $product->name,
                    'code' => $product->code,
                    'image' => $images[0] ?? '',
                    'batch_no' => $product->batch_no,
                    'expired_date' => date($dateFormat, strtotime($product->expired_date)),
                    'expired_date_raw' => $product->expired_date,
                    'is_expired' => $today >= $product->expired_date,
                    'qty' => number_format((float) $product->qty, $decimal, '.', ''),
                ];
            })
            ->values();

        return [
            'decimal' => $decimal,
            'date_format' => $dateFormat,
            'rows' => $rows,
        ];
    }

    private function userCanProductExpiryReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('product-expiry-report');
    }

    private function denyProductExpiryReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function warehouseStock(Request $request)
    {
        if (!$this->userCanWarehouseStockReport()) {
            return $this->denyWarehouseStockReportAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildWarehouseStockPayload($warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        if ($request->ajax()) {
            return view('backend.report.partials.warehouse_stock_table', compact(
                'total_item', 'total_qty', 'total_price', 'total_cost', 'lims_warehouse_list', 'warehouse_id'
            ))->render();
        }

        return view('backend.report.warehouse_stock', compact(
            'total_item', 'total_qty', 'total_price', 'total_cost', 'lims_warehouse_list', 'warehouse_id'
        ));
    }

    private function userCanWarehouseStockReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('warehouse-stock-report');
    }

    private function denyWarehouseStockReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildWarehouseStockPayload(int $warehouse_id): array
    {
        if (!$warehouse_id) {
            $total_item = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where([
                    ['products.is_active', true],
                    ['product_warehouse.qty', '>', 0],
                ])->count();

            $total_qty = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where('products.is_active', true)
                ->sum('product_warehouse.qty');

            $total_price = DB::table('products')->where('is_active', true)->sum(DB::raw('price * qty'));
            $total_cost = DB::table('products')->where('is_active', true)->sum(DB::raw('cost * qty'));
        } else {
            $total_item = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where([
                    ['products.is_active', true],
                    ['product_warehouse.qty', '>', 0],
                    ['product_warehouse.warehouse_id', $warehouse_id],
                ])->count();

            $total_qty = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where([
                    ['products.is_active', true],
                    ['product_warehouse.warehouse_id', $warehouse_id],
                ])->sum('product_warehouse.qty');

            $total_price = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where([
                    ['products.is_active', true],
                    ['product_warehouse.warehouse_id', $warehouse_id],
                ])->sum(DB::raw('products.price * product_warehouse.qty'));

            $total_cost = DB::table('product_warehouse')
                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                ->where([
                    ['products.is_active', true],
                    ['product_warehouse.warehouse_id', $warehouse_id],
                ])->sum(DB::raw('products.cost * product_warehouse.qty'));
        }

        $general_setting = GeneralSetting::latest()->first();
        $decimal = (int) ($general_setting->decimal ?? config('decimal', 2));
        $theme = $this->bestSellerThemeColors($general_setting->theme ?? 'default.css');
        $total_price = (float) $total_price;
        $total_cost = (float) $total_cost;

        return [
            'warehouse_id' => $warehouse_id,
            'total_item' => (float) $total_item,
            'total_qty' => (float) $total_qty,
            'total_price' => $total_price,
            'total_cost' => $total_cost,
            'estimate_profit' => $total_price - $total_cost,
            'decimal' => $decimal,
            'theme' => $theme,
            'labels' => [
                'Stock Value by Price',
                'Stock Value by Cost',
                'Estimate Profit',
            ],
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
        ];
    }

    private function userCanDailySale(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('daily-sale');
    }

    private function denyDailySaleAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildDailySalePayload(int $year, $month, int $warehouse_id = 0): array
    {
        $month = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $number_of_day = (int) date('t', mktime(0, 0, 0, (int) $month, 1, $year));
        $days = [];

        $queryFields = [
            'SUM(total_discount / COALESCE(NULLIF(exchange_rate, 0), 1)) as total_discount',
            'SUM(order_discount / COALESCE(NULLIF(exchange_rate, 0), 1)) as order_discount',
            'SUM(total_tax / COALESCE(NULLIF(exchange_rate, 0), 1)) as total_tax',
            'SUM(order_tax / COALESCE(NULLIF(exchange_rate, 0), 1)) as order_tax',
            'SUM(shipping_cost / COALESCE(NULLIF(exchange_rate, 0), 1)) as shipping_cost',
            'SUM(grand_total / COALESCE(NULLIF(exchange_rate, 0), 1)) as grand_total',
        ];

        for ($day = 1; $day <= $number_of_day; $day++) {
            $date = sprintf('%d-%s-%02d', $year, $month, $day);

            $saleQuery = Sale::whereDate('created_at', $date)
                ->when($this->own_data, fn ($q) => $q->where('user_id', $this->current_user_id))
                ->when($warehouse_id > 0, fn ($q) => $q->where('warehouse_id', $warehouse_id))
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->where('sale_type', '!=', 'opening balance')
                        ->orWhereNull('sale_type');
                });

            $sale_data = $saleQuery->selectRaw(implode(',', $queryFields))->first();

            $days[$day] = [
                'total_discount' => number_format((float) ($sale_data->total_discount ?? 0), config('decimal')),
                'order_discount' => number_format((float) ($sale_data->order_discount ?? 0), config('decimal')),
                'total_tax' => number_format((float) ($sale_data->total_tax ?? 0), config('decimal')),
                'order_tax' => number_format((float) ($sale_data->order_tax ?? 0), config('decimal')),
                'shipping_cost' => number_format((float) ($sale_data->shipping_cost ?? 0), config('decimal')),
                'grand_total' => number_format((float) ($sale_data->grand_total ?? 0), config('decimal')),
            ];
        }

        $monthStart = strtotime($year.'-'.$month.'-01');

        return [
            'year' => $year,
            'month' => $month,
            'month_label' => date('F Y', $monthStart),
            'warehouse_id' => $warehouse_id,
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'start_day' => (int) date('w', $monthStart) + 1,
            'number_of_day' => $number_of_day,
            'prev_year' => date('Y', strtotime('-1 month', $monthStart)),
            'prev_month' => date('m', strtotime('-1 month', $monthStart)),
            'next_year' => date('Y', strtotime('+1 month', $monthStart)),
            'next_month' => date('m', strtotime('+1 month', $monthStart)),
            'days' => $days,
        ];
    }

    private function dailySaleBladeArrays(array $days): array
    {
        $total_discount = [];
        $order_discount = [];
        $total_tax = [];
        $order_tax = [];
        $shipping_cost = [];
        $grand_total = [];

        foreach ($days as $day => $metrics) {
            $total_discount[$day] = $metrics['total_discount'];
            $order_discount[$day] = $metrics['order_discount'];
            $total_tax[$day] = $metrics['total_tax'];
            $order_tax[$day] = $metrics['order_tax'];
            $shipping_cost[$day] = $metrics['shipping_cost'];
            $grand_total[$day] = $metrics['grand_total'];
        }

        return compact(
            'total_discount',
            'order_discount',
            'total_tax',
            'order_tax',
            'shipping_cost',
            'grand_total'
        );
    }

    public function dailySale(Request $request, $year, $month)
    {
        if (!$this->userCanDailySale()) {
            return $this->denyDailySaleAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildDailySalePayload((int) $year, $month, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->dailySaleBladeArrays($days));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.daily_sale_table', compact(
                'total_discount', 'order_discount', 'total_tax', 'order_tax',
                'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
                'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month'
            ))->render();
        }

        return view('backend.report.daily_sale', compact(
            'total_discount', 'order_discount', 'total_tax', 'order_tax',
            'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
            'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month',
            'lims_warehouse_list', 'warehouse_id'
        ));
    }

    public function dailySaleByWarehouse(Request $request, $year, $month)
    {
        if (!$this->userCanDailySale()) {
            return $this->denyDailySaleAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);

        if ($warehouse_id === 0) {
            return $this->dailySale($request, $year, $month);
        }

        $payload = $this->buildDailySalePayload((int) $year, $month, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->dailySaleBladeArrays($days));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.daily_sale_table', compact(
                'total_discount', 'order_discount', 'total_tax', 'order_tax',
                'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
                'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month'
            ))->render();
        }

        return view('backend.report.daily_sale', compact(
            'total_discount', 'order_discount', 'total_tax', 'order_tax',
            'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
            'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month',
            'lims_warehouse_list', 'warehouse_id'
        ));
    }

    private function userCanDailyPurchase(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('daily-purchase');
    }

    private function denyDailyPurchaseAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildDailyPurchasePayload(int $year, $month, int $warehouse_id = 0): array
    {
        $month = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $number_of_day = (int) date('t', mktime(0, 0, 0, (int) $month, 1, $year));
        $days = [];

        $queryFields = [
            'SUM(total_discount / COALESCE(NULLIF(exchange_rate, 0), 1)) as total_discount',
            'SUM(order_discount / COALESCE(NULLIF(exchange_rate, 0), 1)) as order_discount',
            'SUM(total_tax / COALESCE(NULLIF(exchange_rate, 0), 1)) as total_tax',
            'SUM(order_tax / COALESCE(NULLIF(exchange_rate, 0), 1)) as order_tax',
            'SUM(shipping_cost / COALESCE(NULLIF(exchange_rate, 0), 1)) as shipping_cost',
            'SUM(grand_total / COALESCE(NULLIF(exchange_rate, 0), 1)) as grand_total',
        ];

        for ($day = 1; $day <= $number_of_day; $day++) {
            $date = sprintf('%d-%s-%02d', $year, $month, $day);

            $purchaseQuery = Purchase::whereDate('created_at', $date)
                ->when($this->own_data, fn ($q) => $q->where('user_id', $this->current_user_id))
                ->when($warehouse_id > 0, fn ($q) => $q->where('warehouse_id', $warehouse_id))
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->where('purchase_type', '!=', 'opening balance')
                        ->orWhereNull('purchase_type');
                });

            $purchase_data = $purchaseQuery->selectRaw(implode(',', $queryFields))->first();

            $days[$day] = [
                'total_discount' => $purchase_data->total_discount ?? 0,
                'order_discount' => $purchase_data->order_discount ?? 0,
                'total_tax' => $purchase_data->total_tax ?? 0,
                'order_tax' => $purchase_data->order_tax ?? 0,
                'shipping_cost' => $purchase_data->shipping_cost ?? 0,
                'grand_total' => $purchase_data->grand_total ?? 0,
            ];
        }

        $monthStart = strtotime($year.'-'.$month.'-01');

        return [
            'year' => $year,
            'month' => $month,
            'month_label' => date('F Y', $monthStart),
            'warehouse_id' => $warehouse_id,
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'start_day' => (int) date('w', $monthStart) + 1,
            'number_of_day' => $number_of_day,
            'prev_year' => date('Y', strtotime('-1 month', $monthStart)),
            'prev_month' => date('m', strtotime('-1 month', $monthStart)),
            'next_year' => date('Y', strtotime('+1 month', $monthStart)),
            'next_month' => date('m', strtotime('+1 month', $monthStart)),
            'days' => collect($days)->map(fn ($metrics) => [
                'total_discount' => number_format((float) $metrics['total_discount'], config('decimal')),
                'order_discount' => number_format((float) $metrics['order_discount'], config('decimal')),
                'total_tax' => number_format((float) $metrics['total_tax'], config('decimal')),
                'order_tax' => number_format((float) $metrics['order_tax'], config('decimal')),
                'shipping_cost' => number_format((float) $metrics['shipping_cost'], config('decimal')),
                'grand_total' => number_format((float) $metrics['grand_total'], config('decimal')),
            ])->all(),
            'days_raw' => $days,
        ];
    }

    private function dailyPurchaseBladeArrays(array $daysRaw): array
    {
        $total_discount = [];
        $order_discount = [];
        $total_tax = [];
        $order_tax = [];
        $shipping_cost = [];
        $grand_total = [];

        foreach ($daysRaw as $day => $metrics) {
            $total_discount[$day] = $metrics['total_discount'];
            $order_discount[$day] = $metrics['order_discount'];
            $total_tax[$day] = $metrics['total_tax'];
            $order_tax[$day] = $metrics['order_tax'];
            $shipping_cost[$day] = $metrics['shipping_cost'];
            $grand_total[$day] = $metrics['grand_total'];
        }

        return compact(
            'total_discount',
            'order_discount',
            'total_tax',
            'order_tax',
            'shipping_cost',
            'grand_total'
        );
    }

    public function dailyPurchase(Request $request, $year, $month)
    {
        if (!$this->userCanDailyPurchase()) {
            return $this->denyDailyPurchaseAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildDailyPurchasePayload((int) $year, $month, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            unset($payload['days_raw']);

            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->dailyPurchaseBladeArrays($days_raw));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        return view('backend.report.daily_purchase', compact(
            'total_discount', 'order_discount', 'total_tax', 'order_tax',
            'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
            'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month',
            'lims_warehouse_list', 'warehouse_id'
        ));
    }

    public function dailyPurchaseByWarehouse(Request $request, $year, $month)
    {
        if (!$this->userCanDailyPurchase()) {
            return $this->denyDailyPurchaseAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);

        if ($warehouse_id === 0) {
            return $this->dailyPurchase($request, $year, $month);
        }

        $payload = $this->buildDailyPurchasePayload((int) $year, $month, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            unset($payload['days_raw']);

            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->dailyPurchaseBladeArrays($days_raw));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.daily_purchase_table', compact(
                'total_discount', 'order_discount', 'total_tax', 'order_tax',
                'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
                'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month'
            ))->render();
        }

        return view('backend.report.daily_purchase', compact(
            'total_discount', 'order_discount', 'total_tax', 'order_tax',
            'shipping_cost', 'grand_total', 'start_day', 'year', 'month',
            'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month',
            'lims_warehouse_list', 'warehouse_id'
        ));
    }

    private function userCanMonthlySale(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('monthly-sale');
    }

    private function denyMonthlySaleAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildMonthlySalePayload(int $year, int $warehouse_id = 0): array
    {
        $monthLabels = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        $months = [];
        $start = strtotime($year.'-01-01');
        $end = strtotime($year.'-12-31');
        $monthIndex = 0;

        while ($start <= $end) {
            $monthNum = (int) date('m', $start);
            $numberOfDay = (int) date('t', $start);
            $startDate = sprintf('%d-%02d-01', $year, $monthNum);
            $endDate = sprintf('%d-%02d-%02d', $year, $monthNum, $numberOfDay);

            $saleQuery = Sale::whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate)
                ->when($this->own_data, fn ($q) => $q->where('user_id', $this->current_user_id))
                ->when($warehouse_id > 0, fn ($q) => $q->where('warehouse_id', $warehouse_id))
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->where('sale_type', '!=', 'opening balance')
                        ->orWhereNull('sale_type');
                });

            $exchange = 'COALESCE(NULLIF(exchange_rate, 0), 1)';
            $saleData = $saleQuery->selectRaw("
                SUM(total_discount / {$exchange}) as total_discount,
                SUM(order_discount / {$exchange}) as order_discount,
                SUM(total_tax / {$exchange}) as total_tax,
                SUM(order_tax / {$exchange}) as order_tax,
                SUM(shipping_cost / {$exchange}) as shipping_cost,
                SUM(grand_total / {$exchange}) as grand_total
            ")->first();

            $months[] = [
                'index' => $monthIndex + 1,
                'label' => $monthLabels[$monthIndex],
                'total_discount' => number_format((float) ($saleData->total_discount ?? 0), config('decimal'), '.', ''),
                'order_discount' => number_format((float) ($saleData->order_discount ?? 0), config('decimal'), '.', ''),
                'total_tax' => number_format((float) ($saleData->total_tax ?? 0), config('decimal'), '.', ''),
                'order_tax' => number_format((float) ($saleData->order_tax ?? 0), config('decimal'), '.', ''),
                'shipping_cost' => number_format((float) ($saleData->shipping_cost ?? 0), config('decimal'), '.', ''),
                'grand_total' => number_format((float) ($saleData->grand_total ?? 0), config('decimal'), '.', ''),
            ];

            $start = strtotime('+1 month', $start);
            $monthIndex++;
        }

        return [
            'year' => $year,
            'prev_year' => $year - 1,
            'next_year' => $year + 1,
            'warehouse_id' => $warehouse_id,
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'months' => $months,
        ];
    }

    private function monthlySaleBladeArrays(array $months): array
    {
        $total_discount = [];
        $order_discount = [];
        $total_tax = [];
        $order_tax = [];
        $shipping_cost = [];
        $total = [];

        foreach ($months as $month) {
            $total_discount[] = $month['total_discount'];
            $order_discount[] = $month['order_discount'];
            $total_tax[] = $month['total_tax'];
            $order_tax[] = $month['order_tax'];
            $shipping_cost[] = $month['shipping_cost'];
            $total[] = $month['grand_total'];
        }

        return compact(
            'total_discount',
            'order_discount',
            'total_tax',
            'order_tax',
            'shipping_cost',
            'total'
        );
    }

    public function monthlySale(Request $request, $year)
    {
        if (!$this->userCanMonthlySale()) {
            return $this->denyMonthlySaleAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildMonthlySalePayload((int) $year, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->monthlySaleBladeArrays($months));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        return view('backend.report.monthly_sale', compact(
            'year', 'total_discount', 'order_discount', 'total_tax',
            'order_tax', 'shipping_cost', 'total', 'lims_warehouse_list', 'warehouse_id'
        ));
    }

    public function monthlySaleByWarehouse(Request $request, $year)
    {
        if (!$this->userCanMonthlySale()) {
            return $this->denyMonthlySaleAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);

        if ($warehouse_id === 0) {
            return $this->monthlySale($request, $year);
        }

        $payload = $this->buildMonthlySalePayload((int) $year, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->monthlySaleBladeArrays($months));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.monthly_sale_table', compact(
                'year', 'total_discount', 'order_discount', 'total_tax',
                'order_tax', 'shipping_cost', 'total'
            ))->render();
        }

        return view('backend.report.monthly_sale', compact(
            'year', 'total_discount', 'order_discount', 'total_tax',
            'order_tax', 'shipping_cost', 'total', 'lims_warehouse_list', 'warehouse_id'
        ));
    }

    private function userCanMonthlyPurchase(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('monthly-purchase');
    }

    private function denyMonthlyPurchaseAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildMonthlyPurchasePayload(int $year, int $warehouse_id = 0): array
    {
        $monthLabels = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        $months = [];
        $start = strtotime($year.'-01-01');
        $end = strtotime($year.'-12-31');
        $monthIndex = 0;

        while ($start <= $end) {
            $monthNum = (int) date('m', $start);
            $numberOfDay = (int) date('t', $start);
            $startDate = sprintf('%d-%02d-01', $year, $monthNum);
            $endDate = sprintf('%d-%02d-%02d', $year, $monthNum, $numberOfDay);

            $purchaseQuery = Purchase::whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate)
                ->when($this->own_data, fn ($q) => $q->where('user_id', $this->current_user_id))
                ->when($warehouse_id > 0, fn ($q) => $q->where('warehouse_id', $warehouse_id))
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q->where('purchase_type', '!=', 'opening balance')
                        ->orWhereNull('purchase_type');
                });

            $exchange = 'COALESCE(NULLIF(exchange_rate, 0), 1)';
            $purchaseData = $purchaseQuery->selectRaw("
                SUM(total_discount / {$exchange}) as total_discount,
                SUM(order_discount / {$exchange}) as order_discount,
                SUM(total_tax / {$exchange}) as total_tax,
                SUM(order_tax / {$exchange}) as order_tax,
                SUM(shipping_cost / {$exchange}) as shipping_cost,
                SUM(grand_total / {$exchange}) as grand_total
            ")->first();

            $months[] = [
                'index' => $monthIndex + 1,
                'label' => $monthLabels[$monthIndex],
                'total_discount' => number_format((float) ($purchaseData->total_discount ?? 0), config('decimal'), '.', ''),
                'order_discount' => number_format((float) ($purchaseData->order_discount ?? 0), config('decimal'), '.', ''),
                'total_tax' => number_format((float) ($purchaseData->total_tax ?? 0), config('decimal'), '.', ''),
                'order_tax' => number_format((float) ($purchaseData->order_tax ?? 0), config('decimal'), '.', ''),
                'shipping_cost' => number_format((float) ($purchaseData->shipping_cost ?? 0), config('decimal'), '.', ''),
                'grand_total' => number_format((float) ($purchaseData->grand_total ?? 0), config('decimal'), '.', ''),
            ];

            $start = strtotime('+1 month', $start);
            $monthIndex++;
        }

        return [
            'year' => $year,
            'prev_year' => $year - 1,
            'next_year' => $year + 1,
            'warehouse_id' => $warehouse_id,
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'months' => $months,
        ];
    }

    private function monthlyPurchaseBladeArrays(array $months): array
    {
        $total_discount = [];
        $order_discount = [];
        $total_tax = [];
        $order_tax = [];
        $shipping_cost = [];
        $grand_total = [];

        foreach ($months as $month) {
            $total_discount[] = $month['total_discount'];
            $order_discount[] = $month['order_discount'];
            $total_tax[] = $month['total_tax'];
            $order_tax[] = $month['order_tax'];
            $shipping_cost[] = $month['shipping_cost'];
            $grand_total[] = $month['grand_total'];
        }

        return compact(
            'total_discount',
            'order_discount',
            'total_tax',
            'order_tax',
            'shipping_cost',
            'grand_total'
        );
    }

    public function monthlyPurchase(Request $request, $year)
    {
        if (!$this->userCanMonthlyPurchase()) {
            return $this->denyMonthlyPurchaseAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $payload = $this->buildMonthlyPurchasePayload((int) $year, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->monthlyPurchaseBladeArrays($months));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        return view('backend.report.monthly_purchase', compact(
            'year', 'total_discount', 'order_discount', 'total_tax',
            'order_tax', 'shipping_cost', 'grand_total', 'lims_warehouse_list', 'warehouse_id'
        ));
    }

    public function monthlyPurchaseByWarehouse(Request $request, $year)
    {
        if (!$this->userCanMonthlyPurchase()) {
            return $this->denyMonthlyPurchaseAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);

        if ($warehouse_id === 0) {
            return $this->monthlyPurchase($request, $year);
        }

        $payload = $this->buildMonthlyPurchasePayload((int) $year, $warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        extract($payload);
        extract($this->monthlyPurchaseBladeArrays($months));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();

        if ($request->ajax()) {
            return view('backend.report.partials.monthly_purchase_table', compact(
                'year', 'total_discount', 'order_discount', 'total_tax',
                'order_tax', 'shipping_cost', 'grand_total'
            ))->render();
        }

        return view('backend.report.monthly_purchase', compact(
            'year', 'total_discount', 'order_discount', 'total_tax',
            'order_tax', 'shipping_cost', 'grand_total', 'lims_warehouse_list', 'warehouse_id'
        ));
    }

    public function bestSeller(Request $request)
    {
        if (!$this->userCanBestSeller()) {
            return $this->denyBestSellerAccess($request);
        }

        $warehouse_id = 0;
        $payload = $this->buildBestSellerPayload($warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        return view('backend.report.best_seller', [
            'product' => $payload['products'],
            'sold_qty' => $payload['sold_qty'],
            'start_month' => $payload['start_month'],
            'lims_warehouse_list' => Warehouse::where('is_active', true)->get(),
            'warehouse_id' => $warehouse_id,
        ]);
    }

    public function bestSellerByWarehouse(Request $request)
    {
        if (!$this->userCanBestSeller()) {
            return $this->denyBestSellerAccess($request);
        }

        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);

        if ($warehouse_id === 0 && !$this->wantsSpaResponse($request)) {
            return redirect()->back();
        }

        $payload = $this->buildBestSellerPayload($warehouse_id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        return view('backend.report.best_seller', [
            'product' => $payload['products'],
            'sold_qty' => $payload['sold_qty'],
            'start_month' => $payload['start_month'],
            'lims_warehouse_list' => Warehouse::where('is_active', true)->get(),
            'warehouse_id' => $warehouse_id,
        ]);
    }

    private function userCanBestSeller(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('best-seller');
    }

    private function denyBestSellerAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function bestSellerThemeColors(string $theme): array
    {
        $map = [
            'default.css' => ['color' => '#733686', 'color_rgba' => 'rgba(115, 54, 134, 0.8)'],
            'green.css' => ['color' => '#2ecc71', 'color_rgba' => 'rgba(46, 204, 113, 0.8)'],
            'blue.css' => ['color' => '#3498db', 'color_rgba' => 'rgba(52, 152, 219, 0.8)'],
            'dark.css' => ['color' => '#34495e', 'color_rgba' => 'rgba(52, 73, 94, 0.8)'],
        ];

        return $map[$theme] ?? $map['default.css'];
    }

    private function buildBestSellerPayload(int $warehouse_id): array
    {
        $items = [];
        $start = strtotime(date('Y-m', strtotime('-2 months')).'-01');
        $end = strtotime(date('Y').'-'.date('m').'-31');

        while ($start <= $end) {
            $number_of_day = date('t', mktime(0, 0, 0, date('m', $start), 1, date('Y', $start)));
            $start_date = date('Y-m', $start).'-01';
            $end_date = date('Y-m', $start).'-'.$number_of_day;
            $month_label = date('F Y', $start);

            $best_selling_qty = Product_Sale::join('sales', 'product_sales.sale_id', '=', 'sales.id')
                ->select(DB::raw('product_sales.product_id, sum(product_sales.qty) as sold_qty'))
                ->whereNull('sales.deleted_at')
                ->whereDate('sales.created_at', '>=', $start_date)
                ->whereDate('sales.created_at', '<=', $end_date)
                ->when($this->own_data, function ($query) {
                    $query->where('sales.user_id', $this->current_user_id);
                })
                ->when($warehouse_id > 0, function ($query) use ($warehouse_id) {
                    $query->where('sales.warehouse_id', $warehouse_id);
                })
                ->groupBy('product_sales.product_id')
                ->orderBy('sold_qty', 'desc')
                ->take(1)
                ->get();

            if ($best_selling_qty->isEmpty()) {
                $items[] = [
                    'month' => $month_label,
                    'product' => '',
                    'sold_qty' => 0,
                ];
            } else {
                foreach ($best_selling_qty as $best_seller) {
                    $product_data = Product::find($best_seller->product_id);
                    $items[] = [
                        'month' => $month_label,
                        'product' => $product_data
                            ? ($product_data->name.': '.$product_data->code)
                            : '',
                        'sold_qty' => (float) $best_seller->sold_qty,
                    ];
                }
            }

            $start = strtotime('+1 month', $start);
        }

        $general_setting = GeneralSetting::latest()->first();

        return [
            'warehouse_id' => $warehouse_id,
            'start_month' => date('F Y', strtotime('-2 month')),
            'end_month' => date('F Y'),
            'warehouses' => Warehouse::where('is_active', true)
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'theme' => $this->bestSellerThemeColors($general_setting->theme ?? 'default.css'),
            'items' => $items,
            'products' => array_column($items, 'product'),
            'sold_qty' => array_column($items, 'sold_qty'),
        ];
    }

    public function summary(Request $request)
    {
        $start_date = date('Y-m').'-'.'01';
        $end_date = date('Y-m-d');
        $warehouse_id = 0;

        $lims_warehouse_list = Cache::remember('warehouse_list', 60*60*24*365, function () {
            return Warehouse::where('is_active', true)->get();
        });

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => $warehouse_id,
                'warehouses' => $lims_warehouse_list->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])->values(),
            ]);
        }

        return view('backend.report.profit_loss', compact('start_date', 'end_date', 'warehouse_id', 'lims_warehouse_list'));

    }

    private function profitLossAggregateRow($collection, array $fields): array
    {
        $row = $collection[0] ?? null;
        $payload = [];

        foreach ($fields as $field) {
            $payload[$field] = (float) ($row?->$field ?? 0);
        }

        return $payload;
    }

    private function buildProfitLossPayload(
        $purchase,
        $sale,
        $return,
        $purchase_return,
        $product_cost,
        $product_tax,
        $expense,
        $income,
        $payroll,
        array $warehouse_name,
        array $warehouse_sale,
        array $warehouse_purchase,
        array $warehouse_return,
        array $warehouse_purchase_return,
        array $warehouse_expense,
        $general_setting,
        $total_purchase,
        $total_sale,
        $total_return,
        $total_purchase_return,
        $payment_recieved,
        $payment_recieved_number,
        $payment_sent,
        $payment_sent_number,
        $cash_payment_sale,
        $cheque_payment_sale,
        $credit_card_payment_sale,
        $gift_card_payment_sale,
        $paypal_payment_sale,
        $deposit_payment_sale,
        $cash_payment_purchase,
        $cheque_payment_purchase,
        $credit_card_payment_purchase,
        $total_expense,
        $total_income,
        $total_payroll
    ): array {
        $decimal = (int) ($general_setting->decimal ?? 2);

        $warehouses = [];
        foreach ($warehouse_name as $key => $name) {
            $warehouses[] = [
                'name' => $name,
                'sale' => $this->profitLossAggregateRow($warehouse_sale[$key] ?? collect(), ['grand_total', 'tax']),
                'purchase' => $this->profitLossAggregateRow($warehouse_purchase[$key] ?? collect(), ['grand_total', 'tax']),
                'return' => $this->profitLossAggregateRow($warehouse_return[$key] ?? collect(), ['grand_total', 'tax']),
                'purchase_return' => $this->profitLossAggregateRow($warehouse_purchase_return[$key] ?? collect(), ['grand_total', 'tax']),
                'expense' => (float) ($warehouse_expense[$key] ?? 0),
            ];
        }

        return [
            'decimal' => $decimal,
            'purchase' => array_merge(
                $this->profitLossAggregateRow($purchase, ['grand_total', 'paid_amount', 'tax', 'discount']),
                ['count' => (int) $total_purchase]
            ),
            'sale' => array_merge(
                $this->profitLossAggregateRow($sale, ['grand_total', 'shipping_cost', 'paid_amount', 'tax', 'discount']),
                ['count' => (int) $total_sale]
            ),
            'return' => array_merge(
                $this->profitLossAggregateRow($return, ['grand_total', 'tax']),
                ['count' => (int) $total_return]
            ),
            'purchase_return' => array_merge(
                $this->profitLossAggregateRow($purchase_return, ['grand_total', 'tax']),
                ['count' => (int) $total_purchase_return]
            ),
            'product_cost' => (float) $product_cost,
            'product_tax' => (float) $product_tax,
            'expense' => (float) $expense,
            'total_expense' => (int) $total_expense,
            'income' => (float) $income,
            'total_income' => (int) $total_income,
            'payroll' => (float) $payroll,
            'total_payroll' => (int) $total_payroll,
            'payment_received' => [
                'amount' => (float) $payment_recieved,
                'count' => (int) $payment_recieved_number,
                'cash' => (float) $cash_payment_sale,
                'cheque' => (float) $cheque_payment_sale,
                'credit_card' => (float) $credit_card_payment_sale,
                'gift_card' => (float) $gift_card_payment_sale,
                'paypal' => (float) $paypal_payment_sale,
                'deposit' => (float) $deposit_payment_sale,
            ],
            'payment_sent' => [
                'amount' => (float) $payment_sent,
                'count' => (int) $payment_sent_number,
                'cash' => (float) $cash_payment_purchase,
                'cheque' => (float) $cheque_payment_purchase,
                'credit_card' => (float) $credit_card_payment_purchase,
            ],
            'warehouses' => $warehouses,
        ];
    }

    private function dateFilter($query, $start_date, $end_date, $table = null)
    {
        $column = $table ? $table . '.created_at' : 'created_at';

        return $query->whereBetween($column, [
            $start_date . ' 00:00:00',
            $end_date . ' 23:59:59'
        ]);
    }

    private function userFilter($query, $table = null)
    {
        if ($this->own_data) {
            $query->where(($table ? $table.'.' : '') . 'user_id', $this->current_user_id);
        }
        return $query;
    }

    private function warehouseFilter($query, $warehouse_id, $table = null)
    {
        if (!empty($warehouse_id)) {
            $query->where(($table ? $table.'.' : '') . 'warehouse_id', $warehouse_id);
        }
        return $query;
    }

    private function excludeOpening($query, $field)
    {
        return $query->where(function ($q) use ($field) {
            $q->where($field, '!=', 'opening balance')
            ->orWhereNull($field);
        });
    }

    public function profitLoss(Request $request)
    {
        $start_date = $request['start_date'];
        $end_date = $request['end_date'];
        $warehouse_id = $request['warehouse_id'];

        if(isset($warehouse_id) && $warehouse_id != 0){
            $lims_warehouse_all = Warehouse::where('id',$warehouse_id)->get();
            $lims_warehouse = Warehouse::where('id',$warehouse_id)->first();
        }else{
            $lims_warehouse_all = Warehouse::where('is_active',true)->get();
            $lims_warehouse = null;
        }

        $query1 = [
            'SUM(grand_total / exchange_rate) AS grand_total',
            'SUM(shipping_cost / exchange_rate) AS shipping_cost',
            'SUM(paid_amount / exchange_rate) AS paid_amount',
            'SUM((total_tax + order_tax) / exchange_rate) AS tax',
            'SUM((total_discount + order_discount) / exchange_rate) AS discount'
        ];

        $query2 = [
            'SUM(grand_total / exchange_rate) AS grand_total',
            'SUM((total_tax + order_tax) / exchange_rate) AS tax'
        ];

        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();

        $product_sale_data = Product_Sale::join('sales', 'product_sales.sale_id', '=', 'sales.id')
            ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id,
                sum(product_sales.qty) as sold_qty,
                sum(product_sales.return_qty) as return_qty,
                sum(product_sales.total / sales.exchange_rate) as sold_amount'))
            ->whereNull('sales.deleted_at')
            ->where(function($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->when($this->own_data, function ($query) {
                $query->where('sales.user_id', $this->current_user_id);
            })
            ->whereDate('sales.created_at','>=',$start_date)
            ->whereDate('sales.created_at','<=',$end_date);
        if($warehouse_id){
            $product_sale_data->where('sales.warehouse_id',$warehouse_id);
        }
        $product_sale_data = $product_sale_data
                ->groupBy('product_sales.product_id','product_sales.product_batch_id')
                ->get();

        config()->set('database.connections.mysql.strict', true);
        DB::reconnect();

        $data = $this->calculateAverageCOGS($product_sale_data);
        $product_cost = $data[0];
        $product_tax = $data[1];

        // ================== PURCHASE QUERIES ==================
        $purchaseQuery = Purchase::query();
        $purchaseQuery = $this->dateFilter($purchaseQuery, $start_date, $end_date);
        $purchaseQuery = $this->excludeOpening($purchaseQuery, 'purchase_type');
        $purchaseQuery = $this->userFilter($purchaseQuery);
        $purchaseQuery = $this->warehouseFilter($purchaseQuery, $warehouse_id);
        $purchaseQuery->whereNull('deleted_at');

        $purchase = (clone $purchaseQuery)->selectRaw(implode(',', $query1))->get();
        $total_purchase = (clone $purchaseQuery)->count();

        // ================== SALE QUERIES ==================
        $saleQuery = Sale::query();
        $saleQuery = $this->dateFilter($saleQuery, $start_date, $end_date);
        $saleQuery = $this->excludeOpening($saleQuery, 'sale_type');
        $saleQuery = $this->userFilter($saleQuery);
        $saleQuery = $this->warehouseFilter($saleQuery, $warehouse_id);
        $saleQuery->whereNull('deleted_at');

        $sale = (clone $saleQuery)->selectRaw(implode(',', $query1))->get();
        $total_sale = (clone $saleQuery)->count();

        // ================== RETURN QUERIES ==================
        $returnQuery = Returns::query();
        $returnQuery = $this->dateFilter($returnQuery, $start_date, $end_date);
        $returnQuery = $this->userFilter($returnQuery);
        $returnQuery = $this->warehouseFilter($returnQuery, $warehouse_id);

        $return = (clone $returnQuery)->selectRaw(implode(',', $query2))->get();
        $total_return = (clone $returnQuery)->count();

        // ================== PURCHASE RETURN QUERIES ==================
        $returnPurchaseQuery = ReturnPurchase::query();
        $returnPurchaseQuery = $this->dateFilter($returnPurchaseQuery, $start_date, $end_date);
        $returnPurchaseQuery = $this->userFilter($returnPurchaseQuery);
        $returnPurchaseQuery = $this->warehouseFilter($returnPurchaseQuery, $warehouse_id);

        $purchase_return = (clone $returnPurchaseQuery)->selectRaw(implode(',', $query2))->get();
        $total_purchase_return = (clone $returnPurchaseQuery)->count();

        // ================== EXPENSE QUERIES ==================
        $expenseQuery = Expense::query();
        $expenseQuery = $this->dateFilter($expenseQuery, $start_date, $end_date);
        $expenseQuery = $this->userFilter($expenseQuery);
        $expenseQuery = $this->warehouseFilter($expenseQuery, $warehouse_id);

        $expense = (clone $expenseQuery)->sum('amount');
        $total_expense = (clone $expenseQuery)->count();

        // ================== INCOME QUERIES ==================
        $incomeQuery = Income::query();
        $incomeQuery = $this->dateFilter($incomeQuery, $start_date, $end_date);
        $incomeQuery = $this->userFilter($incomeQuery);
        $incomeQuery = $this->warehouseFilter($incomeQuery, $warehouse_id);

        $income = (clone $incomeQuery)->sum('amount');
        $total_income = (clone $incomeQuery)->count();

        // ================== PAYROLL QUERIES ==================
        $payrollQuery = Payroll::query();
        $payrollQuery = $this->dateFilter($payrollQuery, $start_date, $end_date);
        $payrollQuery = $this->userFilter($payrollQuery);
        
        $payroll = (clone $payrollQuery)->sum('amount');
        $total_payroll = (clone $payrollQuery)->count();

        // ================== INVENTORY COUNT ==================
        $total_item = DB::table('product_warehouse')
                    ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                    ->where([
                        ['products.is_active', true],
                        ['product_warehouse.qty', '>' , 0]
                    ]);
        if(isset($warehouse_id) && $warehouse_id != 0){
            $total_item = $total_item->where('product_warehouse.warehouse_id', $warehouse_id);
        }
        $total_item = $total_item->count();

        // ================== PAYMENT RECEIVED QUERIES WITH WAREHOUSE FILTER ==================
        $paymentSaleBase = DB::table('payments')
    ->join('sales', 'payments.sale_id', '=', 'sales.id')
    ->whereNotNull('payments.sale_id');

$paymentSaleBase = $this->dateFilter($paymentSaleBase, $start_date, $end_date, 'payments');
$paymentSaleBase = $this->userFilter($paymentSaleBase, 'sales');
$paymentSaleBase = $this->warehouseFilter($paymentSaleBase, $warehouse_id, 'sales');

$payment_recieved_number = (clone $paymentSaleBase)->count();
$payment_recieved = (clone $paymentSaleBase)->sum(DB::raw('payments.amount / payments.exchange_rate'));

// Payment breakdown
$methods = ['Credit Card', 'Cheque', 'Gift Card', 'Paypal', 'Deposit'];

$paymentBreakdown = [];

foreach ($methods as $method) {
    $paymentBreakdown[$method] = (clone $paymentSaleBase)
        ->where('payments.paying_method', $method)
        ->sum(DB::raw('payments.amount / payments.exchange_rate'));
}

$credit_card_payment_sale = $paymentBreakdown['Credit Card'];
$cheque_payment_sale = $paymentBreakdown['Cheque'];
$gift_card_payment_sale = $paymentBreakdown['Gift Card'];
$paypal_payment_sale = $paymentBreakdown['Paypal'];
$deposit_payment_sale = $paymentBreakdown['Deposit'];

$cash_payment_sale = $payment_recieved - array_sum($paymentBreakdown);

$paymentPurchaseBase = DB::table('payments')
    ->join('purchases', 'payments.purchase_id', '=', 'purchases.id')
    ->whereNotNull('payments.purchase_id');

$paymentPurchaseBase = $this->dateFilter($paymentPurchaseBase, $start_date, $end_date, 'payments');
$paymentPurchaseBase = $this->userFilter($paymentPurchaseBase, 'purchases');
$paymentPurchaseBase = $this->warehouseFilter($paymentPurchaseBase, $warehouse_id, 'purchases');

$payment_sent_number = (clone $paymentPurchaseBase)->count();
$payment_sent = (clone $paymentPurchaseBase)->sum(DB::raw('payments.amount / payments.exchange_rate'));

$cheque_payment_purchase = (clone $paymentPurchaseBase)
    ->where('payments.paying_method', 'Cheque')
    ->sum(DB::raw('payments.amount / payments.exchange_rate'));

$credit_card_payment_purchase = (clone $paymentPurchaseBase)
    ->where('payments.paying_method', 'Gift Card') // ⚠️ check this, looks wrong
    ->sum(DB::raw('payments.amount / payments.exchange_rate'));

$cash_payment_purchase = $payment_sent - $cheque_payment_purchase - $credit_card_payment_purchase;

        // ================== WAREHOUSE WISE BREAKDOWN ==================
        $warehouse_name = [];
        $warehouse_sale = [];
        $warehouse_purchase = [];
        $warehouse_return = [];
        $warehouse_purchase_return = [];
        $warehouse_expense = [];

        foreach ($lims_warehouse_all as $warehouse) {
            $warehouse_name[] = $warehouse->name;

            $warehouse_sale[] = Sale::where('warehouse_id', $warehouse->id)
                                    ->whereDate('created_at', '>=' , $start_date)
                                    ->whereDate('created_at', '<=' , $end_date)
                                    ->whereNull('deleted_at')
                                    ->where(function($q) {
                                        $q->where('sale_type', '!=', 'opening balance')
                                        ->orWhereNull('sale_type');
                                    })
                                    ->when($this->own_data,function($query) {
                                        $query->where('user_id',$this->current_user_id);
                                    })
                                    ->selectRaw(implode(',', $query2))
                                    ->get();

            $warehouse_purchase[] = Purchase::where('warehouse_id', $warehouse->id)
                                        ->whereDate('created_at', '>=' , $start_date)
                                        ->whereDate('created_at', '<=' , $end_date)
                                        ->whereNull('deleted_at')
                                        ->where(function($q) {
                                            $q->where('purchase_type', '!=', 'opening balance')
                                            ->orWhereNull('purchase_type');
                                        })
                                        ->selectRaw(implode(',', $query2))
                                        ->get();

            $warehouse_return[] = Returns::where('warehouse_id', $warehouse->id)
                                        ->whereDate('created_at', '>=' , $start_date)
                                        ->whereDate('created_at', '<=' , $end_date)
                                        ->selectRaw(implode(',', $query2))
                                        ->get();

            $warehouse_purchase_return[] = ReturnPurchase::where('warehouse_id', $warehouse->id)
                                                        ->whereDate('created_at', '>=' , $start_date)
                                                        ->whereDate('created_at', '<=' , $end_date)
                                                        ->selectRaw(implode(',', $query2))
                                                        ->get();

            $warehouse_expense[] = Expense::where('warehouse_id', $warehouse->id)
                                        ->whereDate('created_at', '>=' , $start_date)
                                        ->whereDate('created_at', '<=' , $end_date)
                                        ->sum('amount');
        }

        $lims_warehouse_list = Cache::remember('warehouse_list', 60*60*24*365, function () {
            return Warehouse::where('is_active', true)->get();
        });

        $general_setting = GeneralSetting::select('decimal')->first();

        $payload = $this->buildProfitLossPayload(
            $purchase,
            $sale,
            $return,
            $purchase_return,
            $product_cost,
            $product_tax,
            $expense,
            $income,
            $payroll,
            $warehouse_name,
            $warehouse_sale,
            $warehouse_purchase,
            $warehouse_return,
            $warehouse_purchase_return,
            $warehouse_expense,
            $general_setting,
            $total_purchase,
            $total_sale,
            $total_return,
            $total_purchase_return,
            $payment_recieved,
            $payment_recieved_number,
            $payment_sent,
            $payment_sent_number,
            $cash_payment_sale,
            $cheque_payment_sale,
            $credit_card_payment_sale,
            $gift_card_payment_sale,
            $paypal_payment_sale,
            $deposit_payment_sale,
            $cash_payment_purchase,
            $cheque_payment_purchase,
            $credit_card_payment_purchase,
            $total_expense,
            $total_income,
            $total_payroll
        );

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        if ($request->ajax()) {
            return view('backend.report.profit_loss_result', compact(
                'purchase',
                'sale',
                'return',
                'purchase_return',
                'product_cost',
                'product_tax',
                'expense',
                'income',
                'payroll',
                'warehouse_name',
                'warehouse_sale',
                'warehouse_purchase',
                'warehouse_return',
                'warehouse_purchase_return',
                'warehouse_expense',
                'general_setting',
                'total_purchase',
                'total_sale',
                'total_return',
                'total_purchase_return',
                'payment_recieved',
                'payment_recieved_number',
                'payment_sent',
                'payment_sent_number',
                'cash_payment_sale',
                'cheque_payment_sale',
                'credit_card_payment_sale',
                'gift_card_payment_sale',
                'paypal_payment_sale',
                'deposit_payment_sale',
                'cash_payment_purchase',
                'cheque_payment_purchase',
                'credit_card_payment_purchase',
                'total_expense',
                'total_income',
                'total_payroll'
            ));
        }

    }

    public function calculateAverageCOGS($product_sale_data)
    {
        $product_cost = 0;
        $product_tax = 0;
        foreach ($product_sale_data as $key => $product_sale) {
            $product_data = Product::select('type', 'product_list', 'variant_list', 'qty_list')->find($product_sale->product_id);
            if(@$product_data->type == 'combo') {
                $product_list = explode(",", $product_data->product_list);
                if($product_data->variant_list)
                    $variant_list = explode(",", $product_data->variant_list);
                else
                    $variant_list = [];
                $qty_list = explode(",", $product_data->qty_list);

                foreach ($product_list as $index => $product_id) {
                    if(count($variant_list) && $variant_list[$index]) {
                        $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where([
                            ['product_purchases.product_id', $product_id],
                            ['product_purchases.variant_id', $variant_list[$index] ]
                        ])
                        ->whereNull('purchases.deleted_at')
                        ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total')
                        ->get();
                    }
                    else {
                        $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where('product_purchases.product_id', $product_id)
                        ->whereNull('purchases.deleted_at')
                        ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total')
                        ->get();
                    }
                    $total_received_qty = 0;
                    $total_purchased_amount = 0;
                    $total_tax = 0;
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $qty_list[$index];
                    foreach ($product_purchase_data as $key => $product_purchase) {
                        $purchase_unit_data = Unit::select('operator', 'operation_value')->find($product_purchase->purchase_unit_id);
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;

                        $total_purchased_amount += $product_purchase->total /
                        (($product_purchase->exchange_rate && $product_purchase->exchange_rate != 0) ? $product_purchase->exchange_rate : 1);

                        $total_tax += $product_purchase->tax /
                        (($product_purchase->exchange_rate && $product_purchase->exchange_rate != 0) ? $product_purchase->exchange_rate : 1);
                    }
                    if($total_received_qty) {
                        $averageCost = $total_purchased_amount / $total_received_qty;
                        $averageTax = $total_tax / $total_received_qty;
                    }
                    else {
                        $averageCost = 0;
                        $averageTax = 0;
                    }
                    $product_cost += $sold_qty * $averageCost;
                    $product_tax += $sold_qty * $averageTax;
                }
            }
            else {
                if($product_sale->product_batch_id) {
                    $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where([
                        ['product_purchases.product_id', $product_sale->product_id],
                        ['product_purchases.product_batch_id', $product_sale->product_batch_id]
                    ])
                    ->whereNull('purchases.deleted_at')
                    ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total')
                    ->get();
                }
                elseif($product_sale->variant_id) {
                    $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where([
                        ['product_purchases.product_id', $product_sale->product_id],
                        ['product_purchases.variant_id', $product_sale->variant_id]
                    ])
                    ->whereNull('purchases.deleted_at')
                    ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total')
                    ->get();
                }
                else {
                    $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where('product_id', $product_sale->product_id)
                        ->whereNull('purchases.deleted_at')
                    ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total', 'purchases.exchange_rate')
                    ->get();
                }
                $total_received_qty = 0;
                $total_purchased_amount = 0;
                $total_tax = 0;
                if($product_sale->sale_unit_id) {
                    $sale_unit_data = Unit::select('operator', 'operation_value')->find($product_sale->sale_unit_id);
                    if($sale_unit_data->operator == '*')
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $sale_unit_data->operation_value;
                    else
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) / $sale_unit_data->operation_value;
                }
                else {
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty);
                }
                foreach ($product_purchase_data as $key => $product_purchase) {
                    $purchase_unit_data = Unit::select('operator', 'operation_value')->find($product_purchase->purchase_unit_id);
                    if($purchase_unit_data) {
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;

                        $total_purchased_amount += $product_purchase->total /
                        (($product_purchase->exchange_rate && $product_purchase->exchange_rate != 0) ? $product_purchase->exchange_rate : 1);

                        $total_tax += $product_purchase->tax /
                        (($product_purchase->exchange_rate && $product_purchase->exchange_rate != 0) ? $product_purchase->exchange_rate : 1);
                    }
                }
                if($total_received_qty) {
                    $averageCost = $total_purchased_amount / $total_received_qty;
                    $averageTax = $total_tax / $total_received_qty;
                }
                else {
                    $averageCost = 0;
                    $averageTax = 0;
                }
                $product_cost += $sold_qty * $averageCost;
                $product_tax += $sold_qty * $averageTax;
            }
        }
        return [$product_cost, $product_tax];
    }

    private function userCanProductReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('product-report');
    }

    private function denyProductReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function userCanStockReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('stock-report');
    }

    private function denyStockReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function productReport(Request $request)
    {
        if (!$this->userCanProductReport()) {
            return $this->denyProductReportAccess($request);
        }

        $data = $request->all();
        $start_date = $request->start_date ?? date('Y-m').'-'.'01';
        $end_date = $request->end_date ?? date('Y-m-d');
        $warehouse_id = $data['warehouse_id'] ?? 0;
        $category_id = $data['category_id'] ?? 0;
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $categories_list = Cache::remember('category_list', 60 * 60 * 24 * 365, function () {
            return Category::where('is_active', true)->get(['id', 'name']);
        });

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => (int) $warehouse_id,
                'category_id' => (int) $category_id,
                'warehouses' => $lims_warehouse_list->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])->values(),
                'categories' => $categories_list->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
                'role_id' => Auth::user()->role_id,
            ]);
        }

        return view('backend.report.product_report', compact('start_date', 'end_date', 'warehouse_id', 'category_id', 'lims_warehouse_list'));
    }

    public function productReportData(Request $request)
    {
        if (!$this->userCanProductReport()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return response()->json(['data' => []], 403);
        }

        // --- Input & safe defaults
        $start_date = $request->input('start_date') . ' 00:00:00';
        $end_date   = $request->input('end_date') . ' 23:59:59';
        $warehouse_id = (int) $request->input('warehouse_id', 0);
        $category_id = (int) $request->input('category_id', 0);
        $search       = $request->input('search.value', null);
        $draw         = (int) $request->input('draw', 1);
        $limit        = $request->input('length') != -1 ? (int)$request->input('length') : 1000;
        $start        = (int) $request->input('start', 0);
        $orderColumn  = $request->input('order.0.column');
        $columns = [1 => 'name']; // keep mapping consistent with your frontend
        $order = $columns[$orderColumn] ?? 'name';
        $dir   = $request->input('order.0.dir', 'asc');

        // --- Preload small reference tables once
        $units = DB::table('units')->get()->keyBy('id')->toArray(); // cached units

        // helper for unit conversion (keep it local)
        $convertQty = function ($qty, $unitId) use ($units) {
            if (!$unitId || !isset($units[$unitId])) {
                return (float)$qty;
            }
            $unit = $units[$unitId];
            if ($unit->operator === '*') {
                return (float)$qty * (float)$unit->operation_value;
            }
            return (float)$qty / (float)$unit->operation_value;
        };

        // --- 1) Build list of product IDs that have ANY stock (>0)
        $stockQuery = DB::table('product_warehouse')
            ->selectRaw('product_id, COALESCE(variant_id, 0) as variant_id, SUM(qty) as total_qty')
            ->groupBy('product_id', DB::raw('COALESCE(variant_id, 0)'));

        // Apply warehouse-specific filter ONLY when $warehouse_id != 0
        if ($warehouse_id != 0) {
            $stockQuery->where('warehouse_id', $warehouse_id);
        }

        // Only include products that have POSITIVE stock in that warehouse
        $stockRows = $stockQuery->havingRaw('SUM(qty) > 0')->get();

        // Build maps for stock:
        // stocksByProduct[product_id]['variants'][variant_id] = qty
        // stocksByProduct[product_id]['total'] = total qty across variants
        $stocksByProduct = [];
        foreach ($stockRows as $r) {
            $pid = (int)$r->product_id;
            $vid = (int)$r->variant_id;
            $qty = (float)$r->total_qty;
            if (!isset($stocksByProduct[$pid])) $stocksByProduct[$pid] = ['variants' => [], 'total' => 0.0];
            $stocksByProduct[$pid]['variants'][$vid] = $qty;
            $stocksByProduct[$pid]['total'] += $qty;
        }

        // If no product has stock, return empty result early
        if (empty($stocksByProduct)) {
            return response()->json([
                'draw' => $draw,
                'recordsTotal' => 0,
                'recordsFiltered' => 0,
                'data' => []
            ]);
        }

        $productIdsWithStock = array_keys($stocksByProduct);

        // --- 2) DataTables light query: count, filtered ids & page
        $productsBaseQuery = Product::with('category')
            ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
            ->where('is_active', true)
            ->when($this->own_data,function($query) {
                $query->where('user_id',$this->current_user_id);
            })
            ->when($category_id > 0, fn ($query) => $query->where('category_id', $category_id))
            ->whereIn('id', $productIdsWithStock);

        if ($search) {
            $productsBaseQuery->where('name', 'LIKE', "%{$search}%");
        }

        // total count (filtered)
        $totalFiltered = $productsBaseQuery->count();
        $totalData = $productsBaseQuery->count(); // same as filtered unless you have separate logic

        // fetch only product ids for the current page (lightweight)
        $pagedProductIds = $productsBaseQuery
            ->orderBy($order, $dir)
            ->offset($start)
            ->limit($limit)
            ->pluck('id')
            ->toArray();

        if (empty($pagedProductIds)) {
            return response()->json([
                'draw' => $draw,
                'recordsTotal' => $totalData,
                'recordsFiltered' => $totalFiltered,
                'data' => []
            ]);
        }

        // --- 3) Load full product models (with category) for the paged ids
        $products = Product::with('category')
            ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
            ->whereIn('id', $pagedProductIds)
            ->when($this->own_data,function($query) {
                $query->where('user_id',$this->current_user_id);
            })
            ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
            ->get()
            ->keyBy('id');

        // --- 4) Load product variants for these products (if any) — we'll use variant qty from ProductVariant->qty for global
        $productVariants = ProductVariant::whereIn('product_id', $pagedProductIds)
            ->select('product_id', 'variant_id', 'item_code', 'qty')
            ->when($this->own_data,function($query) {
                $query->where('user_id',$this->current_user_id);
            })
            ->get()
            ->groupBy('product_id');

        // helper map accessors to check stock for variant/global
        // For variant-level stock, prefer product_warehouse aggregate if available, else ProductVariant.qty
        // stocksByProduct might contain variant entries from product_warehouse (global sums)
        // productVariants map gives per-variant qty from ProductVariant table (non-warehouse)
        // We'll use stocksByProduct first (since it's grouped from product_warehouse), otherwise fallback.

        // --- 5) Load aggregated transactional data in batches (grouped)
        // Purchases (product_purchases JOIN purchases) => amount (total/exchange_rate) and qty grouped by unit id to convert later
        $purchaseRows = DB::table('purchases')
            ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
            ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                return $q->where('purchases.warehouse_id', $warehouse_id);
            })
            ->when($this->own_data,function($query) {
                $query->where('purchases.user_id',$this->current_user_id);
            })
            ->whereNull('purchases.deleted_at')
            ->whereBetween(DB::raw('DATE(purchases.created_at)'), [$start_date, $end_date])
            ->whereIn('product_purchases.product_id', $pagedProductIds)
            ->selectRaw('product_purchases.product_id, COALESCE(product_purchases.variant_id, 0) as variant_id, product_purchases.purchase_unit_id as unit_id, SUM(product_purchases.qty) as qty_sum, SUM(product_purchases.total / purchases.exchange_rate) as amount_sum')
            ->groupBy('product_purchases.product_id', 'variant_id', 'product_purchases.purchase_unit_id')
            ->get();

        // Sales
        $saleRows = DB::table('sales')
            ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
            ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                return $q->where('sales.warehouse_id', $warehouse_id);
            })
            ->when($this->own_data,function($query) {
                $query->where('sales.user_id',$this->current_user_id);
            })
            ->whereNull('sales.deleted_at')
            ->whereBetween(DB::raw('DATE(sales.created_at)'), [$start_date, $end_date])
            ->whereIn('product_sales.product_id', $pagedProductIds)
            ->selectRaw('product_sales.product_id, COALESCE(product_sales.variant_id, 0) as variant_id, product_sales.sale_unit_id as unit_id, SUM(product_sales.qty) as qty_sum, SUM(product_sales.total / sales.exchange_rate) as amount_sum')
            ->groupBy('product_sales.product_id', 'variant_id', 'product_sales.sale_unit_id')
            ->get();

        // Product returns (returns join product_returns)
        $returnRows = DB::table('returns')
            ->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
            ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                return $q->where('returns.warehouse_id', $warehouse_id);
            })
            ->when($this->own_data,function($query) {
                $query->where('returns.user_id',$this->current_user_id);
            })
            ->whereBetween(DB::raw('DATE(returns.created_at)'), [$start_date, $end_date])
            ->whereIn('product_returns.product_id', $pagedProductIds)
            ->selectRaw('product_returns.product_id, COALESCE(product_returns.variant_id, 0) as variant_id, product_returns.sale_unit_id as unit_id, SUM(product_returns.qty) as qty_sum, SUM(product_returns.total / returns.exchange_rate) as amount_sum')
            ->groupBy('product_returns.product_id', 'variant_id', 'product_returns.sale_unit_id')
            ->get();

        // Purchase returns (return_purchases join purchase_product_return)
        $purchaseReturnRows = DB::table('return_purchases')
            ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
            ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                return $q->where('return_purchases.warehouse_id', $warehouse_id);
            })
            ->when($this->own_data,function($query) {
                $query->where('return_purchases.user_id',$this->current_user_id);
            })
            ->whereBetween(DB::raw('DATE(return_purchases.created_at)'), [$start_date, $end_date])
            ->whereIn('purchase_product_return.product_id', $pagedProductIds)
            ->selectRaw('purchase_product_return.product_id, COALESCE(purchase_product_return.variant_id, 0) as variant_id, purchase_product_return.purchase_unit_id as unit_id, SUM(purchase_product_return.qty) as qty_sum, SUM(purchase_product_return.total / return_purchases.exchange_rate) as amount_sum')
            ->groupBy('purchase_product_return.product_id', 'variant_id', 'purchase_product_return.purchase_unit_id')
            ->get();

        // Build aggregated maps: amounts and converted qtys per product+variant
        $aggregate = function ($rows) use ($convertQty) {
            $map = [];
            foreach ($rows as $r) {
                $pid = (int)$r->product_id;
                $vid = (int)$r->variant_id;
                $unitId = $r->unit_id;
                $qtySum = (float)$r->qty_sum;
                $amountSum = (float)$r->amount_sum;

                if (!isset($map[$pid])) $map[$pid] = [];
                if (!isset($map[$pid][$vid])) $map[$pid][$vid] = ['amount' => 0.0, 'qty' => 0.0];

                $map[$pid][$vid]['amount'] += $amountSum;
                // Convert qty per unit rules
                $map[$pid][$vid]['qty'] += $convertQty($qtySum, $unitId);
            }
            return $map;
        };

        $purchasesMap = $aggregate($purchaseRows);
        $salesMap = $aggregate($saleRows);
        $returnsMap = $aggregate($returnRows);
        $purchaseReturnsMap = $aggregate($purchaseReturnRows);

        // --- 6) Build final rows
        $data = [];

        foreach ($products as $product) {
            $pid = $product->id;
            $isVariant = (bool)$product->is_variant;

            // Function to fetch aggregated values with safe defaults
            $getAgg = function ($map, $pid, $vid) {
                return $map[$pid][$vid] ?? ['amount' => 0.0, 'qty' => 0.0];
            };

            if ($isVariant) {
                // iterate over variants for this product
                $variants = $productVariants->get($pid) ?? collect([]);
                foreach ($variants as $variant) {
                    $vid = (int)$variant->variant_id;
                    $itemCode = $variant->item_code ?? $variant->id;

                    // Determine in_stock
                    $inStock = 0;
                    if (isset($stocksByProduct[$pid]['variants'][$vid])) {
                        $inStock = (float)$stocksByProduct[$pid]['variants'][$vid];
                    } else {
                        // fallback to ProductVariant.qty
                        $inStock = (float)$variant->qty;
                    }

                    // skip rows with zero stock (preserves your previous behavior)
                    if ($inStock <= 0) continue;

                    // aggregated numbers
                    $purchased = $getAgg($purchasesMap, $pid, $vid);
                    $sold      = $getAgg($salesMap, $pid, $vid);
                    $returned  = $getAgg($returnsMap, $pid, $vid);
                    $purchaseReturned = $getAgg($purchaseReturnsMap, $pid, $vid);

                    $nested = [];
                    $nested['imei_numbers'] = $this->findImeis($pid, $vid);
                    $nested['key'] = count($data);
                    $nested['name'] = $product->name . ' [' . (Variant::select('name')->find($vid)->name ?? 'N/A') . ']' . '<br/>Product Code: ' . $itemCode;
                    $nested['category'] = optional($product->category)->name;

                    $nested['purchased_amount'] = $purchased['amount'];
                    $nested['purchased_qty'] = $purchased['qty'];

                    $nested['sold_amount'] = $sold['amount'];
                    $nested['sold_qty'] = $sold['qty'];

                    $nested['returned_amount'] = $returned['amount'];
                    $nested['returned_qty'] = $returned['qty'];

                    $nested['purchase_returned_amount'] = $purchaseReturned['amount'];
                    $nested['purchase_returned_qty'] = $purchaseReturned['qty'];

                    // profit calculation (same logic you had)
                    if ($nested['purchased_qty'] > 0) {
                        $nested['profit'] = $nested['sold_amount'] - (($nested['purchased_amount'] / $nested['purchased_qty']) * $nested['sold_qty']);
                    } else {
                        $nested['profit'] = $nested['sold_amount'];
                    }

                    $nested['in_stock'] = $inStock;

                    $nested['stock_worth'] = format_currency($nested['in_stock'] * $product->price).' / '.format_currency($nested['in_stock'] * $product->cost);

                    $nested['profit'] = number_format((float)$nested['profit'], config('decimal'), '.', '');

                    $data[] = $nested;
                }
            } else {
                // non-variant product
                // Determine in_stock: from product_warehouse group or product->qty fallback
                $inStock = $stocksByProduct[$pid]['total'] ?? (float)$product->qty;

                if ($inStock <= 0) continue;

                $purchased = $getAgg($purchasesMap, $pid, 0);
                $sold = $getAgg($salesMap, $pid, 0);
                $returned = $getAgg($returnsMap, $pid, 0);
                $purchaseReturned = $getAgg($purchaseReturnsMap, $pid, 0);

                $nested = [];
                $nested['imei_numbers'] = $this->findImeis($pid);
                $nested['key'] = count($data);
                $nested['name'] = $product->name . '<br/>Product Code: ' . $product->code;
                $nested['category'] = optional($product->category)->name;

                $nested['purchased_amount'] = $purchased['amount'];
                $nested['purchased_qty'] = $purchased['qty'];

                $nested['sold_amount'] = $sold['amount'];
                $nested['sold_qty'] = $sold['qty'];

                $nested['returned_amount'] = $returned['amount'];
                $nested['returned_qty'] = $returned['qty'];

                $nested['purchase_returned_amount'] = $purchaseReturned['amount'];
                $nested['purchase_returned_qty'] = $purchaseReturned['qty'];

                if ($nested['purchased_qty'] > 0) {
                    $nested['profit'] = $nested['sold_amount'] - (($nested['purchased_amount'] / $nested['purchased_qty']) * $nested['sold_qty']);
                } else {
                    $nested['profit'] = $nested['sold_amount'];
                }

                $nested['in_stock'] = $inStock;
                if (config('currency_position') == 'prefix') {
                    $nested['stock_worth'] = config('currency').' '.($nested['in_stock'] * $product->price).' / '.config('currency').' '.($nested['in_stock'] * $product->cost);
                } else {
                    $nested['stock_worth'] = ($nested['in_stock'] * $product->price).' '.config('currency').' / '.($nested['in_stock'] * $product->cost).' '.config('currency');
                }
                $nested['profit'] = number_format((float)$nested['profit'], config('decimal'), '.', '');

                $data[] = $nested;
            }
        }

        // --- 7) Return DataTables JSON
        return response()->json([
            'draw' => $draw,
            'recordsTotal' => (int)$totalData,
            'recordsFiltered' => (int)$totalFiltered,
            'data' => $data
        ]);
    }

    private function findImeis(string $product_id, string $variant_id = '0')
    {
        $imei_numbers = [];
        $purchases = [];
        if ($variant_id === '0') {
            $purchases = Product_Warehouse::where('product_id', $product_id)
                ->whereNotNull('imei_number')
                ->select('imei_number')->get();
        } else {
            $purchases = Product_Warehouse::where('product_id', $product_id)
                ->where('variant_id', '=', $variant_id)
                ->whereNotNull('imei_number')
                ->select('imei_number')->get();
        }

        foreach ($purchases as $purchase) {
            $imei_numbers[] = array_unique(explode(',', $purchase->imei_number));
        }
        $imeis = [];
        foreach ($imei_numbers as $imei_number) {
            foreach ($imei_number as $imei) {
                if ($imei != 'null')
                    $imeis[] = $imei;
            }
        }

        $convert_to_string = '';
        foreach ($imeis as $key => $value) {
            $convert_to_string .= $value;
            if (count($imeis)-1 > $key) {
                $convert_to_string .= '<br/>';
            }
        }

        if (empty($convert_to_string)) {
            return 'N/A';
        }
        return $convert_to_string;
    }

    public function purchaseReport(Request $request)
    {
        if (!$this->userCanPurchaseReport()) {
            return $this->denyPurchaseReportAccess($request);
        }

        $start_date = $request->input('start_date') ?: date('Y-m-01');
        $end_date = $request->input('end_date') ?: date('Y-m-d');
        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $category_id = (int) ($request->input('category_id') ?? 0);

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();
            $categories_list = Cache::remember('category_list', 60 * 60 * 24 * 365, function () {
                return Category::where('is_active', true)->get(['id', 'name']);
            });

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => $warehouse_id,
                'category_id' => $category_id,
                'warehouses' => Warehouse::where('is_active', true)
                    ->get()
                    ->map(fn ($warehouse) => [
                        'id' => $warehouse->id,
                        'name' => $warehouse->name,
                    ])
                    ->values(),
                'categories' => $categories_list->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $category_id = $data['category_id'] ?? 0;
        $product_id = [];
        $variant_id = [];
        $product_name = [];
        $product_qty = [];
        $lims_product_all = Product::select('id', 'name', 'qty', 'is_variant')->where('is_active', true)->get();
        foreach ($lims_product_all as $product) {
            $lims_product_purchase_data = null;
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant)
                    $variant_id_all = ProductPurchase::distinct('variant_id')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->pluck('variant_id');
                else
                    $lims_product_purchase_data = ProductPurchase::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->first();
            }
            else {
                if($product->is_variant)
                    $variant_id_all = DB::table('purchases')
                        ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                        ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                        ->distinct('variant_id')
                        ->where([
                            ['product_purchases.product_id', $product->id],
                            ['purchases.warehouse_id', $warehouse_id]
                        ])->whereNull('purchases.deleted_at')
                        ->whereDate('purchases.created_at','>=', $start_date)
                          ->whereDate('purchases.created_at','<=', $end_date)
                          ->pluck('variant_id');
                else
                    $lims_product_purchase_data = DB::table('purchases')
                        ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                        ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                        ->where([
                                ['product_purchases.product_id', $product->id],
                                ['purchases.warehouse_id', $warehouse_id]
                        ])->whereNull('purchases.deleted_at')
                        ->whereDate('purchases.created_at','>=', $start_date)
                          ->whereDate('purchases.created_at','<=', $end_date)
                          ->first();
            }

            if($lims_product_purchase_data) {
                $product_name[] = $product->name;
                $product_id[] = $product->id;
                $variant_id[] = null;
                if($warehouse_id == 0)
                    $product_qty[] = $product->qty;
                else
                    $product_qty[] = Product_Warehouse::where([
                                    ['product_id', $product->id],
                                    ['warehouse_id', $warehouse_id]
                                ])->sum('qty');
            }
            elseif(count($variant_id_all)) {
                foreach ($variant_id_all as $key => $variantId) {
                    $variant_data = Variant::find($variantId);
                    $product_name[] = $product->name.' ['.$variant_data->name.']';
                    $product_id[] = $product->id;
                    $variant_id[] = $variant_data->id;
                    if($warehouse_id == 0)
                        $product_qty[] = ProductVariant::FindExactProduct($product->id, $variant_data->id)->first()->qty;
                    else
                        $product_qty[] = Product_Warehouse::where([
                                        ['product_id', $product->id],
                                        ['variant_id', $variant_data->id],
                                        ['warehouse_id', $warehouse_id]
                                    ])->first()->qty;

                }
            }
        }
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        return view('backend.report.purchase_report',compact('product_id', 'variant_id', 'product_name', 'product_qty', 'start_date', 'end_date', 'lims_warehouse_list', 'warehouse_id', 'category_id'));
    }

    public function purchaseReportData(Request $request)
    {
        if (!$this->userCanPurchaseReport()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return response()->json(['data' => []], 403);
        }

        $data = $request->all();
        $start_date = $data['start_date'] . ' 00:00:00';
        $end_date = $data['end_date'] . ' 23:59:59';
        $warehouse_id = $data['warehouse_id'];
        $category_id = $data['category_id'];
        $product_id = [];
        $variant_id = [];
        $product_name = [];
        $product_qty = [];
        $totalData = 0;

        $columns = array(
            1 => 'name',
            2 => 'category_id',
            5 => 'qty'
        );

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        //return $request;
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')] ?? 'id';
        $dir = $request->input('order.0.dir');
        if($request->input('search.value')) {
            $search = $request->input('search.value');
            $totalData = Product::where('is_active', true)
            ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
            ->where('name', 'LIKE', "%{$search}%")
            ->count();
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                                ->where([
                                    ['name', 'LIKE', "%{$search}%"],
                                    ['is_active', true]
                                ])->offset($start)
                                  ->limit($limit)
                                  ->orderBy($order, $dir)
                                  ->get();
        }
        else {
            $totalData = Product::where('is_active', true)
            ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
            ->count();
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                                ->where('is_active', true)
                                ->offset($start)
                                ->limit($limit)
                                ->orderBy($order, $dir)
                                ->get();
        }

        $totalFiltered = $totalData;
        $data = [];
        foreach ($lims_product_all as $product) {
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');
                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['key'] = count($data);
                        $imeis = $this->findImeis($product->id, $variant_id);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = DB::table('purchases')
                                                            ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                                            ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                                                            ->where([
                                                                ['product_purchases.product_id', $product->id],
                                                                ['product_purchases.variant_id', $variant_id],
                                                            ])->whereNull('purchases.deleted_at')
                                                            ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum(DB::raw('product_purchases.total / purchases.exchange_rate'));

                        $lims_product_purchase_data = ProductPurchase::select('purchase_unit_id', 'qty')->where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                        $purchased_qty = 0;
                        if(count($lims_product_purchase_data)) {
                            foreach ($lims_product_purchase_data as $product_purchase) {
                                $unit = DB::table('units')->find($product_purchase->purchase_unit_id);
                                if($unit->operator == '*'){
                                    $purchased_qty += $product_purchase->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $purchased_qty += $product_purchase->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['purchased_qty'] = $purchased_qty;


                        $product_variant_data = ProductVariant::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id]
                        ])->select('qty')->first();
                        $nestedData['in_stock'] = $product_variant_data->qty;

                        $data[] = $nestedData;
                    }
                } else {
                    $nestedData['key'] = count($data);
                    $imeis = $this->findImeis($product->id);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = DB::table('purchases')
                                                        ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                                        ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                                                        ->where([
                                                            ['product_purchases.product_id', $product->id],
                                                        ])->whereNull('purchases.deleted_at')
                                                        ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum(DB::raw('product_purchases.total / purchases.exchange_rate'));

                    $lims_product_purchase_data = ProductPurchase::select('purchase_unit_id', 'qty')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                    $purchased_qty = 0;
                    if(count($lims_product_purchase_data)) {
                        foreach ($lims_product_purchase_data as $product_purchase) {
                            $unit = DB::table('units')->find($product_purchase->purchase_unit_id);
                            if($unit->operator == '*'){
                                $purchased_qty += $product_purchase->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $purchased_qty += $product_purchase->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['purchased_qty'] = $purchased_qty;
                    $nestedData['in_stock'] = $product->qty;

                    $data[] = $nestedData;
                }
            }
            else {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');

                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['key'] = count($data);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code;
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                    ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                                    ->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereNull('purchases.deleted_at')
                                    ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum(DB::raw('product_purchases.total / purchases.exchange_rate'));
                        $lims_product_purchase_data = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereNull('purchases.deleted_at')
                                    ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
                                        ->select('product_purchases.purchase_unit_id', 'product_purchases.qty')
                                        ->get();

                        $purchased_qty = 0;
                        if(count($lims_product_purchase_data)) {
                            foreach ($lims_product_purchase_data as $product_purchase) {
                                $unit = DB::table('units')->find($product_purchase->purchase_unit_id);
                                if($unit->operator == '*'){
                                    $purchased_qty += $product_purchase->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $purchased_qty += $product_purchase->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['purchased_qty'] = $purchased_qty;

                        $product_warehouse = Product_Warehouse::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id],
                            ['warehouse_id', $warehouse_id]
                        ])->select('qty')->first();
                        if($product_warehouse)
                            $nestedData['in_stock'] = $product_warehouse->qty;
                        else
                            $nestedData['in_stock'] = 0;

                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['key'] = count($data);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code;
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                ->when($this->own_data, fn($q) => $q->where('purchases.user_id', $this->current_user_id))
                                ->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereNull('purchases.deleted_at')
                                ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum(DB::raw('product_purchases.total / purchases.exchange_rate'));
                    $lims_product_purchase_data = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereNull('purchases.deleted_at')
                                ->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
                                    ->select('product_purchases.purchase_unit_id', 'product_purchases.qty')
                                    ->get();

                    $purchased_qty = 0;
                    if(count($lims_product_purchase_data)) {
                        foreach ($lims_product_purchase_data as $product_purchase) {
                            $unit = DB::table('units')->find($product_purchase->purchase_unit_id);
                            if($unit->operator == '*'){
                                $purchased_qty += $product_purchase->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $purchased_qty += $product_purchase->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['purchased_qty'] = $purchased_qty;

                    $product_warehouse = Product_Warehouse::where([
                        ['product_id', $product->id],
                        ['warehouse_id', $warehouse_id]
                    ])->select('qty')->first();
                    if($product_warehouse)
                        $nestedData['in_stock'] = $product_warehouse->qty;
                    else
                        $nestedData['in_stock'] = 0;

                    $data[] = $nestedData;
                }
            }
        }

        /*$totalData = count($data);
        $totalFiltered = $totalData;*/
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );

        return response()->json($json_data);
    }

    private function userCanPurchaseReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('purchase-report');
    }

    private function denyPurchaseReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function userCanCustomerReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('customer-report');
    }

    private function denyCustomerReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function userCanDueReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('due-report');
    }

    private function denyDueReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function formatReportCustomers($customers): array
    {
        return $customers
            ->filter(fn ($customer) => ($customer->type ?? '') !== 'walkin')
            ->map(fn ($customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone_number' => $customer->phone_number,
                'label' => trim($customer->name.' ('.$customer->phone_number.')'),
            ])
            ->values()
            ->all();
    }

    private function userCanSaleReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('sale-report');
    }

    private function denySaleReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function saleReportCustomFieldMeta(): array
    {
        $custom_fields = CustomField::where([
            ['belongs_to', 'sale'],
            ['is_table', true],
        ])->pluck('name');

        $field_names = [];
        foreach ($custom_fields as $fieldName) {
            $field_names[] = str_replace(' ', '_', strtolower($fieldName));
        }

        return [$custom_fields->values()->all(), $field_names];
    }

    public function saleReport(Request $request)
    {
        if (!$this->userCanSaleReport()) {
            return $this->denySaleReportAccess($request);
        }

        $start_date = $request->start_date ?? date('Y-m').'-01';
        $end_date = $request->end_date ?? date('Y-m-d');
        $warehouse_id = (int) ($request->warehouse_id ?? 0);
        $category_id = (int) ($request->category_id ?? 0);
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $categories_list = Cache::remember('category_list', 60 * 60 * 24 * 365, function () {
            return Category::where('is_active', true)->get(['id', 'name']);
        });
        [$custom_fields, $field_names] = $this->saleReportCustomFieldMeta();

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => $warehouse_id,
                'category_id' => $category_id,
                'warehouses' => $lims_warehouse_list->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])->values(),
                'categories' => $categories_list->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])->values(),
                'custom_fields' => $custom_fields,
                'field_names' => $field_names,
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.sale_report', compact(
            'start_date', 'end_date', 'warehouse_id', 'category_id',
            'lims_warehouse_list', 'custom_fields', 'field_names'
        ));
    }

    public function saleReportData(Request $request)
    {
        if (!$this->userCanSaleReport()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return response()->json(['data' => []], 403);
        }

        $data = $request->all();
        $start_date = $data['start_date'] . ' 00:00:00';
        $end_date   = $data['end_date'] . ' 23:59:59';
        $warehouse_id = $data['warehouse_id'];
        $category_id = $data['category_id'];
        $variant_id = [];
        $totalData = 0;

        $columns = array(
            1 => 'name'
        );

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        //return $request;
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');

        // Fetch custom fields data
        $custom_fields = CustomField::where([
            ['belongs_to', 'sale'],
            ['is_table', true]
        ])->pluck('type', 'name');

        $field_names = [];
        foreach($custom_fields as $fieldName => $type) {
            $field_names[] = str_replace(" ", "_", strtolower($fieldName));
        }

        if($request->input('search.value')) {
            $search = $request->input('search.value');

            $soldProductIds = Product_Sale::whereBetween('created_at', [$start_date, $end_date])
                ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                    $q->whereHas('sale', function ($s) use ($warehouse_id) {
                        $s->where('warehouse_id', $warehouse_id);
                    });
                })
                ->when($this->own_data, function ($q) {
                    $q->whereHas('sale', function ($s) {
                        $s->where('user_id', $this->current_user_id);
                    });
                })
                ->pluck('product_id')
                ->unique();

            $totalData = Product::where('is_active', true)
                ->whereIn('id', $soldProductIds)
                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                ->where('name', 'LIKE', "%{$search}%")
                ->count();

            $lims_product_all = Product::with('category')
                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                ->where('is_active', true)
                ->whereIn('id', $soldProductIds)
                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                ->where('name', 'LIKE', "%{$search}%")
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir)
                ->get();
        }
        else {
            $soldProductIds = Product_Sale::whereBetween('created_at', [$start_date, $end_date])
                ->when($warehouse_id > 0, function ($q) use ($warehouse_id) {
                    $q->whereHas('sale', function ($s) use ($warehouse_id) {
                        $s->where('warehouse_id', $warehouse_id);
                    });
                })
                ->when($this->own_data, function ($q) {
                    $q->whereHas('sale', function ($s) {
                        $s->where('user_id', $this->current_user_id);
                    });
                })
                ->pluck('product_id')
                ->unique();

            $totalData = Product::where('is_active', true)
                ->whereIn('id', $soldProductIds)
                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                ->count();

            $lims_product_all = Product::with('category')
                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                ->where('is_active', true)
                ->whereIn('id', $soldProductIds)
                ->when($category_id > 0, fn($q) => $q->where('category_id', $category_id))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir)
                ->get();
        }

        $totalFiltered = $totalData;
        $data = [];
        foreach ($lims_product_all as $product) {
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');
                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['key'] = count($data);
                        $imeis = $this->findImeis($product->id, $variant_id);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                        $nestedData['category'] = $product->category->name;
                        //sale data
                        $nestedData['sold_amount'] = DB::table('sales')
                                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                                        ['product_sales.product_id', $product->id],
                                                        ['variant_id', $variant_id],
                                                    ])->whereNull('sales.deleted_at')
                                                    ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                                    ->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum(DB::raw('product_sales.total / sales.exchange_rate'));

                        $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty', 'sale_id')->where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                        $sold_qty = 0;
                        if(count($lims_product_sale_data)) {
                            foreach ($lims_product_sale_data as $product_sale) {
                                $unit = DB::table('units')->find($product_sale->sale_unit_id);
                                if($unit->operator == '*'){
                                    $sold_qty += $product_sale->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $sold_qty += $product_sale->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['sold_qty'] = $sold_qty;

                        $product_variant_data = ProductVariant::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id]
                        ])->select('qty')->first();
                        $nestedData['in_stock'] = $product_variant_data->qty;

                        $sale_ids = Product_Sale::where([
                                ['product_id', $product->id],
                                ['variant_id', $variant_id]
                            ])
                            ->whereDate('created_at', '>=', $start_date)
                            ->whereDate('created_at', '<=', $end_date)
                            ->pluck('sale_id')
                            ->unique()
                            ->toArray();
                        // dd($product->id, $variant_id);
                        $sale_data_custom = Sale::whereIn('id', $sale_ids)->get();
                        $sale_data_custom_fields = $this->reportCustomField($sale_data_custom, $custom_fields);
                        foreach ($sale_data_custom_fields as $key => $value) {
                            $nestedData[$key] = $value;
                        }

                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['key'] = count($data);
                    $imeis = $this->findImeis($product->id);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                    $nestedData['category'] = $product->category->name;

                    //sale data
                    $nestedData['sold_amount'] = DB::table('sales')
                                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                                    ['product_sales.product_id', $product->id],
                                                ])->whereNull('sales.deleted_at')
                                                ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                                ->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum(DB::raw('product_sales.total / sales.exchange_rate'));

                    $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty', 'sale_id')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                    $sold_qty = 0;
                    if(count($lims_product_sale_data)) {
                        foreach ($lims_product_sale_data as $product_sale) {
                            if($product_sale->sale_unit_id > 0) {
                                $unit = DB::table('units')->find($product_sale->sale_unit_id);
                                if($unit->operator == '*'){
                                    $sold_qty += $product_sale->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $sold_qty += $product_sale->qty / $unit->operation_value;
                                }
                            }
                            else
                                $sold_qty = $product_sale->qty;
                        }
                    }
                    $nestedData['sold_qty'] = $sold_qty;

                    $nestedData['in_stock'] = $product->qty;

                    $sale_ids = $lims_product_sale_data->pluck('sale_id')->unique()->toArray();
                    $sale_data_custom = Sale::whereIn('id', $sale_ids)->get();
                    $sale_data_custom_fields = $this->reportCustomField($sale_data_custom, $custom_fields);
                    foreach ($sale_data_custom_fields as $key => $value) {
                        $nestedData[$key] = $value;
                    }

                    $data[] = $nestedData;
                }
            }
            else {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');

                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['key'] = count($data);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code;
                        $nestedData['category'] = $product->category->name;

                        //sale data
                        $nestedData['sold_amount'] = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereNull('sales.deleted_at')
                                    ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                    ->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum(DB::raw('product_sales.total / sales.exchange_rate'));
                        $lims_product_sale_data = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereNull('sales.deleted_at')
                                    ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                    ->whereDate('sales.created_at','>=', $start_date)
                                    ->whereDate('sales.created_at','<=', $end_date)
                                    ->select('product_sales.sale_unit_id', 'product_sales.qty', 'sale_id')
                                    ->get();

                        $sold_qty = 0;
                        if(count($lims_product_sale_data)) {
                            foreach ($lims_product_sale_data as $product_sale) {
                                $unit = DB::table('units')->find($product_sale->sale_unit_id);
                                if($unit->operator == '*'){
                                    $sold_qty += $product_sale->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $sold_qty += $product_sale->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['sold_qty'] = $sold_qty;



                        $product_warehouse = Product_Warehouse::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id],
                            ['warehouse_id', $warehouse_id]
                        ])->select('qty')->first();
                        if($product_warehouse)
                            $nestedData['in_stock'] = $product_warehouse->qty;
                        else
                            $nestedData['in_stock'] = 0;

                        $sale_ids = Product_Sale::where([
                                ['product_id', $product->id],
                                ['variant_id', $variant_id]
                            ])
                            ->whereDate('created_at', '>=', $start_date)
                            ->whereDate('created_at', '<=', $end_date)
                            ->pluck('sale_id')
                            ->unique()
                            ->toArray();
                        $sale_data_custom = Sale::whereIn('id', $sale_ids)->get();
                        $sale_data_custom_fields = $this->reportCustomField($sale_data_custom, $custom_fields);
                        foreach ($sale_data_custom_fields as $key => $value) {
                            $nestedData[$key] = $value;
                        }

                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['key'] = count($data);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code;
                    $nestedData['category'] = $product->category->name;

                    //sale data
                    $nestedData['sold_amount'] = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereNull('sales.deleted_at')
                                ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                ->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum(DB::raw('product_sales.total / sales.exchange_rate'));
                    $lims_product_sale_data = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereNull('sales.deleted_at')
                                ->when($this->own_data, fn($q) => $q->where('sales.user_id', $this->current_user_id))
                                ->whereDate('sales.created_at','>=', $start_date)
                                ->whereDate('sales.created_at','<=', $end_date)
                                ->select('product_sales.sale_unit_id', 'product_sales.qty', 'sale_id')
                                ->get();

                    $sold_qty = 0;
                    if(count($lims_product_sale_data)) {
                        foreach ($lims_product_sale_data as $product_sale) {
                            if($product_sale->sale_unit_id) {
                                $unit = DB::table('units')->find($product_sale->sale_unit_id);
                                if($unit->operator == '*'){
                                    $sold_qty += $product_sale->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $sold_qty += $product_sale->qty / $unit->operation_value;
                                }
                            }
                        }
                    }
                    $nestedData['sold_qty'] = $sold_qty;

                    $product_warehouse = Product_Warehouse::where([
                        ['product_id', $product->id],
                        ['warehouse_id', $warehouse_id]
                    ])->select('qty')->first();
                    if($product_warehouse)
                        $nestedData['in_stock'] = $product_warehouse->qty;
                    else
                        $nestedData['in_stock'] = 0;

                    $sale_ids = $lims_product_sale_data->pluck('sale_id')->unique()->toArray();
                    $sale_data_custom = Sale::whereIn('id', $sale_ids)->when($this->own_data, fn($q) => $q->where('user_id', $this->current_user_id))->get();
                    $sale_data_custom_fields = $this->reportCustomField($sale_data_custom, $custom_fields);
                    foreach ($sale_data_custom_fields as $key => $value) {
                        $nestedData[$key] = $value;
                    }

                    $data[] = $nestedData;
                }
            }
        }

        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );

        return response()->json($json_data);
    }

    public function stockReport(Request $request)
    {
        if (!$this->userCanStockReport()) {
            return $this->denyStockReportAccess($request);
        }

        $start_date = $request->start_date ?: now()->subDays(29)->toDateString();
        $end_date   = $request->end_date ?: now()->toDateString();
        $warehouse_id = $request->warehouse_id ?? 0;

        $warehouses = Warehouse::where('is_active', true)->get();
        $categories = Category::where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => (int) $warehouse_id,
                'category_id' => (int) ($request->category_id ?? 0),
                'stock_status' => $request->stock_status ?? '',
                'warehouses' => $warehouses->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])->values(),
                'categories' => $categories->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.stock_report', compact(
            'warehouses',
            'categories',
            'start_date',
            'end_date',
            'warehouse_id'
        ));
    }

    public function stockReportData(Request $request)
    {
        if (!$this->userCanStockReport()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return response()->json(['data' => []], 403);
        }

        $warehouse_id = $request->warehouse_id;
        $category_id = $request->category_id;
        $status = $request->stock_status;
        $start_date = $request->start_date;
        $end_date = $request->end_date;
        $search = $request->input('search.value');

        $draw = intval($request->draw);
        $start = intval($request->start);
        $limit = intval($request->length);

        $query = DB::table('products as p')
            ->join('product_warehouse as pw', 'p.id', '=', 'pw.product_id')
            ->join('warehouses as w', 'pw.warehouse_id', '=', 'w.id')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('product_variants as pv', 'p.id', '=', 'pv.product_id')
            ->leftJoin('variants as v', 'pv.variant_id', '=', 'v.id')
            ->where('p.is_active', true)
            ->when($this->own_data, function($q) {
                $q->where('p.user_id', $this->current_user_id);
            })
            ->select(
                'p.id',
                'p.created_at',
                'p.code',
                'p.name',
                'v.name as variant',
                'v.id as variant_id',
                'c.name as category',
                'c.id as category_id',
                'w.name as warehouse',
                'w.id as warehouse_id',
                DB::raw('COALESCE(pv.additional_cost, p.cost) as cost'),
                DB::raw('COALESCE(pv.additional_price, p.price) as price'),
                DB::raw('COALESCE(pv.qty, pw.qty) as qty'),
                'p.alert_quantity'
            );

        // Filters
        if ($start_date && $end_date) {
            $query->whereBetween('p.created_at', [$start_date, $end_date]);
        }
        if ($warehouse_id && $warehouse_id > 0) {
            $query->where('pw.warehouse_id', $warehouse_id);
        }
        if ($category_id && $category_id > 0) {
            $query->where('p.category_id', $category_id);
        }

        if ($status == 'in_stock') {
            $query->whereColumn('pw.qty', '>', 'p.alert_quantity');
        } elseif ($status == 'low_stock') {
            $query->whereColumn('pw.qty', '<=', 'p.alert_quantity')
                ->where('pw.qty', '>', 0);
        } elseif ($status == 'out_stock') {
            $query->where('pw.qty', 0);
        } elseif ($status == 'negative') {
            $query->where('pw.qty', '<', 0);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('p.name', 'like', "%{$search}%")
                    ->orWhere('p.code', 'like', "%{$search}%");
            });
        }

        $totalData = $query->count();

        if ($limit != -1) {
            $query->offset($start)
                ->limit($limit);
        }

        $stocks = $query->get();

        $data = [];
        $total_qty = 0;
        $total_cost_value = 0;
        $total_price_value = 0;
        $total_profit = 0;

        foreach ($stocks as $stock) {
            $product_warehouse_query = Product_Warehouse::where('product_id', $stock->id)
                ->when($this->own_data,function($query) {
                    $query->where('user_id',$this->current_user_id);
                })
                ->where('warehouse_id', $stock->warehouse_id);

            if ($stock->variant_id) {
                $product_warehouse_query->where('variant_id', $stock->variant_id);
            }

            $product_warehouse_data = $product_warehouse_query->first();
            $current_qty = $product_warehouse_data->qty ?? 0;

            $stock_value_cost  = $current_qty * $stock->cost;
            $stock_value_price = $current_qty * $stock->price;
            $profit = ($stock->price - $stock->cost) * $current_qty;

            $total_qty += $current_qty;
            $total_cost_value += $stock_value_cost;
            $total_price_value += $stock_value_price;
            $total_profit += $profit;
            // dd($stock);
            $data[] = [
                'date' => $stock->created_at,
                'code' => $stock->code,
                'name' => $stock->name,
                'variant' => $stock->variant ?? 'N/A',
                'category' => $stock->category ?? 'N/A',
                'warehouse' => $stock->warehouse,
                'cost' => number_format($stock->cost, 2),
                'price' => number_format($stock->price, 2),
                'qty' => number_format($current_qty, 2),
                'stock_cost' => number_format($stock_value_cost, 2),
                'stock_price' => number_format($stock_value_price, 2),
                'profit' => number_format($profit, 2),
            ];
        }

        return response()->json([
            "draw" => $draw,
            "recordsTotal" => $totalData,
            "recordsFiltered" => $totalData,
            "data" => $data,
            "footer" => [
                "total_qty" => number_format($total_qty, 2),
                "total_cost_value" => number_format($total_cost_value, 2),
                "total_price_value" => number_format($total_price_value, 2),
                "total_profit" => number_format($total_profit, 2),
            ]
        ]);
    }

    private function reportCustomField($data, $custom_fields)
    {
        $custom_data = [];

        foreach ($custom_fields as $field_name => $type) {
            $lower_field_name = str_replace(" ", "_", strtolower($field_name));
            if ($type === 'number') {
                $custom_data[$lower_field_name] = $data->sum($lower_field_name);
            } else {
                $custom_data[$lower_field_name] = $data->pluck($lower_field_name)->filter()->values();
            }
        }

        return $custom_data;
    }

    public function challanReport(Request $request)
    {
        if ($request->input('starting_date')) {
            $starting_date = $request->input('starting_date');
            $ending_date = $request->input('ending_date');
            $based_on = $request->input('based_on', 'created_at');
        } else {
            $starting_date = date('Y-m-01');
            $ending_date = date('Y-m-d');
            $based_on = 'created_at';
        }

        if (!in_array($based_on, ['created_at', 'closing_date'], true)) {
            $based_on = 'created_at';
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson(
                $request,
                $this->buildChallanReportPayload($starting_date, $ending_date, $based_on)
            );
        }

        $challan_data = Challan::whereDate($based_on, '>=', $starting_date)
                            ->whereDate($based_on, '<=', $ending_date)
                            ->when($this->own_data, fn($q) => $q->where('user_id', $this->current_user_id))
                            ->where('status', 'Close')
                            ->get();
        $index = 0;
        if ($request->ajax()) {
            return view('backend.report.partials.challan_table', compact('index', 'challan_data', 'based_on', 'starting_date', 'ending_date'))->render();
        }

        return view('backend.report.challan_report', compact('index', 'challan_data', 'based_on', 'starting_date', 'ending_date'));
    }

    private function buildChallanReportPayload(string $starting_date, string $ending_date, string $based_on): array
    {
        $challan_data = Challan::whereDate($based_on, '>=', $starting_date)
            ->whereDate($based_on, '<=', $ending_date)
            ->when($this->own_data, fn($q) => $q->where('user_id', $this->current_user_id))
            ->where('status', 'Close')
            ->get();

        $date_format = config('date_format', 'd/m/Y');
        $rows = [];
        $index = 0;

        foreach ($challan_data as $challan) {
            $packingSlipList = explode(',', (string) $challan->packing_slip_list);
            $cash_list = explode(',', (string) $challan->cash_list);
            $cheque_list = explode(',', (string) $challan->cheque_list);
            $online_payment_list = explode(',', (string) $challan->online_payment_list);
            $delivery_charge_list = explode(',', (string) $challan->delivery_charge_list);

            foreach ($packingSlipList as $key => $packingSlipId) {
                if ($packingSlipId === '') {
                    continue;
                }

                $packingSlip = PackingSlip::with('sale.products')->find($packingSlipId);
                if (!$packingSlip) {
                    continue;
                }

                $cash = (float) (($cash_list[$key] ?? '') !== '' ? $cash_list[$key] : 0);
                $online = (float) (($online_payment_list[$key] ?? '') !== '' ? $online_payment_list[$key] : 0);
                $cheque = (float) (($cheque_list[$key] ?? '') !== '' ? $cheque_list[$key] : 0);
                $delivery_charge = (float) (($delivery_charge_list[$key] ?? '') !== '' ? $delivery_charge_list[$key] : 0);

                $sale = $packingSlip->sale;
                $codes = $sale
                    ? $sale->products->pluck('code')->filter()->implode(',')
                    : '';

                $order_date = $sale
                    ? date($date_format, strtotime($sale->created_at))
                    : '-';

                $delivery_date = 'N/A';
                if ($sale && (int) $sale->sale_status === 1) {
                    $delivery_date = date($date_format, strtotime($sale->updated_at));
                }

                $rows[] = [
                    'id' => $index,
                    'challan_no' => 'DC-' . $challan->reference_no,
                    'order_no' => $sale->reference_no ?? '-',
                    'order_date' => $order_date,
                    'code' => $codes,
                    'delivery_date' => $delivery_date,
                    'sales_amount' => (float) ($sale->grand_total ?? 0),
                    'cash_payment' => $cash,
                    'online_payment' => $online,
                    'cheque_payment' => $cheque,
                    'shipping_income' => (float) ($sale->shipping_cost ?? 0),
                    'delivery_charge' => $delivery_charge,
                    'net' => $cash + $online + $cheque - $delivery_charge,
                    'net_cash' => $cash - $delivery_charge,
                ];
                $index++;
            }
        }

        $general_setting = GeneralSetting::latest()->first();

        return [
            'starting_date' => $starting_date,
            'ending_date' => $ending_date,
            'based_on' => $based_on,
            'rows' => $rows,
            'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
        ];
    }

    public function saleReportChart(Request $request)
    {
        if (!$this->userCanSaleReportChart()) {
            return $this->denySaleReportChartAccess($request);
        }

        $start_date = $request->input('start_date') ?: date('Y-m-01');
        $end_date = $request->input('end_date') ?: date('Y-m-d');
        $warehouse_id = (int) ($request->input('warehouse_id') ?? 0);
        $time_period = $request->input('time_period') ?: 'weekly';
        $product_list = $request->input('product_list') ?? '';

        if (!in_array($time_period, ['weekly', 'monthly'], true)) {
            $time_period = 'weekly';
        }

        $payload = $this->buildSaleReportChartPayload(
            $start_date,
            $end_date,
            $warehouse_id,
            $time_period,
            $product_list
        );

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        $lims_warehouse_list = Warehouse::where('is_active', true)->select('id', 'name')->get();

        if ($request->ajax()) {
            return view('backend.report.partials.sale_report_chart_table', [
                'start_date' => $payload['start_date'],
                'end_date' => $payload['end_date'],
                'warehouse_id' => $payload['warehouse_id'],
                'time_period' => $payload['time_period'],
                'product_list' => $payload['product_list'],
                'sold_qty' => $payload['sold_qty'],
                'date_points' => $payload['date_points'],
                'lims_warehouse_list' => $lims_warehouse_list,
            ])->render();
        }

        return view('backend.report.sale_report_chart', [
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'warehouse_id' => $payload['warehouse_id'],
            'time_period' => $payload['time_period'],
            'product_list' => $payload['product_list'],
            'sold_qty' => $payload['sold_qty'],
            'date_points' => $payload['date_points'],
            'lims_warehouse_list' => Warehouse::where('is_active', true)->select('id', 'name')->get(),
        ]);
    }

    private function userCanSaleReportChart(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('sale-report-chart');
    }

    private function denySaleReportChartAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildSaleReportChartPayload(
        string $start_date,
        string $end_date,
        int $warehouse_id,
        string $time_period,
        string $product_list
    ): array {
        $end_timestamp = strtotime($end_date);
        $date_points = [];
        $sold_qty = [];
        $range_start = $start_date;

        if ($time_period === 'monthly') {
            for ($i = strtotime($start_date); $i <= $end_timestamp; $i = strtotime('+1 month', $i)) {
                $date_points[] = date('Y-m-d', $i);
            }
        } else {
            for ($i = strtotime('Saturday', strtotime($start_date)); $i <= $end_timestamp; $i = strtotime('+1 week', $i)) {
                $date_points[] = date('Y-m-d', $i);
            }
        }
        $date_points[] = $end_date;

        $trimmed_product_list = trim($product_list);

        foreach ($date_points as $key => $date_point) {
            $q = DB::table('sales')
                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                ->whereNull('sales.deleted_at')
                ->whereDate('sales.created_at', '>=', $range_start)
                ->whereDate('sales.created_at', '<', $date_point)
                ->when($this->own_data, fn($query) => $query->where('sales.user_id', $this->current_user_id));

            if ($warehouse_id) {
                $q->where('sales.warehouse_id', $warehouse_id);
            }

            if ($trimmed_product_list !== '') {
                $product_ids = Product::whereIn('code', explode(',', $trimmed_product_list))
                    ->pluck('id')
                    ->toArray();
                $q->whereIn('product_sales.product_id', $product_ids);
            }

            $sold_qty[$key] = (float) $q->sum('product_sales.qty');
            $range_start = $date_point;
        }

        $general_setting = GeneralSetting::latest()->first();

        return [
            'start_date' => $start_date,
            'end_date' => $end_date,
            'warehouse_id' => $warehouse_id,
            'time_period' => $time_period,
            'product_list' => $product_list,
            'date_points' => $date_points,
            'sold_qty' => array_values($sold_qty),
            'warehouses' => Warehouse::where('is_active', true)
                ->select('id', 'name')
                ->get()
                ->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])
                ->values(),
            'theme' => $this->bestSellerThemeColors($general_setting->theme ?? 'default.css'),
            'label' => 'Sold Qty',
        ];
    }

    public function paymentReportByDate(Request $request)
    {
        if (!$this->userCanPaymentReport()) {
            return $this->denyPaymentReportAccess($request);
        }

        $start_date = $request->input('start_date');
        $end_date = $request->input('end_date');
        $payment_method = $request->input('payment_method');

        $payload = $this->buildPaymentReportPayload($start_date, $end_date, $payment_method);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $payload);
        }

        $lims_payment_data = Payment::query()
            ->when($this->own_data, function ($q) {
                $q->whereHas('sale', function ($s) {
                    $s->where('user_id', $this->current_user_id);
                });
            })
            ->when($payload['start_date'] && $payload['end_date'], function ($q) use ($payload) {
                $q->whereDate('created_at', '>=', $payload['start_date'])
                    ->whereDate('created_at', '<=', $payload['end_date']);
            })
            ->when(!empty($payload['payment_method']), function ($q) use ($payload) {
                $q->where('paying_method', $payload['payment_method']);
            })
            ->get();

        if ($request->ajax()) {
            return view('backend.report.partials.payment_table', [
                'lims_payment_data' => $lims_payment_data,
                'start_date' => $payload['start_date'],
                'end_date' => $payload['end_date'],
                'payment_method' => $payload['payment_method'],
            ])->render();
        }

        return view('backend.report.payment_report', [
            'lims_payment_data' => $lims_payment_data,
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'payment_method' => $payload['payment_method'],
        ]);
    }

    private function userCanPaymentReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('payment-report');
    }

    private function denyPaymentReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function buildPaymentReportPayload(?string $start_date, ?string $end_date, ?string $payment_method): array
    {
        $start_date = $start_date ?: date('Y-m-01');
        $end_date = $end_date ?: date('Y-m-d');
        $payment_method = $payment_method ?? '';

        $query = Payment::query()
            ->when($this->own_data, function ($q) {
                $q->whereHas('sale', function ($s) {
                    $s->where('user_id', $this->current_user_id);
                });
            });

        if ($start_date && $end_date) {
            $query->whereDate('created_at', '>=', $start_date)
                ->whereDate('created_at', '<=', $end_date);
        }

        if (!empty($payment_method)) {
            $query->where('paying_method', $payment_method);
        }

        $payments = $query->orderByDesc('created_at')->get();

        $general_setting = GeneralSetting::latest()->first();
        $date_format = $general_setting->date_format ?? config('date_format', 'd/m/Y');
        $decimal = (int) ($general_setting->decimal ?? config('decimal', 2));

        $sale_ids = $payments->pluck('sale_id')->filter()->unique()->values();
        $purchase_ids = $payments->pluck('purchase_id')->filter()->unique()->values();
        $user_ids = $payments->pluck('user_id')->filter()->unique()->values();

        $sales = Sale::whereIn('id', $sale_ids)->pluck('reference_no', 'id');
        $purchases = Purchase::whereIn('id', $purchase_ids)->pluck('reference_no', 'id');
        $users = User::whereIn('id', $user_ids)->get(['id', 'username', 'email'])->keyBy('id');

        $rows = [];
        foreach ($payments as $payment) {
            $user = $users->get($payment->user_id);
            $rows[] = [
                'id' => $payment->id,
                'date' => date($date_format, strtotime($payment->created_at->toDateString()))
                    .' '.$payment->created_at->toTimeString(),
                'payment_reference' => $payment->payment_reference,
                'sale_reference' => $sales->get($payment->sale_id, ''),
                'purchase_reference' => $purchases->get($payment->purchase_id, ''),
                'paying_method' => $payment->paying_method,
                'amount' => (float) $payment->amount,
                'created_by_name' => $user ? User::resolveDisplayName($user) : '',
                'created_by_email' => $user->email ?? '',
            ];
        }

        return [
            'start_date' => $start_date,
            'end_date' => $end_date,
            'payment_method' => $payment_method,
            'rows' => $rows,
            'decimal' => $decimal,
            'payment_methods' => [
                ['value' => '', 'label' => 'All'],
                ['value' => 'Cash', 'label' => 'Cash'],
                ['value' => 'Card', 'label' => 'Card'],
                ['value' => 'Credit Card', 'label' => 'Credit Card'],
                ['value' => 'Bank', 'label' => 'Bank'],
                ['value' => 'Cheque', 'label' => 'Cheque'],
                ['value' => 'Moneipoint', 'label' => 'Moneipoint'],
                ['value' => 'Pesapal', 'label' => 'Pesapal'],
                ['value' => 'Points', 'label' => 'Points'],
            ],
        ];
    }

    public function warehouseReport(Request $request)
    {
        if (!$this->userCanWarehouseReport()) {
            return $this->denyWarehouseReportAccess($request);
        }

        $warehouse_id = $request->input('warehouse_id');
        if ($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        } else {
            $start_date = date('Y-m-d', strtotime('-1 year'));
            $end_date = date('Y-m-d');
        }

        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        if (!$warehouse_id && $lims_warehouse_list->isNotEmpty()) {
            $warehouse_id = $lims_warehouse_list->first()->id;
        }

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'warehouse_id' => (int) ($warehouse_id ?? 0),
                'warehouses' => $lims_warehouse_list->map(fn ($warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.warehouse_report', compact('start_date', 'end_date', 'warehouse_id', 'lims_warehouse_list'));
    }

    private function userCanWarehouseReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('warehouse-report');
    }

    private function denyWarehouseReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function warehouseSaleData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.warehouse_id', $warehouse_id)
            ->whereNull('sales.deleted_at')
            ->where(function ($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('sales.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $sales =  $q->orwhere([
                                ['sales.reference_no', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['sales.created_at', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['sales.reference_no', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['sales.created_at', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['customer'] = $sale->customer;
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
                                    ->whereNull('sales.deleted_at')
                                    ->where('sales.id', $sale->id)
                                    ->select('products.name as product_name', 'product_sales.qty', 'product_sales.sale_unit_id')
                                    ->get();
                foreach ($product_sale_data as $index => $product_sale) {
                    if($product_sale->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_sale->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($sale->paid_amount, $this->reportDecimal());
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, $this->reportDecimal());
                if($sale->sale_status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $sale_status = __('db.Completed');
                }
                elseif($sale->sale_status == 2){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $sale_status = __('db.Pending');
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $sale_status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function warehousePurchaseData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = DB::table('purchases')
            //->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->where('purchases.warehouse_id', $warehouse_id)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('purchase_type', '!=', 'opening balance')
                ->orWhereNull('purchase_type');
            })
            ->whereDate('purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('purchases.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'purchases.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('purchases.id', 'purchases.reference_no', 'purchases.supplier_id', 'purchases.grand_total', 'purchases.paid_amount', 'purchases.status', 'purchases.created_at')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $purchases = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('purchases.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $purchases =  $q->orwhere([
                                ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['purchases.created_at', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['purchases.created_at', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $purchases =  $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases as $key => $purchase)
            {
                $nestedData['id'] = $purchase->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($purchase->created_at));
                $nestedData['reference_no'] = $purchase->reference_no;
                if($purchase->supplier_id) {
                    $supplier = DB::table('suppliers')->select('name')->where('id',$purchase->supplier_id)->first();
                    $nestedData['supplier'] = $supplier->name;
                }
                else
                    $nestedData['supplier'] = 'N/A';
                $product_purchase_data = DB::table('purchases')->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                    ->join('products', 'product_purchases.product_id', '=', 'products.id')
                                    ->where('purchases.id', $purchase->id)
                                    ->whereNull('purchases.deleted_at')
                                    ->select('products.name as product_name', 'product_purchases.qty', 'product_purchases.purchase_unit_id')
                                    ->get();
                foreach ($product_purchase_data as $index => $product_purchase) {
                    if($product_purchase->purchase_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_purchase->purchase_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($purchase->paid_amount, $this->reportDecimal());
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, $this->reportDecimal());
                if($purchase->status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $status = __('db.Completed');
                }
                elseif($purchase->status == 2){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $status = __('db.Pending');
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function warehouseQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->leftJoin('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.warehouse_id', $warehouse_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'suppliers.name as supplier_name', 'customers.name as customer_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['customer'] = $quotation->customer_name;
                if($quotation->supplier_id) {
                    $nestedData['supplier'] = $quotation->supplier_name;
                }
                else
                    $nestedData['supplier'] = 'N/A';
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function warehouseReturnData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = DB::table('returns')
            ->join('customers', 'returns.customer_id', '=', 'customers.id')
            ->leftJoin('billers', 'returns.biller_id', '=', 'billers.id')
            ->where('returns.warehouse_id', $warehouse_id)
            ->whereDate('returns.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('returns.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'returns.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('returns.id', 'returns.reference_no', 'returns.grand_total', 'returns.created_at', 'customers.name as customer_name', 'billers.name as biller_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $returns = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('returns.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $returns =  $q->orwhere([
                                ['returns.reference_no', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['returns.created_at', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['returns.reference_no', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['returns.created_at', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $returns =  $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($returns))
        {
            foreach ($returns as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['customer'] = $sale->customer_name;
                $nestedData['biller'] = $sale->biller_name;
                $product_return_data = DB::table('returns')->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                                    ->join('products', 'product_returns.product_id', '=', 'products.id')
                                    ->where('returns.id', $sale->id)
                                    ->select('products.name as product_name', 'product_returns.qty', 'product_returns.sale_unit_id')
                                    ->get();
                foreach ($product_return_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function warehouseExpenseData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');
        $q = DB::table('expenses')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.warehouse_id', $warehouse_id)
            ->whereDate('expenses.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('expenses.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'expenses.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('expenses.id', 'expenses.reference_no', 'expenses.amount', 'expenses.created_at', 'expenses.note', 'expense_categories.name as category')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $expenses = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('expenses.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $expenses =  $q->orwhere([
                                ['expenses.reference_no', 'LIKE', "%{$search}%"],
                                ['expenses.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['expenses.created_at', 'LIKE', "%{$search}%"],
                                ['expenses.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['expenses.reference_no', 'LIKE', "%{$search}%"],
                                    ['expenses.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['expenses.created_at', 'LIKE', "%{$search}%"],
                                    ['expenses.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $expenses =  $q->orwhere('expenses.created_at', 'LIKE', "%{$search}%")->orwhere('expenses.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('expenses.created_at', 'LIKE', "%{$search}%")->orwhere('expenses.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($expenses))
        {
            foreach ($expenses as $key => $expense)
            {
                $nestedData['id'] = $expense->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($expense->created_at));
                $nestedData['reference_no'] = $expense->reference_no;
                $nestedData['category'] = $expense->category;
                $nestedData['amount'] = number_format($expense->amount, $this->reportDecimal());
                $nestedData['note'] = $expense->note;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userReport(Request $request)
    {
        if (!$this->userCanUserReport()) {
            return $this->denyUserReportAccess($request);
        }

        $user_id = $request->input('user_id');
        if ($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        } else {
            $start_date = date('Y-m-01');
            $end_date = date('Y-m-d');
        }

        $lims_user_list = User::where('is_active', true)->get();
        if (!$user_id && $lims_user_list->isNotEmpty()) {
            $user_id = $lims_user_list->first()->id;
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'user_id' => (int) ($user_id ?? 0),
                'users' => $lims_user_list->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'label' => trim($user->name.' ('.$user->phone.')'),
                ])->values(),
                'decimal' => $this->reportDecimal(),
            ]);
        }

        return view('backend.report.user_report', compact('user_id', 'start_date', 'end_date', 'lims_user_list'));
    }

    public function billerReport(Request $request)
    {
        if (!$this->userCanBillerReport()) {
            return $this->denyBillerReportAccess($request);
        }

        $biller_id = $request->input('biller_id');
        if ($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        } else {
            $start_date = date('Y-m-01');
            $end_date = date('Y-m-d');
        }

        $lims_biller_list = Biller::where('is_active', true)->get();
        if (!$biller_id && $lims_biller_list->isNotEmpty()) {
            $biller_id = $lims_biller_list->first()->id;
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'biller_id' => (int) ($biller_id ?? 0),
                'billers' => $lims_biller_list->map(fn ($biller) => [
                    'id' => $biller->id,
                    'name' => $biller->name,
                    'phone_number' => $biller->phone_number,
                    'label' => trim($biller->name.' ('.$biller->phone_number.')'),
                ])->values(),
                'decimal' => $this->reportDecimal(),
            ]);
        }

        return view('backend.report.biller_report', compact('biller_id', 'start_date', 'end_date', 'lims_biller_list'));
    }

    private function userCanUserReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('user-report');
    }

    private function denyUserReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    private function userCanBillerReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('biller-report');
    }

    private function denyBillerReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function billerSaleData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $biller_id = $request->input('biller_id');

        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->whereNull('sales.deleted_at')
            ->where(function ($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->where('sales.biller_id', $biller_id)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer', 'warehouses.name as warehouse')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('sales.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $sales =  $q->orwhere([
                                ['sales.reference_no', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['sales.created_at', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['sales.reference_no', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['sales.created_at', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['customer'] = $sale->customer;
                $nestedData['warehouse'] = $sale->warehouse;
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
                                    ->whereNull('sales.deleted_at')
                                    ->where('sales.id', $sale->id)
                                    ->select('products.name as product_name', 'product_sales.qty', 'product_sales.sale_unit_id')
                                    ->get();
                $nestedData['product'] = '';
                foreach ($product_sale_data as $index => $product_sale) {
                    if($product_sale->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_sale->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($sale->paid_amount, $this->reportDecimal());
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, $this->reportDecimal());
                if($sale->sale_status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $sale_status = __('db.Completed');
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $sale_status = __('db.Pending');
                }
                else{
                    $nestedData['sale_status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $sale_status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function billerQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $biller_id = $request->input('biller_id');
        $q = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.biller_id', $biller_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'warehouses.name as warehouse_name', 'customers.name as customer_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['customer'] = $quotation->customer_name;
                $nestedData['warehouse'] = $quotation->warehouse_name;
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function billerPaymentData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $biller_id = $request->input('biller_id');
        $q = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->whereNull('sales.deleted_at')
           ->where('sales.biller_Id',$biller_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'payments.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payments.*')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payments = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payments.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payments =  $q->orwhere([
                                ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payments.created_at', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payments.created_at', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['amount'] = number_format($payment->amount, $this->reportDecimal());
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userSaleData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->where('sales.user_id', $user_id)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer', 'warehouses.name as warehouse')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('sales.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $sales =  $q->orwhere([
                                ['sales.reference_no', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['sales.created_at', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['sales.reference_no', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['sales.created_at', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['customer'] = $sale->customer;
                $nestedData['warehouse'] = $sale->warehouse;
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
                                    ->where('sales.id', $sale->id)
                                    ->whereNull('sales.deleted_at')
                                    ->select('products.name as product_name', 'product_sales.qty', 'product_sales.sale_unit_id')
                                    ->get();
                foreach ($product_sale_data as $index => $product_sale) {
                    if($product_sale->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_sale->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($sale->paid_amount, $this->reportDecimal());
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, $this->reportDecimal());
                if($sale->sale_status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $sale_status = __('db.Completed');
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $sale_status = __('db.Pending');
                }
                else{
                    $nestedData['sale_status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $sale_status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userPurchaseData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('purchases')
            ->join('warehouses', 'purchases.warehouse_id', '=', 'warehouses.id')
            ->where('purchases.user_id', $user_id)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('purchase_type', '!=', 'opening balance')
                ->orWhereNull('purchase_type');
            })
            ->whereDate('purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('purchases.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'purchases.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('purchases.id', 'purchases.reference_no', 'purchases.supplier_id', 'purchases.grand_total', 'purchases.paid_amount', 'purchases.status', 'purchases.created_at', 'warehouses.name as warehouse')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $purchases = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('purchases.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $purchases =  $q->orwhere([
                                ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['purchases.created_at', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['purchases.created_at', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $purchases =  $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases as $key => $purchase)
            {
                $nestedData['id'] = $purchase->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($purchase->created_at));
                $nestedData['reference_no'] = $purchase->reference_no;
                $nestedData['warehouse'] = $purchase->warehouse;
                if($purchase->supplier_id) {
                    $supplier = DB::table('suppliers')->select('name')->where('id',$purchase->supplier_id)->first();
                    $nestedData['supplier'] = $supplier->name;
                }
                else
                    $nestedData['supplier'] = 'N/A';
                $product_purchase_data = DB::table('purchases')->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                    ->join('products', 'product_purchases.product_id', '=', 'products.id')
                                    ->where('purchases.id', $purchase->id)
                                    ->whereNull('purchases.deleted_at')
                                    ->select('products.name as product_name', 'product_purchases.qty', 'product_purchases.purchase_unit_id')
                                    ->get();
                foreach ($product_purchase_data as $index => $product_purchase) {
                    if($product_purchase->purchase_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_purchase->purchase_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($purchase->paid_amount, $this->reportDecimal());
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, $this->reportDecimal());
                if($purchase->status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $status = __('db.Completed');
                }
                elseif($purchase->status == 2){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $status = __('db.Pending');
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.user_id', $user_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'warehouses.name as warehouse_name', 'customers.name as customer_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['customer'] = $quotation->customer_name;
                $nestedData['warehouse'] = $quotation->warehouse_name;
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userTransferData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('transfers')
           ->join('warehouses as fromWarehouse', 'transfers.from_warehouse_id', '=', 'fromWarehouse.id')
           ->join('warehouses as toWarehouse', 'transfers.to_warehouse_id', '=', 'toWarehouse.id')
           ->where('transfers.user_id', $user_id)
           ->whereDate('transfers.created_at', '>=' , $request->input('start_date'))
           ->whereDate('transfers.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'transfers.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('transfers.id', 'transfers.status', 'transfers.created_at', 'transfers.reference_no', 'transfers.grand_total', 'fromWarehouse.name as fromWarehouse', 'toWarehouse.name as toWarehouse')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $transfers = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('transfers.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $transfers =  $q->orwhere([
                                ['transfers.reference_no', 'LIKE', "%{$search}%"],
                                ['transfers.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['transfers.created_at', 'LIKE', "%{$search}%"],
                                ['transfers.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['transfers.reference_no', 'LIKE', "%{$search}%"],
                                    ['transfers.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['transfers.created_at', 'LIKE', "%{$search}%"],
                                    ['transfers.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $transfers =  $q->orwhere('transfers.created_at', 'LIKE', "%{$search}%")->orwhere('transfers.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('transfers.created_at', 'LIKE', "%{$search}%")->orwhere('transfers.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($transfers))
        {
            foreach ($transfers as $key => $transfer)
            {
                $nestedData['id'] = $transfer->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($transfer->created_at));
                $nestedData['reference_no'] = $transfer->reference_no;
                $nestedData['fromWarehouse'] = $transfer->fromWarehouse;
                $nestedData['toWarehouse'] = $transfer->toWarehouse;
                $product_transfer_data = DB::table('product_transfer')
                                    ->where('transfer_id', $transfer->id)
                                    ->get();
                foreach ($product_transfer_data as $index => $product_transfer) {
                    $product = DB::table('products')->find($product_transfer->product_id);
                    if($product_transfer->variant_id) {
                        $variant = DB::table('variants')->find($product_transfer->variant_id);
                        $product->name .= ' ['.$variant->name.']';
                    }
                    $unit = DB::table('units')->find($product_transfer->purchase_unit_id);
                    if($index){
                        if($unit){
                            $nestedData['product'] .= $product->name.' ('.$product_transfer->qty.' '.$unit->unit_code.')';
                        }else{
                            $nestedData['product'] .= $product->name.' ('.$product_transfer->qty.')';
                        }
                    }else{
                        if($unit){
                            $nestedData['product'] = $product->name.' ('.$product_transfer->qty.' '.$unit->unit_code.')';
                        }else{
                            $nestedData['product'] = $product->name.' ('.$product_transfer->qty.')';
                        }
                    }
                }
                $nestedData['grandTotal'] = number_format($transfer->grand_total, $this->reportDecimal());
                if($transfer->status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                }
                elseif($transfer->status == 2) {
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userPaymentData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('payments')
           ->where('payments.user_id', $user_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'payments.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payments.*')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payments = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payments.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payments =  $q->orwhere([
                                ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payments.created_at', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payments.created_at', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['amount'] = number_format($payment->amount, $this->reportDecimal());
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userPayrollData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('payrolls')
           ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
           ->where('payrolls.user_id', $user_id)
           ->whereDate('payrolls.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payrolls.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'payrolls.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payrolls.id', 'payrolls.created_at', 'payrolls.reference_no', 'payrolls.amount', 'payrolls.paying_method', 'employees.name as employee')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payrolls = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payrolls.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payrolls =  $q->orwhere([
                                ['payrolls.reference_no', 'LIKE', "%{$search}%"],
                                ['payrolls.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payrolls.created_at', 'LIKE', "%{$search}%"],
                                ['payrolls.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payrolls.reference_no', 'LIKE', "%{$search}%"],
                                    ['payrolls.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payrolls.created_at', 'LIKE', "%{$search}%"],
                                    ['payrolls.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payrolls =  $q->orwhere('payrolls.created_at', 'LIKE', "%{$search}%")->orwhere('payrolls.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payrolls.created_at', 'LIKE', "%{$search}%")->orwhere('payrolls.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payrolls))
        {
            foreach ($payrolls as $key => $payroll)
            {
                $nestedData['id'] = $payroll->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payroll->created_at));
                $nestedData['reference_no'] = $payroll->reference_no;
                $nestedData['employee'] = $payroll->employee;
                $nestedData['amount'] = number_format($payroll->amount, $this->reportDecimal());
                if($payroll->paying_method == 0)
                    $nestedData['method'] = 'Cash';
                elseif($payroll->paying_method == 1)
                    $nestedData['method'] = 'Cheque';
                else
                    $nestedData['method'] = 'Credit Card';
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function userExpenseData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $user_id = $request->input('user_id');
        $q = DB::table('expenses')
            ->join('warehouses', 'expenses.warehouse_id', '=', 'warehouses.id')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.user_id', $user_id)
            ->whereDate('expenses.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('expenses.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'expenses.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('expenses.id', 'expenses.reference_no', 'expenses.amount', 'expenses.created_at', 'expenses.note', 'expense_categories.name as category', 'warehouses.name as warehouse')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $expenses = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('expenses.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $expenses =  $q->orwhere([
                                ['expenses.reference_no', 'LIKE', "%{$search}%"],
                                ['expenses.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['expenses.created_at', 'LIKE', "%{$search}%"],
                                ['expenses.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['expenses.reference_no', 'LIKE', "%{$search}%"],
                                    ['expenses.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['expenses.created_at', 'LIKE', "%{$search}%"],
                                    ['expenses.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $expenses =  $q->orwhere('expenses.created_at', 'LIKE', "%{$search}%")->orwhere('expenses.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('expenses.created_at', 'LIKE', "%{$search}%")->orwhere('expenses.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($expenses))
        {
            foreach ($expenses as $key => $expense)
            {
                $nestedData['id'] = $expense->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($expense->created_at));
                $nestedData['reference_no'] = $expense->reference_no;
                $nestedData['warehouse'] = $expense->warehouse;
                $nestedData['category'] = $expense->category;
                $nestedData['amount'] = number_format($expense->amount, $this->reportDecimal());
                $nestedData['note'] = $expense->note;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerReport(Request $request)
    {
        if (!$this->userCanCustomerReport()) {
            return $this->denyCustomerReportAccess($request);
        }

        $customer_id = $request->input('customer_id');
        if ($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        } else {
            $start_date = date('Y-m-d', strtotime('-1 year'));
            $end_date = date('Y-m-d');
        }

        $lims_customer_list = Customer::where('is_active', true)->get();
        $customers = $this->formatReportCustomers($lims_customer_list);

        if (!$customer_id && !empty($customers)) {
            $customer_id = $customers[0]['id'];
        }

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'customer_id' => (int) ($customer_id ?? 0),
                'customers' => $customers,
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.customer_report', compact('start_date', 'end_date', 'customer_id', 'lims_customer_list'));
    }

    public function customerSaleData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_id = $request->input('customer_id');
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->where('sales.customer_id', $customer_id)
            ->whereNull('sales.deleted_at')
            ->where(function ($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.total_price', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('sales.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $sales =  $q->orwhere([
                                ['sales.reference_no', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['sales.created_at', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['sales.reference_no', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['sales.created_at', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['warehouse'] = $sale->warehouse_name;
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
                                    ->where('sales.id', $sale->id)
                                    ->whereNull('sales.deleted_at')
                                    ->select('products.name as product_name', 'product_sales.qty', 'product_sales.sale_unit_id')
                                    ->get();
                foreach ($product_sale_data as $index => $product_sale) {
                    if($product_sale->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_sale->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                //calculating product purchase cost
                config()->set('database.connections.mysql.strict', false);
                DB::reconnect();
                $product_sale_data = Sale::join('product_sales', 'sales.id','=', 'product_sales.sale_id')
                    ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.total) as sold_amount'))
                    ->whereNull('sales.deleted_at')
                    ->where('sales.id', $sale->id)
                    ->whereDate('sales.created_at', '>=' , $request->input('start_date'))
                    ->whereDate('sales.created_at', '<=' , $request->input('end_date'))
                    ->groupBy('product_sales.product_id', 'product_sales.product_batch_id')
                    ->get();
                config()->set('database.connections.mysql.strict', true);
                DB::reconnect();
                $product_cost = $this->calculateAverageCOGS($product_sale_data);
                $nestedData['total_cost'] = number_format($product_cost[0], $this->reportDecimal());
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($sale->paid_amount, $this->reportDecimal());
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, $this->reportDecimal());
                if($sale->sale_status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $sale_status = __('db.Completed');
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $sale_status = __('db.Pending');
                }
                else{
                    $nestedData['sale_status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $sale_status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerPaymentData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_id = $request->input('customer_id');
        $q = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->join('customers', 'customers.id', '=', 'sales.customer_id')
           ->where('sales.customer_id', $customer_id)
           ->whereNull('sales.deleted_at')
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'payments.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payments.*', 'sales.reference_no as sale_reference')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payments = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payments.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payments =  $q->orwhere([
                                ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payments.created_at', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payments.created_at', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['sale_reference'] = $payment->sale_reference;
                $nestedData['amount'] = number_format($payment->amount, $this->reportDecimal());
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_id = $request->input('customer_id');
        $q = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->leftJoin('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.customer_id', $customer_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'suppliers.name as supplier_name', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['warehouse'] = $quotation->warehouse_name;
                if($quotation->supplier_id) {
                    $nestedData['supplier'] = $quotation->supplier_name;
                }
                else
                    $nestedData['supplier'] = 'N/A';
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerReturnData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_id = $request->input('customer_id');
        $q = DB::table('returns')
            ->join('customers', 'returns.customer_id', '=', 'customers.id')
            ->join('warehouses', 'returns.warehouse_id', '=', 'warehouses.id')
            ->leftJoin('billers', 'returns.biller_id', '=', 'billers.id')
            ->where('returns.customer_id', $customer_id)
            ->whereDate('returns.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('returns.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'returns.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('returns.id', 'returns.reference_no', 'returns.grand_total', 'returns.created_at', 'warehouses.name as warehouse_name', 'billers.name as biller_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $returns = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('returns.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $returns =  $q->orwhere([
                                ['returns.reference_no', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['returns.created_at', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['returns.reference_no', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['returns.created_at', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $returns =  $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($returns))
        {
            foreach ($returns as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['warehouse'] = $sale->warehouse_name;
                $nestedData['biller'] = $sale->biller_name;
                $product_return_data = DB::table('returns')->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                                    ->join('products', 'product_returns.product_id', '=', 'products.id')
                                    ->where('returns.id', $sale->id)
                                    ->select('products.name as product_name', 'product_returns.qty', 'product_returns.sale_unit_id')
                                    ->get();
                foreach ($product_return_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerGroupReport(Request $request)
    {
        if (!$this->userCanCustomerReport()) {
            return $this->denyCustomerReportAccess($request);
        }

        $customer_group_id = $request->input('customer_group_id');
        if ($request->input('starting_date') || $request->input('start_date')) {
            $starting_date = $request->input('starting_date') ?: $request->input('start_date');
            $ending_date = $request->input('ending_date') ?: $request->input('end_date');
        } else {
            $starting_date = date('Y-m-d', strtotime('-1 year'));
            $ending_date = date('Y-m-d');
        }

        $lims_customer_group_list = CustomerGroup::where('is_active', true)->get();
        if (!$customer_group_id && $lims_customer_group_list->isNotEmpty()) {
            $customer_group_id = $lims_customer_group_list->first()->id;
        }

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'starting_date' => $starting_date,
                'ending_date' => $ending_date,
                'customer_group_id' => (int) ($customer_group_id ?? 0),
                'customer_groups' => $lims_customer_group_list->map(fn ($group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.customer_group_report', compact('starting_date', 'ending_date', 'customer_group_id', 'lims_customer_group_list'));
    }

    public function customerGroupSaleData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_group_id = $request->input('customer_group_id');
        $customer_ids = Customer::where('customer_group_id', $customer_group_id)->pluck('id');
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->whereNull('sales.deleted_at')
            ->where(function ($q) {
                $q->where('sales.sale_type', '!=', 'opening balance')
                ->orWhereNull('sales.sale_type');
            })
            ->whereIn('sales.customer_id', $customer_ids)
            ->whereDate('sales.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('ending_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('sales.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $sales =  $q->orwhere([
                                ['sales.reference_no', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['sales.created_at', 'LIKE', "%{$search}%"],
                                ['sales.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['sales.reference_no', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['sales.created_at', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['warehouse'] = $sale->warehouse_name;
                $nestedData['customer'] = $sale->customer_name.' ['.($sale->customer_number).']';
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
                                    ->where('sales.id', $sale->id)
                                    ->whereNull('sales.deleted_at')
                                    ->select('products.name as product_name', 'product_sales.qty', 'product_sales.sale_unit_id')
                                    ->get();
                foreach ($product_sale_data as $index => $product_sale) {
                    if($product_sale->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_sale->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($sale->paid_amount, $this->reportDecimal());
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, $this->reportDecimal());
                if($sale->sale_status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $sale_status = __('db.Completed');
                }
                elseif($sale->sale_status == 2){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $sale_status = __('db.Pending');
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $sale_status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerGroupPaymentData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_group_id = $request->input('customer_group_id');
        $customer_ids = Customer::where('customer_group_id', $customer_group_id)->pluck('id');
        $q = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->join('customers', 'customers.id', '=', 'sales.customer_id')
           ->whereNull('sales.deleted_at')
           ->whereIn('sales.customer_id', $customer_ids)
           ->whereDate('payments.created_at', '>=' , $request->input('starting_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('ending_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'sales.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payments.*', 'sales.reference_no as sale_reference', 'customers.name as customer_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payments = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payments.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payments =  $q->orwhere([
                                ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payments.created_at', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payments.created_at', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['sale_reference'] = $payment->sale_reference;
                $nestedData['customer'] = $payment->customer_name;
                $nestedData['amount'] = number_format($payment->amount, $this->reportDecimal());
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerGroupQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_group_id = $request->input('customer_group_id');
        $customer_ids = Customer::where('customer_group_id', $customer_group_id)->pluck('id');
        $q = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->leftJoin('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->whereIn('quotations.customer_id', $customer_ids)
            ->whereDate('quotations.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('ending_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'suppliers.name as supplier_name', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['warehouse'] = $quotation->warehouse_name;
                $nestedData['customer'] = $quotation->customer_name.' ['.($quotation->customer_number).']';
                if($quotation->supplier_id) {
                    $nestedData['supplier'] = $quotation->supplier_name;
                }
                else
                    $nestedData['supplier'] = 'N/A';
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerGroupReturnData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $customer_group_id = $request->input('customer_group_id');
        $customer_ids = Customer::where('customer_group_id', $customer_group_id)->pluck('id');
        $q = DB::table('returns')
            ->join('customers', 'returns.customer_id', '=', 'customers.id')
            ->join('warehouses', 'returns.warehouse_id', '=', 'warehouses.id')
            ->whereIn('returns.customer_id', $customer_ids)
            ->whereDate('returns.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('returns.created_at', '<=' ,$request->input('ending_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'returns.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('returns.id', 'returns.reference_no', 'returns.grand_total', 'returns.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $returns = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('returns.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $returns =  $q->orwhere([
                                ['returns.reference_no', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['returns.created_at', 'LIKE', "%{$search}%"],
                                ['returns.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['returns.reference_no', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['returns.created_at', 'LIKE', "%{$search}%"],
                                    ['returns.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $returns =  $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($returns))
        {
            foreach ($returns as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['warehouse'] = $sale->warehouse_name;
                $nestedData['customer'] = $sale->customer_name.' ['.($sale->customer_number).']';
                $product_return_data = DB::table('returns')->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                                    ->join('products', 'product_returns.product_id', '=', 'products.id')
                                    ->where('returns.id', $sale->id)
                                    ->select('products.name as product_name', 'product_returns.qty', 'product_returns.sale_unit_id')
                                    ->get();
                foreach ($product_return_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, $this->reportDecimal());
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function supplierReport(Request $request)
    {
        if (!$this->userCanSupplierReport()) {
            return $this->denySupplierReportAccess($request);
        }

        $supplier_id = $request->input('supplier_id');
        if ($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        } else {
            $start_date = date('Y-m-d', strtotime('-1 year'));
            $end_date = date('Y-m-d');
        }

        $lims_supplier_list = Supplier::where('is_active', true)->get();
        if (!$supplier_id && $lims_supplier_list->isNotEmpty()) {
            $supplier_id = $lims_supplier_list->first()->id;
        }

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'supplier_id' => (int) ($supplier_id ?? 0),
                'suppliers' => $lims_supplier_list->map(fn ($supplier) => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'phone_number' => $supplier->phone_number,
                    'label' => trim($supplier->name.' ('.$supplier->phone_number.')'),
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        return view('backend.report.supplier_report', compact('start_date', 'end_date', 'supplier_id', 'lims_supplier_list'));
    }

    private function userCanSupplierReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('supplier-report');
    }

    private function denySupplierReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }

    public function supplierPurchaseData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $supplier_id = $request->input('supplier_id');
        $q = DB::table('purchases')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'purchases.warehouse_id', '=', 'warehouses.id')
            ->where('purchases.supplier_id', $supplier_id)
            ->whereNull('purchases.deleted_at')
            ->where(function ($q) {
                $q->where('purchases.purchase_type', '!=', 'opening balance')
                ->orWhereNull('purchases.purchase_type');
            })
            ->whereDate('purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('purchases.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'purchases.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('purchases.id', 'purchases.reference_no', 'purchases.grand_total', 'purchases.paid_amount', 'purchases.status', 'purchases.created_at', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $purchases = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('purchases.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $purchases =  $q->orwhere([
                                ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['purchases.created_at', 'LIKE', "%{$search}%"],
                                ['purchases.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['purchases.reference_no', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['purchases.created_at', 'LIKE', "%{$search}%"],
                                    ['purchases.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $purchases =  $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases as $key => $purchase)
            {
                $nestedData['id'] = $purchase->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($purchase->created_at));
                $nestedData['reference_no'] = $purchase->reference_no;
                $nestedData['warehouse'] = $purchase->warehouse_name;
                $product_purchase_data = DB::table('purchases')->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                    ->join('products', 'product_purchases.product_id', '=', 'products.id')
                                    ->where('purchases.id', $purchase->id)
                                    ->whereNull('purchases.deleted_at')
                                    ->select('products.name as product_name', 'product_purchases.qty', 'product_purchases.purchase_unit_id')
                                    ->get();
                foreach ($product_purchase_data as $index => $product_purchase) {
                    if($product_purchase->purchase_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_purchase->purchase_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, $this->reportDecimal());
                $nestedData['paid'] = number_format($purchase->paid_amount, $this->reportDecimal());
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, $this->reportDecimal());
                if($purchase->status == 1){
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Completed').'</div>';
                    $status = __('db.Completed');
                }
                elseif($purchase->status == 2){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $status = __('db.Pending');
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-warning">'.__('db.Draft').'</div>';
                    $status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function supplierPaymentData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $supplier_id = $request->input('supplier_id');
        $q = DB::table('payments')
           ->join('purchases', 'payments.purchase_id', '=', 'purchases.id')
           ->where('purchases.supplier_id', $supplier_id)
           ->whereNull('purchases.deleted_at')
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'payments.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('payments.*', 'purchases.reference_no as purchase_reference')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $payments = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('payments.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $payments =  $q->orwhere([
                                ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['payments.created_at', 'LIKE', "%{$search}%"],
                                ['payments.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['payments.payment_reference', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['payments.created_at', 'LIKE', "%{$search}%"],
                                    ['payments.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['purchase_reference'] = $payment->purchase_reference;
                $nestedData['amount'] = number_format($payment->amount, $this->reportDecimal());
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function supplierReturnData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $supplier_id = $request->input('supplier_id');
        $q = DB::table('return_purchases')
            ->join('suppliers', 'return_purchases.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'return_purchases.warehouse_id', '=', 'warehouses.id')
            ->where('return_purchases.supplier_id', $supplier_id)
            ->whereDate('return_purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('return_purchases.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'return_purchases.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('return_purchases.id', 'return_purchases.reference_no', 'return_purchases.grand_total', 'return_purchases.created_at', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $return_purchases = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('return_purchases.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $return_purchases =  $q->orwhere([
                                ['return_purchases.reference_no', 'LIKE', "%{$search}%"],
                                ['return_purchases.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['return_purchases.created_at', 'LIKE', "%{$search}%"],
                                ['return_purchases.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['return_purchases.reference_no', 'LIKE', "%{$search}%"],
                                    ['return_purchases.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['return_purchases.created_at', 'LIKE', "%{$search}%"],
                                    ['return_purchases.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $return_purchases =  $q->orwhere('return_purchases.created_at', 'LIKE', "%{$search}%")->orwhere('return_purchases.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('return_purchases.created_at', 'LIKE', "%{$search}%")->orwhere('return_purchases.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($return_purchases))
        {
            foreach ($return_purchases as $key => $return)
            {
                $nestedData['id'] = $return->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($return->created_at));
                $nestedData['reference_no'] = $return->reference_no;
                $nestedData['warehouse'] = $return->warehouse_name;
                $product_return_data = DB::table('return_purchases')->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                                    ->join('products', 'purchase_product_return.product_id', '=', 'products.id')
                                    ->where('return_purchases.id', $return->id)
                                    ->select('products.name as product_name', 'purchase_product_return.qty', 'purchase_product_return.purchase_unit_id')
                                    ->get();
                foreach ($product_return_data as $index => $product_return) {
                    if($product_return->purchase_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->purchase_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($return->grand_total, $this->reportDecimal());
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function supplierQuotationData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $supplier_id = $request->input('supplier_id');
        $q = DB::table('quotations')
            ->join('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->leftJoin('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.supplier_id', $supplier_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'quotations.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'customers.name as customer_name', 'warehouses.name as warehouse_name')
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $quotations = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q->whereDate('quotations.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))));
            if(Auth::user()->role_id > 2 && config('staff_access') == 'own') {
                $quotations =  $q->orwhere([
                                ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->orwhere([
                                ['quotations.created_at', 'LIKE', "%{$search}%"],
                                ['quotations.user_id', Auth::id()]
                            ])
                            ->get();
                $totalFiltered = $q->orwhere([
                                    ['quotations.reference_no', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['quotations.created_at', 'LIKE', "%{$search}%"],
                                    ['quotations.user_id', Auth::id()]
                                ])
                                ->count();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->get();
                $totalFiltered = $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%")->count();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations as $key => $quotation)
            {
                $nestedData['id'] = $quotation->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($quotation->created_at));
                $nestedData['reference_no'] = $quotation->reference_no;
                $nestedData['warehouse'] = $quotation->warehouse_name;
                $nestedData['customer'] = $quotation->customer_name;
                $product_quotation_data = DB::table('quotations')->join('product_quotation', 'quotations.id', '=', 'product_quotation.quotation_id')
                                    ->join('products', 'product_quotation.product_id', '=', 'products.id')
                                    ->where('quotations.id', $quotation->id)
                                    ->select('products.name as product_name', 'product_quotation.qty', 'product_quotation.sale_unit_id')
                                    ->get();
                foreach ($product_quotation_data as $index => $product_return) {
                    if($product_return->sale_unit_id) {
                        $unit_data = DB::table('units')->select('unit_code')->find($product_return->sale_unit_id);
                        $unitCode = $unit_data->unit_code;
                    }
                    else
                        $unitCode = '';
                    if($index)
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, $this->reportDecimal()).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, $this->reportDecimal());
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $json_data = array(
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data
        );
        echo json_encode($json_data);
    }

    public function customerDueReportByDate(Request $request)
    {
        if (!$this->userCanDueReport()) {
            return $this->denyDueReportAccess($request);
        }

        $start_date = $request->input('start_date') ?: date('Y-m-d', strtotime('-1 year'));
        $end_date = $request->input('end_date') ?: date('Y-m-d');
        $customer_id = (int) ($request->input('customer_id') ?? 0);

        $lims_customer_list = Customer::where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'customer_id' => $customer_id,
                'customers' => $lims_customer_list->map(fn ($customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone_number' => $customer->phone_number,
                    'label' => trim($customer->name.' ['.$customer->phone_number.']'),
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        $lims_sale_data = [];
        if ($customer_id) {
            $lims_sale_data = Sale::where('payment_status', '!=', 4)
                ->whereNull('deleted_at')
                ->where('customer_id', $customer_id)
                ->whereDate('created_at', '>=' , $start_date)
                ->whereDate('created_at', '<=' , $end_date)
                ->when($this->own_data, fn($q) => $q->where('user_id', $this->current_user_id))
                ->get();
        } else {
            $lims_sale_data = Sale::where('payment_status', '!=', 4)
                ->whereNull('deleted_at')
                ->whereDate('created_at', '>=' , $start_date)
                ->whereDate('created_at', '<=' , $end_date)
                ->when($this->own_data, fn($q) => $q->where('user_id', $this->current_user_id))
                ->get();
        }

        return view('backend.report.due_report', compact('lims_sale_data', 'start_date', 'end_date', 'customer_id', 'lims_customer_list'));
    }

    public function customerDueReportData(Request $request)
    {
        if (!$this->userCanDueReport()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $decimal  = $this->reportDecimal();
        $start    = intval($request->input('start'));
        $length   = $request->input('length');
        $search   = $request->input('search.value');
        $orderCol = intval($request->input('order.0.column'));
        $orderDir = $request->input('order.0.dir') === 'asc' ? 'asc' : 'desc';

        // Column index to actual DB column mapping
        $sortableColumns = [
            1 => DB::raw('sales.created_at'),
            2 => DB::raw('sales.reference_no'),
            3 => DB::raw('customers.name'),
            4 => DB::raw('sales.grand_total'),
            5 => DB::raw('returned_amount'),
            6 => DB::raw('sales.paid_amount'),
            7 => DB::raw('due'),
        ];

        $sortColumn = $sortableColumns[$orderCol] ?? DB::raw('sales.created_at');

        // -------------------------------------------------------
        // HELPER: build base query fresh every time (no clone)
        // -------------------------------------------------------
        $buildQuery = function () use ($request) {
            $q = DB::table('sales')
                ->join('customers', 'sales.customer_id', '=', 'customers.id')
                ->leftJoin('returns', 'returns.sale_id', '=', 'sales.id')
                ->where('sales.payment_status', '!=', 4)
                ->whereNull('sales.deleted_at')
                ->where(function ($q) {
                    $q->where('sales.sale_type', '!=', 'opening balance')
                    ->orWhereNull('sales.sale_type');
                })
                ->whereDate('sales.created_at', '>=', $request->input('start_date'))
                ->whereDate('sales.created_at', '<=', $request->input('end_date'));

            // Customer filter
            if ($request->filled('customer_id') && $request->customer_id != 0) {
                $q->where('sales.customer_id', $request->customer_id);
            }

            // Access control
            if (Auth::user()->role_id > 2) {
                if (config('staff_access') === 'own') {
                    $q->where('sales.user_id', Auth::id());
                } elseif (config('staff_access') === 'warehouse') {
                    $q->where('sales.warehouse_id', Auth::user()->warehouse_id);
                }
            }

            return $q;
        };

        // -------------------------------------------------------
        // HELPER: apply search on top of base query
        // -------------------------------------------------------
        $applySearch = function ($q, $search) {
            if (!empty($search)) {
                $searchDate = date('Y-m-d', strtotime(str_replace('/', '-', $search)));
                $q->where(function ($q) use ($search, $searchDate) {
                    $q->whereDate('sales.created_at', $searchDate)
                    ->orWhere('sales.reference_no', 'LIKE', "%{$search}%")
                    ->orWhere('customers.name', 'LIKE', "%{$search}%")
                    ->orWhere('customers.phone_number', 'LIKE', "%{$search}%");
                });
            }
            return $q;
        };

        // -------------------------------------------------------
        // 1. TOTAL COUNT (no search)
        // -------------------------------------------------------
        $totalData = $buildQuery()
            ->distinct()
            ->count('sales.id');

        // -------------------------------------------------------
        // 2. FILTERED COUNT (with search)
        // -------------------------------------------------------
        $filteredQuery = $applySearch($buildQuery(), $search);
        $totalFiltered = (clone $filteredQuery)
            ->distinct()
            ->count('sales.id');

        // -------------------------------------------------------
        // 3. CARD TOTALS — সব filtered record এর total
        // -------------------------------------------------------
        $cardQuery = $applySearch($buildQuery(), $search)
            ->select(
                DB::raw('SUM(sales.grand_total) as total_grand'),
                DB::raw('SUM(sales.paid_amount) as total_paid'),
                DB::raw('COALESCE(SUM(returns.grand_total / NULLIF(returns.exchange_rate, 0)), 0) as total_returned')
            )
            ->first();

        $total_grand    = $cardQuery->total_grand ?? 0;
        $total_paid     = $cardQuery->total_paid ?? 0;
        $total_returned = $cardQuery->total_returned ?? 0;
        $total_due      = $total_grand - $total_returned - $total_paid;

        // -------------------------------------------------------
        // 4. MAIN DATA QUERY — with groupBy then orderBy
        // -------------------------------------------------------
        $limit = ($length != -1) ? intval($length) : $totalFiltered;

        $sales = $applySearch($buildQuery(), $search)
            ->select(
                'sales.id',
                'sales.reference_no',
                'sales.grand_total',
                'sales.created_at',
                'sales.paid_amount',
                'customers.name as customer_name',
                'customers.phone_number as customer_phone',
                'customers.address as customer_address',
                DB::raw('COALESCE(SUM(returns.grand_total / NULLIF(returns.exchange_rate, 0)), 0) as returned_amount'),
                DB::raw('(sales.grand_total - COALESCE(SUM(returns.grand_total / NULLIF(returns.exchange_rate, 0)), 0) - sales.paid_amount) as due')
            )
            ->groupBy(
                'sales.id',
                'sales.reference_no',
                'sales.grand_total',
                'sales.created_at',
                'sales.paid_amount',
                'customers.name',
                'customers.phone_number',
                'customers.address'
            )
            ->orderBy($sortColumn, $orderDir)
            ->offset($start)
            ->limit($limit)
            ->get();

        // -------------------------------------------------------
        // 5. FORMAT DATA
        // -------------------------------------------------------
        $data = [];
        foreach ($sales as $key => $sale) {
            $data[] = [
                'id'              => $sale->id,
                'key'             => $key,
                'date'            => date(config('date_format'), strtotime($sale->created_at)),
                'reference_no'    => $sale->reference_no,
                'customer'        => $sale->customer_name
                                    . '<br><small class="text-muted">' . $sale->customer_phone . '</small>'
                                    . ($sale->customer_address
                                        ? '<br><small class="text-muted">' . $sale->customer_address . '</small>'
                                        : ''),
                'grand_total'     => number_format($sale->grand_total, $decimal),
                'returned_amount' => number_format($sale->returned_amount, $decimal),
                'paid'            => number_format($sale->paid_amount ?? 0, $decimal),
                'due'             => number_format($sale->due, $decimal),
            ];
        }

        // -------------------------------------------------------
        // 6. JSON RESPONSE
        // -------------------------------------------------------
        return response()->json([
            "draw"            => intval($request->input('draw')),
            "recordsTotal"    => intval($totalData),
            "recordsFiltered" => intval($totalFiltered),
            "data"            => $data,
            "total_grand"     => number_format($total_grand, $decimal),
            "total_returned"  => number_format($total_returned, $decimal),
            "total_paid"      => number_format($total_paid, $decimal),
            "total_due"       => number_format($total_due, $decimal),
        ]);
    }

    public function supplierDueReportByDate(Request $request)
    {
        if (!$this->userCanSupplierDueReport()) {
            return $this->denySupplierDueReportAccess($request);
        }

        $start_date = $request->input('start_date') ?: date('Y-m-d', strtotime('-1 year'));
        $end_date = $request->input('end_date') ?: date('Y-m-d');
        $supplier_id = $request->input('supplier_id') ?: null;

        $lims_supplier_list = Supplier::where('is_active', true)->get();

        if ($this->wantsSpaResponse($request)) {
            $general_setting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'start_date' => $start_date,
                'end_date' => $end_date,
                'supplier_id' => $supplier_id ? (int) $supplier_id : '',
                'suppliers' => $lims_supplier_list->map(fn ($supplier) => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'phone_number' => $supplier->phone_number,
                    'label' => $supplier->name,
                ])->values(),
                'decimal' => (int) ($general_setting->decimal ?? config('decimal', 2)),
            ]);
        }

        $q = Purchase::where('payment_status', 1)
            ->whereNull('deleted_at')
            ->whereDate('updated_at', '>=', $start_date)
            ->whereDate('updated_at', '<=', $end_date);
        if ($supplier_id) {
            $q->where('supplier_id', $supplier_id);
        }
        $lims_purchase_data = $q->orderBy('updated_at', 'desc')->get();

        if ($request->ajax()) {
            return view('backend.report.partials.supplier_due_table', compact(
                'lims_purchase_data', 'start_date', 'end_date', 'lims_supplier_list', 'supplier_id'
            ))->render();
        }

        return view('backend.report.supplier_due_report', compact(
            'lims_purchase_data', 'start_date', 'end_date', 'lims_supplier_list', 'supplier_id'
        ));
    }

    public function supplierDueReportData(Request $request)
    {
        if (!$this->userCanSupplierDueReport()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $decimal = (int) (GeneralSetting::latest()->first()->decimal ?? config('decimal', 2));
        $start = intval($request->input('start'));
        $length = $request->input('length');
        $search = $request->input('search.value');
        $orderCol = intval($request->input('order.0.column'));
        $orderDir = $request->input('order.0.dir') === 'asc' ? 'asc' : 'desc';

        $sortableColumns = [
            1 => DB::raw('purchases.updated_at'),
            2 => DB::raw('purchases.reference_no'),
            3 => DB::raw('suppliers.name'),
            4 => DB::raw('purchases.grand_total'),
            5 => DB::raw('returned_amount'),
            6 => DB::raw('purchases.paid_amount'),
            7 => DB::raw('due'),
        ];
        $sortColumn = $sortableColumns[$orderCol] ?? DB::raw('purchases.updated_at');

        $buildQuery = function () use ($request) {
            $q = DB::table('purchases')
                ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                ->leftJoin('return_purchases', 'return_purchases.purchase_id', '=', 'purchases.id')
                ->where('purchases.payment_status', 1)
                ->whereNull('purchases.deleted_at')
                ->whereDate('purchases.updated_at', '>=', $request->input('start_date'))
                ->whereDate('purchases.updated_at', '<=', $request->input('end_date'));

            if ($request->filled('supplier_id')) {
                $q->where('purchases.supplier_id', $request->supplier_id);
            }

            if (Auth::user()->role_id > 2) {
                if (config('staff_access') === 'own') {
                    $q->where('purchases.user_id', Auth::id());
                } elseif (config('staff_access') === 'warehouse') {
                    $q->where('purchases.warehouse_id', Auth::user()->warehouse_id);
                }
            }

            return $q;
        };

        $applySearch = function ($q, $term) {
            if (!empty($term)) {
                $searchDate = date('Y-m-d', strtotime(str_replace('/', '-', $term)));
                $q->where(function ($q) use ($term, $searchDate) {
                    $q->whereDate('purchases.updated_at', $searchDate)
                        ->orWhere('purchases.reference_no', 'LIKE', "%{$term}%")
                        ->orWhere('suppliers.name', 'LIKE', "%{$term}%")
                        ->orWhere('suppliers.phone_number', 'LIKE', "%{$term}%");
                });
            }

            return $q;
        };

        $totalData = $buildQuery()->distinct()->count('purchases.id');
        $totalFiltered = $applySearch($buildQuery(), $search)->distinct()->count('purchases.id');
        $limit = ($length != -1) ? intval($length) : $totalFiltered;

        $rows = $applySearch($buildQuery(), $search)
            ->select(
                'purchases.id',
                'purchases.reference_no',
                'purchases.grand_total',
                'purchases.updated_at',
                'purchases.paid_amount',
                'suppliers.name as supplier_name',
                'suppliers.phone_number as supplier_phone',
                DB::raw('COALESCE(SUM(return_purchases.grand_total), 0) as returned_amount'),
                DB::raw('(purchases.grand_total - COALESCE(SUM(return_purchases.grand_total), 0) - COALESCE(purchases.paid_amount, 0)) as due')
            )
            ->groupBy(
                'purchases.id',
                'purchases.reference_no',
                'purchases.grand_total',
                'purchases.updated_at',
                'purchases.paid_amount',
                'suppliers.name',
                'suppliers.phone_number'
            )
            ->orderBy($sortColumn, $orderDir)
            ->offset($start)
            ->limit($limit)
            ->get();

        $data = [];
        foreach ($rows as $key => $purchase) {
            $data[] = [
                'id' => $purchase->id,
                'key' => $key,
                'date' => date(config('date_format'), strtotime($purchase->updated_at)),
                'reference_no' => $purchase->reference_no,
                'supplier' => $purchase->supplier_name.' ('.$purchase->supplier_phone.')',
                'grand_total' => number_format($purchase->grand_total, $decimal),
                'returned_amount' => number_format($purchase->returned_amount, $decimal),
                'paid' => number_format($purchase->paid_amount ?? 0, $decimal),
                'due' => number_format($purchase->due, $decimal),
            ];
        }

        return response()->json([
            'draw' => intval($request->input('draw')),
            'recordsTotal' => intval($totalData),
            'recordsFiltered' => intval($totalFiltered),
            'data' => $data,
        ]);
    }

    private function userCanSupplierDueReport(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('supplier-due-report');
    }

    private function denySupplierDueReportAccess(Request $request)
    {
        $message = __('db.Sorry! You are not allowed to access this module');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 403);
        }

        return redirect()->back()->with('not_permitted', $message);
    }
}
