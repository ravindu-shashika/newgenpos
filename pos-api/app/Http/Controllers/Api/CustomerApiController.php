<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Auth;
use Spatie\Permission\Models\Role;

class CustomerApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('customers-index')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $customers = Customer::with(['customerGroup:id,name'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        return response()->json(['status' => 200, 'data' => $customers]);
    }

    public function formData(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('customers-index')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $customerGroups = CustomerGroup::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        return response()->json(['status' => 200, 'customer_groups' => $customerGroups]);
    }

    public function store(Request $request): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('customers-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $request->validate([
            'customer_group_id' => 'required|integer|exists:customer_groups,id',
            'name' => 'required|string|max:255',
            'phone_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('customers')->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:255',
            'tax_no' => 'nullable|string|max:100',
            'opening_balance' => 'nullable|numeric',
        ]);
        $data = $request->only(
            'customer_group_id', 'name', 'company_name', 'email', 'phone_number',
            'address', 'city', 'state', 'postal_code', 'country', 'tax_no', 'opening_balance'
        );
        $data['is_active'] = true;
        $data['deposit'] = 0;
        $data['points'] = 0;
        $data['expense'] = 0;
        Customer::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Customer created successfully')]);
    }

    public function update(Request $request): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('customers-edit')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $request->validate([
            'id' => 'required|integer|exists:customers,id',
            'customer_group_id' => 'required|integer|exists:customer_groups,id',
            'name' => 'required|string|max:255',
            'phone_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('customers')->ignore($request->id)->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'company_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:255',
            'tax_no' => 'nullable|string|max:100',
        ]);
        $customer = Customer::findOrFail($request->id);
        $data = $request->only(
            'customer_group_id', 'name', 'company_name', 'email', 'phone_number',
            'address', 'city', 'state', 'postal_code', 'country', 'tax_no'
        );
        $customer->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfully')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('customers-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $customer = Customer::findOrFail($id);
        $customer->update(['is_active' => false]);
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }

    public function show(int $id): JsonResponse
    {
        $customer = Customer::with('customerGroup:id,name')->where('is_active', true)->findOrFail($id);
        return response()->json(['status' => 200, 'data' => $customer]);
    }
}
