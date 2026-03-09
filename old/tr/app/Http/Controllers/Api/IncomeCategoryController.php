<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIncomeCategoryRequest;
use App\Http\Resources\IncomeCategoryResource;
use Illuminate\Http\Request;
use App\Models\IncomeCategory;
use Keygen;
use DB;
use Illuminate\Validation\Rule;

class IncomeCategoryController extends Controller
{
    public function index()
    {
        $lims_income_category_all = IncomeCategory::where('is_active', true)->get();
        return response()->json(IncomeCategoryResource::collection($lims_income_category_all));
    }
    
    public function store(StoreIncomeCategoryRequest $request)
    {
        $data = $request->all();
        IncomeCategory::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Data created successfully.',
        ], 201);
    }
    
    public function update(StoreIncomeCategoryRequest $request, IncomeCategory $incomecategory)
    {
        $data = $request->all();
        $incomecategory->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => new IncomeCategoryResource($incomecategory)
        ], 200);
    }

    public function destroy(IncomeCategory $incomecategory)
    {
        $incomecategory->is_active = false;
        $incomecategory->save();
        return response()->json([
            'success' => true,
            'message' => 'Data has been deleted successfully.'
        ], 200);
    }
}
