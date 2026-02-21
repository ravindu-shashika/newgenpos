<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Collection;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Returns;
use App\Models\ReturnPurchase;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Payroll;
use App\Models\MoneyTransfer;
use App\Models\Purchase;
use App\Models\Sale;
use DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use Carbon\Carbon;

class AccountsController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('account-index')) {
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_account_all = Account::where('is_active', true)->get();

        foreach ($lims_account_all as $account) {

            // -------------------
            // CREDIT
            // -------------------
            $payment_received = Payment::whereNotNull('sale_id')
                ->where('account_id', $account->id)
                ->sum('amount');

            $return_purchase = DB::table('return_purchases')
                ->where('account_id', $account->id)
                ->sum('grand_total');

            $recieved_money_via_transfer = MoneyTransfer::where('to_account_id', $account->id)
                ->sum('amount');

            $income = Income::where('account_id', $account->id)
                ->sum('amount');

            $credit = $payment_received + $return_purchase + $recieved_money_via_transfer + ($account->initial_balance ?? 0) + $income;

            // -------------------
            // DEBIT
            // -------------------
            // Sales Return → due adjust + refund logic
            $sales_returns = Returns::with('sale')
                ->where('account_id', $account->id)
                ->get();

            $total_sales_return_debit = 0;
            foreach ($sales_returns as $return) {
                $sale = $return->sale;
                if (!$sale) continue;

                $sale_total  = $sale->grand_total;
                $paid        = $sale->paid_amount;
                $return_amt  = $return->grand_total;
                $due         = $sale_total - $paid;

                $due_adjust  = min($due, $return_amt);
                $refund      = $return_amt - $due_adjust;

                if ($refund > 0) {
                    $total_sales_return_debit += $refund;
                }
            }

            $payment_sent = Payment::whereNotNull('purchase_id')
                ->where('account_id', $account->id)
                ->sum('amount');

            $expenses = DB::table('expenses')
                ->where('account_id', $account->id)
                ->sum('amount');

            $payrolls = DB::table('payrolls')
                ->where('account_id', $account->id)
                ->sum('amount');

            $sent_money_via_transfer = MoneyTransfer::where('from_account_id', $account->id)
                ->sum('amount');

            $debit = $total_sales_return_debit + $payment_sent + $expenses + $payrolls + $sent_money_via_transfer;

            // -------------------
            // FINAL BALANCE
            // -------------------
            $account->balance = $credit - $debit;
        }

