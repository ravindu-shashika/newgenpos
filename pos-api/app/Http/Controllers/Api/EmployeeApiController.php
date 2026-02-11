<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Shift;
use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;
use Auth;
use Spatie\Permission\Models\Role;

class EmployeeApiController extends Controller
{
    public function index(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('employees-index')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $employees = Employee::with(['department:id,name', 'designation:id,name', 'user:id,name'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
        return response()->json(['status' => 200, 'data' => $employees]);
    }

    public function formData(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('employees-add')) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $departments = Department::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $designations = Designation::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $shifts = Shift::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $roles = Role::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        return response()->json([
            'status' => 200,
            'departments' => $departments,
            'designations' => $designations,
            'shifts' => $shifts,
            'warehouses' => $warehouses,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees')->where(fn ($q) => $q->where('is_active', true)),
            ],
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'department_id' => 'nullable|integer|exists:departments,id',
            'designation_id' => 'nullable|integer|exists:designations,id',
            'shift_id' => 'nullable|integer|exists:shifts,id',
            'staff_id' => 'nullable|string|max:100',
            'basic_salary' => 'nullable|numeric|min:0',
        ]);
        $data = $request->only(
            'name', 'email', 'phone_number', 'address', 'city', 'country',
            'department_id', 'designation_id', 'shift_id', 'staff_id', 'basic_salary'
        );
        $data['is_active'] = true;
        $data['is_sale_agent'] = false;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $ext = $file->getClientOriginalExtension();
            $name = date('YmdHis') . '.' . $ext;
            $file->move(public_path('images/employee'), $name);
            $data['image'] = $name;
        }
        Employee::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Employee created successfully')]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer|exists:employees,id',
            'name' => 'required|string|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees')->ignore($request->id)->where(fn ($q) => $q->where('is_active', true)),
            ],
            'phone_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'department_id' => 'nullable|integer|exists:departments,id',
            'designation_id' => 'nullable|integer|exists:designations,id',
            'shift_id' => 'nullable|integer|exists:shifts,id',
            'staff_id' => 'nullable|string|max:100',
            'basic_salary' => 'nullable|numeric|min:0',
        ]);
        $employee = Employee::findOrFail($request->id);
        $data = [
            'name' => $request->input('name'),
            'email' => $request->input('email') ?: null,
            'phone_number' => $request->input('phone_number') ?: null,
            'address' => $request->input('address') ?: null,
            'city' => $request->input('city') ?: null,
            'country' => $request->input('country') ?: null,
            'department_id' => $request->filled('department_id') ? $request->integer('department_id') : null,
            'designation_id' => $request->filled('designation_id') ? $request->integer('designation_id') : null,
            'shift_id' => $request->filled('shift_id') ? $request->integer('shift_id') : null,
            'staff_id' => $request->input('staff_id') ?: null,
            'basic_salary' => $request->filled('basic_salary') ? $request->input('basic_salary') : null,
        ];
        if ($request->hasFile('image')) {
            if ($employee->image && File::exists(public_path('images/employee/' . $employee->image))) {
                File::delete(public_path('images/employee/' . $employee->image));
            }
            $file = $request->file('image');
            $ext = $file->getClientOriginalExtension();
            $name = date('YmdHis') . '.' . $ext;
            $file->move(public_path('images/employee'), $name);
            $data['image'] = $name;
        }
        $employee->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Employee updated successfully')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        if ($employee->user_id) {
            User::where('id', $employee->user_id)->update(['is_deleted' => true]);
        }
        if ($employee->image && File::exists(public_path('images/employee/' . $employee->image))) {
            File::delete(public_path('images/employee/' . $employee->image));
        }
        $employee->update(['is_active' => false]);
        return response()->json(['status' => 200, 'message' => __('db.Employee deleted successfully')]);
    }

    public function show(int $id): JsonResponse
    {
        $employee = Employee::with(['department:id,name', 'designation:id,name', 'user:id,name'])
            ->where('is_active', true)
            ->findOrFail($id);
        return response()->json(['status' => 200, 'data' => $employee]);
    }
}
