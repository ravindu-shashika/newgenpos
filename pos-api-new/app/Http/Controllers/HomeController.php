<?php

namespace App\Http\Controllers;

use Cache;
use Printing;
use Exception;
use ZipArchive;
use Carbon\Carbon;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\Income;
use App\Models\Account;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\Product;
use App\Models\Returns;
use App\Models\Customer;
use App\Models\Purchase;
use App\Models\Quotation;
use App\Models\Product_Sale;
use App\Models\Warehouse;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use App\Models\ReturnPurchase;
use App\Models\ProductPurchase;
use App\Traits\AutoUpdateTrait;
use App\Models\Product_Warehouse;
use App\Traits\ENVFilePutContent;
use App\Traits\SpaResponse;
use App\Models\RewardPointSetting;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Rawilk\Printing\Contracts\Printer;
use Illuminate\Support\Facades\Artisan;

class HomeController extends Controller
{
    use AutoUpdateTrait, ENVFilePutContent, SpaResponse;

    private $versionUpgradeInfo = [];

	public function __construct()
    {
        if(!config('database.connections.saleprosaas_landlord')) {
            $this->versionUpgradeInfo = $this->isUpdateAvailable();
        }
	}

    public function home()
    {
        return view('backend.home');
    }

    public function index()
    {
        return redirect('dashboard');
    }

    public function addonList()
    {
        if(!config('database.connections.saleprosaas_landlord')) {
            $role = Role::find(Auth::user()->role_id);
            if(!$role->hasPermissionTo('addons')) {
                return redirect('dashboard')->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
            }
        }
        return view('backend.addonlist');
    }

