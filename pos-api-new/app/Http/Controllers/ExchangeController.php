<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use App\Models\SaleExchange;
use App\Models\ProductExchange;
use App\Models\Customer;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\CustomField;
use App\Models\GeneralSetting;
use App\Models\Product;
use App\Models\Product_Sale;
use App\Models\Product_Warehouse;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\Tax;
use App\Models\Unit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class ExchangeController extends Controller
{
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('exchange-index')) {
            $permissions = Role::findByName($role->name)->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if (empty($all_permission))
                $all_permission[] = 'dummy text';

            if ($request->input('warehouse_id'))
                $warehouse_id = $request->input('warehouse_id');
            else
                $warehouse_id = 0;

            if ($request->input('starting_date')) {
                $starting_date = $request->input('starting_date');
                $ending_date = $request->input('ending_date');
            } else {
                $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d'))))));
                $ending_date = date("Y-m-d");
            }

            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $general_setting = \App\Models\GeneralSetting::latest()->first();

            return view('backend.sale-exchange.index', compact('starting_date', 'ending_date', 'warehouse_id', 'all_permission', 'lims_warehouse_list', 'general_setting'));
        } else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function exchangeData(Request $request)
    {
        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
        );

        $warehouse_id = $request->input('warehouse_id');

        // Build base query
        $query = SaleExchange::query();

        // Apply filters based on user role and permissions
        if (Auth::user()->role_id > 2 && config('staff_access') == 'own') {
            $query->where('user_id', Auth::id());
        } elseif (Auth::user()->role_id > 2 && config('staff_access') == 'warehouse') {
            $query->where('warehouse_id', Auth::user()->warehouse_id);
        } elseif ($warehouse_id != 0) {
            $query->where('warehouse_id', $warehouse_id);
        }

        // Apply date range filter
        $query->whereDate('created_at', '>=', $request->input('starting_date'))
            ->whereDate('created_at', '<=', $request->input('ending_date'));

        // Total count
        $totalData = $query->count();
        $totalFiltered = $totalData;

        // Limit and offset
        $limit = $request->input('length') != -1 ? $request->input('length') : $totalData;
        $start = $request->input('start');
        $order = 'sale_exchanges.' . $columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');

        // Search functionality
        if (!empty($request->input('search.value'))) {
            $search = $request->input('search.value');

            $query->join('customers', 'sale_exchanges.customer_id', '=', 'customers.id')
                ->join('billers', 'sale_exchanges.biller_id', '=', 'billers.id')
                ->select('sale_exchanges.*')
                ->where(function ($q) use ($search) {
                    $q->where('sale_exchanges.reference_no', 'LIKE', "%{$search}%")
                        ->orWhere('customers.name', 'LIKE', "%{$search}%")
                        ->orWhere('customers.phone_number', 'LIKE', "%{$search}%")
                        ->orWhere('billers.name', 'LIKE', "%{$search}%")
                        ->orWhereDate('sale_exchanges.created_at', '=', date('Y-m-d', strtotime(str_replace('/', '-', $search))));
                });

            $totalFiltered = $query->count();
        }

        // Get exchanges with relations
        $exchanges = $query->with(['biller', 'customer', 'warehouse', 'user', 'sale'])
            ->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir)
            ->get();

        $data = array();
        if (!empty($exchanges)) {
            foreach ($exchanges as $key => $exchange) {
                // Get sale reference
                $saleReference = 'N/A';
                if ($exchange->sale_id && $exchange->sale) {
                    $saleReference = $exchange->sale->reference_no;
                }

                $nestedData = [
                    'key' => $key,
                    'date' => date(config('date_format'), strtotime($exchange->created_at->toDateString())),
                    'reference_no' => $exchange->reference_no,
                    'sale_reference' => $saleReference,
                    'warehouse' => $exchange->warehouse->name,
                    'biller' => $exchange->biller->name,
                    'customer' => $exchange->customer->name,
                    'payment_type' => $exchange->payment_type == 'pay'
                        ? '<span class="badge badge-danger">Pay</span>'
                        : '<span class="badge badge-success">Receive</span>',
                    'amount' => number_format($exchange->amount, config('decimal')),
                    'options' => $this->buildActionButtons($exchange, $request['all_permission']),
                    // Array format for modal (keeping backward compatibility)
                    'exchange' => json_encode([
                        date(config('date_format'), strtotime($exchange->created_at->toDateString())), // 0
                        $exchange->reference_no, // 1
                        $exchange->warehouse->name, // 2
                        $exchange->biller->name, // 3
                        $exchange->biller->company_name ?? '', // 4
                        $exchange->biller->email, // 5
                        $exchange->biller->phone_number, // 6
                        $exchange->biller->address, // 7
                        $exchange->biller->city, // 8
                        $exchange->customer->name, // 9
                        $exchange->customer->phone_number, // 10
                        $exchange->customer->address, // 11
                        $exchange->customer->city, // 12
                        $exchange->id, // 13
                        $exchange->total_tax, // 14
                        $exchange->total_discount, // 15
                        $exchange->amount, // 16
                        $exchange->order_tax, // 17
                        $exchange->order_tax_rate, // 18
                        $exchange->grand_total, // 19
                        nl2br($exchange->exchange_note ?? ''), // 20
                        nl2br($exchange->staff_note ?? ''), // 21
                        $exchange->user->name, // 22
                        $exchange->user->email, // 23
                        $saleReference, // 24
                        $exchange->document, // 25
                        config('currency', 'BDT'), // 26
                        $exchange->exchange_rate ?? '', // 27
                        $exchange->payment_type ?? '', // 27
                    ])
                ];

                $data[] = $nestedData;
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

    private function buildActionButtons($exchange, $permissions)
    {
        $html = '<div class="btn-group">
            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' . __("db.action") . '
              <span class="caret"></span>
              <span class="sr-only">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">
                <li>
                    <button type="button" class="btn btn-link view"><i class="fa fa-eye"></i> ' . __('db.View') . '</button>
                </li>';

        if (in_array("exchanges-edit", $permissions)) {
            $html .= '<li>
                <a href="' . route('exchange.edit', $exchange->id) . '" class="btn btn-link"><i class="dripicons-document-edit"></i> ' . __('db.edit') . '</a>
            </li>';
        }

        if (in_array("exchanges-delete", $permissions)) {
            $html .= '<form action="' . route("exchange.destroy", $exchange->id) . '" method="POST" class="delete-form">' . csrf_field() . '' . method_field("DELETE") . '
                <li>
                  <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> ' . __("db.delete") . '</button>
                </li></form>';
        }

        $html .= '</ul></div>';

        return $html;
    }

    /**
     * Get exchange products separated by type (new/returned)
     * This is called via AJAX from the modal
     */
    public function productExchange($id)
    {
        try {
            $exchange = SaleExchange::with(['products.product', 'products.saleUnit'])->findOrFail($id);
            $dashboard = app(ExchangeDashboardController::class);

            return response()->json($dashboard->buildProductsPayload($exchange));
        } catch (\Exception $e) {
            \Log::error('Exchange product fetch error: ' . $e->getMessage());
            return response()->json(['error' => 'Exchange not found'], 404);
        }
    }

    public function create(Request $request)
    {

        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('exchange-add')) {
            $lims_customer_list = Customer::where('is_active', true)->get();
            $lims_account_list = Account::query()->latest()->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_tax_list = Tax::where('is_active', true)->get();
            $numberOfInvoice = Sale::whereNull('deleted_at')->count();
            $lims_sale_data = Sale::where('reference_no', $request->reference_no)->first();
            if( $lims_sale_data){
                $lims_product_sale_data = Product_Sale::where('sale_id', $lims_sale_data->id)->get();
            }else{
                $lims_product_sale_data = null;
            }

            if ($lims_sale_data && $lims_sale_data->exchange_rate)
                $currency_exchange_rate = $lims_sale_data->exchange_rate;
            else
                $currency_exchange_rate = 1;
            $custom_fields = CustomField::where('belongs_to', 'sale')->get();
            return view('backend.sale-exchange.create', compact('lims_account_list', 'lims_customer_list', 'lims_warehouse_list', 'lims_biller_list', 'lims_tax_list', 'lims_sale_data', 'lims_product_sale_data', 'currency_exchange_rate', 'custom_fields', 'numberOfInvoice'));
        } else {
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Basic data preparation
            $data = $request->except('document', 'total_sale_discount', 'type');
            $data['reference_no'] = 'exc-' . date("Ymd") . '-' . date("his");
            $data['total_discount'] = $request->total_sale_discount ?? 0;
            $data['user_id'] = Auth::id();

            // Get original sale data
            $lims_sale_data = Sale::whereNull('deleted_at')
                ->select('id', 'warehouse_id', 'customer_id', 'biller_id')
                ->find($data['sale_id']);

            if (!$lims_sale_data) {
                DB::rollBack();
                return redirect()->back()->with('not_permitted', 'Original sale not found');
            }

            // Override with original sale data
            $data['customer_id'] = $lims_sale_data->customer_id;
            $data['warehouse_id'] = $lims_sale_data->warehouse_id;
            $data['biller_id'] = $lims_sale_data->biller_id;

            // Handle document upload
            $document = $request->document;
            if ($document) {
                $v = Validator::make(
                    ['extension' => strtolower($document->getClientOriginalExtension())],
                    ['extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt']
                );

                if ($v->fails()) {
                    DB::rollBack();
                    return redirect()->back()->withErrors($v->errors());
                }

                $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
                $documentName = date("Ymdhis");

                if (!config('database.connections.saleprosaas_landlord')) {
                    $documentName = $documentName . '.' . $ext;
                } else {
                    $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                }

                $document->move(public_path('documents/exchange'), $documentName);
                $data['document'] = $documentName;
            }

            // Create exchange record
            $lims_exchange_data = SaleExchange::create($data);

            // Get arrays from request
            $type_array = $request->type ?? [];
            $product_id = $data['product_id'] ?? [];
            $product_batch_id = $data['product_batch_id'] ?? [];
            $imei_number = $data['imei_number'] ?? [];
            $product_code = $data['product_code'] ?? [];
            $qty = $data['qty'] ?? [];
            $sale_unit = $data['sale_unit'] ?? [];
            $net_unit_price = $data['net_unit_price'] ?? [];
            $discount = $data['discount'] ?? [];
            $tax_rate = $data['tax_rate'] ?? [];
            $tax = $data['tax'] ?? [];
            $total = $data['subtotal'] ?? [];
            $product_sale_id = $data['product_sale_id'] ?? [];
            $is_exchange = $request->is_exchange ?? [];

            $new_products_count = 0;
            $returned_products_count = 0;

            // Process each product based on type
            foreach ($product_id as $index => $id) {
                $product_type = $type_array[$index] ?? 'new';

                // ===== RETURN TYPE PRODUCTS =====
                if ($product_type === 'return') {
                    // Check if product code matches is_exchange array
                    $product_code_value = $product_code[$index] ?? null;
                    $should_return = false;

                    // Check if this product code is in is_exchange array
                    if ($product_code_value && in_array($product_code_value, $is_exchange)) {
                        $should_return = true;
                    }

                    if ($should_return) {
                        // Get original product sale data if available
                        $original_sale_id = $product_sale_id[$index] ?? null;
                        $original_product_sale = null;

                        if ($original_sale_id) {
                            $original_product_sale = Product_Sale::find($original_sale_id);
                        }

                        $this->processReturnProduct(
                            $id,
                            $index,
                            $lims_exchange_data->id,
                            $data['warehouse_id'],
                            $qty,
                            $sale_unit,
                            $net_unit_price,
                            $discount,
                            $tax_rate,
                            $tax,
                            $total,
                            $product_code,
                            $product_batch_id,
                            $imei_number,
                            $original_product_sale
                        );

                        $returned_products_count++;
                    }
                }
                // ===== NEW TYPE PRODUCTS =====
                elseif ($product_type === 'new') {
                    $this->processNewProduct(
                        $id,
                        $index,
                        $lims_exchange_data->id,
                        $data['warehouse_id'],
                        $qty,
                        $sale_unit,
                        $net_unit_price,
                        $discount,
                        $tax_rate,
                        $tax,
                        $total,
                        $product_code,
                        $product_batch_id,
                        $imei_number
                    );

                    $new_products_count++;
                }
            }

            // Create activity log
            DB::commit();
            $message = "Exchange created successfully with {$new_products_count} new product(s) and {$returned_products_count} returned product(s)";
            return redirect('exchange')->with('message', $message);
        } catch (\Throwable $e) {
            DB::rollBack();
            dd($e);
            Log::error('Exchange Store Error: ' . $e->getMessage());
            Log::error('Stack Trace: ' . $e->getTraceAsString());

            return redirect()->back()->with('not_permitted', 'Something went wrong: ' . $e->getMessage());
        }
    }

    private function processNewProduct(
        $product_id,
        $index,
        $exchange_id,
        $warehouse_id,
        $qty,
        $sale_unit,
        $net_unit_price,
        $discount,
        $tax_rate,
        $tax,
        $total,
        $product_code,
        $product_batch_id,
        $imei_number
    ) {
        $lims_product_data = Product::find($product_id);

        if (!$lims_product_data) {
            throw new \Exception("Product not found: {$product_id}");
        }

        $sale_unit_id = 0;
        $quantity = $qty[$index];

        // Handle unit conversion
        if ($sale_unit[$index] != 'n/a') {
            $lims_sale_unit_data = Unit::where('unit_name', $sale_unit[$index])->first();

            if ($lims_sale_unit_data) {
                $sale_unit_id = $lims_sale_unit_data->id;

                // Calculate quantity based on unit conversion
                if ($lims_sale_unit_data->operator == '*') {
                    $quantity = $qty[$index] * $lims_sale_unit_data->operation_value;
                } elseif ($lims_sale_unit_data->operator == '/') {
                    $quantity = $qty[$index] / $lims_sale_unit_data->operation_value;
                }
            }
        }

        // Deduct from main product stock
        $lims_product_data->qty -= $quantity;
        $lims_product_data->save();

        $lims_product_warehouse_data = null;

        // Handle variant stock
        if ($lims_product_data->is_variant) {
            $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')
                ->FindExactProductWithCode($product_id, $product_code[$index])
                ->first();

            if ($lims_product_variant_data) {
                $lims_product_variant_data->qty -= $quantity;
                $lims_product_variant_data->save();

                $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant(
                    $product_id,
                    $lims_product_variant_data->variant_id,
                    $warehouse_id
                )->first();
            }
        }
        // Handle batch stock
        elseif ($product_batch_id[$index]) {
            $lims_product_batch_data = ProductBatch::find($product_batch_id[$index]);
            if ($lims_product_batch_data) {
                $lims_product_batch_data->qty -= $quantity;
                $lims_product_batch_data->save();
            }

            $lims_product_warehouse_data = Product_Warehouse::where([
                ['product_batch_id', $product_batch_id[$index]],
                ['warehouse_id', $warehouse_id]
            ])->first();
        }
        // Regular product
        else {
            $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant(
                $product_id,
                $warehouse_id
            )->first();
        }

        // Deduct warehouse stock
        if ($lims_product_warehouse_data) {
            $lims_product_warehouse_data->qty -= $quantity;

            // Handle IMEI numbers - remove from warehouse
            if ($imei_number[$index] && !str_contains($imei_number[$index], "null")) {
                $imei_numbers = explode(",", $imei_number[$index]);
                $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number ?? '');

                foreach ($imei_numbers as $number) {
                    if (($j = array_search($number, $all_imei_numbers)) !== false) {
                        unset($all_imei_numbers[$j]);
                    }
                }

                $lims_product_warehouse_data->imei_number = implode(",", array_filter($all_imei_numbers));
            }

            $lims_product_warehouse_data->save();
        }

        // Create product exchange record
        ProductExchange::create([
            'exchange_id' => $exchange_id,
            'product_id' => $product_id,
            'qty' => $qty[$index],
            'sale_unit_id' => $sale_unit_id,
            'net_unit_price' => $net_unit_price[$index],
            'discount' => $discount[$index],
            'tax_rate' => $tax_rate[$index],
            'tax' => $tax[$index],
            'total' => $total[$index],
            'type' => 'new',
        ]);
    }

    /**
     * Process RETURNED products (add back to stock)
     */
    private function processReturnProduct(
        $product_id,
        $index,
        $exchange_id,
        $warehouse_id,
        $qty,
        $sale_unit,
        $net_unit_price,
        $discount,
        $tax_rate,
        $tax,
        $total,
        $product_code,
        $product_batch_id,
        $imei_number,
        $original_product_sale = null
    ) {
        $lims_product_data = Product::find($product_id);

        if (!$lims_product_data) {
            throw new \Exception("Product not found: {$product_id}");
        }

        $sale_unit_id = 0;
        $quantity = $qty[$index];

        // Handle unit conversion
        if ($sale_unit[$index] != 'n/a') {
            $lims_sale_unit_data = Unit::where('unit_name', $sale_unit[$index])->first();

            if ($lims_sale_unit_data) {
                $sale_unit_id = $lims_sale_unit_data->id;

                // Calculate quantity based on unit conversion
                if ($lims_sale_unit_data->operator == '*') {
                    $quantity = $qty[$index] * $lims_sale_unit_data->operation_value;
                } elseif ($lims_sale_unit_data->operator == '/') {
                    $quantity = $qty[$index] / $lims_sale_unit_data->operation_value;
                }
            }
        }

        // Add back to main product stock
        $lims_product_data->qty += $quantity;
        $lims_product_data->save();

        $lims_product_warehouse_data = null;
        $variant_id = $original_product_sale->variant_id ?? null;
        $batch_id = $product_batch_id[$index] ?? ($original_product_sale->product_batch_id ?? null);

        // Handle variant stock
        if ($lims_product_data->is_variant && $variant_id) {
            $lims_product_variant_data = ProductVariant::find($variant_id);
            if ($lims_product_variant_data) {
                $lims_product_variant_data->qty += $quantity;
                $lims_product_variant_data->save();
            }

            $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant(
                $product_id,
                $variant_id,
                $warehouse_id
            )->first();
        }
        // Handle batch stock
        elseif ($batch_id) {
            $lims_product_batch_data = ProductBatch::find($batch_id);
            if ($lims_product_batch_data) {
                $lims_product_batch_data->qty += $quantity;
                $lims_product_batch_data->save();
            }

            $lims_product_warehouse_data = Product_Warehouse::where([
                ['product_batch_id', $batch_id],
                ['warehouse_id', $warehouse_id]
            ])->first();
        }
        // Regular product
        else {
            $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant(
                $product_id,
                $warehouse_id
            )->first();
        }

        // Add back to warehouse stock
        if ($lims_product_warehouse_data) {
            $lims_product_warehouse_data->qty += $quantity;

            // Add back IMEI numbers
            if ($imei_number[$index] && !str_contains($imei_number[$index], "null")) {
                if ($lims_product_warehouse_data->imei_number) {
                    $lims_product_warehouse_data->imei_number .= ',' . $imei_number[$index];
                } else {
                    $lims_product_warehouse_data->imei_number = $imei_number[$index];
                }
            }

            $lims_product_warehouse_data->save();
        }

        // Create product exchange record
        ProductExchange::create([
            'exchange_id' => $exchange_id,
            'product_id' => $product_id,
            'qty' => $qty[$index],
            'sale_unit_id' => $sale_unit_id,
            'net_unit_price' => $net_unit_price[$index],
            'discount' => $discount[$index],
            'tax_rate' => $tax_rate[$index],
            'tax' => $tax[$index],
            'total' => $total[$index],
            'type' => 'returned',
        ]);
    }
    public function searchByReference(Request $request)
    {

        $role = Role::find(Auth::user()->role_id);

        if (!$role->hasPermissionTo('exchange-add')) {
            return response()->json([
                'status' => false,
                'message' => __('db.Sorry! You are not allowed')
            ]);
        }

        // 🔹 AJAX search request
        if ($request->ajax()) {
            $lims_sale_data = Sale::where('reference_no', $request->reference)->first();

            if (!$lims_sale_data) {
                return response()->json([
                    'status' => false,
                    'message' => 'Reference number not found'
                ]);
            }

            $lims_product_sale_data = Product_Sale::where('sale_id', $lims_sale_data->id)->get();
            $general_setting = \App\Models\GeneralSetting::latest()->first();
            $html = view(
                'backend.sale-exchange.partials.sale-products',
                compact('lims_product_sale_data', 'general_setting')
            )->render();

            return response()->json([
                'status' => true,
                'html' => $html
            ]);
        }
    }
}
