<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerCollection;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\Request;
use App\Models\CustomerGroup;
use App\Models\Customer;
use App\Models\Deposit;
use App\Models\User;
use App\Models\Supplier;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\CashRegister;
use App\Models\Account;
use App\Models\MailSetting;
use Auth;
use DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\CustomerCreate;
use App\Mail\SupplierCreate;
use App\Mail\CustomerDeposit;
use Mail;
use App\Models\CustomField;

class CustomerController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\MailInfo;
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('customers-index')){
            $permissions = $role->permissions;
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
            $perPage = $request->input('per_page', 10);
            $customers = Customer::where('is_active', true)->paginate($perPage);
            return new CustomerCollection($customers);
        }
    }
    
    public function store(StoreCustomerRequest $request)
    {
        $customer_data = $request->all();
        //return $customer_data;
        $customer_data['is_active'] = true;
        $prefixMessage = 'Customer';
        // if(isset($request->user)) {
        //     $customer_data['phone'] = $customer_data['phone_number'];
        //     $customer_data['role_id'] = 5;
        //     $customer_data['is_deleted'] = false;
        //     $customer_data['password'] = bcrypt($customer_data['password']);
        //     $user = User::create($customer_data);
        //     $customer_data['user_id'] = $user->id;
        //     $prefixMessage .= ', User';
        // }
        $customer_data['name'] = $customer_data['customer_name'];
        if(isset($request->both)) {
            Supplier::create($customer_data);
            $prefixMessage .= ' and Supplier';
        }

        $fullMessage = $prefixMessage.' created successfully!';
        $mail_setting = MailSetting::latest()->first();
        $message = $this->mailAction($customer_data, $mail_setting, $request, $fullMessage);

        $lims_customer_data = Customer::create($customer_data);
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
        if(isset($customer_data['pos']))
            return $customerInfo;
        else
             return response()->json([
                'success' => true,
                'message' => $message,
            ], 201);
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
                if(isset($request->both))
                    Mail::to($data['email'])->send(new SupplierCreate($data));
            }
            catch(\Exception $e){
                $message = $e->getMessage();
            }
        }
        return $message;
    }
    
    public function update(StoreCustomerRequest $request, Customer $customer)
    {

        $input = $request->all();
        
        $input['both'] == true ? 1 : 0 ;
    
        $input['name'] = $input['customer_name'];
        $customer->update($input);
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
            DB::table('customers')->where('id', $customer->id)->update($custom_field_data);
        $this->cacheForget('customer_list');

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully.',
            'data' => new CustomerResource($customer),
        ], 200);
    }
    
    public function destroy(Customer $customer)
    {
        $customer->is_active = false;
        $customer->save();
        $this->cacheForget('customer_list');
        return response()->json([
            'success' => true,
            'message' => 'Customer has been deleted successfully.'
        ], 200);
        
    }
}