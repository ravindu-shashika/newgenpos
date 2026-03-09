<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\ExpenseResource;
use App\Http\Requests\StoreExpenseRequest;
use App\Models\Expense;
use App\Models\Account;
use App\Models\Warehouse;
use App\Models\CashRegister;
use App\Traits\StaffAccess;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use DB;

class ExpenseController extends Controller
{
    use StaffAccess;
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('expenses-index')){
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

            $expenses = Expense::with('warehouse', 'expenseCategory')
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json(
                ExpenseResource::collection($expenses)
            );
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
    
    public function store(StoreExpenseRequest $request)
    {
        $data = $request->all();
        if(isset($data['created_at']))
            $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
        else
            $data['created_at'] = date("Y-m-d H:i:s");
        $data['reference_no'] = 'er-' . date("Ymd") . '-'. date("his");
        $data['user_id'] = Auth::id();
        $cash_register_data = CashRegister::where([
            ['user_id', $data['user_id']],
            ['warehouse_id', $data['warehouse_id']],
            ['status', true]
        ])->first();
        if($cash_register_data)
            $data['cash_register_id'] = $cash_register_data->id;
        Expense::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }

    public function update(StoreExpenseRequest $request, Expense $expense)
    {
        $data = $request->all();
        $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
        $expense->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => $expense,
        ], 200);
    }
    
    public function destroy(Expense $expense)
    {
        $expense->delete();
         return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
