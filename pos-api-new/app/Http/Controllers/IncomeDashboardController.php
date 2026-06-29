<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Income;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use App\Traits\StaffAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class IncomeDashboardController extends Controller
{
    use SpaResponse;
    use StaffAccess;

    protected function userCanAccess(string $permission = 'incomes-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach ([$permission, 'incomes-index', 'incomes-view'] as $name) {
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

    protected function userCan(string $permission): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        try {
            if ($role && $role->hasPermissionTo($permission)) {
                return true;
            }
        } catch (PermissionDoesNotExist $e) {
        }

        return $user->can($permission);
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $user = Auth::user();
            $startingDate = $request->input('starting_date')
                ?: date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d'))));
            $endingDate = $request->input('ending_date') ?: date('Y-m-d');
            $warehouseId = (int) $request->input('warehouse_id', 0);
            $categoryId = (int) $request->input('income_category_id', 0);
            $search = trim((string) $request->input('search', ''));

            if ($user && $user->role_id > 2 && $user->warehouse_id) {
                $warehouseId = (int) $user->warehouse_id;
            }

            $q = Income::query()->with([
                'warehouse:id,name',
                'incomeCategory:id,name',
            ]);

            $q->whereDate('created_at', '>=', $startingDate)
                ->whereDate('created_at', '<=', $endingDate);

            $this->staffAccessCheck($q);

            if ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            }
            if ($categoryId) {
                $q->where('income_category_id', $categoryId);
            }
            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('reference_no', 'LIKE', "%{$search}%")
                        ->orWhere('note', 'LIKE', "%{$search}%")
                        ->orWhereHas('warehouse', fn ($w) => $w->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('incomeCategory', fn ($c) => $c->where('name', 'LIKE', "%{$search}%"));
                });
            }

            $incomes = $q->orderBy('created_at', 'desc')->get();
            $decimals = (int) (config('decimal') ?? 2);

            return $this->spaJson($request, [
                'data' => $incomes->map(fn ($row) => $this->formatRow($row, $decimals)),
                'warehouses' => $this->warehouseOptions($user),
                'income_categories' => $this->categoryOptions(),
                'accounts' => $this->accountOptions(),
                'filters' => [
                    'starting_date' => $startingDate,
                    'ending_date' => $endingDate,
                    'warehouse_id' => $warehouseId,
                    'income_category_id' => $categoryId,
                ],
                'show_warehouse_filter' => $user && $user->role_id && $user->role_id <= 2,
                'show_category_filter' => $user && $user->role_id && $user->role_id <= 2,
                'default_created_at' => date(config('date_format') ?: 'd-m-Y'),
                'decimal' => $decimals,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load incomes'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('incomes-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $income = Income::find($id);
        if (!$income) {
            return response()->json(['message' => __('db.Income not found')], 404);
        }

        $income->delete();

        return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
    }

    private function formatRow(Income $income, int $decimals): array
    {
        return [
            'id' => $income->id,
            'date' => $income->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($income->created_at->toDateString()))
                : '—',
            'reference_no' => $income->reference_no,
            'warehouse' => $income->warehouse->name ?? '—',
            'warehouse_id' => $income->warehouse_id,
            'income_category' => $income->incomeCategory->name ?? '—',
            'income_category_id' => $income->income_category_id,
            'amount' => number_format((float) $income->amount, $decimals, '.', ''),
            'amount_raw' => (float) $income->amount,
            'note' => $income->note ?? '',
            'account_id' => $income->account_id,
        ];
    }

    private function warehouseOptions($user): array
    {
        $query = Warehouse::query();
        if (Schema::hasColumn('warehouses', 'is_active')) {
            $query->where('is_active', true);
        }
        if ($user && $user->role_id > 2 && $user->warehouse_id) {
            $query->where('id', $user->warehouse_id);
        }

        return $query->orderBy('name')->get(['id', 'name'])
            ->map(fn ($w) => ['id' => $w->id, 'name' => $w->name])
            ->values()
            ->all();
    }

    private function categoryOptions(): array
    {
        return DB::table('income_categories')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'label' => "{$c->name} ({$c->code})",
            ])
            ->values()
            ->all();
    }

    private function accountOptions(): array
    {
        return Account::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_no', 'is_default'])
            ->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'label' => "{$a->name} [{$a->account_no}]",
                'is_default' => (bool) $a->is_default,
            ])
            ->values()
            ->all();
    }
}
