<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExpenseCategoryApiController extends Controller
{
    public function index(): JsonResponse
    {
        $items = ExpenseCategory::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']);
        return response()->json(['status' => 200, 'data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => [
                'required',
                'max:255',
                Rule::unique('expense_categories')->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'name' => 'required|string|max:255',
        ]);
        ExpenseCategory::create([
            'code' => $request->code,
            'name' => $request->name,
            'is_active' => true,
        ]);
        return response()->json(['status' => 200, 'message' => __('db.Data inserted successfully')]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'expense_category_id' => 'required|integer|exists:expense_categories,id',
            'code' => [
                'required',
                'max:255',
                Rule::unique('expense_categories')->ignore($request->expense_category_id)->where(fn ($q) => $q->where('is_active', 1)),
            ],
            'name' => 'required|string|max:255',
        ]);
        $item = ExpenseCategory::findOrFail($request->expense_category_id);
        $item->update($request->only('code', 'name'));
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfully')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = ExpenseCategory::findOrFail($id);
        $item->update(['is_active' => false]);
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }

    public function generateCode(): JsonResponse
    {
        $code = (string) random_int(10000000, 99999999);
        return response()->json(['status' => 200, 'code' => $code]);
    }
}
