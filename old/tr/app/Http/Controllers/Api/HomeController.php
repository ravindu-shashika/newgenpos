<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DataRetrievalService;
use App\Models\Sale;
use App\Models\Returns;
use App\Models\ReturnPurchase;
use App\Models\ProductPurchase;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Payroll;
use App\Models\Quotation;
use App\Models\Payment;
use App\Models\Account;
use App\Models\Product_Sale;
use App\Models\Customer;
use App\Models\Product;
use App\Models\RewardPointSetting;
use App\Models\Product_Warehouse;
use App\Models\Unit;
use Cache;
use DB;
use Auth;
use Printing;
use Rawilk\Printing\Contracts\Printer;
use Spatie\Permission\Models\Role;

class HomeController extends Controller
{
    private $_dataRetrievalService;
    
    public function __construct(DataRetrievalService $dataRetrievalService){
        $this->_dataRetrievalService = $dataRetrievalService;
    }
    
    public function generalSetting()
    {
        return $general_setting =  Cache::remember('general_setting', 60*60*24*365, function () {
            return DB::table('general_settings')->latest()->first();
        });
    }
    
    public function getUser(Request $request)
    {
        if (auth()->check()) {
            return response()->json([
                'user' => $request->user(),
                'units'=> $this->_dataRetrievalService->getAllUnits(),
                'brands'=> $this->_dataRetrievalService->getAllBrands(),
                'categories'=> $this->_dataRetrievalService->getAllCategories(),
                'product_types'=> $this->_dataRetrievalService->getProductTypes(),
                'barcode_symbologies' => $this->_dataRetrievalService->getBarcodeSymbologies(),
                'tax_methods' => $this->_dataRetrievalService->getTaxMethods(),
                'product_taxes' => $this->_dataRetrievalService->getProductTaxes(),
                'purchase_status' => $this->_dataRetrievalService->getPurchaseStatus(),
                'sale_status' => $this->_dataRetrievalService->getSaleStatus(),
                'sale_payment_status' => $this->_dataRetrievalService->getSalePaymentStatus(),
                'warrenty_type' => $this->_dataRetrievalService->getWarrentyType(),
                'order_discount_type' => $this->_dataRetrievalService->getOrderDiscountType(),
                'discount_plan' => $this->_dataRetrievalService->getDiscountPlans(),
                'discount_type' => $this->_dataRetrievalService->DiscountTypes(),
                'discount_applicable' => $this->_dataRetrievalService->DiscountApplicable(),
                'week_days' => $this->_dataRetrievalService->weekDays(),
                'hrm_settings' => $this->_dataRetrievalService->hrmSetting(),
                'pos_settings' => $this->_dataRetrievalService->posSetting(),
                'mail_settings' => $this->_dataRetrievalService->mailSetting(),
                'payment_gateways' => $this->_dataRetrievalService->paymentGateways(),
                'accounts' => $this->_dataRetrievalService->getAccountList(),
                'account_type' => $this->_dataRetrievalService->accountTypes(),
            ], 200);
        }
    
        return response()->json([
            'success' => false,
            'message' => 'Token is invalid or expired.',
        ], 401);
    }



    // public function dashboard()
    // {
    //     return response()->json([
    //         'success' => true,
    //         'data' => [
    //             'login' => 'You are logged in',
    //         ],
    //     ], 200);
    // }
    
