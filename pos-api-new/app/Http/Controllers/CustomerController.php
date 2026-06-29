<?php

namespace App\Http\Controllers;

use Mail;
use Stripe\Stripe;
use App\Models\Sale;
use App\Models\User;
use App\Models\Point;
use App\Models\Account;
use App\Models\Deposit;
use App\Models\Payment;
use App\Models\Returns;
use App\Models\Customer;
use App\Models\GiftCard;
use App\Models\Supplier;
use App\Models\PosSetting;
use App\Models\CustomField;
use App\Models\MailSetting;
use App\Models\RewardPoint;
use App\Mail\CustomerCreate;
use App\Mail\SupplierCreate;
use App\Models\CashRegister;
use App\Models\DiscountPlan;
use Illuminate\Http\Request;
use App\Mail\CustomerDeposit;
use App\Models\CustomerGroup;
use Illuminate\Support\Carbon;
use App\Enums\CustomerTypeEnum;
use App\Models\WhatsappSetting;
use Illuminate\Validation\Rule;
use App\Models\PaymentWithCheque;
use App\Enums\RewardPointTypeEnum;
use App\Models\RewardPointSetting;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Enums\DiscountPlanTypeEnum;
use App\Models\PaymentWithGiftCard;
use App\Models\DiscountPlanCustomer;
use App\Models\GeneralSetting;
use App\Models\InvoiceSetting;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Illuminate\Support\Facades\Auth;
use App\Models\PaymentWithCreditCard;
use App\Models\Warehouse;
use Spatie\Permission\Models\Permission;