    public function dashboard(Request $request)
    {
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();

        if ($this->hasModule('restaurant')) {
            if(Auth::user()->role_id > 2 && isset(Auth::user()->kitchen_id)){

                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, [
                        'dashboard_type' => 'kitchen',
                        'redirect' => url('kitchen/dashboard'),
                    ]);
                }

                $result = (new \Modules\Restaurant\Http\Controllers\KitchenController)->dashboard();

                return $result;
            }
        }

        if(Auth::user()->role_id == 5) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, $this->customerDashboardPayload());
            }

            $customer = Customer::select('id', 'points')->where('user_id', Auth::id())->first();
            $lims_sale_data = Sale::with('warehouse')
                                ->whereNull('deleted_at')
                                ->where('customer_id', $customer->id)
                                ->where(function($q) {
                                    $q->where('sale_type', '!=', 'opening balance')
                                    ->orWhereNull('sale_type');
                                })
                                ->orderBy('created_at', 'desc')
                                ->get();
            $lims_payment_data = DB::table('payments')
                           ->join('sales', 'payments.sale_id', '=', 'sales.id')
                           ->whereNull('sales.deleted_at')
                           ->where('customer_id', $customer->id)
                           ->select('payments.*', 'sales.reference_no as sale_reference')
                           ->orderBy('payments.created_at', 'desc')
                           ->get();
            $lims_quotation_data = Quotation::with('biller', 'customer', 'supplier', 'user')->orderBy('id', 'desc')->where('customer_id', $customer->id)->orderBy('created_at', 'desc')->get();

            $lims_return_data = Returns::with('warehouse', 'customer', 'biller')->where('customer_id', $customer->id)->orderBy('created_at', 'desc')->get();
            $lims_reward_point_setting_data = RewardPointSetting::select('per_point_amount')->latest()->first();
            return view('backend.customer_index', compact('customer', 'lims_sale_data', 'lims_payment_data', 'lims_quotation_data', 'lims_return_data', 'lims_reward_point_setting_data'));
        }

        $filter_end_date = date('Y-m-d');
        $filter_start_date = date('Y-m-d', strtotime('-29 days'));
        $end_date = $filter_end_date;
        $start_date = $filter_start_date;

        $yearly_sale_amount = [];
        $yearly_purchase_amount = [];
        $payment_recieved = [];
        $payment_sent = [];
        $month = [];

        if ($this->isStaffOwnAccess())
        {

            $sale_query = Sale::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->whereNull('deleted_at');

            $revenue = $sale_query->sum(DB::raw('(grand_total - shipping_cost) / exchange_rate'));

            $expense = Expense::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('amount');

            $purchase_query = Purchase::whereDate('created_at', '>=' , $start_date)
                            ->where('user_id', Auth::id())
                            ->whereDate('created_at', '<=' , $end_date)
                            ->whereNull('deleted_at')
                            ->where(function ($q) {
                                $q->where('purchase_type', '!=', 'opening balance')
                                ->orWhereNull('purchase_type');
                            });

            $return = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum(DB::raw('grand_total / exchange_rate'));
            
            $income = Income::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');

            $purchase = $purchase_query->sum(DB::raw('grand_total / exchange_rate'));

            $revenue = $revenue - $return + $income;

        }
        else
        {

            $sale_query = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->whereNull('deleted_at');

            $revenue = $sale_query->sum(DB::raw('(grand_total - shipping_cost) / exchange_rate'));

            $expense = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');

            $income = Income::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');

            $return = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('grand_total / exchange_rate'));

            $purchase_query = Purchase::whereDate('created_at', '>=' , $start_date)
                            ->whereDate('created_at', '<=' , $end_date)
                            ->whereNull('deleted_at')
                            ->where(function ($q) {
                                $q->where('purchase_type', '!=', 'opening balance')
                                ->orWhereNull('purchase_type');
                            });
           
            $purchase = $purchase_query->sum(DB::raw('grand_total / exchange_rate'));

            $revenue = $revenue - $return + $income;

        }

        //cash flow of last 6 months
        $start = strtotime(date('Y-m-01', strtotime('-5 month', strtotime(date('Y-m-d') ))));
        $end = strtotime(date('Y-m-'.date('t', mktime(0, 0, 0, date("m"), 1, date("Y")))));

        while($start < $end)
        {
            $start_date = date("Y-m", $start).'-'.'01';
            $end_date = date("Y-m", $start).'-'.date('t', mktime(0, 0, 0, date("m", $start), 1, date("Y", $start)));

            if ($this->isStaffOwnAccess()) {
                $recieved_amount = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum(DB::raw('amount / exchange_rate'));
                $sent_amount = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum(DB::raw('amount / exchange_rate'));
                $return_amount = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum(DB::raw('grand_total / exchange_rate'));
                $purchase_return_amount = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum(DB::raw('grand_total / exchange_rate'));
                $expense_amount = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
                $payroll_amount = Payroll::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
            }
            else {
                $recieved_amount = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('amount / exchange_rate'));
                $sent_amount = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('amount / exchange_rate'));
                $return_amount = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('grand_total / exchange_rate'));
                $purchase_return_amount = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('grand_total / exchange_rate'));
                $expense_amount = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
                $payroll_amount = Payroll::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
            }
            $sent_amount = $sent_amount + $return_amount + $expense_amount + $payroll_amount;

            $payment_recieved[] = number_format((float)($recieved_amount + $purchase_return_amount), config('decimal'), '.', '');
            $payment_sent[] = number_format((float)$sent_amount, config('decimal'), '.', '');
            $month[] = date("F", strtotime($start_date));
            $start = strtotime("+1 month", $start);
        }
        // yearly report
        $start = strtotime(date("Y") .'-01-01');
        $end = strtotime(date("Y") .'-12-31');
        while($start < $end)
        {
            $start_date = date("Y").'-'.date('m', $start).'-'.'01';
            $end_date = date("Y").'-'.date('m', $start).'-'.date('t', mktime(0, 0, 0, date("m", $start), 1, date("Y", $start)));
            if ($this->isStaffOwnAccess()) {
                $sale_amount = Sale::whereDate('created_at', '>=' , $start_date)
                                ->whereDate('created_at', '<=' , $end_date)
                                ->where('user_id', Auth::id())
                                ->whereNull('deleted_at')
                                ->sum(DB::raw('grand_total / exchange_rate'));

                $purchase_amount = Purchase::whereDate('created_at', '>=' , $start_date)
                                    ->whereDate('created_at', '<=' , $end_date)
                                    ->where('user_id', Auth::id())
                                    ->whereNull('deleted_at')
                                    ->where(function ($q) {
                                        $q->where('purchase_type', '!=', 'opening balance')
                                        ->orWhereNull('purchase_type');
                                    })
                                    ->sum(DB::raw('grand_total / exchange_rate'));
            }
            else{
                $sale_amount = Sale::whereDate('created_at', '>=' , $start_date)
                                ->whereDate('created_at', '<=' , $end_date)
                                ->whereNull('deleted_at')
                                ->sum(DB::raw('grand_total / exchange_rate'));
                $purchase_amount = Purchase::whereDate('created_at', '>=' , $start_date)
                                    ->whereDate('created_at', '<=' , $end_date)
                                    ->whereNull('deleted_at')
                                    ->where(function ($q) {
                                        $q->where('purchase_type', '!=', 'opening balance')
                                        ->orWhereNull('purchase_type');
                                    })
                                    ->sum(DB::raw('grand_total / exchange_rate'));
            }
            $yearly_sale_amount[] = number_format((float)$sale_amount, config('decimal'), '.', '');
            $yearly_purchase_amount[] = number_format((float)$purchase_amount, config('decimal'), '.', '');
            $start = strtotime("+1 month", $start);
        }
        
        //making strict mode true for this query
        config()->set('database.connections.mysql.strict', true);
        DB::reconnect();
        //fetching data for auto updates
        if(!config('database.connections.saleprosaas_landlord') && Auth::user()->role_id <= 2) {
            $versionUpgradeData = [];
            $versionUpgradeData = $this->versionUpgradeInfo;
        }
        else {
            $versionUpgradeData = [];
        }

        if ($this->wantsSpaResponse($request)) {
            $general = $this->resolveGeneralSetting();
            $theme = $general?->theme ?? 'default.css';
            $themeColors = $this->dashboardThemeColors($theme);
            $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
            $restaurantOrders = null;

            if ($this->hasModule('restaurant')) {
                if (Auth::user()->role_id > 2 && isset(Auth::user()->service_staff)) {
                    $restaurantOrders = DB::table('sales')
                        ->where('waiter_id', Auth::user()->id)
                        ->where('sale_status', 5)
                        ->orWhere('sale_status', 6)
                        ->where('sales.created_at', '>=', now()->subDay())
                        ->count();
                } elseif (Auth::user()->role_id <= 2) {
                    $restaurantOrders = DB::table('sales')
                        ->where('sale_status', 6)
                        ->where('sales.created_at', '>=', now()->subDay())
                        ->count();
                }
            }

            return $this->spaJson($request, [
                'dashboard_type' => 'admin',
                'user' => [
                    'name' => Auth::user()->name,
                    'role_id' => Auth::user()->role_id,
                    'warehouse_id' => Auth::user()->warehouse_id,
                ],
                'filter_start_date' => $filter_start_date,
                'filter_end_date' => $filter_end_date,
                'decimal' => (int) config('decimal'),
                'date_format' => $general?->date_format ?? 'd-m-Y',
                'warehouses' => $warehouses,
                'monthly_summary' => [
                    'revenue' => (float) $revenue,
                    'purchase' => (float) $purchase,
                    'expense' => (float) $expense,
                    'month_label' => date('F Y'),
                ],
                'cash_flow' => [
                    'received' => $payment_recieved,
                    'sent' => $payment_sent,
                    'months' => $month,
                ],
                'yearly_report' => [
                    'sale' => $yearly_sale_amount,
                    'purchase' => $yearly_purchase_amount,
                    'year' => date('Y'),
                ],
                'theme' => $themeColors,
                'version_upgrade' => $versionUpgradeData,
                'restaurant_orders' => $restaurantOrders,
                'product_image_base' => url('/images/product'),
                'default_product_image' => 'zummXD2dvAtI.png',
            ]);
        }

        return view('backend.index', compact('start_date','end_date','revenue', 'purchase', 'expense', 'payment_recieved', 'payment_sent', 'month', 'yearly_sale_amount', 'yearly_purchase_amount', 'versionUpgradeData'));
    }

    public function dashboardFilter(Request $request, $start_date, $end_date, $warehouse_id)
    {
        $start_date = Carbon::parse($start_date)->startOfDay();
        $end_date = Carbon::parse($end_date)->endOfDay();

        if ($this->isStaffOwnAccess()) {
            config()->set('database.connections.mysql.strict', false);
            DB::reconnect();

            $q = Sale::join('product_sales', 'sales.id','=', 'product_sales.sale_id')
                ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.return_qty) as return_qty, sum(product_sales.total) as sold_amount'))
                ->whereNull('sales.deleted_at')
                ->where('sales.user_id', Auth::id())
                ->whereBetween('sales.created_at', [$start_date, $end_date]);

            if($warehouse_id != 0) {
                $q->where('sales.warehouse_id',$warehouse_id);
            }

            $product_sale_data = $q->groupBy('product_sales.product_id', 'product_sales.product_batch_id')->get();

            config()->set('database.connections.mysql.strict', true);
            DB::reconnect();

            $product_cost = $this->calculateAverageCOGS($product_sale_data);

            $total_sale_q = Sale::where('user_id', Auth::id())->whereBetween('created_at', [$start_date, $end_date])->whereNull('deleted_at');

            $purchase_q = Purchase::where('user_id', Auth::id())
                        ->whereBetween('created_at', [$start_date, $end_date])
                        ->whereNull('deleted_at')
                        ->where(function ($q) {
                            $q->where('purchase_type', '!=', 'opening balance')
                            ->orWhereNull('purchase_type');
                        });

            $return_q = Returns::where('user_id', Auth::id())->whereBetween('created_at', [$start_date, $end_date]);

            $purchase_return_q = ReturnPurchase::where('user_id', Auth::id())->whereBetween('created_at', [$start_date, $end_date]);

            if($warehouse_id != 0) {
                $total_sale_q->where('warehouse_id',$warehouse_id);
                $purchase_q->where('warehouse_id',$warehouse_id);
                $return_q->where('warehouse_id',$warehouse_id);
                $purchase_return_q->where('warehouse_id',$warehouse_id);
            }

            $total_sale = $total_sale_q->sum(DB::raw('(grand_total - shipping_cost) / exchange_rate'));
            $purchase = $purchase_q->sum(DB::raw('grand_total / exchange_rate'));
            $return = $return_q->sum(DB::raw('grand_total / exchange_rate'));
            $purchase_return = $purchase_return_q->sum(DB::raw('grand_total / exchange_rate'));

            $invoice_due = Sale::whereBetween('created_at', [$start_date, $end_date])
                            ->whereNull('deleted_at')
                            ->whereNull('sale_type')
                            ->where('user_id', Auth::id())
                            ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                                $q->where('warehouse_id', $warehouse_id);
                            })
                            ->sum(DB::raw('(grand_total - paid_amount) / exchange_rate'));

            $purchase_due = Purchase::whereBetween('created_at', [$start_date, $end_date])
                            ->whereNull('deleted_at')
                            ->whereNull('purchase_type')
                            ->where('user_id', Auth::id())
                            ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                                $q->where('warehouse_id', $warehouse_id);
                            })
                            ->sum(DB::raw('(grand_total - paid_amount) / exchange_rate'));

            $expense = Expense::whereBetween('created_at', [$start_date, $end_date])
                ->where('user_id', Auth::id())
                ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                    $q->where('warehouse_id', $warehouse_id);
                })
                ->sum('amount');


            $income = Income::whereBetween('created_at', [$start_date, $end_date])
                ->where('user_id', Auth::id())
                ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                    $q->where('warehouse_id', $warehouse_id);
                })
                ->sum('amount');

            $revenue = $total_sale - $return + $income;
            $profit = $revenue + $purchase_return - $product_cost - $expense;

        } else {
            config()->set('database.connections.mysql.strict', false);
            DB::reconnect();

            $q = Sale::join('product_sales', 'sales.id','=', 'product_sales.sale_id')
                ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.return_qty) as return_qty, sum(product_sales.total) as sold_amount'))
                ->whereNull('sales.deleted_at')
                ->where(function ($q) {
                    $q->where('sales.sale_type', '!=', 'opening balance')
                    ->orWhereNull('sales.sale_type');
                })
                ->whereBetween('sales.created_at', [$start_date, $end_date]);

            if($warehouse_id != 0) {
                $q->where('sales.warehouse_id',$warehouse_id);
            }

            $product_sale_data = $q->groupBy('product_sales.product_id', 'product_sales.product_batch_id')->get();

            config()->set('database.connections.mysql.strict', true);
            DB::reconnect();

            $product_cost = $this->calculateAverageCOGS($product_sale_data);

            $total_sale_q = Sale::whereBetween('created_at', [$start_date, $end_date])
                            ->whereNull('deleted_at')
                            ->where(function ($q) {
                                $q->where('sale_type', '!=', 'opening balance')
                                ->orWhereNull('sale_type');
                            });

            $purchase_q = Purchase::whereBetween('created_at', [$start_date, $end_date])
                        ->whereNull('deleted_at')
                        ->where(function ($q) {
                            $q->where('purchase_type', '!=', 'opening balance')
                            ->orWhereNull('purchase_type');
                        });

            $return_q = Returns::whereBetween('created_at', [$start_date, $end_date]);

            $purchase_return_q = ReturnPurchase::whereBetween('created_at', [$start_date, $end_date]);

            if($warehouse_id != 0) {
                $total_sale_q->where('warehouse_id',$warehouse_id);
                $purchase_q->where('warehouse_id',$warehouse_id);
                $return_q->where('warehouse_id',$warehouse_id);
                $purchase_return_q->where('warehouse_id',$warehouse_id);
            }

            $total_sale = $total_sale_q->sum(DB::raw('(grand_total - shipping_cost) / exchange_rate'));
            $purchase = $purchase_q->sum(DB::raw('grand_total / exchange_rate'));
            $return = $return_q->sum(DB::raw('grand_total / exchange_rate'));
            $purchase_return = $purchase_return_q->sum(DB::raw('grand_total / exchange_rate'));

            $invoice_due = Sale::whereBetween('created_at', [$start_date, $end_date])
                            ->whereNull('deleted_at')
                            ->whereNull('sales.sale_type')
                            ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                                $q->where('warehouse_id', $warehouse_id);
                            })
                            ->sum(DB::raw('(grand_total - paid_amount) / exchange_rate'));

            $purchase_due = Purchase::whereBetween('created_at', [$start_date, $end_date])
                            ->whereNull('deleted_at')
                            ->whereNull('purchase_type')
                            ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                                $q->where('warehouse_id', $warehouse_id);
                            })
                            ->sum(DB::raw('(grand_total - paid_amount) / exchange_rate'));

            $expense = Expense::whereBetween('created_at', [$start_date, $end_date])
                ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                    $q->where('warehouse_id', $warehouse_id);
                })
                ->sum('amount');


            $income = Income::whereBetween('created_at', [$start_date, $end_date])
                ->when($warehouse_id != 0, function ($q) use ($warehouse_id) {
                    $q->where('warehouse_id', $warehouse_id);
                })
                ->sum('amount');

            $revenue = $total_sale - $return + $income;
            $profit = $revenue + $purchase_return - $product_cost - $expense;
        }
            // ✅ return all 8 values

        $data[0] = $revenue;
        $data[1] = $return;
        $data[2] = $profit;
        $data[3] = $purchase_return;
        $data[4] = $total_sale;
        $data[5] = $invoice_due ?? 0;
        $data[6] = $purchase - $purchase_return;
        $data[7] = $purchase_due ?? 0;
        $data[8] = $expense ?? 0;

        if ($this->wantsSpaResponse($request)) {
            return response()->json($data);
        }

        return $data;
    }

    private function resolveGeneralSetting(): ?GeneralSetting
    {
        $general = cache()->get('general_setting');
        if ($general) {
            return $general;
        }

        $general = GeneralSetting::latest()->first();
        if ($general) {
            cache()->put('general_setting', $general, 60 * 60 * 24);
        }

        return $general;
    }

    private function hasModule(string $module): bool
    {
        $modules = $this->resolveGeneralSetting()?->modules ?? '';

        return in_array($module, explode(',', (string) $modules), true);
    }

    private function isStaffOwnAccess(): bool
    {
        return Auth::user()->role_id > 2
            && ($this->resolveGeneralSetting()?->staff_access ?? '') === 'own';
    }

    private function dashboardThemeColors(string $theme): array
    {
        $map = [
            'default.css' => ['color' => '#733686', 'color_rgba' => 'rgba(115, 54, 134, 0.8)'],
            'green.css' => ['color' => '#2ecc71', 'color_rgba' => 'rgba(46, 204, 113, 0.8)'],
            'blue.css' => ['color' => '#3498db', 'color_rgba' => 'rgba(52, 152, 219, 0.8)'],
            'dark.css' => ['color' => '#34495e', 'color_rgba' => 'rgba(52, 73, 94, 0.8)'],
        ];

        return $map[$theme] ?? $map['default.css'];
    }

    private function customerDashboardPayload(): array
    {
        $customer = Customer::select('id', 'points')->where('user_id', Auth::id())->first();
        if (!$customer) {
            return [
                'dashboard_type' => 'customer',
                'user' => ['name' => Auth::user()->name],
                'sales' => [],
                'payments' => [],
                'quotations' => [],
                'returns' => [],
            ];
        }

        $lims_sale_data = Sale::with(['warehouse', 'biller', 'customer', 'user'])
            ->whereNull('deleted_at')
            ->where('customer_id', $customer->id)
            ->where(function ($q) {
                $q->where('sale_type', '!=', 'opening balance')
                    ->orWhereNull('sale_type');
            })
            ->orderBy('created_at', 'desc')
            ->get();
        $lims_payment_data = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.id')
            ->whereNull('sales.deleted_at')
            ->where('customer_id', $customer->id)
            ->select('payments.*', 'sales.reference_no as sale_reference')
            ->orderBy('payments.created_at', 'desc')
            ->get();
        $lims_quotation_data = Quotation::with('biller', 'customer', 'supplier', 'user')
            ->orderBy('id', 'desc')
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->get();
        $lims_return_data = Returns::with('warehouse', 'customer', 'biller')
            ->where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->get();
        $lims_reward_point_setting_data = RewardPointSetting::select('per_point_amount')->latest()->first();
        $general = $this->resolveGeneralSetting();

        return [
            'dashboard_type' => 'customer',
            'user' => ['name' => Auth::user()->name],
            'customer' => $customer,
            'reward_point' => $lims_reward_point_setting_data,
            'decimal' => (int) config('decimal'),
            'date_format' => $general?->date_format ?? 'd-m-Y',
            'sales' => $lims_sale_data,
            'payments' => $lims_payment_data,
            'quotations' => $lims_quotation_data,
            'returns' => $lims_return_data,
        ];
    }

    public function calculateAverageCOGS($product_sale_data)
    {
        // Initialize total product cost
        $product_cost = 0;

        // Loop through each sold product entry
        foreach ($product_sale_data as $key => $product_sale) {

            // Fetch product details for the sold product
            $product_data = Product::select('type', 'product_list', 'variant_list', 'qty_list')
                ->find($product_sale->product_id);

            // If product is a combo (bundle of multiple products)
            if($product_data && $product_data->type == 'combo') {
                $product_list = explode(",", $product_data->product_list);

                // Handle variants if present
                if($product_data->variant_list)
                    $variant_list = explode(",", $product_data->variant_list);
                else
                    $variant_list = [];

                // Quantities of each product in the combo
                $qty_list = explode(",", $product_data->qty_list);

                // Loop through each product inside the combo
                foreach ($product_list as $index => $product_id) {

                    // If product has variants, fetch purchase data accordingly
                    if(count($variant_list) && $variant_list[$index]) {
                        $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where([
                            ['product_purchases.product_id', $product_id],
                            ['product_purchases.variant_id', $variant_list[$index] ]
                        ])
                        ->whereNull('purchases.deleted_at')
                        ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.total')
                        ->get();
                    }
                    else {
                        // Fetch all purchases for this product
                        $product_purchase_data = ProductPurchase::join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
                        ->where('product_purchases.product_id', $product_id)
                        ->whereNull('purchases.deleted_at')
                        ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.total')
                        ->get();
                    }

                    $total_received_qty = 0;
                    $total_purchased_amount = 0;

                    // Calculate sold quantity of this sub-product in the combo
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $qty_list[$index];

                    // Fetch all unit conversion data
                    $units = Unit::select('id', 'operator', 'operation_value')->get();

                    // Loop through all purchases for this product
                    foreach ($product_purchase_data as $key => $product_purchase) {
                        $purchase_unit_data = $units->where('id',$product_purchase->purchase_unit_id)->first();

                        // Convert received quantity into base unit
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;

                        // Accumulate purchase cost
                        if(isset($product_purchase->exchange_rate) && $product_purchase->exchange_rate != 0)
                            $total_purchased_amount += $product_purchase->total/$product_purchase->exchange_rate;
                        else
                            $total_purchased_amount += $product_purchase->total;
                    }

                    // Compute average cost (purchase amount / total received qty)
                    if($total_received_qty)
                        $averageCost = $total_purchased_amount / $total_received_qty;
                    else
                        $averageCost = 0;

                    // Add to total product cost
                    $product_cost += $sold_qty * $averageCost;
                }
            }
            else {
                // For normal products (not combo)

                // Fetch purchase data depending on batch or variant
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
                    ->select('purchases.exchange_rate', 'product_purchases.recieved', 'product_purchases.purchase_unit_id', 'product_purchases.tax', 'product_purchases.total')
                    ->get();
                }

                $total_received_qty = 0;
                $total_purchased_amount = 0;

                // Fetch all unit conversion data
                $units = Unit::select('id', 'operator', 'operation_value')->get();

                // Convert sold quantity into base unit if sale unit is defined
                if($product_sale->sale_unit_id) {
                    $sale_unit_data = $units->where('id', $product_sale->sale_unit_id)->first();
                    if($sale_unit_data->operator == '*')
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $sale_unit_data->operation_value;
                    else
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) / $sale_unit_data->operation_value;
                }
                else {
                    // If no unit conversion, just take raw sold qty
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty);
                }

                // Loop through purchases to accumulate received qty and purchase amount
                foreach ($product_purchase_data as $key => $product_purchase) {
                    $purchase_unit_data = $units->where('id', $product_purchase->purchase_unit_id)->first();
                    if($purchase_unit_data) {
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;

                        if(isset($product_purchase->exchange_rate) && $product_purchase->exchange_rate != 0)
                            $total_purchased_amount += $product_purchase->total/$product_purchase->exchange_rate;
                        else
                            $total_purchased_amount += $product_purchase->total;
                    }
                }

                // Calculate average cost for the product
                if($total_received_qty)
                    $averageCost = $total_purchased_amount / $total_received_qty;
                else
                    $averageCost = 0;

                // Add to total product cost
                $product_cost += $sold_qty * $averageCost;
            }
        }

        // Return the total calculated product cost (COGS)
        return $product_cost;
    }

    public function yearlyBestSellingPrice()
    {
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $yearly_best_selling_price = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->join('sales', 'sales.id', '=', 'product_sales.sale_id')
        ->whereNull('sales.deleted_at')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images'),'sales.exchange_rate', DB::raw('sum(product_sales.total / sales.exchange_rate) as total_price'))
        ->whereYear('product_sales.created_at', date("Y"))
        ->groupBy('products.code')
        ->orderBy('total_price', 'desc')
        ->take(5)
        ->get();

        return response()->json($yearly_best_selling_price);
    }

    public function yearlyBestSellingQty()
    {
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $yearly_best_selling_qty = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images, sum(product_sales.qty) as sold_qty'))
        ->whereYear('product_sales.created_at', date("Y"))
        ->groupBy('products.code')
        ->orderBy('sold_qty', 'desc')
        ->take(5)
        ->get();

        return response()->json($yearly_best_selling_qty);
    }

    public function monthlyBestSellingQty()
    {
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();

        $best_selling_qty = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images, sum(product_sales.qty) as sold_qty'))
        ->whereYear('product_sales.created_at', date("Y"))
        ->whereMonth('product_sales.created_at', date("m"))
        ->groupBy('products.code')
        ->orderBy('sold_qty', 'desc')
        ->take(5)
        ->get();

        return response()->json($best_selling_qty);
    }

    public function recentSale()
    {
        if ($this->isStaffOwnAccess())
        {
            $recent_sale = Sale::join('customers', 'customers.id', '=', 'sales.customer_id')
                            ->select('sales.id','sales.reference_no','sales.sale_status','sales.created_at','sales.grand_total','sales.exchange_rate','sales.user_id','customers.name')
                            ->orderBy('id', 'desc')
                            ->whereNull('sales.deleted_at')
                            ->where('sales.user_id', Auth::id())
                            ->where(function($q) {
                                $q->where('sales.sale_type', '!=', 'opening balance')
                                ->orWhereNull('sales.sale_type');
                            })
                            ->take(5)->get();
            return response()->json($recent_sale);
        }
        else
        {
            $recent_sale = Sale::join('customers', 'customers.id', '=', 'sales.customer_id')
                            ->select('sales.id','sales.reference_no','sales.sale_status','sales.created_at','sales.grand_total','sales.exchange_rate','customers.name')->orderBy('id', 'desc')
                            ->whereNull('sales.deleted_at')
                            ->where(function($q) {
                                $q->where('sales.sale_type', '!=', 'opening balance')
                                ->orWhereNull('sales.sale_type');
                            })
                            ->take(5)->get();
            return response()->json($recent_sale);
        }
    }

    public function recentPurchase()
    {
        if ($this->isStaffOwnAccess())
        {
            $recent_purchase = Purchase::leftJoin('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')
                            ->select('purchases.id','purchases.reference_no','purchases.status','purchases.created_at','purchases.grand_total','purchases.exchange_rate','purchases.user_id','suppliers.name')
                            ->orderBy('id', 'desc')
                            ->where('purchases.user_id', Auth::id())
                            ->whereNull('purchases.deleted_at')
                            ->whereNULL('purchases.purchase_type')
                            ->take(5)->get();

            return response()->json($recent_purchase);
        }
        else
        {
            $recent_purchase = Purchase::leftJoin('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')
                            ->select('purchases.id','purchases.reference_no','purchases.status','purchases.created_at','purchases.grand_total','purchases.exchange_rate','suppliers.name')
                            ->orderBy('id', 'desc')
                            ->whereNull('purchases.deleted_at')
                            ->whereNULL('purchases.purchase_type')
                            ->take(5)->get();

            return response()->json($recent_purchase);
        }
    }

    public function recentQuotation()
    {
        if ($this->isStaffOwnAccess())
        {
            $recent_quotation = Quotation::join('customers', 'customers.id', '=', 'quotations.customer_id')->select('quotations.id','quotations.reference_no','quotations.quotation_status','quotations.created_at','quotations.grand_total','quotations.user_id','customers.name')->orderBy('id', 'desc')->where('quotations.user_id', Auth::id())->take(5)->get();
            return response()->json($recent_quotation);
        }
        else
        {
            $recent_quotation = Quotation::join('customers', 'customers.id', '=', 'quotations.customer_id')->select('quotations.id','quotations.reference_no','quotations.quotation_status','quotations.created_at','quotations.grand_total','customers.name')->orderBy('id', 'desc')->take(5)->get();
            return response()->json($recent_quotation);
        }
    }

    public function recentPayment()
    {
        if ($this->isStaffOwnAccess())
        {
            $recent_payment = Payment::select('id','payment_reference','amount','exchange_rate','paying_method','created_at','user_id')->orderBy('id', 'desc')->where('user_id', Auth::id())->take(5)->get();
            return response()->json($recent_payment);
        }
        else
        {
            $recent_payment = Payment::select('id','payment_reference','amount','exchange_rate','paying_method','created_at')->orderBy('id', 'desc')->take(5)->get();
            return response()->json($recent_payment);
        }
    }

    public function myTransaction($year, $month)
    {
        $start = 1;
        $number_of_day = date('t', mktime(0, 0, 0, $month, 1, $year));
        while($start <= $number_of_day)
        {
            if($start < 10)
                $date = $year.'-'.$month.'-0'.$start;
            else
                $date = $year.'-'.$month.'-'.$start;
            $sale_generated[$start] = Sale::whereDate('created_at', $date)
                                    ->where('user_id', Auth::id())
                                    ->whereNull('deleted_at')
                                    ->where(function ($q) {
                                        $q->where('sales.sale_type', '!=', 'opening balance')
                                        ->orWhereNull('sales.sale_type');
                                    })
                                    ->count();
            $sale_grand_total[$start] = Sale::whereDate('created_at', $date)
                                        ->where('user_id', Auth::id())
                                        ->whereNull('deleted_at')
                                        ->where(function ($q) {
                                            $q->where('sales.sale_type', '!=', 'opening balance')
                                            ->orWhereNull('sales.sale_type');
                                        })
                                        ->sum(DB::raw('grand_total / exchange_rate'));
            $purchase_generated[$start] = Purchase::whereDate('created_at', $date)
                                        ->where('user_id', Auth::id())
                                        ->whereNull('deleted_at')
                                        ->where(function ($q) {
                                            $q->where('purchase_type', '!=', 'opening balance')
                                            ->orWhereNull('purchase_type');
                                        })
                                        ->count();
            $purchase_grand_total[$start] = Purchase::whereDate('created_at', $date)
                                            ->where('user_id', Auth::id())
                                            ->whereNull('deleted_at')
                                            ->where(function ($q) {
                                                $q->where('purchase_type', '!=', 'opening balance')
                                                ->orWhereNull('purchase_type');
                                            })
                                            ->sum(DB::raw('grand_total / exchange_rate'));
            $quotation_generated[$start] = Quotation::whereDate('created_at', $date)->where('user_id', Auth::id())->count();
            $quotation_grand_total[$start] = Quotation::whereDate('created_at', $date)->where('user_id', Auth::id())->sum('grand_total');
            $start++;
        }
        $start_day = date('w', strtotime($year.'-'.$month.'-01')) + 1;
        $prev_year = date('Y', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $prev_month = date('m', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $next_year = date('Y', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        $next_month = date('m', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        return view('backend.user.my_transaction', compact('start_day', 'year', 'month', 'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month', 'sale_generated', 'sale_grand_total','purchase_generated', 'purchase_grand_total','quotation_generated', 'quotation_grand_total'));
    }

    public function switchTheme(Request $request, $theme)
    {
        $theme = in_array($theme, ['light', 'dark'], true) ? $theme : 'light';
        setcookie('theme', $theme, time() + (86400 * 365), '/');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['theme' => $theme]);
        }

        return back();
    }

    public function newVersionReleasePage()
    {
		// Below line is deprecated, this code is needed for the client version 1.5.1 and below
        $this->dataWriteInENVFile('APP_ENV', 'local');
		// Below line is deprecated, this code is needed for the client version 1.5.1 and below

        $versionUpgradeData = [];
        $versionUpgradeData = $this->versionUpgradeInfo;
        return view('version_upgrade.index', compact('versionUpgradeData'));
    }

    public function versionUpgrade(Request $request) {
        $versionUpgradeData = [];
        $versionUpgradeData = $this->versionUpgradeInfo;
        $version_upgrade_file_url = $this->versionUpgradeFileUrl($request->purchasecode);

        if (!$version_upgrade_file_url) {
            return redirect()->back()->with('not_permitted', 'Wrong Purchase Code !');
        }

        try {
            //Check file is exist
            $ch = curl_init($version_upgrade_file_url);
            curl_setopt($ch, CURLOPT_NOBODY, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            // === যদি SSL সমস্যা থাকে ===
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
            curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if($httpCode != 200) {
                throw new Exception("File not found or server error. HTTP Code: " . $httpCode);
            }

            $transferStatus = $this->fileTransferProcess($version_upgrade_file_url);

            if (!$transferStatus) {
                 throw new Exception("Failed to download the update file.");
            }

            if ($versionUpgradeData['latest_version_db_migrate_enable']==true){
                Artisan::call('migrate');
                Artisan::call('db:seed');
            }

            Artisan::call('optimize:clear');

            $this->dataWriteInENVFile('VERSION', $versionUpgradeData['demo_version']);

            return redirect()->back()->with('message', 'Version Upgraded Successfully !!!');
        }
        catch(Exception $e) {
            return redirect()->back()->withErrors($e->getMessage());
        }
    }

    public function fileTransferProcess($version_upgrade_file_url)
    {
        $remote_file_name = pathinfo($version_upgrade_file_url)['basename'];
        $local_file_path = base_path('/'.$remote_file_name);

        $fp = fopen($local_file_path, 'w+');
        if($fp === false){
            return false;
        }

        $ch = curl_init($version_upgrade_file_url);
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        // SSL সমস্যা এড়াতে (প্রয়োজন হলে)
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

        $curl_exec = curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        // ডাউনলোড সফল হলে আনজিপ শুরু হবে
        if ($curl_exec) {
            // ****** Unzip ********
            $zip = new ZipArchive;
            $res = $zip->open($local_file_path);

            if ($res === TRUE) {
                $zip->extractTo(base_path());
                $zip->close();

                // ****** Delete Zip File ******
                File::delete($local_file_path);

                return true;
            } else {
                return false;
            }
        }

        return false; // ডাউনলোড ফেইল করেছে
    }

}
