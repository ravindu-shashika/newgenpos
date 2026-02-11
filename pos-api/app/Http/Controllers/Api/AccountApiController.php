<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Expense;
use App\Models\Income;
use App\Models\MoneyTransfer;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\Purchase;
use App\Models\Return as SaleReturn;
use App\Models\ReturnPurchase;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AccountApiController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user || !$user->can('accounts.view')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to view accounts"], 403);
        }

        $accounts = Account::where('is_active', true)->orderBy('id', 'desc')->get();

        $data = $accounts->map(function (Account $account) {
            $summary = $this->summarizeAccount($account);

            return [
                'id' => $account->id,
                'account_no' => $account->account_no,
                'name' => $account->name,
                'initial_balance' => (float) ($account->initial_balance ?? 0),
                'credit' => $summary['credit'],
                'debit' => $summary['debit'],
                'balance' => $summary['balance'],
                'is_default' => (bool) $account->is_default,
                'note' => $account->note,
                'created_at' => optional($account->created_at)->toDateTimeString(),
            ];
        })->values();

        return response()->json(['status' => 200, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->can('accounts.create')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to create accounts"], 403);
        }

        $validated = $request->validate([
            'account_no' => [
                'nullable',
                'max:255',
                Rule::unique('accounts')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'initial_balance' => ['nullable', 'numeric'],
            'note' => ['nullable', 'string'],
        ]);

        $initial = (float) ($validated['initial_balance'] ?? 0);

        $data = [
            'account_no' => $validated['account_no'] ?? null,
            'name' => $validated['name'],
            'initial_balance' => $initial,
            'total_balance' => $initial,
            'note' => $validated['note'] ?? null,
            'is_default' => false,
            'is_active' => true,
        ];

        if (!Account::where('is_active', true)->exists()) {
            $data['is_default'] = true;
        }

        $account = Account::create($data);

        $summary = $this->summarizeAccount($account->fresh());

        return response()->json([
            'status' => 200,
            'message' => 'Account created successfully',
            'data' => array_merge([
                'id' => $account->id,
                'account_no' => $account->account_no,
                'name' => $account->name,
                'initial_balance' => (float) ($account->initial_balance ?? 0),
                'is_default' => (bool) $account->is_default,
                'note' => $account->note,
            ], $summary),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !$user->can('accounts.edit')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to update accounts"], 403);
        }

        $account = Account::findOrFail($id);

        $validated = $request->validate([
            'account_no' => [
                'nullable',
                'max:255',
                Rule::unique('accounts')->ignore($account->id)->where(fn ($query) => $query->where('is_active', true)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'initial_balance' => ['nullable', 'numeric'],
            'note' => ['nullable', 'string'],
        ]);

        $initial = (float) ($validated['initial_balance'] ?? 0);

        $account->update([
            'account_no' => $validated['account_no'] ?? null,
            'name' => $validated['name'],
            'initial_balance' => $initial,
            'total_balance' => $initial,
            'note' => $validated['note'] ?? null,
        ]);

        $summary = $this->summarizeAccount($account->fresh());

        return response()->json([
            'status' => 200,
            'message' => 'Account updated successfully',
            'data' => array_merge([
                'id' => $account->id,
                'account_no' => $account->account_no,
                'name' => $account->name,
                'initial_balance' => (float) ($account->initial_balance ?? 0),
                'is_default' => (bool) $account->is_default,
                'note' => $account->note,
            ], $summary),
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user || !$user->can('accounts.delete')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to delete accounts"], 403);
        }

        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => 'This feature is disabled for demo!'], 403);
        }

        $account = Account::findOrFail($id);
        if ($account->is_default) {
            return response()->json(['status' => 422, 'message' => 'Please make another account default first!'], 422);
        }

        $account->is_active = false;
        $account->save();

        return response()->json(['status' => 200, 'message' => 'Account deleted successfully']);
    }

    public function makeDefault($id)
    {
        $user = auth()->user();
        if (!$user || !$user->can('accounts.edit')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to update accounts"], 403);
        }

        $account = Account::findOrFail($id);

        DB::transaction(function () use ($account) {
            Account::where('is_default', true)->where('id', '!=', $account->id)->update(['is_default' => false]);
            $account->is_default = true;
            $account->save();
        });

        return response()->json(['status' => 200, 'message' => 'Account set as default successfully']);
    }

    public function options()
    {
        $accounts = Account::where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get(['id', 'name', 'account_no', 'is_default']);

        return response()->json([
            'status' => 200,
            'data' => $accounts->map(fn ($account) => [
                'id' => $account->id,
                'name' => $account->name,
                'account_no' => $account->account_no,
                'is_default' => (bool) $account->is_default,
                'label' => trim($account->name . ' ' . ($account->account_no ? '(' . $account->account_no . ')' : '')),
            ])->values(),
        ]);
    }

    public function balanceSheet()
    {
        $user = auth()->user();
        if (!$user || !$user->can('balance-sheets.view')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to view the balance sheet"], 403);
        }

        $accounts = Account::where('is_active', true)->orderBy('name')->get();

        $data = $accounts->map(function (Account $account) {
            $summary = $this->summarizeAccount($account);

            return [
                'id' => $account->id,
                'name' => $account->name,
                'account_no' => $account->account_no,
                'credit' => $summary['credit'],
                'debit' => $summary['debit'],
                'balance' => $summary['balance'],
            ];
        })->values();

        $totals = [
            'credit' => round($data->sum('credit'), 6),
            'debit' => round($data->sum('debit'), 6),
            'balance' => round($data->sum('balance'), 6),
        ];

        return response()->json(['status' => 200, 'data' => $data, 'totals' => $totals]);
    }

    public function statement(Request $request)
    {
        $user = auth()->user();
        if (!$user || !$user->can('account-statements.view')) {
            return response()->json(['status' => 403, 'message' => "You don't have permission to view account statements"], 403);
        }

        $validated = $request->validate([
            'account_id' => ['required', 'exists:accounts,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'type' => ['nullable', Rule::in(['0', '1', '2'])],
        ]);

        $type = $validated['type'] ?? '0';
        $account = Account::findOrFail($validated['account_id']);
        $initialBalance = (float) ($account->initial_balance ?? 0);
        $start = Carbon::parse($validated['start_date'])->startOfDay();
        $end = Carbon::parse($validated['end_date'])->endOfDay();

        $transactions = [];

        if ($type === '0' || $type === '2') {
            // Sale payments (credit)
            $salePayments = Payment::with('sale')
                ->whereNotNull('sale_id')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($salePayments as $payment) {
                $transactions[] = [
                    'date' => $payment->created_at,
                    'reference' => $payment->payment_reference,
                    'related_reference' => optional($payment->sale)->reference_no,
                    'description' => 'Sale Payment',
                    'credit' => (float) $payment->amount,
                    'debit' => 0.0,
                ];
            }

            // Money received via transfer
            $moneyReceived = MoneyTransfer::where('to_account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($moneyReceived as $transfer) {
                $transactions[] = [
                    'date' => $transfer->created_at,
                    'reference' => $transfer->reference_no,
                    'related_reference' => null,
                    'description' => 'Money Transfer (Received)',
                    'credit' => (float) $transfer->amount,
                    'debit' => 0.0,
                ];
            }

            // Purchase return
            $purchaseReturns = ReturnPurchase::where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($purchaseReturns as $returnPurchase) {
                $transactions[] = [
                    'date' => $returnPurchase->created_at,
                    'reference' => $returnPurchase->reference_no,
                    'related_reference' => optional($returnPurchase->purchase)->reference_no ?? null,
                    'description' => 'Purchase Return',
                    'credit' => (float) $returnPurchase->grand_total,
                    'debit' => 0.0,
                ];
            }

            // Income
            $incomes = Income::where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($incomes as $income) {
                $transactions[] = [
                    'date' => $income->created_at,
                    'reference' => $income->reference_no,
                    'related_reference' => null,
                    'description' => 'Income',
                    'credit' => (float) $income->amount,
                    'debit' => 0.0,
                ];
            }
        }

        if ($type === '0' || $type === '1') {
            // Purchase payments (debit)
            $purchasePayments = Payment::with('purchase')
                ->whereNotNull('purchase_id')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($purchasePayments as $payment) {
                $transactions[] = [
                    'date' => $payment->created_at,
                    'reference' => $payment->payment_reference,
                    'related_reference' => optional($payment->purchase)->reference_no,
                    'description' => 'Purchase Payment',
                    'credit' => 0.0,
                    'debit' => (float) $payment->amount,
                ];
            }

            // Expenses
            $expenses = Expense::where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($expenses as $expense) {
                $transactions[] = [
                    'date' => $expense->created_at,
                    'reference' => $expense->reference_no,
                    'related_reference' => null,
                    'description' => 'Expense',
                    'credit' => 0.0,
                    'debit' => (float) $expense->amount,
                ];
            }

            // Payroll
            $payrolls = Payroll::where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($payrolls as $payroll) {
                $transactions[] = [
                    'date' => $payroll->created_at,
                    'reference' => $payroll->reference_no,
                    'related_reference' => null,
                    'description' => 'Payroll',
                    'credit' => 0.0,
                    'debit' => (float) $payroll->amount,
                ];
            }

            // Money sent
            $moneySent = MoneyTransfer::where('from_account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($moneySent as $transfer) {
                $transactions[] = [
                    'date' => $transfer->created_at,
                    'reference' => $transfer->reference_no,
                    'related_reference' => null,
                    'description' => 'Money Transfer (Sent)',
                    'credit' => 0.0,
                    'debit' => (float) $transfer->amount,
                ];
            }

            // Sales returns (refunds)
            $salesReturns = SaleReturn::with('sale')
                ->where('account_id', $account->id)
                ->whereBetween('created_at', [$start, $end])
                ->get();

            foreach ($salesReturns as $return) {
                $sale = $return->sale;
                if (!$sale) {
                    continue;
                }

                $saleTotal = $sale->grand_total;
                $paid = $sale->paid_amount;
                $returnAmount = $return->grand_total;
                $due = $saleTotal - $paid;

                $dueAdjust = min($due, $returnAmount);
                $refund = $returnAmount - $dueAdjust;

                if ($refund > 0) {
                    $transactions[] = [
                        'date' => $return->created_at,
                        'reference' => $return->reference_no,
                        'related_reference' => $sale->reference_no,
                        'description' => 'Sale Return Refund',
                        'credit' => 0.0,
                        'debit' => (float) $refund,
                    ];
                }
            }
        }

        // Sort transactions by date ascending
        usort($transactions, function ($a, $b) {
            $timeA = $a['date'] instanceof Carbon ? $a['date']->timestamp : Carbon::parse($a['date'])->timestamp;
            $timeB = $b['date'] instanceof Carbon ? $b['date']->timestamp : Carbon::parse($b['date'])->timestamp;
            return $timeA <=> $timeB;
        });

        $entries = [];
        $runningBalance = $initialBalance;
        $totalCredit = 0.0;
        $totalDebit = 0.0;

        if (abs($initialBalance) > 0) {
            $entries[] = [
                'type' => 'initial',
                'date' => optional($account->created_at)->toDateTimeString(),
                'reference' => 'Initial Balance',
                'related_reference' => null,
                'description' => 'Initial Balance',
                'credit' => (float) $initialBalance,
                'debit' => 0.0,
                'balance' => (float) $runningBalance,
            ];
            $totalCredit += $initialBalance;
        }

        foreach ($transactions as $tx) {
            $credit = (float) ($tx['credit'] ?? 0);
            $debit = (float) ($tx['debit'] ?? 0);
            $runningBalance += $credit - $debit;

            $entries[] = [
                'type' => $credit > 0 ? 'credit' : 'debit',
                'date' => ($tx['date'] instanceof Carbon ? $tx['date'] : Carbon::parse($tx['date']))->toDateTimeString(),
                'reference' => $tx['reference'] ?? null,
                'related_reference' => $tx['related_reference'] ?? null,
                'description' => $tx['description'] ?? null,
                'credit' => $credit,
                'debit' => $debit,
                'balance' => round($runningBalance, 6),
            ];

            $totalCredit += $credit;
            $totalDebit += $debit;
        }

        return response()->json([
            'status' => 200,
            'data' => [
                'account' => [
                    'id' => $account->id,
                    'name' => $account->name,
                    'account_no' => $account->account_no,
                    'initial_balance' => (float) ($account->initial_balance ?? 0),
                ],
                'filters' => [
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'type' => $type,
                ],
                'totals' => [
                    'credit' => round($totalCredit, 6),
                    'debit' => round($totalDebit, 6),
                    'closing_balance' => round($runningBalance, 6),
                ],
                'transactions' => $entries,
            ],
        ]);
    }

    private function summarizeAccount(Account $account): array
    {
        $paymentReceived = Payment::whereNotNull('sale_id')
            ->where('account_id', $account->id)
            ->sum('amount');

        $returnPurchase = ReturnPurchase::where('account_id', $account->id)
            ->sum('grand_total');

        $receivedTransfers = MoneyTransfer::where('to_account_id', $account->id)
            ->sum('amount');

        $income = Income::where('account_id', $account->id)
            ->sum('amount');

        $credit = $paymentReceived + $returnPurchase + $receivedTransfers + ($account->initial_balance ?? 0) + $income;

        $salesReturns = SaleReturn::with('sale')
            ->where('account_id', $account->id)
            ->get();

        $salesReturnDebit = 0.0;
        foreach ($salesReturns as $return) {
            $sale = $return->sale;
            if (!$sale) {
                continue;
            }

            $saleTotal = $sale->grand_total;
            $paid = $sale->paid_amount;
            $returnAmount = $return->grand_total;
            $due = $saleTotal - $paid;

            $dueAdjust = min($due, $returnAmount);
            $refund = $returnAmount - $dueAdjust;

            if ($refund > 0) {
                $salesReturnDebit += $refund;
            }
        }

        $paymentSent = Payment::whereNotNull('purchase_id')
            ->where('account_id', $account->id)
            ->sum('amount');

        $expenses = Expense::where('account_id', $account->id)->sum('amount');
        $payrolls = Payroll::where('account_id', $account->id)->sum('amount');

        $sentTransfers = MoneyTransfer::where('from_account_id', $account->id)
            ->sum('amount');

        $debit = $salesReturnDebit + $paymentSent + $expenses + $payrolls + $sentTransfers;

        return [
            'credit' => round($credit, 6),
            'debit' => round($debit, 6),
            'balance' => round($credit - $debit, 6),
        ];
    }
}

