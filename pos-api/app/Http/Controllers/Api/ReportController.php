<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Biller;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\Product_Sale;
use App\Models\ProductQuotation;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\PackingSlip;
use App\Models\Quotation;
use App\Models\Transfer;
use App\Models\Returns;
use App\Models\ProductReturn;
use App\Models\ReturnPurchase;
use App\Models\ProductTransfer;
use App\Models\PurchaseProductReturn;
use App\Models\Payment;
use App\Models\Warehouse;
use App\Models\Product_Warehouse;
use App\Models\Expense;
use App\Models\Payroll;
use App\Models\User;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Variant;
use App\Models\ProductVariant;
use App\Models\Unit;
use App\Models\CustomerGroup;
use App\Models\Income;
use App\Models\Challan;
use App\Models\GeneralSetting;
use DB;
use Auth;
use Cache;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ReportController extends Controller
{
    public function generalSetting()
    {
        return $general_setting =  Cache::remember('general_setting', 60*60*24*365, function () {
            return DB::table('general_settings')->latest()->first();
        });
    }
    
    public function formatNumber($data)
    {
        return number_format($data, cache()->get('general_setting')->decimal);
    }
    
    public function productQuantityAlert()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('product-qty-alert')){
            $lims_product_data = Product::select('name','code', 'image', 'qty', 'alert_quantity')->where('is_active', true)->whereColumn('alert_quantity', '>', 'qty')->get();
            return response()->json([
                'success'=> 'true',
                'data' => $lims_product_data
            ]);
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }

    public function dailySaleObjective(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('dso-report')) {
            if($request->input('starting_date')) {
                $starting_date = $request->input('starting_date');
                $ending_date = $request->input('ending_date');
            }
            else {
                $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 month', strtotime(date('Y-m-d') )))));
                $ending_date = date("Y-m-d");
            }
            return view('backend.report.daily_sale_objective', compact('starting_date', 'ending_date'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function dailySaleObjectiveData(Request $request)
    {
        $starting_date = date("Y-m-d", strtotime("+1 day", strtotime($request->input('starting_date'))));
        $ending_date = date("Y-m-d", strtotime("+1 day", strtotime($request->input('ending_date'))));

        $columns = array(
            1 => 'created_at',
        );
        $totalData = DB::table('dso_alerts')
                    ->whereDate('created_at', '>=' , $starting_date)
                    ->whereDate('created_at', '<=' , $ending_date)
                    ->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        if(empty($request->input('search.value'))) {
            $lims_dso_alert_data = DB::table('dso_alerts')
                                  ->whereDate('created_at', '>=' , $starting_date)
                                  ->whereDate('created_at', '<=' , $ending_date)
                                  ->offset($start)
                                  ->limit($limit)
                                  ->orderBy($order, $dir)
                                  ->get();
        }
        else
        {
            $search = $request->input('search.value');
            $lims_dso_alert_data = DB::table('dso_alerts')
                                  ->whereDate('dso_alerts.created_at', '=' , date('Y-m-d', strtotime(str_replace('/', '-', $search))))
                                  ->offset($start)
                                  ->limit($limit)
                                  ->orderBy($order, $dir)
                                  ->get();
        }
        $data = array();
        if(!empty($lims_dso_alert_data))
        {
            foreach ($lims_dso_alert_data as $key => $dso_alert_data)
            {
                $nestedData['id'] = $dso_alert_data->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime("-1 day", strtotime($dso_alert_data->created_at)));
                foreach (json_decode($dso_alert_data->product_info) as $index => $product_info) {
                    if($index)
                        $nestedData['product_info'] .= ', ';
                    $nestedData['product_info'] = $product_info->name.' ['.$product_info->code.']';
                }
                $nestedData['number_of_products'] = $dso_alert_data->number_of_products;
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

    public function productExpiry()
    {
        $general_settings_data = GeneralSetting::select('expiry_type','expiry_value')->first();

        $date = date('Y-m-d', strtotime('+'.$general_settings_data["expiry_value"].' '.$general_settings_data["expiry_type"]));
        $lims_product_data = DB::table('products')
                            ->join('product_batches', 'products.id', '=', 'product_batches.product_id')
                            ->whereDate('product_batches.expired_date', '<=', $date)
                            ->where([
                                ['products.is_active', true],
                                ['product_batches.qty', '>', 0]
                            ])
                            ->select('products.name', 'products.code', 'products.image', 'product_batches.batch_no', 'product_batches.batch_no', 'product_batches.expired_date', 'product_batches.qty')
                            ->get();
        return view('backend.report.product_expiry_report', compact('lims_product_data'));
    }

    public function warehouseStock(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('warehouse-stock-report')) {
            if(isset($request->warehouse_id))
                $warehouse_id = $request->warehouse_id;
            else
                $warehouse_id = 0;
            if(!$warehouse_id) {
                $total_item = DB::table('product_warehouse')
                            ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                            ->where([
                                ['products.is_active', true],
                                ['product_warehouse.qty', '>' , 0]
                            ])->count();

                $total_qty = \DB::table('product_warehouse')
                    ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                    ->where('products.is_active', true)
                    ->sum('product_warehouse.qty');
                    
                $total_price = DB::table('products')->where('is_active', true)->sum(DB::raw('price * qty'));
                $total_cost = DB::table('products')->where('is_active', true)->sum(DB::raw('cost * qty'));
            }
            else {
                $total_item = DB::table('product_warehouse')
                            ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                            ->where([
                                ['products.is_active', true],
                                ['product_warehouse.qty', '>' , 0],
                                ['product_warehouse.warehouse_id', $warehouse_id]
                            ])->count();
                $total_qty = DB::table('product_warehouse')
                                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                                ->where([
                                    ['products.is_active', true],
                                    ['product_warehouse.warehouse_id', $warehouse_id]
                                ])->sum('product_warehouse.qty');
                $total_price = DB::table('product_warehouse')
                                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                                ->where([
                                    ['products.is_active', true],
                                    ['product_warehouse.warehouse_id', $warehouse_id]
                                ])->sum(DB::raw('products.price * product_warehouse.qty'));
                $total_cost = DB::table('product_warehouse')
                                ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                                ->where([
                                    ['products.is_active', true],
                                    ['product_warehouse.warehouse_id', $warehouse_id]
                                ])->sum(DB::raw('products.cost * product_warehouse.qty'));
            }

            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            return view('backend.report.warehouse_stock', compact('total_item', 'total_qty', 'total_price', 'total_cost', 'lims_warehouse_list', 'warehouse_id'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function dailySale(Request $request, $year, $month)
    {
        // if (!Auth::check() || !Auth::user()->can('daily-sale')) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
    
        $warehouse_id = $request->input('warehouse_id', 0); // default to 0 if not provided
        $number_of_days = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $result = [];
    
        for ($day = 1; $day <= $number_of_days; $day++) {
            $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    
            $query = Sale::whereDate('created_at', $date);
    
            if ($warehouse_id != 0) {
                $query->where('warehouse_id', $warehouse_id);
            }
    
            $sale_data = $query->selectRaw('
                SUM(total_discount) AS total_discount,
                SUM(order_discount) AS order_discount,
                SUM(total_tax) AS total_tax,
                SUM(order_tax) AS order_tax,
                SUM(shipping_cost) AS shipping_cost,
                SUM(grand_total) AS grand_total
            ')->first();
    
            $has_sale = $sale_data->grand_total !== null;
    
            if ($has_sale) {
                $result[] = [
                    'day' => $day,
                    'date' => $date,
                    'has_sale' => true,
                    'total_discount' => $this->formatNumber((float) $sale_data->total_discount),
                    'order_discount' => $this->formatNumber((float) $sale_data->order_discount),
                    'total_tax' => $this->formatNumber((float) $sale_data->total_tax),
                    'order_tax' => $this->formatNumber((float) $sale_data->order_tax),
                    'shipping_cost' => $this->formatNumber((float) $sale_data->shipping_cost),
                    'grand_total' => $this->formatNumber((float) $sale_data->grand_total),
                ];
            } else {
                $result[] = [
                    'day' => $day,
                    'date' => $date,
                    'has_sale' => false
                ];
            }
        }
    
        return response()->json([
            'year' => $year,
            'month' => Carbon::createFromFormat('m', $month)->format('F'),
            'warehouse_id' => (int) $warehouse_id,
            'data' => $result
        ]);
    }


    public function dailySaleByWarehouse(Request $request,$year,$month)
    {
        $data = $request->all();
        if($data['warehouse_id'] == 0)
            return redirect()->back();
        $start = 1;
        $number_of_day = date('t', mktime(0, 0, 0, $month, 1, $year));
        while($start <= $number_of_day)
        {
            if($start < 10)
                $date = $year.'-'.$month.'-0'.$start;
            else
                $date = $year.'-'.$month.'-'.$start;
            $query1 = array(
                'SUM(total_discount) AS total_discount',
                'SUM(order_discount) AS order_discount',
                'SUM(total_tax) AS total_tax',
                'SUM(order_tax) AS order_tax',
                'SUM(shipping_cost) AS shipping_cost',
                'SUM(grand_total) AS grand_total'
            );
            $sale_data = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', $date)->selectRaw(implode(',', $query1))->get();
            $total_discount[$start] = $sale_data[0]->total_discount;
            $order_discount[$start] = $sale_data[0]->order_discount;
            $total_tax[$start] = $sale_data[0]->total_tax;
            $order_tax[$start] = $sale_data[0]->order_tax;
            $shipping_cost[$start] = $sale_data[0]->shipping_cost;
            $grand_total[$start] = $sale_data[0]->grand_total;
            $start++;
        }
        $start_day = date('w', strtotime($year.'-'.$month.'-01')) + 1;
        $prev_year = date('Y', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $prev_month = date('m', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $next_year = date('Y', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        $next_month = date('m', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $warehouse_id = $data['warehouse_id'];
        return view('backend.report.daily_sale', compact('total_discount','order_discount', 'total_tax', 'order_tax', 'shipping_cost', 'grand_total', 'start_day', 'year', 'month', 'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month', 'lims_warehouse_list', 'warehouse_id'));

    }

    public function dailyPurchase(Request $request, $year, $month)
    {
        // Optional auth check
        // if (!Auth::check() || !Auth::user()->can('daily-purchase')) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
    
        $warehouse_id = $request->input('warehouse_id', 0); // 0 means all warehouses
        $number_of_days = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $result = [];
    
        for ($day = 1; $day <= $number_of_days; $day++) {
            $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    
            $query = Purchase::whereDate('created_at', $date);
    
            if ($warehouse_id != 0) {
                $query->where('warehouse_id', $warehouse_id);
            }
    
            $purchase_data = $query->selectRaw('
                SUM(total_discount) AS total_discount,
                SUM(order_discount) AS order_discount,
                SUM(total_tax) AS total_tax,
                SUM(order_tax) AS order_tax,
                SUM(shipping_cost) AS shipping_cost,
                SUM(grand_total) AS grand_total
            ')->first();
    
            $has_purchase = $purchase_data->grand_total !== null;
    
            if ($has_purchase) {
                $result[] = [
                    'day' => $day,
                    'date' => $date,
                    'has_purchase' => true,
                    'total_discount' => $this->formatNumber((float) $purchase_data->total_discount),
                    'order_discount' => $this->formatNumber((float) $purchase_data->order_discount),
                    'total_tax' => $this->formatNumber((float) $purchase_data->total_tax),
                    'order_tax' => $this->formatNumber((float) $purchase_data->order_tax),
                    'shipping_cost' => $this->formatNumber((float) $purchase_data->shipping_cost),
                    'grand_total' => $this->formatNumber((float) $purchase_data->grand_total),
                ];
            } else {
                $result[] = [
                    'day' => $day,
                    'date' => $date,
                    'has_purchase' => false,
                ];
            }
        }
    
        return response()->json([
            'year' => $year,
            'month' => Carbon::createFromFormat('m', $month)->format('F'),
            'warehouse_id' => (int) $warehouse_id,
            'data' => $result,
        ]);
    }


    public function dailyPurchaseByWarehouse(Request $request, $year, $month)
    {
        $data = $request->all();
        if($data['warehouse_id'] == 0)
            return redirect()->back();
        $start = 1;
        $number_of_day = date('t', mktime(0, 0, 0, $month, 1, $year));
        while($start <= $number_of_day)
        {
            if($start < 10)
                $date = $year.'-'.$month.'-0'.$start;
            else
                $date = $year.'-'.$month.'-'.$start;
            $query1 = array(
                'SUM(total_discount) AS total_discount',
                'SUM(order_discount) AS order_discount',
                'SUM(total_tax) AS total_tax',
                'SUM(order_tax) AS order_tax',
                'SUM(shipping_cost) AS shipping_cost',
                'SUM(grand_total) AS grand_total'
            );
            $purchase_data = Purchase::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', $date)->selectRaw(implode(',', $query1))->get();
            $total_discount[$start] = $purchase_data[0]->total_discount;
            $order_discount[$start] = $purchase_data[0]->order_discount;
            $total_tax[$start] = $purchase_data[0]->total_tax;
            $order_tax[$start] = $purchase_data[0]->order_tax;
            $shipping_cost[$start] = $purchase_data[0]->shipping_cost;
            $grand_total[$start] = $purchase_data[0]->grand_total;
            $start++;
        }
        $start_day = date('w', strtotime($year.'-'.$month.'-01')) + 1;
        $prev_year = date('Y', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $prev_month = date('m', strtotime('-1 month', strtotime($year.'-'.$month.'-01')));
        $next_year = date('Y', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        $next_month = date('m', strtotime('+1 month', strtotime($year.'-'.$month.'-01')));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $warehouse_id = $data['warehouse_id'];

        return view('backend.report.daily_purchase', compact('total_discount','order_discount', 'total_tax', 'order_tax', 'shipping_cost', 'grand_total', 'start_day', 'year', 'month', 'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month', 'lims_warehouse_list', 'warehouse_id'));
    }

    public function monthlySale(Request $request, $year)
    {
        // Optional permission check
        // if (!Auth::user()->can('monthly-sale')) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
    
        $warehouse_id = $request->input('warehouse_id', 0); // 0 means all warehouses
        $start = strtotime($year . '-01-01');
        $end = strtotime($year . '-12-31');
    
        $results = [];
    
        while ($start <= $end) {
            $month = date('m', $start);
            $start_date = $year . '-' . $month . '-01';
            $end_date = $year . '-' . $month . '-' . date('t', $start);
    
            $query = Sale::whereBetween('created_at', [$start_date, $end_date]);
    
            if ($warehouse_id != 0) {
                $query->where('warehouse_id', $warehouse_id);
            }
    
            $sale_data = $query->selectRaw('
                SUM(total_discount) AS total_discount,
                SUM(order_discount) AS order_discount,
                SUM(total_tax) AS total_tax,
                SUM(order_tax) AS order_tax,
                SUM(shipping_cost) AS shipping_cost,
                SUM(grand_total) AS grand_total
            ')->first();
            
            $has_sale = $sale_data->grand_total !== null;
    
            if ($has_sale) {
                $results[] = [
                    'month_name' => Carbon::createFromFormat('m', $month)->format('F'),
                    'has_sale' => true,
                    'total_discount' => $this->formatNumber((float) number_format((float) $sale_data->total_discount, config('decimal'), '.', '')),
                    'order_discount' => $this->formatNumber((float) number_format((float) $sale_data->order_discount, config('decimal'), '.', '')),
                    'total_tax' => $this->formatNumber((float) number_format((float) $sale_data->total_tax, config('decimal'), '.', '')),
                    'order_tax' => $this->formatNumber((float) number_format((float) $sale_data->order_tax, config('decimal'), '.', '')),
                    'shipping_cost' => $this->formatNumber((float) number_format((float) $sale_data->shipping_cost, config('decimal'), '.', '')),
                    'grand_total' => $this->formatNumber((float) number_format((float) $sale_data->grand_total, config('decimal'), '.', '')),
                ];
            }else{
                $results[] = [
                    'month_name' => Carbon::createFromFormat('m', $month)->format('F'),
                    'has_sale' => false,  
                ];
            }
    
            $start = strtotime("+1 month", $start);
        }
    
        return response()->json([
            'year' => (int) $year,
            'warehouse_id' => (int) $warehouse_id,
            'data' => $results
        ]);
    }


    public function monthlySaleByWarehouse(Request $request, $year)
    {
        $data = $request->all();
        if($data['warehouse_id'] == 0)
            return redirect()->back();

        $start = strtotime($year .'-01-01');
        $end = strtotime($year .'-12-31');
        while($start <= $end)
        {
            $number_of_day = date('t', mktime(0, 0, 0, date('m', $start), 1, $year));
            $start_date = $year . '-'. date('m', $start).'-'.'01';
            $end_date = $year . '-'. date('m', $start).'-'.$number_of_day;

            $temp_total_discount = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total_discount');
            $total_discount[] = number_format((float)$temp_total_discount, config('decimal'), '.', '');

            $temp_order_discount = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('order_discount');
            $order_discount[] = number_format((float)$temp_order_discount, config('decimal'), '.', '');

            $temp_total_tax = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total_tax');
            $total_tax[] = number_format((float)$temp_total_tax, config('decimal'), '.', '');

            $temp_order_tax = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('order_tax');
            $order_tax[] = number_format((float)$temp_order_tax, config('decimal'), '.', '');

            $temp_shipping_cost = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('shipping_cost');
            $shipping_cost[] = number_format((float)$temp_shipping_cost, config('decimal'), '.', '');

            $temp_total = Sale::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('grand_total');
            $total[] = number_format((float)$temp_total, config('decimal'), '.', '');
            $start = strtotime("+1 month", $start);
        }
        $lims_warehouse_list = Warehouse::where('is_active',true)->get();
        $warehouse_id = $data['warehouse_id'];
        return view('backend.report.monthly_sale', compact('year', 'total_discount', 'order_discount', 'total_tax', 'order_tax', 'shipping_cost', 'total', 'lims_warehouse_list', 'warehouse_id'));
    }

    public function monthlyPurchase(Request $request, $year)
    {
        // Check if user has the correct permission
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('monthly-purchase')) {
            return response()->json(['message' => 'Sorry! You are not allowed to access this module'], 403);
        }
    
        // Get warehouse ID from the request, default is 0 (all warehouses)
        $warehouse_id = $request->input('warehouse_id', 0);
    
        // Start and end timestamps for the given year
        $start = strtotime($year . '-01-01');
        $end = strtotime($year . '-12-31');
    
        $results = [];
    
        // Loop through each month of the year
        while ($start <= $end) {
            $month = date('m', $start);
            $start_date = $year . '-' . $month . '-01';
            $end_date = $year . '-' . $month . '-' . date('t', $start);
    
            // Purchases Query
            $purchase_query = Purchase::whereBetween('created_at', [$start_date, $end_date]);
            
            // Filter by warehouse if warehouse_id is provided
            if ($warehouse_id != 0) {
                $purchase_query->where('warehouse_id', $warehouse_id);
            }
    
            $purchase_data = $purchase_query->selectRaw('
                SUM(total_discount) AS total_discount,
                SUM(order_discount) AS order_discount,
                SUM(total_tax) AS total_tax,
                SUM(order_tax) AS order_tax,
                SUM(shipping_cost) AS shipping_cost,
                SUM(grand_total) AS grand_total
            ')->first();
    
            // Check if there are any purchases for the current month
            $has_purchase = $purchase_data->grand_total !== null;
    
            if ($has_purchase) {
                // Format the results for this month
                $results[] = [
                    'month_name' => Carbon::createFromFormat('m', $month)->format('F'),
                    'has_purchase' => true,
                    'total_discount' => $this->formatNumber((float)$purchase_data->total_discount),
                    'order_discount' => $this->formatNumber((float)$purchase_data->order_discount),
                    'total_tax' => $this->formatNumber((float)$purchase_data->total_tax),
                    'order_tax' => $this->formatNumber((float) $purchase_data->order_tax),
                    'shipping_cost' => $this->formatNumber((float) $purchase_data->shipping_cost),
                    'grand_total' => $this->formatNumber((float) $purchase_data->grand_total),
                ];
            }else{
                $results[] = [
                    'month_name' => Carbon::createFromFormat('m', $month)->format('F'),
                    'has_purchase' => false,
                ];
            }
    
            // Move to the next month
            $start = strtotime("+1 month", $start);
        }
    
        // Return the API response
        return response()->json([
            'year' => $year,
            'results' => $results
        ]);
    }


    public function monthlyPurchaseByWarehouse(Request $request, $year)
    {
        $data = $request->all();
        if($data['warehouse_id'] == 0)
            return redirect()->back();

        $start = strtotime($year .'-01-01');
        $end = strtotime($year .'-12-31');
        while($start <= $end)
        {
            $number_of_day = date('t', mktime(0, 0, 0, date('m', $start), 1, $year));
            $start_date = $year . '-'. date('m', $start).'-'.'01';
            $end_date = $year . '-'. date('m', $start).'-'.$number_of_day;

            $query1 = array(
                'SUM(total_discount) AS total_discount',
                'SUM(order_discount) AS order_discount',
                'SUM(total_tax) AS total_tax',
                'SUM(order_tax) AS order_tax',
                'SUM(shipping_cost) AS shipping_cost',
                'SUM(grand_total) AS grand_total'
            );
            $purchase_data = Purchase::where('warehouse_id', $data['warehouse_id'])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->selectRaw(implode(',', $query1))->get();

            $total_discount[] = number_format((float)$purchase_data[0]->total_discount, config('decimal'), '.', '');
            $order_discount[] = number_format((float)$purchase_data[0]->order_discount, config('decimal'), '.', '');
            $total_tax[] = number_format((float)$purchase_data[0]->total_tax, config('decimal'), '.', '');
            $order_tax[] = number_format((float)$purchase_data[0]->order_tax, config('decimal'), '.', '');
            $shipping_cost[] = number_format((float)$purchase_data[0]->shipping_cost, config('decimal'), '.', '');
            $grand_total[] = number_format((float)$purchase_data[0]->grand_total, config('decimal'), '.', '');
            $start = strtotime("+1 month", $start);
        }
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $warehouse_id = $data['warehouse_id'];
        return view('backend.report.monthly_purchase', compact('year', 'total_discount', 'order_discount', 'total_tax', 'order_tax', 'shipping_cost', 'grand_total', 'lims_warehouse_list', 'warehouse_id'));
    }

    public function bestSeller()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('best-seller')){
            $start = strtotime(date("Y-m", strtotime("-2 months")).'-01');
            $end = strtotime(date("Y").'-'.date("m").'-31');

            while($start <= $end)
            {
                $number_of_day = date('t', mktime(0, 0, 0, date('m', $start), 1, date('Y', $start)));
                $start_date = date("Y-m", $start).'-'.'01';
                $end_date = date("Y-m", $start).'-'.$number_of_day;

                $best_selling_qty = Product_Sale::select(DB::raw('product_id, sum(qty) as sold_qty'))->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->groupBy('product_id')->orderBy('sold_qty', 'desc')->take(1)->get();
                if(!count($best_selling_qty)){
                    $product[] = '';
                    $sold_qty[] = 0;
                }
                foreach ($best_selling_qty as $best_seller) {
                    $product_data = Product::find($best_seller->product_id);
                    $product[] = $product_data->name.': '.$product_data->code;
                    $sold_qty[] = $best_seller->sold_qty;
                    
                    $formatted_product[] = [
                        'product' => $product_data->name.': '.$product_data->code,
                        'qty' => $best_seller->sold_qty,
                    ];
                }
                $start = strtotime("+1 month", $start);
            }
            $start_month = date("F Y", strtotime('-2 month'));
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $warehouse_id = 0;
            return $formatted_product;
            return view('backend.report.best_seller', compact('product', 'sold_qty', 'start_month', 'lims_warehouse_list', 'warehouse_id'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function bestSellerByWarehouse(Request $request)
    {
        $data = $request->all();
        
        // if($data['warehouse_id'] == 0)
        //     return redirect()->back();

        $start = strtotime(date("Y-m", strtotime("-2 months")).'-01');
        $end = strtotime(date("Y").'-'.date("m").'-31');

        while($start <= $end)
        {
            $number_of_day = date('t', mktime(0, 0, 0, date('m', $start), 1, date('Y', $start)));
            $start_date = date("Y-m", $start).'-'.'01';
            $end_date = date("Y-m", $start).'-'.$number_of_day;
            if($data['warehouse_id'] == 0)
                $best_selling_qty = Product_Sale::select(DB::raw('product_id, sum(qty) as sold_qty'))->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->groupBy('product_id')->orderBy('sold_qty', 'desc')->take(1)->get();
            else
                $best_selling_qty = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->select(DB::raw('product_sales.product_id, sum(product_sales.qty) as sold_qty'))->where('sales.warehouse_id', $data['warehouse_id'])->whereDate('sales.created_at', '>=' , $start_date)->whereDate('sales.created_at', '<=' , $end_date)->groupBy('product_id')->orderBy('sold_qty', 'desc')->take(1)->get();
        
            if(!count($best_selling_qty)) {
                $product[] = '';
                $sold_qty[] = 0;
            }
            foreach ($best_selling_qty as $best_seller) {
                $product_data = Product::find($best_seller->product_id);
                $product[] = $product_data->name.': '.$product_data->code;
                $sold_qty[] = $best_seller->sold_qty;
                
                $formatted_product[] = [
                    'product' => $product_data->name.': '.$product_data->code,
                    'qty' => $best_seller->sold_qty,
                ];
            }
            $start = strtotime("+1 month", $start);
        }
        $start_month = date("F Y", strtotime('-2 month'));
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $warehouse_id = $data['warehouse_id'];
      
        return response()->json([
            'products' => $formatted_product,
            'start_month' => $start_month,
            'warehouse_id' => $warehouse_id
        ]);
    }

    public function profitLoss(Request $request)
    {
        $general_setting = $this->generalSetting();
        
        $start_date = $request['start_date'];
        $end_date = $request['end_date'];
        $query1 = array(
            'SUM(grand_total) AS grand_total',
            'SUM(shipping_cost) AS shipping_cost',
            'SUM(paid_amount) AS paid_amount',
            'SUM(total_tax + order_tax) AS tax',
            'SUM(total_discount + order_discount) AS discount'
        );
        $query2 = array(
            'SUM(grand_total) AS grand_total',
            'SUM(total_tax + order_tax) AS tax'
        );
        config()->set('database.connections.mysql.strict', false);
        DB::reconnect();
        $product_sale_data = Product_Sale::join('sales', 'product_sales.sale_id', '=', 'sales.id')
                            ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.return_qty) as return_qty, sum(product_sales.total) as sold_amount'))
                            ->whereDate('sales.created_at', '>=' , $start_date)
                            ->whereDate('sales.created_at', '<=' , $end_date)
                            ->groupBy('product_sales.product_id', 'product_sales.product_batch_id')
                            ->get();

        config()->set('database.connections.mysql.strict', true);
            DB::reconnect();
        $data = $this->calculateAverageCOGS($product_sale_data);
        $product_cost = $data[0];
        $product_tax = $data[1];
       
        $purchase = Purchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->selectRaw(implode(',', $query1))->get();
        $total_purchase = Purchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $sale = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->selectRaw(implode(',', $query1))->get();
        $total_sale = Sale::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $sale_return = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->selectRaw(implode(',', $query2))->get();
        $total_return = Returns::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $purchase_return = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->selectRaw(implode(',', $query2))->get();
        $total_purchase_return = ReturnPurchase::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $expense = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
        $income = Income::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
        $total_expense = Expense::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $total_income = Income::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $payroll = Payroll::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('amount');
        $total_payroll = Payroll::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->count();
        $total_item = DB::table('product_warehouse')
                    ->join('products', 'product_warehouse.product_id', '=', 'products.id')
                    ->where([
                        ['products.is_active', true],
                        ['product_warehouse.qty', '>' , 0]
                    ])->count();
        $payment_recieved_number = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)
            ->whereDate('created_at', '<=' , $end_date)->count();
        $payment_recieved = DB::table('payments')->whereNotNull('sale_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('payments.amount');
        $credit_card_payment_sale = DB::table('payments')
                            ->where('paying_method', 'Credit Card')
                            ->whereNotNull('payments.sale_id')
                            ->whereDate('payments.created_at', '>=' , $start_date)
                            ->whereDate('payments.created_at', '<=' , $end_date)->sum('payments.amount');
        $cheque_payment_sale = DB::table('payments')
                            ->where('paying_method', 'Cheque')
                            ->whereNotNull('payments.sale_id')
                            ->whereDate('payments.created_at', '>=' , $start_date)
                            ->whereDate('payments.created_at', '<=' , $end_date)->sum('payments.amount');
        $gift_card_payment_sale = DB::table('payments')
                            ->where('paying_method', 'Gift Card')
                            ->whereNotNull('sale_id')
                            ->whereDate('created_at', '>=' , $start_date)
                            ->whereDate('created_at', '<=' , $end_date)
                            ->sum('amount');
        $paypal_payment_sale = DB::table('payments')
                            ->where('paying_method', 'Paypal')
                            ->whereNotNull('sale_id')
                            ->whereDate('created_at', '>=' , $start_date)
                            ->whereDate('created_at', '<=' , $end_date)
                            ->sum('amount');
        $deposit_payment_sale = DB::table('payments')
                            ->where('paying_method', 'Deposit')
                            ->whereNotNull('sale_id')
                            ->whereDate('created_at', '>=' , $start_date)
                            ->whereDate('created_at', '<=' , $end_date)
                            ->sum('amount');
        $cash_payment_sale =  $payment_recieved - $credit_card_payment_sale - $cheque_payment_sale - $gift_card_payment_sale - $paypal_payment_sale - $deposit_payment_sale;
        $payment_sent_number = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)
            ->whereDate('created_at', '<=' , $end_date)->count();
        $payment_sent = DB::table('payments')->whereNotNull('purchase_id')->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('payments.amount');
        $credit_card_payment_purchase = DB::table('payments')
                            ->where('paying_method', 'Gift Card')
                            ->whereNotNull('payments.purchase_id')
                            ->whereDate('payments.created_at', '>=' , $start_date)
                            ->whereDate('payments.created_at', '<=' , $end_date)->sum('payments.amount');
        $cheque_payment_purchase = DB::table('payments')
                            ->where('paying_method', 'Cheque')
                            ->whereNotNull('payments.purchase_id')
                            ->whereDate('payments.created_at', '>=' , $start_date)
                            ->whereDate('payments.created_at', '<=' , $end_date)->sum('payments.amount');
        $cash_payment_purchase =  $payment_sent - $credit_card_payment_purchase - $cheque_payment_purchase;
        $lims_warehouse_all = Warehouse::where('is_active',true)->get();
       
        
        $decimal = $general_setting->decimal;
        $formatted_warehouses = [];
        
        // foreach ($lims_warehouse_all as $key => $warehouse) {
        //     $sale = Sale::where('warehouse_id', $warehouse->id)
        //         ->whereBetween('created_at', [$start_date, $end_date])
        //         ->selectRaw(implode(',', $query2))->get();
        
        //     $purchase = Purchase::where('warehouse_id', $warehouse->id)
        //         ->whereBetween('created_at', [$start_date, $end_date])
        //         ->selectRaw(implode(',', $query2))->get();
        
        //     $sale_return = Returns::where('warehouse_id', $warehouse->id)
        //         ->whereBetween('created_at', [$start_date, $end_date])
        //         ->selectRaw(implode(',', $query2))->get();
        
        //     $purchase_return = ReturnPurchase::where('warehouse_id', $warehouse->id)
        //         ->whereBetween('created_at', [$start_date, $end_date])
        //         ->selectRaw(implode(',', $query2))->get();
        
        //     $expense = Expense::where('warehouse_id', $warehouse->id)
        //         ->whereBetween('created_at', [$start_date, $end_date])
        //         ->sum('amount');
        
        //     // Extract values (with null coalescing and formatting)
        //     $sale_total = number_format((float)($sale[0]->grand_total ?? 0 ), $decimal, '.', '');
        //     $purchase_total = number_format((float)($purchase[0]->grand_total ?? 0), $decimal, '.', '');
        //     $sale_return_total = number_format((float)($sale_return[0]->grand_total ?? 0), $decimal, '.', '');
        //     $purchase_return_total = number_format((float)($purchase_return[0]->grand_total ?? 0), $decimal, '.', '');
        
        //     $net_sale = number_format((float)(($sale[0]->grand_total ?? 0) - ($sale[0]->tax ?? 0)), $decimal, '.', '');
        //     $net_purchase = number_format((float)(($purchase[0]->grand_total ?? 0) - ($purchase[0]->tax ?? 0)), $decimal, '.', '');
        //     $net_sale_return = number_format((float)(($sale_return[0]->grand_total ?? 0) - ($sale_return[0]->tax ?? 0)), $decimal, '.', '');
        //     $net_purchase_return = number_format((float)(($purchase_return[0]->grand_total ?? 0) - ($purchase_return[0]->tax ?? 0)), $decimal, '.', '');
        
        //     $expense_total = number_format((float)$expense, $decimal, '.', '');
        
        //     $total_line = "Sale {$sale_total} - Purchase {$purchase_total} - Sale Return {$sale_return_total} + Purchase Return {$purchase_return_total}";
        //     $net_line = "Net Sale {$net_sale} - Net Purchase {$net_purchase} - Net Sale Return {$net_sale_return} + Net Purchase Return {$net_purchase_return}";
        
        //     $formatted_warehouses[] = [
        //         'warehouse_name' => $warehouse->name,
        //         'total' => number_format((float)($sale_total - $purchase_total - $sale_return_total + $purchase_return_total), $general_setting->decimal, '.', ''), // Or compute something else if needed
        //         'line_1' => $total_line,
        //         'net_total' => number_format((float)($net_sale - $net_purchase - $net_sale_return + $net_purchase_return), $general_setting->decimal, '.', ''), 
        //         'line_2' => $net_line,
        //         'expense' => $expense_total
        //     ];
        // }

        
        
        // $formatted_purchase = [
        //     'grand_total' => number_format((float)($purchase[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'purchase' => $total_purchase,
        //     'paid' => number_format((float)($purchase[0]->paid_amount ?? 0), $general_setting->decimal, '.', ''),
        //     'tax' => number_format((float)($purchase[0]->tax ?? 0), $general_setting->decimal, '.', ''),
        //     'discount' => number_format((float)($purchase[0]->discount ?? 0), $general_setting->decimal, '.', ''),
        // ];

        // $formatted_sale = [
        //     'grand_total' => number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'shipping_cost' => number_format((float)($sale[0]->shipping_cost ?? 0), $general_setting->decimal, '.', ''),
        //     'sale' => $total_sale,
        //     'paid' => number_format((float)($sale[0]->paid_amount ?? 0), $general_setting->decimal, '.', ''),
        //     'tax' => number_format((float)($sale[0]->tax ?? 0), $general_setting->decimal, '.', ''),
        //     'discount' => number_format((float)($sale[0]->discount ?? 0), $general_setting->decimal, '.', ''),
        // ];
        
        // $formatted_sale_return = [
        //     'grand_total' => number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'return' => $total_return,
        //     'tax' => number_format((float)($sale_return[0]->tax ?? 0), $general_setting->decimal, '.', ''),
        // ];
        
        // $formatted_purchase_return = [
        //     'grand_total' => number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'return' => $total_purchase_return,
        //     'tax' => number_format((float)($purchase_return[0]->tax ?? 0), $general_setting->decimal, '.', ''),
        // ];
        
        // $profit_loss_one = [
        //     'sale' =>  number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'product_cost' => "-". number_format((float)$product_cost, $general_setting->decimal, '.', ''),
        //     'profit' => number_format((float)($sale[0]->grand_total - $product_cost), $general_setting->decimal, '.', ''),
        // ];
        
        // $profit_loss_two = [
        //     'sale' =>  number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'product_cost' => "-". number_format((float)$product_cost, $general_setting->decimal, '.', ''),
        //     'sale_return' => "-". number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'purchase_return' =>  number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'profit' => number_format((float)($sale[0]->grand_total - $product_cost - $sale_return[0]->grand_total + $purchase_return[0]->grand_total), $general_setting->decimal, '.', ''),
        // ];
        
        // $formatted_payment_received = [
        //     'amount' => number_format((float)$payment_recieved, $general_setting->decimal, '.', ''),
        //     'received' => $payment_recieved_number,
        //     'cash' => number_format((float)$cash_payment_sale, $general_setting->decimal, '.', ''),
        //     'cheque' => number_format((float)$cheque_payment_sale, $general_setting->decimal, '.', ''),
        //     'credit_card' => number_format((float)$credit_card_payment_sale, $general_setting->decimal, '.', ''),
        //     'gift_card' => number_format((float)$gift_card_payment_sale, $general_setting->decimal, '.', ''),
        //     'paypal' => number_format((float)$paypal_payment_sale, $general_setting->decimal, '.', ''),
        //     'deposit' => number_format((float)$deposit_payment_sale, $general_setting->decimal, '.', ''),
            
        // ];
        
        //  $formatted_payment_sent = [
        //     'amount' => number_format((float)$payment_sent, $general_setting->decimal, '.', ''),
        //     'received' => $payment_sent_number,
        //     'cash' => number_format((float)$cash_payment_purchase, $general_setting->decimal, '.', ''),
        //     'cheque' => number_format((float)$cheque_payment_purchase, $general_setting->decimal, '.', ''),
        //     'credit_card' => number_format((float)$credit_card_payment_purchase, $general_setting->decimal, '.', ''),
        // ];
        
        // $formatted_expense = [
        //     'amount' => number_format((float)$expense, $general_setting->decimal, '.', ''),
        //     'expense' => $total_expense
        // ];
        
        // $formatted_income = [
        //     'amount' => number_format((float)$income, $general_setting->decimal, '.', ''),
        //     'income' => $total_income
        // ];
        
        // $formatted_payroll = [
        //     'amount' => number_format((float)$payroll, $general_setting->decimal, '.', ''),
        //     'payroll' => $total_payroll,
        // ];
        
        // $formatted_cash_in_hand = [
        //     'received' => number_format((float)$payment_recieved, $general_setting->decimal, '.', ''),
        //     'sent' => "-". number_format((float)$payment_sent, $general_setting->decimal, '.', ''),
        //     'sale_return' => "-". number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'purchase_return' => number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', ''),
        //     'expense' => "-". number_format((float)$expense, $general_setting->decimal, '.', ''),
        //     'payroll' => "-". number_format((float)$payroll, $general_setting->decimal, '.', ''),
        //     'in_hand' => number_format((float)($payment_recieved - $payment_sent - $sale_return[0]->grand_total + $purchase_return[0]->grand_total - $expense - $payroll), $general_setting->decimal, '.', ''),
        // ];
        
        // return response()->json([
        //     'purchase' => $formatted_purchase,
        //     'sale' => $formatted_sale,
        //     'sale_return' => $formatted_sale_return,
        //     'purchase_return' => $formatted_purchase_return,
        //     'profit_loss_one' => $profit_loss_one,
        //     'profit_loss_two' => $profit_loss_two,
        //     'payment_recieved' => $formatted_payment_received,
        //     'payment_sent' => $formatted_payment_sent,
        //     'expense' => $formatted_expense,
        //     'income' => $formatted_income,
        //     'payroll' => $formatted_payroll,
        //     'cash_in_hand' => $formatted_cash_in_hand,
        //     'warehouses' => $formatted_warehouses,
        //     'start_date' => $start_date,
        //     'end_date' => $end_date,
        // ]);
        $data = [];

        $data[] = [
            'title' => 'Purchase',
            'type' => 'list',
            'data' => [
                ['label' => 'Grand Total', 'value' => number_format((float)($purchase[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Purchase', 'value' => $total_purchase],
                ['label' => 'Paid', 'value' => number_format((float)($purchase[0]->paid_amount ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Tax', 'value' => number_format((float)($purchase[0]->tax ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Discount', 'value' => number_format((float)($purchase[0]->discount ?? 0), $general_setting->decimal, '.', '')],
            ]
        ];
    
        $data[] = [
            'title' => 'Sale',
            'type' => 'list',
            'data' => [
                ['label' => 'Grand Total', 'value' => number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Shipping Cost', 'value' => number_format((float)($sale[0]->shipping_cost ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Sale', 'value' => $total_sale],
                ['label' => 'Paid', 'value' => number_format((float)($sale[0]->paid_amount ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Tax', 'value' => number_format((float)($sale[0]->tax ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Discount', 'value' => number_format((float)($sale[0]->discount ?? 0), $general_setting->decimal, '.', '')],
            ]
        ];
        
        $data[] = [
            'title' => 'Sale Return',
            'type' => 'list',
            'data' => [
                ['label' => 'Grand Total', 'value' => number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Return', 'value' => $total_return],
                ['label' => 'Tax', 'value' => number_format((float)($sale_return[0]->tax ?? 0), $general_setting->decimal, '.', '')],
            ]
        ];
    
        $data[] = [
            'title' => 'Purchase Return',
            'type' => 'list',
            'data' => [
                ['label' => 'Grand Total', 'value' => number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Return', 'value' => $total_purchase_return],
                ['label' => 'Tax', 'value' => number_format((float)($purchase_return[0]->tax ?? 0), $general_setting->decimal, '.', '')],
            ]
        ];
        
        $data[] = [
            'title' => 'Profit / Loss',
            'type' => 'list',
            'data' => [
                ['label' => 'Sale', 'value' => number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Product Cost', 'value' => "-" . number_format((float)$product_cost, $general_setting->decimal, '.', '')],
                ['label' => 'Profit', 'value' => number_format((float)($sale[0]->grand_total - $product_cost), $general_setting->decimal, '.', '')],
            ]
        ];
        
        $data[] = [
            'title' => 'Profit / Loss',
            'type' => 'list',
            'data' => [
                ['label' => 'Sale', 'value' => number_format((float)($sale[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Product Cost', 'value' => "-" . number_format((float)$product_cost, $general_setting->decimal, '.', '')],
                ['label' => 'Sale Return', 'value' => "-" . number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Purchase Return', 'value' => number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Profit', 'value' => number_format((float)($sale[0]->grand_total - $product_cost - $sale_return[0]->grand_total + $purchase_return[0]->grand_total), $general_setting->decimal, '.', '')],
            ]
        ];
        
        $data[] = [
            'title' => 'Payment Received',
            'type' => 'list',
            'data' => [
                ['label' => 'Amount', 'value' => number_format((float)$payment_recieved, $general_setting->decimal, '.', '')],
                ['label' => 'Received', 'value' => $payment_recieved_number],
                ['label' => 'Cash', 'value' => number_format((float)$cash_payment_sale, $general_setting->decimal, '.', '')],
                ['label' => 'Cheque', 'value' => number_format((float)$cheque_payment_sale, $general_setting->decimal, '.', '')],
                ['label' => 'Credit Card', 'value' => number_format((float)$credit_card_payment_sale, $general_setting->decimal, '.', '')],
                ['label' => 'Gift Card', 'value' => number_format((float)$gift_card_payment_sale, $general_setting->decimal, '.', '')],
                ['label' => 'Paypal', 'value' => number_format((float)$paypal_payment_sale, $general_setting->decimal, '.', '')],
                ['label' => 'Deposit', 'value' => number_format((float)$deposit_payment_sale, $general_setting->decimal, '.', '')],
            ]
        ];
    
        $data[] = [
            'title' => 'Payment Sent',
            'type' => 'list',
            'data' => [
                ['label' => 'Amount', 'value' => number_format((float)$payment_sent, $general_setting->decimal, '.', '')],
                ['label' => 'Received', 'value' => $payment_sent_number],
                ['label' => 'Cash', 'value' => number_format((float)$cash_payment_purchase, $general_setting->decimal, '.', '')],
                ['label' => 'Cheque', 'value' => number_format((float)$cheque_payment_purchase, $general_setting->decimal, '.', '')],
                ['label' => 'Credit Card', 'value' => number_format((float)$credit_card_payment_purchase, $general_setting->decimal, '.', '')],
            ]
        ];
        
        $data[] = [
            'title' => 'Expense',
            'type' => 'list',
            'data' => [
                ['label' => 'Amount', 'value' => number_format((float)$expense, $general_setting->decimal, '.', '')],
                ['label' => 'Expense', 'value' => $total_expense],
            ]
        ];
        
        $data[] = [
            'title' => 'Income',
            'data' => [
                ['label' => 'Amount', 'value' => number_format((float)$income, $general_setting->decimal, '.', '')],
                ['label' => 'Income', 'value' => $total_income],
            ]
        ];
        
        $data[] = [
            'title' => 'Payroll',
            'type' => 'list',
            'data' => [
                ['label' => 'Amount', 'value' => number_format((float)$payroll, $general_setting->decimal, '.', '')],
                ['label' => 'Payroll', 'value' => $total_payroll],
            ]
        ];
    
        $data[] = [
            'title' => 'Cash In Hand',
            'type' => 'list',
            'data' => [
                ['label' => 'Received', 'value' => number_format((float)$payment_recieved, $general_setting->decimal, '.', '')],
                ['label' => 'Sent', 'value' => "-" . number_format((float)$payment_sent, $general_setting->decimal, '.', '')],
                ['label' => 'Sale Return', 'value' => "-" . number_format((float)($sale_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Purchase Return', 'value' => number_format((float)($purchase_return[0]->grand_total ?? 0), $general_setting->decimal, '.', '')],
                ['label' => 'Expense', 'value' => "-" . number_format((float)$expense, $general_setting->decimal, '.', '')],
                ['label' => 'Payroll', 'value' => "-" . number_format((float)$payroll, $general_setting->decimal, '.', '')],
                ['label' => 'In Hand', 'value' => number_format((float)($payment_recieved - $payment_sent - $sale_return[0]->grand_total + $purchase_return[0]->grand_total - $expense - $payroll), $general_setting->decimal, '.', '')],
            ]
        ];
        
        foreach ($lims_warehouse_all as $key => $warehouse) {
            $sale = Sale::where('warehouse_id', $warehouse->id)
                ->whereBetween('created_at', [$start_date, $end_date])
                ->selectRaw(implode(',', $query2))->get();
        
            $purchase = Purchase::where('warehouse_id', $warehouse->id)
                ->whereBetween('created_at', [$start_date, $end_date])
                ->selectRaw(implode(',', $query2))->get();
        
            $sale_return = Returns::where('warehouse_id', $warehouse->id)
                ->whereBetween('created_at', [$start_date, $end_date])
                ->selectRaw(implode(',', $query2))->get();
        
            $purchase_return = ReturnPurchase::where('warehouse_id', $warehouse->id)
                ->whereBetween('created_at', [$start_date, $end_date])
                ->selectRaw(implode(',', $query2))->get();
        
            $expense = Expense::where('warehouse_id', $warehouse->id)
                ->whereBetween('created_at', [$start_date, $end_date])
                ->sum('amount');
        
            // Extract values (with null coalescing and formatting)
            $sale_total = number_format((float)($sale[0]->grand_total ?? 0 ), $decimal, '.', '');
            $purchase_total = number_format((float)($purchase[0]->grand_total ?? 0), $decimal, '.', '');
            $sale_return_total = number_format((float)($sale_return[0]->grand_total ?? 0), $decimal, '.', '');
            $purchase_return_total = number_format((float)($purchase_return[0]->grand_total ?? 0), $decimal, '.', '');
        
            $net_sale = number_format((float)(($sale[0]->grand_total ?? 0) - ($sale[0]->tax ?? 0)), $decimal, '.', '');
            $net_purchase = number_format((float)(($purchase[0]->grand_total ?? 0) - ($purchase[0]->tax ?? 0)), $decimal, '.', '');
            $net_sale_return = number_format((float)(($sale_return[0]->grand_total ?? 0) - ($sale_return[0]->tax ?? 0)), $decimal, '.', '');
            $net_purchase_return = number_format((float)(($purchase_return[0]->grand_total ?? 0) - ($purchase_return[0]->tax ?? 0)), $decimal, '.', '');
        
            $expense_total = number_format((float)$expense, $decimal, '.', '');
        
            $total_line = "Sale {$sale_total} - Purchase {$purchase_total} - Sale Return {$sale_return_total} + Purchase Return {$purchase_return_total}";
            $net_line = "Net Sale {$net_sale} - Net Purchase {$net_purchase} - Net Sale Return {$net_sale_return} + Net Purchase Return {$net_purchase_return}";
        
            $formatted_warehouses[] = [
                'warehouse_name' => $warehouse->name,
                'total' => number_format((float)($sale_total - $purchase_total - $sale_return_total + $purchase_return_total), $general_setting->decimal, '.', ''), // Or compute something else if needed
                'line_1' => $total_line,
                'net_total' => number_format((float)($net_sale - $net_purchase - $net_sale_return + $net_purchase_return), $general_setting->decimal, '.', ''), 
                'line_2' => $net_line,
                'expense' => $expense_total
            ];
        }

        // Add warehouses section
        foreach ($formatted_warehouses as $warehouse) {
            $data[] = [
                'title' => $warehouse['warehouse_name'],
                'type' => 'descriptive',
                'data' => [
                    ['label' => $warehouse['total'], 'value' => $warehouse['line_1']],
                    ['label' => $warehouse['net_total'], 'value' => $warehouse['line_2']],
                    ['label' => $warehouse['expense'], 'value' => 'Expense'],
                ]
            ];
        }

    // Return final response
    return response()->json($data);

    }

    public function calculateAverageCOGS($product_sale_data)
    {
        $product_cost = 0;
        $product_tax = 0;
        foreach ($product_sale_data as $key => $product_sale) {
            $product_data = Product::select('type', 'product_list', 'variant_list', 'qty_list')->find($product_sale->product_id);
            if($product_data->type == 'combo') {
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
                        ->select('recieved', 'purchase_unit_id', 'tax', 'total')
                        ->get();
                    }
                    else {
                        $product_purchase_data = ProductPurchase::where('product_id', $product_id)
                        ->select('recieved', 'purchase_unit_id', 'tax', 'total')
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
                        $total_purchased_amount += $product_purchase->total;
                        $total_tax += $product_purchase->tax;
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
                    $product_purchase_data = ProductPurchase::where([
                        ['product_id', $product_sale->product_id],
                        ['product_batch_id', $product_sale->product_batch_id]
                    ])
                    ->select('recieved', 'purchase_unit_id', 'tax', 'total')
                    ->get();
                }
                elseif($product_sale->variant_id) {
                    $product_purchase_data = ProductPurchase::where([
                        ['product_id', $product_sale->product_id],
                        ['variant_id', $product_sale->variant_id]
                    ])
                    ->select('recieved', 'purchase_unit_id', 'tax', 'total')
                    ->get();
                }
                else {
                    $product_purchase_data = ProductPurchase::where('product_id', $product_sale->product_id)
                    ->select('recieved', 'purchase_unit_id', 'tax', 'total')
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
                        $total_purchased_amount += $product_purchase->total;
                        $total_tax += $product_purchase->tax;
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

    public function productReport(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        return view('backend.report.product_report',compact('start_date', 'end_date', 'warehouse_id', 'lims_warehouse_list'));
    }

   

    public function productReportData(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $product_id = [];
        $variant_id = [];
        $product_name = [];
        $product_qty = [];
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        if($request->input('search.value')) {
            $search = $request->input('search.value');
            $totalData = Product::where([
                ['name', 'LIKE', "%{$search}%"],
                ['is_active', true]
            ])->count();
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->where([
                                    ['name', 'LIKE', "%{$search}%"],
                                    ['is_active', true]
                                ])->paginate($perPage);
        }
        else {
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->where('is_active', true)
                                ->paginate($perPage);
        }

        $data = [];
        foreach ($lims_product_all->getCollection() as $product) {
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');
                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['id'] = $product->id;
                        $nestedData['imei_numbers'] = $this->findImeis($product->id, $variant_id);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']';
                        $nestedData['code'] = $item_code;
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = ProductPurchase::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

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
                        //transfer data
                     
                        //sale data
                        $nestedData['sold_amount'] = Product_Sale::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                        $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty')->where([
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
                        //return data
                        $nestedData['returned_amount'] = ProductReturn::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                        $lims_product_return_data = ProductReturn::select('sale_unit_id', 'qty')->where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                        $returned_qty = 0;
                        if(count($lims_product_return_data)) {
                            foreach ($lims_product_return_data as $product_return) {
                                $unit = DB::table('units')->find($product_return->sale_unit_id);
                                if($unit->operator == '*'){
                                    $returned_qty += $product_return->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $returned_qty += $product_return->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['returned_qty'] = $returned_qty;
                        //purchase return data
                        $nestedData['purchase_returned_amount'] = PurchaseProductReturn::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                        $lims_product_purchase_return_data = PurchaseProductReturn::select('purchase_unit_id', 'qty')->where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                        $purchase_returned_qty = 0;
                        if(count($lims_product_purchase_return_data)) {
                            foreach ($lims_product_purchase_return_data as $product_purchase_return) {
                                $unit = DB::table('units')->find($product_purchase_return->purchase_unit_id);
                                if($unit->operator == '*'){
                                    $purchase_returned_qty += $product_purchase_return->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $purchase_returned_qty += $product_purchase_return->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['purchase_returned_qty'] = $purchase_returned_qty;

                        if($nestedData['purchased_qty'] > 0)
                            $nestedData['profit'] = $nestedData['sold_amount'] - (($nestedData['purchased_amount'] / $nestedData['purchased_qty']) * $nestedData['sold_qty']);
                        else
                           $nestedData['profit'] =  $nestedData['sold_amount'];
                        $product_variant_data = ProductVariant::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id]
                        ])->select('qty')->first();
                        $nestedData['in_stock'] = $product_variant_data->qty;
                        if(config('currency_position') == 'prefix')
                            $nestedData['stock_worth'] = config('currency').' '.($nestedData['in_stock'] * $product->price).' / '.config('currency').' '.($nestedData['in_stock'] * $product->cost);
                        else
                            $nestedData['stock_worth'] = ($nestedData['in_stock'] * $product->price).' '.config('currency').' / '.($nestedData['in_stock'] * $product->cost).' '.config('currency');

                        $nestedData['profit'] = number_format((float)$nestedData['profit'], config('decimal'), '.', '');

                        /*if($nestedData['purchased_qty'] > 0 || $nestedData['transfered_qty'] > 0 || $nestedData['sold_qty'] > 0 || $nestedData['returned_qty'] > 0 || $nestedData['purchase_returned_qty']) {*/
                            $data[] = $nestedData;
                        //}
                    }
                }
                else {
                    $nestedData['id'] = $product->id;
                    $nestedData['imei_numbers'] = $this->findImeis($product->id);
                    
                    $nestedData['name'] = $product->name;
                    $nestedData['code'] = $product->code;
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = ProductPurchase::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

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
                   
                    //sale data
                    $nestedData['sold_amount'] = Product_Sale::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                    $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

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
                    //return data
                    $nestedData['returned_amount'] = ProductReturn::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                    $lims_product_return_data = ProductReturn::select('sale_unit_id', 'qty')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                    $returned_qty = 0;
                    if(count($lims_product_return_data)) {
                        foreach ($lims_product_return_data as $product_return) {
                            $unit = DB::table('units')->find($product_return->sale_unit_id);
                            if($unit->operator == '*'){
                                $returned_qty += $product_return->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $returned_qty += $product_return->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['returned_qty'] = $returned_qty;
                    //purchase return data
                    $nestedData['purchase_returned_amount'] = PurchaseProductReturn::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

                    $lims_product_purchase_return_data = PurchaseProductReturn::select('purchase_unit_id', 'qty')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

                    $purchase_returned_qty = 0;
                    if(count($lims_product_purchase_return_data)) {
                        foreach ($lims_product_purchase_return_data as $product_purchase_return) {
                            $unit = DB::table('units')->find($product_purchase_return->purchase_unit_id);
                            if($unit->operator == '*'){
                                $purchase_returned_qty += $product_purchase_return->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $purchase_returned_qty += $product_purchase_return->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['purchase_returned_qty'] = $purchase_returned_qty;

                    if($nestedData['purchased_qty'] > 0)
                            $nestedData['profit'] = $nestedData['sold_amount'] - (($nestedData['purchased_amount'] / $nestedData['purchased_qty']) * $nestedData['sold_qty']);
                    else
                       $nestedData['profit'] =  $nestedData['sold_amount'];
                    $nestedData['in_stock'] = $product->qty;
                    if(config('currency_position') == 'prefix')
                        $nestedData['stock_worth'] = config('currency').' '.($nestedData['in_stock'] * $product->price).' / '.config('currency').' '.($nestedData['in_stock'] * $product->cost);
                    else
                        $nestedData['stock_worth'] = ($nestedData['in_stock'] * $product->price).' '.config('currency').' / '.($nestedData['in_stock'] * $product->cost).' '.config('currency');

                    $nestedData['profit'] = number_format((float)$nestedData['profit'], config('decimal'), '.', '');
                    /*if($nestedData['purchased_qty'] > 0 || $nestedData['transfered_qty'] > 0 || $nestedData['sold_qty'] > 0 || $nestedData['returned_qty'] > 0 || $nestedData['purchase_returned_qty']) {*/
                        $data[] = $nestedData;
                    //}
                }
            }
            else {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');

                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['imei_numbers'] = $this->findImeis($product->id, $variant_id);
                        $nestedData['id'] = $product->id;
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'; 
                        $nestedData['code'] = $item_code;
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum('total');
                        $lims_product_purchase_data = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
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
                   
                        //sale data
                        $nestedData['sold_amount'] = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum('total');
                        $lims_product_sale_data = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereDate('sales.created_at','>=', $start_date)
                                    ->whereDate('sales.created_at','<=', $end_date)
                                    ->select('product_sales.sale_unit_id', 'product_sales.qty')
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
                        //return data
                        $nestedData['returned_amount'] = DB::table('returns')
                                ->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                                ->where([
                                    ['product_returns.product_id', $product->id],
                                    ['product_returns.variant_id', $variant_id],
                                    ['returns.warehouse_id', $warehouse_id]
                                ])->whereDate('returns.created_at', '>=', $start_date)
                                  ->whereDate('returns.created_at', '<=' , $end_date)
                                  ->sum('total');

                        $lims_product_return_data = DB::table('returns')
                                ->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                                ->where([
                                    ['product_returns.product_id', $product->id],
                                    ['product_returns.variant_id', $variant_id],
                                    ['returns.warehouse_id', $warehouse_id]
                                ])->whereDate('returns.created_at', '>=', $start_date)
                                  ->whereDate('returns.created_at', '<=' , $end_date)
                                  ->select('product_returns.sale_unit_id', 'product_returns.qty')
                                  ->get();

                        $returned_qty = 0;
                        if(count($lims_product_return_data)) {
                            foreach ($lims_product_return_data as $product_return) {
                                $unit = DB::table('units')->find($product_return->sale_unit_id);
                                if($unit->operator == '*'){
                                    $returned_qty += $product_return->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $returned_qty += $product_return->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['returned_qty'] = $returned_qty;
                        //purchase return data
                        $nestedData['purchase_returned_amount'] = DB::table('return_purchases')
                                ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                                ->where([
                                    ['purchase_product_return.product_id', $product->id],
                                    ['purchase_product_return.variant_id', $variant_id],
                                    ['return_purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('return_purchases.created_at', '>=', $start_date)
                                  ->whereDate('return_purchases.created_at', '<=' , $end_date)
                                  ->sum('total');
                        $lims_product_purchase_return_data = DB::table('return_purchases')
                                ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                                ->where([
                                    ['purchase_product_return.product_id', $product->id],
                                    ['purchase_product_return.variant_id', $variant_id],
                                    ['return_purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('return_purchases.created_at', '>=', $start_date)
                                  ->whereDate('return_purchases.created_at', '<=' , $end_date)
                                  ->select('purchase_product_return.purchase_unit_id', 'purchase_product_return.qty')
                                  ->get();

                        $purchase_returned_qty = 0;
                        if(count($lims_product_purchase_return_data)) {
                            foreach ($lims_product_purchase_return_data as $product_purchase_return) {
                                $unit = DB::table('units')->find($product_purchase_return->purchase_unit_id);
                                if($unit->operator == '*'){
                                    $purchase_returned_qty += $product_purchase_return->qty * $unit->operation_value;
                                }
                                elseif($unit->operator == '/'){
                                    $purchase_returned_qty += $product_purchase_return->qty / $unit->operation_value;
                                }
                            }
                        }
                        $nestedData['purchase_returned_qty'] = $purchase_returned_qty;

                        if($nestedData['purchased_qty'] > 0)
                            $nestedData['profit'] = $nestedData['sold_amount'] - (($nestedData['purchased_amount'] / $nestedData['purchased_qty']) * $nestedData['sold_qty']);
                        else
                           $nestedData['profit'] =  $nestedData['sold_amount'];
                        $product_warehouse = Product_Warehouse::where([
                            ['product_id', $product->id],
                            ['variant_id', $variant_id],
                            ['warehouse_id', $warehouse_id]
                        ])->select('qty')->first();
                        if($product_warehouse)
                            $nestedData['in_stock'] = $product_warehouse->qty;
                        else
                            $nestedData['in_stock'] = 0;
                        if(config('currency_position') == 'prefix')
                            $nestedData['stock_worth'] = config('currency').' '.($nestedData['in_stock'] * $product->price).' / '.config('currency').' '.($nestedData['in_stock'] * $product->cost);
                        else
                            $nestedData['stock_worth'] = ($nestedData['in_stock'] * $product->price).' '.config('currency').' / '.($nestedData['in_stock'] * $product->cost).' '.config('currency');

                        $nestedData['profit'] = number_format((float)$nestedData['profit'], config('decimal'), '.', '');

                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['imei_numbers'] = $this->findImeis($product->id);
                    $nestedData['id'] = $product->id;
                    $nestedData['name'] = $product->name;
                    $nestedData['code'] = $product->code;
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum('total');
                    $lims_product_purchase_data = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
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
                    
                    //sale data
                    $nestedData['sold_amount'] = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum('total');
                    $lims_product_sale_data = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereDate('sales.created_at','>=', $start_date)
                                ->whereDate('sales.created_at','<=', $end_date)
                                ->select('product_sales.sale_unit_id', 'product_sales.qty')
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
                    //return data
                    $nestedData['returned_amount'] = DB::table('returns')
                            ->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                            ->where([
                                ['product_returns.product_id', $product->id],
                                ['returns.warehouse_id', $warehouse_id]
                            ])->whereDate('returns.created_at', '>=', $start_date)
                              ->whereDate('returns.created_at', '<=' , $end_date)
                              ->sum('total');

                    $lims_product_return_data = DB::table('returns')
                            ->join('product_returns', 'returns.id', '=', 'product_returns.return_id')
                            ->where([
                                ['product_returns.product_id', $product->id],
                                ['returns.warehouse_id', $warehouse_id]
                            ])->whereDate('returns.created_at', '>=', $start_date)
                              ->whereDate('returns.created_at', '<=' , $end_date)
                              ->select('product_returns.sale_unit_id', 'product_returns.qty')
                              ->get();

                    $returned_qty = 0;
                    if(count($lims_product_return_data)) {
                        foreach ($lims_product_return_data as $product_return) {
                            $unit = DB::table('units')->find($product_return->sale_unit_id);
                            if($unit->operator == '*'){
                                $returned_qty += $product_return->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $returned_qty += $product_return->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['returned_qty'] = $returned_qty;
                    //purchase return data
                    $nestedData['purchase_returned_amount'] = DB::table('return_purchases')
                            ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                            ->where([
                                ['purchase_product_return.product_id', $product->id],
                                ['return_purchases.warehouse_id', $warehouse_id]
                            ])->whereDate('return_purchases.created_at', '>=', $start_date)
                              ->whereDate('return_purchases.created_at', '<=' , $end_date)
                              ->sum('total');
                    $lims_product_purchase_return_data = DB::table('return_purchases')
                            ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                            ->where([
                                ['purchase_product_return.product_id', $product->id],
                                ['return_purchases.warehouse_id', $warehouse_id]
                            ])->whereDate('return_purchases.created_at', '>=', $start_date)
                              ->whereDate('return_purchases.created_at', '<=' , $end_date)
                              ->select('purchase_product_return.purchase_unit_id', 'purchase_product_return.qty')
                              ->get();

                    $purchase_returned_qty = 0;
                    if(count($lims_product_purchase_return_data)) {
                        foreach ($lims_product_purchase_return_data as $product_purchase_return) {
                            $unit = DB::table('units')->find($product_purchase_return->purchase_unit_id);
                            if($unit->operator == '*'){
                                $purchase_returned_qty += $product_purchase_return->qty * $unit->operation_value;
                            }
                            elseif($unit->operator == '/'){
                                $purchase_returned_qty += $product_purchase_return->qty / $unit->operation_value;
                            }
                        }
                    }
                    $nestedData['purchase_returned_qty'] = $purchase_returned_qty;

                    if($nestedData['purchased_qty'] > 0)
                            $nestedData['profit'] = $nestedData['sold_amount'] - (($nestedData['purchased_amount'] / $nestedData['purchased_qty']) * $nestedData['sold_qty']);
                    else
                       $nestedData['profit'] =  $nestedData['sold_amount'];

                    $product_warehouse = Product_Warehouse::where([
                        ['product_id', $product->id],
                        ['warehouse_id', $warehouse_id]
                    ])->select('qty')->first();
                    if($product_warehouse)
                        $nestedData['in_stock'] = $product_warehouse->qty;
                    else
                        $nestedData['in_stock'] = 0;
                    if(config('currency_position') == 'prefix')
                        $nestedData['stock_worth'] = config('currency').' '.($nestedData['in_stock'] * $product->price).' / '.config('currency').' '.($nestedData['in_stock'] * $product->cost);
                    else
                        $nestedData['stock_worth'] = ($nestedData['in_stock'] * $product->price).' '.config('currency').' / '.($nestedData['in_stock'] * $product->cost).' '.config('currency');

                    $nestedData['profit'] = number_format((float)$nestedData['profit'], config('decimal'), '.', '');

                    $data[] = $nestedData;
                }
            }

        } 
        
        $paginated = $lims_product_all->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        
        return response()->json($paginated);
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
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $product_id = [];
        $variant_id = [];
        $product_name = [];
        $product_qty = [];
        $lims_product_all = Product::select('id', 'name', 'qty', 'is_variant')->where('is_active', true)->get();
        return $lims_product_all;
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
                        ->distinct('variant_id')
                        ->where([
                            ['product_purchases.product_id', $product->id],
                            ['purchases.warehouse_id', $warehouse_id]
                        ])->whereDate('purchases.created_at','>=', $start_date)
                          ->whereDate('purchases.created_at','<=', $end_date)
                          ->pluck('variant_id');
                else
                    $lims_product_purchase_data = DB::table('purchases')
                        ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                ['product_purchases.product_id', $product->id],
                                ['purchases.warehouse_id', $warehouse_id]
                        ])->whereDate('purchases.created_at','>=', $start_date)
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
        // $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        // return view('backend.report.purchase_report',compact('product_id', 'variant_id', 'product_name', 'product_qty', 'start_date', 'end_date', 'lims_warehouse_list', 'warehouse_id'));
        
        return response()->json([
             'product_name' => $product_name
        ]);
    }

    public function purchaseReportData(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $product_id = [];
        $variant_id = [];
        $product_name = [];
        $product_qty = [];
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        // $columns = array(
        //     1 => 'name'
        // );

        // if($request->input('length') != -1)
        //     $limit = $request->input('length');
        // else
        //     $limit = $totalData;
        //return $request;
        // $start = $request->input('start');
        // $order = $columns[$request->input('order.0.column')];
        // $dir = $request->input('order.0.dir');
        if($request->input('search.value')) {
            $search = $request->input('search.value');
            $totalData = Product::where([
                ['name', 'LIKE', "%{$search}%"],
                ['is_active', true]
            ])->count();
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->where([
                                    ['name', 'LIKE', "%{$search}%"],
                                    ['is_active', true]
                                ])
                                  ->orderBy('created_at', 'asc');
            if($paginate){
                $lims_product_all = $lims_product_all->paginate($perPage);
            }else{
                $lims_product_all = $lims_product_all->get();
            }
            
        }
        else {
            $totalData = Product::where('is_active', true)->count();
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->where('is_active', true)
                                ->orderBy('created_at', 'asc');
            if($paginate){
                $lims_product_all = $lims_product_all->paginate($perPage);
            }else{
                $lims_product_all = $lims_product_all->get();
            }
            
        }

        $data = [];
        foreach ($lims_product_all->getCollection() as $product) {
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');
                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                      
                        $imeis = $this->findImeis($product->id, $variant_id);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = ProductPurchase::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

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
                }
                else {
                   
                    $imeis = $this->findImeis($product->id);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = ProductPurchase::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');

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
                      
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code;
                        $nestedData['category'] = $product->category->name;
                        //purchase data
                        $nestedData['purchased_amount'] = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum('total');
                        $lims_product_purchase_data = DB::table('purchases')
                                    ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                        ['product_purchases.product_id', $product->id],
                                        ['product_purchases.variant_id', $variant_id],
                                        ['purchases.warehouse_id', $warehouse_id]
                                    ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
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
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code;
                    $nestedData['category'] = $product->category->name;
                    //purchase data
                    $nestedData['purchased_amount'] = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)->sum('total');
                    $lims_product_purchase_data = DB::table('purchases')
                                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')->where([
                                    ['product_purchases.product_id', $product->id],
                                    ['purchases.warehouse_id', $warehouse_id]
                                ])->whereDate('purchases.created_at','>=', $start_date)->whereDate('purchases.created_at','<=', $end_date)
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
        // $json_data = array(
        //     "draw"            => intval($request->input('draw')),
        //     "recordsTotal"    => intval($totalData),
        //     "recordsFiltered" => intval($totalFiltered),
        //     "data"            => $data
        // );

        // echo json_encode($json_data);
        
        $paginated = $lims_product_all->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        
        return response()->json($paginated);
    }
    public function saleReport(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        return view('backend.report.sale_report',compact('start_date', 'end_date', 'warehouse_id', 'lims_warehouse_list'));
    }

    public function saleReportData(Request $request)
    {
        $data = $request->all();
        $general_setting = $this->generalSetting();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $warehouse_id = $data['warehouse_id'];
        $variant_id = [];
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        if($request->input('search.value')) {
            $search = $request->input('search.value');
            $lims_product_all = Product::with('category')
                                    ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                    ->where([
                                        ['name', 'LIKE', "%{$search}%"],
                                        ['is_active', true]
                                    ])
                                    ->orderBy('created_at', 'asc');
            if($paginate){
                $lims_product_all = $lims_product_all->paginate($perPage);
            }else{
                $lims_product_all = $lims_product_all->get();
            }
        }
        else {
            $lims_product_all = Product::with('category')
                                ->select('id', 'name', 'code', 'category_id', 'qty', 'is_variant', 'price', 'cost')
                                ->where('is_active', true)
                                ->orderBy('created_at', 'asc');
            if($paginate){
                $lims_product_all = $lims_product_all->paginate($perPage);
            }else{
                $lims_product_all = $lims_product_all->get();
            }
        }

        $data = [];
        foreach ($lims_product_all->getCollection() as $product) {
            $variant_id_all = [];
            if($warehouse_id == 0) {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');
                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['id'] = $product->id;
                        $imeis = $this->findImeis($product->id, $variant_id);
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                        $nestedData['category'] = $product->category->name;
                        //sale data
                        $soldAmount = Product_Sale::where([
                                                ['product_id', $product->id],
                                                ['variant_id', $variant_id]
                                        ])->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');
                        $nestedData['sold_amount'] = number_format((float)($soldAmount ?? 0), $general_setting->decimal, '.', '');
                        $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty')->where([
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
                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['id'] = $product->id;
                    $imeis = $this->findImeis($product->id);
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code . ($imeis != 'N/A' ? '<br>' . 'IMEI: ' . str_replace("<br/>", ",", $imeis) : '');
                    $nestedData['category'] = $product->category->name;

                    //sale data
                    $soldAmount = Product_Sale::where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->sum('total');
                    $nestedData['sold_amount'] = number_format((float)($soldAmount ?? 0), $general_setting->decimal, '.', '');
                    $lims_product_sale_data = Product_Sale::select('sale_unit_id', 'qty')->where('product_id', $product->id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();

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
                    $data[] = $nestedData;
                }
            }
            else {
                if($product->is_variant) {
                    $variant_id_all = ProductVariant::where('product_id', $product->id)->pluck('variant_id', 'item_code');

                    foreach ($variant_id_all as $item_code => $variant_id) {
                        $variant_data = Variant::select('name')->find($variant_id);
                        $nestedData['id'] = $product->id;
                        $nestedData['name'] = $product->name . ' [' . $variant_data->name . ']'.'<br>'. 'Product Code: ' . $item_code;
                        $nestedData['category'] = $product->category->name;

                        //sale data
                        $soldAmount = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum('total');
                        $nestedData['sold_amount'] = number_format((float)($soldAmount ?? 0), $general_setting->decimal, '.', '');
                        $lims_product_sale_data = DB::table('sales')
                                    ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                        ['product_sales.product_id', $product->id],
                                        ['variant_id', $variant_id],
                                        ['sales.warehouse_id', $warehouse_id]
                                    ])->whereDate('sales.created_at','>=', $start_date)
                                    ->whereDate('sales.created_at','<=', $end_date)
                                    ->select('product_sales.sale_unit_id', 'product_sales.qty')
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

                        $data[] = $nestedData;
                    }
                }
                else {
                    $nestedData['id'] = $product->id;
                    $nestedData['name'] = $product->name.'<br>'. 'Product Code: ' . $product->code;
                    $nestedData['category'] = $product->category->name;

                    //sale data
                    $soldAmount =  DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereDate('sales.created_at','>=', $start_date)->whereDate('sales.created_at','<=', $end_date)->sum('total');
                    $nestedData['sold_amount'] = number_format((float)($soldAmount ?? 0), $general_setting->decimal, '.', '');
                    $lims_product_sale_data = DB::table('sales')
                                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')->where([
                                    ['product_sales.product_id', $product->id],
                                    ['sales.warehouse_id', $warehouse_id]
                                ])->whereDate('sales.created_at','>=', $start_date)
                                ->whereDate('sales.created_at','<=', $end_date)
                                ->select('product_sales.sale_unit_id', 'product_sales.qty')
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

                    $data[] = $nestedData;
                }
            }
        }

        $paginated = $lims_product_all->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        
        return response()->json($paginated);
    }
    public function challanReport(Request $request)
    {
        // return $request->all();
        $starting_date = $request->input('starting_date') ?? date("Y-m-"."01");
        $ending_date = $request->input('ending_date') ?? date("Y-m-d");
        $based_on = $request->input('based_on') ?? 'created_at';
        $general_setting = $this->generalSetting();
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $challan_data = Challan::whereDate($based_on, '>=', $starting_date)
            ->whereDate($based_on, '<=', $ending_date)
            ->where('status', 'Close');
            
        if($paginate){
            $challan_data = $challan_data->paginate($perPage);
        }else{
            $challan_data = $challan_data->get();
        }
        
        $results = [];

        foreach ($challan_data->getCollection() as $challan) {
            $packingSlipList = explode(",", $challan->packing_slip_list);
            $cash_list = explode(",", $challan->cash_list);
            $cheque_list = explode(",", $challan->cheque_list);
            $online_payment_list = explode(",", $challan->online_payment_list);
            $delivery_charge_list = explode(",", $challan->delivery_charge_list);
         
            foreach ($packingSlipList as $key => $packingSlipId) {
                $packingSlip = PackingSlip::with('sale.products')->find($packingSlipId);
                if (!$packingSlip) continue;
    
                $cash = $cash_list[$key] ?? 0;
                $cheque = (float)$cheque_list[$key] ?? 0;
                $online = (float)$online_payment_list[$key] ?? "0";
                $delivery_charge = $delivery_charge_list[$key] ?? 0;
                $net = (float)$cash + (float)$online + (float)$cheque - (float)$delivery_charge;
                $net_cash = (float)$cash - (float)$delivery_charge;
                $results[] = [
                    'challan_no' => 'DC-' . $challan->reference_no,
                    'order_no' => $packingSlip->sale->reference_no,
                    'order_date' => $packingSlip->sale->created_at->format('d-m-Y'),
                    'code' => $packingSlip->sale->products->pluck('code')->implode(','),
                    'delivery_date' => $packingSlip->sale->sale_status == 1
                        ? $packingSlip->sale->updated_at->format('d-m-Y')
                        : 'N/A',
                    'sales_amount' => number_format($packingSlip->sale->grand_total, cache()->get('general_setting')->decimal),
                    'cash_payment' => $cash,
                    'online_payment' => $online,
                    'cheque_payment' => $cheque,
                    'shipping_income' => $packingSlip->sale->shipping_cost,
                    'delivery_charge' => $delivery_charge,
                    'net' => number_format($net, cache()->get('general_setting')->decimal),
                    'net_cash' => number_format($net_cash, cache()->get('general_setting')->decimal),
                ];
            }
        }

        // return response()->json([
        //     'data' => $results,
        //     'starting_date' => $starting_date,
        //     'ending_date' => $ending_date,
        // ]);
        
        $paginated = $challan_data->toArray();
        $paginated['data'] = $results;
        
        if($paginate){
            $paginated['require_pagination'] = true;
            $paginated['starting_date'] = $starting_date;
            $paginated['ending_date'] = $ending_date;
        }else{
            $paginated['require_pagination'] = false;
            $paginated['starting_date'] = $starting_date;
            $paginated['ending_date'] = $ending_date;
        }
        
        
        return response()->json($paginated);
    }

    public function saleReportChart(Request $request)
    {
        $start_date = $request->start_date;
        $end_date = strtotime($request->end_date);
        $warehouse_id = $request->warehouse_id;
        $time_period = $request->time_period;
        if($time_period == 'monthly') {
            for($i = strtotime($start_date); $i <= $end_date; $i = strtotime('+1 month', $i)) {
                $date_points[] = date('Y-m-d', $i);
            }
        }
        else {
            for($i = strtotime('Saturday', strtotime($start_date)); $i <= $end_date; $i = strtotime('+1 week', $i)) {
                $date_points[] = date('Y-m-d', $i);
            }
        }
        $date_points[] = $request->end_date;
        //return $date_points;
        foreach ($date_points as $key => $date_point) {
            $q = DB::table('sales')
                ->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                ->whereDate('sales.created_at', '>=', $start_date)
                ->whereDate('sales.created_at', '<', $date_point);
            if($warehouse_id)
                $qty = $q->where('sales.warehouse_id', $warehouse_id);
            if(isset($request->product_list)) {
                $product_ids = Product::whereIn('code', explode(",", trim($request->product_list)))->pluck('id')->toArray();
                $q->whereIn('product_sales.product_id', $product_ids);
            }
            $qty = $q->sum('product_sales.qty');
            $sold_qty[$key] = $qty;
            $start_date = $date_point;
        }
        $lims_warehouse_list = Warehouse::where('is_active', true)->select('id', 'name')->get();
        $start_date = $request->start_date;
        $end_date = $request->end_date;
        return view('backend.report.sale_report_chart', compact('start_date', 'end_date', 'warehouse_id', 'time_period', 'sold_qty', 'date_points', 'lims_warehouse_list'));
    }

    public function paymentReportByDate(Request $request)
    {
        // $data = $request->all();
        // $start_date = $data['start_date'];
        // $end_date = $data['end_date'];

        // $lims_payment_data = Payment::whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->get();
        // return view('backend.report.payment_report',compact('lims_payment_data', 'start_date', 'end_date'));
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
    
        $payments = Payment::whereDate('created_at', '>=', $start_date)
                    ->whereDate('created_at', '<=', $end_date)
                    ->get()
                    ->map(function ($payment) {
                        $sale = DB::table('sales')->find($payment->sale_id);
                        $purchase = DB::table('purchases')->find($payment->purchase_id);
                        $user = DB::table('users')->find($payment->user_id);
    
                        return [
                            'id' => $payment->id,
                            'created_at' => $payment->created_at->format('Y-m-d H:i:s'),
                            'payment_reference' => $payment->payment_reference,
                            'sale_reference' => $sale ? $sale->reference_no : null,
                            'purchase_reference' => $purchase ? $purchase->reference_no : null,
                            'paying_method' => $payment->paying_method,
                            'amount' => $payment->amount,
                            'user' => [
                                'name' => $user->name ?? '',
                                'email' => $user->email ?? '',
                            ]
                        ];
                    });
    
        return response()->json([
            'status' => 'true',
            'data' => $payments,
            'start_date' => $start_date,
            'end_date' => $end_date
        ]);
    }

    public function warehouseReport(Request $request)
    {
        $warehouse_id = $request->input('warehouse_id');

        if($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        }
        else {
            $start_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
            $end_date = date("Y-m-d");
        }
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        return view('backend.report.warehouse_report',compact('start_date', 'end_date', 'warehouse_id', 'lims_warehouse_list'));
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
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, cache()->get('general_setting')->decimal);
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
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($purchase->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, cache()->get('general_setting')->decimal);
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
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
                $nestedData['amount'] = number_format($expense->amount, cache()->get('general_setting')->decimal);
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
        $data = $request->all();
        $user_id = $data['user_id'];
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $lims_user_list = User::where('is_active', true)->get();
        return view('backend.report.user_report', compact('user_id', 'start_date', 'end_date', 'lims_user_list'));
    }
    
    public function billerReport(Request $request)
    {
        $data = $request->all();
        $biller_id = $data['biller_id'];
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $lims_biller_list = Biller::where('is_active', true)->get();
        return view('backend.report.biller_report', compact('biller_id', 'start_date', 'end_date', 'lims_biller_list'));
    }
    
    public function billerSaleQuotationPaymentData(Request $request)
    {
        
        $biller_id = $request->input('biller_id');

        $billerSales = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->where('sales.biller_id', $biller_id)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));
        $billerQuotations = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.biller_id', $biller_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));
        $billerPayments = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->where('sales.biller_Id',$biller_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));
        
        $billerSales = $this->billerSales($request, $billerSales);
        $billerQuotations = $this->billerQuotations($request, $billerQuotations);
        $billerPayments = $this->billerPayments($request, $billerPayments);
        
        return response()->json([
            'biller_sales' => $billerSales,
            'biller_quotations' => $billerQuotations,
            'biller_payments' => $billerPayments
        ]);
    }
    public function billerSales($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page  
        
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer', 'warehouses.name as warehouse')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $sales = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales->getCollection() as $key => $sale)
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
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, cache()->get('general_setting')->decimal);
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
        
        $paginated = $sales->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function billerQuotations($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'warehouses.name as warehouse_name', 'customers.name as customer_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $quotations = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $quotations = $quotations->paginate($perPage);
                else
                    $quotations = $quotations->get();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $quotations = $quotations->paginate($perPage);
                else
                    $quotations = $quotations->get();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations->getCollection() as $key => $quotation)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        
        $paginated = $quotations->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function billerPayments($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $q = $q->select('payments.*')
            ->orderBy('created_at', 'desc');
            
        if(empty($request->input('search.value'))) {
            if($paginate)
                $payments = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%");
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments->getCollection() as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['amount'] = number_format($payment->amount, cache()->get('general_setting')->decimal);
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        
        $paginated = $payments->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userSalePurchaseQuotationTransferPaymentExpensePayrollData(Request $request)
    {
        $data = $request->all();
        $user_id = $data['user_id'];
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $lims_user_list = User::where('is_active', true)->get();
        
        $userSales = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->where('sales.user_id', $user_id)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));
        $userPurchases = DB::table('purchases')
            ->join('warehouses', 'purchases.warehouse_id', '=', 'warehouses.id')
            ->where('purchases.user_id', $user_id)
            ->whereDate('purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('purchases.created_at', '<=' ,$request->input('end_date'));
        $userQuotations = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.user_id', $user_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));
        $userTransfers = DB::table('transfers')
           ->join('warehouses as fromWarehouse', 'transfers.from_warehouse_id', '=', 'fromWarehouse.id')
           ->join('warehouses as toWarehouse', 'transfers.to_warehouse_id', '=', 'toWarehouse.id')
           ->where('transfers.user_id', $user_id)
           ->whereDate('transfers.created_at', '>=' , $request->input('start_date'))
           ->whereDate('transfers.created_at', '<=' , $request->input('end_date'));
        $userPayments = DB::table('payments')
           ->where('payments.user_id', $user_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));
        $userPayrolls = DB::table('payrolls')
           ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
           ->where('payrolls.user_id', $user_id)
           ->whereDate('payrolls.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payrolls.created_at', '<=' , $request->input('end_date'));
        $userExpenses = DB::table('expenses')
            ->join('warehouses', 'expenses.warehouse_id', '=', 'warehouses.id')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->where('expenses.user_id', $user_id)
            ->whereDate('expenses.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('expenses.created_at', '<=' ,$request->input('end_date'));
            
        $userSales = $this->userSales($request, $userSales);
        $userPurchases = $this->userPurchases($request, $userPurchases);
        $userQuotations = $this->userQuotations($request, $userQuotations);
        $userTransfers = $this->userTransfers($request, $userTransfers);
        $userPayments = $this->userPayments($request, $userPayments);
        $userPayrolls = $this->userPayrolls($request, $userPayrolls);
        $userExpenses = $this->userExpenses($request, $userExpenses);
        
        return response()->json([
            'user_sales' => $userSales,
            'user_purchases' => $userPurchases,
            'user_quotations' => $userQuotations,
            'user_transfers' => $userTransfers,
            'user_payments' => $userPayments, 
            'user_payrolls' => $userPayrolls,
            'user_expenses' => $userExpenses
        ]);
    }
    public function userSales($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $user_id = $request->input('user_id');
        
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer', 'warehouses.name as warehouse')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $sales = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
                
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales->getCollection() as $key => $sale)
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
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, cache()->get('general_setting')->decimal);
                if($sale->sale_status == 1){
                    $nestedData['status'] = 'Completed';
                    $sale_status = 'Completed';
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = 'Pending';
                    $sale_status = 'Pending';
                }
                else{
                    $nestedData['sale_status'] = 'Draft';
                    $sale_status = 'Draft';
                }
                $data[] = $nestedData;
            }
        }
        
        $paginated = $sales->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userPurchases($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $user_id = $request->input('user_id');
       
        $q = $q->select('purchases.id', 'purchases.reference_no', 'purchases.supplier_id', 'purchases.grand_total', 'purchases.paid_amount', 'purchases.status', 'purchases.created_at', 'warehouses.name as warehouse')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $purchases = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $purchases = $purchases->paginate($perPage);
                else
                    $purchases = $purchases->get();
            }
            else {
                $purchases =  $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $purchases = $purchases->paginate($perPage);
                else
                    $purchases = $purchases->get();
            }
        }
        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases->getCollection() as $key => $purchase)
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
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($purchase->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, cache()->get('general_setting')->decimal);
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
        $paginated = $purchases->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userQuotations($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $user_id = $request->input('user_id');
        
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'warehouses.name as warehouse_name', 'customers.name as customer_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $quotations = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $quotations = $quotations->paginate($perPage);
                else
                    $quotations = $quotations->get();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $quotations = $quotations->paginate($perPage);
                else
                    $quotations = $quotations->get();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations->getCollection() as $key => $quotation)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        $paginated = $quotations->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userTransfers($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $user_id = $request->input('user_id');
        
        $q = $q->select('transfers.id', 'transfers.status', 'transfers.created_at', 'transfers.reference_no', 'transfers.grand_total', 'fromWarehouse.name as fromWarehouse', 'toWarehouse.name as toWarehouse')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $transfers = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $transfers = $transfers->paginate($perPage);
                else
                    $transfers = $transfers->get();
            }
            else {
                $transfers =  $q->orwhere('transfers.created_at', 'LIKE', "%{$search}%")->orwhere('transfers.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $transfers = $transfers->paginate($perPage);
                else
                    $transfers = $transfers->get();
            }
        }
        $data = array();
        if(!empty($transfers))
        {
            foreach ($transfers->getCollection() as $key => $transfer)
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
                $nestedData['grandTotal'] = number_format($transfer->grand_total, cache()->get('general_setting')->decimal);
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
        $paginated = $transfers->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }
    public function userPayments($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $user_id = $request->input('user_id');
        

        
        $q = $q->select('payments.*')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $payments = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%");
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments->getCollection() as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['amount'] = number_format($payment->amount, cache()->get('general_setting')->decimal);
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $paginated = $payments->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userPayrolls($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        $user_id = $request->input('user_id');
        
        $q = $q->select('payrolls.id', 'payrolls.created_at', 'payrolls.reference_no', 'payrolls.amount', 'payrolls.paying_method', 'employees.name as employee')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $payrolls = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $payrolls = $payrolls->paginate($perPage);
                else
                    $payrolls = $payrolls->get();
            }
            else {
                $payrolls =  $q->orwhere('payrolls.created_at', 'LIKE', "%{$search}%")->orwhere('payrolls.reference_no', 'LIKE', "%{$search}%");
                
                if($paginate)
                    $payrolls = $payrolls->paginate($perPage);
                else
                    $payrolls = $payrolls->get();
            }
        }
        $data = array();
        if(!empty($payrolls))
        {
            foreach ($payrolls->getCollection() as $key => $payroll)
            {
                $nestedData['id'] = $payroll->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payroll->created_at));
                $nestedData['reference_no'] = $payroll->reference_no;
                $nestedData['employee'] = $payroll->employee;
                $nestedData['amount'] = number_format($payroll->amount, cache()->get('general_setting')->decimal);
                if($payroll->paying_method == 0)
                    $nestedData['method'] = 'Cash';
                elseif($payroll->paying_method == 1)
                    $nestedData['method'] = 'Cheque';
                else
                    $nestedData['method'] = 'Credit Card';
                $data[] = $nestedData;
            }
        }
        $paginated = $payrolls->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function userExpenses($request, $q)
    {
        
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
            
        $user_id = $request->input('user_id');
        
        $q = $q->select('expenses.id', 'expenses.reference_no', 'expenses.amount', 'expenses.created_at', 'expenses.note', 'expense_categories.name as category', 'warehouses.name as warehouse')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $expenses = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $expenses = $expenses->paginate($perPage);
                else
                    $expenses = $expenses->get();
            }
            else {
                $expenses =  $q->orwhere('expenses.created_at', 'LIKE', "%{$search}%")->orwhere('expenses.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $expenses = $expenses->paginate($perPage);
                else
                    $expenses = $expenses->get();
            }
        }
        $data = array();
        if(!empty($expenses))
        {
            foreach ($expenses->getCollection() as $key => $expense)
            {
                $nestedData['id'] = $expense->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($expense->created_at));
                $nestedData['reference_no'] = $expense->reference_no;
                $nestedData['warehouse'] = $expense->warehouse;
                $nestedData['category'] = $expense->category;
                $nestedData['amount'] = number_format($expense->amount, cache()->get('general_setting')->decimal);
                $nestedData['note'] = $expense->note;
                $data[] = $nestedData;
            }
        }
        $paginated = $expenses->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }

        return $paginated;
    }

    public function customerReport(Request $request)
    {
        $customer_id = $request->input('customer_id');
        if($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        }
        else {
            $start_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
            $end_date = date("Y-m-d");
        }
        $lims_customer_list = Customer::where('is_active', true)->get();
        return view('backend.report.customer_report',compact('start_date', 'end_date', 'customer_id', 'lims_customer_list'));
    }

    public function CustomerSalePaymentQuotationReturnData(Request $request)
    {
        $customer_id = $request->input('customer_id');
        $customerSales = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->where('sales.customer_id', $customer_id)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));
        $customerPayments = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->join('customers', 'customers.id', '=', 'sales.customer_id')
           ->where('sales.customer_id', $customer_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));
           
        $customerQuotations = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->leftJoin('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.customer_id', $customer_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));
        
        $customerReturns = DB::table('returns')
            ->join('customers', 'returns.customer_id', '=', 'customers.id')
            ->join('warehouses', 'returns.warehouse_id', '=', 'warehouses.id')
            ->leftJoin('billers', 'returns.biller_id', '=', 'billers.id')
            ->where('returns.customer_id', $customer_id)
            ->whereDate('returns.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('returns.created_at', '<=' ,$request->input('end_date'));
           
        $customerSales = $this->customerSales($request, $customerSales);
        $customerPayments = $this->customerPayments($request, $customerPayments);
        $customerQuotations = $this->customerQuotations($request, $customerQuotations);
        $customerReturns = $this->customerReturns($request, $customerReturns);
        
        return response()->json([
            'customer_sales' => $customerSales,
            'customer_payments' => $customerPayments,
            'customer_quotations' => $customerQuotations,
            'customer_returns' => $customerReturns
        ]);
        
    }
    public function customerSales($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $q = $q->select('sales.id', 'sales.reference_no', 'sales.total_price', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
            
        if(empty($request->input('search.value'))) {
            $sales = $q->get();
            if($paginate)
                $sales = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->get();
                if($paginate)
                    $sales = $sales->paginate($perPage);
                else
                    $sales = $sales->get();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales->getCollection() as $key => $sale)
            {
                $nestedData['id'] = $sale->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                $nestedData['reference_no'] = $sale->reference_no;
                $nestedData['warehouse'] = $sale->warehouse_name;
                $product_sale_data = DB::table('sales')->join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                                    ->join('products', 'product_sales.product_id', '=', 'products.id')
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
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                //calculating product purchase cost
                config()->set('database.connections.mysql.strict', false);
                DB::reconnect();
                $product_sale_data = Sale::join('product_sales', 'sales.id','=', 'product_sales.sale_id')
                    ->select(DB::raw('product_sales.product_id, product_sales.product_batch_id, product_sales.sale_unit_id, sum(product_sales.qty) as sold_qty, sum(product_sales.total) as sold_amount'))
                    ->where('sales.id', $sale->id)
                    ->whereDate('sales.created_at', '>=' , $request->input('start_date'))
                    ->whereDate('sales.created_at', '<=' , $request->input('end_date'))
                    ->groupBy('product_sales.product_id', 'product_sales.product_batch_id')
                    ->get();
                config()->set('database.connections.mysql.strict', true);
                DB::reconnect();
                $product_cost = $this->calculateAverageCOGS($product_sale_data);
                $nestedData['total_cost'] = number_format($product_cost[0], cache()->get('general_setting')->decimal);
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, cache()->get('general_setting')->decimal);
                if($sale->sale_status == 1){
                    $nestedData['status'] = 'Completed';
                    $sale_status = 'Completed';
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = 'Pending';
                    $sale_status = 'Pending';
                }
                else{
                    $nestedData['sale_status'] = 'db.Draft';
                    $sale_status = 'Draft';
                }
                $data[] = $nestedData;
            }
        }
        
        $paginated = $sales->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerPayments($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $customer_id = $request->input('customer_id');
        
        $q = $q->select('payments.*', 'sales.reference_no as sale_reference')
            ->orderBy('created_at', 'desc');
            
        if(empty($request->input('search.value'))) {
            if($paginate)
                $payments = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $payments = $q->paginate($perPage);
                else
                    $payments = $q->get();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%");
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments->getCollection() as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['sale_reference'] = $payment->sale_reference;
                $nestedData['amount'] = number_format($payment->amount, cache()->get('general_setting')->decimal);
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $paginated = $payments->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerQuotations($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $customer_id = $request->input('customer_id');

        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'suppliers.name as supplier_name', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $quotations = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations->getCollection() as $key => $quotation)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = 'Pending';
                }
                else{
                    $nestedData['status'] = 'Sent';
                }
                $data[] = $nestedData;
            }
        }
        $paginated = $quotations->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerReturns($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page

        $customer_id = $request->input('customer_id');
       
        $q = $q->select('returns.id', 'returns.reference_no', 'returns.grand_total', 'returns.created_at', 'warehouses.name as warehouse_name', 'billers.name as biller_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $returns = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $returns = $q->paginate($perPage);
                else
                    $returns = $q->get();
            }
            else {
                $returns =  $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $returns = $q->paginate($perPage);
                else
                    $returns = $q->get();
            }
        }
        $data = array();
        if(!empty($returns))
        {
            foreach ($returns->getCollection() as $key => $sale)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $data[] = $nestedData;
            }
        }
        
        $paginated = $returns->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerGroupReport(Request $request)
    {
        $customer_group_id = $request->input('customer_group_id');
        if($request->input('starting_date')) {
            $starting_date = $request->input('starting_date');
            $ending_date = $request->input('ending_date');
        }
        else {
            $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
            $ending_date = date("Y-m-d");
        }
        $lims_customer_group_list = CustomerGroup::where('is_active', true)->get();
        return view('backend.report.customer_group_report',compact('starting_date', 'ending_date', 'customer_group_id', 'lims_customer_group_list'));
    }
    public function CustomerGroupSalePaymentQuotationReturnData(Request $request)
    {
        $customer_group_id = $request->input('customer_group_id');
        $customer_ids = Customer::where('customer_group_id', $customer_group_id)->pluck('id');
        $customerGroupSales = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->join('warehouses', 'sales.warehouse_id', '=', 'warehouses.id')
            ->whereIn('sales.customer_id', $customer_ids)
            ->whereDate('sales.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('ending_date'));
        $customerGroupPayments = DB::table('payments')
           ->join('sales', 'payments.sale_id', '=', 'sales.id')
           ->join('customers', 'customers.id', '=', 'sales.customer_id')
           ->whereIn('sales.customer_id', $customer_ids)
           ->whereDate('payments.created_at', '>=' , $request->input('starting_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('ending_date'));
        
        $customerGroupQuotations = DB::table('quotations')
            ->join('customers', 'quotations.customer_id', '=', 'customers.id')
            ->leftJoin('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->whereIn('quotations.customer_id', $customer_ids)
            ->whereDate('quotations.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('ending_date'));
        
        $customerGroupReturns = DB::table('returns')
            ->join('customers', 'returns.customer_id', '=', 'customers.id')
            ->join('warehouses', 'returns.warehouse_id', '=', 'warehouses.id')
            ->whereIn('returns.customer_id', $customer_ids)
            ->whereDate('returns.created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('returns.created_at', '<=' ,$request->input('ending_date'));
            
        $customerGroupSales = $this->customerGroupSales($request, $customerGroupSales);
        $customerGroupPayments = $this->customerGroupPayments($request, $customerGroupPayments);
        $customerGroupQuotations = $this->customerGroupQuotations($request, $customerGroupQuotations);
        $customerGroupReturns = $this->customerGroupReturns($request, $customerGroupReturns);
        
        return response()->json([
            'customer_group_sales' => $customerGroupSales,
            'customer_group_payments' => $customerGroupPayments,
            'customer_group_quotations' => $customerGroupQuotations,
            'customer_group_returns' => $customerGroupReturns
        ]);
    }
    
    public function customerGroupSales($request, $q)
    {
        $customer_group_id = $request->input('customer_group_id');
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.paid_amount', 'sales.sale_status', 'sales.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
            
        if(empty($request->input('search.value'))) {
            if($paginate)
                $sales = $q->paginate($perPage);
            else
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
                            ]);
                            
                if($paginate)
                    $sales = $q->paginate($perPage);
                else
                    $sales = $q->get();
            }
            else {
                $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $sales = $q->paginate($perPage);
                else
                    $sales = $q->get();
            }
        }
        $data = array();
        if(!empty($sales))
        {
            foreach ($sales->getCollection() as $key => $sale)
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
                        $nestedData['product'] .= '<br>'.$product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_sale->product_name.' ('.number_format($product_sale->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['due'] = number_format($sale->grand_total - $sale->paid_amount, cache()->get('general_setting')->decimal);
                if($sale->sale_status == 1){
                    $nestedData['status'] = 'Completed';
                    $sale_status = 'Completed';
                }
                elseif($sale->sale_status == 2){
                    $nestedData['sale_status'] = 'Pending';
                    $sale_status = 'Pending';
                }
                else{
                    $nestedData['sale_status'] = 'Draft';
                    $sale_status = 'Draft';
                }
                $data[] = $nestedData;
            }
        }
        
        $paginated = $sales->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerGroupPayments($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $customer_group_id = $request->input('customer_group_id');
        
        $q = $q->select('payments.*', 'sales.reference_no as sale_reference', 'customers.name as customer_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            
            if($paginate)
                $payments = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%");
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments->getCollection() as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['sale_reference'] = $payment->sale_reference;
                $nestedData['customer'] = $payment->customer_name;
                $nestedData['amount'] = number_format($payment->amount, cache()->get('general_setting')->decimal);
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        $paginated = $payments->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerGroupQuotations($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'suppliers.name as supplier_name', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $quotations = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations->getCollection() as $key => $quotation)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                }
                else{
                    $nestedData['status'] = '<div class="badge badge-success">'.__('db.Sent').'</div>';
                }
                $data[] = $nestedData;
            }
        }
        
        $paginated = $quotations->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerGroupReturns($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $q = $q->select('returns.id', 'returns.reference_no', 'returns.grand_total', 'returns.created_at', 'customers.name as customer_name', 'customers.phone_number as customer_number', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $returns = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $returns = $q->paginate($perPage);
                else
                    $returns = $q->get();
                
            }
            else {
                $returns =  $q->orwhere('returns.created_at', 'LIKE', "%{$search}%")->orwhere('returns.reference_no', 'LIKE', "%{$search}%")->get();
                
                if($paginate)
                    $returns = $q->paginate($perPage);
                else
                    $returns = $q->get();
            }
        }
        $data = array();
        if(!empty($returns))
        {
            foreach ($returns->getCollection() as $key => $sale)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);
                $data[] = $nestedData;
            }
        }
        
        $paginated = $returns->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    // public function supplierReport(Request $request)
    // {
    //     $data = $request->all();
    //     $supplier_id = $data['supplier_id'];
    //     $start_date = $data['start_date'];
    //     $end_date = $data['end_date'];
    //     $lims_purchase_data = Purchase::with('warehouse')->where('supplier_id', $supplier_id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->orderBy('created_at', 'desc')->get();
    //     $lims_quotation_data = Quotation::with('warehouse', 'customer')->where('supplier_id', $supplier_id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->orderBy('created_at', 'desc')->get();
    //     $lims_return_data = ReturnPurchase::with('warehouse')->where('supplier_id', $supplier_id)->whereDate('created_at', '>=' , $start_date)->whereDate('created_at', '<=' , $end_date)->orderBy('created_at', 'desc')->get();
    //     $lims_payment_data = DB::table('payments')
    //                        ->join('purchases', 'payments.purchase_id', '=', 'purchases.id')
    //                        ->where('supplier_id', $supplier_id)
    //                        ->whereDate('payments.created_at', '>=' , $start_date)
    //                        ->whereDate('payments.created_at', '<=' , $end_date)
    //                        ->select('payments.*', 'purchases.reference_no as purchase_reference')
    //                        ->orderBy('payments.created_at', 'desc')
    //                        ->get();

    //     $lims_product_purchase_data = [];
    //     $lims_product_quotation_data = [];
    //     $lims_product_return_data = [];

    //     foreach ($lims_purchase_data as $key => $purchase) {
    //         $lims_product_purchase_data[$key] = ProductPurchase::where('purchase_id', $purchase->id)->get();
    //     }
    //     foreach ($lims_return_data as $key => $return) {
    //         $lims_product_return_data[$key] = PurchaseProductReturn::where('return_id', $return->id)->get();
    //     }
    //     foreach ($lims_quotation_data as $key => $quotation) {
    //         $lims_product_quotation_data[$key] = ProductQuotation::where('quotation_id', $quotation->id)->get();
    //     }
    //     $lims_supplier_list = Supplier::where('is_active', true)->get();
    //     return view('backend.report.supplier_report', compact('lims_purchase_data', 'lims_product_purchase_data', 'lims_payment_data', 'supplier_id', 'start_date', 'end_date', 'lims_supplier_list', 'lims_quotation_data', 'lims_product_quotation_data', 'lims_return_data', 'lims_product_return_data'));
    // }

    public function supplierReport(Request $request)
    {
        $supplier_id = $request->input('supplier_id');
        if($request->input('start_date')) {
            $start_date = $request->input('start_date');
            $end_date = $request->input('end_date');
        }
        else {
            $start_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
            $end_date = date("Y-m-d");
        }
        $lims_supplier_list = Supplier::where('is_active', true)->get();
        return view('backend.report.supplier_report',compact('start_date', 'end_date', 'supplier_id', 'lims_supplier_list'));
    }

    public function supplierPurchasePaymentReturnQuotationData(Request $request)
    {
        $supplier_id = $request->input('supplier_id');
        $supplierPurchases = DB::table('purchases')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'purchases.warehouse_id', '=', 'warehouses.id')
            ->where('purchases.supplier_id', $supplier_id)
            ->whereDate('purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('purchases.created_at', '<=' ,$request->input('end_date'));

        $supplierPayments = DB::table('payments')
           ->join('purchases', 'payments.purchase_id', '=', 'purchases.id')
           ->where('purchases.supplier_id', $supplier_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));
           
        $supplierReturns = DB::table('return_purchases')
            ->join('suppliers', 'return_purchases.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'return_purchases.warehouse_id', '=', 'warehouses.id')
            ->where('return_purchases.supplier_id', $supplier_id)
            ->whereDate('return_purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('return_purchases.created_at', '<=' ,$request->input('end_date'));
        
        $supplierQuotations = DB::table('quotations')
            ->join('suppliers', 'quotations.supplier_id', '=', 'suppliers.id')
            ->leftJoin('customers', 'quotations.customer_id', '=', 'customers.id')
            ->join('warehouses', 'quotations.warehouse_id', '=', 'warehouses.id')
            ->where('quotations.supplier_id', $supplier_id)
            ->whereDate('quotations.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('quotations.created_at', '<=' ,$request->input('end_date'));
            
        
        $supplierPurchases = $this->supplierPurchases($request, $supplierPurchases);
        $supplierPayments = $this->supplierPayments($request, $supplierPayments);
        $supplierReturns = $this->supplierReturns($request, $supplierReturns);
        $supplierQuotations = $this->supplierQuotations($request, $supplierQuotations);
        return response()->json([
            'supplier_purchases' => $supplierPurchases,
            'supplier_payments' =>$supplierPayments,
            'supplier_returns' => $supplierReturns,
            'supplier_quotations' => $supplierQuotations
        ]);
        
    }
    
    public function supplierPurchases($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $q = $q->select('purchases.id', 'purchases.reference_no', 'purchases.grand_total', 'purchases.paid_amount', 'purchases.status', 'purchases.created_at', 'warehouses.name as warehouse_name')
               ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $purchases = $q->paginate($perPage);
            else
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
                            ]);
                
                if($paginate)
                    $purchases = $purchases->paginate($perPage);
                else
                    $purchases = $purchases->get();
            }
            else {
                $purchases =  $q->orwhere('purchases.created_at', 'LIKE', "%{$search}%")->orwhere('purchases.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $purchases = $purchases->paginate($perPage);
                else
                    $purchases = $purchases->get();
            }
        }
        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases->getCollection() as $key => $purchase)
            {
                $nestedData['id'] = $purchase->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($purchase->created_at));
                $nestedData['reference_no'] = $purchase->reference_no;
                $nestedData['warehouse'] = $purchase->warehouse_name;
                $product_purchase_data = DB::table('purchases')->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                                    ->join('products', 'product_purchases.product_id', '=', 'products.id')
                                    ->where('purchases.id', $purchase->id)
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
                        $nestedData['product'] .= '<br>'.$product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_purchase->product_name.' ('.number_format($product_purchase->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($purchase->grand_total, cache()->get('general_setting')->decimal);
                $nestedData['paid'] = number_format($purchase->paid_amount, cache()->get('general_setting')->decimal);
                $nestedData['balance'] = number_format($purchase->grand_total - $purchase->paid_amount, cache()->get('general_setting')->decimal);
                if($purchase->status == 1){
                    $nestedData['status'] = 'Completed';
                    $status = 'Completed';
                }
                elseif($purchase->status == 2){
                    $nestedData['status'] = 'Pending';
                    $status = 'Pending';
                }
                else{
                    $nestedData['status'] = 'Draft';
                    $status = __('db.Draft');
                }
                $data[] = $nestedData;
            }
        }
        
        // return $data;
        $paginated = $purchases->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function supplierPayments($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $supplier_id = $request->input('supplier_id');
        
        $q = DB::table('payments')
           ->join('purchases', 'payments.purchase_id', '=', 'purchases.id')
           ->where('purchases.supplier_id', $supplier_id)
           ->whereDate('payments.created_at', '>=' , $request->input('start_date'))
           ->whereDate('payments.created_at', '<=' , $request->input('end_date'));

        $q = $q->select('payments.*', 'purchases.reference_no as purchase_reference')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $payments = $q->paginate($perPage);
            else
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
                            ]);
                
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
               
            }
            else {
                $payments =  $q->orwhere('payments.created_at', 'LIKE', "%{$search}%")->orwhere('payments.payment_reference', 'LIKE', "%{$search}%");
                
                if($paginate)
                    $payments = $payments->paginate($perPage);
                else
                    $payments = $payments->get();
            }
        }
        $data = array();
        if(!empty($payments))
        {
            foreach ($payments->getCollection() as $key => $payment)
            {
                $nestedData['id'] = $payment->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($payment->created_at));
                $nestedData['reference_no'] = $payment->payment_reference;
                $nestedData['purchase_reference'] = $payment->purchase_reference;
                $nestedData['amount'] = number_format($payment->amount, cache()->get('general_setting')->decimal);
                $nestedData['paying_method'] = $payment->paying_method;
                $data[] = $nestedData;
            }
        }
        
        $paginated = $payments->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function supplierReturns($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $supplier_id = $request->input('supplier_id');
        $q = DB::table('return_purchases')
            ->join('suppliers', 'return_purchases.supplier_id', '=', 'suppliers.id')
            ->join('warehouses', 'return_purchases.warehouse_id', '=', 'warehouses.id')
            ->where('return_purchases.supplier_id', $supplier_id)
            ->whereDate('return_purchases.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('return_purchases.created_at', '<=' ,$request->input('end_date'));

        $q = $q->select('return_purchases.id', 'return_purchases.reference_no', 'return_purchases.grand_total', 'return_purchases.created_at', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
            
        if(empty($request->input('search.value'))) {
            if($paginate)
                $return_purchases = $q->paginate($perPage);
            else
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
                            ]);
                if($paginate)
                    $return_purchases = $q->paginate($perPage);
                else
                    $return_purchases = $q->get();
                
            }
            else {
                $return_purchases =  $q->orwhere('return_purchases.created_at', 'LIKE', "%{$search}%")->orwhere('return_purchases.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $return_purchases = $q->paginate($perPage);
                else
                    $return_purchases = $q->get();
            }
        }
        $data = array();
        if(!empty($return_purchases))
        {
            foreach ($return_purchases->getCollection() as $key => $return)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($return->grand_total, cache()->get('general_setting')->decimal);
                $data[] = $nestedData;
            }
        }
        
        $paginated = $return_purchases->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function supplierQuotations($request, $q)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $supplier_id = $request->input('supplier_id');

        $q = $q->select('quotations.id', 'quotations.reference_no', 'quotations.supplier_id', 'quotations.grand_total', 'quotations.quotation_status', 'quotations.created_at', 'customers.name as customer_name', 'warehouses.name as warehouse_name')
            ->orderBy('created_at', 'desc');
        if(empty($request->input('search.value'))) {
            if($paginate)
                $quotations = $q->paginate($perPage);
            else
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
                            ]);
                            
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
                
            }
            else {
                $quotations =  $q->orwhere('quotations.created_at', 'LIKE', "%{$search}%")->orwhere('quotations.reference_no', 'LIKE', "%{$search}%");
                if($paginate)
                    $quotations = $q->paginate($perPage);
                else
                    $quotations = $q->get();
            }
        }
        $data = array();
        if(!empty($quotations))
        {
            foreach ($quotations->getCollection() as $key => $quotation)
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
                        $nestedData['product'] .= '<br>'.$product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                    else
                        $nestedData['product'] = $product_return->product_name.' ('.number_format($product_return->qty, cache()->get('general_setting')->decimal).' '.$unitCode.')';
                }
                $nestedData['grand_total'] = number_format($quotation->grand_total, cache()->get('general_setting')->decimal);
                if($quotation->quotation_status == 1){
                    $nestedData['status'] = 'Pending';
                }
                else{
                    $nestedData['status'] = 'Sent';
                }
                $data[] = $nestedData;
            }
        }
        $paginated = $quotations->toArray();
        $paginated['data'] = $data;
        if($paginate){
            $paginated['require_pagination'] = true;
        }else{
            $paginated['require_pagination'] = false;
        }
        
        return $paginated;
    }

    public function customerDueReportByDate(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $customer_id = $request->customer_id ?? 0;

        // $q = Sale::where('payment_status', '!=', 4)
        //     ->whereDate('created_at', '>=' , $start_date)
        //     ->whereDate('created_at', '<=' , $end_date);
        // if($request->customer_id)
        //     $q = $q->where('customer_id', $request->customer_id);
        $lims_sale_data = [];
        if ($customer_id) {
            $lims_sale_data = Sale::where('payment_status', '!=', 4)
                ->where('customer_id', $request->customer_id)
                ->whereDate('created_at', '>=' , $start_date)
                ->whereDate('created_at', '<=' , $end_date)
                ->get();
        } else {
            $lims_sale_data = Sale::where('payment_status', '!=', 4)
                ->whereDate('created_at', '>=' , $start_date)
                ->whereDate('created_at', '<=' , $end_date)
                ->get();
        }
        // return dd($lims_sale_data);
        return view('backend.report.due_report', compact('lims_sale_data', 'start_date', 'end_date', 'customer_id'));
    }

    // public function customerDueReportData(Request $request)
    // {
    //     // return dd($request->all());
    //     $data = $request->all();
    //     $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
    //     $perPage = $request->input('per_page', 10); // Default: 10 items per page

    //     $q = DB::table('sales')
    //         ->join('customers', 'sales.customer_id', '=', 'customers.id')
    //         ->where('payment_status', '!=', 4)
    //         ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
    //         ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

           
            
    //         $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.created_at', 'sales.paid_amount', 'customers.name as customer_name', 'customers.phone_number as customer_phone_number')
    //             ->orderBy('created_at', 'desc');

            
    //         $sales = $request->customer_id === 0 ? $q->get() : $q->where('sales.customer_id', $request->customer_id);
    //         if($paginate){
    //             $sales = $sales->paginate($perPage);
    //         }else{
    //             $sales = $sales->get();
    //         }
    //         $data = array();
    //         if(!empty($sales))
    //         {
    //             foreach ($sales->getCollection() as $key => $sale)
    //             {
    //                 $nestedData['id'] = $sale->id;
    //                 $nestedData['key'] = $key;
    //                 $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
    //                 $nestedData['reference_no'] = $sale->reference_no;
    //                 $nestedData['customer'] = $sale->customer_name.' ('.$sale->customer_phone_number.')';
    //                 $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);

    //                 $returned_amount = DB::table('returns')->where('sale_id', $sale->id)->sum('grand_total');

    //                 $nestedData['returned_amount'] = number_format($returned_amount, cache()->get('general_setting')->decimal);
    //                 if($sale->paid_amount)
    //                     $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
    //                 else
    //                     $nestedData['paid'] = number_format(0, cache()->get('general_setting')->decimal);
    //                 $nestedData['due'] = number_format(($sale->grand_total - $returned_amount - $sale->paid_amount), cache()->get('general_setting')->decimal);

    //                 $data[] = $nestedData;
    //             }
    //         }
            
    //         $paginated = $sales->toArray();
    //         $paginated['data'] = $data;
    //         if($paginate){
    //             $paginated['require_pagination'] = true;
    //         }else{
    //             $paginated['require_pagination'] = false;
    //         }
        
        
    //     return response()->json($paginated);
           
    // }
    public function customerDueReportData(Request $request)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        
        $q = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('payment_status', '!=', 4)
            ->whereDate('sales.created_at', '>=' ,$request->input('start_date'))
            ->whereDate('sales.created_at', '<=' ,$request->input('end_date'));

          
            

           
        $q = $q->select('sales.id', 'sales.reference_no', 'sales.grand_total', 'sales.created_at', 'sales.paid_amount', 'customers.name as customer_name', 'customers.phone_number as customer_phone_number')
            ->orderBy('created_at','desc');

            if(empty($request->input('search.value'))) {
                if($paginate)
                    $sales = $q->paginate($perPage);
                else
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
                                ->orwhere([
                                    ['customers.name', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ])
                                ->orwhere([
                                    ['customers.phone_number', 'LIKE', "%{$search}%"],
                                    ['sales.user_id', Auth::id()]
                                ]);
                     if($paginate)
                        $sales = $q->paginate($perPage);
                    else
                        $sales = $q->get();
                }
                else {
                    $sales =  $q->orwhere('sales.created_at', 'LIKE', "%{$search}%")->orwhere('sales.reference_no', 'LIKE', "%{$search}%")->orwhere('customers.name', 'LIKE', "%{$search}%")->orwhere('customers.phone_number', 'LIKE', "%{$search}%");
                     if($paginate)
                        $sales = $q->paginate($perPage);
                    else
                        $sales = $q->get();
                }
            }
            $data = array();
            if(!empty($sales))
            {
                foreach ($sales->getCollection() as $key => $sale)
                {
                    $nestedData['id'] = $sale->id;
                    $nestedData['key'] = $key;
                    $nestedData['date'] = date(config('date_format'), strtotime($sale->created_at));
                    $nestedData['reference_no'] = $sale->reference_no;
                    $nestedData['customer'] = $sale->customer_name.' ('.$sale->customer_phone_number.')';
                    $nestedData['grand_total'] = number_format($sale->grand_total, cache()->get('general_setting')->decimal);

                    $returned_amount = DB::table('returns')->where('sale_id', $sale->id)->sum('grand_total');

                    $nestedData['returned_amount'] = number_format($returned_amount, cache()->get('general_setting')->decimal);
                    if($sale->paid_amount)
                        $nestedData['paid'] = number_format($sale->paid_amount, cache()->get('general_setting')->decimal);
                    else
                        $nestedData['paid'] = number_format(0, cache()->get('general_setting')->decimal);
                    $nestedData['due'] = number_format(($sale->grand_total - $returned_amount - $sale->paid_amount), cache()->get('general_setting')->decimal);

                    $data[] = $nestedData;
                }
            }
           $paginated = $sales->toArray();
            $paginated['data'] = $data;
            if($paginate){
                $paginated['require_pagination'] = true;
            }else{
                $paginated['require_pagination'] = false;
            }
            
            return $paginated;
    }

    public function supplierDueReportByDate(Request $request)
    {
        $data = $request->all();
        $start_date = $data['start_date'];
        $end_date = $data['end_date'];
        $q = Purchase::where('payment_status', 1)
            ->whereDate('created_at', '>=' , $start_date)
            ->whereDate('created_at', '<=' , $end_date);
     
        $general_setting = $this->generalSetting();
        if($request->supplier_id)
            $q = $q->where('supplier_id', $request->supplier_id);
        $lims_purchase_data = $q->get();
        $supplierDueData = [];
        foreach($lims_purchase_data as $key => $purchase_data)
        {
            if($purchase_data->supplier_id)
            {
                $supplier = DB::table('suppliers')->find($purchase_data->supplier_id);
                $returned_amount = DB::table('return_purchases')->where('purchase_id', $purchase_data->id)->sum('grand_total');
            
                $supplierDueData[] = [
                    'date' => date($general_setting->date_format, strtotime($purchase_data->created_at->toDateString())) . ' '. $purchase_data->created_at->toTimeString(),
                    'reference' => $purchase_data->reference_no,
                    'supplier_details' => $supplier->name .' (' .$supplier->phone_number . ')',
                    'grand_total' => number_format((float)$purchase_data->grand_total, $general_setting->decimal, '.', ''),
                    'return_amount' => number_format((float)$purchase_data->paid_amount, $general_setting->decimal, '.', ''),
                    'paid' => number_format((float)($purchase_data->paid_amount ?? 0), $general_setting->decimal, '.', ''),
                    'due' => number_format((float)($purchase_data->grand_total - $returned_amount - $purchase_data->paid_amount), $general_setting->decimal, '.', '')
                ];
            }
        }
        return response()->json($supplierDueData);
    }
}
