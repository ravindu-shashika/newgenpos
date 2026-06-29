<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\User;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Keygen\Keygen;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class CouponDashboardController extends Controller
{
    use CacheForget;
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        $names = ['coupon', 'coupons.view', 'coupons-index'];

        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
                // continue
            }
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    protected function userCanCreate(): bool
    {
        return $this->userHasAny(['coupons.create', 'coupons-add', 'coupon']);
    }

    protected function userCanEdit(): bool
    {
        return $this->userHasAny(['coupons.edit', 'coupons-edit', 'coupon']);
    }

    protected function userHasAny(array $names): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
                // continue
            }
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    protected function userDisplayName(?User $user): string
    {
        if (!$user) {
            return '—';
        }

        return $user->name ?? $user->username ?? $user->email ?? '—';
    }

    protected function creatorNames($userIds)
    {
        return User::whereIn('id', $userIds)
            ->get(['id', 'username', 'email'])
            ->mapWithKeys(fn ($user) => [$user->id => $this->userDisplayName($user)]);
    }

    public function generateCode(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return $this->spaJson($request, [
            'code' => Keygen::alphanum(10)->generate(),
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->userCanCreate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('coupons')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'type' => 'required|in:percentage,fixed',
            'amount' => 'required|numeric|min:0',
            'minimum_amount' => 'required_if:type,fixed|nullable|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'expired_date' => 'required|date|after_or_equal:today',
        ]);

        $data = $validated;
        $data['used'] = 0;
        $data['user_id'] = Auth::id();
        $data['is_active'] = true;
        if ($data['type'] === 'percentage') {
            $data['minimum_amount'] = 0;
        }

        Coupon::create($data);
        $this->cacheForget('coupon_list');

        return $this->spaJson($request, ['message' => __('db.Coupon created successfully')]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanEdit()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $coupon = Coupon::where('is_active', true)->find($id);
        if (!$coupon) {
            return response()->json(['message' => __('db.Coupon not found')], 404);
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('coupons')->ignore($coupon->id)->where(fn ($query) => $query->where('is_active', true)),
            ],
            'type' => 'required|in:percentage,fixed',
            'amount' => 'required|numeric|min:0',
            'minimum_amount' => 'required_if:type,fixed|nullable|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'expired_date' => 'required|date',
        ]);

        $data = $validated;
        if ($data['type'] === 'percentage') {
            $data['minimum_amount'] = 0;
        }

        $coupon->update($data);
        $this->cacheForget('coupon_list');

        return $this->spaJson($request, ['message' => __('db.Coupon updated successfully')]);
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $search = trim((string) $request->input('search', ''));

            $query = Coupon::query()->where('is_active', true);

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'LIKE', "%{$search}%")
                        ->orWhere('type', 'LIKE', "%{$search}%");
                });
            }

            $coupons = $query->orderBy('id', 'desc')->get();
            $userNames = $this->creatorNames($coupons->pluck('user_id')->filter()->unique());

            $decimals = (int) (config('decimal') ?? 2);
            $today = date('Y-m-d');

            return $this->spaJson($request, [
                'data' => $coupons->map(fn ($c) => $this->formatRow($c, $userNames, $decimals, $today)),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load coupons'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanEdit()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $ids = $request->input('couponIdArray', []);
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'No coupon is selected!'], 422);
        }

        Coupon::whereIn('id', $ids)->update(['is_active' => false]);
        $this->cacheForget('coupon_list');

        return $this->spaJson($request, ['message' => 'Coupon deleted successfully!']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $coupon = Coupon::where('is_active', true)->find($id);
        if (!$coupon) {
            return response()->json(['message' => __('db.Coupon not found')], 404);
        }

        $coupon->is_active = false;
        $coupon->save();
        $this->cacheForget('coupon_list');

        return $this->spaJson($request, ['message' => __('db.Coupon deleted successfully')]);
    }

    private function formatRow(Coupon $coupon, $userNames, int $decimals, string $today): array
    {
        $available = (int) $coupon->quantity - (int) $coupon->used;
        $minimum = $coupon->type === 'percentage' || !$coupon->minimum_amount
            ? null
            : round((float) $coupon->minimum_amount, $decimals);

        $expiredDate = $coupon->expired_date
            ? date(config('date_format') ?: 'd-m-Y', strtotime($coupon->expired_date))
            : '—';

        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'amount' => round((float) $coupon->amount, $decimals),
            'minimum_amount' => $minimum,
            'minimum_amount_raw' => (float) ($coupon->minimum_amount ?? 0),
            'minimum_amount_label' => $minimum !== null ? (string) $minimum : 'N/A',
            'quantity' => (int) $coupon->quantity,
            'used' => (int) $coupon->used,
            'available' => $available,
            'created_by' => $userNames[$coupon->user_id] ?? '—',
            'expired_date' => $expiredDate,
            'expired_raw' => $coupon->expired_date,
            'is_expired' => $coupon->expired_date && $coupon->expired_date < $today,
            'has_available' => $available > 0,
        ];
    }
}
