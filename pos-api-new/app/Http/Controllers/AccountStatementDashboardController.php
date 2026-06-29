<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Expense;
use App\Models\Income;
use App\Models\MoneyTransfer;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\Purchase;
use App\Models\ReturnPurchase;
use App\Models\Returns;
use App\Models\Sale;
use App\Traits\SpaResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class AccountStatementDashboardController extends Controller
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
        foreach (['account-statement', 'account-statements', 'account-statements-view'] as $name) {
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

    public function formData(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $startingDate = date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d'))));
        $endingDate = date('Y-m-d');

        return $this->spaJson($request, [
            'accounts' => Account::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'account_no'])
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'label' => "{$a->name} [{$a->account_no}]",
                ])
                ->values()
                ->all(),
            'default_start_date' => $startingDate,
            'default_end_date' => $endingDate,
            'decimal' => (int) (config('decimal') ?? 2),
        ]);
    }

    public function generate(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $payload = $this->buildStatement($request);

            return $this->spaJson($request, $payload);
        } catch (\InvalidArgumentException $e) {
            return $this->spaJson($request, ['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load account statement'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function buildStatement(Request $request): array
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'nullable|in:0,1,2',
        ]);

        $account = Account::find($validated['account_id']);
        if (!$account) {
            throw new \InvalidArgumentException(__('db.Account not found'));
        }

        $type = (string) ($validated['type'] ?? '0');
        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();
        $decimals = (int) (config('decimal') ?? 2);
        $dateFormat = config('date_format') ?: 'd-m-Y';

        $balance = (float) ($account->initial_balance ?? 0);
        $accountStatementArray = collect();

        if ($type === '0' || $type === '2') {
            $salePayments = Payment::whereNotNull('sale_id')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';

                    return $item;
                });

            $moneyReceived = MoneyTransfer::where('to_account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';

                    return $item;
                });

            $purchaseReturn = ReturnPurchase::where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';
                    $item->amount = $item->grand_total;

                    return $item;
                });

            $income = Income::where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';

                    return $item;
                });

            $accountStatementArray = $accountStatementArray
                ->concat($salePayments)
                ->concat($moneyReceived)
                ->concat($purchaseReturn)
                ->concat($income);
        }

        if ($type === '0' || $type === '1') {
            $purchasePayment = Payment::whereNotNull('purchase_id')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';

                    return $item;
                });

            $expense = Expense::where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';

                    return $item;
                });

            $payroll = Payroll::where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';

                    return $item;
                });

            $moneySent = MoneyTransfer::where('from_account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';

                    return $item;
                });

            $salesReturns = Returns::with('sale')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->map(function ($return) {
                    $sale = $return->sale;
                    if (!$sale) {
                        return null;
                    }

                    $due = $sale->grand_total - $sale->paid_amount;
                    $dueAdjust = min($due, $return->grand_total);
                    $refund = $return->grand_total - $dueAdjust;

                    if ($refund > 0) {
                        $obj = new \stdClass();
                        $obj->reference_no = $return->reference_no;
                        $obj->amount = $refund;
                        $obj->created_at = $return->created_at;
                        $obj->type = 'debit';

                        return $obj;
                    }

                    return null;
                })->filter();

            $accountStatementArray = $accountStatementArray
                ->concat($purchasePayment)
                ->concat($expense)
                ->concat($payroll)
                ->concat($moneySent)
                ->concat($salesReturns);
        }

        $accountStatementArray = $accountStatementArray->sortBy('created_at')->values();

        $balanceTracker = $balance;
        $rowsAsc = [];
        foreach ($accountStatementArray as $row) {
            $credit = $row->type === 'credit' ? (float) $row->amount : 0;
            $debit = $row->type === 'debit' ? (float) $row->amount : 0;

            $balanceTracker += $credit;
            $balanceTracker -= $debit;

            $transactionRef = '';
            if (isset($row->sale_id)) {
                $transactionRef = Sale::where('id', $row->sale_id)->value('reference_no') ?? '';
            } elseif (isset($row->purchase_id)) {
                $transactionRef = Purchase::where('id', $row->purchase_id)->value('reference_no') ?? '';
            }

            $rowsAsc[] = $this->formatStatementRow(
                $row->created_at,
                $row->reference_no ?? '',
                $transactionRef,
                $credit,
                $debit,
                $balanceTracker,
                $decimals,
                $dateFormat,
                false
            );
        }

        $rowsDesc = array_reverse($rowsAsc);
        $initialAmount = (float) ($account->initial_balance ?? 0);
        if (count($rowsAsc) > 0 || $initialAmount != 0) {
            $rowsDesc[] = $this->formatStatementRow(
                $account->created_at,
                __('db.Initial Balance'),
                '------',
                $initialAmount,
                0,
                $initialAmount,
                $decimals,
                $dateFormat,
                true
            );
        }

        $totalCredit = collect($rowsAsc)->sum('credit_raw');
        $totalDebit = collect($rowsAsc)->sum('debit_raw');

        return [
            'account' => [
                'id' => $account->id,
                'name' => $account->name,
                'account_no' => $account->account_no,
                'label' => "{$account->name} [{$account->account_no}]",
            ],
            'data' => array_values($rowsDesc),
            'initial_balance' => $initialAmount,
            'balance_tracker' => $balanceTracker,
            'total_credit' => $totalCredit,
            'total_debit' => $totalDebit,
            'decimal' => $decimals,
            'filters' => [
                'account_id' => (int) $account->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'type' => $type,
            ],
        ];
    }

    private function formatStatementRow(
        $createdAt,
        string $referenceNo,
        string $relatedTransaction,
        float $credit,
        float $debit,
        float $balance,
        int $decimals,
        string $dateFormat,
        bool $isInitial
    ): array {
        $dateRaw = $createdAt ? Carbon::parse($createdAt)->toDateString() : null;

        return [
            'date' => $dateRaw ? date($dateFormat, strtotime($dateRaw)) : '',
            'date_raw' => $dateRaw,
            'reference_no' => $referenceNo,
            'related_transaction' => $relatedTransaction,
            'credit' => number_format($credit, $decimals, '.', ''),
            'credit_raw' => $credit,
            'debit' => number_format($debit, $decimals, '.', ''),
            'debit_raw' => $debit,
            'balance' => number_format($balance, $decimals, '.', ''),
            'balance_raw' => $balance,
            'is_initial' => $isInitial,
        ];
    }
}
