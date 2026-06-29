<?php

namespace App\Http\Controllers;

use App\Models\MoneyTransfer;
use App\Models\Account;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class MoneyTransferController extends Controller
{
    use SpaResponse;

    public function index(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return app(MoneyTransferDashboardController::class)->index($request);
        }

        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('money-transfer')) {
            $lims_money_transfer_all = MoneyTransfer::get();
            $lims_account_list = Account::where('is_active', true)->get();

            return view('backend.money_transfer.index', compact('lims_money_transfer_all', 'lims_account_list'));
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_account_id' => 'required|exists:accounts,id|different:to_account_id',
            'to_account_id' => 'required|exists:accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $data = $validated;
        $data['reference_no'] = 'mtr-'.date('Ymd').'-'.date('his');
        MoneyTransfer::create($data);

        $message = __('db.Money transfered successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message], 201);
        }

        return redirect()->back()->with('message', $message);
    }

    public function update(Request $request, $id)
    {
        $transferId = (int) ($request->input('id') ?: $id);
        $transfer = MoneyTransfer::find($transferId);
        if (!$transfer) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Money transfer not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.Money transfer not found'));
        }

        $validated = $request->validate([
            'from_account_id' => 'required|exists:accounts,id|different:to_account_id',
            'to_account_id' => 'required|exists:accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:0.01',
            'created_at' => 'nullable|string',
        ]);

        $data = $validated;
        if (!empty($data['created_at'])) {
            $data['created_at'] = normalize_to_sql_datetime($data['created_at']);
        } else {
            unset($data['created_at']);
        }

        $transfer->update($data);

        $message = __('db.Money transfer updated successfully');
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function destroy(Request $request, $id)
    {
        if ($this->wantsSpaResponse($request)) {
            return app(MoneyTransferDashboardController::class)->destroy($request, $id);
        }

        MoneyTransfer::find($id)->delete();

        return redirect()->back()->with('not_permitted', __('db.Data deleted successfully'));
    }
}
