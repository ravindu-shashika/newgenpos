<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Http\Requests\StoreAccountRequest;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Collection;
use App\Models\Account;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Returns;
use App\Models\ReturnPurchase;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Payroll;
use App\Models\MoneyTransfer;
use DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;

class AccountController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('account-index')){
            $lims_account_all = Account::where('is_active', true)->get();
            return response()->json(AccountResource::collection($lims_account_all));
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
    
    public function store(StoreAccountRequest $request)
    {
        $lims_account_data = Account::where('is_active', true)->first();
        $data = $request->all();
        if($data['initial_balance'])
            $data['total_balance'] = $data['initial_balance'];
        else
            $data['total_balance'] = 0;
        if(!$lims_account_data)
            $data['is_default'] = 1;
        $data['is_active'] = true;
        Account::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Account created successfully.',
        ], 201);
    }
    
    public function update(StoreAccountRequest $request, Account $account)
    {
        $data = $request->all();
        if($data['initial_balance'])
            $data['total_balance'] = $data['initial_balance'];
        else
            $data['total_balance'] = 0;
        $account->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new AccountResource($account),
        ], 200);
    }
    
    public function destroy(Account $account)
    {
       
        if(!$account->is_default){
            $account->is_active = false;
            $account->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Data has been deleted successfully.'
            ], 200);
        
        }
    }
    
    public function balanceSheet(Request $request)
    {
        $user = Auth::user();
        $role = Role::find($user->role_id);

        if (!$role || !$role->hasPermissionTo('balance-sheet')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lims_account_list = Account::where('is_active', true)->get();
        $debit = [];
        $credit = [];
        $accounts = [];

        foreach ($lims_account_list as $account) {
            $payment_received = Payment::whereNotNull('sale_id')->where('account_id', $account->id)->sum('amount');
            $payment_sent = Payment::whereNotNull('purchase_id')->where('account_id', $account->id)->sum('amount');
            $returns = DB::table('returns')->where('account_id', $account->id)->sum('grand_total');
            $return_purchase = DB::table('return_purchases')->where('account_id', $account->id)->sum('grand_total');
            $expenses = DB::table('expenses')->where('account_id', $account->id)->sum('amount');
            $payrolls = DB::table('payrolls')->where('account_id', $account->id)->sum('amount');
            $sent_money_via_transfer = MoneyTransfer::where('from_account_id', $account->id)->sum('amount');
            $received_money_via_transfer = MoneyTransfer::where('to_account_id', $account->id)->sum('amount');

            $credit_amount = $payment_received + $return_purchase + $received_money_via_transfer + $account->initial_balance;
            $debit_amount = $payment_sent + $returns + $expenses + $payrolls + $sent_money_via_transfer;
            $balance = $credit_amount - $debit_amount;

            $accounts[] = [
                'account' => new AccountResource($account),
                'credit' => number_format((float)$credit, config('decimal')),
                'debit' => number_format((float)($debit_amount * -1), config('decimal')),
                'balance' => number_format((float)$balance, config('decimal')),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $accounts
        ]);
    }
    
    // public function accountStatement(Request $request)
    // {
    //     $data = $request->all();
    
    //     $lims_account_data = Account::find($data['account_id']);
    //     if (!$lims_account_data) {
    //         return response()->json(['status' => false, 'message' => 'Account not found'], 404);
    //     }
    
    //     $credit_list = new Collection;
    //     $debit_list = new Collection;
    //     $expense_list = new Collection;
    //     $return_list = new Collection;
    //     $purchase_return_list = new Collection;
    //     $payroll_list = new Collection;
    //     $recieved_money_transfer_list = new Collection;
    //     $sent_money_transfer_list = new Collection;
    
    //     if ($data['type'] == '0' || $data['type'] == '2') {
    //         $credit_list = Payment::whereNotNull('sale_id')
    //                         ->where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('payment_reference as reference_no', 'sale_id', 'amount', 'created_at')
    //                         ->get();
    
    //         $recieved_money_transfer_list = MoneyTransfer::where('to_account_id', $data['account_id'])
    //                                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                                         ->select('reference_no', 'to_account_id', 'amount', 'created_at')
    //                                         ->get();
    
    //         $purchase_return_list = ReturnPurchase::where('account_id', $data['account_id'])
    //                                 ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                                 ->select('reference_no', 'grand_total as amount', 'created_at')
    //                                 ->get();
    //     }
    
    //     if ($data['type'] == '0' || $data['type'] == '1') {
    //         $debit_list = Payment::whereNotNull('purchase_id')
    //                         ->where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('payment_reference as reference_no', 'purchase_id', 'amount', 'created_at')
    //                         ->get();
    
    //         $expense_list = Expense::where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('reference_no', 'amount', 'created_at')
    //                         ->get();
    
    //         $income_list = Income::where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('reference_no', 'amount', 'created_at')
    //                         ->get();
    
    //         $return_list = Returns::where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('reference_no', 'grand_total as amount', 'created_at')
    //                         ->get();
    
    //         $payroll_list = Payroll::where('account_id', $data['account_id'])
    //                         ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                         ->select('reference_no', 'amount', 'created_at')
    //                         ->get();
    
    //         $sent_money_transfer_list = MoneyTransfer::where('from_account_id', $data['account_id'])
    //                                     ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
    //                                     ->select('reference_no', 'to_account_id', 'amount', 'created_at')
    //                                     ->get();
    //     }
    
    //     // Combine transactions
    //     $all_transaction_list = $credit_list->concat($recieved_money_transfer_list)
    //                             ->concat($debit_list)
    //                             ->concat($expense_list)
    //                             ->concat($income_list)
    //                             ->concat($return_list)
    //                             ->concat($purchase_return_list)
    //                             ->concat($payroll_list)
    //                             ->concat($sent_money_transfer_list)
    //                             ->sortByDesc('created_at');
    
    //     // Fetch related transactions in bulk
    //     $sale_references = Sale::whereIn('id', $all_transaction_list->pluck('sale_id')->filter())->pluck('reference_no', 'id');
    //     $purchase_references = Purchase::whereIn('id', $all_transaction_list->pluck('purchase_id')->filter())->pluck('reference_no', 'id');
    
    //     // Process and format transactions
    //     $balance = 0;
    //     $transactions = $all_transaction_list->map(function ($data) use (&$balance, $lims_account_data, $sale_references, $purchase_references) {
    //         $transaction_ref = $data->sale_id ? ($sale_references[$data->sale_id] ?? '') :
    //                             ($data->purchase_id ? ($purchase_references[$data->purchase_id] ?? '') : '');
    
    //         if (str_contains($data->reference_no, 'spr') || str_contains($data->reference_no, 'prr') || 
    //             (str_contains($data->reference_no, 'mtr') && $data->to_account_id == $lims_account_data->id)) {
    //             $balance += $data->amount;
    //             $credit = $data->amount;
    //             $debit = 0;
    //         } else {
    //             $balance -= $data->amount;
    //             $debit = $data->amount;
    //             $credit = 0;
    //         }
    
    //         return [
    //             'date' => $data->created_at->format('Y-m-d'),
    //             'reference_no' => $data->reference_no,
    //             'related_transaction' => $transaction_ref,
    //             'credit' => number_format($credit, 2, '.', ''),
    //             'debit' => number_format($debit, 2, '.', ''),
    //             'balance' => number_format($balance, 2, '.', ''),
    //         ];
    //     });
    
    //     return response()->json([
    //         'status' => true,
    //         'message' => 'Account statement retrieved successfully',
    //         'account' => [
    //             'id' => $lims_account_data->id,
    //             'name' => $lims_account_data->name
    //         ],
    //         'transactions' => $transactions
    //     ], 200);
    // }
    public function accountStatement(Request $request)
    {
        $data = $request->all();
    
        $lims_account_data = Account::find($data['account_id']);
        $credit_list = new Collection;
        $debit_list = new Collection;
        $expense_list = new Collection;
        $return_list = new Collection;
        $purchase_return_list = new Collection;
        $payroll_list = new Collection;
        $recieved_money_transfer_list = new Collection;
        $sent_money_transfer_list = new Collection;
    
        if ($data['type'] == '0' || $data['type'] == '2') {
            $credit_list = Payment::whereNotNull('sale_id')
                            ->where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('payment_reference as reference_no', 'sale_id', 'amount', 'created_at')
                            ->get();
    
            $recieved_money_transfer_list = MoneyTransfer::where('to_account_id', $data['account_id'])
                                        ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                                        ->select('reference_no', 'to_account_id', 'amount', 'created_at')
                                        ->get();
    
            $purchase_return_list = ReturnPurchase::where('account_id', $data['account_id'])
                                    ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                                    ->select('reference_no', 'grand_total as amount', 'created_at')
                                    ->get();
        }
    
        if ($data['type'] == '0' || $data['type'] == '1') {
            $debit_list = Payment::whereNotNull('purchase_id')
                            ->where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('payment_reference as reference_no', 'purchase_id', 'amount', 'created_at')
                            ->get();
    
            $expense_list = Expense::where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('reference_no', 'amount', 'created_at')
                            ->get();
    
            $income_list = Income::where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('reference_no', 'amount', 'created_at')
                            ->get();
    
            $return_list = Returns::where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('reference_no', 'grand_total as amount', 'created_at')
                            ->get();
    
            $payroll_list = Payroll::where('account_id', $data['account_id'])
                            ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                            ->select('reference_no', 'amount', 'created_at')
                            ->get();
    
            $sent_money_transfer_list = MoneyTransfer::where('from_account_id', $data['account_id'])
                                        ->whereBetween('created_at', [$data['start_date'], $data['end_date']])
                                        ->select('reference_no', 'to_account_id', 'amount', 'created_at')
                                        ->get();
        }
    
        // Merge all transactions into a single list
        $all_transaction_list = $credit_list->concat($recieved_money_transfer_list)
                            ->concat($debit_list)
                            ->concat($expense_list)
                            ->concat($income_list)
                            ->concat($return_list)
                            ->concat($purchase_return_list)
                            ->concat($payroll_list)
                            ->concat($sent_money_transfer_list)
                            ->sortByDesc('created_at');
    
        $balance = 0;
        $transactions = [];
    
        foreach ($all_transaction_list as $data) {
            $transaction = null;
            
            if (!empty($data->sale_id)) {
                $transaction = Sale::select('reference_no')->find($data->sale_id);
            } elseif (!empty($data->purchase_id)) {
                $transaction = Purchase::select('reference_no')->find($data->purchase_id);
            }
    
            if (str_contains($data->reference_no, 'spr') || 
                str_contains($data->reference_no, 'prr') || 
                (str_contains($data->reference_no, 'mtr') && $data->to_account_id == $lims_account_data->id)) {
                $balance += $data->amount;
                $credit = $data->amount;
                $debit = 0;
            } else {
                $balance -= $data->amount;
                $debit = $data->amount;
                $credit = 0;
            }
    
            $transactions[] = [
                'date' => $data->created_at->format('d/m/Y'),
                'reference_no' => $data->reference_no,
                'related_transaction' => $transaction ? $transaction->reference_no : null,
                'credit' => number_format((float)$credit,config('decimal')),
                'debit' => number_format((float)$debit, config('decimal')),
                'balance' => number_format((float)$balance,config('decimal')),
            ];
        }
    
        return response()->json([
            'success' => true,
            'account' => [
                'id' => $lims_account_data->id,
                'name' => $lims_account_data->name,
            ],
            'data' => $transactions
        ]);
    }

}
