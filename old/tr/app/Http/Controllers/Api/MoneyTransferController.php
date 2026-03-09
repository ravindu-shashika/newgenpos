<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\MoneyTransferResource;
use App\Http\Requests\StoreAccountRequest;
use App\Models\MoneyTransfer;
use App\Models\Account;
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
            // return $lims_money_transfer_all;
            return response()->json(MoneyTransferResource::collection($lims_money_transfer_all));
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
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
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }

    public function show(MoneyTransfer $moneyTransfer)
    {
        //
    }

    public function edit(MoneyTransfer $moneyTransfer)
    {
        //
    }

    public function update(Request $request, MoneyTransfer $moneyTransfer)
    {
        $data = $request->all();
        $moneyTransfer->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new MoneyTransferResource($moneyTransfer),
        ], 200);;
    }

    public function destroy(MoneyTransfer $moneyTransfer)
    {
        $moneyTransfer->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
