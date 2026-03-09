<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DiscountPlan;
use App\Models\DiscountPlanCustomer;
use App\Models\Customer;
use Spatie\Permission\Models\Role;
use Auth;

class DiscountPlanController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('discount_plan')) {
            $lims_discount_plan_all = DiscountPlan::with('customers')->orderBy('id', 'desc')->get();
            return $lims_discount_plan_all;
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
    
    public function store(Request $request)
    {
        $data = $request->all();
        if(!isset($data['is_active'])) {
            $data['is_active'] = 0;
        }
        $lims_discount_plan = DiscountPlan::create($data);
        foreach ($data['customer_id'] as $key => $customer_id) {
            DiscountPlanCustomer::create(['discount_plan_id' => $lims_discount_plan->id, 'customer_id' => $customer_id]);
        }

         return response()->json([
            'success' => true,
            'message' => 'Discount Plan created successfully.',
        ], 201);
    }
    
    public function update(Request $request, $id)
    {
        $data = $request->all();
        $lims_discount_plan = DiscountPlan::find($id);
        if(!isset($data['is_active'])) {
            $data['is_active'] = 0;
        }
        $pre_customer_ids = DiscountPlanCustomer::where('discount_plan_id', $id)->pluck('customer_id')->toArray();
        //deleting previous customer id if not exist
        foreach ($pre_customer_ids as $key => $customer_id) {
            if(!in_array($customer_id, $data['customer_id'])) {
                DiscountPlanCustomer::where([
                    ['discount_plan_id', $id],
                    ['customer_id', $customer_id]
                ])->first()->delete();
            }
        }
        //inserting new customer id
        foreach ($data['customer_id'] as $key => $customer_id) {
            if(!in_array($customer_id, $pre_customer_ids)) {
                DiscountPlanCustomer::create(['discount_plan_id' => $id, 'customer_id' => $customer_id]);
            }
        }
        $lims_discount_plan->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Discount Plan updated successfully.',
            'data' => $lims_discount_plan,
        ], 200);
    }
}
