<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Expense;
use App\Models\MoneyTransfer;
use App\Models\Payment;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class BalanceSheetDashboardController extends Controller
{
    use SpaResponse;

    public function userCanAccess(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }
        $role = Role::find($user->role_id);
        foreach (['balance-sheet', 'balance-sheets', 'balance-sheets-view'] as $name) {
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

    /**
     * @return array<int, array{account: Account, credit: float, debit: float}>
     */
    public function buildRows(): array
    {
        $accounts = Account::where('is_active', true)->orderBy('name')->get();
        $rows = [];

        foreach ($accounts as $account) {
            $paymentReceived = Payment::whereNotNull('sale_id')
                ->where('account_id', $account->id)
                ->sum('amount');

            $paymentSent = Payment::whereNotNull('purchase_id')
                ->where('account_id', $account->id)
                ->sum('amount');

            $returns = DB::table('returns')
                ->where('account_id', $account->id)
                ->sum('grand_total');

            $returnPurchase = DB::table('return_purchases')
                ->where('account_id', $account->id)
                ->sum('grand_total');

            $expenses = Expense::where('account_id', $account->id)->sum('amount');

            $payrolls = DB::table('payrolls')
                ->where('account_id', $account->id)
                ->sum('amount');

            $sentMoneyViaTransfer = MoneyTransfer::where('from_account_id', $account->id)
                ->sum('amount');

            $receivedMoneyViaTransfer = MoneyTransfer::where('to_account_id', $account->id)
                ->sum('amount');

            $credit = (float) ($paymentReceived + $returnPurchase + $receivedMoneyViaTransfer + ($account->initial_balance ?? 0));
            $debit = (float) ($paymentSent + $returns + $expenses + $payrolls + $sentMoneyViaTransfer);

            $rows[] = [
                'account' => $account,
                'credit' => $credit,
                'debit' => $debit,
            ];
        }

        return $rows;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $decimals = (int) (config('decimal') ?? 2);
            $built = $this->buildRows();

            $data = [];
            foreach ($built as $index => $row) {
                $account = $row['account'];
                $credit = $row['credit'];
                $debit = $row['debit'];
                $balance = $credit - $debit;

                $data[] = [
                    'id' => $account->id,
                    'key' => $index,
                    'name' => $account->name,
                    'account_no' => $account->account_no,
                    'credit' => number_format($credit, $decimals, '.', ''),
                    'credit_raw' => $credit,
                    'debit' => number_format($debit, $decimals, '.', ''),
                    'debit_raw' => $debit,
                    'balance' => number_format($balance, $decimals, '.', ''),
                    'balance_raw' => $balance,
                ];
            }

            return $this->spaJson($request, [
                'data' => $data,
                'decimal' => $decimals,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load balance sheet'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
