<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\DiscountPlan;
use App\Models\DiscountPlanDiscount;
use App\Models\Product;
use Illuminate\Http\Request;

class DiscountApiController extends Controller
{
    public function index(Request $request)
    {
        $discounts = Discount::with('discountPlans')->orderBy('id', 'desc')->get();
        $generalSetting = \App\Models\GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';
        $discounts->each(function ($d) use ($dateFormat) {
            $d->valid_from_formatted = $d->valid_from ? $d->valid_from->format($dateFormat) : null;
            $d->valid_till_formatted = $d->valid_till ? $d->valid_till->format($dateFormat) : null;
        });
        return response()->json(['status' => 200, 'data' => $discounts]);
    }

    public function getFormData()
    {
        $discountPlans = DiscountPlan::where('is_active', true)->get(['id', 'name']);
        return response()->json(['status' => 200, 'data' => ['discount_plans' => $discountPlans]]);
    }

    public function productSearch($code)
    {
        $product = Product::where('code', trim($code))->where('is_active', true)->select('id', 'name', 'code')->first();
        if (!$product) {
            return response()->json(['status' => 404, 'message' => 'Product not found'], 404);
        }
        return response()->json(['status' => 200, 'data' => ['id' => $product->id, 'name' => $product->name, 'code' => $product->code]]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'discount_plan_id' => 'required|array',
            'discount_plan_id.*' => 'exists:discount_plans,id',
            'applicable_for' => 'required|in:All,Specific',
            'valid_from' => 'required|date',
            'valid_till' => 'required|date|after_or_equal:valid_from',
            'type' => 'required|in:percentage,flat',
            'value' => 'required|numeric|min:0',
            'minimum_qty' => 'required|integer|min:0',
            'maximum_qty' => 'required|integer|min:0',
            'days' => 'required|array',
            'days.*' => 'in:Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        ]);
        $data = $request->only('name', 'applicable_for', 'type', 'value', 'minimum_qty', 'maximum_qty');
        $data['valid_from'] = $request->date('valid_from')->format('Y-m-d');
        $data['valid_till'] = $request->date('valid_till')->format('Y-m-d');
        $data['days'] = implode(',', $request->days);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['product_list'] = $request->applicable_for === 'Specific' && !empty($request->product_list)
            ? (is_array($request->product_list) ? implode(',', $request->product_list) : $request->product_list)
            : '';
        $discount = Discount::create($data);
        foreach ($request->discount_plan_id as $planId) {
            DiscountPlanDiscount::create(['discount_id' => $discount->id, 'discount_plan_id' => $planId]);
        }
        return response()->json(['status' => 200, 'message' => 'Discount created successfully', 'data' => $discount->load('discountPlans')]);
    }

    public function show($id)
    {
        $discount = Discount::with('discountPlans')->findOrFail($id);
        $discountPlanIds = $discount->discountPlans->pluck('id')->toArray();
        $generalSetting = \App\Models\GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';
        $productDetails = [];
        if ($discount->applicable_for === 'Specific' && $discount->product_list) {
            $ids = array_filter(array_map('intval', explode(',', $discount->product_list)));
            $products = Product::whereIn('id', $ids)->get(['id', 'name', 'code']);
            $productDetails = $products->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code])->toArray();
        }
        return response()->json([
            'status' => 200,
            'data' => array_merge($discount->toArray(), [
                'discount_plan_ids' => $discountPlanIds,
                'valid_from_formatted' => $discount->valid_from?->format($dateFormat),
                'valid_till_formatted' => $discount->valid_till?->format($dateFormat),
                'days_array' => $discount->days ? explode(',', $discount->days) : [],
                'product_details' => $productDetails,
            ]),
        ]);
    }

    public function update(Request $request, $id)
    {
        $discount = Discount::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:191',
            'discount_plan_id' => 'required|array',
            'discount_plan_id.*' => 'exists:discount_plans,id',
            'applicable_for' => 'required|in:All,Specific',
            'valid_from' => 'required|date',
            'valid_till' => 'required|date|after_or_equal:valid_from',
            'type' => 'required|in:percentage,flat',
            'value' => 'required|numeric|min:0',
            'minimum_qty' => 'required|integer|min:0',
            'maximum_qty' => 'required|integer|min:0',
            'days' => 'required|array',
            'days.*' => 'in:Mon,Tue,Wed,Thu,Fri,Sat,Sun',
        ]);
        $data = $request->only('name', 'applicable_for', 'type', 'value', 'minimum_qty', 'maximum_qty');
        $data['valid_from'] = $request->date('valid_from')->format('Y-m-d');
        $data['valid_till'] = $request->date('valid_till')->format('Y-m-d');
        $data['days'] = implode(',', $request->days);
        $data['is_active'] = $request->boolean('is_active', true);
        $data['product_list'] = $request->applicable_for === 'Specific' && !empty($request->product_list)
            ? (is_array($request->product_list) ? implode(',', $request->product_list) : $request->product_list)
            : '';
        $discount->update($data);
        $preIds = DiscountPlanDiscount::where('discount_id', $id)->pluck('discount_plan_id')->toArray();
        $newIds = $request->discount_plan_id;
        foreach ($preIds as $pid) {
            if (!in_array($pid, $newIds)) {
                DiscountPlanDiscount::where([['discount_plan_id', $pid], ['discount_id', $id]])->delete();
            }
        }
        foreach ($newIds as $pid) {
            if (!in_array($pid, $preIds)) {
                DiscountPlanDiscount::create(['discount_id' => $id, 'discount_plan_id' => $pid]);
            }
        }
        return response()->json(['status' => 200, 'message' => 'Discount updated successfully', 'data' => $discount->load('discountPlans')]);
    }
}
