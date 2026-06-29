<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use App\Traits\StaffAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class ExpenseDashboardController extends Controller
{
    use SpaResponse;
    use StaffAccess;

    protected function userCanAccess(string $permission = 'expenses-index'): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach ([$permission, 'expenses-index', 'expenses-view'] as $name) {
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
            $categoryId = (int) $request->input('expense_category_id', 0);
            $search = trim((string) $request->input('search', ''));

            if ($user && $user->role_id > 2 && $user->warehouse_id) {
                $warehouseId = (int) $user->warehouse_id;
            }

            $q = Expense::query()->with([
                'warehouse:id,name',
                'expenseCategory:id,name',
            ]);

            $q->whereDate('created_at', '>=', $startingDate)
                ->whereDate('created_at', '<=', $endingDate);

            $this->staffAccessCheck($q);

            if ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            }
            if ($categoryId) {
                $q->where('expense_category_id', $categoryId);
            }
            if ($search !== '') {
                $q->where(function ($query) use ($search) {
                    $query->where('reference_no', 'LIKE', "%{$search}%")
                        ->orWhere('note', 'LIKE', "%{$search}%")
                        ->orWhereHas('warehouse', fn ($w) => $w->where('name', 'LIKE', "%{$search}%"))
                        ->orWhereHas('expenseCategory', fn ($c) => $c->where('name', 'LIKE', "%{$search}%"));
                });
            }

            $expenses = $q->orderBy('created_at', 'desc')->get();
            $decimals = (int) (config('decimal') ?? 2);

            return $this->spaJson($request, [
                'data' => $expenses->map(fn ($row) => $this->formatRow($row, $decimals)),
                'warehouses' => $this->warehouseOptions($user),
                'expense_categories' => $this->categoryOptions(),
                'accounts' => $this->accountOptions(),
                'employees' => $this->employeeOptions(),
                'filters' => [
                    'starting_date' => $startingDate,
                    'ending_date' => $endingDate,
                    'warehouse_id' => $warehouseId,
                    'expense_category_id' => $categoryId,
                ],
                'show_warehouse_filter' => $user && $user->role_id && $user->role_id <= 2,
                'show_category_filter' => $user && $user->role_id && $user->role_id <= 2,
                'default_created_at' => date(config('date_format') ?: 'd-m-Y'),
                'decimal' => $decimals,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load expenses'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCan('expenses-delete')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['message' => __('db.Expense not found')], 404);
        }

        $expense->delete();

        return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
    }

    private function formatRow(Expense $expense, int $decimals): array
    {
        $categoryName = (int) $expense->expense_category_id === 0
            ? 'Employee Expense'
            : ($expense->expenseCategory->name ?? '—');

        return [
            'id' => $expense->id,
            'date' => $expense->created_at
                ? date(config('date_format') ?: 'd-m-Y', strtotime($expense->created_at->toDateString()))
                : '—',
            'reference_no' => $expense->reference_no,
            'warehouse' => $expense->warehouse->name ?? '—',
            'warehouse_id' => $expense->warehouse_id,
            'expense_category' => $categoryName,
            'expense_category_id' => $expense->expense_category_id,
            'amount' => number_format((float) $expense->amount, $decimals, '.', ''),
            'amount_raw' => (float) $expense->amount,
            'note' => $expense->note ?? '',
            'document' => $expense->document,
            'account_id' => $expense->account_id,
            'employee_id' => $expense->employee_id,
            'type' => $expense->type,
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
        return DB::table('expense_categories')
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

    private function employeeOptions(): array
    {
        return Employee::where('is_active', 1)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($e) => ['id' => $e->id, 'name' => $e->name])
            ->values()
            ->all();
    }
}
