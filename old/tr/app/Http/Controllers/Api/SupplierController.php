<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupplierResource;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Purchase;
use App\Models\CashRegister;
use App\Models\Account;
use App\Models\Payment;
use App\Models\MailSetting;
use Illuminate\Validation\Rule;
use Auth;
use DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\SupplierCreate;
use App\Mail\CustomerCreate;
use Mail;

class SupplierController extends Controller
{
    use \App\Traits\MailInfo;
    
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('suppliers-index')){
            
            $suppliers = Supplier::where('is_active', true)->get();
           
            return response()->json(
                SupplierResource::collection($suppliers)
            );
        }
        else
            return response()->json(['not_permitted'=>'Sorry! You are not allowed to access this module']);
    }
    
    public function store(Request $request)
    {
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
            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        //validation for customer if create both user and supplier
        if(isset($request->both)) {
            $this->validate($request, [
                'phone_number' => [
                    'max:255',
                    Rule::unique('customers')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
            ]);
        }

        $lims_supplier_data = $request->except('image');
        $lims_supplier_data['is_active'] = true;
        $image = $request->image;
        if ($image) {
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = preg_replace('/[^a-zA-Z0-9]/', '', $request['company_name']);
            $imageName = $imageName . '.' . $ext;
            $image->move(public_path('images/supplier'), $imageName);
            $lims_supplier_data['image'] = $imageName;
        }
        $supplier = Supplier::create($lims_supplier_data);
        $message = 'Supplier';
        if(isset($request->both)) {
            Customer::create($lims_supplier_data);
            $message .= ' and Customer';
        }
        $mail_setting = MailSetting::latest()->first();
        if($lims_supplier_data['email'] && $mail_setting) {
            $this->setMailInfo($mail_setting);
            try {
                Mail::to($lims_supplier_data['email'])->send(new SupplierCreate($lims_supplier_data));
                if(isset($request->both))
                    Mail::to($lims_supplier_data['email'])->send(new CustomerCreate($lims_supplier_data));
                $message .= ' created successfully!';
            }
            catch(\Exception $e) {
                $message .= ' created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }
        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully.',
            'data' => $supplier,
        ], 201);
    }

    public function update(Request $request, $id)
    {
         $this->validate($request, [
            'company_name' => [
                'max:255',
                    Rule::unique('suppliers')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'email' => [
                'max:255',
                    Rule::unique('suppliers')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $lims_supplier_data = Supplier::findOrFail($id);

        $input = $request->except('image');
        $image = $request->image;
        if ($image) {
            $this->fileDelete(public_path('images/supplier/'), $lims_supplier_data->image);

            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = preg_replace('/[^a-zA-Z0-9]/', '', $request['company_name']);
            $imageName = $imageName . '.' . $ext;
            $image->move(public_path('images/supplier'), $imageName);
            $input['image'] = $imageName;
        }

        $lims_supplier_data->update($input);
        
        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully.',
            'data' => $lims_supplier_data,
        ], 200);
    }
    
    public function destroy($id)
    {
        $lims_supplier_data = Supplier::findOrFail($id);
        $lims_supplier_data->is_active = false;
        $lims_supplier_data->save();
        $this->fileDelete(public_path('images/supplier/'), $lims_supplier_data->image);

        return response()->json([
            'success' => true,
            'message' => 'Supplier has been deleted successfully.'
        ], 200);
    }
}
