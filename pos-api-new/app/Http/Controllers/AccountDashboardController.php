<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Expense;
use App\Models\Income;
use App\Models\MoneyTransfer;
use App\Models\Payment;
use App\Models\Returns;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class AccountDashboardController extends Controller
{
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
        foreach (['account-index', 'account-view', 'accounts-index'] as $name) {
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
            $decimals = (int) (config('decimal') ?? 2);
            $accounts = Account::where('is_active', true)->orderBy('name')->get();

            $rows = $accounts->map(function (Account $account) use ($decimals) {
                $balance = $this->computeBalance($account);

                return [
                    'id' => $account->id,
                    'account_no' => $account->account_no,
                    'name' => $account->name,
                    'initial_balance' => number_format((float) ($account->initial_balance ?? 0), $decimals, '.', ''),
                    'initial_balance_raw' => (float) ($account->initial_balance ?? 0),
                    'balance' => number_format($balance, $decimals, '.', ''),
                    'balance_raw' => $balance,
                    'is_default' => (bool) $account->is_default,
                    'note' => $account->note ?? '',
                ];
            });

            return $this->spaJson($request, [
                'data' => $rows->values()->all(),
                'decimal' => $decimals,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load accounts'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        if (!env('USER_VERIFIED')) {
            return $this->spaJson($request, [
                'message' => __('db.This feature is disable for demo!'),
            ], 403);
        }

        if (!$this->userCanAccess()) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        $account = Account::find($id);
        if (!$account) {
            return $this->spaJson($request, ['message' => __('db.Account not found')], 404);
        }

        if ($account->is_default) {
            return $this->spaJson($request, [
                'message' => __('db.Please make another account default first!'),
            ], 422);
        }

        $account->is_active = false;
        $account->save();

        return $this->spaJson($request, ['message' => __('db.Account deleted successfully!')]);
    }

    public function computeBalance(Account $account): float
    {
        $paymentReceived = Payment::whereNotNull('sale_id')
            ->where('account_id', $account->id)
            ->sum('amount');

        $returnPurchase = DB::table('return_purchases')
            ->where('account_id', $account->id)
            ->sum('grand_total');

        $receivedMoneyViaTransfer = MoneyTransfer::where('to_account_id', $account->id)
            ->sum('amount');

        $income = Income::where('account_id', $account->id)
            ->sum('amount');

        $credit = $paymentReceived + $returnPurchase + $receivedMoneyViaTransfer + ($account->initial_balance ?? 0) + $income;

        $salesReturns = Returns::with('sale')
            ->where('account_id', $account->id)
            ->get();

        $totalSalesReturnDebit = 0;
        foreach ($salesReturns as $return) {
            $sale = $return->sale;
            if (!$sale) {
                continue;
            }

            $saleTotal = $sale->grand_total;
            $paid = $sale->paid_amount;
            $returnAmt = $return->grand_total;
            $due = $saleTotal - $paid;

            $dueAdjust = min($due, $returnAmt);
            $refund = $returnAmt - $dueAdjust;

            if ($refund > 0) {
                $totalSalesReturnDebit += $refund;
            }
        }

        $paymentSent = Payment::whereNotNull('purchase_id')
            ->where('account_id', $account->id)
            ->sum('amount');

        $expenses = Expense::where('account_id', $account->id)->sum('amount');

        $payrolls = DB::table('payrolls')
            ->where('account_id', $account->id)
            ->sum('amount');

        $sentMoneyViaTransfer = MoneyTransfer::where('from_account_id', $account->id)
            ->sum('amount');

        $debit = $totalSalesReturnDebit + $paymentSent + $expenses + $payrolls + $sentMoneyViaTransfer;

        return (float) ($credit - $debit);
    }
}