class CustomerController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\MailInfo;
    use SpaResponse;

    protected function userCanAccessCustomers(string $action = 'index'): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        if (!$role) {
            return false;
        }

        $permissionMap = [
            'index' => 'customers-index',
            'add' => 'customers-add',
            'edit' => 'customers-edit',
            'delete' => 'customers-delete',
            'import' => 'customers-import',
        ];

        return $role->hasPermissionTo($permissionMap[$action] ?? 'customers-index');
    }

    protected function denyCustomerAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function customerTableFieldNames(): array
    {
        $custom_fields = CustomField::where([
            ['belongs_to', 'customer'],
            ['is_table', true],
        ])->pluck('name');

        $field_name = [];
        foreach ($custom_fields as $fieldName) {
            $field_name[] = str_replace(' ', '_', strtolower($fieldName));
        }

        return $field_name;
    }

    protected function formatCustomFieldsForSpa()
    {
        return CustomField::where('belongs_to', 'customer')->get()->map(function (CustomField $field) {
            $fieldName = str_replace(' ', '_', strtolower($field->name));

            return [
                'id' => $field->id,
                'name' => $field->name,
                'field_name' => $fieldName,
                'type' => $field->type,
                'option_value' => $field->option_value,
                'default_value' => $field->default_value,
                'is_required' => (bool) $field->is_required,
            ];
        })->values();
    }

    protected function calculateCustomerDue(Customer $customer): float
    {
        $opening_balance_amount = $customer->opening_balance ?? 0;
        $total_sales_amount = Sale::where(function ($q) {
            $q->where('sale_type', '!=', 'opening balance')
                ->orWhereNull('sale_type');
        })
            ->where('customer_id', $customer->id)
            ->where('sale_status', 1)
            ->whereNull('deleted_at')
            ->sum('grand_total');

        if ($total_sales_amount == 0) {
            $total_paid_amount = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
                ->where('sales.customer_id', $customer->id)
                ->where('sales.sale_status', 1)
                ->whereNull('payments.return_id')
                ->whereNull('sales.deleted_at')
                ->sum('payments.amount');

            return $opening_balance_amount - $total_paid_amount;
        }

        $total_paid_amount = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
            ->where('sales.customer_id', $customer->id)
            ->where('sales.sale_status', 1)
            ->whereNull('payments.return_id')
            ->whereNull('sales.deleted_at')
            ->sum('payments.amount');

        $total_returns_amount = Returns::where('customer_id', $customer->id)
            ->sum('grand_total');

        $total_refund = Payment::join('returns', 'returns.id', '=', 'payments.return_id')
            ->where('returns.customer_id', $customer->id)
            ->sum('payments.amount');

        return $opening_balance_amount
            + $total_sales_amount
            - $total_paid_amount
            - $total_returns_amount
            + $total_refund;
    }

    protected function formatCustomerForSpa(Customer $customer, array $field_names): array
    {
        $customer->loadMissing(['customerGroup', 'discountPlans']);

        $customer_details = e($customer->name);
        if ($customer->company_name) {
            $customer_details .= '<br>' . e($customer->company_name);
        }
        if ($customer->email) {
            $customer_details .= '<br>' . e($customer->email);
        }
        $customer_details .= '<br>' . e($customer->phone_number) . '<br>' . e($customer->address) . '<br>' . e($customer->city);
        if ($customer->country) {
            $customer_details .= '<br>' . e($customer->country);
        }

        $discount_plan = '';
        foreach ($customer->discountPlans as $index => $discount_plan_item) {
            $discount_plan .= ($index ? ', ' : '') . $discount_plan_item->name;
        }

        $row = [
            'id' => $customer->id,
            'name' => $customer->name,
            'customer_group' => $customer->customerGroup->name ?? '',
            'customer_group_id' => $customer->customer_group_id,
            'customer_details' => $customer_details,
            'discount_plan' => $discount_plan,
            'reward_point' => $customer->points,
            'deposited_balance' => number_format($customer->deposit - $customer->expense, 2),
            'total_due' => number_format($this->calculateCustomerDue($customer), 2),
            'company_name' => $customer->company_name,
            'email' => $customer->email,
            'phone_number' => $customer->phone_number,
            'wa_number' => $customer->wa_number,
            'tax_no' => $customer->tax_no,
            'address' => $customer->address,
            'city' => $customer->city,
            'state' => $customer->state,
            'postal_code' => $customer->postal_code,
            'country' => $customer->country,
            'opening_balance' => $customer->opening_balance,
            'credit_limit' => $customer->credit_limit,
            'pay_term_no' => $customer->pay_term_no,
            'pay_term_period' => $customer->pay_term_period,
            'type' => $customer->type,
            'user_id' => $customer->user_id,
        ];

        foreach ($field_names as $field_name) {
            $row[$field_name] = $customer->$field_name;
        }

        return $row;
    }

    protected function customerIndexMetadata(): array
    {
        $lims_account_list = Account::where('is_active', true)->get();
        $lims_gift_card_list = GiftCard::where('is_active', true)->get();
        $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
        $lims_pos_setting_data = PosSetting::latest()->first();
        $options = $lims_pos_setting_data
            ? explode(',', $lims_pos_setting_data->payment_options)
            : [];

        return [
            'lims_account_list' => $lims_account_list,
            'lims_gift_card_list' => $lims_gift_card_list,
            'lims_reward_point_setting_data' => $lims_reward_point_setting_data,
            'lims_pos_setting_data' => $lims_pos_setting_data,
            'options' => $options,
            'custom_fields' => $this->formatCustomFieldsForSpa(),
            'field_name' => $this->customerTableFieldNames(),
            'lims_customer_group_all' => CustomerGroup::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'customer_types' => array_map(
                fn (string $type) => ['value' => $type, 'label' => ucfirst($type)],
                CustomerTypeEnum::toArray()
            ),
        ];
    }

    protected function spaSuccess(Request $request, string $message, array $extra = [], int $status = 200)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(['message' => strip_tags($message)], $extra), $status);
        }

        return null;
    }

    /** True only for explicit truthy checkbox values (not bare key presence). */
    protected function requestFlagEnabled(Request $request, string $key): bool
    {
        if (!$request->has($key)) {
            return false;
        }

        return in_array($request->input($key), [1, '1', true, 'true', 'on', 'yes'], true);
    }

    protected function customerAttributesFromRequest(array $data): array
    {
        return collect($data)->only((new Customer)->getFillable())->all();
    }

    protected function supplierAttributesFromCustomerData(array $data): array
    {
        $attrs = collect($data)->only((new Supplier)->getFillable())->all();
        if (empty($attrs['vat_number']) && !empty($data['tax_no'])) {
            $attrs['vat_number'] = $data['tax_no'];
        }

        return $attrs;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessCustomers('index')) {
            return $this->denyCustomerAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $field_names = $this->customerTableFieldNames();
            $customers = Customer::with(['customerGroup', 'discountPlans'])
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (Customer $customer) => $this->formatCustomerForSpa($customer, $field_names));

            return $this->spaJson($request, array_merge(
                ['customers' => $customers],
                $this->customerIndexMetadata()
            ));
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('customers-index')){
            $permissions = Role::findByName($role->name)->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';
            $custom_fields = CustomField::where([
                                ['belongs_to', 'customer'],
                                ['is_table', true]
                            ])->pluck('name');
            $field_name = [];
            foreach($custom_fields as $fieldName) {
                $field_name[] = str_replace(" ", "_", strtolower($fieldName));
            }

            $lims_account_list = Account::where('is_active', true)->get();
            $lims_gift_card_list = GiftCard::where("is_active", true)->get();
            $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
            $lims_pos_setting_data = PosSetting::latest()->first();
            if($lims_pos_setting_data)
                $options = explode(',', $lims_pos_setting_data->payment_options);
            else
                $options = [];

            return view('backend.customer.index', compact('all_permission', 'custom_fields', 'field_name','options', 'lims_reward_point_setting_data', 'lims_gift_card_list', 'lims_account_list', 'lims_pos_setting_data'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function customerData(Request $request)
    {
        $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
        $q = Customer::where('is_active', true);
        $totalData = $q->count();
        $totalFiltered = $totalData;

        if($request->input('length') != -1)
            $limit = $request->input('length');
        else
            $limit = $totalData;
        $start = $request->input('start');
        $order = 'created_at';
        $dir = $request->input('order.0.dir');
        //fetching custom fields data
        $custom_fields = CustomField::where([
                        ['belongs_to', 'customer'],
                        ['is_table', true]
                    ])->pluck('name');
        $field_names = [];
        foreach($custom_fields as $fieldName) {
            $field_names[] = str_replace(" ", "_", strtolower($fieldName));
        }

        $q = $q->offset($start)
            ->limit($limit)
            ->orderBy($order, $dir);
        if(empty($request->input('search.value'))) {
            $customers = $q->get();
        }
        else
        {
            $search = $request->input('search.value');
            $q = $q
                ->with('discountPlans', 'customerGroup')
                ->where('customers.name', 'LIKE', "%{$search}%")
                ->orwhere('customers.company_name', 'LIKE', "%{$search}%")
                ->orwhere('customers.phone_number', 'LIKE', "%{$search}%");
            foreach ($field_names as $key => $field_name) {
                $q = $q->orwhere('customers.' . $field_name, 'LIKE', "%{$search}%");
            }
            $customers = $q->get();
            $totalFiltered = $q->count();
        }
        $data = array();
        if(!empty($customers))
        {
            foreach ($customers as $key=>$customer)
            {
                $nestedData['id'] = $customer->id;
                $nestedData['key'] = $key;
                $nestedData['customer_group'] = $customer->customerGroup->name;
                $nestedData['customer_details'] = $customer->name;
                if($customer->company_name)
                    $nestedData['customer_details'] .= '<br>'.$customer->company_name;
                if($customer->email)
                    $nestedData['customer_details'] .= '<br>'.$customer->email;
                $nestedData['customer_details'] .= '<br>'.$customer->phone_number.'<br>'.$customer->address.'<br>'.$customer->city;
                if($customer->country)
                    $nestedData['customer_details'] .= '<br>'.$customer->country;

                $nestedData['discount_plan'] = '';
                foreach($customer->discountPlans as $index => $discount_plan) {
                    if($index)
                        $nestedData['discount_plan'] .= ', '.$discount_plan->name;
                    else
                        $nestedData['discount_plan'] .= $discount_plan->name;
                }

                $nestedData['reward_point'] = $customer->points;
                $nestedData['deposited_balance'] = number_format($customer->deposit - $customer->expense, 2);

                $opening_balance_amount = $customer->opening_balance ?? 0;
                $total_sales_amount = 0;
                $total_paid_amount = 0;
                $total_returns_amount = 0;

                $total_sales_amount = Sale::where(function ($q) {
                                        $q->where('sale_type', '!=', 'opening balance')
                                        ->orWhereNull('sale_type');
                                    })
                                    ->where('customer_id', $customer->id)
                                    ->where('sale_status', 1)// completed
                                    ->whereNull('deleted_at')
                                    ->sum('grand_total');

                if ($total_sales_amount == 0) {
                    $total_paid_amount = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
                                        ->where('sales.customer_id', $customer->id)
                                        ->where('sales.sale_status', 1)// completed
                                        ->whereNull('payments.return_id')
                                        ->whereNull('sales.deleted_at')
                                        ->sum('payments.amount');
                    $total_due = $opening_balance_amount - $total_paid_amount;
                } else {
                    $total_paid_amount = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
                                        ->where('sales.customer_id', $customer->id)
                                        ->where('sales.sale_status', 1)// completed
                                        ->whereNull('payments.return_id')
                                        ->whereNull('sales.deleted_at')
                                        ->sum('payments.amount');

                    $total_returns_amount = Returns::where('customer_id', $customer->id)
                                            ->sum('grand_total');

                    $total_refund = Payment::join('returns', 'returns.id', '=', 'payments.return_id')
                                        ->where('returns.customer_id', $customer->id)
                                        ->sum('payments.amount');

                    $total_due =  $opening_balance_amount
                                    + $total_sales_amount
                                    - $total_paid_amount
                                    - $total_returns_amount
                                    + $total_refund;
                }

                $nestedData['total_due'] = number_format($total_due, 2);

                //fetching custom fields data
                foreach($field_names as $field_name) {
                    $nestedData[$field_name] = $customer->$field_name;
                }

                $nestedData['options'] = '<div class="btn-group">
                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'.__("db.action").'
                            <span class="caret"></span>
                            <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu">';

                if($customer->type != 'walkin'){
                    if(in_array("customers-index", $request['all_permission'])){
                        $nestedData['options'] .= '<li>
                            <a href="'.route('customer.show', $customer->id).'" class="btn btn-link"><i class="dripicons-preview"></i> '.__('db.Customer Details').'</a>
                            </li>';
                    }
                }

                if(in_array("customers-edit", $request['all_permission'])){
                    $nestedData['options'] .= '<li>
                        <a href="'.route('customer.edit', $customer->id).'" class="btn btn-link"><i class="dripicons-document-edit"></i> '.__('db.edit').'</a>
                        </li>';
                }
                if($customer->type != 'walkin'){
                    if(in_array("due-report", $request['all_permission'])) {
                        $nestedData['options'] .= '<li><form route="report.customerDueByDate" method = "post" id = "due-report-form">
                                '.csrf_field().'
                                <input type="hidden" name="start_date" value="'.date('Y-m-d', strtotime('-30 year')).'" />
                                <input type="hidden" name="end_date" value="'.date('Y-m-d').'" />
                                <input type="hidden" name="customer_id" value="'.$customer->id.'" />
                                <button type="submit" class="btn btn-link"><i class="dripicons-pulse"></i>'.__('db.Due Report').'</button></form>
                        </li>';
                    }

                    if ($total_due > 0) {
                        $nestedData['options'] .=
                            '<li>
                                <button type="button" data-id="'.$customer->id.'" class="clear-due btn btn-link" data-toggle="modal" data-target="#clearDueModal" ><i class="dripicons-brush"></i>'.__('db.Clear Due').'</button>
                            </li>';
                    }

                    $nestedData['options'] .=
                        '<li>
                            <button type="button" data-id="'.$customer->id.'" class="deposit btn btn-link" data-toggle="modal" data-target="#depositModal" ><i class="dripicons-plus"></i>'.__('db.Add Deposit').'</button>
                        </li>';

                    $nestedData['options'] .=
                        '<li>
                            <button type="button" data-id="'.$customer->id.'" class="getDeposit btn btn-link" ><i class="fa fa-money"></i>'.__('db.View Deposit').'</button>
                        </li>';

                    $settings = WhatsappSetting::first();
                    if (!$settings || empty($settings->phone_number_id) || empty($settings->permanent_access_token)) {
                        $phone = preg_replace('/\D/', '', $customer->wa_number ?? '');
                        $href = "https://web.whatsapp.com/send/?phone={$phone}";
                    } else {
                        $href = route('whatsapp.send.page', [
                            'group' => 'Customers',
                            'phone' => preg_replace('/\D/', '', $customer->wa_number ?? '')
                        ]);
                    }
                    if(isset($customer->wa_number) && !empty($customer->wa_number)){
                        $nestedData['options'] .=
                            '<li>
                                <a href="'.$href.'" class="btn btn-link">
                                    <i class="fa fa-whatsapp"></i> '.__('db.Whatsapp Notification').'
                                </a>
                            </li>';
                    }


                    if(isset($lims_reward_point_setting_data) && $lims_reward_point_setting_data->is_active == 1){
                        $nestedData['options'] .=
                            '<li>
                                <button type="button" data-id="'.$customer->id.'" class="point btn btn-link" data-toggle="modal" data-target="#pointModal" ><i class="dripicons-plus"></i>'.__('db.Add Point').'</button>
                            </li>';

                        $nestedData['options'] .=
                            '<li>
                                <button type="button" data-id="'.$customer->id.'" class="getPoints btn btn-link" ><i class="fa fa-money"></i>'.__('db.View Points').'</button>
                            </li>';
                    }

                }

                if(in_array("customers-delete", $request['all_permission']))
                    $nestedData['options'] .= '<form action="'.route("customer.destroy", $customer->id).'" method="POST">'.csrf_field().'' . method_field("DELETE") . '
                            <li>
                              <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> '.__("db.delete").'</button>
                            </li></form>
                        </ul>
                    </div>';

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

    public function clearDue(Request $request)
    {
        $data = $request->all();

        $lims_due_sale_data = Sale::select('id', 'warehouse_id', 'grand_total', 'paid_amount', 'payment_status', 'customer_id')
                            ->where([
                                ['payment_status', '!=', 4],
                                ['customer_id', $request->customer_id]
                            ])
                            ->whereNull('sales.deleted_at')
                            ->get();

        $lims_customer_data = Customer::find($request->customer_id);

        $total_paid_amount = $request->amount;

        foreach ($lims_due_sale_data as $key => $sale_data) {
            if ($total_paid_amount == 0) break;

            if ($data['paid_by_id'] == 1)
                $paying_method = 'Cash';
            elseif ($data['paid_by_id'] == 2)
                $paying_method = 'Gift Card';
            elseif ($data['paid_by_id'] == 3)
                $paying_method = 'Credit Card';
            elseif ($data['paid_by_id'] == 4)
                $paying_method = 'Cheque';
            elseif ($data['paid_by_id'] == 5)
                $paying_method = 'Paypal';
            elseif ($data['paid_by_id'] == 6)
                $paying_method = 'Deposit';
            elseif ($data['paid_by_id'] == 7)
                $paying_method = 'Points';

            $due_amount = $sale_data->grand_total - $sale_data->paid_amount;

            $lims_cash_register_data = CashRegister::select('id',)
                                        ->where([
                                            ['user_id', Auth::id()],
                                            ['warehouse_id', $sale_data->warehouse_id],
                                            ['status', 1]
                                        ])->first();
            $account_data = Account::select('id')->where('is_default', 1)->first();

            if ($total_paid_amount >= $due_amount) {
                $data['amount'] = $due_amount;
                $payment_status = 4;
            } else {
                $data['amount'] = $total_paid_amount;
                $payment_status = 2;
            }

            $lims_payment_data = new Payment();
            $lims_payment_data->user_id = Auth::id();
            $lims_payment_data->sale_id = $sale_data->id;
            $lims_payment_data->cash_register_id = $lims_cash_register_data->id ?? null;
            $lims_payment_data->account_id = $account_data->id;
            $data['payment_reference'] = 'spr-' . date("Ymd") . '-' . date("his");
            $lims_payment_data->payment_reference = $data['payment_reference'];
            $lims_payment_data->amount = $data['amount'];
            $lims_payment_data->change = 0;
            $lims_payment_data->paying_method = $paying_method;
            $lims_payment_data->payment_note = $data['payment_note'];
            $lims_payment_data->payment_receiver = $data['payment_receiver'];
            $lims_payment_data->save();

            $sale_data->paid_amount  += $data['amount'];
            $sale_data->payment_status = $payment_status;
            $sale_data->save();

            $total_paid_amount -= $data['amount'];

            $lims_payment_data   = Payment::latest()->first();
            $data['payment_id']  = $lims_payment_data->id;

            // ── Payment method specific logic ──
            if ($paying_method == 'Gift Card') {
                $lims_gift_card_data = GiftCard::find($data['gift_card_id']);
                $lims_gift_card_data->expense += $data['amount'];
                $lims_gift_card_data->save();
                PaymentWithGiftCard::create($data);

            } elseif ($paying_method == 'Credit Card') {
                $lims_pos_setting_data = PosSetting::latest()->first();
                if ($lims_pos_setting_data->stripe_secret_key) {
                    Stripe::setApiKey($lims_pos_setting_data->stripe_secret_key);
                    $token  = $data['stripeToken'];
                    $amount = $data['amount'];

                    $lims_payment_with_credit_card_data = PaymentWithCreditCard::where('customer_id', $sale_data->customer_id)->first();

                    if (!$lims_payment_with_credit_card_data) {
                        $customer = \Stripe\Customer::create(['source' => $token]);
                        $charge   = \Stripe\Charge::create([
                            'amount'   => $data['amount'] * 100,
                            'currency' => 'usd',
                            'customer' => $customer->id,
                        ]);
                        $data['customer_stripe_id'] = $customer->id;
                    } else {
                        $customer_id = $lims_payment_with_credit_card_data->customer_stripe_id;
                        $charge      = \Stripe\Charge::create([
                            'amount'   => $data['amount'] * 100,
                            'currency' => 'usd',
                            'customer' => $customer_id,
                        ]);
                        $data['customer_stripe_id'] = $customer_id;
                    }

                    $data['customer_id'] = $sale_data->customer_id;
                    $data['charge_id']   = $charge->id;
                    PaymentWithCreditCard::create($data);
                }

            } elseif ($paying_method == 'Cheque') {
                PaymentWithCheque::create($data);

            } elseif ($paying_method == 'Paypal') {
                $provider = new ExpressCheckout;
                $paypal_data['items'][] = [
                    'name'  => 'Paid Amount',
                    'price' => $data['amount'],
                    'qty'   => 1
                ];
                $paypal_data['invoice_id']          = $lims_payment_data->payment_reference;
                $paypal_data['invoice_description'] = "Reference: {$paypal_data['invoice_id']}";
                $paypal_data['return_url']          = url('/sale/paypalPaymentSuccess/' . $lims_payment_data->id);
                $paypal_data['cancel_url']          = url('/sale');

                $total = 0;
                foreach ($paypal_data['items'] as $item) {
                    $total += $item['price'] * $item['qty'];
                }
                $paypal_data['total'] = $total;
                $response = $provider->setExpressCheckout($paypal_data);
                return redirect($response['paypal_link']);

            } elseif ($paying_method == 'Deposit') {
                $lims_customer_data->expense += $data['amount'];
                $lims_customer_data->save();

            } elseif ($paying_method == 'Points') {
                $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
                $used_points = ceil($data['amount'] / $lims_reward_point_setting_data->per_point_amount);

                $lims_payment_data->used_points = $used_points;
                $lims_payment_data->save();

                $lims_customer_data->points -= $used_points;
                $lims_customer_data->save();
            }

            $message = 'Payment created successfully';

            $last_sale_data = $sale_data;
        }

        // ── Print Receipt ──
        if (isset($data['print_receipt']) && $data['print_receipt'] == 1) {
            $general_setting     = GeneralSetting::latest()->first();
            $invoice_settings    = InvoiceSetting::latest()->first();
            $lims_warehouse_data = Warehouse::query()->findOrFail($sale_data->warehouse_id);
            $cheque_no           = ($data['paid_by_id'] == 'Cheque') ? ($data['cheque_no'] ?? null) : null;

            return view('backend.sale.payment_receipt', compact(
                'lims_payment_data',
                'lims_customer_data',
                'general_setting',
                'invoice_settings',
                'lims_warehouse_data',
                'cheque_no',
                'message'
            ));
        }

        if ($response = $this->spaSuccess($request, __('db.Due cleared successfully'))) {
            return $response;
        }

        return redirect()->back()->with('message', __('db.Due cleared successfully'));
    }

    public function create()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('customers-add')){
            $lims_customer_group_all = CustomerGroup::where('is_active',true)->get();
            $custom_fields = CustomField::where('belongs_to', 'customer')->get();
            return view('backend.customer.create', compact('lims_customer_group_all', 'custom_fields'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'customer_group_id' => 'required|exists:customer_groups,id',
            'customer_name' => 'required|max:255',
            'phone_number' => [
                'required',
                'max:255',
                Rule::unique('customers')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);
        //validation for supplier if create both user and supplier
        if ($this->requestFlagEnabled($request, 'both')) {
            $this->validate($request, [
                'company_name' => [
                    'max:255',
                    Rule::unique('suppliers')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'email' => [
                    'max:255',
                    Rule::unique('suppliers')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
            ]);
        }
        //validation for user if given user access
        if ($this->requestFlagEnabled($request, 'user')) {
            $loginUsername = $request->input('username', $request->input('name'));
            $request->merge(['username' => $loginUsername]);

            $this->validate($request, [
                'username' => [
                    'required',
                    'max:255',
                    Rule::unique('users', 'username')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'email' => [
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'password' => 'required|min:6',
            ]);
        }
        $customer_data = $request->all();

        $customer_data['is_active'] = true;
        $prefixMessage = 'Customer';
        if ($this->requestFlagEnabled($request, 'user')) {
            $user = User::create([
                'username' => $request->input('username'),
                'email' => $customer_data['email'] ?? null,
                'phone' => $customer_data['phone_number'] ?? null,
                'password' => bcrypt($customer_data['password']),
                'role_id' => 5,
                'is_deleted' => false,
                'is_active' => true,
                'company_name' => $customer_data['company_name'] ?? null,
            ]);
            $customer_data['user_id'] = $user->id;
            $prefixMessage .= ', User';
        }
        $customer_data['name'] = $customer_data['customer_name'];
        $customer_data['customer_group_id'] = (int) $request->input('customer_group_id');
        if (empty($customer_data['pay_term_no'])) {
            $customer_data['pay_term_no'] = null;
            $customer_data['pay_term_period'] = 'days';
        }
        if ($this->requestFlagEnabled($request, 'both')) {
            Supplier::create($this->supplierAttributesFromCustomerData($customer_data));
            $prefixMessage .= ' and Supplier';
        }

        $fullMessage = $prefixMessage.' created successfully!';
        $mail_setting = MailSetting::latest()->first();
        $message = $this->mailAction($customer_data, $mail_setting, $request, $fullMessage);

        // if($customer_data['email'] && $mail_setting) {
        //     $this->setMailInfo($mail_setting);
        //     try {
        //         Mail::to($customer_data['email'])->send(new CustomerCreate($customer_data));
        //         if(isset($request->both))
        //             Mail::to($customer_data['email'])->send(new SupplierCreate($customer_data));
        //         $message .= ' created successfully!';
        //     }
        //     catch(\Exception $e){
        //         $message .= ' created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
        //     }
        // }
        // else
        //     $message .= ' created successfully!';

        $lims_customer_data = Customer::create($this->customerAttributesFromRequest($customer_data));

        // create dummy sale if customer has opening balance (due)
        if(isset($customer_data['opening_balance']) && $customer_data['opening_balance'] > 0) {
            $lims_sale_data = new Sale();
            $lims_sale_data->reference_no = 'cob-' . date("Ymd") . '-'. date("his"); //customer opening balance
            $lims_sale_data->customer_id = $lims_customer_data->id;
            $lims_sale_data->user_id = Auth::id();
            $lims_sale_data->biller_id = 0;
            $lims_sale_data->warehouse_id = 1;
            $lims_sale_data->item = 0;
            $lims_sale_data->total_qty = 0;
            $lims_sale_data->total_discount = 0;
            $lims_sale_data->total_tax = 0;
            $lims_sale_data->total_price = $customer_data['opening_balance'];
            $lims_sale_data->grand_total = $customer_data['opening_balance'];
            $lims_sale_data->sale_status = 1; // completed
            $lims_sale_data->payment_status = 1; // pending
            $lims_sale_data->sale_type = 'Opening balance';
            $lims_sale_data->save();
        }

        //inserting data for custom fields
        $custom_field_data = [];
        $custom_fields = CustomField::where('belongs_to', 'customer')->select('name', 'type')->get();
        foreach ($custom_fields as $type => $custom_field) {
            $field_name = str_replace(' ', '_', strtolower($custom_field->name));
            if(isset($customer_data[$field_name])) {
                if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                    $custom_field_data[$field_name] = implode(",", $customer_data[$field_name]);
                else
                    $custom_field_data[$field_name] = $customer_data[$field_name];
            }
        }
        if(count($custom_field_data))
            DB::table('customers')->where('id', $lims_customer_data->id)->update($custom_field_data);
        $this->cacheForget('customer_list');
        $customerInfo['id'] = $lims_customer_data->id;
        $customerInfo['name'] = $lims_customer_data->name;
        $customerInfo['phone_number'] = $lims_customer_data->phone_number;

        $lims_discount_plan_data = DiscountPlan::where([
            'is_active' => true,
            'type' => DiscountPlanTypeEnum::GENERIC->value
        ])->get();
        foreach ($lims_discount_plan_data as $dp) {
            DiscountPlanCustomer::create([
                'discount_plan_id' => $dp->id,
                'customer_id' => $lims_customer_data->id
            ]);
        }

        if ($lims_customer_data->deposit > 0) {
            Deposit::create([
                'user_id' => Auth::id(),
                'customer_id' => $lims_customer_data->id,
                'amount' => $lims_customer_data->deposit,
            ]);
        }

        if (!empty($customer_data['pos'])) {
            return $customerInfo;
        }

        if ($response = $this->spaSuccess($request, $message)) {
            return $response;
        }

        return redirect('customer')->with('create_message', $message);
    }

    public function show($id)
    {
        // $start_date = Carbon::parse($request->start_date)->startOfDay();
        // $end_date   = Carbon::parse($request->end_date)->endOfDay();

        $customer = Customer::findOrFail($id);

        $opening_balance = $customer->opening_balance ?? 0;

        // Total sales (excluding opening balance type if ever used)
        $total_sales = Sale::where('customer_id', $id)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->where('sale_type', '!=', 'opening balance')
                ->orWhereNull('sale_type');
            })
            ->sum('grand_total');

        if($total_sales == 0) {
            // Total paid (single query, no N+1)
            $total_paid = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
                ->where('sales.customer_id', $id)
                ->whereNull('sales.deleted_at')
                ->sum('payments.amount');
            $balance_due = $opening_balance - $total_paid;
            $total_returns = 0;
        } else {

            // Total paid (single query, no N+1)
            $total_paid = Payment::join('sales', 'sales.id', '=', 'payments.sale_id')
                ->where('sales.customer_id', $id)
                ->whereNull('sales.deleted_at')
                ->sum('payments.amount');

            // Total returns
            $total_returns = Returns::where('customer_id', $id)
                ->sum('grand_total');

            // Final balance due
            $balance_due = ($total_sales + $opening_balance) - ( $total_paid + $total_returns);
        }

        return view('backend.customer.view', [
            'lims_customer_data' => $customer,
            'opening_balance'   => $opening_balance,
            'total_sales'       => $total_sales,
            'total_paid'        => $total_paid,
            'total_returns'     => $total_returns,
            'balance_due'       => $balance_due,
        ]);
    }

    public function ledger($id)
    {
        $sales = Sale::where('customer_id', $id)->whereNull('deleted_at')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'date' => $s->created_at->format('Y-m-d'),
                'type' => $s->sale_type ?? 'Sale',
                'reference' => $s->reference_no,
                'debit' => floatval($s->grand_total),
                'credit' => 0,
            ];
        });

        $payments = [];
        foreach ($sales as $sale) {
            $sale_payments = Payment::where('sale_id', $sale['id'])->get()->map(function ($p) {
                return [
                    'id'        => $p->id,
                    'date'      => $p->date ?? $p->created_at->format('Y-m-d'),
                    'type'      => 'Payment',
                    'reference' => $p->payment_reference ?? '-',
                    'debit'     => 0,
                    'credit'    => floatval($p->amount),
                ];
            })->toArray(); // convert collection to array

            $payments = array_merge($payments, $sale_payments);
        }

        $returns = Returns::where('customer_id', $id)->get()->map(function($r) {
            return [
                'id' => $r->id,
                'date' => $r->created_at,
                'type' => 'Sale Return',
                'reference' => $r->reference_no,
                'debit' => 0,
                'credit' => floatval($r->grand_total),
            ];
        });

        $ledger = $sales->merge($payments)->merge($returns)->sortBy('date')->values()->toArray();

        $balance = 0;
        foreach ($ledger as $key => $row) {
            $balance += ($row['debit'] - $row['credit']);
            $ledger[$key]['balance'] = number_format($balance, 2);
        }

        return response()->json(['data' => $ledger]);
    }

    public function installments($id)
    {
        $installments = DB::table('installments as i')
            ->join('installment_plans as p', 'i.installment_plan_id', '=', 'p.id')

            ->leftJoin('sales as s', 'p.reference_id', '=', 's.id')
            ->leftJoin('purchases as pur', 'p.reference_id', '=', 'pur.id')

            ->where(function($q) use ($id){
                $q->where('s.customer_id', $id)
                ->orWhere('pur.supplier_id', $id);
            })

            ->select(
                'i.created_at as date',
                's.reference_no as sale_reference',
                'pur.reference_no as purchase_reference',
                'i.id as installment_no',
                'i.amount',
                'i.status',
                'i.payment_date'
            )
            ->get()
            ->map(function($row){
                return [
                    'date' => $row->date,
                    'sale_reference' => $row->sale_reference ?? 'N/A',
                    'purchase_reference' => $row->purchase_reference ?? 'N/A',
                    'installment_no' => $row->installment_no,
                    'amount' => $row->amount,
                    'status' => $row->status,
                    'payment_date' => $row->payment_date
                ];
            });

        return response()->json(['data' => $installments]);
    }

    public function edit($id)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('customers-edit')){
            $lims_customer_data = Customer::find($id);
            $lims_customer_group_all = CustomerGroup::where('is_active',true)->get();
            $custom_fields = CustomField::where('belongs_to', 'customer')->get();
            return view('backend.customer.edit', compact('lims_customer_data','lims_customer_group_all', 'custom_fields'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'customer_group_id' => 'required|exists:customer_groups,id',
            'customer_name' => 'required|max:255',
            'phone_number' => [
                'required',
                'max:255',
                    Rule::unique('customers')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $input = $request->all();
        $lims_customer_data = Customer::find($id);

        if ($request->boolean('user')) {
            $loginUsername = $request->input('username', $request->input('name'));
            $request->merge(['username' => $loginUsername]);

            $this->validate($request, [
                'username' => [
                    'required',
                    'max:255',
                    Rule::unique('users', 'username')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'email' => [
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'password' => 'required|min:6',
            ]);

            $user = User::create([
                'username' => $request->input('username'),
                'email' => $input['email'] ?? null,
                'phone' => $input['phone_number'] ?? null,
                'password' => bcrypt($input['password']),
                'role_id' => 5,
                'is_active' => true,
                'is_deleted' => false,
                'company_name' => $input['company_name'] ?? null,
            ]);
            $input['user_id'] = $user->id;
            $message = 'Customer updated and user created successfully';
        }
        else {
            $message = 'Customer updated successfully';
        }

        $input['name'] = $input['customer_name'];
        $input['customer_group_id'] = (int) $request->input('customer_group_id');
        if (empty($input['pay_term_no'])) {
            $input['pay_term_no'] = null;
            $input['pay_term_period'] = 'days';
        }
        $lims_customer_data->update($input);
        //update custom field data
        $custom_field_data = [];
        $custom_fields = CustomField::where('belongs_to', 'customer')->select('name', 'type')->get();
        foreach ($custom_fields as $type => $custom_field) {
            $field_name = str_replace(' ', '_', strtolower($custom_field->name));
            if(isset($input[$field_name])) {
                if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                    $custom_field_data[$field_name] = implode(",", $input[$field_name]);
                else
                    $custom_field_data[$field_name] = $input[$field_name];
            }
        }
        if(count($custom_field_data))
            DB::table('customers')->where('id', $lims_customer_data->id)->update($custom_field_data);
        $this->cacheForget('customer_list');

        if ($response = $this->spaSuccess($request, $message)) {
            return $response;
        }

        return redirect('customer')->with('edit_message', $message);
    }

    public function importCustomer(Request $request)
    {
        if (!$this->userCanAccessCustomers('import') && !$this->userCanAccessCustomers('add')) {
            return $this->denyCustomerAccess($request);
        }

        $upload=$request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if($ext != 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Please upload a CSV file')], 422);
            }
            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }
        $filename =  $upload->getClientOriginalName();
        $filePath=$upload->getRealPath();
        //open and read
        $file=fopen($filePath, 'r');
        $header= fgetcsv($file);
        $escapedHeader=[];
        //validate
        foreach ($header as $key => $value) {
            $lheader=strtolower($value);
            $escapedItem=preg_replace('/[^a-z]/', '', $lheader);
            array_push($escapedHeader, $escapedItem);
        }

        $mail_setting = MailSetting::latest()->first();
        $message = 'Customer Imported Successfully';

        //looping through othe columns
        while($columns=fgetcsv($file))
        {
                if($columns[0]=="")
                    continue;
                foreach ($columns as $key => $value) {
                    $value=preg_replace('/\D/','',$value);
                }
               $data= array_combine($escapedHeader, $columns);
               $lims_customer_group_data = CustomerGroup::where('name', $data['customergroup'])->first();
               $customer = Customer::firstOrNew(['name'=>$data['name']]);
               $customer->customer_group_id = $lims_customer_group_data->id;
               $customer->name = $data['name'];
               $customer->company_name = $data['companyname'];
               $customer->email = $data['email'];
               $customer->phone_number = $data['phonenumber'];
               $customer->address = $data['address'];
               $customer->city = $data['city'];
               $customer->state = $data['state'];
               $customer->postal_code = $data['postalcode'];
               $customer->country = $data['country'];
               $customer->deposit = $data['deposit'];
               $customer->is_active = true;
               $customer->save();

               $lims_discount_plan_data = DiscountPlan::where([
                    'is_active' => true,
                    'type' => DiscountPlanTypeEnum::GENERIC->value
                ])->get();
                foreach ($lims_discount_plan_data as $dp) {
                    DiscountPlanCustomer::create([
                        'discount_plan_id' => $dp->id,
                        'customer_id' => $customer->id
                    ]);
                }

                if ($customer->deposit > 0) {
                    Deposit::create([
                        'user_id' => Auth::id(),
                        'customer_id' => $customer->id,
                        'amount' => $customer->deposit,
                    ]);
                }

               $message = $this->mailAction($data, $mail_setting, $request, 'Customer Imported Successfully');

            //    $mail_setting = MailSetting::latest()->first();
            //    if($data['email'] && $mail_setting) {
            //         $this->setMailInfo($mail_setting);
            //         try {
            //             Mail::to($data['email'])->send(new CustomerCreate($data));
            //         }
            //         catch(\Exception $e){
            //             $message = 'Customer imported successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            //         }
            //     }

            }
        $this->cacheForget('customer_list');

        if ($response = $this->spaSuccess($request, $message ?? 'Customer Imported Successfully')) {
            return $response;
        }

        return redirect('customer')->with('import_message', $message ?? 'Customer Imported Successfully');
    }

    public function getDeposit($id)
    {
        $lims_deposit_list = Deposit::where('customer_id', $id)->get();
        $deposit_id = [];
        $deposits = [];
        foreach ($lims_deposit_list as $deposit) {
            $deposit_id[] = $deposit->id;
            $date[] = $deposit->created_at->toDateString() . ' '. $deposit->created_at->toTimeString();
            $amount[] = $deposit->amount;
            $note[] = $deposit->note;
            $lims_user_data = User::find($deposit->user_id);
            $name[] = $lims_user_data->name;
            $email[] = $lims_user_data->email;
        }
        if(!empty($deposit_id)){
            $deposits[] = $deposit_id;
            $deposits[] = $date;
            $deposits[] = $amount;
            $deposits[] = $note;
            $deposits[] = $name;
            $deposits[] = $email;
        }
        return $deposits;
    }

    public function addDeposit(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = Auth::id();
        $lims_customer_data = Customer::find($data['customer_id']);
        $lims_customer_data->deposit += $data['amount'];
        $lims_customer_data->save();
        Deposit::create($data);
        $message = 'Data inserted successfully';
        $mail_setting = MailSetting::latest()->first();

        if($lims_customer_data->email && $mail_setting) {
            $data['name'] = $lims_customer_data->name;
            $data['email'] = $lims_customer_data->email;
            $data['balance'] = $lims_customer_data->deposit - $lims_customer_data->expense;
            $data['currency'] = config('currency');
            $message = $this->mailAction($data, $mail_setting, $request);

            // $this->setMailInfo($mail_setting);
            // try {
            //     Mail::to($data['email'])->send(new CustomerDeposit($data));
            // }
            // catch(\Exception $e){
            //     $message = 'Data inserted successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            // }
        }
        if ($response = $this->spaSuccess($request, $message)) {
            return $response;
        }

        return redirect('customer')->with('create_message', $message);
    }

    public function updateDeposit(Request $request)
    {
        $data = $request->all();
        $lims_deposit_data = Deposit::find($data['deposit_id']);
        $lims_customer_data = Customer::find($lims_deposit_data->customer_id);
        $amount_dif = $data['amount'] - $lims_deposit_data->amount;
        $lims_customer_data->deposit += $amount_dif;
        $lims_customer_data->save();
        $lims_deposit_data->update($data);

        if ($response = $this->spaSuccess($request, __('db.Data updated successfully'))) {
            return $response;
        }

        return redirect('customer')->with('create_message', __('db.Data updated successfully'));
    }

    public function deleteDeposit(Request $request)
    {
        $data = $request->all();
        $lims_deposit_data = Deposit::find($data['id']);
        $lims_customer_data = Customer::find($lims_deposit_data->customer_id);
        $lims_customer_data->deposit -= $lims_deposit_data->amount;
        $lims_customer_data->save();
        $lims_deposit_data->delete();

        if ($response = $this->spaSuccess($request, __('db.Data deleted successfully'))) {
            return $response;
        }

        return redirect('customer')->with('not_permitted', __('db.Data deleted successfully'));
    }

    public function addPoint(Request $request)
    {
        $request->validate([
            'customer_id' => 'required',
            'points' => 'required',
        ]);
        try{
            DB::beginTransaction();
                $data = $request->all();
                $data['reward_point_type'] = RewardPointTypeEnum::MANUAL->value;
                $point =RewardPoint::query()->create($data);
                $lims_customer_data = Customer::query()->findOrFail($request->customer_id);
                $lims_customer_data->update(['points' => $point->points + ($lims_customer_data->points ?? 0)]);
            DB::commit();
            $message = 'Data inserted successfully';

            if ($response = $this->spaSuccess($request, $message)) {
                return $response;
            }

            return redirect('customer')->with('create_message', $message);
        }catch(\Throwable $e){
            DB::rollBack();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'Something wrong please try again'], 500);
            }
            return redirect()->back()->with('error','Somthing wrong please try again');
        }
    }

     public function getPoints($id)
    {
        $lims_point_list = RewardPoint::where('customer_id', $id)->get();
        $point_id = [];
        $points = [];
        foreach ($lims_point_list as $point) {
            $point_id[] = $point->id;
            $date[] = $point->created_at->toDateString() . ' '. $point->created_at->toTimeString();
            $amount[] = $point->points;
            $note[] = $point->note;
            $lims_user_data = User::find($point->created_by);
            $name[] = $lims_user_data->name;
            $email[] = $lims_user_data->email;
            $reward_point_type[] = $point->reward_point_type;
            $deducted_points[] = $point->deducted_points;
        }
        if(!empty($point_id)){
            $points[] = $point_id;
            $points[] = $date;
            $points[] = $amount;
            $points[] = $note;
            $points[] = $name;
            $points[] = $email;
            $points[] = $reward_point_type;
            $points[] = $deducted_points;
        }
        return $points;
    }

    public function updatePoint(Request $request)
    {
         $request->validate([
            'point_id' => 'required',
        ]);
        try{
            DB::beginTransaction();
                $data = $request->all();
                $point = RewardPoint::find($request->point_id);
                $lims_customer_data = Customer::find($point->customer_id);
                $lims_customer_data->points -= $point->points;
                $lims_customer_data->points += $request->points;
                $lims_customer_data->save();
                $point->points = $data['points'];
                if ($data['note']) {
                    $point->note = $data['note'];
                }
                $point->save();
            DB::commit();
            $message = 'Data inserted successfully';

            if ($response = $this->spaSuccess($request, $message)) {
                return $response;
            }

            return redirect('customer')->with('create_message', $message);
        }catch(\Throwable $e){
            DB::rollBack();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'Something wrong please try again'], 500);
            }
            return redirect()->back()->with('error','Somthing wrong please try again');
        }
    }

    public function deletePoints(Request $request)
    {
        try{
            DB::beginTransaction();
                $data = $request->all();
                $point = RewardPoint::find($request->id);
                $lims_customer_data = Customer::find($point->customer_id);
                $lims_customer_data->points -= $point->points;
                $lims_customer_data->save();
                $point->delete();
            DB::commit();
            $message = 'Data deleted successfully';

            if ($response = $this->spaSuccess($request, $message)) {
                return $response;
            }

            return redirect('customer')->with('not_permitted', __('db.Data deleted successfully'));
        }catch(\Throwable $e){
            DB::rollBack();
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'Error Deleting Points'], 500);
            }
            return redirect()->back()->with('error','Error Deleting Points');
        }
    }

    public function deleteBySelection(Request $request)
    {
        $customer_id = $request['customerIdArray'];
        foreach ($customer_id as $id) {
            $lims_customer_data = Customer::find($id);

            $lims_discount_plan_data = DiscountPlan::where([
                'is_active' => true,
                'type' => DiscountPlanTypeEnum::GENERIC->value
            ])->get();
            foreach ($lims_discount_plan_data as $dp) {
                DiscountPlanCustomer::where([
                    'discount_plan_id' => $dp->id,
                    'customer_id' => $lims_customer_data->id
                ])->first()->delete();
            }

            $lims_customer_data->is_active = false;
            $lims_customer_data->save();
        }
        $this->cacheForget('customer_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => 'Customer deleted successfully!']);
        }

        return 'Customer deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        $lims_customer_data = Customer::find($id);

        $lims_discount_plan_data = DiscountPlan::where([
            'is_active' => true,
            'type' => DiscountPlanTypeEnum::GENERIC->value
        ])->get();
        foreach ($lims_discount_plan_data as $dp) {
            DiscountPlanCustomer::where([
                'discount_plan_id' => $dp->id,
                'customer_id' => $lims_customer_data->id
            ])->first()->delete();
        }

        $lims_customer_data->is_active = false;
        $lims_customer_data->save();
        $this->cacheForget('customer_list');

        if ($response = $this->spaSuccess($request, __('db.Data deleted successfully'))) {
            return $response;
        }

        return redirect('customer')->with('not_permitted', __('db.Data deleted successfully'));
    }

    protected function mailAction($data, $mailSetting, $request, $customMessage=null)
    {
        $message = $customMessage ?? 'Data inserted successfully';
        if(!$mailSetting) {
            $message = 'Data inserted successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
        }
        else if($data['email'] && $mailSetting) {
            try{
                $this->setMailInfo($mailSetting);
                Mail::to($data['email'])->send(new CustomerCreate($data));
                if ($this->requestFlagEnabled($request, 'both')) {
                    Mail::to($data['email'])->send(new SupplierCreate($data));
                }
            }
            catch(\Exception $e){
                $message = $e->getMessage();
            }
        }
        return $message;
    }

    public function customersAll()
    {
        $lims_customer_list = DB::table('customers')->where('is_active', true)->get();

        $html = '';
        foreach($lims_customer_list as $customer){
            $html .='<option value="'.$customer->id.'">'.$customer->name . ' (' . $customer->phone_number. ')'.'</option>';
        }

        return response()->json($html);
    }

    public function customerPayments($customer_id)
    {

        $payments = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.id')
            ->where('sales.customer_id', $customer_id)
            ->whereNull('sales.deleted_at')
            ->select(
                'payments.id',
                'payments.created_at',
                'payments.payment_reference',
                'payments.amount',
                'payments.paying_method',
                'payments.payment_at'
            )
            ->latest('payments.created_at')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'created_at' => $payment->created_at ? date('Y-m-d', strtotime($payment->created_at)) : '-',
                    'payment_reference' => $payment->payment_reference ?? '-',
                    'amount' => number_format($payment->amount, 2),
                    'paying_method' => ucfirst($payment->paying_method ?? '-'),
                    'payment_at' => $payment->payment_at
                        ? date('Y-m-d H:i', strtotime($payment->payment_at))
                        : date('Y-m-d H:i', strtotime($payment->created_at)),
                ];
            });

        return response()->json(['data' => $payments]);
    }
}
