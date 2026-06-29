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
use App\Traits\SpaResponse;
use DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use Carbon\Carbon;

class AccountsController extends Controller
{
    use SpaResponse;

    public function index(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return app(AccountDashboardController::class)->index($request);
        }

        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('account-index')) {
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_account_all = Account::where('is_active', true)->get();
        $dashboard = app(AccountDashboardController::class);

        foreach ($lims_account_all as $account) {
            $account->balance = $dashboard->computeBalance($account);
        }

        return view('backend.account.index', compact('lims_account_all'));
    }



    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_no' => [
                'required',
                'max:255',
                Rule::unique('accounts')->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
            'initial_balance' => 'nullable|numeric',
            'note' => 'nullable|string|max:1000',
        ]);

        $lims_account_data = Account::where('is_active', true)->first();
        $data = $validated;
        $data['initial_balance'] = $data['initial_balance'] ?? 0;
        $data['total_balance'] = $data['initial_balance'] ?: 0;
        if (!$lims_account_data) {
            $data['is_default'] = 1;
        }
        $data['is_active'] = true;
        Account::create($data);

        $message = __('db.Account created successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 201);
        }

        return redirect('accounts')->with('message', $message);
    }

    public function makeDefault(Request $request, $id)
    {
        $currentDefault = Account::where('is_default', true)->first();
        if ($currentDefault) {
            $currentDefault->is_default = false;
            $currentDefault->save();
        }

        $account = Account::find($id);
        if (!$account) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Account not found')], 404);
            }

            return __('db.Account not found');
        }

        $account->is_default = true;
        $account->save();

        $message = 'Account set as default successfully';
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function update(Request $request, $id)
    {
        $accountId = (int) ($request->input('account_id') ?: $id);
        $validated = $request->validate([
            'account_no' => [
                'required',
                'max:255',
                Rule::unique('accounts')->ignore($accountId)->where(fn ($query) => $query->where('is_active', 1)),
            ],
            'name' => 'required|max:255',
            'initial_balance' => 'nullable|numeric',
            'note' => 'nullable|string|max:1000',
        ]);

        $lims_account_data = Account::find($accountId);
        if (!$lims_account_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Account not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Account not found'));
        }

        $data = $validated;
        $data['total_balance'] = $data['initial_balance'] ?? 0;

        $lims_account_data->update($data);

        $message = __('db.Account updated successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect('accounts')->with('message', $message);
    }

    public function balanceSheet(Request $request)
    {
        $dashboard = app(BalanceSheetDashboardController::class);

        if ($this->wantsSpaResponse($request)) {
            return $dashboard->index($request);
        }

        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('balance-sheet')) {
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $built = $dashboard->buildRows();
        $lims_account_list = collect($built)->pluck('account')->values();
        $credit = collect($built)->pluck('credit')->values()->all();
        $debit = collect($built)->pluck('debit')->values()->all();

        return view('backend.account.balance_sheet', compact('lims_account_list', 'debit', 'credit'));
    }

    public function accountStatement(Request $request)
    {
        $dashboard = app(AccountStatementDashboardController::class);

        if (!$dashboard->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        if ($this->wantsSpaResponse($request) && $request->isMethod('get')) {
            return $dashboard->formData($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $dashboard->generate($request);
        }

        $payload = $dashboard->buildStatement($request);
        $lims_account_data = Account::find($payload['filters']['account_id']);
        $final_array = collect($payload['data'])
            ->filter(fn ($row) => !$row['is_initial'])
            ->reverse()
            ->values()
            ->map(fn ($row) => [
                $row['date_raw'],
                $row['reference_no'],
                $row['related_transaction'],
                $row['credit_raw'],
                $row['debit_raw'],
                $row['balance_raw'],
            ])
            ->all();
        $initial_balance = $lims_account_data;

        return view('backend.account.account_statement', [
            'lims_account_data' => $lims_account_data,
            'final_array' => $final_array,
            'balance_tracker' => $payload['balance_tracker'],
            'initial_balance' => $initial_balance,
        ]);
    }





    public function destroy(Request $request, $id)
    {
        if ($this->wantsSpaResponse($request)) {
            return app(AccountDashboardController::class)->destroy($request, $id);
        }

        if (!env('USER_VERIFIED')) {
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }
        $lims_account_data = Account::find($id);
        if (!$lims_account_data->is_default) {
            $lims_account_data->is_active = false;
            $lims_account_data->save();

            return redirect('accounts')->with('not_permitted', __('db.Account deleted successfully!'));
        }

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