        return view('backend.account.index', compact('lims_account_all'));
    }

    /**
     * API: List accounts with computed balance (for React).
     */
    public function accountListApi(Request $request)
    {
        $accounts = Account::where('is_active', true)->get();
        $general_setting = \App\Models\GeneralSetting::latest()->first();
        $decimal = $general_setting ? (int) $general_setting->decimal : 2;

        foreach ($accounts as $account) {
            $payment_received = Payment::whereNotNull('sale_id')->where('account_id', $account->id)->sum('amount');
            $return_purchase = DB::table('return_purchases')->where('account_id', $account->id)->sum('grand_total');
            $recieved_money_via_transfer = MoneyTransfer::where('to_account_id', $account->id)->sum('amount');
            $income = Income::where('account_id', $account->id)->sum('amount');
            $credit = $payment_received + $return_purchase + $recieved_money_via_transfer + ($account->initial_balance ?? 0) + $income;

            $sales_returns = Returns::with('sale')->where('account_id', $account->id)->get();
            $total_sales_return_debit = 0;
            foreach ($sales_returns as $return) {
                $sale = $return->sale;
                if (!$sale) continue;
                $due_adjust = min($sale->grand_total - $sale->paid_amount, $return->grand_total);
                $refund = $return->grand_total - $due_adjust;
                if ($refund > 0) $total_sales_return_debit += $refund;
            }
            $payment_sent = Payment::whereNotNull('purchase_id')->where('account_id', $account->id)->sum('amount');
            $expenses = DB::table('expenses')->where('account_id', $account->id)->sum('amount');
            $payrolls = DB::table('payrolls')->where('account_id', $account->id)->sum('amount');
            $sent_money_via_transfer = MoneyTransfer::where('from_account_id', $account->id)->sum('amount');
            $debit = $total_sales_return_debit + $payment_sent + $expenses + $payrolls + $sent_money_via_transfer;
            $account->balance = $credit - $debit;
        }

        $data = $accounts->map(function ($a) use ($decimal) {
            return [
                'id' => $a->id,
                'account_no' => $a->account_no,
                'name' => $a->name,
                'initial_balance' => $a->initial_balance,
                'initial_balance_formatted' => number_format((float) ($a->initial_balance ?? 0), $decimal, '.', ''),
                'balance' => $a->balance,
                'balance_formatted' => number_format((float) ($a->balance ?? 0), $decimal, '.', ''),
                'is_default' => (bool) $a->is_default,
                'note' => $a->note,
            ];
        });
        return response()->json(['status' => 200, 'data' => $data, 'decimal' => $decimal]);
    }

    /**
     * API: Options for account dropdown.
     */
    public function options()
    {
        $accounts = Account::where('is_active', true)->orderBy('name')->get(['id', 'name', 'account_no', 'is_default']);
        return response()->json(['status' => 200, 'data' => $accounts]);
    }

    /**
     * API: Store account (for React).
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'account_no' => [
                'nullable',
                'max:255',
                Rule::unique('accounts')->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'name' => 'required|string|max:255',
            'initial_balance' => 'nullable|numeric',
            'note' => 'nullable|string|max:500',
        ]);
        $lims_account_data = Account::where('is_active', true)->first();
        $data = $request->only('account_no', 'name', 'initial_balance', 'note');
        $data['total_balance'] = $request->input('initial_balance') ?: 0;
        if (!$lims_account_data) $data['is_default'] = true;
        $data['is_active'] = true;
        Account::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Account created successfully')]);
    }

    /**
     * API: Update account (for React).
     */
    public function updateApi(Request $request, $id)
    {
        $account = Account::where('is_active', true)->find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'message' => 'Account not found'], 404);
        }
        $request->validate([
            'account_no' => [
                'nullable',
                'max:255',
                Rule::unique('accounts')->ignore($id)->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'name' => 'required|string|max:255',
            'initial_balance' => 'nullable|numeric',
            'note' => 'nullable|string|max:500',
        ]);
        $data = $request->only('account_no', 'name', 'initial_balance', 'note');
        $data['total_balance'] = $request->input('initial_balance') ?: 0;
        $account->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Account updated successfully')]);
    }

    /**
     * API: Make account default (for React).
     */
    public function makeDefaultApi($id)
    {
        $current = Account::where('is_default', true)->first();
        if ($current) {
            $current->is_default = false;
            $current->save();
        }
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'message' => 'Account not found'], 404);
        }
        $account->is_default = true;
        $account->save();
        return response()->json(['status' => 200, 'message' => 'Account set as default successfully']);
    }

    /**
     * API: Destroy account (for React).
     */
    public function destroyApi($id)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $account = Account::find($id);
        if (!$account) {
            return response()->json(['status' => 404, 'message' => 'Account not found'], 404);
        }
        if ($account->is_default) {
            return response()->json(['status' => 400, 'message' => __('db.Please make another account default first!')], 400);
        }
        $account->is_active = false;
        $account->save();
        return response()->json(['status' => 200, 'message' => __('db.Account deleted successfully!')]);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'account_no' => [
                'max:255',
                Rule::unique('accounts')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $lims_account_data = Account::where('is_active', true)->first();
        $data = $request->all();
        if ($data['initial_balance'])
            $data['total_balance'] = $data['initial_balance'];
        else
            $data['total_balance'] = 0;
        if (!$lims_account_data)
            $data['is_default'] = 1;
        $data['is_active'] = true;
        Account::create($data);
        return redirect('accounts')->with('message', __('db.Account created successfully'));
    }

    public function makeDefault($id)
    {
        $lims_account_data = Account::where('is_default', true)->first();
        $lims_account_data->is_default = false;
        $lims_account_data->save();

        $lims_account_data = Account::find($id);
        $lims_account_data->is_default = true;
        $lims_account_data->save();

        return 'Account set as default successfully';
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'account_no' => [
                'max:255',
                Rule::unique('accounts')->ignore($request->account_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $data = $request->all();
        $lims_account_data = Account::find($data['account_id']);
        if ($data['initial_balance'])
            $data['total_balance'] = $data['initial_balance'];
        else
            $data['total_balance'] = 0;
        $lims_account_data->update($data);
        return redirect('accounts')->with('message', __('db.Account updated successfully'));
    }

    public function balanceSheet()
    {
        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('balance-sheet')) {
            $lims_account_list = Account::where('is_active', true)->get();
            $debit = [];
            $credit = [];
            foreach ($lims_account_list as $account) {
                $payment_recieved = Payment::whereNotNull('sale_id')->where('account_id', $account->id)->sum('amount');
                $payment_sent = Payment::whereNotNull('purchase_id')->where('account_id', $account->id)->sum('amount');
                $returns = DB::table('returns')->where('account_id', $account->id)->sum('grand_total');
                $return_purchase = DB::table('return_purchases')->where('account_id', $account->id)->sum('grand_total');
                $expenses = DB::table('expenses')->where('account_id', $account->id)->sum('amount');
                $payrolls = DB::table('payrolls')->where('account_id', $account->id)->sum('amount');
                $sent_money_via_transfer = MoneyTransfer::where('from_account_id', $account->id)->sum('amount');
                $recieved_money_via_transfer = MoneyTransfer::where('to_account_id', $account->id)->sum('amount');

                $credit[] = $payment_recieved + $return_purchase + $recieved_money_via_transfer + $account->initial_balance;
                $debit[] = $payment_sent + $returns + $expenses + $payrolls + $sent_money_via_transfer;
            }
            return view('backend.account.balance_sheet', compact('lims_account_list', 'debit', 'credit'));
        } else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    /**
     * API: Balance sheet data for React (accounts with credit, debit, balance).
     */
    public function balanceSheetApi(Request $request)
    {
        $lims_account_list = Account::where('is_active', true)->get();
        $general_setting = \App\Models\GeneralSetting::latest()->first();
        $decimal = $general_setting ? (int) $general_setting->decimal : 2;

        $rows = [];
        foreach ($lims_account_list as $account) {
            $payment_recieved = Payment::whereNotNull('sale_id')->where('account_id', $account->id)->sum('amount');
            $payment_sent = Payment::whereNotNull('purchase_id')->where('account_id', $account->id)->sum('amount');
            $returns = DB::table('returns')->where('account_id', $account->id)->sum('grand_total');
            $return_purchase = DB::table('return_purchases')->where('account_id', $account->id)->sum('grand_total');
            $expenses = DB::table('expenses')->where('account_id', $account->id)->sum('amount');
            $payrolls = DB::table('payrolls')->where('account_id', $account->id)->sum('amount');
            $sent_money_via_transfer = MoneyTransfer::where('from_account_id', $account->id)->sum('amount');
            $recieved_money_via_transfer = MoneyTransfer::where('to_account_id', $account->id)->sum('amount');

            $credit = $payment_recieved + $return_purchase + $recieved_money_via_transfer + ($account->initial_balance ?? 0);
            $debit = $payment_sent + $returns + $expenses + $payrolls + $sent_money_via_transfer;
            $balance = $credit - $debit;

            $rows[] = [
                'id' => $account->id,
                'name' => $account->name,
                'account_no' => $account->account_no,
                'credit' => $credit,
                'debit' => $debit,
                'balance' => $balance,
                'credit_formatted' => number_format((float) $credit, $decimal, '.', ''),
                'debit_formatted' => number_format((float) ($debit * -1), $decimal, '.', ''),
                'balance_formatted' => number_format((float) $balance, $decimal, '.', ''),
            ];
        }
        return response()->json(['status' => 200, 'data' => $rows, 'decimal' => $decimal]);
    }

    public function accountStatement(Request $request)
    {
        $data = $request->all();

        $lims_account_data = Account::find($data['account_id']);
        $initial_balance =  $lims_account_data;

        $start_date = Carbon::parse($data['start_date'])->startOfDay();
        $end_date   = Carbon::parse($data['end_date'])->endOfDay();

        $balance = $initial_balance->initial_balance ?? 0;

        $account_statement_array = collect();

        // -----------------------------
        // CREDIT TRANSACTIONS
        // -----------------------------
        if ($data['type'] == '0' || $data['type'] == '2') {

            // Sale Payment
            $sale_payments = Payment::whereNotNull('sale_id')
                ->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';
                    return $item;
                });

            // Money Received
            $money_received = MoneyTransfer::where('to_account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';
                    return $item;
                });

            // Purchase Return
            $purchase_return = ReturnPurchase::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';
                    $item->amount = $item->grand_total;
                    return $item;
                });

            // Income
            $income = Income::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'credit';
                    return $item;
                });

            $account_statement_array = $account_statement_array
                ->concat($sale_payments)
                ->concat($money_received)
                ->concat($purchase_return)
                ->concat($income);
        }

        // -----------------------------
        // DEBIT TRANSACTIONS
        // -----------------------------
        if ($data['type'] == '0' || $data['type'] == '1') {

            // Purchase Payment
            $purchase_payment = Payment::whereNotNull('purchase_id')
                ->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';
                    return $item;
                });

            // Expenses
            $expense = Expense::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';
                    return $item;
                });

            // Payroll
            $payroll = Payroll::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';
                    return $item;
                });

            // Money Sent
            $money_sent = MoneyTransfer::where('from_account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($item) {
                    $item->type = 'debit';
                    return $item;
                });

            // Sales Return → DEBIT calculation
            $sales_returns = Returns::with('sale')
                ->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])
                ->get()
                ->map(function ($return) {
                    $sale = $return->sale;
                    if (!$sale) return null;

                    $sale_total = $sale->grand_total;
                    $paid       = $sale->paid_amount;
                    $return_amt = $return->grand_total;
                    $due        = $sale_total - $paid;

                    $due_adjust = min($due, $return_amt);
                    $refund     = $return_amt - $due_adjust;

                    if ($refund > 0) {
                        $obj = new \stdClass();
                        $obj->reference_no = $return->reference_no;
                        $obj->amount       = $refund;
                        $obj->created_at   = $return->created_at;
                        $obj->type         = 'debit';
                        return $obj;
                    }
                    return null;
                })->filter();

            $account_statement_array = $account_statement_array
                ->concat($purchase_payment)
                ->concat($expense)
                ->concat($payroll)
                ->concat($money_sent)
                ->concat($sales_returns);
        }

        // -----------------------------
        // Sort by created_at ASC
        // -----------------------------
        $account_statement_array = $account_statement_array->sortBy('created_at')->values();

        // -----------------------------
        // Build balance for each row
        // -----------------------------
        $balance_tracker = $balance;
        $final_array = [];
        foreach ($account_statement_array as $data) {
            $credit = $data->type == 'credit' ? $data->amount : 0;
            $debit  = $data->type == 'debit' ? $data->amount : 0;

            $balance_tracker += $credit;
            $balance_tracker -= $debit;

            $transaction_ref = '';
            if (isset($data->sale_id)) {
                $transaction_ref = Sale::where('id', $data->sale_id)->value('reference_no');
            } elseif (isset($data->purchase_id)) {
                $transaction_ref = Purchase::where('id', $data->purchase_id)->value('reference_no');
            }

            $final_array[] = [
                $data->created_at,
                $data->reference_no,
                $transaction_ref,
                $credit,
                $debit,
                $balance_tracker
            ];
        }
        return view('backend.account.account_statement', compact(
            'lims_account_data',
            'final_array',
            'balance_tracker',
            'initial_balance'
        ));
    }

    /**
     * API: Account statement for React (account_id, start_date, end_date, type).
     * type: 0 = all, 1 = debit only, 2 = credit only.
     */
    public function statementApi(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'nullable|in:0,1,2',
        ]);
        $data = $request->only('account_id', 'start_date', 'end_date', 'type');
        $data['type'] = $data['type'] ?? '0';

        $lims_account_data = Account::find($data['account_id']);
        if (!$lims_account_data || !$lims_account_data->is_active) {
            return response()->json(['status' => 404, 'message' => 'Account not found'], 404);
        }
        $initial_balance = $lims_account_data;
        $start_date = Carbon::parse($data['start_date'])->startOfDay();
        $end_date = Carbon::parse($data['end_date'])->endOfDay();
        $balance = $initial_balance->initial_balance ?? 0;
        $account_statement_array = collect();

        if ($data['type'] == '0' || $data['type'] == '2') {
            $sale_payments = Payment::whereNotNull('sale_id')->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'credit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->payment_reference ?? '', 'sale_id' => $item->sale_id, 'purchase_id' => $item->purchase_id]);
            $money_received = MoneyTransfer::where('to_account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'credit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $purchase_return = ReturnPurchase::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'credit', 'amount' => $item->grand_total, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $income = Income::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'credit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $account_statement_array = $account_statement_array->concat($sale_payments)->concat($money_received)->concat($purchase_return)->concat($income);
        }

        if ($data['type'] == '0' || $data['type'] == '1') {
            $purchase_payment = Payment::whereNotNull('purchase_id')->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'debit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->payment_reference ?? '', 'sale_id' => $item->sale_id, 'purchase_id' => $item->purchase_id]);
            $expense = Expense::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'debit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $payroll = Payroll::where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'debit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $money_sent = MoneyTransfer::where('from_account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(fn ($item) => (object) ['type' => 'debit', 'amount' => $item->amount, 'created_at' => $item->created_at, 'reference_no' => $item->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null]);
            $sales_returns = Returns::with('sale')->where('account_id', $data['account_id'])
                ->whereBetween('created_at', [$start_date, $end_date])->get()
                ->map(function ($return) {
                    $sale = $return->sale;
                    if (!$sale) return null;
                    $refund = $return->grand_total - min($sale->grand_total - $sale->paid_amount, $return->grand_total);
                    if ($refund <= 0) return null;
                    return (object) ['type' => 'debit', 'amount' => $refund, 'created_at' => $return->created_at, 'reference_no' => $return->reference_no ?? '', 'sale_id' => null, 'purchase_id' => null];
                })->filter();
            $account_statement_array = $account_statement_array->concat($purchase_payment)->concat($expense)->concat($payroll)->concat($money_sent)->concat($sales_returns);
        }

        $account_statement_array = $account_statement_array->sortBy('created_at')->values();
        $general_setting = \App\Models\GeneralSetting::latest()->first();
        $decimal = $general_setting ? (int) $general_setting->decimal : 2;
        $date_format = $general_setting ? ($general_setting->date_format ?? 'Y-m-d') : 'Y-m-d';

        $balance_tracker = $balance;
        $rows = [];
        foreach ($account_statement_array as $row) {
            $credit = $row->type == 'credit' ? $row->amount : 0;
            $debit = $row->type == 'debit' ? $row->amount : 0;
            $balance_tracker += $credit - $debit;
            $transaction_ref = '';
            if (!empty($row->sale_id)) {
                $transaction_ref = Sale::where('id', $row->sale_id)->value('reference_no') ?? '';
            } elseif (!empty($row->purchase_id)) {
                $transaction_ref = Purchase::where('id', $row->purchase_id)->value('reference_no') ?? '';
            }
            $created_at = $row->created_at;
            $date_str = $created_at ? \Carbon\Carbon::parse($created_at)->format($date_format) . ' ' . \Carbon\Carbon::parse($created_at)->format('H:i:s') : '';
            $rows[] = [
                'date' => $created_at ? \Carbon\Carbon::parse($created_at)->format('Y-m-d H:i:s') : '',
                'date_formatted' => $date_str,
                'reference_no' => $row->reference_no ?? '',
                'related_transaction' => $transaction_ref,
                'credit' => $credit,
                'debit' => $debit,
                'balance' => $balance_tracker,
                'credit_formatted' => number_format((float) $credit, $decimal, '.', ''),
                'debit_formatted' => number_format((float) $debit, $decimal, '.', ''),
                'balance_formatted' => number_format((float) $balance_tracker, $decimal, '.', ''),
            ];
        }

        $initial_balance_created = $initial_balance->created_at ? \Carbon\Carbon::parse($initial_balance->created_at)->format($date_format) . ' ' . \Carbon\Carbon::parse($initial_balance->created_at)->format('H:i:s') : '';
        $initial_balance_val = (float) ($initial_balance->initial_balance ?? 0);
        $initial_balance_row = [
            'date_formatted' => $initial_balance_created,
            'reference_no' => __('db.Initial Balance'),
            'related_transaction' => '------',
            'credit' => $initial_balance_val,
            'debit' => 0,
            'balance' => $initial_balance_val,
            'credit_formatted' => number_format($initial_balance_val, $decimal, '.', ''),
            'debit_formatted' => number_format(0, $decimal, '.', ''),
            'balance_formatted' => number_format($initial_balance_val, $decimal, '.', ''),
            'is_initial_balance' => true,
        ];

        $account = [
            'id' => $lims_account_data->id,
            'name' => $lims_account_data->name,
            'account_no' => $lims_account_data->account_no,
        ];
        return response()->json([
            'status' => 200,
            'account' => $account,
            'initial_balance_row' => $initial_balance_row,
            'rows' => $rows,
            'decimal' => $decimal,
            'date_format' => $date_format,
        ]);
    }



    public function destroy($id)
    {
        if (!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        $lims_account_data = Account::find($id);
        if (!$lims_account_data->is_default) {
            $lims_account_data->is_active = false;
            $lims_account_data->save();
            return redirect('accounts')->with('not_permitted', __('db.Account deleted successfully!'));
        } else
            return redirect('accounts')->with('not_permitted', __('db.Please make another account default first!'));
    }

    public function accountsAll()
    {
        $lims_account_list = DB::table('accounts')->where('is_active', true)->get();

        $html = '';
        foreach ($lims_account_list as $account) {
            if ($account->is_default == 1) {
                $html .= '<option selected value="' . $account->id . '">' . $account->name . ' (' . $account->account_no . ')' . '</option>';
            } else {
                $html .= '<option value="' . $account->id . '">' . $account->name . ' (' . $account->account_no . ')' . '</option>';
            }
        }

        return response()->json($html);
    }
}
