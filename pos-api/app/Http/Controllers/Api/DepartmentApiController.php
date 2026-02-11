<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Auth;
use Spatie\Permission\Models\Role;

class DepartmentApiController extends Controller
{
    public function index(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('department')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $departments = Department::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        return response()->json(['status' => 200, 'data' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => [
                'required',
                'max:255',
                Rule::unique('departments')->where(fn ($q) => $q->where('is_active', 1)),
            ],
        ]);
        $department = Department::create([
            'name' => $request->name,
            'is_active' => true,
        ]);
        return response()->json(['status' => 200, 'message' => __('db.Department created successfully'), 'data' => $department]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'department_id' => 'required|integer|exists:departments,id',
            'name' => [
                'required',
                'max:255',
                Rule::unique('departments')->ignore($request->department_id)->where(fn ($q) => $q->where('is_active', 1)),
            ],
        ]);
        $dept = Department::findOrFail($request->department_id);
        $dept->update(['name' => $request->name]);
        return response()->json(['status' => 200, 'message' => __('db.Department updated successfully')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $dept = Department::findOrFail($id);
        $dept->update(['is_active' => false]);
        return response()->json(['status' => 200, 'message' => __('db.Department deleted successfully')]);
    }
}