    public function dashboard()
    {
        //return \Auth::user()->unreadNotifications->where('data.reminder_date', date('Y-m-d'));
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        //get general setting value
        $general_setting =  Cache::remember('general_setting', 60*60*24*365, function () {
            return DB::table('general_settings')->latest()->first();
        });
        
        if(Auth::user()->role_id == 5) {
            $customer = Customer::select('id', 'points')->where('user_id', Auth::id())->first();
            $lims_sale_data = Sale::with('warehouse')->where('customer_id', $customer->id)->orderBy('created_at', 'desc')->get();
            $lims_payment_data = DB::table('payments')
                           ->join('sales', 'payments.sale_id', '=', 'sales.id')
                           ->where('customer_id', $customer->id)
                           ->select('payments.*', 'sales.reference_no as sale_reference')
                           ->orderBy('payments.created_at', 'desc')
                           ->get();
            $lims_quotation_data = Quotation::with('biller', 'customer', 'supplier', 'user')->orderBy('id', 'desc')->where('customer_id', $customer->id)->orderBy('created_at', 'desc')->get();

            $lims_return_data = Returns::with('warehouse', 'customer', 'biller')->where('customer_id', $customer->id)->orderBy('created_at', 'desc')->get();
            $lims_reward_point_setting_data = RewardPointSetting::select('per_point_amount')->latest()->first();
            return view('backend.customer_index', compact('customer', 'lims_sale_data', 'lims_payment_data', 'lims_quotation_data', 'lims_return_data', 'lims_reward_point_setting_data'));
        }

        $start_date = date("Y").'-'.date("m").'-'.'01';
        $end_date = date("Y").'-'.date("m").'-'.date('t', mktime(0, 0, 0, date("m"), 1, date("Y")));
        $yearly_sale_amount = [];

        if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own')
        {
            $product_sale_data = Sale::join('product_sales', 'sales.id','=', 'product_sales.sale_id')
                ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.return_qty) as return_qty, sum(product_sales.total) as sold_amount'))
                ->where('sales.user_id', Auth::id())
                ->whereDate('sales.created_at', '>=' , $start_date)
                ->whereDate('sales.created_at', '<=' , $end_date)
                ->groupBy('product_sales.product_id', 'product_sales.product_batch_id')
                ->get();
            $product_cost = $this->calculateAverageCOGS($product_sale_data);
            $revenue = Sale::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('grand_total - shipping_cost'));
            $return = Returns::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $purchase_return = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $expense = Expense::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('amount');
            $income = Income::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('amount');
            $purchase = Purchase::whereDate('created_at', '>=' , $start_date)->where('user_id', Auth::id())->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $revenue = $revenue - $return + $income;
            $profit = $revenue + $purchase_return - $product_cost - $expense;
        }
        else
        {
            $product_sale_data = Product_Sale::join('sales', 'product_sales.sale_id', '=', 'sales.id')
                                ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.return_qty) as return_qty, sum(product_sales.total) as sold_amount'))
                                ->whereDate('sales.created_at', '>=' , $start_date)
                                ->whereDate('sales.created_at', '<=' , $end_date)
                                ->groupBy('product_sales.product_id', 'product_sales.product_batch_id')
                                ->get();
            $product_cost = $this->calculateAverageCOGS($product_sale_data);
            $revenue = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum(DB::raw('grand_total - shipping_cost'));
            $expense = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
            $income = Income::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
            $return = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $purchase_return = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $purchase = Purchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $revenue = $revenue - $return + $income;
            $profit = $revenue + $purchase_return - $product_cost - $expense;
        }

        //cash flow of last 6 months
        $start = strtotime(date('Y-m-01', strtotime('-6 month', strtotime(date('Y-m-d') ))));
        $end = strtotime(date('Y-m-'.date('t', mktime(0, 0, 0, date("m"), 1, date("Y")))));

        while($start < $end)
        {
            $start_date = date("Y-m", $start).'-'.'01';
            $end_date = date("Y-m", $start).'-'.date('t', mktime(0, 0, 0, date("m", $start), 1, date("Y", $start)));

            if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own') {
                $recieved_amount = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
                $sent_amount = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
                $return_amount = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('grand_total');
                $purchase_return_amount = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('grand_total');
                $expense_amount = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
                $payroll_amount = Payroll::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('amount');
            }
            else {
                $recieved_amount = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
                $sent_amount = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
                $return_amount = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
                $purchase_return_amount = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
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
            if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own') {
                $sale_amount = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('grand_total');
                $purchase_amount = Purchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->where('user_id', Auth::id())->sum('grand_total');
            }
            else{
                $sale_amount = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
                $purchase_amount = Purchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            }
            $yearly_sale_amount[] = number_format((float)$sale_amount, config('decimal'), '.', '');
            $yearly_purchase_amount[] = number_format((float)$purchase_amount, config('decimal'), '.', '');
            $start = strtotime("+1 month", $start);
        }
        //making strict mode true for this query
        config()->set('database.connections.mysql.strict', true);
        DB::reconnect();
        //fetching data for auto updates
        if(!config('database.connections.saleprosaas_landlord') && Auth::user()->role_id <= 2 && isset($_COOKIE['login_now']) && $_COOKIE['login_now']) {
            $autoUpdateData = $this->general();
            $alertBugEnable =  $autoUpdateData['alertBugEnable'];
            $alertVersionUpgradeEnable = $autoUpdateData['alertVersionUpgradeEnable'];
        }
        else {
            $autoUpdateData = $alertBugEnable = $alertVersionUpgradeEnable = '';
        }
        // return view('backend.index', compact('revenue', 'purchase', 'expense', 'return', 'purchase_return', 'profit', 'payment_recieved', 'payment_sent', 'month', 'yearly_sale_amount', 'yearly_purchase_amount', 'alertBugEnable','alertVersionUpgradeEnable'));
        return response()->json([
            'success' => 'true',
            'data' => [
                'revenue' => number_format((float)$revenue,$general_setting->decimal, '.', ''),
                'sale_return' => number_format((float)$return,$general_setting->decimal, '.', ''),
                'purchase_return' => number_format((float)$purchase_return,$general_setting->decimal, '.', ''),
                'profit' => number_format((float)$profit,$general_setting->decimal, '.', ''),
                'recent_sales' => $this->recentSale(),
                'recent_purchases' => $this->recentPurchase(),
                'recent_quotations' => $this->recentQuotation(),
                'recent_payments' => $this->recentPayment(),
                'best_seller_month' => $this->monthlyBestSellingQty(),
                'yearly_best_selling_by_qty' => $this->yearlyBestSellingQty(),
                'yearly_best_selling_by_price' => $this->yearlyBestSellingPrice()
            ]
        ]);
    }
    
    public function recentSale()
    {
        //get general setting value
        $general_setting = $this->generalSetting();
        
        if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own')
        {
            $recent_sales = Sale::join('customers', 'customers.id', '=', 'sales.customer_id')->select('sales.id','sales.reference_no','sales.sale_status','sales.created_at','sales.grand_total','sales.user_id','customers.name')->orderBy('id', 'desc')->where('sales.user_id', Auth::id())->take(5)->get();
        }
        else
        {
            $recent_sales = Sale::join('customers', 'customers.id', '=', 'sales.customer_id')->select('sales.id','sales.reference_no','sales.sale_status','sales.created_at','sales.grand_total','customers.name')->orderBy('id', 'desc')->take(5)->get();
        }
     
        $formatted_sales = $recent_sales->map(function ($sale) use ($general_setting) {
            if($sale->sale_status == 1)
                $status = 'Completed';
            if($sale->sale_status == 2)
                $status = 'Pending';
            else
                $status = 'Draft';
            return [
                'id' => $sale->id,
                'date' => date($general_setting->date_format, strtotime($sale->created_at)),
                'reference_no' => $sale->reference_no,
                'customer' => $sale->name,
                'status' => $status,
                'grand_total' => number_format((float)$sale->grand_total, $general_setting->decimal, '.', ''), // format grand total
            ];
        });

        return $formatted_sales;
    }

    public function recentPurchase()
    {
        $general_setting = $this->generalSetting();
        
        if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own')
        {
            $recent_purchases = Purchase::leftJoin('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')->select('purchases.id','purchases.reference_no','purchases.status','purchases.created_at','purchases.grand_total','purchases.user_id','suppliers.name')->orderBy('id', 'desc')->where('purchases.user_id', Auth::id())->take(5)->get();
        }
        else
        {
            $recent_purchases = Purchase::leftJoin('suppliers', 'suppliers.id', '=', 'purchases.supplier_id')->select('purchases.id','purchases.reference_no','purchases.status','purchases.created_at','purchases.grand_total','suppliers.name')->orderBy('id', 'desc')->take(5)->get();
        }
        
        $formatted_purchases = $recent_purchases->map(function ($purchase) use ($general_setting) {
            if($purchase->status == 1)
                $status = 'Recieved';
            if($purchase->status == 2)
                $status = 'Partial';
            if($purchase->status == 3)
                $status = 'Pending';
            else
                $status = 'Ordered';
            return [
                'id' => $purchase->id,
                'date' => date($general_setting->date_format, strtotime($purchase->created_at)),
                'reference_no' => $purchase->reference_no,
                'supplier' => $purchase->name,
                'status' => $status,
                'grand_total' => number_format((float)$purchase->grand_total, $general_setting->decimal, '.', ''), // format grand total
            ];
        });

        return $formatted_purchases;
    }

    public function recentQuotation()
    {
        $general_setting = $this->generalSetting();
         
        if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own')
        {
            $recent_quotations = Quotation::join('customers', 'customers.id', '=', 'quotations.customer_id')->select('quotations.id','quotations.reference_no','quotations.quotation_status','quotations.created_at','quotations.grand_total','quotations.user_id','customers.name')->orderBy('id', 'desc')->where('quotations.user_id', Auth::id())->take(5)->get();
        }
        else
        {
            $recent_quotations = Quotation::join('customers', 'customers.id', '=', 'quotations.customer_id')->select('quotations.id','quotations.reference_no','quotations.quotation_status','quotations.created_at','quotations.grand_total','customers.name')->orderBy('id', 'desc')->take(5)->get();
        }
  
        $quotations = $recent_quotations->map(function ($quotation) use ($general_setting) {
            if($quotation->quotation_status == 1)
                $status = 'Pending';
            else if($quotation->quotation_status == 2)
                $status = 'Sent';
                
            return [
                'id' => $quotation->id,
                'date' => date($general_setting->date_format, strtotime($quotation->created_at)),
                'reference_no' => $quotation->reference_no,
                'customer' => $quotation->name,
                'status' => $status,
                'grand_total' => number_format((float)$quotation->grand_total, $general_setting->decimal, '.', ''), // format grand total
            ];
        });

        return $quotations;
    }

    public function recentPayment()
    {
        $general_setting = $this->generalSetting();
        
        if(Auth::user()->role_id > 2 && cache()->get('general_setting')->staff_access == 'own')
        {
            $recent_payments = Payment::select('id','payment_reference','amount','paying_method','created_at','user_id')->orderBy('id', 'desc')->where('user_id', Auth::id())->take(5)->get();
        }
        else
        {
            $recent_payments = Payment::select('id','payment_reference','amount','paying_method','created_at')->orderBy('id', 'desc')->take(5)->get();
        }
        
        $payments = $recent_payments->map(function ($payment) use ($general_setting) {
            
            return [
                'id' => $payment->id,
                'date' => date($general_setting->date_format, strtotime($payment->created_at)),
                'reference_no' => $payment->payment_reference,
                'amount' => number_format((float)$payment->amount, $general_setting->decimal, '.', ''), // format grand total
                'paid_by' => $payment->paying_method
            ];
        });

        return $payments;
    }
    
    public function monthlyBestSellingQty()
    {
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $start_date = date("Y").'-'.date("m").'-'.'01';
        $end_date = date("Y").'-'.date("m").'-'.date('t', mktime(0, 0, 0, date("m"), 1, date("Y")));
        $best_selling_qty = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images, sum(product_sales.qty) as sold_qty'))
        ->whereDate('product_sales.created_at', '>=' , $start_date)
        ->whereDate('product_sales.created_at', '<=' , $end_date)
        ->groupBy('products.code')
        ->orderBy('sold_qty', 'desc')
        ->take(5)
        ->get();

        // return $best_selling_qty;
        
        // $bests = $best_selling_qty->map(function ($best) {
            
        //     return [
        //         'name' => $best->product_name,
        //         'code' => $best->product_code,
        //         'image' => url('images/product/' . $best->product_images),
        //         'qty' => $best->sold_qty,
        //     ];
        // });
        $bests = $best_selling_qty->map(function ($best) {
            // Get the first image only
            $images = explode(',', $best->product_images);
            $firstImage = trim($images[0]); // remove extra space if any
        
            return [
                'name' => $best->product_name,
                'code' => $best->product_code,
                'image' => url('images/product/' . $firstImage),
                'qty' => $best->sold_qty,
            ];
        });
        return $bests;
    }
    
    public function yearlyBestSellingPrice()
    {
        $general_setting = $this->generalSetting();
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $yearly_best_selling_price = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images, sum(total) as total_price'))
        ->whereDate('product_sales.created_at', '>=' , date("Y").'-01-01')
        ->whereDate('product_sales.created_at', '<=' , date("Y").'-12-31')
        ->groupBy('products.code')
        ->orderBy('total_price', 'desc')
        ->take(5)
        ->get();

        //  $bests = $yearly_best_selling_price->map(function ($best)  use ($general_setting) {
            
        //     return [
        //         'name' => $best->product_name,
        //         'code' => $best->product_code,
        //         'image' => url('images/product/' . $best->product_images),
        //         'grand_total' => number_format((float)$best->total_price,$general_setting->decimal, '.', ''),
        //     ];
        // });
        
        // $bests = $yearly_best_selling_price->map(function ($best) use ($general_setting) {
        //     // Split and take the first image from the comma-separated list
        //     $images = explode(',', $best->product_images);
        //     $firstImage = trim($images[0]);
        
        //     return [
        //         'name' => $best->product_name,
        //         'code' => $best->product_code,
        //         'image' => url('images/product/' . $firstImage),
        //         'grand_total' => number_format((float)$best->total_price, $general_setting->decimal, '.', ''),
        //     ];
        // });

        $bests = $yearly_best_selling_price->map(function ($best) use ($general_setting) {
    // Split and take the first image from the comma-separated list
    $images = explode(',', $best->product_images);
    $firstImage = trim($images[0]);

    // Check if the image file exists
    $imagePath = public_path('images/product/' . $firstImage);
    $finalImage = file_exists($imagePath)
        ? url('images/product/' . $firstImage)
        : url('images/zummXD2dvAtI.png');

    return [
        'name' => $best->product_name,
        'code' => $best->product_code,
        'image' => $finalImage,
        'grand_total' => number_format((float)$best->total_price, $general_setting->decimal, '.', ''),
    ];
});

        return $bests;
    }

    public function yearlyBestSellingQty()
    {
        //making strict mode false for this query
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $yearly_best_selling_qty = Product_Sale::join('products', 'products.id', '=', 'product_sales.product_id')
        ->select(DB::raw('products.name as product_name, products.code as product_code, products.image as product_images, sum(product_sales.qty) as sold_qty'))
        ->whereDate('product_sales.created_at', '>=' , date("Y").'-01-01')
        ->whereDate('product_sales.created_at', '<=' , date("Y").'-12-31')
        ->groupBy('products.code')
        ->orderBy('sold_qty', 'desc')
        ->take(5)
        ->get();

        // $bests = $yearly_best_selling_qty->map(function ($best) {
        //     return [
        //         'name' => $best->product_name,
        //         'code' => $best->product_code,
        //         'image' => url('images/product/' . $best->product_images),
        //         'qty' => $best->sold_qty,
        //     ];
        // });
        // $bests = $yearly_best_selling_qty->map(function ($best) {
        //     // Extract the first image from a comma-separated list
        //     $images = explode(',', $best->product_images);
        //     $firstImage = trim($images[0]);
        
        //     return [
        //         'name' => $best->product_name,
        //         'code' => $best->product_code,
        //         'image' => url('images/product/' . $firstImage),
        //         'qty' => $best->sold_qty,
        //     ];
        // });
        
        $bests = $yearly_best_selling_qty->map(function ($best) {
            // Get first image
            $images = explode(',', $best->product_images);
            $firstImage = trim($images[0]);
        
            // Path to check file existence
            $imagePath = public_path('images/product/' . $firstImage);
        
            // Use default image if the file doesn't exist
            $finalImage = file_exists($imagePath) 
                ? url('images/product/' . $firstImage) 
                : url('images/zummXD2dvAtI.png');
        
            return [
                'name' => $best->product_name,
                'code' => $best->product_code,
                'image' => $finalImage,
                'qty' => $best->sold_qty,
            ];
        });


        return $bests;
    }
    
    public function calculateAverageCOGS($product_sale_data)
    {
        $product_cost = 0;
        foreach ($product_sale_data as $key => $product_sale) {
            $product_data = Product::select('type', 'product_list', 'variant_list', 'qty_list')->find($product_sale->product_id);
            if($product_data && $product_data->type == 'combo') {
                $product_list = explode(",", $product_data->product_list);
                if($product_data->variant_list)
                    $variant_list = explode(",", $product_data->variant_list);
                else
                    $variant_list = [];
                $qty_list = explode(",", $product_data->qty_list);

                foreach ($product_list as $index => $product_id) {
                    if(count($variant_list) && $variant_list[$index]) {
                        $product_purchase_data = ProductPurchase::where([
                            ['product_id', $product_id],
                            ['variant_id', $variant_list[$index] ]
                        ])
                        ->select('recieved', 'purchase_unit_id', 'total')
                        ->get();
                    }
                    else {
                        $product_purchase_data = ProductPurchase::where('product_id', $product_id)
                        ->select('recieved', 'purchase_unit_id', 'total')
                        ->get();
                    }
                    $total_received_qty = 0;
                    $total_purchased_amount = 0;
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $qty_list[$index];
                    $units = Unit::select('id', 'operator', 'operation_value')->get();
                    foreach ($product_purchase_data as $key => $product_purchase) {
                        $purchase_unit_data = $units->where('id',$product_purchase->purchase_unit_id)->first();
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;
                        $total_purchased_amount += $product_purchase->total;
                    }
                    if($total_received_qty)
                        $averageCost = $total_purchased_amount / $total_received_qty;
                    else
                        $averageCost = 0;
                    $product_cost += $sold_qty * $averageCost;
                }
            }
            else {
                if($product_sale->product_batch_id) {
                    $product_purchase_data = ProductPurchase::where([
                        ['product_id', $product_sale->product_id],
                        ['product_batch_id', $product_sale->product_batch_id]
                    ])
                    ->select('recieved', 'purchase_unit_id', 'total')
                    ->get();
                }
                elseif($product_sale->variant_id) {
                    $product_purchase_data = ProductPurchase::where([
                        ['product_id', $product_sale->product_id],
                        ['variant_id', $product_sale->variant_id]
                    ])
                    ->select('recieved', 'purchase_unit_id', 'total')
                    ->get();
                }
                else {
                    $product_purchase_data = ProductPurchase::where('product_id', $product_sale->product_id)
                    ->select('recieved', 'purchase_unit_id', 'total')
                    ->get();
                }
                $total_received_qty = 0;
                $total_purchased_amount = 0;
                $units = Unit::select('id', 'operator', 'operation_value')->get();
                if($product_sale->sale_unit_id) {
                    $sale_unit_data = $units->where('id', $product_sale->sale_unit_id)->first();
                    if($sale_unit_data->operator == '*')
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) * $sale_unit_data->operation_value;
                    else
                        $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty) / $sale_unit_data->operation_value;
                }
                else {
                    $sold_qty = ($product_sale->sold_qty - $product_sale->return_qty);
                }
                foreach ($product_purchase_data as $key => $product_purchase) {
                    $purchase_unit_data = $units->where('id', $product_purchase->purchase_unit_id)->first();
                    if($purchase_unit_data) {
                        if($purchase_unit_data->operator == '*')
                            $total_received_qty += $product_purchase->recieved * $purchase_unit_data->operation_value;
                        else
                            $total_received_qty += $product_purchase->recieved / $purchase_unit_data->operation_value;
                        $total_purchased_amount += $product_purchase->total;
                    }
                }
                if($total_received_qty)
                    $averageCost = $total_purchased_amount / $total_received_qty;
                else
                    $averageCost = 0;
                $product_cost += $sold_qty * $averageCost;
            }
        }
        return $product_cost;
    }
    
}
