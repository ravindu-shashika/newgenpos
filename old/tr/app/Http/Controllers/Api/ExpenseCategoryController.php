<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\ExpenseCategoryResource;
use App\Http\Requests\StoreExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use Keygen;
use DB;
use Illuminate\Validation\Rule;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        $lims_expense_category_all = ExpenseCategory::where('is_active', true)->get();
        
        return response()->json(
            ExpenseCategoryResource::collection($lims_expense_category_all)
        );
    }
    
    public function generateCode()
    {
        $id = Keygen::numeric(8)->generate();
        return $id;
    }
    
    public function store(StoreExpenseCategoryRequest $request)
    {
        $data = $request->all();
       
        if(!isset($data['is_active']))
            $data['is_active'] = '0';
     
        ExpenseCategory::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }
    
    public function update(StoreExpenseCategoryRequest $request, ExpenseCategory $expensecategory)
    {
        $data = $request->all();
        $expensecategory->update($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new ExpenseCategoryResource($expensecategory),
        ], 200);
    }
    
    public function destroy(ExpenseCategory $expensecategory)
    {
        $expensecategory->is_active = false;
        $expensecategory->save();
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
    
    public function deleteBySelection(Request $request)
    {
        $expense_category_id = $request['expense_categoryIdArray'];
        foreach ($expense_category_id as $id) {
            $lims_expense_category_data = ExpenseCategory::find($id);
            $lims_expense_category_data->is_active = false;
            $lims_expense_category_data->save();
        }
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
