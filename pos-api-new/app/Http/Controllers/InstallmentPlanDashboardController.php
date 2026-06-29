<?php

namespace App\Http\Controllers;

use App\Models\InstallmentPlan;
use App\Models\Sale;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class InstallmentPlanDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(string $permission = 'sales-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        $names = [$permission, 'sales-index', 'sales-view', 'sales-add'];

        foreach ($names as $name) {
            try {
                if ($role && $role->hasPermissionTo($name)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
            }
            if ($user->can($name)) {
                return true;
            }
        }

        return false;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $search = trim((string) $request->input('search', ''));
            $status = trim((string) $request->input('status', ''));

            $query = InstallmentPlan::query()
                ->with('installments')
                ->where('reference_type', 'sale')
                ->latest();

            if ($search !== '') {
                $saleIds = Sale::query()
                    ->where('reference_no', 'LIKE', "%{$search}%")
                    ->orWhereHas('customer', function ($c) use ($search) {
                        $c->where('name', 'LIKE', "%{$search}%");
                    })
                    ->pluck('id');

                $query->where(function ($q) use ($search, $saleIds) {
                    $q->where('name', 'LIKE', "%{$search}%");
                    if ($saleIds->isNotEmpty()) {
                        $q->orWhereIn('reference_id', $saleIds);
                    }
                });
            }

            if ($status === 'pending') {
                $query->whereHas('installments', fn ($q) => $q->where('status', 'pending'));
            } elseif ($status === 'overdue') {
                $query->whereHas('installments', function ($q) {
                    $q->where('status', 'pending')->whereDate('payment_date', '<', now());
                });
            }

            $plans = $query->get();
            $saleIds = $plans->pluck('reference_id')->filter()->unique()->values();
            $sales = Sale::query()
                ->with('customer:id,name,phone_number')
                ->whereIn('id', $saleIds)
                ->get()
                ->keyBy('id');

            $decimals = (int) (config('decimal') ?? 2);

            return $this->spaJson($request, [
                'data' => $plans->map(fn ($plan) => $this->formatListRow($plan, $sales, $decimals)),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load installment plans'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $plan = InstallmentPlan::with('installments')->findOrFail($id);
            $sale = null;

            if ($plan->reference_type === 'sale' && $plan->reference_id) {
                $sale = Sale::with('customer:id,name,phone_number')->find($plan->reference_id);
            }

            $decimals = (int) (config('decimal') ?? 2);

            return $this->spaJson($request, [
                'plan' => $this->formatPlanDetail($plan, $sale, $decimals),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load installment plan'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    protected function formatListRow(InstallmentPlan $plan, $sales, int $decimals): array
    {
        $sale = $sales->get($plan->reference_id);
        $pending = $plan->installments->where('status', 'pending')->count();
        $completed = $plan->installments->where('status', 'completed')->count();
        $overdue = $plan->installments
            ->where('status', 'pending')
            ->filter(function ($i) {
                if (!$i->payment_date) {
                    return false;
                }

                return Carbon::parse($i->payment_date)->startOfDay() < now()->startOfDay();
            })
            ->count();

        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'reference_no' => $sale?->reference_no ?? '—',
            'customer_name' => $sale?->customer?->name ?? '—',
            'total_amount' => round((float) $plan->total_amount, $decimals),
            'down_payment' => round((float) $plan->down_payment, $decimals),
            'months' => (int) $plan->months,
            'pending_count' => $pending,
            'completed_count' => $completed,
            'overdue_count' => $overdue,
            'created_at' => $plan->created_at?->format('d-m-Y') ?? '—',
        ];
    }

    protected function formatPlanDetail(InstallmentPlan $plan, ?Sale $sale, int $decimals): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'price' => round((float) $plan->price, $decimals),
            'additional_amount' => round((float) $plan->additional_amount, $decimals),
            'total_amount' => round((float) $plan->total_amount, $decimals),
            'down_payment' => round((float) $plan->down_payment, $decimals),
            'months' => (int) $plan->months,
            'reference_type' => $plan->reference_type,
            'reference_id' => $plan->reference_id,
            'reference_no' => $sale?->reference_no ?? '—',
            'customer_name' => $sale?->customer?->name ?? '—',
            'installments' => $plan->installments->values()->map(function ($item, $index) use ($decimals) {
                $isOverdue = $item->status === 'pending'
                    && $item->payment_date
                    && Carbon::parse($item->payment_date)->startOfDay() < now()->startOfDay();

                return [
                    'id' => $item->id,
                    'no' => $index + 1,
                    'payment_date' => $item->payment_date
                        ? Carbon::parse($item->payment_date)->format('d M Y')
                        : '—',
                    'status' => $item->status,
                    'status_label' => $item->status === 'completed' ? 'Completed' : ($isOverdue ? 'Overdue' : 'Pending'),
                    'amount' => round((float) $item->amount, $decimals),
                ];
            }),
        ];
    }
}
