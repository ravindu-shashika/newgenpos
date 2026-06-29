<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use App\Models\DiscountPlan;
use App\Models\DiscountPlanDiscount;
use App\Models\Product;
use App\Models\Role;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DiscountController extends Controller
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

        return $role && (
            $role->hasPermissionTo('discount')
            || $role->hasPermissionTo('discount_plan')
        );
    }

    protected function parseDateInput(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $value = trim($value);

        foreach (['Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->format('Y-m-d');
            } catch (\Throwable) {
                // try next format
            }
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    protected function formatDateForSpa(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        return Carbon::parse($value)->format('Y-m-d');
    }

    protected function resolveProducts(?string $productList): array
    {
        if (!$productList) {
            return [];
        }

        $ids = array_values(array_filter(array_map('intval', explode(',', $productList))));

        if (!$ids) {
            return [];
        }

        return Product::whereIn('id', $ids)
            ->get(['id', 'name', 'code'])
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
            ])
            ->values()
            ->all();
    }

    protected function productLabels(?string $productList): string
    {
        $products = $this->resolveProducts($productList);

        if (!$products) {
            return __('db.All Products');
        }

        return collect($products)
            ->map(fn ($product) => "{$product['name']}[{$product['code']}]")
            ->implode(', ');
    }

    protected function formatDiscount(Discount $discount): array
    {
        $discount->loadMissing('discountPlans');

        return [
            'id' => $discount->id,
            'name' => $discount->name,
            'applicable_for' => $discount->applicable_for,
            'product_list' => $discount->product_list,
            'products' => $this->resolveProducts($discount->product_list),
            'product_labels' => $this->productLabels($discount->product_list),
            'valid_from' => $this->formatDateForSpa($discount->valid_from),
            'valid_till' => $this->formatDateForSpa($discount->valid_till),
            'validity_label' => $this->formatDateForSpa($discount->valid_from)
                . ' - '
                . $this->formatDateForSpa($discount->valid_till),
            'type' => $discount->type,
            'value' => $discount->value,
            'value_label' => $discount->value . ' (' . $discount->type . ')',
            'minimum_qty' => $discount->minimum_qty,
            'maximum_qty' => $discount->maximum_qty,
            'days' => $discount->days ? explode(',', $discount->days) : [],
            'days_label' => $discount->days,
            'is_active' => (bool) $discount->is_active,
            'discount_plan_ids' => $discount->discountPlans->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'discount_plan_names' => $discount->discountPlans->pluck('name')->implode(', '),
        ];
    }

    protected function getActiveDiscountPlans()
    {
        return DiscountPlan::where('is_active', true)->orderBy('name')->get(['id', 'name']);
    }

    protected function syncDiscountPlans(int $discountId, array $planIds): void
    {
        $planIds = array_values(array_unique(array_map('intval', array_filter($planIds))));
        $previousIds = DiscountPlanDiscount::where('discount_id', $discountId)
            ->pluck('discount_plan_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach ($previousIds as $planId) {
            if (!in_array($planId, $planIds, true)) {
                DiscountPlanDiscount::where([
                    ['discount_id', $discountId],
                    ['discount_plan_id', $planId],
                ])->delete();
            }
        }

        foreach ($planIds as $planId) {
            if (!in_array($planId, $previousIds, true)) {
                DiscountPlanDiscount::create([
                    'discount_id' => $discountId,
                    'discount_plan_id' => $planId,
                ]);
            }
        }
    }

    protected function normalizePayload(Request $request): array
    {
        $data = $request->only([
            'name',
            'applicable_for',
            'type',
            'value',
            'minimum_qty',
            'maximum_qty',
        ]);

        $data['valid_from'] = $this->parseDateInput($request->input('valid_from'));
        $data['valid_till'] = $this->parseDateInput($request->input('valid_till'));
        $data['is_active'] = filter_var($request->input('is_active', false), FILTER_VALIDATE_BOOLEAN);

        $days = $request->input('days', []);
        $data['days'] = is_array($days) ? implode(',', $days) : (string) $days;

        if (($data['applicable_for'] ?? 'All') === 'All') {
            $data['product_list'] = '';
        } else {
            $productList = $request->input('product_list', []);
            $data['product_list'] = is_array($productList)
                ? implode(',', array_map('intval', array_filter($productList)))
                : (string) $productList;
        }

        return $data;
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

        $lims_discount_all = Discount::with('discountPlans')->orderBy('id', 'desc')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_discount_all->map(fn ($discount) => $this->formatDiscount($discount)),
            ]);
        }

        return view('backend.discount.index', compact('lims_discount_all'));
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

        $lims_discount_plan_list = $this->getActiveDiscountPlans();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'discount_plans' => $lims_discount_plan_list,
            ]);
        }

        return view('backend.discount.create', compact('lims_discount_plan_list'));
    }

    public function productSearch(Request $request, $code)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_product_data = Product::where([
            ['code', $code],
            ['is_active', true],
        ])->select('id', 'name', 'code')->first();

        if (!$lims_product_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Product not found'),
                ], 404);
            }

            return response()->json(null, 404);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => [
                    'id' => $lims_product_data->id,
                    'name' => $lims_product_data->name,
                    'code' => $lims_product_data->code,
                ],
            ]);
        }

        return [
            $lims_product_data->id,
            $lims_product_data->name,
            $lims_product_data->code,
        ];
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
            'applicable_for' => 'required|in:All,Specific',
            'discount_plan_id' => 'required|array|min:1',
            'discount_plan_id.*' => 'integer|exists:discount_plans,id',
            'valid_from' => 'required|string',
            'valid_till' => 'required|string',
            'type' => 'required|in:percentage,flat',
            'value' => 'required|numeric',
            'minimum_qty' => 'required|numeric',
            'maximum_qty' => 'required|numeric',
            'days' => 'required|array|min:1',
            'product_list' => 'required_if:applicable_for,Specific|array',
        ]);

        $data = $this->normalizePayload($request);
        $discount = Discount::create($data);
        $this->syncDiscountPlans($discount->id, $request->input('discount_plan_id', []));

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Discount created successfully'),
                'data' => $this->formatDiscount($discount->fresh()->load('discountPlans')),
            ], 201);
        }

        return redirect()->route('discounts.index')->with('message', __('db.Discount created successfully'));
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

        $lims_discount_data = Discount::with('discountPlans')->findOrFail($id);
        $discount_plan_ids = DiscountPlanDiscount::where('discount_id', $id)->pluck('discount_plan_id')->all();
        $lims_discount_plan_list = $this->getActiveDiscountPlans();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatDiscount($lims_discount_data),
                'discount_plans' => $lims_discount_plan_list,
                'selected_discount_plan_ids' => array_map('intval', $discount_plan_ids),
            ]);
        }

        return view('backend.discount.edit', compact(
            'lims_discount_data',
            'discount_plan_ids',
            'lims_discount_plan_list'
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
            'applicable_for' => 'required|in:All,Specific',
            'discount_plan_id' => 'required|array|min:1',
            'discount_plan_id.*' => 'integer|exists:discount_plans,id',
            'valid_from' => 'required|string',
            'valid_till' => 'required|string',
            'type' => 'required|in:percentage,flat',
            'value' => 'required|numeric',
            'minimum_qty' => 'required|numeric',
            'maximum_qty' => 'required|numeric',
            'days' => 'required|array|min:1',
            'product_list' => 'required_if:applicable_for,Specific|array',
        ]);

        $lims_discount_data = Discount::findOrFail($id);
        $data = $this->normalizePayload($request);
        $this->syncDiscountPlans((int) $id, $request->input('discount_plan_id', []));
        $lims_discount_data->update($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Discount updated successfully'),
                'data' => $this->formatDiscount($lims_discount_data->fresh()->load('discountPlans')),
            ]);
        }

        return redirect()->route('discounts.index')->with('message', __('db.Discount updated successfully'));
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.This feature is not available'),
            ], 501);
        }

        return redirect()->back();
    }
}
