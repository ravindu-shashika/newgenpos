<?php

namespace App\Http\Controllers;

use App\Models\MoneyTransfer;
use App\Models\Account;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;

class MoneyTransferController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('money-transfer')){
            $lims_money_transfer_all = MoneyTransfer::get();
            $lims_account_list = Account::where('is_active', true)->get();
            return view('backend.money_transfer.index', compact('lims_money_transfer_all', 'lims_account_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['reference_no'] = 'mtr-' . date("Ymd") . '-'. date("his");
        MoneyTransfer::create($data);
        return redirect()->back()->with('message', __('db.Money transfered successfully'));
    }

    public function update(Request $request, $id)
    {
        $data = $request->all();
        MoneyTransfer::find($data['id'])->update($data);
        return redirect()->back()->with('message', __('db.Money transfer updated successfully'));
    }

    public function destroy($id)
    {
        MoneyTransfer::find($id)->delete();
        return redirect()->back()->with('not_permitted', __('db.Data deleted successfully'));
    }

    /**
     * API: List money transfers (for React).
     */
    public function indexApi(Request $request)
    {
        $transfers = MoneyTransfer::with(['fromAccount:id,name,account_no', 'toAccount:id,name,account_no'])
            ->orderBy('created_at', 'desc')
            ->get();
        $general_setting = \App\Models\GeneralSetting::latest()->first();
        $decimal = $general_setting ? (int) $general_setting->decimal : 2;
        $date_format = $general_setting ? ($general_setting->date_format ?? 'Y-m-d') : 'Y-m-d';

        $data = $transfers->map(function ($t) use ($decimal, $date_format) {
            return [
                'id' => $t->id,
                'reference_no' => $t->reference_no,
                'from_account_id' => $t->from_account_id,
                'to_account_id' => $t->to_account_id,
                'from_account_name' => $t->fromAccount ? $t->fromAccount->name : '—',
                'to_account_name' => $t->toAccount ? $t->toAccount->name : '—',
                'amount' => $t->amount,
                'amount_formatted' => number_format((float) $t->amount, $decimal, '.', ''),
                'created_at' => $t->created_at?->format('Y-m-d H:i:s'),
                'created_at_formatted' => $t->created_at ? $t->created_at->format($date_format) . ' ' . $t->created_at->format('H:i:s') : '—',
            ];
        });
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Get accounts for dropdown (for React).
     */
    public function accountsApi()
    {
        $accounts = Account::where('is_active', true)->orderBy('name')->get(['id', 'name', 'account_no']);
        return response()->json(['status' => 200, 'data' => $accounts]);
    }

    /**
     * API: Store money transfer (for React).
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0.01',
        ]);
        if ($request->from_account_id == $request->to_account_id) {
            return response()->json(['status' => 400, 'message' => __('db.From and To account must be different')], 400);
        }
        $data = $request->only('from_account_id', 'to_account_id', 'amount');
        $data['reference_no'] = 'mtr-' . date('Ymd') . '-' . date('his');
        MoneyTransfer::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Money transfered successfully')]);
    }

    /**
     * API: Update money transfer (for React).
     */
    public function updateApi(Request $request, $id)
    {
        $transfer = MoneyTransfer::find($id);
        if (!$transfer) {
            return response()->json(['status' => 404, 'message' => 'Money transfer not found'], 404);
        }
        $request->validate([
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0.01',
        ]);
        if ($request->from_account_id == $request->to_account_id) {
            return response()->json(['status' => 400, 'message' => __('db.From and To account must be different')], 400);
        }
        $data = $request->only('from_account_id', 'to_account_id', 'amount');
        $transfer->update($data);
        if ($request->filled('created_at')) {
            $transfer->created_at = \Carbon\Carbon::parse($request->created_at);
            $transfer->save();
        }
        return response()->json(['status' => 200, 'message' => __('db.Money transfer updated successfully')]);
    }

    /**
     * API: Destroy money transfer (for React).
     */
    public function destroyApi($id)
    {
        $transfer = MoneyTransfer::find($id);
        if (!$transfer) {
            return response()->json(['status' => 404, 'message' => 'Money transfer not found'], 404);
        }
        $transfer->delete();
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }
}
