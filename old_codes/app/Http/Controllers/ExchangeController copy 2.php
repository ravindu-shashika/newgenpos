<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\Product_Warehouse;
use App\Models\ProductBatch;
use Illuminate\Support\Facades\DB;
use App\Models\Returns;
use App\Models\Account;
use App\Models\ProductReturn;
use App\Models\ProductVariant;
use App\Models\Variant;
use App\Models\CashRegister;
use App\Models\Sale;
use App\Models\Product_Sale;
use App\Models\Currency;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\ReturnDetails;
use App\Models\CustomField;
use App\Models\GeneralSetting;
use Mail;
use Illuminate\Support\Facades\Validator;
use App\Models\MailSetting;
use App\Models\Payment;
use App\Models\PosSetting;
use App\Models\ProductExchange;
use App\Models\RewardPointSetting;
use App\Models\SaleExchange;
use App\Models\Table;
use App\Traits\MailInfo;
use App\Traits\StaffAccess;
use App\Traits\TenantInfo;
use Illuminate\Support\Facades\Log;

class ExchangeController extends Controller
{
    use TenantInfo, MailInfo, StaffAccess;

    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('returns-index')) {
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
            return view('backend.sale-exchange.index', compact('starting_date', 'ending_date', 'warehouse_id', 'all_permission', 'lims_warehouse_list'));
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
              ->where(function($q) use ($search) {
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
                // Organized exchange data for modal
                'exchange' => [
                    'id' => $exchange->id,
                    'date' => date(config('date_format'), strtotime($exchange->created_at->toDateString())),
                    'reference_no' => $exchange->reference_no,
                    'sale_reference' => $saleReference,
                    'warehouse' => $exchange->warehouse->name,
                    'currency' => 'BDT', // You can make this dynamic
                    'exchange_rate' => $exchange->exchange_rate ?? 'N/A',
                    'document' => $exchange->document,
                    'item' => $exchange->item,
                    'total_qty' => $exchange->total_qty,
                    // Biller info
                    'biller_name' => $exchange->biller->name,
                    'biller_company' => $exchange->biller->company_name,
                    'biller_email' => $exchange->biller->email,
                    'biller_phone' => $exchange->biller->phone_number,
                    'biller_address' => $exchange->biller->address,
                    'biller_city' => $exchange->biller->city,
                    // Customer info
                    'customer_name' => $exchange->customer->name,
                    'customer_phone' => $exchange->customer->phone_number,
                    'customer_address' => $exchange->customer->address,
                    'customer_city' => $exchange->customer->city,
                    // Financial info
                    'total_tax' => $exchange->total_tax,
                    'total_discount' => $exchange->total_discount,
                    'amount' => $exchange->amount,
                    'order_tax' => $exchange->order_tax,
                    'order_tax_rate' => $exchange->order_tax_rate,
                    'grand_total' => $exchange->grand_total,
                    'payment_type' => $exchange->payment_type,
                    // Notes
                    'exchange_note' => nl2br($exchange->exchange_note ?? ''),
                    'staff_note' => nl2br($exchange->staff_note ?? ''),
                    // User info
                    'user_name' => $exchange->user->name,
                    'user_email' => $exchange->user->email,
                ]
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

// Add this new method to get exchange products for the modal
public function getExchangeProducts($id)
{
    $exchange = SaleExchange::with(['products.product', 'products.saleUnit'])->findOrFail($id);

    $products = $exchange->products->map(function($item) {
        return [
            'name' => $item->product->name,
            'code' => $item->product->code,
            'batch_no' => $item->product->batch_no ?? 'N/A',
            'qty' => $item->qty,
            'unit' => $item->saleUnit->unit_code ?? '',
            'unit_price' => number_format($item->net_unit_price, config('decimal')),
            'tax' => number_format($item->tax, config('decimal')),
            'tax_rate' => $item->tax_rate,
            'discount' => number_format($item->discount, config('decimal')),
            'subtotal' => number_format($item->total, config('decimal')),
            'type' => $item->type // 'new' or 'returned'
        ];
    });

    return response()->json($products);
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
            $lims_product_sale_data = Product_Sale::where('sale_id', $lims_sale_data->id)->get();
            if ($lims_sale_data->exchange_rate)
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

    /**
     * Process NEW products (deduct from stock)
     */
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

    public function getCustomerGroup($id)
    {
        $lims_customer_data = Customer::find($id);
        $lims_customer_group_data = CustomerGroup::find($lims_customer_data->customer_group_id);
        return $lims_customer_group_data->percentage;
    }

    public function getProduct($id)
    {
        //retrieve data of product without variant
        $lims_product_warehouse_data = Product::join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->where([
                ['products.is_active', true],
                ['product_warehouse.warehouse_id', $id],
            ])
            ->whereNull('product_warehouse.variant_id')
            ->whereNull('product_warehouse.product_batch_id')
            ->select('product_warehouse.*')
            ->get();

        config()->set('database.connections.mysql.strict', false);
        DB::reconnect(); //important as the existing connection if any would be in strict mode

        $lims_product_with_batch_warehouse_data = Product::join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->where([
                ['products.is_active', true],
                ['product_warehouse.warehouse_id', $id],
            ])
            ->whereNull('product_warehouse.variant_id')
            ->whereNotNull('product_warehouse.product_batch_id')
            ->select('product_warehouse.*')
            ->groupBy('product_warehouse.product_id')
            ->get();

        //now changing back the strict ON
        config()->set('database.connections.mysql.strict', true);
        DB::reconnect();

        //retrieve data of product with variant
        $lims_product_with_variant_warehouse_data = Product::join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
            ->where([
                ['products.is_active', true],
                ['product_warehouse.warehouse_id', $id],
            ])->whereNotNull('product_warehouse.variant_id')->select('product_warehouse.*')->get();

        $product_code = [];
        $product_name = [];
        $product_qty = [];
        $product_price = [];
        $product_type = [];
        $is_batch = [];
        $product_data = [];
        foreach ($lims_product_warehouse_data as $product_warehouse) {
            $product_qty[] = $product_warehouse->qty;
            $product_price[] = $product_warehouse->price;
            $lims_product_data = Product::select('code', 'name', 'type', 'is_batch')->find($product_warehouse->product_id);
            $product_code[] =  $lims_product_data->code;
            $product_name[] = htmlspecialchars($lims_product_data->name);
            $product_type[] = $lims_product_data->type;
            $is_batch[] = null;
        }
        //product with batches
        foreach ($lims_product_with_batch_warehouse_data as $product_warehouse) {
            $product_qty[] = $product_warehouse->qty;
            $product_price[] = $product_warehouse->price;
            $lims_product_data = Product::select('code', 'name', 'type', 'is_batch')->find($product_warehouse->product_id);
            $product_code[] =  $lims_product_data->code;
            $product_name[] = htmlspecialchars($lims_product_data->name);
            $product_type[] = $lims_product_data->type;
            $product_batch_data = ProductBatch::select('id', 'batch_no')->find($product_warehouse->product_batch_id);
            $is_batch[] = $lims_product_data->is_batch;
        }
        foreach ($lims_product_with_variant_warehouse_data as $product_warehouse) {
            $product_qty[] = $product_warehouse->qty;
            $lims_product_data = Product::select('name', 'type')->find($product_warehouse->product_id);
            $lims_product_variant_data = ProductVariant::select('item_code')->FindExactProduct($product_warehouse->product_id, $product_warehouse->variant_id)->first();
            $product_code[] =  $lims_product_variant_data->item_code;
            $product_name[] = htmlspecialchars($lims_product_data->name);
            $product_type[] = $lims_product_data->type;
            $is_batch[] = null;
        }
        $lims_product_data = Product::select('code', 'name', 'type')->where('is_active', true)->whereNotIn('type', ['standard'])->get();
        foreach ($lims_product_data as $product) {
            $product_qty[] = $product->qty;
            $product_code[] =  $product->code;
            $product_name[] = htmlspecialchars($product->name);
            $product_type[] = $product->type;
            $is_batch[] = null;
        }
        $product_data[] = $product_code;
        $product_data[] = $product_name;
        $product_data[] = $product_qty;
        $product_data[] = $product_type;
        $product_data[] = $product_price;
        $product_data[] = $is_batch;
        return $product_data;
    }

    public function limsProductSearch(Request $request)
    {
        $todayDate = date('Y-m-d');
        $product_code = explode("(", $request['data']);
        $product_code[0] = rtrim($product_code[0], " ");
        $lims_product_data = Product::where('code', $product_code[0])->first();
        $product_variant_id = null;
        if (!$lims_product_data) {
            $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
                ->select('products.*', 'product_variants.id as product_variant_id', 'product_variants.item_code', 'product_variants.additional_price')
                ->where('product_variants.item_code', $product_code[0])
                ->first();
            $lims_product_data->code = $lims_product_data->item_code;
            $lims_product_data->price += $lims_product_data->additional_price;
            $product_variant_id = $lims_product_data->product_variant_id;
        }
        $product[] = $lims_product_data->name;
        $product[] = $lims_product_data->code;
        if ($lims_product_data->promotion && $todayDate <= $lims_product_data->last_date) {
            $product[] = $lims_product_data->promotion_price;
        } else
            $product[] = $lims_product_data->price;

        if ($lims_product_data->tax_id) {
            $lims_tax_data = Tax::find($lims_product_data->tax_id);
            $product[] = $lims_tax_data->rate;
            $product[] = $lims_tax_data->name;
        } else {
            $product[] = 0;
            $product[] = 'No Tax';
        }
        $product[] = $lims_product_data->tax_method;
        if ($lims_product_data->type == 'standard') {
            $units = Unit::where("base_unit", $lims_product_data->unit_id)
                ->orWhere('id', $lims_product_data->unit_id)
                ->get();
            $unit_name = array();
            $unit_operator = array();
            $unit_operation_value = array();
            foreach ($units as $unit) {
                if ($lims_product_data->sale_unit_id == $unit->id) {
                    array_unshift($unit_name, $unit->unit_name);
                    array_unshift($unit_operator, $unit->operator);
                    array_unshift($unit_operation_value, $unit->operation_value);
                } else {
                    $unit_name[]  = $unit->unit_name;
                    $unit_operator[] = $unit->operator;
                    $unit_operation_value[] = $unit->operation_value;
                }
            }
            $product[] = implode(",", $unit_name) . ',';
            $product[] = implode(",", $unit_operator) . ',';
            $product[] = implode(",", $unit_operation_value) . ',';
        } else {
            $product[] = 'n/a' . ',';
            $product[] = 'n/a' . ',';
            $product[] = 'n/a' . ',';
        }
        $product[] = $lims_product_data->id;
        $product[] = $product_variant_id;
        $product[] = $lims_product_data->promotion;
        $product[] = $lims_product_data->is_imei;
        return $product;
    }

    public function sendMail(Request $request)
    {
        $data = $request->all();
        $lims_return_data = SaleExchange::find($data['return_id']);
        $lims_product_return_data = ProductReturn::where('return_id', $data['return_id'])->get();
        $lims_customer_data = Customer::find($lims_return_data->customer_id);
        $mail_setting = MailSetting::latest()->first();

        if (!$mail_setting) {
            $message = 'Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
        } else if (!$lims_customer_data->email) {
            $message = 'Customer doesnt have email!';
        } else if ($lims_customer_data->email && $mail_setting) {
            //collecting male data
            $mail_data['email'] = $lims_customer_data->email;
            $mail_data['reference_no'] = $lims_return_data->reference_no;
            $mail_data['total_qty'] = $lims_return_data->total_qty;
            $mail_data['total_price'] = $lims_return_data->total_price;
            $mail_data['order_tax'] = $lims_return_data->order_tax;
            $mail_data['order_tax_rate'] = $lims_return_data->order_tax_rate;
            $mail_data['grand_total'] = $lims_return_data->grand_total;

            foreach ($lims_product_return_data as $key => $product_return_data) {
                $lims_product_data = Product::find($product_return_data->product_id);
                if ($product_return_data->variant_id) {
                    $variant_data = Variant::find($product_return_data->variant_id);
                    $mail_data['products'][$key] = $lims_product_data->name . ' [' . $variant_data->name . ']';
                } else
                    $mail_data['products'][$key] = $lims_product_data->name;

                if ($product_return_data->sale_unit_id) {
                    $lims_unit_data = Unit::find($product_return_data->sale_unit_id);
                    $mail_data['unit'][$key] = $lims_unit_data->unit_code;
                } else
                    $mail_data['unit'][$key] = '';

                $mail_data['qty'][$key] = $product_return_data->qty;
                $mail_data['total'][$key] = $product_return_data->qty;
            }
            $this->setMailInfo($mail_setting);
            try {
                Mail::to($mail_data['email'])->send(new ReturnDetails($mail_data));
                $message = 'Mail sent successfully';
            } catch (\Exception $e) {
                $message = 'Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }


        return redirect()->back()->with('message', $message);
    }

   // Add this method to your controller (or update existing product_return method)

public function productExchange($id)
{
    try {
        $exchange = SaleExchange::with(['products.product', 'products.saleUnit'])->findOrFail($id);

        $productsData = [
            'new' => [],
            'returned' => []
        ];

        foreach ($exchange->products as $item) {
            $productInfo = [
                'name' => $item->product->name,
                'code' => $item->product->code,
                'name_code' => $item->product->name . ' [' . $item->product->code . ']',
                'batch_no' => $item->product->batch_no ?? 'N/A',
                'qty' => $item->qty,
                'unit_code' => $item->saleUnit->unit_code ?? '',
                'unit_price' => number_format($item->net_unit_price, config('decimal')),
                'tax' => number_format($item->tax, config('decimal')),
                'tax_rate' => $item->tax_rate,
                'discount' => number_format($item->discount, config('decimal')),
                'subtotal' => number_format($item->total, config('decimal')),
                'type' => $item->type,
            ];

            // Separate by type
            if ($item->type === 'new') {
                $productsData['new'][] = $productInfo;
            } else {
                $productsData['returned'][] = $productInfo;
            }
        }

        // Calculate totals for each type
        $newTotal = $exchange->products->where('type', 'new')->sum('total');
        $returnedTotal = $exchange->products->where('type', 'returned')->sum('total');

        $productsData['totals'] = [
            'new' => number_format($newTotal, config('decimal')),
            'returned' => number_format($returnedTotal, config('decimal')),
            'tax' => number_format($exchange->total_tax, config('decimal')),
            'discount' => number_format($exchange->total_discount, config('decimal')),
            'amount' => number_format($exchange->amount, config('decimal')),
            'order_tax' => number_format($exchange->order_tax, config('decimal')),
            'order_tax_rate' => $exchange->order_tax_rate,
            'grand_total' => number_format($exchange->grand_total, config('decimal')),
        ];

        return response()->json($productsData);

    } catch (\Exception $e) {
        return response()->json(['error' => 'Exchange not found'], 404);
    }
}

    public function edit($id)
    {
        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('returns-edit')) {
            $lims_customer_list = Customer::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_tax_list = Tax::where('is_active', true)->get();
            $lims_return_data = SaleExchange::find($id);
            $lims_product_return_data = ProductReturn::where('return_id', $id)->get();
            return view('backend.return.edit', compact('lims_customer_list', 'lims_warehouse_list', 'lims_biller_list', 'lims_tax_list', 'lims_return_data', 'lims_product_return_data'));
        } else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }


    public function update(Request $request, $id)
    {
        DB::beginTransaction(); // Start transaction
        try {
            $data = $request->except('document', 'total_sale_discount');
            $document = $request->document;
            $lims_return_data = SaleExchange::find($id);
            $data['total_discount'] = $request->input('total_discount') + $lims_return_data->total_discount ?? 0;
            if ($document) {
                $v = Validator::make(
                    [
                        'extension' => strtolower($request->document->getClientOriginalExtension()),
                    ],
                    [
                        'extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
                    ]
                );
                if ($v->fails())
                    return redirect()->back()->withErrors($v->errors());

                $this->fileDelete(public_path('documents/sale_return/'), $lims_return_data->document);

                $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
                $documentName = date("Ymdhis");
                if (!config('database.connections.saleprosaas_landlord')) {
                    $documentName = $documentName . '.' . $ext;
                    $document->move(public_path('documents/sale_return'), $documentName);
                } else {
                    $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                    $document->move(public_path('documents/sale_return'), $documentName);
                }
                $data['document'] = $documentName;
            }

            $lims_product_return_data = ProductReturn::where('return_id', $id)->get();

            $product_id = $data['product_id'];
            $imei_number = $data['imei_number'];
            $product_batch_id = $data['product_batch_id'];
            $product_code = $data['product_code'];
            $product_variant_id = $data['product_variant_id'];
            $qty = $data['qty'];
            $sale_unit = $data['sale_unit'];
            $net_unit_price = $data['net_unit_price'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];

            foreach ($lims_product_return_data as $key => $product_return_data) {
                $old_product_id[] = $product_return_data->product_id;
                $old_product_variant_id[] = null;
                $lims_product_data = Product::find($product_return_data->product_id);
                if ($lims_product_data->type == 'combo') {
                    $product_list = explode(",", $lims_product_data->product_list);
                    $variant_list = explode(",", $lims_product_data->variant_list);
                    $qty_list = explode(",", $lims_product_data->qty_list);

                    foreach ($product_list as $index => $child_id) {
                        $child_data = Product::find($child_id);
                        if ($variant_list[$index]) {
                            $child_product_variant_data = ProductVariant::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$index]]
                            ])->first();

                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$index]],
                                ['warehouse_id', $lims_return_data->warehouse_id],
                            ])->first();

                            $child_product_variant_data->qty -= $qty[$key] * $qty_list[$index];
                            $child_product_variant_data->save();
                        } else {
                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['warehouse_id', $lims_return_data->warehouse_id],
                            ])->first();
                        }

                        $child_data->qty -= $product_return_data->qty * $qty_list[$index];
                        $child_warehouse_data->qty -= $product_return_data->qty * $qty_list[$index];

                        $child_data->save();
                        $child_warehouse_data->save();
                    }
                } elseif ($product_return_data->sale_unit_id != 0) {
                    $lims_sale_unit_data = Unit::find($product_return_data->sale_unit_id);
                    if ($lims_sale_unit_data->operator == '*')
                        $quantity = $product_return_data->qty * $lims_sale_unit_data->operation_value;
                    elseif ($lims_sale_unit_data->operator == '/')
                        $quantity = $product_return_data->qty / $lims_sale_unit_data->operation_value;

                    if ($product_return_data->variant_id) {
                        $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_return_data->product_id, $product_return_data->variant_id)->first();
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($product_return_data->product_id, $product_return_data->variant_id, $lims_return_data->warehouse_id)
                            ->first();
                        $old_product_variant_id[$key] = $lims_product_variant_data->id;
                        $lims_product_variant_data->qty -= $quantity;
                        $lims_product_variant_data->save();
                    } elseif ($product_return_data->product_batch_id) {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $product_return_data->product_id],
                            ['product_batch_id', $product_return_data->product_batch_id],
                            ['warehouse_id', $lims_return_data->warehouse_id]
                        ])->first();

                        $product_batch_data = ProductBatch::find($product_return_data->product_batch_id);
                        $product_batch_data->qty -= $quantity;
                        $product_batch_data->save();
                    } else
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($product_return_data->product_id, $lims_return_data->warehouse_id)
                            ->first();

                    $lims_product_data->qty -= $quantity;
                    $lims_product_warehouse_data->qty -= $quantity;
                    $lims_product_data->save();
                    $lims_product_warehouse_data->save();
                }
                //deduct imei number if available
                if ($product_return_data->imei_number && !str_contains($product_return_data->imei_number, "null")) {
                    $imei_numbers = explode(",", $product_return_data->imei_number);
                    $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                    foreach ($imei_numbers as $number) {
                        if (($j = array_search($number, $all_imei_numbers)) !== false) {
                            unset($all_imei_numbers[$j]);
                        }
                    }
                    $lims_product_warehouse_data->imei_number = implode(",", $all_imei_numbers);
                    $lims_product_warehouse_data->save();
                }
                if ($product_return_data->variant_id && !(in_array($old_product_variant_id[$key], $product_variant_id))) {
                    $product_return_data->delete();
                } elseif (!(in_array($old_product_id[$key], $product_id)))
                    $product_return_data->delete();
            }
            foreach ($product_id as $key => $pro_id) {
                $lims_product_data = Product::find($pro_id);
                $product_return['variant_id'] = null;
                if ($sale_unit[$key] != 'n/a' && $sale_unit[$key] != null) {
                    $lims_sale_unit_data = Unit::where('unit_name', $sale_unit[$key])->first();
                    $sale_unit_id = $lims_sale_unit_data->id;
                    if ($lims_sale_unit_data->operator == '*')
                        $quantity = $qty[$key] * $lims_sale_unit_data->operation_value;
                    elseif ($lims_sale_unit_data->operator == '/')
                        $quantity = $qty[$key] / $lims_sale_unit_data->operation_value;

                    if ($lims_product_data->is_variant) {
                        $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($pro_id, $lims_product_variant_data->variant_id, $data['warehouse_id'])
                            ->first();
                        $variant_data = Variant::find($lims_product_variant_data->variant_id);

                        $product_return['variant_id'] = $lims_product_variant_data->variant_id;
                        $lims_product_variant_data->qty += $quantity;
                        $lims_product_variant_data->save();
                    } elseif ($product_batch_id[$key]) {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['product_batch_id', $product_batch_id[$key]],
                            ['warehouse_id', $data['warehouse_id']]
                        ])->first();


                        $product_batch_data = ProductBatch::find($product_batch_id[$key]);
                        $product_batch_data->qty += $quantity;
                        $product_batch_data->save();
                    } else {
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($pro_id, $data['warehouse_id'])
                            ->first();
                    }

                    $lims_product_data->qty +=  $quantity;
                    $lims_product_warehouse_data->qty += $quantity;

                    $lims_product_data->save();
                    $lims_product_warehouse_data->save();
                } else {
                    if ($lims_product_data->type == 'combo') {
                        $product_list = explode(",", $lims_product_data->product_list);
                        $variant_list = explode(",", $lims_product_data->variant_list);
                        $qty_list = explode(",", $lims_product_data->qty_list);

                        foreach ($product_list as $index => $child_id) {
                            $child_data = Product::find($child_id);
                            if ($variant_list[$index]) {
                                $child_product_variant_data = ProductVariant::where([
                                    ['product_id', $child_id],
                                    ['variant_id', $variant_list[$index]]
                                ])->first();

                                $child_warehouse_data = Product_Warehouse::where([
                                    ['product_id', $child_id],
                                    ['variant_id', $variant_list[$index]],
                                    ['warehouse_id', $data['warehouse_id']],
                                ])->first();

                                $child_product_variant_data->qty += $qty[$key] * $qty_list[$index];
                                $child_product_variant_data->save();
                            } else {
                                $child_warehouse_data = Product_Warehouse::where([
                                    ['product_id', $child_id],
                                    ['warehouse_id', $data['warehouse_id']],
                                ])->first();
                            }

                            $child_data->qty += $qty[$key] * $qty_list[$index];
                            $child_warehouse_data->qty += $qty[$key] * $qty_list[$index];

                            $child_data->save();
                            $child_warehouse_data->save();
                        }
                    }
                    $sale_unit_id = 0;
                }
                //add imei number if available
                if ($imei_number[$key] && !str_contains($imei_number[$key], "null")) {
                    if ($lims_product_warehouse_data->imei_number)
                        $lims_product_warehouse_data->imei_number .= ',' . $imei_number[$key];
                    else
                        $lims_product_warehouse_data->imei_number = $imei_number[$key];
                    $lims_product_warehouse_data->save();
                }

                if ($lims_product_data->is_variant)
                    $mail_data['products'][$key] = $lims_product_data->name . ' [' . $variant_data->name . ']';
                else
                    $mail_data['products'][$key] = $lims_product_data->name;

                if ($sale_unit_id)
                    $mail_data['unit'][$key] = $lims_sale_unit_data->unit_code;
                else
                    $mail_data['unit'][$key] = '';

                $mail_data['qty'][$key] = $qty[$key];
                $mail_data['total'][$key] = $total[$key];

                $product_return['return_id'] = $id;
                $product_return['product_id'] = $pro_id;
                $product_return['imei_number'] = $imei_number[$key];
                $product_return['product_batch_id'] = $product_batch_id[$key];
                $product_return['qty'] = $qty[$key];
                $product_return['sale_unit_id'] = $sale_unit_id;
                $product_return['net_unit_price'] = $net_unit_price[$key];
                $product_return['discount'] = $discount[$key];
                $product_return['tax_rate'] = $tax_rate[$key];
                $product_return['tax'] = $tax[$key];
                $product_return['total'] = $total[$key];

                if ($product_return['variant_id'] && in_array($product_variant_id[$key], $old_product_variant_id)) {
                    ProductReturn::where([
                        ['product_id', $pro_id],
                        ['variant_id', $product_return['variant_id']],
                        ['return_id', $id]
                    ])->update($product_return);
                } elseif ($product_return['variant_id'] === null && (in_array($pro_id, $old_product_id))) {
                    ProductReturn::where([
                        ['return_id', $id],
                        ['product_id', $pro_id]
                    ])->update($product_return);
                } else
                    ProductReturn::create($product_return);
            }
            $lims_return_data->update($data);
            $lims_customer_data = Customer::find($data['customer_id']);
            $mail_setting = MailSetting::latest()->first();


            if (!$lims_customer_data->email && !$mail_setting) {
                $message = 'Return updated successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            } else {
                //collecting mail data
                $mail_data['email'] = $lims_customer_data->email;
                $mail_data['reference_no'] = $lims_return_data->reference_no;
                $mail_data['total_qty'] = $lims_return_data->total_qty;
                $mail_data['total_price'] = $lims_return_data->total_price;
                $mail_data['order_tax'] = $lims_return_data->order_tax;
                $mail_data['order_tax_rate'] = $lims_return_data->order_tax_rate;
                $mail_data['grand_total'] = $lims_return_data->grand_total;
                $message = 'Return updated successfully';
                try {
                    $this->setMailInfo($mail_setting);
                    Mail::to($mail_data['email'])->send(new ReturnDetails($mail_data));
                } catch (\Exception $e) {
                    $message = $e->getMessage();
                }
            }

            DB::commit(); // Commit transaction
            return redirect('return-sale')->with('message', $message);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback on error
            return redirect()->back()->with('error', 'Something went wrong: ' . $e->getMessage());
        }
    }

    public function deleteBySelection(Request $request)
    {
        $return_id = $request['returnIdArray'];
        foreach ($return_id as $id) {
            $lims_return_data = SaleExchange::find($id);
            $lims_product_return_data = ProductReturn::where('return_id', $id)->get();

            foreach ($lims_product_return_data as $key => $product_return_data) {
                $lims_product_data = Product::find($product_return_data->product_id);
                if ($lims_product_data->type == 'combo') {
                    $product_list = explode(",", $lims_product_data->product_list);
                    $variant_list = explode(",", $lims_product_data->variant_list);
                    $qty_list = explode(",", $lims_product_data->qty_list);

                    foreach ($product_list as $index => $child_id) {
                        $child_data = Product::find($child_id);
                        if ($variant_list[$index]) {
                            $child_product_variant_data = ProductVariant::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$index]]
                            ])->first();

                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$index]],
                                ['warehouse_id', $lims_return_data->warehouse_id],
                            ])->first();

                            $child_product_variant_data->qty -= $product_return_data->qty * $qty_list[$index];
                            $child_product_variant_data->save();
                        } else {
                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['warehouse_id', $lims_return_data->warehouse_id],
                            ])->first();
                        }

                        $child_data->qty -= $product_return_data->qty * $qty_list[$index];
                        $child_warehouse_data->qty -= $product_return_data->qty * $qty_list[$index];

                        $child_data->save();
                        $child_warehouse_data->save();
                    }
                } elseif ($product_return_data->sale_unit_id != 0) {
                    $lims_sale_unit_data = Unit::find($product_return_data->sale_unit_id);

                    if ($lims_sale_unit_data->operator == '*')
                        $quantity = $product_return_data->qty * $lims_sale_unit_data->operation_value;
                    elseif ($lims_sale_unit_data->operator == '/')
                        $quantity = $product_return_data->qty / $lims_sale_unit_data->operation_value;
                    if ($product_return_data->variant_id) {
                        $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_return_data->product_id, $product_return_data->variant_id)->first();
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($product_return_data->product_id, $product_return_data->variant_id, $lims_return_data->warehouse_id)->first();
                        $lims_product_variant_data->qty -= $quantity;
                        $lims_product_variant_data->save();
                    } elseif ($product_return_data->product_batch_id) {
                        $lims_product_batch_data = ProductBatch::find($product_return_data->product_batch_id);
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_batch_id', $product_return_data->product_batch_id],
                            ['warehouse_id', $lims_return_data->warehouse_id]
                        ])->first();

                        $lims_product_batch_data->qty -= $product_return_data->qty;
                        $lims_product_batch_data->save();
                    } else
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($product_return_data->product_id, $lims_return_data->warehouse_id)->first();

                    $lims_product_data->qty -= $quantity;
                    $lims_product_warehouse_data->qty -= $quantity;
                    $lims_product_data->save();
                    $lims_product_warehouse_data->save();
                    if ($lims_return_data->sale_id) {
                        $product_sale_data = Product_Sale::where([
                            ['sale_id', $lims_return_data->sale_id],
                            ['product_id', $product_return_data->product_id]
                        ])->select('id', 'return_qty')->first();
                        $product_sale_data->return_qty -= $product_return_data->qty;
                        $product_sale_data->save();
                    }
                    $product_return_data->delete();
                }
            }
            $lims_return_data->delete();
            $this->fileDelete(public_path('documents/sale_return/'), $lims_return_data->document);
        }
        return 'Return deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_return_data = SaleExchange::find($id);
        $lims_product_return_data = ProductReturn::where('return_id', $id)->get();

        foreach ($lims_product_return_data as $key => $product_return_data) {
            $lims_product_data = Product::find($product_return_data->product_id);
            if ($lims_product_data->type == 'combo') {
                $product_list = explode(",", $lims_product_data->product_list);
                $variant_list = explode(",", $lims_product_data->variant_list);
                $qty_list = explode(",", $lims_product_data->qty_list);

                foreach ($product_list as $index => $child_id) {
                    $child_data = Product::find($child_id);
                    if ($variant_list[$index]) {
                        $child_product_variant_data = ProductVariant::where([
                            ['product_id', $child_id],
                            ['variant_id', $variant_list[$index]]
                        ])->first();

                        $child_warehouse_data = Product_Warehouse::where([
                            ['product_id', $child_id],
                            ['variant_id', $variant_list[$index]],
                            ['warehouse_id', $lims_return_data->warehouse_id],
                        ])->first();

                        $child_product_variant_data->qty -= $product_return_data->qty * $qty_list[$index];
                        $child_product_variant_data->save();
                    } else {
                        $child_warehouse_data = Product_Warehouse::where([
                            ['product_id', $child_id],
                            ['warehouse_id', $lims_return_data->warehouse_id],
                        ])->first();
                    }

                    $child_data->qty -= $product_return_data->qty * $qty_list[$index];
                    $child_warehouse_data->qty -= $product_return_data->qty * $qty_list[$index];

                    $child_data->save();
                    $child_warehouse_data->save();
                }
            } elseif ($product_return_data->sale_unit_id != 0) {
                $lims_sale_unit_data = Unit::find($product_return_data->sale_unit_id);

                if ($lims_sale_unit_data->operator == '*')
                    $quantity = $product_return_data->qty * $lims_sale_unit_data->operation_value;
                elseif ($lims_sale_unit_data->operator == '/')
                    $quantity = $product_return_data->qty / $lims_sale_unit_data->operation_value;

                if ($product_return_data->variant_id) {
                    $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_return_data->product_id, $product_return_data->variant_id)->first();
                    $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($product_return_data->product_id, $product_return_data->variant_id, $lims_return_data->warehouse_id)->first();
                    $lims_product_variant_data->qty -= $quantity;
                    $lims_product_variant_data->save();
                } elseif ($product_return_data->product_batch_id) {
                    $lims_product_batch_data = ProductBatch::find($product_return_data->product_batch_id);
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_batch_id', $product_return_data->product_batch_id],
                        ['warehouse_id', $lims_return_data->warehouse_id]
                    ])->first();

                    $lims_product_batch_data->qty -= $product_return_data->qty;
                    $lims_product_batch_data->save();
                } else
                    $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($product_return_data->product_id, $lims_return_data->warehouse_id)->first();

                $lims_product_data->qty -= $quantity;
                $lims_product_warehouse_data->qty -= $quantity;
                $lims_product_data->save();
                $lims_product_warehouse_data->save();
            }
            //deduct imei number if available
            if ($product_return_data->imei_number && !str_contains($product_return_data->imei_number, "null")) {
                $imei_numbers = explode(",", $product_return_data->imei_number);
                $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                foreach ($imei_numbers as $number) {
                    if (($j = array_search($number, $all_imei_numbers)) !== false) {
                        unset($all_imei_numbers[$j]);
                    }
                }
                $lims_product_warehouse_data->imei_number = implode(",", $all_imei_numbers);
                $lims_product_warehouse_data->save();
            }
            if ($lims_return_data->sale_id) {
                $product_sale_data = Product_Sale::where([
                    ['sale_id', $lims_return_data->sale_id],
                    ['product_id', $product_return_data->product_id]
                ])->select('id', 'return_qty')->first();
                $product_sale_data->return_qty -= $product_return_data->qty;
                $product_sale_data->save();

                $lims_payment_data = Payment::where('sale_id', $lims_return_data->sale_id)
                    ->latest()
                    ->first();
                $lims_customer_data = Customer::find($lims_return_data->customer_id);

                if ($lims_payment_data && $lims_payment_data->paying_method === 'Deposit') {
                    $lims_customer_data->expense = (float) $lims_customer_data->expense + (float) $lims_payment_data->amount;
                    $lims_customer_data->save();
                }
            }
            $product_return_data->delete();
        }
        if ($lims_return_data->sale_id) {
            Sale::find($lims_return_data->sale_id)->update(['sale_status' => 1]);
        }
        $lims_return_data->delete();
        $this->fileDelete(public_path('documents/sale_return/'), $lims_return_data->document);

        return redirect('return-sale')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
