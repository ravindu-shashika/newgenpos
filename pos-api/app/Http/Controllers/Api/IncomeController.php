<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\IncomeResource;
use App\Http\Requests\StoreIncomeRequest;
use Illuminate\Http\Request;
use App\Models\Income;
use App\Models\Account;
use App\Models\Warehouse;
use App\Models\CashRegister;
use App\Traits\StaffAccess;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use DB;

class IncomeController extends Controller
{
    use StaffAccess;

    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('incomes-index')){
            $permissions = $role->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';

            if($request->starting_date) {
                $starting_date = $request->starting_date;
                $ending_date = $request->ending_date;
            }
            else {
                $starting_date = date('Y-m-01', strtotime('-1 year', strtotime(date('Y-m-d'))));
                $ending_date = date("Y-m-d");
            }

            if($request->input('warehouse_id'))
                $warehouse_id = $request->input('warehouse_id');
            else
                $warehouse_id = 0;

            $incomes = Income::with('warehouse', 'incomeCategory')
                                ->orderBy('created_at', 'desc')
                                ->get();
            return response()->json(IncomeResource::collection($incomes));
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
    
    public function store(StoreIncomeRequest $request)
    {
        $data = $request->all();
        if(isset($data['created_at']))
            $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
        else
            $data['created_at'] = date("Y-m-d H:i:s");
        $data['reference_no'] = 'ir-' . date("Ymd") . '-'. date("his");
        $data['user_id'] = Auth::id();
        $cash_register_data = CashRegister::where([
            ['user_id', $data['user_id']],
            ['warehouse_id', $data['warehouse_id']],
            ['status', true]
        ])->first();
        if($cash_register_data)
            $data['cash_register_id'] = $cash_register_data->id;
        Income::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }
    
    public function update(StoreIncomeRequest $request, Income $income)
    {
        $data = $request->all();
     
        $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
        $income->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new IncomeResource($income),
        ], 200);
    }

    public function deleteBySelection(StoreIncomeRequest $request)
    {
        $income_id = $request['incomeIdArray'];
        foreach ($income_id as $id) {
            $lims_income_data = Income::find($id);
            $lims_income_data->delete();
        }
        return 'income deleted successfully!';
    }

    public function destroy(Income $income)
    {
        $income->delete();
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
