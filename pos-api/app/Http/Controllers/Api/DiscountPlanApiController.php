<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DiscountPlan;
use App\Models\DiscountPlanCustomer;
use Illuminate\Http\Request;

class DiscountPlanApiController extends Controller
{
    public function index()
    {
        $plans = DiscountPlan::with('customers')->orderBy('id', 'desc')->get();
        return response()->json(['status' => 200, 'data' => $plans]);
    }

    public function getFormData()
    {
        $q = Customer::where('is_active', true);
        if (class_exists(\App\Enums\CustomerTypeEnum::class)) {
            $q->where('type', \App\Enums\CustomerTypeEnum::REGULAR->value);
        }
        $customers = $q->get(['id', 'name', 'phone_number']);
        return response()->json(['status' => 200, 'data' => ['customers' => $customers]]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'type' => 'required|in:limited,generic',
            'customer_id' => 'required|array',
            'customer_id.*' => 'exists:customers,id',
        ]);
        $data = $request->only('name', 'type');
        $data['is_active'] = $request->boolean('is_active', true);
        $plan = DiscountPlan::create($data);
        foreach ($request->customer_id as $customerId) {
            DiscountPlanCustomer::create(['discount_plan_id' => $plan->id, 'customer_id' => $customerId]);
        }
        return response()->json(['status' => 200, 'message' => 'Discount Plan created successfully', 'data' => $plan->load('customers')]);
    }

    public function show($id)
    {
        $plan = DiscountPlan::with('customers')->findOrFail($id);
        return response()->json(['status' => 200, 'data' => $plan]);
    }

    public function update(Request $request, $id)
    {
        $plan = DiscountPlan::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:191',
            'type' => 'required|in:limited,generic',
            'customer_id' => 'required|array',
            'customer_id.*' => 'exists:customers,id',
        ]);
        $data = $request->only('name', 'type');
        $data['is_active'] = $request->boolean('is_active', true);
        $plan->update($data);
        $preIds = DiscountPlanCustomer::where('discount_plan_id', $id)->pluck('customer_id')->toArray();
        $newIds = $request->customer_id;
        foreach ($preIds as $cid) {
            if (!in_array($cid, $newIds)) {
                DiscountPlanCustomer::where([['discount_plan_id', $id], ['customer_id', $cid]])->delete();
            }
        }
        foreach ($newIds as $cid) {
            if (!in_array($cid, $preIds)) {
                DiscountPlanCustomer::create(['discount_plan_id' => $id, 'customer_id' => $cid]);
            }
        }
        return response()->json(['status' => 200, 'message' => 'Discount Plan updated successfully', 'data' => $plan->load('customers')]);
    }
}
