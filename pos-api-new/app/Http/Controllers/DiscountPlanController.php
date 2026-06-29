<?php

namespace App\Http\Controllers;

use App\Enums\CustomerTypeEnum;
use App\Enums\DiscountPlanTypeEnum;
use App\Models\Customer;
use App\Models\DiscountPlan;
use App\Models\DiscountPlanCustomer;
use App\Models\Role;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;

class DiscountPlanController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
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

        return $role && $role->hasPermissionTo('discount_plan');
    }

    protected function getRegularCustomers()
    {
        return Customer::where([
            'is_active' => true,
            'type' => CustomerTypeEnum::REGULAR->value,
        ])->orderBy('name')->get();
    }

    protected function formatCustomer(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone_number' => $customer->phone_number,
        ];
    }

    protected function formatPlan(DiscountPlan $plan): array
    {
        $plan->loadMissing('customers');

        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'type' => $plan->type,
            'is_active' => (bool) $plan->is_active,
            'customers' => $plan->customers->map(fn ($customer) => $this->formatCustomer($customer))->values(),
            'customer_names' => $plan->customers->pluck('name')->implode(', '),
            'customer_ids' => $plan->customers->pluck('id')->values()->all(),
        ];
    }

    protected function syncCustomers(int $planId, array $customerIds): void
    {
        $customerIds = array_values(array_unique(array_map('intval', array_filter($customerIds))));
        $previousIds = DiscountPlanCustomer::where('discount_plan_id', $planId)
            ->pluck('customer_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach ($previousIds as $customerId) {
            if (!in_array($customerId, $customerIds, true)) {
                DiscountPlanCustomer::where([
                    ['discount_plan_id', $planId],
                    ['customer_id', $customerId],
                ])->delete();
            }
        }

        foreach ($customerIds as $customerId) {
            if (!in_array($customerId, $previousIds, true)) {
                DiscountPlanCustomer::create([
                    'discount_plan_id' => $planId,
                    'customer_id' => $customerId,
                ]);
            }
        }
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_discount_plan_all = DiscountPlan::with('customers')->orderBy('id', 'desc')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_discount_plan_all->map(fn ($plan) => $this->formatPlan($plan)),
            ]);
        }

        return view('backend.discount_plan.index', compact('lims_discount_plan_all'));
    }

    public function create(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_customer_list = $this->getRegularCustomers();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'customers' => $lims_customer_list->map(fn ($customer) => $this->formatCustomer($customer)),
                'types' => DiscountPlanTypeEnum::toArray(),
            ]);
        }

        return view('backend.discount_plan.create', compact('lims_customer_list'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:limited,generic',
            'customer_id' => 'required|array|min:1',
            'customer_id.*' => 'integer|exists:customers,id',
        ]);

        $data = $request->only(['name', 'type']);
        $data['is_active'] = filter_var($request->input('is_active', false), FILTER_VALIDATE_BOOLEAN);

        $plan = DiscountPlan::create($data);
        $this->syncCustomers($plan->id, $request->input('customer_id', []));

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Discount Plan created successfully'),
                'data' => $this->formatPlan($plan->fresh()->load('customers')),
            ], 201);
        }

        return redirect()->route('discount-plans.index')->with('message', __('db.Discount Plan created successfully'));
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_discount_plan = DiscountPlan::with('customers')->findOrFail($id);
        $lims_customer_list = $this->getRegularCustomers();
        $selected_customer_ids = DiscountPlanCustomer::where('discount_plan_id', $id)->pluck('customer_id')->all();
        $all_customer_ids = $lims_customer_list->pluck('id')->all();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatPlan($lims_discount_plan),
                'customers' => $lims_customer_list->map(fn ($customer) => $this->formatCustomer($customer)),
                'selected_customer_ids' => array_map('intval', $selected_customer_ids),
                'all_customer_ids' => $all_customer_ids,
                'types' => DiscountPlanTypeEnum::toArray(),
            ]);
        }

        return view('backend.discount_plan.edit', compact(
            'lims_discount_plan',
            'lims_customer_list',
            'selected_customer_ids',
            'all_customer_ids'
        ));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:limited,generic',
            'customer_id' => 'required|array|min:1',
            'customer_id.*' => 'integer|exists:customers,id',
        ]);

        $lims_discount_plan = DiscountPlan::findOrFail($id);
        $data = $request->only(['name', 'type']);
        $data['is_active'] = filter_var($request->input('is_active', false), FILTER_VALIDATE_BOOLEAN);

        $this->syncCustomers((int) $id, $request->input('customer_id', []));
        $lims_discount_plan->update($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Discount Plan updated successfully'),
                'data' => $this->formatPlan($lims_discount_plan->fresh()->load('customers')),
            ]);
        }

        return redirect()->route('discount-plans.index')->with('message', __('db.Discount Plan updated successfully'));
    }
}
