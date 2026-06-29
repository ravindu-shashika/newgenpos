<?php

namespace App\Http\Controllers;

use Stripe\Stripe;
use App\Models\Tax;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Currency;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\PosSetting;
use App\Traits\TenantInfo;
use App\Models\CustomField;
use App\Traits\SpaResponse;
use App\Traits\StaffAccess;
use App\Models\Product_Sale;
use App\Models\ProductBatch;
use Illuminate\Http\Request;
use App\Models\GeneralSetting;
use App\Models\ProductVariant;
use App\Models\ProductPurchase;
use App\Services\PaymentService;
use App\Models\PaymentWithCheque;
use App\Models\Product_Warehouse;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;
use App\Models\PaymentWithCreditCard;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\PurchaseRequest;
use App\Http\Requests\Purchase\UpdatePurchaseRequest;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

class PurchaseController extends Controller
{
    use TenantInfo, StaffAccess, SpaResponse;

    public function index(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            if (!$this->userCanAccessPurchases('purchases-index')) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            try {
                $startingDate = $request->input('starting_date') ?: date('Y-m-d', strtotime('-1 year'));
                $endingDate = $request->input('ending_date') ?: date('Y-m-d');
                $warehouseId = (int) $request->input('warehouse_id', 0);
                $purchaseStatus = (int) $request->input('purchase_status', 0);
                $paymentStatus = (int) $request->input('payment_status', 0);
                $search = trim((string) $request->input('search', ''));
                $q = $this->purchaseQuery();
                if (Schema::hasColumn('purchases', 'purchase_type')) {
                    $q->where(fn ($query) => $query->whereNotIn('purchase_type', ['opening balance', 'initial stock'])->orWhereNull('purchase_type'));
                }
                $q->where('created_at', '>=', $startingDate . ' 00:00:00')->where('created_at', '<=', $endingDate . ' 23:59:59');
                $this->applyStaffAccessFilter($q);
                if ($warehouseId) { $q->where('warehouse_id', $warehouseId); }
                if ($purchaseStatus) { $q->where('status', $purchaseStatus); }
                if ($paymentStatus) { $q->where('payment_status', $paymentStatus); }
                if ($search !== '') {
                    $q->where(fn ($query) => $query->where('reference_no', 'LIKE', "%{$search}%")->orWhereHas('supplier', fn ($s) => $s->where('name', 'LIKE', "%{$search}%")));
                }
                $purchases = $q->orderBy('created_at', 'desc')->get();
                $warehouseQuery = Warehouse::query();
                if (Schema::hasColumn('warehouses', 'is_active')) { $warehouseQuery->where('is_active', true); }
                $payload = [
                    'data' => $purchases->map(fn ($p) => $this->formatPurchaseRow($p)),
                    'filters' => compact('startingDate', 'endingDate', 'warehouseId', 'purchaseStatus', 'paymentStatus'),
                    'warehouses' => $warehouseQuery->get(['id', 'name'])->map(fn ($w) => ['id' => $w->id, 'name' => $w->name]),
                ];
                if (
                    $this->userCanAccessPurchases('purchase-payment-add')
                    || $this->userCanAccessPurchases('purchase-payment-edit')
                ) {
                    $accountQuery = Account::query();
                    if (Schema::hasColumn('accounts', 'is_active')) {
                        $accountQuery->where('is_active', true);
                    }
                    $accountColumns = ['id', 'name'];
                    if (Schema::hasColumn('accounts', 'is_default')) {
                        $accountColumns[] = 'is_default';
                    }
                    $payload['accounts'] = $accountQuery->get($accountColumns);
                }
                return $this->spaJson($request, $payload);
            } catch (\Throwable $e) {
                report($e);
                return $this->spaJson($request, ['message' => __('db.Failed to load purchases'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
            }
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-index')) {
            if($request->input('warehouse_id'))
                $warehouse_id = $request->input('warehouse_id');
            else
                $warehouse_id = 0;

            if($request->input('purchase_status'))
                $purchase_status = $request->input('purchase_status');
            else
                $purchase_status = 0;

            if($request->input('payment_status'))
                $payment_status = $request->input('payment_status');
            else
                $payment_status = 0;

            if($request->input('starting_date')) {
                $starting_date = $request->input('starting_date');
                $ending_date = $request->input('ending_date');
            }
            else {
                $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
                $ending_date = date("Y-m-d");
            }
            $permissions = Role::findByName($role->name)->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';
            $lims_pos_setting_data = PosSetting::select('stripe_public_key')->latest()->first();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_account_list = Account::where('is_active', true)->get();
            $custom_fields = CustomField::where([
                                ['belongs_to', 'purchase'],
                                ['is_table', true]
                            ])->pluck('name');
            $field_name = [];
            foreach($custom_fields as $fieldName) {
                $field_name[] = str_replace(" ", "_", strtolower($fieldName));
            }
            if(cache()->has('currency_list'))
            {
                $currency_list = cache()->get('currency_list');
            }else {
                $currency_list = Currency::where('is_active', true)->get();
                cache()->put('currency_list', $currency_list, 60 * 60 * 24);
            }
            return view('backend.purchase.index', compact( 'lims_account_list', 'lims_warehouse_list', 'all_permission', 'lims_pos_setting_data', 'warehouse_id', 'starting_date', 'ending_date', 'purchase_status', 'payment_status', 'custom_fields', 'field_name', 'currency_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    private function isImeiExist(string $imei, string $product_id): bool
    {
        $product_warehouses = Product_Warehouse::where('product_id', $product_id)->get();

        foreach ($product_warehouses as $p) {
            $imeis = explode(',', $p->imei_number);
            if (in_array(trim($imei), array_map('trim', $imeis))) {
                return true;
            }
        }

        return false;
    }

    public function create(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            if (!$this->userCanAccessPurchases('purchases-add')) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            try {
                return $this->spaJson($request, $this->purchaseFormMeta());
            } catch (\Throwable $e) {
                report($e);
                return $this->spaJson($request, ['message' => __('db.Failed to load purchase form'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
            }
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-add')){
            $lims_supplier_list = Supplier::where('is_active', true)->get();
            if(Auth::user()->role_id > 2) {
                $lims_warehouse_list = Warehouse::where([
                    ['is_active', true],
                    ['id', Auth::user()->warehouse_id]
                ])->get();
            }
            else {
                $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            }
            $lims_tax_list = Tax::where('is_active', true)->get();
            $lims_product_list_without_variant = $this->productWithoutVariant();
            $lims_product_list_with_variant = $this->productWithVariant();
            if(cache()->has('currency_list'))
            {
                $currency_list = cache()->get('currency_list');
            }else {
                $currency_list = Currency::where('is_active', true)->get();
                cache()->put('currency_list', $currency_list, 60 * 60 * 24);
            }
            $custom_fields = CustomField::where('belongs_to', 'purchase')->get();
            $lims_account_list = Account::select('id', 'name', 'account_no','total_balance', 'is_default')->where('is_active', true)->get();
            return view('backend.purchase.create', compact('lims_supplier_list', 'lims_warehouse_list', 'lims_tax_list', 'lims_product_list_without_variant', 'lims_product_list_with_variant', 'currency_list', 'custom_fields', 'lims_account_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function store(PurchaseRequest $request)
    {
        if(isset($request->reference_no)) {
            $this->validate($request, [
                'reference_no' => [
                    'max:191', 'required', 'unique:purchases'
                ],
            ]);
        }

        DB::beginTransaction();

        try {
            $data = $request->except('document');
            
            $data['user_id'] = Auth::id();

            if(!isset($data['reference_no']))
            {
                $data['reference_no'] = 'pr-' . date("Ymd") . '-'. date("his");
            }

            $document = $request->document;

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

                $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
                $documentName = date("Ymdhis");
                if(!config('database.connections.saleprosaas_landlord')) {
                    $documentName = $documentName . '.' . $ext;
                    $document->move(public_path('documents/purchase'), $documentName);
                }
                else {
                    $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                    $document->move(public_path('documents/purchase'), $documentName);
                }
                $data['document'] = $documentName;
            }

            if (isset($data['created_at'])) {
                $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
            } else {
                $data['created_at'] = date('Y-m-d H:i:s');
            }

            // Due date calculate from payment terms
            if (!empty($data['pay_term_no']) && !empty($data['pay_term_period'])) {
                $purchaseDate = isset($data['created_at'])
                    ? \Carbon\Carbon::parse($data['created_at'])
                    : \Carbon\Carbon::now();

                if ($data['pay_term_period'] === 'days') {
                    $data['due_date'] = $purchaseDate->addDays((int)$data['pay_term_no'])->format('Y-m-d');
                } else {
                    $data['due_date'] = $purchaseDate->addMonths((int)$data['pay_term_no'])->format('Y-m-d');
                }
            } elseif (empty($data['due_date'])) {
                $data['due_date'] = null;
            }

            $data['paid_amount'] = 0;

            if (!isset($data['payment_status'])) {
                $data['payment_status'] = 1;
            }
            $this->normalizePurchaseHeaderTotals($data);

            $lims_purchase_data = Purchase::create($data);
            // return $lims_purchase_data;
            //inserting data for custom fields
            $custom_field_data = [];
            $custom_fields = CustomField::where('belongs_to', 'purchase')->select('name', 'type')->get();
            foreach ($custom_fields as $type => $custom_field) {
                $field_name = str_replace(' ', '_', strtolower($custom_field->name));
                if(isset($data[$field_name])) {
                    if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                        $custom_field_data[$field_name] = implode(",", $data[$field_name]);
                    else
                        $custom_field_data[$field_name] = $data[$field_name];
                }
            }
            if(count($custom_field_data))
                DB::table('purchases')->where('id', $lims_purchase_data->id)->update($custom_field_data);
            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            $recieved = $data['recieved'];
            $batch_no = $data['batch_no'] ?? null;
            $expired_date = $data['expired_date'] ?? null;
            $purchase_unit = $data['purchase_unit'];
            $unit_cost = $data['unit_cost'];
            $net_unit_cost = $data['net_unit_cost'];
            $net_unit_margin = $data['net_unit_margin'];
            $net_unit_margin_type = $data['net_unit_margin_type'];
            $net_unit_price = $data['net_unit_price'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];
            $imei_numbers = $data['imei_number'];
            $product_purchase = [];
            $log_data['item_description'] = '';

            foreach ($product_id as $i => $id) {
                $lims_purchase_unit_data = $this->resolvePurchaseUnit(
                    $purchase_unit[$i] ?? null,
                    (int) $id,
                    isset($data['purchase_unit_id'][$i]) ? (int) $data['purchase_unit_id'][$i] : null
                );

                if ($lims_purchase_unit_data->operator == '*') {
                    $quantity = $recieved[$i] * $lims_purchase_unit_data->operation_value;
                } else {
                    $quantity = $recieved[$i] / $lims_purchase_unit_data->operation_value;
                }
                $lims_product_data = Product::find($id);
                $price = $lims_product_data->price;
                //dealing with product batch
                if ($lims_product_data->is_batch) {
                    $resolvedBatch = $this->resolvePurchaseBatchForLine(
                        (int) $id,
                        (float) $net_unit_cost[$i],
                        (float) $net_unit_price[$i]
                    );
                    $batch_no[$i] = $resolvedBatch['batch_no'];
                }
                if (!empty($batch_no[$i])) {
                    $lineExpiredDate = !empty($expired_date[$i]) ? $expired_date[$i] : null;
                    $product_batch_data = ProductBatch::where([
                                            ['product_id', $lims_product_data->id],
                                            ['batch_no', $batch_no[$i]]
                                        ])->first();
                    if($product_batch_data) {
                        $product_batch_data->expired_date = $lineExpiredDate;
                        $product_batch_data->qty += $quantity;
                        $product_batch_data->save();
                    }
                    else {
                        $product_batch_data = ProductBatch::create([
                                                'product_id' => $lims_product_data->id,
                                                'batch_no' => $batch_no[$i],
                                                'expired_date' => $lineExpiredDate,
                                                'qty' => $quantity
                                            ]);
                    }
                    $product_purchase['product_batch_id'] = $product_batch_data->id;
                }
                else
                    $product_purchase['product_batch_id'] = null;

                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($lims_product_data->id, $product_code[$i])->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $id],
                        ['variant_id', $lims_product_variant_data->variant_id],
                        ['warehouse_id', $data['warehouse_id']]
                    ])->first();
                    $product_purchase['variant_id'] = $lims_product_variant_data->variant_id;
                    //add quantity to product variant table
                    $lims_product_variant_data->qty += $quantity;
                    $lims_product_variant_data->save();
                }
                else {
                    $product_purchase['variant_id'] = null;
                    if($product_purchase['product_batch_id']) {
                        //checking for price
                        $lims_product_warehouse_data = Product_Warehouse::where([
                                                        ['product_id', $id],
                                                        ['warehouse_id', $data['warehouse_id'] ],
                                                    ])
                                                    ->whereNotNull('price')
                                                    ->select('price')
                                                    ->first();
                        if($lims_product_warehouse_data)
                            $price = $lims_product_warehouse_data->price;
                        else
                            $price = null;
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $id],
                            ['product_batch_id', $product_purchase['product_batch_id'] ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $id],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                }
                //add quantity to product table
                $lims_product_data->qty = $lims_product_data->qty + $quantity;
                // update cost, profit margin, and price

                $lims_product_data->cost = $unit_cost[$i];
                $lims_product_data->profit_margin = $net_unit_margin[$i];
                $lims_product_data->profit_margin_type = $net_unit_margin_type[$i];

                $lims_product_data->price = $net_unit_price[$i];

                $lims_product_data->save();
                //add quantity to warehouse
                if ($lims_product_warehouse_data) {
                    $lims_product_warehouse_data->qty = $lims_product_warehouse_data->qty + $quantity;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                }
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $id;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                    $lims_product_warehouse_data->warehouse_id = $data['warehouse_id'];
                    $lims_product_warehouse_data->qty = $quantity;
                    if($price)
                        $lims_product_warehouse_data->price = $price;
                    if($lims_product_data->is_variant)
                        $lims_product_warehouse_data->variant_id = $lims_product_variant_data->variant_id;
                }

                if($imei_numbers[$i]) {
                    // prevent duplication
                    $imeis = explode(',', $imei_numbers[$i]);
                    $imeis = array_map('trim', $imeis);
                    if (count($imeis) !== count(array_unique($imeis))) {
                        DB::rollBack();
                        return redirect('purchases/create')->with('not_permitted', __('db.Duplicate IMEI not allowed!'));
                    }
                    foreach ($imeis as $imei) {
                        if ($this->isImeiExist($imei, $id)) {
                            DB::rollBack();
                            return redirect('purchases/create')->with('not_permitted', __('db.Duplicate IMEI not allowed!'));
                        }
                    }
                    //added imei numbers to product_warehouse table
                    if($lims_product_warehouse_data->imei_number)
                        $lims_product_warehouse_data->imei_number .= ',' . $imei_numbers[$i];
                    else
                        $lims_product_warehouse_data->imei_number = $imei_numbers[$i];
                }
                $lims_product_warehouse_data->save();

                $log_data['item_description'] .= $lims_product_data->name. '-'. $qty[$i].' '.$lims_purchase_unit_data->unit_code.'<br>';

                $product_purchase['purchase_id'] = $lims_purchase_data->id;
                $product_purchase['product_id'] = $id;
                $product_purchase['imei_number'] = $imei_numbers[$i];
                $product_purchase['qty'] = $qty[$i];
                $product_purchase['recieved'] = $recieved[$i];
                $product_purchase['purchase_unit_id'] = $lims_purchase_unit_data->id;
                $product_purchase['net_unit_cost'] = $net_unit_cost[$i];
                $product_purchase['net_unit_margin'] = $net_unit_margin[$i];
                $product_purchase['net_unit_margin_type'] = $net_unit_margin_type[$i];
                $product_purchase['net_unit_price'] = $net_unit_price[$i];
                $product_purchase['discount'] = $discount[$i];
                $product_purchase['tax_rate'] = $tax_rate[$i];
                $product_purchase['tax'] = $tax[$i];
                $product_purchase['total'] = $total[$i];
                ProductPurchase::create($product_purchase);
            }

            if ($data['payment_status'] == 3 || $data['payment_status'] == 4) {
                if (isset($data['payment_at'])) {
                    $data['payment_at'] = normalize_to_sql_datetime($data['payment_at']);
                } else {
                    $data['payment_at'] = date('Y-m-d H:i:s');
                }
                $pay_data = [
                    'paying_amount' => array_sum($data['paying_amount']),
                    'amount' => $data['payment_status'] == 1 ? 0 : array_sum($data['amount']),
                    'paid_by_id' => $data['paid_by_id'][0],
                    'cheque_no' => $data['cheque_no'],
                    'account_id' => $data['account_id'],
                    'payment_note' => $data['payment_note'],
                    'purchase_id' => $lims_purchase_data->id,

                    'currency_id' => $lims_purchase_data->currency_id,
                    'exchange_rate' => $lims_purchase_data->exchange_rate ?? 1,

                    'payment_at' => $data['payment_at']
                ];



                $response = (new PaymentService())->payForPurchase($pay_data);

                if (!$response['status']) {
                    DB::rollback();
                    throw new \Exception($response['message']);
                }
            }

            //creating log
            $log_data['action'] = 'Purchase Created';
            $log_data['user_id'] = Auth::id();
            $log_data['reference_no'] = $lims_purchase_data->reference_no;
            $log_data['date'] = $lims_purchase_data->created_at->toDateString();
            // $log_data['admin_email'] = config('admin_email');
            $log_data['admin_message'] = Auth::user()->name . ' has created a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            $log_data['user_email'] = Auth::user()->email;
            $log_data['user_name'] = Auth::user()->name;
            $log_data['user_message'] = 'You just created a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            // $log_data['mail_setting'] = MailSetting::latest()->first();
            $this->createActivityLog($log_data);

            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['success' => true, 'message' => __('db.Purchase created successfully')], 201);
            }
            return redirect('purchases')->with('message', __('db.Purchase created successfully'));
        } catch (\Exception $e) {
            DB::rollBack();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['success' => false, 'message' => 'Transaction failed: ' . $e->getMessage()], 400);
            }
            return redirect('purchases/create')->with('not_permitted', 'Transaction failed: ' . $e->getMessage());
        }
    }

    public function purchaseByCsv(Request $request)
    {
        if (!$this->userCanImportPurchases()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $warehouseQuery = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $warehouseQuery->where('is_active', true);
        }
        $supplierQuery = Supplier::query();
        if (Schema::hasColumn('suppliers', 'is_active')) {
            $supplierQuery->where('is_active', true);
        }
        $taxQuery = Tax::query();
        if (Schema::hasColumn('taxes', 'is_active')) {
            $taxQuery->where('is_active', true);
        }

        $lims_warehouse_list = $warehouseQuery->orderBy('name')->get(['id', 'name']);
        $lims_supplier_list = $supplierQuery->orderBy('name')->get(['id', 'name', 'company_name']);
        $lims_tax_list = $taxQuery->orderBy('name')->get(['id', 'name', 'rate']);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'warehouses' => $lims_warehouse_list->map(fn ($w) => ['id' => $w->id, 'name' => $w->name])->values(),
                'suppliers' => $lims_supplier_list->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'company_name' => $s->company_name,
                    'label' => trim($s->name . ($s->company_name ? ' (' . $s->company_name . ')' : '')),
                ])->values(),
                'taxes' => $lims_tax_list->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'rate' => (float) $t->rate,
                ])->values(),
                'status_options' => [
                    ['value' => '1', 'label' => __('db.Recieved')],
                    ['value' => '3', 'label' => __('db.Pending')],
                    ['value' => '4', 'label' => __('db.Ordered')],
                ],
                'sample_file_url' => '/sample_file/sample_purchase_products.csv',
            ]);
        }

        return view('backend.purchase.import', compact('lims_supplier_list', 'lims_warehouse_list', 'lims_tax_list'));
    }

    public function importPurchase(Request $request)
    {
        DB::beginTransaction();

        try {

            if (!$request->hasFile('file')) {
                throw new \Exception('No file uploaded.');
            }

            $upload = $request->file('file');
            $ext = strtolower($upload->getClientOriginalExtension());

            if ($ext !== 'csv') {
                throw new \Exception('Please upload a valid CSV file.');
            }

            $filePath = $upload->getRealPath();
            $handle = fopen($filePath, 'r');

            $rows = [];
            $rowNumber = 0;

            while (($row = fgetcsv($handle, 1000, ",")) !== false) {

                // Skip header
                if ($rowNumber == 0) {
                    $rowNumber++;
                    continue;
                }

                if (count($row) < 8) {
                    throw new \Exception("Invalid column count in row {$rowNumber}");
                }

                // Columns:
                // 0=code,1=qty,2=unit,3=cost,4=discount,5=tax,
                // 6=margin,7=margin_type,8(optional price),9=imei

                $product_code = trim($row[0]);
                $quantity = (float) trim($row[1]);
                $unit_code = trim($row[2]);
                $cost = (float) trim($row[3]);
                $discount = (float) trim($row[4]);
                $tax_name = strtolower(trim($row[5]));
                $margin = (float) trim($row[6]);
                $margin_type = strtolower(trim(str_replace('"', '', $row[7])));
                $imei = trim($row[9] ?? '');

                if (!in_array($margin_type, ['percentage', 'flat'])) {
                    throw new \Exception("Invalid margin type in row {$rowNumber}. Use percentage or flat.");
                }

                $product = Product::where('code', $product_code)
                    ->where('is_active', true)
                    ->first();

                if (!$product) {
                    throw new \Exception("Product code {$product_code} not found.");
                }

                $unit = Unit::where('unit_code', $unit_code)->first();
                if (!$unit) {
                    throw new \Exception("Unit {$unit_code} not found.");
                }

                if ($tax_name !== 'no tax') {
                    $tax = Tax::where('name', $tax_name)->first();
                    if (!$tax) {
                        throw new \Exception("Tax {$tax_name} not found.");
                    }
                } else {
                    $tax = new \stdClass();
                    $tax->rate = 0;
                }

                $rows[] = compact(
                    'product',
                    'unit',
                    'quantity',
                    'cost',
                    'discount',
                    'tax',
                    'margin',
                    'margin_type',
                    'imei'
                );

                $rowNumber++;
            }

            fclose($handle);

            // Create purchase master
            $data = $request->except('file');
            $data['user_id'] = Auth::id();
            $data['reference_no'] = 'pr-' . date("YmdHis");
            $data['paid_amount'] = 0;

            $purchase = Purchase::create($data);

            foreach ($rows as $row) {

                $product = $row['product'];
                $quantity = (int) $row['quantity'];

                $net_unit_cost = $row['cost'] - $row['discount'];

                // 🔥 CALCULATE SELLING PRICE BASED ON MARGIN TYPE
                if ($row['margin_type'] === 'percentage') {
                    $calculated_price = $net_unit_cost + (($net_unit_cost * $row['margin']) / 100);
                } else { // flat
                    $calculated_price = $net_unit_cost + $row['margin'];
                }

                // Tax calculation
                if ($product->tax_method == 1) {
                    $product_tax = $net_unit_cost * ($row['tax']->rate / 100) * $quantity;
                    $total = ($net_unit_cost * $quantity) + $product_tax;
                } else {
                    $net_unit_cost = (100 / (100 + $row['tax']->rate)) * $net_unit_cost;
                    $product_tax = ($row['cost'] - $row['discount'] - $net_unit_cost) * $quantity;
                    $total = ($row['cost'] - $row['discount']) * $quantity;
                }

                if ($data['status'] == 1) {

                    $stock_qty = ($row['unit']->operator == '*')
                        ? $quantity * $row['unit']->operation_value
                        : $quantity / $row['unit']->operation_value;

                    $product->qty += $stock_qty;
                    $product->cost = $row['cost'];
                    $product->profit_margin = $row['margin'];
                    $product->profit_margin_type = $row['margin_type']; // STRING
                    $product->price = $calculated_price; // 🔥 AUTO CALCULATED
                    $product->save();

                    $warehouse = Product_Warehouse::firstOrNew([
                        'product_id' => $product->id,
                        'warehouse_id' => $data['warehouse_id']
                    ]);

                    $warehouse->qty = ($warehouse->qty ?? 0) + $stock_qty;

                    if (!empty($row['imei'])) {

                        if ($this->isImeiExist($row['imei'], $product->id)) {
                            throw new \Exception("Duplicate IMEI not allowed.");
                        }

                        $warehouse->imei_number = $warehouse->imei_number
                            ? $warehouse->imei_number . ',' . $row['imei']
                            : $row['imei'];
                    }

                    $warehouse->save();
                }

                ProductPurchase::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'imei_number' => $row['imei'],
                    'qty' => $quantity,
                    'recieved' => $data['status'] == 1 ? $quantity : 0,
                    'purchase_unit_id' => $row['unit']->id,
                    'net_unit_cost' => $net_unit_cost,
                    'net_unit_margin' => $row['margin'],
                    'net_unit_margin_type' => $row['margin_type'],
                    'net_unit_price' => $calculated_price, // 🔥 AUTO CALCULATED
                    'discount' => $row['discount'] * $quantity,
                    'tax_rate' => $row['tax']->rate,
                    'tax' => $product_tax,
                    'total' => $total,
                ]);

                $purchase->total_qty += $quantity;
                $purchase->total_tax += $product_tax;
                $purchase->total_cost += $total;
            }

            $purchase->item = count($rows);

            $purchase->order_tax =
                ($purchase->total_cost - $purchase->order_discount)
                * ($data['order_tax_rate'] / 100);

            $purchase->grand_total =
                ($purchase->total_cost
                    + $purchase->order_tax
                    + $purchase->shipping_cost)
                - $purchase->order_discount;

            $purchase->save();

            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Purchase created successfully'),
                    'purchase_id' => $purchase->id,
                ]);
            }

            return redirect('purchases')
                ->with('message', 'Purchase created successfully.');

        } catch (\Exception $e) {

            DB::rollBack();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $e->getMessage()], 422);
            }

            return redirect('purchases/purchase_by_csv')
                ->with('not_permitted', $e->getMessage());
        }
    }

    public function purchaseData(Request $request)
    {
        $general_setting = GeneralSetting::select('show_products_details_in_purchase_table')->first();

        $columns = array(
            1 => 'created_at',
            2 => 'reference_no',
            6 => 'grand_total',
            8 => 'paid_amount',
        );
        if ($general_setting->show_products_details_in_purchase_table) {
            $columns = array(
                1 => 'created_at',
                2 => 'reference_no',
                8 => 'grand_total',
                10 => 'paid_amount',
            );
        }

        $warehouse_id = $request->input('warehouse_id');
        $purchase_status = $request->input('purchase_status');
        $payment_status = $request->input('payment_status');

        $q = Purchase::whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNotIn('purchase_type', ['opening balance', 'initial stock'])
                ->orWhereNull('purchase_type');
            })->whereDate('created_at', '>=' ,$request->input('starting_date'))
            ->whereDate('created_at', '<=' ,$request->input('ending_date'));
        //check staff access
        $this->staffAccessCheck($q);
        if($warehouse_id)
            $q = $q->where('warehouse_id', $warehouse_id);
        if($purchase_status)
            $q = $q->where('status', $purchase_status);
        if($payment_status)
            $q = $q->where('payment_status', $payment_status);

        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'purchases.'.$columns[$request->input('order.0.column')];
        $dir = $request->input('order.0.dir');
        //fetching custom fields data
        $custom_fields = CustomField::where([
                        ['belongs_to', 'purchase'],
                        ['is_table', true]
                    ])->pluck('name');
        $field_names = [];
        foreach($custom_fields as $fieldName) {
            $field_names[] = str_replace(" ", "_", strtolower($fieldName));
        }
        if(empty($request->input('search.value'))) {
            $q = Purchase::whereNull('deleted_at')
                ->where(function ($q) {
                    $q->whereNotIn('purchase_type', ['opening balance', 'initial stock'])
                    ->orWhereNull('purchase_type');
                })
                ->with('supplier', 'warehouse','products')
                ->whereDate('created_at', '>=' ,$request->input('starting_date'))
                ->whereDate('created_at', '<=' ,$request->input('ending_date'))
                ->offset($start)
                ->limit($limit)
                ->orderBy($order, $dir);
            //check staff access
            $this->staffAccessCheck($q);
            if($warehouse_id)
                $q = $q->where('warehouse_id', $warehouse_id);
            if($purchase_status)
                $q = $q->where('status', $purchase_status);
            if($payment_status)
                $q = $q->where('payment_status', $payment_status);
            $purchases = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $searchDate = date('Y-m-d', strtotime(str_replace('/', '-', $search)));

            $q = Purchase::query()
                ->join('product_purchases', 'purchases.id', '=', 'product_purchases.purchase_id')
                ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                ->leftJoin('products', 'product_purchases.product_id', '=', 'products.id')
                ->whereNull('purchases.deleted_at')
                ->whereDate('purchases.created_at', '>=' ,$request->input('starting_date'))
                ->whereDate('purchases.created_at', '<=' ,$request->input('ending_date'));

            // ✅ APPLY FILTERS FIRST (DO NOT MOVE THESE)
            if ($warehouse_id) {
                $q->where('purchases.warehouse_id', $warehouse_id);
            }

            if ($purchase_status) {
                $q->where('purchases.status', $purchase_status);
            }

            if ($payment_status) {
                $q->where('purchases.payment_status', $payment_status);
            }

            // ✅ ACCESS CONTROL
            if (Auth::user()->role_id > 2) {
                if (config('staff_access') == 'own') {
                    $q->where('purchases.user_id', Auth::id());
                } elseif (config('staff_access') == 'warehouse') {
                    $q->where('purchases.warehouse_id', Auth::user()->warehouse_id);
                }
            }

            // ✅ SAFE SEARCH GROUP
            $q->where(function ($query) use ($search, $searchDate, $field_names) {

                if (strtotime($searchDate)) {
                    $query->orWhereDate('purchases.created_at', $searchDate);
                }

                $query->orWhere('purchases.reference_no', 'LIKE', "%{$search}%")
                    ->orWhere('suppliers.name', 'LIKE', "%{$search}%")
                    ->orWhere('product_purchases.imei_number', 'LIKE', "%{$search}%")
                    ->orWhere('products.name', 'LIKE', "%{$search}%")
                    ->orWhere('products.code', 'LIKE', "%{$search}%");

                foreach ($field_names as $field_name) {
                    $query->orWhere('purchases.' . $field_name, 'LIKE', "%{$search}%");
                }

            });

            // ✅ COUNT
            $totalFiltered = $q->distinct('purchases.id')->count('purchases.id');

            // ✅ SORTING
            $q->orderBy($order, $dir);

            // ✅ FETCH
            $purchases = $q->select('purchases.*')
                        ->groupBy('purchases.id')
                        ->skip($start)
                        ->take($limit)
                        ->get();
        }

        if(cache()->has('currency_list'))
        {
            $currency_list = cache()->get('currency_list');
        }else {
            $currency_list = Currency::where('is_active', true)->get();
            cache()->put('currency_list', $currency_list, 60 * 60 * 24);
        }

        $data = array();
        if(!empty($purchases))
        {
            foreach ($purchases as $key=>$purchase)
            {
                $user = $purchase->user;

                $nestedData['id'] = $purchase->id;
                $nestedData['key'] = $key;
                $nestedData['date'] = date(config('date_format'), strtotime($purchase->created_at->toDateString()));
                $nestedData['reference_no'] = $purchase->reference_no;
                $nestedData['created_by'] = $user->name ?? 'N/A';

                if($purchase->supplier_id) {
                    $supplier = $purchase->supplier;
                }
                else {
                    $supplier = new Supplier();
                }

                if($purchase->currency_id){
                    $currency_code = $currency_list->where('id', $purchase->currency_id)->first()->code;
                    $currency = $currency_code . '/'.$purchase->exchange_rate;
                }else{
                    $currency_code = 'N/A';
                    $currency = 'N/A';
                }

                // product details and qty
                $productNames = [];
                $productQtys = [];
                $total_products = $purchase->products->count();
                foreach ($purchase->products as $key => $product) {
                    if( $key + 1 < $total_products){
                $productNames[] = '<div style="border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px;">' . e($product->name) . '</div>';
                    }else{
                        $productNames[] = '<div style=" padding-bottom: 4px; margin-bottom: 4px;">' . e($product->name) . '</div>';
                    }

                    $productQtys[] = '<div style="padding-bottom: 4px; margin-bottom: 4px;"><span class="badge badge-primary">' . e($product->pivot->qty) . '</span></div>';
                }

                $nestedData['supplier'] = $purchase->supplier->name ?? '';  // supplier name safely
                $nestedData['products'] = implode('', $productNames);      // no commas, just join directly
                $nestedData['products_qty'] = implode('', $productQtys);

                if ($purchase->status == 1) {
                    $nestedData['purchase_status'] = '<div class="badge badge-success">' . __('db.Recieved') . '</div>';
                    $purchase_status = __('db.Recieved');
                }
                elseif($purchase->status == 2){
                    $nestedData['purchase_status'] = '<div class="badge badge-success">'.__('db.Partial').'</div>';
                    $purchase_status = __('db.Partial');
                }
                elseif($purchase->status == 3){
                    $nestedData['purchase_status'] = '<div class="badge badge-danger">'.__('db.Pending').'</div>';
                    $purchase_status = __('db.Pending');
                }
                else{
                    $nestedData['purchase_status'] = '<div class="badge badge-danger">'.__('db.Ordered').'</div>';
                    $purchase_status = __('db.Ordered');
                }



                if(!$purchase->exchange_rate || $purchase->exchange_rate == 0)
                    $purchase->exchange_rate = 1;

                $nestedData['grand_total'] = number_format($purchase->grand_total / $purchase->exchange_rate, config('decimal'));
                $returned_amount = DB::table('return_purchases')->where('purchase_id', $purchase->id)->sum('grand_total');
                $nestedData['returned_amount'] = number_format($returned_amount / $purchase->exchange_rate, config('decimal'));
                $nestedData['paid_amount'] = number_format($purchase->paid_amount / $purchase->exchange_rate, config('decimal'));
                $nestedData['due'] = number_format(
                    max(0, ($purchase->grand_total - $returned_amount - $purchase->paid_amount) / $purchase->exchange_rate),
                    config('decimal')
                );
                $nestedData['currency'] = $currency;

                if($nestedData['due'] > 1)
                    $nestedData['payment_status'] = '<div class="badge badge-danger">'.__('db.Due').'</div>';
                else
                    $nestedData['payment_status'] = '<div class="badge badge-success">'.__('db.Paid').'</div>';
                    $nestedData['due_date']    = $purchase->due_date
                                                ? date(config('date_format'), strtotime($purchase->due_date))
                                                : '-';
                    $nestedData['pay_term']    = $purchase->pay_term_no
                                                ? $purchase->pay_term_no . ' ' . $purchase->pay_term_period
                                                : '-';

                //fetching custom fields data
                foreach($field_names as $field_name) {
                    $nestedData[$field_name] = $purchase->$field_name;
                }
                $nestedData['options'] = '<div class="btn-group">
                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'.__("db.action").'
                              <span class="caret"></span>
                              <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">
                                <li>
                                    <button type="button" class="btn btn-link view"><i class="fa fa-eye"></i> '.__('db.View').'</button>
                                </li>';
                if(in_array("purchases-add", $request['all_permission']))
                    $nestedData['options'] .= '<li>
                        <a href="'.route('purchase.duplicate', $purchase->id).'" class="btn btn-link"><i class="fa fa-copy"></i> '.__('db.Duplicate').'</a>
                        </li>';
                if(in_array("purchases-edit", $request['all_permission']))
                    $nestedData['options'] .= '<li>
                        <a href="'.route('purchases.edit', $purchase->id).'" class="btn btn-link"><i class="dripicons-document-edit"></i> '.__('db.edit').'</a>
                        </li>';
                if(in_array("purchase-payment-index", $request['all_permission']))
                    $nestedData['options'] .=
                        '<li>
                            <button type="button" class="get-payment btn btn-link" data-id = "'.$purchase->id.'"><i class="fa fa-money"></i> '.__('db.View Payment').'</button>
                        </li>';

                if(in_array("purchase-payment-add", $request['all_permission'])) {
                    $due_amount = number_format(
                    max(0, ($purchase->grand_total - $returned_amount - $purchase->paid_amount) / $purchase->exchange_rate),
                    config('decimal')
                );
                    $currency_code_name = $purchase->currency->code ?? 'USD';
                    $nestedData['options'] .=
                        '<li>
                            <button
                                type="button"
                                class="add-payment btn btn-link"
                                data-id="'.$purchase->id.'"
                                data-due="'.$due_amount.'"
                                data-currency_id="'.$purchase->currency_id.'"
                                data-currency_name="'.$currency_code_name.'"
                                data-exchange_rate="'.$purchase->exchange_rate.'"
                                data-toggle="modal"
                                data-target="#add-payment">
                                <i class="fa fa-plus"></i> '.__('db.Add Payment').'
                            </button>
                        </li>';
                }
                if(in_array("purchases-delete", $request['all_permission']))
                    $nestedData['options'] .= '<form method="POST" action="'.route('purchases.destroy', $purchase->id).'" accept-charset="UTF-8" style="display:inline">'.method_field("DELETE").'
                        '.csrf_field().'
                            <li>
                              <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> '.__("db.delete").'</button>
                            </li></form>
                        </ul>
                    </div>';

                // data for purchase details by one click
                if($purchase->currency_id) {
                    $currency = Currency::select('code')->find($purchase->currency_id);
                    if($currency)
                        $currency_code = $currency->code;
                }
                else
                    $currency_code = 'N/A';

                $nestedData['purchase'] = array( '[ "'.date(config('date_format'), strtotime($purchase->created_at->toDateString())).'"', ' "'.$purchase->reference_no.'"', ' "'.$purchase_status.'"',  ' "'.$purchase->id.'"', ' "'.$purchase->warehouse->name.'"', ' "'.$purchase->warehouse->phone.'"', ' "'.preg_replace('/\s+/S', " ", $purchase->warehouse->address).'"', ' "'.$supplier->name.'"', ' "'.$supplier->company_name.'"', ' "'.$supplier->email.'"', ' "'.$supplier->phone_number.'"', ' "'.preg_replace('/\s+/S', " ", $supplier->address).'"', ' "'.$supplier->city.'"', ' "'.$purchase->total_tax.'"', ' "'.$purchase->total_discount.'"', ' "'.$purchase->total_cost.'"', ' "'.$purchase->order_tax.'"', ' "'.$purchase->order_tax_rate.'"', ' "'.$purchase->order_discount.'"', ' "'.$purchase->shipping_cost.'"', ' "'.$purchase->grand_total.'"', ' "'.$purchase->paid_amount.'"', ' "'.preg_replace('/\s+/S', " ", $purchase->note).'"', ' "'.$user->name.'"', ' "'.$user->email.'"', ' "'.$purchase->document.'"', ' "'.$currency_code.'"', ' "'.$purchase->exchange_rate.'"',' "'.$purchase->pay_term_no.'"',' "'.$purchase->pay_term_period.'"',' "'.$purchase->due_date .'"', ' "'.$returned_amount.'"]'
                );
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

    public function productPurchaseData($id)
    {
        try {
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();
            $product_purchase = [];
            foreach ($lims_product_purchase_data as $key => $product_purchase_data) {
                $product = Product::find($product_purchase_data->product_id);
                $unit = Unit::find($product_purchase_data->purchase_unit_id);
                if($product_purchase_data->variant_id) {
                    $lims_product_variant_data = ProductVariant::FindExactProduct($product->id, $product_purchase_data->variant_id)->select('item_code')->first();
                    $product->code = $lims_product_variant_data->item_code;
                }
                if($product_purchase_data->product_batch_id) {
                    $product_batch_data = ProductBatch::select('batch_no')->find($product_purchase_data->product_batch_id);
                    $product_purchase[7][$key] = $product_batch_data->batch_no;
                }
                else
                    $product_purchase[7][$key] = 'N/A';
                $product_purchase[0][$key] = $product->name . ' [' . $product->code.']';
                $returned_imei_number_data = '';
                if($product_purchase_data->imei_number) {
                    $product_purchase[0][$key] .= '<br><span style="white-space: normal !important;word-break: break-word !important;overflow-wrap: anywhere !important;max-width: 100%;display: block;">IMEI or Serial Number: '. $product_purchase_data->imei_number.'</span>';
                    $returned_imei_number_data = DB::table('return_purchases')
                    ->join('purchase_product_return', 'return_purchases.id', '=', 'purchase_product_return.return_id')
                    ->where([
                        ['return_purchases.purchase_id', $id],
                        ['purchase_product_return.product_id', $product_purchase_data->product_id]
                    ])->select('purchase_product_return.imei_number')
                    ->first();
                }
                $product_purchase[1][$key] = $product_purchase_data->qty;
                $product_purchase[2][$key] = $unit->unit_code;
                $product_purchase[3][$key] = $product_purchase_data->tax;
                $product_purchase[4][$key] = $product_purchase_data->tax_rate;
                $product_purchase[5][$key] = $product_purchase_data->discount;
                $product_purchase[6][$key] = $product_purchase_data->total;
                if($returned_imei_number_data) {
                    $product_purchase[8][$key] = $product_purchase_data->return_qty.'<br><span style="white-space: normal !important;word-break: break-word !important;overflow-wrap: anywhere !important;max-width: 100%;display: block;">IMEI or Serial Number: '. $returned_imei_number_data->imei_number .'</span>';
                }
                else
                    $product_purchase[8][$key] = $product_purchase_data->return_qty;
            }
            return $product_purchase;
        }
        catch (\Exception $e) {
            /*return response()->json('errors' => [$e->getMessage());*/
            //return response()->json(['errors' => [$e->getMessage()]], 422);
            return 'Something is wrong!';
        }

    }

    public function productWithoutVariant()
    {
        return Product::ActiveStandard()->select('id', 'name', 'code')
                ->whereNull('is_variant')->get();
    }

    public function productWithVariant()
    {
        return Product::join('product_variants', 'products.id', 'product_variants.product_id')
            ->ActiveStandard()
            ->whereNotNull('is_variant')
            ->select('products.id', 'products.name', 'product_variants.item_code')
            ->orderBy('position')
            ->get();
    }

    public function newProductWithVariant()
    {
        return Product::ActiveStandard()
                ->whereNotNull('is_variant')
                ->whereNotNull('variant_data')
                ->select('id', 'name', 'variant_data')
                ->get();
    }

    public function limsProductSearch(Request $request)
    {
        // dd($request->all());
        $product_code = explode("|", $request['data']);
        $product_code[0] = rtrim($product_code[0], " ");
        $lims_product_data = Product::where([
                                ['code', $product_code[0]],
                                ['is_active', true]
                            ])
                            ->whereNull('is_variant')
                            ->first();
        if(!$lims_product_data) {
            $lims_product_data = Product::where([
                                ['name', $product_code[1]],
                                ['is_active', true]
                            ])
                            ->whereNotNull(['is_variant'])
                            ->first();
            $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
                ->where([
                    ['product_variants.item_code', $product_code[0]],
                    ['products.is_active', true]
                ])
                ->whereNotNull('is_variant')
                ->select('products.*', 'product_variants.item_code', 'product_variants.additional_cost')
                ->first();
            $lims_product_data->cost += $lims_product_data->additional_cost;
        }
        $product[] = $lims_product_data->name;
        if($lims_product_data->is_variant)
            $product[] = $lims_product_data->item_code;
        else
            $product[] = $lims_product_data->code;

        $product[] = $lims_product_data->cost;
        $product['profit_margin'] = $lims_product_data->profit_margin;
        $product['profit_margin_type'] = $lims_product_data->profit_margin_type;
        $product['product_price'] = $lims_product_data->price;

        $cost = (float)$lims_product_data->cost;
        $price = (float)$lims_product_data->price;

        if ($cost > 0 && $lims_product_data->profit_margin_type === 'percentage') {
            $calculatedMargin = (($price - $cost) / $cost) * 100;
        } else if ($cost > 0 && $lims_product_data->profit_margin_type === 'flat') {
            $calculatedMargin = $price - $cost;
        } else {
            $calculatedMargin = 0; // or null, or skip updating
        }

        if (round($calculatedMargin, 2) != round((float)$lims_product_data->profit_margin, 2)) {
            $product['profit_margin'] = $calculatedMargin;
        }

        if ($lims_product_data->tax_id) {
            $lims_tax_data = Tax::find($lims_product_data->tax_id);
            $product[] = $lims_tax_data->rate;
            $product[] = $lims_tax_data->name;
        } else {
            $product[] = 0;
            $product[] = 'No Tax';
        }
        $product[] = $lims_product_data->tax_method;

        $units = Unit::where("base_unit", $lims_product_data->unit_id)
                    ->orWhere('id', $lims_product_data->unit_id)
                    ->get();
        $unit_name = array();
        $unit_operator = array();
        $unit_operation_value = array();
        foreach ($units as $unit) {
            if ($lims_product_data->purchase_unit_id == $unit->id) {
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
        $product[] = $lims_product_data->id;
        $product[] = $lims_product_data->is_batch;
        $product[] = $lims_product_data->is_imei;
        if ($this->wantsSpaResponse($request)) {
            $product['purchase_unit_id'] = $lims_product_data->purchase_unit_id;
            $product['purchase_unit'] = $unit_name[0] ?? null;
            $product['tax_rate'] = $lims_product_data->tax_id ? (float) (Tax::find($lims_product_data->tax_id)?->rate ?? 0) : 0;
            $product['tax_name'] = $lims_product_data->tax_id ? (Tax::find($lims_product_data->tax_id)?->name ?? 'No Tax') : 'No Tax';
            $product['tax_method'] = (int) ($lims_product_data->tax_method ?? 1);
            $product['is_batch'] = (bool) ($lims_product_data->is_batch ?? false);
            $product['is_imei'] = (bool) ($lims_product_data->is_imei ?? false);
            if ($lims_product_data->is_batch) {
                $batchSuggestion = $this->resolvePurchaseBatchForLine(
                    (int) $lims_product_data->id,
                    (float) $lims_product_data->cost,
                    (float) $lims_product_data->price
                );
                $product['batch_no'] = $batchSuggestion['batch_no'];
                $product['product_batch_id'] = $batchSuggestion['product_batch_id'];
                $product['is_new_batch'] = $batchSuggestion['is_new_batch'];
                $product['expired_date'] = $batchSuggestion['expired_date'];
            }
            $product['units'] = collect($units)->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->unit_name,
                'operator' => $u->operator,
                'operation_value' => (float) $u->operation_value,
            ])->values();
            return response()->json($product);
        }
        return $product;
    }

    public function edit(Request $request, $id)
    {
        if ($this->wantsSpaResponse($request)) {
            if (!$this->userCanAccessPurchases('purchases-edit')) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            try {
                $purchase = $this->purchaseQuery()->find($id);
                if (!$purchase) {
                    return $this->spaJson($request, ['message' => __('db.Purchase not found')], 404);
                }
                $lines = ProductPurchase::where('purchase_id', $id)->get()->map(function ($line) {
                    $product = Product::find($line->product_id);
                    $unit = Unit::find($line->purchase_unit_id);
                    $tax = Tax::where('rate', $line->tax_rate)->first();
                    $batch = $line->product_batch_id
                        ? ProductBatch::select('batch_no', 'expired_date')->find($line->product_batch_id)
                        : null;
                    $isBatch = (bool) ($product->is_batch ?? false) || !empty($line->product_batch_id);
                    return [
                        'product_id' => $line->product_id,
                        'code' => $product->code ?? '',
                        'name' => $product->name ?? '',
                        'qty' => $line->qty,
                        'recieved' => $line->recieved,
                        'purchase_unit' => $unit->unit_name ?? '',
                        'purchase_unit_id' => $line->purchase_unit_id,
                        'net_unit_cost' => $line->net_unit_cost,
                        'net_unit_margin' => $line->net_unit_margin,
                        'net_unit_margin_type' => $line->net_unit_margin_type,
                        'net_unit_price' => $line->net_unit_price,
                        'discount' => $line->discount,
                        'tax_rate' => $line->tax_rate,
                        'tax' => $line->tax,
                        'subtotal' => $line->total,
                        'tax_name' => $tax->name ?? 'No Tax',
                        'is_batch' => $isBatch,
                        'product_batch_id' => $line->product_batch_id,
                        'batch_no' => $isBatch ? ($batch->batch_no ?? '') : '',
                        'expired_date' => $isBatch && $batch?->expired_date
                            ? date('Y-m-d', strtotime($batch->expired_date))
                            : '',
                    ];
                });
                return $this->spaJson($request, [
                    'purchase' => [
                        'id' => $purchase->id,
                        'reference_no' => $purchase->reference_no,
                        'created_at' => $purchase->created_at?->format('Y-m-d'),
                        'warehouse_id' => $purchase->warehouse_id,
                        'supplier_id' => $purchase->supplier_id,
                        'status' => $purchase->status,
                        'currency_id' => $purchase->currency_id,
                        'exchange_rate' => $purchase->exchange_rate ?: 1,
                        'order_tax_rate' => $purchase->order_tax_rate ?? 0,
                        'order_tax' => $purchase->order_tax ?? 0,
                        'order_discount' => $purchase->order_discount ?? 0,
                        'shipping_cost' => $purchase->shipping_cost ?? 0,
                        'note' => $purchase->note ?? '',
                        'grand_total' => $purchase->grand_total,
                        'paid_amount' => $purchase->paid_amount ?? 0,
                    ],
                    'lines' => $lines,
                    'meta' => $this->purchaseFormMeta(),
                ]);
            } catch (\Throwable $e) {
                report($e);
                return $this->spaJson($request, ['message' => __('db.Failed to load purchase'), 'error' => config('app.debug') ? $e->getMessage() : null], 500);
            }
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-edit')){
            $lims_supplier_list = Supplier::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_tax_list = Tax::where('is_active', true)->get();
            $lims_product_list_without_variant = $this->productWithoutVariant();
            $lims_product_list_with_variant = $this->productWithVariant();
            $lims_purchase_data = Purchase::find($id);
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();
            foreach ($lims_product_purchase_data as $purchase) {
                $lims_product_data = Product::select('cost', 'profit_margin', 'profit_margin_type', 'price')->where('id', $purchase->product_id)->first();
                $cost = (float) $purchase->net_unit_cost;
                if ($lims_product_data) {
                    $price = (float) $purchase->net_unit_price == 0 ? $lims_product_data->price : $purchase->net_unit_price;
                } else {
                    $price = (float) $purchase->net_unit_price;
                }
                $margin = (float) $purchase->net_unit_margin;
                $margin_type = $purchase->net_unit_margin_type;

                if ($cost > 0 && $price > 0 && $margin_type === 'percentage') {
                    $calculatedMargin = (($price - $cost) / $cost) * 100;

                    if (round($calculatedMargin, 2) != round($margin, 2)) {
                        $purchase->net_unit_margin = $calculatedMargin;
                        $purchase->net_unit_price = $price;
                        $purchase->save();
                    }
                }
            }
            if(cache()->has('currency_list'))
            {
                $currency_list = cache()->get('currency_list');
            }else {
                $currency_list = Currency::where('is_active', true)->get();
                cache()->put('currency_list', $currency_list, 60 * 60 * 24);
            }
            $currency_exchange_rate = $lims_purchase_data->exchange_rate ?? 1;

            $custom_fields = CustomField::where('belongs_to', 'purchase')->get();
            return view('backend.purchase.edit', compact('lims_warehouse_list', 'lims_supplier_list', 'lims_product_list_without_variant', 'lims_product_list_with_variant', 'lims_tax_list', 'lims_purchase_data', 'lims_product_purchase_data', 'currency_list', 'currency_exchange_rate', 'custom_fields'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));

    }

    public function update(UpdatePurchaseRequest $request, $id)
    {
        $lims_purchase_data = Purchase::find($id);
        $data = $request->except('document');
        $document = $request->document;
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

            $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            $data['document'] = $documentName;
        }
        //return dd($data);
        DB::beginTransaction();

        try {
            $balance = (float)$data['grand_total'] - (float)($data['paid_amount'] ?? 0);
            if ($balance > 0) {
                $data['payment_status'] = 1;
            } else {
                $data['payment_status'] = 2;
            }
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();

            $data['created_at'] = date("Y-m-d", strtotime(str_replace("/", "-", $data['created_at']))) . ' '. date("H:i:s");
            // Due date recalculate from payment terms on update
            if (!empty($data['pay_term_no']) && !empty($data['pay_term_period'])) {
                $purchaseDate = \Carbon\Carbon::parse($data['created_at']);

                if ($data['pay_term_period'] === 'days') {
                    $data['due_date'] = $purchaseDate->addDays((int)$data['pay_term_no'])->format('Y-m-d');
                } else {
                    $data['due_date'] = $purchaseDate->addMonths((int)$data['pay_term_no'])->format('Y-m-d');
                }
            } elseif (empty($data['due_date'])) {
                $data['due_date'] = null;
            }

            $this->normalizePurchaseHeaderTotals($data);

            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            $recieved = $data['recieved'];
            $batch_no = $data['batch_no'] ?? null;
            $expired_date = $data['expired_date'] ?? null;
            $purchase_unit = $data['purchase_unit'];
            $unit_cost = $data['unit_cost'];
            $net_unit_cost = $data['net_unit_cost'];
            $net_unit_margin = $data['net_unit_margin'];
            $net_unit_margin_type = $data['net_unit_margin_type'];
            $net_unit_price = $data['net_unit_price'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];
            $imei_number = $new_imei_number = $data['imei_number'] ?? null;
            $product_purchase = [];

            foreach ($lims_product_purchase_data as $i => $product_purchase_data) {

                $old_recieved_value = $product_purchase_data->recieved;
                $lims_purchase_unit_data = Unit::find($product_purchase_data->purchase_unit_id);

                if ($lims_purchase_unit_data->operator == '*') {
                    $old_recieved_value = $old_recieved_value * $lims_purchase_unit_data->operation_value;
                } else {
                    $old_recieved_value = $old_recieved_value / $lims_purchase_unit_data->operation_value;
                }
                $lims_product_data = Product::find($product_purchase_data->product_id);
                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProduct($lims_product_data->id, $product_purchase_data->variant_id)->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $lims_product_data->id],
                        ['variant_id', $product_purchase_data->variant_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id]
                    ])->first();
                    $lims_product_variant_data->qty -= $old_recieved_value;
                    $lims_product_variant_data->save();
                }
                elseif($product_purchase_data->product_batch_id) {
                    $product_batch_data = ProductBatch::find($product_purchase_data->product_batch_id);
                    $product_batch_data->qty -= $old_recieved_value;
                    $product_batch_data->save();

                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['product_batch_id', $product_purchase_data->product_batch_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                else {
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                if($product_purchase_data->imei_number) {
                    $position = array_search($lims_product_data->id, $product_id);
                    if($imei_number[$position]) {
                        $prev_imei_numbers = explode(",", $product_purchase_data->imei_number);
                        $new_imei_numbers = explode(",", $imei_number[$position]);
                        $temp_imeis = explode(',', $lims_product_warehouse_data->imei_number);
                        foreach ($prev_imei_numbers as $prev_imei_number) {
                            $pos = array_search($prev_imei_number, $temp_imeis);
                            if ($pos !== false) {
                                unset($temp_imeis[$pos]);
                            }
                        }

                        // return dd($prev_imei_number, $temp_imeis);
                        $lims_product_warehouse_data->imei_number = !empty($temp_imeis) ? implode(',', $temp_imeis) : null;

                        $new_imei_number[$position] = implode(",", $new_imei_numbers);
                    }
                }
                $lims_product_data->qty -= $old_recieved_value;
                if($lims_product_warehouse_data) {
                    $lims_product_warehouse_data->qty -= $old_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                // update cost, profit margin, and price

                if(isset($unit_cost[$i])){
                    $lims_product_data->cost = $unit_cost[$i];
                    $lims_product_data->profit_margin = $net_unit_margin[$i];
                    $lims_product_data->profit_margin_type = $net_unit_margin_type[$i];
                    $lims_product_data->price = $net_unit_price[$i];
                }

                $lims_product_data->save();
                $product_purchase_data->delete();
            }

            $log_data['item_description'] = '';
            foreach ($product_id as $key => $pro_id) {
                $lims_purchase_unit_data = $this->resolvePurchaseUnit(
                    $purchase_unit[$key] ?? null,
                    (int) $pro_id,
                    isset($data['purchase_unit_id'][$key]) ? (int) $data['purchase_unit_id'][$key] : null
                );
                if ($lims_purchase_unit_data->operator == '*') {
                    $new_recieved_value = $recieved[$key] * $lims_purchase_unit_data->operation_value;
                } else {
                    $new_recieved_value = $recieved[$key] / $lims_purchase_unit_data->operation_value;
                }

                $lims_product_data = Product::find($pro_id);
                $price = null;
                //dealing with product barch
                if ($lims_product_data->is_batch) {
                    $resolvedBatch = $this->resolvePurchaseBatchForLine(
                        (int) $pro_id,
                        (float) $net_unit_cost[$key],
                        (float) $net_unit_price[$key]
                    );
                    $batch_no[$key] = $resolvedBatch['batch_no'];
                }
                if($batch_no[$key]) {
                    $lineExpiredDate = !empty($expired_date[$key]) ? $expired_date[$key] : null;
                    $product_batch_data = ProductBatch::where([
                                            ['product_id', $lims_product_data->id],
                                            ['batch_no', $batch_no[$key]]
                                        ])->first();
                    if($product_batch_data) {
                        $product_batch_data->qty += $new_recieved_value;
                        $product_batch_data->expired_date = $lineExpiredDate;
                        $product_batch_data->save();
                    }
                    else {
                        $product_batch_data = ProductBatch::create([
                                                'product_id' => $lims_product_data->id,
                                                'batch_no' => $batch_no[$key],
                                                'expired_date' => $lineExpiredDate,
                                                'qty' => $new_recieved_value
                                            ]);
                    }
                    $product_purchase['product_batch_id'] = $product_batch_data->id;
                }
                else
                    $product_purchase['product_batch_id'] = null;

                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $pro_id],
                        ['variant_id', $lims_product_variant_data->variant_id],
                        ['warehouse_id', $data['warehouse_id']]
                    ])->first();
                    $product_purchase['variant_id'] = $lims_product_variant_data->variant_id;
                    //add quantity to product variant table
                    $lims_product_variant_data->qty += $new_recieved_value;
                    $lims_product_variant_data->save();
                }
                else {
                    $product_purchase['variant_id'] = null;
                    if($product_purchase['product_batch_id']) {
                        //checking for price
                        $lims_product_warehouse_data = Product_Warehouse::where([
                                                        ['product_id', $pro_id],
                                                        ['warehouse_id', $data['warehouse_id'] ],
                                                    ])
                                                    ->whereNotNull('price')
                                                    ->select('price')
                                                    ->first();
                        if($lims_product_warehouse_data)
                            $price = $lims_product_warehouse_data->price;

                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['product_batch_id', $product_purchase['product_batch_id'] ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                }

                $lims_product_data->qty += $new_recieved_value;
                if($lims_product_warehouse_data){
                    $lims_product_warehouse_data->qty += $new_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $pro_id;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                    if($lims_product_data->is_variant)
                        $lims_product_warehouse_data->variant_id = $lims_product_variant_data->variant_id;
                    $lims_product_warehouse_data->warehouse_id = $data['warehouse_id'];
                    $lims_product_warehouse_data->qty = $new_recieved_value;
                    if($price)
                        $lims_product_warehouse_data->price = $price;
                }


                //dealing with imei numbers
                if($new_imei_number[$key]) {
                    // prevent duplication
                    $imeis = explode(',', $new_imei_number[$key]);
                    $imeis = array_map('trim', $imeis);
                    if (count($imeis) !== count(array_unique($imeis))) {
                        DB::rollBack();
                        return redirect()->route('purchases.edit', $id)->with('not_permitted', __('db.Duplicate IMEI not allowed!'));
                    }
                    foreach ($imeis as $imei) {
                        if ($this->isImeiExist($imei, $product_purchase_data->product_id)) {
                            DB::rollBack();
                            return redirect()->route('purchases.edit', $id)->with('not_permitted', __('db.Duplicate IMEI not allowed!'));
                        }
                    }

                    $soldImeis = Sale::join('product_sales', 'sales.id', '=', 'product_sales.sale_id')
                            ->where('product_sales.product_id', $pro_id) // current product id
                            ->whereNotNull('product_sales.imei_number')   // শুধু যেগুলোর IMEI আছে
                            ->pluck('product_sales.imei_number')          // collection of comma-separated IMEIs
                            ->map(function($item){
                                return explode(',', $item);               // comma split
                            })
                            ->flatten()
                            ->map('trim')                                 // extra space remove
                            ->toArray();
                        $new_imei_number[$key] = array_diff($imeis, $soldImeis);
                        $newImeis = implode(',', $new_imei_number[$key]);
                        if(isset($lims_product_warehouse_data->imei_number)) {
                            $lims_product_warehouse_data->imei_number .= ',' . $newImeis;
                        }
                        else {
                            $lims_product_warehouse_data->imei_number = $newImeis;
                        }
                }
                $lims_product_data->save();
                $lims_product_warehouse_data->save();
                $log_data['item_description'] .= $lims_product_data->name. '-'. $qty[$key].' '.$lims_purchase_unit_data->unit_code.'<br>';
                $product_purchase['purchase_id'] = $id ;
                $product_purchase['product_id'] = $pro_id;
                $product_purchase['qty'] = $qty[$key];
                $product_purchase['recieved'] = $recieved[$key];
                $product_purchase['purchase_unit_id'] = $lims_purchase_unit_data->id;
                $product_purchase['net_unit_cost'] = $net_unit_cost[$key];
                $product_purchase['net_unit_margin'] = $net_unit_margin[$key];
                $product_purchase['net_unit_price'] = $net_unit_price[$key];
                $product_purchase['net_unit_margin'] = $net_unit_margin[$key];
                $product_purchase['net_unit_margin_type'] = $net_unit_margin_type[$key];
                $product_purchase['discount'] = $discount[$key];
                $product_purchase['tax_rate'] = $tax_rate[$key];
                $product_purchase['tax'] = $tax[$key];
                $product_purchase['total'] = $total[$key];
                $product_purchase['imei_number'] = $imei_number[$key] ?? null;
                ProductPurchase::create($product_purchase);
            }

            $lims_purchase_data->update($data);

            //creating log
            $log_data['action'] = 'Purchase Updated';
            $log_data['user_id'] = Auth::id();
            $log_data['reference_no'] = $lims_purchase_data->reference_no;
            $log_data['date'] = $lims_purchase_data->created_at->toDateString();
            // $log_data['admin_email'] = config('admin_email');
            $log_data['admin_message'] = Auth::user()->name . ' has updated a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            $log_data['user_email'] = Auth::user()->email;
            $log_data['user_name'] = Auth::user()->name;
            $log_data['user_message'] = 'You just updated a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            // $log_data['mail_setting'] = $mail_setting = MailSetting::latest()->first();
            $this->createActivityLog($log_data);

            //inserting data for custom fields
            $custom_field_data = [];
            $custom_fields = CustomField::where('belongs_to', 'purchase')->select('name', 'type')->get();
            foreach ($custom_fields as $type => $custom_field) {
                $field_name = str_replace(' ', '_', strtolower($custom_field->name));
                if(isset($data[$field_name])) {
                    if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                        $custom_field_data[$field_name] = implode(",", $data[$field_name]);
                    else
                        $custom_field_data[$field_name] = $data[$field_name];
                }
            }
            if(count($custom_field_data))
                DB::table('purchases')->where('id', $lims_purchase_data->id)->update($custom_field_data);

            DB::commit();

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['success' => true, 'message' => __('db.Purchase updated successfully')]);
            }
            return redirect('purchases')->with('message', __('db.Purchase updated successfully'));
        } catch(\Exception $e) {
            DB::rollBack();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['success' => false, 'message' => $e->getMessage()], 400);
            }
            return redirect()->route('purchases.edit', $id)->with('not_permitted', $e->getMessage());
        }
    }

    public function duplicate(Request $request, $id)
    {
        if ($this->wantsSpaResponse($request)) {
            if (!$this->userCanAccessPurchases('purchases-add')) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            try {
                $purchase = $this->purchaseQuery()->find($id);
                if (!$purchase) {
                    return $this->spaJson($request, ['message' => __('db.Purchase not found')], 404);
                }
                $meta = $this->purchaseFormMeta();
                $lines = ProductPurchase::where('purchase_id', $id)->get()->map(function ($line) {
                    $product = Product::find($line->product_id);
                    $unit = Unit::find($line->purchase_unit_id);
                    $tax = Tax::where('rate', $line->tax_rate)->first();
                    $batch = $line->product_batch_id
                        ? ProductBatch::select('batch_no', 'expired_date')->find($line->product_batch_id)
                        : null;
                    $isBatch = (bool) ($product->is_batch ?? false) || !empty($line->product_batch_id);
                    return [
                        'product_id' => $line->product_id,
                        'code' => $product->code ?? '',
                        'name' => $product->name ?? '',
                        'qty' => $line->qty,
                        'recieved' => $line->recieved,
                        'purchase_unit' => $unit->unit_name ?? '',
                        'purchase_unit_id' => $line->purchase_unit_id,
                        'net_unit_cost' => $line->net_unit_cost,
                        'net_unit_margin' => $line->net_unit_margin,
                        'net_unit_margin_type' => $line->net_unit_margin_type,
                        'net_unit_price' => $line->net_unit_price,
                        'discount' => $line->discount,
                        'tax_rate' => $line->tax_rate,
                        'tax' => $line->tax,
                        'subtotal' => $line->total,
                        'tax_name' => $tax->name ?? 'No Tax',
                        'is_batch' => $isBatch,
                        'product_batch_id' => $line->product_batch_id,
                        'batch_no' => $isBatch ? ($batch->batch_no ?? '') : '',
                        'expired_date' => $isBatch && $batch?->expired_date
                            ? date('Y-m-d', strtotime($batch->expired_date))
                            : '',
                    ];
                });
                return $this->spaJson($request, [
                    'purchase' => [
                        'reference_no' => $meta['reference_no'],
                        'created_at' => date('Y-m-d'),
                        'warehouse_id' => $purchase->warehouse_id,
                        'supplier_id' => $purchase->supplier_id,
                        'status' => $purchase->status,
                        'currency_id' => $purchase->currency_id,
                        'exchange_rate' => $purchase->exchange_rate ?: 1,
                        'order_tax_rate' => $purchase->order_tax_rate ?? 0,
                        'order_discount' => $purchase->order_discount ?? 0,
                        'shipping_cost' => $purchase->shipping_cost ?? 0,
                        'note' => $purchase->note ?? '',
                        'pay_term_no' => $purchase->pay_term_no,
                        'pay_term_period' => $purchase->pay_term_period,
                    ],
                    'lines' => $lines,
                    'meta' => $meta,
                ]);
            } catch (\Throwable $e) {
                report($e);
                return $this->spaJson($request, [
                    'message' => __('db.Failed to load purchase duplicate'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-add')){
            $lims_supplier_list = Supplier::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_tax_list = Tax::where('is_active', true)->get();
            $lims_product_list_without_variant = $this->productWithoutVariant();
            $lims_product_list_with_variant = $this->productWithVariant();
            $lims_purchase_data = Purchase::find($id);
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();
            if($lims_purchase_data->exchange_rate)
                $currency_exchange_rate = $lims_purchase_data->exchange_rate;
            else
                $currency_exchange_rate = 1;
            $custom_fields = CustomField::where('belongs_to', 'purchase')->get();
            return view('backend.purchase.duplicate', compact('lims_warehouse_list', 'lims_supplier_list', 'lims_product_list_without_variant', 'lims_product_list_with_variant', 'lims_tax_list', 'lims_purchase_data', 'lims_product_purchase_data', 'currency_exchange_rate', 'custom_fields'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));

    }

    public function addPayment(Request $request)
    {
        if ($this->wantsSpaResponse($request) && !$this->userCanAccessPurchases('purchase-payment-add')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $data = $request->except('_token','document');

        if (isset($data['payment_at'])) {
            $data['payment_at'] = normalize_to_sql_datetime($data['payment_at']);
        } else {
            $data['payment_at'] = date('Y-m-d H:i:s');
        }

        $document = $request->document;
        if ($document) {
            $v = Validator::make(
                [
                    'extension' => strtolower($request->document->getClientOriginalExtension()),
                ],
                [
                    'extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
                ]
            );
            if ($v->fails()) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, ['message' => $v->errors()->first()], 422);
                }
                return redirect()->back()->withErrors($v->errors());
            }

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/add-payment'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/add-payment'), $documentName);
            }
            $data['document'] = $documentName;
        }

        $response = (new PaymentService())->payForPurchase($data);
        if ($response['status']) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Payment created successfully')]);
            }
            return redirect('purchases')->with('message', __('db.Payment created successfully'));
        }
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Payment failed!')], 422);
        }
        return redirect('purchases')->with('not_permitted', 'Payment failed!');
    }

    public function getPayment(Request $request, $id)
    {
        if ($this->wantsSpaResponse($request)) {
            if (!$this->userCanAccessPurchases('purchase-payment-index')) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            try {
                $payments = Payment::where('purchase_id', $id)->orderBy('created_at', 'desc')->get()->map(function ($payment) {
                    if (!$payment->currency_id) {
                        $lims_purchase_data = Purchase::find($payment->purchase_id);
                        if ($lims_purchase_data) {
                            $payment->currency_id = $lims_purchase_data->currency_id;
                            $payment->exchange_rate = $lims_purchase_data->exchange_rate ?? 1;
                        }
                    }
                    $chequeNo = null;
                    if ($payment->paying_method == 'Cheque') {
                        $cheque = PaymentWithCheque::where('payment_id', $payment->id)->first();
                        $chequeNo = $cheque->cheque_no ?? null;
                    }
                    $account = Account::find($payment->account_id);
                    $paymentAt = $payment->payment_at ?? $payment->created_at;
                    $paidById = match ($payment->paying_method) {
                        'Cash' => 1,
                        'Gift Card' => 2,
                        'Credit Card' => 3,
                        'Cheque' => 4,
                        default => 1,
                    };
                    return [
                        'id' => $payment->id,
                        'created_at' => $payment->created_at
                            ? date(config('date_format'), strtotime($payment->created_at->toDateString())).' '.$payment->created_at->toTimeString()
                            : '',
                        'payment_reference' => $payment->payment_reference,
                        'amount' => (float) $payment->amount,
                        'paying_method' => $payment->paying_method,
                        'paid_by_id' => $paidById,
                        'change' => (float) ($payment->change ?? 0),
                        'paying_amount' => (float) $payment->amount + (float) ($payment->change ?? 0),
                        'account_id' => $payment->account_id,
                        'account_name' => $account->name ?? 'N/A',
                        'payment_note' => $payment->payment_note ?? '',
                        'cheque_no' => $chequeNo,
                        'payment_at' => $paymentAt
                            ? date(config('date_format'), strtotime($paymentAt->toDateString()))
                            : '',
                        'payment_at_input' => $paymentAt ? $paymentAt->format('Y-m-d') : date('Y-m-d'),
                        'document' => $payment->document,
                    ];
                })->values();
                return $this->spaJson($request, ['payments' => $payments]);
            } catch (\Throwable $e) {
                report($e);
                return $this->spaJson($request, [
                    'message' => __('db.Failed to load payments'),
                    'error' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }
        }

        $lims_payment_list = Payment::where('purchase_id', $id)->get();
        $date = [];
        $payment_reference = [];
        $paid_amount = [];
        $paying_method = [];
        $payment_id = [];
        $payment_note = [];
        $cheque_no = [];
        $change = [];
        $paying_amount = [];
        $account_name = [];
        $account_id = [];
        $payment_at = [];
        $payment_document = []; 

        foreach ($lims_payment_list as $payment) {
            if (!$payment->currency_id) {
                $lims_purchase_data = Purchase::find($payment->purchase_id);
                if ($lims_purchase_data) {
                    $payment->currency_id = $lims_purchase_data->currency_id;
                    $payment->exchange_rate = $lims_purchase_data->exchange_rate ?? 1;
                }
            }

            $date[] = date(config('date_format'), strtotime($payment->created_at->toDateString())) . ' '. $payment->created_at->toTimeString();
            $payment_reference[] = $payment->payment_reference;
            $paid_amount[] = $payment->amount;
            $change[] = $payment->change;
            $paying_method[] = $payment->paying_method;
            $paying_amount[] = $payment->amount + $payment->change;

            if($payment->paying_method == 'Cheque'){
                $lims_payment_cheque_data = PaymentWithCheque::where('payment_id',$payment->id)->first();
                $cheque_no[] = $lims_payment_cheque_data->cheque_no;
            } else {
                $cheque_no[] = null;
            }

            $payment_id[] = $payment->id;
            $payment_note[] = $payment->payment_note;
            $lims_account_data = Account::find($payment->account_id);
            if($lims_account_data) {
                $account_name[] = $lims_account_data->name;
                $account_id[] = $lims_account_data->id;
            } else {
                $account_name[] = 'N/A';
                $account_id[] = 0;
            }

            $payment->payment_at = $payment->payment_at ?? $payment->created_at;
            $payment->save();
            $payment_at[] = date(config('date_format'), strtotime($payment->payment_at->toDateString()));
            $payment_document[] = $payment->document ?? null; // ✅ নতুন
        }

        $payments[] = $date;           // 0
        $payments[] = $payment_reference; // 1
        $payments[] = $paid_amount;    // 2
        $payments[] = $paying_method;  // 3
        $payments[] = $payment_id;     // 4
        $payments[] = $payment_note;   // 5
        $payments[] = $cheque_no;      // 6
        $payments[] = $change;         // 7
        $payments[] = $paying_amount;  // 8
        $payments[] = $account_name;   // 9
        $payments[] = $account_id;     // 10
        $payments[] = $payment_at;     // 11
        $payments[] = $payment_document; // 12

        return $payments;
    }

    public function updatePayment(Request $request)
    {
        if ($this->wantsSpaResponse($request) && !$this->userCanAccessPurchases('purchase-payment-edit')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $data = $request->all();
        $lims_payment_data = Payment::find($data['payment_id']);
        $lims_purchase_data = Purchase::find($lims_payment_data->purchase_id);
        //updating purchase table
        $amount_dif = $lims_payment_data->amount - $data['edit_amount'];
        $lims_purchase_data->paid_amount = $lims_purchase_data->paid_amount - $amount_dif;
        $balance = $lims_purchase_data->grand_total - $lims_purchase_data->paid_amount;
        if($balance > 0 || $balance < 0)
            $lims_purchase_data->payment_status = 1;
        elseif ($balance == 0)
            $lims_purchase_data->payment_status = 2;
        $lims_purchase_data->save();

        if (isset($data['payment_at'])) {
            $data['payment_at'] = normalize_to_sql_datetime($data['payment_at']);
        } else {
            $data['payment_at'] = date('Y-m-d H:i:s');
        }

        //updating payment data
        $lims_payment_data->account_id = $data['account_id'];
        $lims_payment_data->amount = $data['edit_amount'];
        $lims_payment_data->change = $data['edit_paying_amount'] - $data['edit_amount'];
        $lims_payment_data->payment_note = $data['edit_payment_note'];
        $lims_payment_data->payment_at = $data['payment_at'];
        $lims_payment_data->currency_id = $lims_purchase_data->currency_id;
        $lims_payment_data->exchange_rate = $lims_purchase_data->exchange_rate ?? 1;
        $lims_pos_setting_data = PosSetting::latest()->first();
        if($data['edit_paid_by_id'] == 1)
            $lims_payment_data->paying_method = 'Cash';
        elseif ($data['edit_paid_by_id'] == 2)
            $lims_payment_data->paying_method = 'Gift Card';
        elseif ($data['edit_paid_by_id'] == 3 && $lims_pos_setting_data->stripe_secret_key) {
            \Stripe\Stripe::setApiKey($lims_pos_setting_data->stripe_secret_key);
            $token = $data['stripeToken'];
            $amount = $data['edit_amount'];
            if($lims_payment_data->paying_method == 'Credit Card'){
                $lims_payment_with_credit_card_data = PaymentWithCreditCard::where('payment_id', $lims_payment_data->id)->first();

                \Stripe\Refund::create(array(
                  "charge" => $lims_payment_with_credit_card_data->charge_id,
                ));

                $charge = \Stripe\Charge::create([
                    'amount' => $amount * 100,
                    'currency' => 'usd',
                    'source' => $token,
                ]);

                $lims_payment_with_credit_card_data->charge_id = $charge->id;
                $lims_payment_with_credit_card_data->save();
            }
            elseif($lims_pos_setting_data->stripe_secret_key) {
                // Charge the Customer
                $charge = \Stripe\Charge::create([
                    'amount' => $amount * 100,
                    'currency' => 'usd',
                    'source' => $token,
                ]);

                $data['charge_id'] = $charge->id;
                PaymentWithCreditCard::create($data);
            }
            $lims_payment_data->paying_method = 'Credit Card';
        }
        else{
            if($lims_payment_data->paying_method == 'Cheque'){
                $lims_payment_data->paying_method = 'Cheque';
                $lims_payment_cheque_data = PaymentWithCheque::where('payment_id', $data['payment_id'])->first();
                $lims_payment_cheque_data->cheque_no = $data['edit_cheque_no'];
                $lims_payment_cheque_data->save();
            }
            else{
                $lims_payment_data->paying_method = 'Cheque';
                $data['cheque_no'] = $data['edit_cheque_no'];
                PaymentWithCheque::create($data);
            }
        }
        $lims_payment_data->save();
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Payment updated successfully')]);
        }
        return redirect('purchases')->with('message', __('db.Payment updated successfully'));
    }

    public function deletePayment(Request $request)
    {
        if ($this->wantsSpaResponse($request) && !$this->userCanAccessPurchases('purchase-payment-delete')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $lims_payment_data = Payment::find($request['id']);
        $lims_purchase_data = Purchase::where('id', $lims_payment_data->purchase_id)->first();
        $lims_purchase_data->paid_amount -= $lims_payment_data->amount;
        $balance = $lims_purchase_data->grand_total - $lims_purchase_data->paid_amount;
        if($balance > 0 || $balance < 0)
            $lims_purchase_data->payment_status = 1;
        elseif ($balance == 0)
            $lims_purchase_data->payment_status = 2;
        $lims_purchase_data->save();
        $lims_pos_setting_data = PosSetting::latest()->first();

        if($lims_payment_data->paying_method == 'Credit Card' && $lims_pos_setting_data->stripe_secret_key) {
            $lims_payment_with_credit_card_data = PaymentWithCreditCard::where('payment_id', $request['id'])->first();
            \Stripe\Stripe::setApiKey($lims_pos_setting_data->stripe_secret_key);
            \Stripe\Refund::create(array(
              "charge" => $lims_payment_with_credit_card_data->charge_id,
            ));

            $lims_payment_with_credit_card_data->delete();
        }
        elseif ($lims_payment_data->paying_method == 'Cheque') {
            $lims_payment_cheque_data = PaymentWithCheque::where('payment_id', $request['id'])->first();
            $lims_payment_cheque_data->delete();
        }
        $lims_payment_data->delete();
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Payment deleted successfully')]);
        }
        return redirect('purchases')->with('not_permitted', __('db.Payment deleted successfully'));
    }

    private function purchaseHasSale($lims_product_purchase_data)
    {
        $has_sale = false;
        foreach ($lims_product_purchase_data as $product_purchase_data) {
            $product_sale = Product_Sale::where('product_id', $product_purchase_data->product_id)
                ->select('updated_at')
                ->latest('updated_at')
                ->first();

            if (!$product_sale) {
                continue;
            }

            if ($product_sale->updated_at->gt($product_purchase_data->updated_at)) {
                $has_sale = true;
            }
        }

        return $has_sale;
    }

    public function deleteBySelection(Request $request)
    {
        $purchase_id = $request['purchaseIdArray'];
        try {
            DB::beginTransaction();
            foreach ($purchase_id as $id) {
                $role = Role::find(Auth::user()->role_id);
                if($role->hasPermissionTo('purchases-delete')){
                    $lims_purchase_data = Purchase::find($id);
                    $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();

                    if ($this->purchaseHasSale($lims_product_purchase_data)) {
                        return response()->json(['deleted' => [], 'message' =>  'Can not delete, purchase has sale!'], 403);
                    }

                    $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);


                    $lims_payment_data = Payment::where('purchase_id', $id)->get();
                    $log_data['item_description'] = '';
                    foreach ($lims_product_purchase_data as $product_purchase_data) {
                        $lims_purchase_unit_data = Unit::find($product_purchase_data->purchase_unit_id);
                        if ($lims_purchase_unit_data->operator == '*')
                            $recieved_qty = $product_purchase_data->recieved * $lims_purchase_unit_data->operation_value;
                        else
                            $recieved_qty = $product_purchase_data->recieved / $lims_purchase_unit_data->operation_value;

                        $lims_product_data = Product::find($product_purchase_data->product_id);
                        if($product_purchase_data->variant_id) {
                            $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($lims_product_data->id, $product_purchase_data->variant_id)->first();
                            $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($product_purchase_data->product_id, $product_purchase_data->variant_id, $lims_purchase_data->warehouse_id)
                                ->first();
                            $lims_product_variant_data->qty -= $recieved_qty;
                            $lims_product_variant_data->save();
                        }
                        elseif($product_purchase_data->product_batch_id) {
                            $lims_product_batch_data = ProductBatch::find($product_purchase_data->product_batch_id);
                            $lims_product_warehouse_data = Product_Warehouse::where([
                                ['product_batch_id', $product_purchase_data->product_batch_id],
                                ['warehouse_id', $lims_purchase_data->warehouse_id]
                            ])->first();

                            $lims_product_batch_data->qty -= $recieved_qty;
                            $lims_product_batch_data->save();
                        }
                        else {
                            $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($product_purchase_data->product_id, $lims_purchase_data->warehouse_id)
                                ->first();
                        }
                        //deduct imei number if available
                        if($product_purchase_data->imei_number && !str_contains($product_purchase_data->imei_number, "null")) {
                            $imei_numbers = explode(",", $product_purchase_data->imei_number);
                            $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                            foreach ($imei_numbers as $number) {
                                if (($j = array_search($number, $all_imei_numbers)) !== false) {
                                    unset($all_imei_numbers[$j]);
                                }
                            }
                            $lims_product_warehouse_data->imei_number = !empty($all_imei_numbers) ? implode(",", $all_imei_numbers) : null;
                        }

                        $lims_product_data->qty -= $recieved_qty;
                        $lims_product_warehouse_data->qty -= $recieved_qty;

                        $lims_product_warehouse_data->save();
                        $lims_product_data->save();

                        $log_data['item_description'] .= $lims_product_data->name. '-'. $recieved_qty.' '.$lims_purchase_unit_data->unit_code.'<br>';

                        $product_purchase_data->delete();
                    }
                    $lims_pos_setting_data = PosSetting::latest()->first();
                    foreach ($lims_payment_data as $payment_data) {
                        if($payment_data->paying_method == "Cheque"){
                            $payment_with_cheque_data = PaymentWithCheque::where('payment_id', $payment_data->id)->first();
                            $payment_with_cheque_data->delete();
                        }
                        elseif($payment_data->paying_method == "Credit Card" && $lims_pos_setting_data->stripe_secret_key) {
                            $payment_with_credit_card_data = PaymentWithCreditCard::where('payment_id', $payment_data->id)->first();
                            \Stripe\Stripe::setApiKey($lims_pos_setting_data->stripe_secret_key);
                            \Stripe\Refund::create(array(
                            "charge" => $payment_with_credit_card_data->charge_id,
                            ));

                            $payment_with_credit_card_data->delete();
                        }
                        $payment_data->delete();
                    }

                    $lims_purchase_data->deleted_by = Auth::id();
                    $lims_purchase_data->save();

                    //creating log
                    $log_data['action'] = 'Purchase Deleted';
                    $log_data['user_id'] = Auth::id();
                    $log_data['reference_no'] = $lims_purchase_data->reference_no;
                    $log_data['date'] = $lims_purchase_data->created_at->toDateString();
                    // $log_data['admin_email'] = config('admin_email');
                    $log_data['admin_message'] = Auth::user()->name . ' has deleted a purchase. Reference No: ' .$lims_purchase_data->reference_no;
                    $log_data['user_email'] = Auth::user()->email;
                    $log_data['user_name'] = Auth::user()->name;
                    $log_data['user_message'] = 'You just deleted a purchase. Reference No: ' .$lims_purchase_data->reference_no;
                    // $log_data['mail_setting'] = $mail_setting = MailSetting::latest()->first();
                    $this->createActivityLog($log_data);

                    $lims_purchase_data->delete();
                    $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);
                }
            }
            DB::commit();
            return response()->json(['deleted' => [], 'message' =>  'Purchase deleted successfully!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['deleted' => [], 'message' =>  $e->getMessage()]);
        }
    }

    public function destroy(Request $request, $id)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-delete')){
            $lims_purchase_data = Purchase::find($id);
            if (!$lims_purchase_data) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, ['success' => false, 'message' => __('db.Purchase not found')], 404);
                }
                return redirect('purchases')->with('not_permitted', __('db.Purchase not found'));
            }
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();

            if ($this->purchaseHasSale($lims_product_purchase_data)) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, ['success' => false, 'message' => __('db.Can not delete, purchase has sale!')], 422);
                }
                return redirect('purchases')->with('not_permitted', __('db.Can not delete, purchase has sale!'));
            }

            $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);

            $lims_payment_data = Payment::where('purchase_id', $id)->get();
            $log_data['item_description'] = '';
            foreach ($lims_product_purchase_data as $product_purchase_data) {
                $lims_purchase_unit_data = Unit::find($product_purchase_data->purchase_unit_id);
                if ($lims_purchase_unit_data->operator == '*')
                    $recieved_qty = $product_purchase_data->recieved * $lims_purchase_unit_data->operation_value;
                else
                    $recieved_qty = $product_purchase_data->recieved / $lims_purchase_unit_data->operation_value;

                $lims_product_data = Product::find($product_purchase_data->product_id);
                if($product_purchase_data->variant_id) {
                    $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($lims_product_data->id, $product_purchase_data->variant_id)->first();
                    $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($product_purchase_data->product_id, $product_purchase_data->variant_id, $lims_purchase_data->warehouse_id)
                        ->first();
                    $lims_product_variant_data->qty -= $recieved_qty;
                    $lims_product_variant_data->save();
                }
                elseif($product_purchase_data->product_batch_id) {
                    $lims_product_batch_data = ProductBatch::find($product_purchase_data->product_batch_id);
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_batch_id', $product_purchase_data->product_batch_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id]
                    ])->first();

                    $lims_product_batch_data->qty -= $recieved_qty;
                    $lims_product_batch_data->save();
                }
                else {
                    $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($product_purchase_data->product_id, $lims_purchase_data->warehouse_id)
                        ->first();
                }
                //deduct imei number if available
                if($product_purchase_data->imei_number && !str_contains($product_purchase_data->imei_number, "null")) {
                    $imei_numbers = explode(",", $product_purchase_data->imei_number);
                    $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                    foreach ($imei_numbers as $number) {
                        if (($j = array_search($number, $all_imei_numbers)) !== false) {
                            unset($all_imei_numbers[$j]);
                        }
                    }
                    $lims_product_warehouse_data->imei_number = !empty($all_imei_numbers) ? implode(",", $all_imei_numbers) : null;
                }

                $lims_product_data->qty -= $recieved_qty;
                $lims_product_warehouse_data->qty -= $recieved_qty;

                $lims_product_warehouse_data->save();
                $lims_product_data->save();

                $log_data['item_description'] .= $lims_product_data->name. '-'. $recieved_qty.' '.$lims_purchase_unit_data->unit_code.'<br>';

                $product_purchase_data->delete();
            }
            $lims_pos_setting_data = PosSetting::latest()->first();
            foreach ($lims_payment_data as $payment_data) {
                if($payment_data->paying_method == "Cheque"){
                    $payment_with_cheque_data = PaymentWithCheque::where('payment_id', $payment_data->id)->first();
                    $payment_with_cheque_data->delete();
                }
                elseif($payment_data->paying_method == "Credit Card" && $lims_pos_setting_data->stripe_secret_key) {
                    $payment_with_credit_card_data = PaymentWithCreditCard::where('payment_id', $payment_data->id)->first();
                    \Stripe\Stripe::setApiKey($lims_pos_setting_data->stripe_secret_key);
                    \Stripe\Refund::create(array(
                      "charge" => $payment_with_credit_card_data->charge_id,
                    ));

                    $payment_with_credit_card_data->delete();
                }
                $payment_data->delete();
            }

            $lims_purchase_data->deleted_by = Auth::id();
            $lims_purchase_data->save();

            //creating log
            $log_data['action'] = 'Purchase Deleted';
            $log_data['user_id'] = Auth::id();
            $log_data['reference_no'] = $lims_purchase_data->reference_no;
            $log_data['date'] = $lims_purchase_data->created_at->toDateString();
            // $log_data['admin_email'] = config('admin_email');
            $log_data['admin_message'] = Auth::user()->name . ' has deleted a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            $log_data['user_email'] = Auth::user()->email;
            $log_data['user_name'] = Auth::user()->name;
            $log_data['user_message'] = 'You just deleted a purchase. Reference No: ' .$lims_purchase_data->reference_no;
            // $log_data['mail_setting'] = $mail_setting = MailSetting::latest()->first();
            $this->createActivityLog($log_data);

            $lims_purchase_data->delete();
            $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['success' => true, 'message' => __('db.Purchase deleted successfully')]);
            }
            return redirect('purchases')->with('not_permitted', __('db.Purchase deleted successfully'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['success' => false, 'message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

    }

    public function updateFromClient(Request $request, $id)
    {
        $data = $request->except('document');
        $document = $request->document;
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

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            $data['document'] = $documentName;
        }
        //return dd($data);
        DB::beginTransaction();
        try {
            $balance = $data['grand_total'] - $data['paid_amount'];
            if ($balance < 0 || $balance > 0) {
                $data['payment_status'] = 1;
            } else {
                $data['payment_status'] = 2;
            }
            $lims_purchase_data = Purchase::find($id);
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();

            $data['created_at'] = date("Y-m-d", strtotime(str_replace("/", "-", $data['created_at'])));
            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            $recieved = $data['recieved'];
            $batch_no = $data['batch_no'];
            $expired_date = $data['expired_date'];
            $purchase_unit = $data['purchase_unit'];
            $net_unit_cost = $data['net_unit_cost'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];
            $imei_number = $new_imei_number = $data['imei_number'];
            $product_purchase = [];
            $lims_product_warehouse_data = null;

            foreach ($lims_product_purchase_data as $product_purchase_data) {

                $old_recieved_value = $product_purchase_data->recieved;
                $lims_purchase_unit_data = Unit::find($product_purchase_data->purchase_unit_id);

                if ($lims_purchase_unit_data->operator == '*') {
                    $old_recieved_value = $old_recieved_value * $lims_purchase_unit_data->operation_value;
                } else {
                    $old_recieved_value = $old_recieved_value / $lims_purchase_unit_data->operation_value;
                }
                $lims_product_data = Product::find($product_purchase_data->product_id);
                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProduct($lims_product_data->id, $product_purchase_data->variant_id)->first();
                    if($lims_product_variant_data) {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $lims_product_data->id],
                            ['variant_id', $product_purchase_data->variant_id],
                            ['warehouse_id', $lims_purchase_data->warehouse_id]
                        ])->first();
                        $lims_product_variant_data->qty -= $old_recieved_value;
                        $lims_product_variant_data->save();
                    }
                }
                elseif($product_purchase_data->product_batch_id) {
                    $product_batch_data = ProductBatch::find($product_purchase_data->product_batch_id);
                    $product_batch_data->qty -= $old_recieved_value;
                    $product_batch_data->save();

                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['product_batch_id', $product_purchase_data->product_batch_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                else {
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                if($product_purchase_data->imei_number) {
                    $position = array_search($lims_product_data->id, $product_id);
                    if($imei_number[$position]) {
                        $prev_imei_numbers = explode(",", $product_purchase_data->imei_number);
                        $new_imei_numbers = explode(",", $imei_number[$position]);
                        foreach ($prev_imei_numbers as $prev_imei_number) {
                            if(($pos = array_search($prev_imei_number, $new_imei_numbers)) !== false) {
                                unset($new_imei_numbers[$pos]);
                            }
                        }
                        $new_imei_number[$position] = implode(",", $new_imei_numbers);
                    }
                }
                $lims_product_data->qty -= $old_recieved_value;
                if($lims_product_warehouse_data) {
                    $lims_product_warehouse_data->qty -= $old_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                $lims_product_data->save();
                $product_purchase_data->delete();
            }

            foreach ($product_id as $key => $pro_id) {
                $price = null;
                $lims_purchase_unit_data = Unit::where('unit_name', $purchase_unit[$key])->first();
                if ($lims_purchase_unit_data->operator == '*') {
                    $new_recieved_value = $recieved[$key] * $lims_purchase_unit_data->operation_value;
                } else {
                    $new_recieved_value = $recieved[$key] / $lims_purchase_unit_data->operation_value;
                }

                $lims_product_data = Product::find($pro_id);
                //dealing with product barch
                if($batch_no[$key]) {
                    $lineExpiredDate = !empty($expired_date[$key]) ? $expired_date[$key] : null;
                    $product_batch_data = ProductBatch::where([
                                            ['product_id', $lims_product_data->id],
                                            ['batch_no', $batch_no[$key]]
                                        ])->first();
                    if($product_batch_data) {
                        $product_batch_data->qty += $new_recieved_value;
                        $product_batch_data->expired_date = $lineExpiredDate;
                        $product_batch_data->save();
                    }
                    else {
                        $product_batch_data = ProductBatch::create([
                                                'product_id' => $lims_product_data->id,
                                                'batch_no' => $batch_no[$key],
                                                'expired_date' => $lineExpiredDate,
                                                'qty' => $new_recieved_value
                                            ]);
                    }
                    $product_purchase['product_batch_id'] = $product_batch_data->id;
                }
                else
                    $product_purchase['product_batch_id'] = null;

                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                    if($lims_product_variant_data) {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['variant_id', $lims_product_variant_data->variant_id],
                            ['warehouse_id', $data['warehouse_id']]
                        ])->first();
                        $product_purchase['variant_id'] = $lims_product_variant_data->variant_id;
                        //add quantity to product variant table
                        $lims_product_variant_data->qty += $new_recieved_value;
                        $lims_product_variant_data->save();
                    }
                }
                else {
                    $product_purchase['variant_id'] = null;
                    if($product_purchase['product_batch_id']) {
                        //checking for price
                        $lims_product_warehouse_data = Product_Warehouse::where([
                                                        ['product_id', $pro_id],
                                                        ['warehouse_id', $data['warehouse_id'] ],
                                                    ])
                                                    ->whereNotNull('price')
                                                    ->select('price')
                                                    ->first();
                        if($lims_product_warehouse_data)
                            $price = $lims_product_warehouse_data->price;

                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['product_batch_id', $product_purchase['product_batch_id'] ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                }

                $lims_product_data->qty += $new_recieved_value;
                if($lims_product_warehouse_data){
                    $lims_product_warehouse_data->qty += $new_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $pro_id;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                    if($lims_product_data->is_variant && $lims_product_variant_data)
                        $lims_product_warehouse_data->variant_id = $lims_product_variant_data->variant_id;
                    $lims_product_warehouse_data->warehouse_id = $data['warehouse_id'];
                    $lims_product_warehouse_data->qty = $new_recieved_value;
                    if($price)
                        $lims_product_warehouse_data->price = $price;
                }
                //dealing with imei numbers
                if($imei_number[$key]) {
                    if($lims_product_warehouse_data->imei_number) {
                        $lims_product_warehouse_data->imei_number .= ',' . $new_imei_number[$key];
                    }
                    else {
                        $lims_product_warehouse_data->imei_number = $new_imei_number[$key];
                    }
                }

                $lims_product_data->save();
                $lims_product_warehouse_data->save();

                $product_purchase['purchase_id'] = $id ;
                $product_purchase['product_id'] = $pro_id;
                $product_purchase['qty'] = $qty[$key];
                $product_purchase['recieved'] = $recieved[$key];
                $product_purchase['purchase_unit_id'] = $lims_purchase_unit_data->id;
                $product_purchase['net_unit_cost'] = $net_unit_cost[$key];
                $product_purchase['discount'] = $discount[$key];
                $product_purchase['tax_rate'] = $tax_rate[$key];
                $product_purchase['tax'] = $tax[$key];
                $product_purchase['total'] = $total[$key];
                $product_purchase['imei_number'] = $imei_number[$key];
                ProductPurchase::create($product_purchase);
            }
            DB::commit();
        }
        catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()]);
        }
        $lims_purchase_data->update($data);
        return redirect('purchases')->with('message', __('db.Purchase updated successfully'));
    }

    public function showDeletedPurchases(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role_id > 2) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_deleted_data = Purchase::onlyTrashed()
            ->with(['user', 'supplier', 'warehouse', 'deleter'])
            ->orderByDesc('deleted_at')
            ->get();

        if ($this->wantsSpaResponse($request)) {
            $decimals = (int) (config('decimal') ?? 2);
            return $this->spaJson($request, [
                'data' => $lims_deleted_data->map(function (Purchase $purchase) use ($decimals) {
                    $paid = (float) ($purchase->paid_amount ?? 0);
                    return [
                        'id' => $purchase->id,
                        'date' => $purchase->created_at ? $purchase->created_at->format('d-m-Y H:i:s') : '—',
                        'reference_no' => $purchase->reference_no,
                        'created_by_name' => $purchase->user->name ?? '—',
                        'supplier_name' => $purchase->supplier->name ?? 'N/A',
                        'warehouse_name' => $purchase->warehouse->name ?? '—',
                        'payment_status_label' => $purchase->payment_status == 2 ? 'Paid' : 'Due',
                        'grand_total' => round((float) $purchase->grand_total, $decimals),
                        'due' => round(max(0, (float) $purchase->grand_total - $paid), $decimals),
                        'deleted_by_name' => $purchase->deleter->name ?? 'System',
                        'deleted_at' => $purchase->deleted_at ? $purchase->deleted_at->format('d-m-Y H:i:s') : '—',
                    ];
                })->values(),
            ]);
        }

        return view('backend.purchase.deleted-data', compact('lims_deleted_data'));
    }

    public function forceDeleteSelected(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role_id > 2) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }
            return back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $ids = $request->input('ids', $request->input('purchaseIdArray', []));

        if (!empty($ids)) {
            Purchase::withTrashed()->whereIn('id', $ids)->forceDelete();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'Selected purchases deleted permanently!']);
            }
            return back()->with('not_permitted', 'Selected purchases deleted permanently!');
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => 'No purchases selected!'], 422);
        }

        return back()->with('not_permitted', 'No purchases selected!');
    }

    public function supplierPurchase($supplier_id)
    {
        $purchases = Purchase::with('supplier')
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNotIn('purchase_type', ['opening balance', 'initial stock'])
                ->orWhereNull('purchase_type');
            })
            ->where('supplier_id', $supplier_id)
            ->latest()
            ->get()
            ->map(function ($purchase) {
                $purchaseStatus = match($purchase->status) {
                    1 => 'Received',
                    2 => 'Partial',
                    3 => 'Pending',
                    default => 'Ordered',
                };

                $paymentStatus = $purchase->paid_amount >= $purchase->grand_total ? 'Paid' :
                                ($purchase->paid_amount > 0 ? 'Partial' : 'Due');

                $paymentDue = number_format($purchase->grand_total - $purchase->paid_amount, 2);

                $warehouseName = $purchase->warehouse_id ? optional(Warehouse::find($purchase->warehouse_id))->name : '-';
                $supplier = $purchase->supplier;

                return [
                    'id' => $purchase->id,
                    'date' => $purchase->created_at->format('Y-m-d'),
                    'reference' => $purchase->reference_no,
                    'warehouse' => $warehouseName,
                    'purchase_status' => $purchaseStatus,
                    'payment_status' => $paymentStatus,
                    'grand_total' => number_format($purchase->grand_total, 2),
                    'paid_amount' => number_format($purchase->paid_amount, 2),
                    'payment_due' => $paymentDue,
                    'note' => $purchase->note,
                    'currency' => $purchase->currency ?? null,
                    'document' => $purchase->document ?? null,
                    'supplier_name' => $supplier->name ?? '-',
                    'supplier_company' => $supplier->company_name ?? '-',
                    'supplier_address' => $supplier->address ?? '-',
                    'due_date'     => $purchase->due_date ?? '-',
                    'payment_term' => $purchase->pay_term_no
                                        ? $purchase->pay_term_no . ' ' . $purchase->pay_term_period
                                        : '-',
                ];
            });

        return response()->json(['data' => $purchases]);
    }

    protected function userCanAccessPurchases(string $permission = 'purchases-index'): bool
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
        return $user->can($permission) || $user->can('purchases-index') || $user->can('purchases-add') || $user->can('purchases-edit');
    }

    protected function userCanImportPurchases(): bool
    {
        return $this->userCanAccessPurchases('purchases-import')
            || $this->userCanAccessPurchases('purchases-add');
    }

    protected function purchaseQuery()
    {
        $query = Schema::hasColumn((new Purchase)->getTable(), 'deleted_at') ? Purchase::query() : Purchase::withoutGlobalScopes();
        return $query->with(['supplier', 'warehouse', 'user']);
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

    protected function returnedAmount(int $purchaseId): float
    {
        if (!Schema::hasTable('return_purchases') || !Schema::hasColumn('return_purchases', 'purchase_id')) {
            return 0.0;
        }
        return (float) DB::table('return_purchases')->where('purchase_id', $purchaseId)->sum('grand_total');
    }

    public function suggestPurchaseBatch(Request $request)
    {
        if (!$this->userCanAccessPurchases('purchases-add') && !$this->userCanAccessPurchases('purchases-edit')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $productId = (int) $request->input('product_id');
        $product = Product::find($productId);
        if (!$product) {
            return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
        }
        if (!$product->is_batch) {
            return $this->spaJson($request, [
                'batch_no' => '',
                'product_batch_id' => null,
                'is_new_batch' => false,
                'expired_date' => null,
            ]);
        }

        $resolved = $this->resolvePurchaseBatchForLine(
            $productId,
            (float) $request->input('net_unit_cost', 0),
            (float) $request->input('net_unit_price', 0)
        );

        return $this->spaJson($request, $resolved);
    }

    /**
     * Reuse an existing batch when cost and sale price match a prior purchase line;
     * otherwise assign the next incremental batch number for the product.
     */
    protected function resolvePurchaseBatchForLine(int $productId, float $netUnitCost, float $netUnitPrice): array
    {
        $cost = round($netUnitCost, 2);
        $price = round($netUnitPrice, 2);

        $existingPurchase = ProductPurchase::query()
            ->where('product_id', $productId)
            ->whereNotNull('product_batch_id')
            ->whereRaw('ROUND(net_unit_cost, 2) = ?', [$cost])
            ->whereRaw('ROUND(net_unit_price, 2) = ?', [$price])
            ->orderByDesc('id')
            ->first();

        if ($existingPurchase) {
            $batch = ProductBatch::find($existingPurchase->product_batch_id);
            if ($batch) {
                return [
                    'batch_no' => $batch->batch_no,
                    'product_batch_id' => $batch->id,
                    'is_new_batch' => false,
                    'expired_date' => $batch->expired_date
                        ? date('Y-m-d', strtotime($batch->expired_date))
                        : null,
                ];
            }
        }

        return [
            'batch_no' => $this->nextPurchaseBatchNumber($productId),
            'product_batch_id' => null,
            'is_new_batch' => true,
            'expired_date' => null,
        ];
    }

    protected function nextPurchaseBatchNumber(int $productId): string
    {
        $maxSequence = 0;
        $batches = ProductBatch::where('product_id', $productId)->pluck('batch_no');
        foreach ($batches as $batchNo) {
            if (is_numeric($batchNo)) {
                $maxSequence = max($maxSequence, (int) $batchNo);
                continue;
            }
            if (preg_match('/(\d+)$/', (string) $batchNo, $matches)) {
                $maxSequence = max($maxSequence, (int) $matches[1]);
            }
        }

        return (string) ($maxSequence + 1);
    }

    protected function normalizePurchaseHeaderTotals(array &$data): void
    {
        $productIds = $data['product_id'] ?? [];
        $data['item'] = isset($data['item']) ? (int) $data['item'] : count($productIds);
        $data['total_qty'] = $data['total_qty'] ?? array_sum($data['qty'] ?? []);
        $data['total_discount'] = $data['total_discount'] ?? array_sum($data['discount'] ?? []);
        $data['total_tax'] = $data['total_tax'] ?? array_sum($data['tax'] ?? []);
        $data['total_cost'] = $data['total_cost'] ?? array_sum($data['subtotal'] ?? []);
        if (!isset($data['grand_total'])) {
            $data['grand_total'] = (float) $data['total_cost'] + (float) ($data['order_tax'] ?? 0) + (float) ($data['shipping_cost'] ?? 0) - (float) ($data['order_discount'] ?? 0);
        }
    }

    protected function resolvePurchaseUnit(?string $unitName, ?int $productId = null, ?int $unitId = null): Unit
    {
        if ($unitId && ($unit = Unit::find($unitId))) {
            return $unit;
        }
        if ($productId) {
            $product = Product::find($productId);
            if ($product?->purchase_unit_id && ($unit = Unit::find($product->purchase_unit_id))) {
                return $unit;
            }
        }
        $name = trim((string) $unitName);
        if ($name !== '') {
            $lower = strtolower($name);
            $unit = Unit::where('unit_name', $name)->first()
                ?? Unit::where('unit_code', $name)->first()
                ?? Unit::whereRaw('LOWER(unit_name) = ?', [$lower])->first()
                ?? Unit::whereRaw('LOWER(unit_code) = ?', [$lower])->first();
            if ($unit) {
                return $unit;
            }
        }
        if (isset($product) && $product?->unit_id && ($unit = Unit::find($product->unit_id))) {
            return $unit;
        }
        $unit = Unit::where('is_active', true)->orderBy('id')->first() ?? Unit::orderBy('id')->first();
        if (!$unit) {
            throw new \Exception(__('db.Purchase unit not found'));
        }
        return $unit;
    }

    protected function purchaseFormMeta(): array
    {
        $user = Auth::user();
        $warehouseQuery = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $warehouseQuery->where('is_active', true);
        }
        if ($user && $user->role_id > 2 && $user->warehouse_id) {
            $warehouseQuery->where('id', $user->warehouse_id);
        }
        $currencyQuery = Currency::query();
        if (Schema::hasColumn('currencies', 'is_active')) {
            $currencyQuery->where('is_active', true);
        }
        $defaultCurrency = Currency::where('exchange_rate', 1)->first() ?? $currencyQuery->first();
        $supplierQuery = Supplier::query();
        if (Schema::hasColumn('suppliers', 'is_active')) {
            $supplierQuery->where('is_active', true);
        }
        $taxQuery = Tax::query();
        if (Schema::hasColumn('taxes', 'is_active')) {
            $taxQuery->where('is_active', true);
        }
        $accountQuery = Account::query();
        if (Schema::hasColumn('accounts', 'is_active')) {
            $accountQuery->where('is_active', true);
        }
        $supplierColumns = ['id', 'name', 'company_name'];
        if (Schema::hasColumn('suppliers', 'pay_term_no')) {
            $supplierColumns[] = 'pay_term_no';
        }
        if (Schema::hasColumn('suppliers', 'pay_term_period')) {
            $supplierColumns[] = 'pay_term_period';
        }
        return [
            'suppliers' => $supplierQuery->get($supplierColumns),
            'warehouses' => $warehouseQuery->get(['id', 'name']),
            'taxes' => $taxQuery->get(['id', 'name', 'rate']),
            'currencies' => $currencyQuery->get(['id', 'code', 'exchange_rate']),
            'accounts' => $accountQuery->get(
                Schema::hasColumn('accounts', 'is_default')
                    ? ['id', 'name', 'is_default']
                    : ['id', 'name']
            ),
            'default_currency_id' => $defaultCurrency?->id,
            'default_exchange_rate' => $defaultCurrency?->exchange_rate ?? 1,
            'reference_no' => 'pr-' . date('Ymd') . '-' . date('his'),
            'status_options' => [
                ['value' => 1, 'label' => 'Received'],
                ['value' => 2, 'label' => 'Partial'],
                ['value' => 3, 'label' => 'Pending'],
                ['value' => 4, 'label' => 'Ordered'],
            ],
        ];
    }

    protected function formatPurchaseRow(Purchase $purchase): array
    {
        $rate = $purchase->exchange_rate ?: 1;
        $returned = $this->returnedAmount((int) $purchase->id);
        $paid = (float) ($purchase->paid_amount ?? 0);
        $due = max(0, ($purchase->grand_total - $returned - $paid) / $rate);
        $statusLabels = [1 => 'Received', 2 => 'Partial', 3 => 'Pending', 4 => 'Ordered'];
        $decimals = (int) (config('decimal') ?? 2);
        return [
            'id' => $purchase->id,
            'date' => $purchase->created_at ? $purchase->created_at->format('d-m-Y') : '—',
            'reference_no' => $purchase->reference_no,
            'created_by_name' => $purchase->user->name ?? '—',
            'supplier_name' => $purchase->supplier->name ?? '—',
            'warehouse_name' => $purchase->warehouse->name ?? '—',
            'status' => $purchase->status,
            'status_label' => $statusLabels[$purchase->status] ?? 'Unknown',
            'grand_total' => round($purchase->grand_total / $rate, $decimals),
            'returned_amount' => round($returned / $rate, $decimals),
            'paid_amount' => round($paid / $rate, $decimals),
            'due' => round($due, $decimals),
            'payment_status' => $purchase->payment_status,
            'payment_status_label' => $purchase->payment_status == 2 ? 'Paid' : 'Due',
            'currency_id' => $purchase->currency_id,
            'currency_code' => $purchase->currency->code ?? 'USD',
            'exchange_rate' => (float) ($purchase->exchange_rate ?: 1),
        ];
    }

    public function purchaseDetails(Request $request, $id)
    {
        if (!$this->wantsSpaResponse($request)) {
            abort(404);
        }
        if (!$this->userCanAccessPurchases('purchases-index')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $purchase = $this->purchaseQuery()
                ->with(['supplier', 'warehouse', 'user', 'currency'])
                ->find($id);
            if (!$purchase) {
                return $this->spaJson($request, ['message' => __('db.Purchase not found')], 404);
            }

            $rate = $purchase->exchange_rate ?: 1;
            $returned = $this->returnedAmount((int) $purchase->id);
            $paid = (float) ($purchase->paid_amount ?? 0);
            $decimals = (int) (config('decimal') ?? 2);
            $statusLabels = [1 => 'Received', 2 => 'Partial', 3 => 'Pending', 4 => 'Ordered'];

            $lines = ProductPurchase::where('purchase_id', $id)->get()->map(function ($line) use ($decimals) {
                $product = Product::find($line->product_id);
                $unit = Unit::find($line->purchase_unit_id);
                $batch = $line->product_batch_id
                    ? ProductBatch::select('batch_no', 'expired_date')->find($line->product_batch_id)
                    : null;

                return [
                    'product' => ($product->name ?? '—').' ['.($product->code ?? '').']',
                    'batch_no' => $batch->batch_no ?? 'N/A',
                    'qty' => number_format((float) $line->qty, $decimals, '.', ''),
                    'unit_code' => $unit->unit_code ?? '',
                    'returned_qty' => number_format((float) $line->return_qty, $decimals, '.', ''),
                    'unit_cost' => number_format((float) ($line->qty ? $line->total / $line->qty : 0), $decimals, '.', ''),
                    'tax' => number_format((float) $line->tax, $decimals, '.', ''),
                    'tax_rate' => number_format((float) $line->tax_rate, $decimals, '.', ''),
                    'discount' => number_format((float) $line->discount, $decimals, '.', ''),
                    'subtotal' => number_format((float) $line->total, $decimals, '.', ''),
                ];
            })->values();

            return $this->spaJson($request, [
                'purchase' => [
                    'id' => $purchase->id,
                    'date' => $purchase->created_at ? $purchase->created_at->format(config('date_format', 'd-m-Y')) : '—',
                    'reference_no' => $purchase->reference_no,
                    'status_label' => $statusLabels[$purchase->status] ?? 'Unknown',
                    'currency_code' => $purchase->currency->code ?? 'N/A',
                    'exchange_rate' => number_format((float) $rate, $decimals, '.', ''),
                    'pay_term' => $purchase->pay_term_no
                        ? $purchase->pay_term_no.' '.$purchase->pay_term_period
                        : null,
                    'due_date' => $purchase->due_date
                        ? date(config('date_format', 'd-m-Y'), strtotime($purchase->due_date))
                        : null,
                    'document' => $purchase->document,
                    'note' => $purchase->note ?? '',
                    'created_by' => $purchase->user->name ?? '—',
                    'created_at' => $purchase->created_at?->format('Y-m-d H:i:s'),
                    'supplier' => [
                        'name' => $purchase->supplier->name ?? '',
                        'company_name' => $purchase->supplier->company_name ?? '',
                        'email' => $purchase->supplier->email ?? '',
                        'phone_number' => $purchase->supplier->phone_number ?? '',
                        'address' => $purchase->supplier->address ?? '',
                        'city' => $purchase->supplier->city ?? '',
                    ],
                    'warehouse' => [
                        'name' => $purchase->warehouse->name ?? '',
                        'phone' => $purchase->warehouse->phone ?? '',
                        'address' => $purchase->warehouse->address ?? '',
                    ],
                    'order_tax' => number_format((float) ($purchase->order_tax ?? 0) / $rate, $decimals, '.', ''),
                    'order_tax_rate' => number_format((float) ($purchase->order_tax_rate ?? 0), $decimals, '.', ''),
                    'order_discount' => number_format((float) ($purchase->order_discount ?? 0) / $rate, $decimals, '.', ''),
                    'shipping_cost' => number_format((float) ($purchase->shipping_cost ?? 0) / $rate, $decimals, '.', ''),
                    'grand_total' => number_format((float) $purchase->grand_total / $rate, $decimals, '.', ''),
                    'paid_amount' => number_format($paid / $rate, $decimals, '.', ''),
                    'returned_amount' => number_format($returned / $rate, $decimals, '.', ''),
                    'due' => number_format(max(0, ($purchase->grand_total - $returned - $paid) / $rate), $decimals, '.', ''),
                ],
                'lines' => $lines,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load purchase details'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function productSearch(Request $request)
    {
        if (!$this->userCanAccessPurchases('purchases-add')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $term = trim((string) $request->input('term', ''));
        if (strlen($term) < 3) {
            return $this->spaJson($request, []);
        }
        $standard = Product::ActiveStandard()->where(function ($q) { $q->whereNull('is_variant')->orWhere('is_variant', 0); })
            ->where(function ($q) use ($term) { $q->where('name', 'LIKE', "%{$term}%")->orWhere('code', 'LIKE', "%{$term}%"); })
            ->select('id', 'name', 'code', 'cost', 'price', 'tax_id', 'is_variant', 'is_batch', 'purchase_unit_id', 'profit_margin', 'profit_margin_type')->limit(20)->get();
        $variantParents = Product::ActiveStandard()->where('is_variant', 1)
            ->where(function ($q) use ($term) { $q->where('name', 'LIKE', "%{$term}%")->orWhere('code', 'LIKE', "%{$term}%"); })
            ->select('id', 'name', 'code', 'cost', 'price', 'tax_id', 'is_variant', 'is_batch', 'purchase_unit_id', 'profit_margin', 'profit_margin_type')->limit(20)->get();
        $variantParentIds = Product::ActiveStandard()->join('product_variants', 'products.id', '=', 'product_variants.product_id')
            ->where('products.is_variant', 1)->where('product_variants.item_code', 'LIKE', "%{$term}%")->pluck('products.id');
        $variantByCode = Product::ActiveStandard()->whereIn('id', $variantParentIds)
            ->select('id', 'name', 'code', 'cost', 'price', 'tax_id', 'is_variant', 'is_batch', 'purchase_unit_id', 'profit_margin', 'profit_margin_type')->get();
        $merged = $standard->merge($variantParents)->merge($variantByCode)->unique('id')->values();
        $variantCounts = ProductVariant::whereIn('product_id', $merged->pluck('id'))->select('product_id', DB::raw('COUNT(*) as cnt'))->groupBy('product_id')->pluck('cnt', 'product_id');
        $taxRates = Tax::whereIn('id', $merged->pluck('tax_id')->filter()->unique())->pluck('rate', 'id');
        $payload = $merged->map(function ($p) use ($taxRates, $variantCounts, $variantParentIds, $term) {
            $isVariant = (bool) $p->is_variant;
            return [
                'id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'cost' => $p->cost,
                'price' => $p->price,
                'profit_margin' => $p->profit_margin,
                'profit_margin_type' => $p->profit_margin_type ?? 'percentage',
                'is_batch' => (bool) ($p->is_batch ?? false),
                'tax_rate' => $p->tax_id ? (float) ($taxRates[$p->tax_id] ?? 0) : 0,
                'purchase_unit_id' => $p->purchase_unit_id,
                'is_variant' => $isVariant,
                'variant_count' => $isVariant ? (int) ($variantCounts[$p->id] ?? 0) : 0,
                'matched_variant_code' => $isVariant && $variantParentIds->contains($p->id) ? $term : null,
            ];
        })->values()->all();
        return $this->spaJson($request, $payload);
    }

    public function productVariants(Request $request, $productId)
    {
        if (!$this->userCanAccessPurchases('purchases-add')) {
            return $this->spaJson($request, ['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $product = Product::ActiveStandard()->find($productId);
        if (!$product || !$product->is_variant) {
            return $this->spaJson($request, ['message' => __('db.Product not found')], 404);
        }
        $taxRate = $product->tax_id ? (float) (Tax::find($product->tax_id)?->rate ?? 0) : 0;
        $variants = DB::table('product_variants')->join('variants', 'product_variants.variant_id', '=', 'variants.id')
            ->where('product_variants.product_id', $productId)->orderBy('product_variants.position')
            ->select('product_variants.id', 'product_variants.variant_id', 'product_variants.item_code', 'product_variants.additional_cost', 'product_variants.additional_price', 'product_variants.qty', 'variants.name as variant_name')
            ->get()->map(function ($v) use ($product, $taxRate) {
                return [
                    'id' => $v->id, 'variant_id' => $v->variant_id, 'item_code' => $v->item_code, 'variant_name' => $v->variant_name,
                    'name' => $product->name . ' (' . $v->variant_name . ')',
                    'cost' => (float) $product->cost + (float) ($v->additional_cost ?? 0),
                    'price' => (float) $product->price + (float) ($v->additional_price ?? 0),
                    'qty' => (float) ($v->qty ?? 0), 'tax_rate' => $taxRate,
                    'profit_margin' => $product->profit_margin, 'profit_margin_type' => $product->profit_margin_type ?? 'percentage',
                ];
            })->values()->all();
        return $this->spaJson($request, [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'purchase_unit_id' => $product->purchase_unit_id,
                'is_batch' => (bool) ($product->is_batch ?? false),
            ],
            'variants' => $variants,
        ]);
    }

}
