<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class DepartmentController extends Controller
{
    use SpaResponse;

    protected function userCanAccessDepartment(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('department');
    }

    protected function denyDepartmentAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function formatDepartment(Department $department): array
    {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'is_active' => (bool) $department->is_active,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessDepartment()) {
            return $this->denyDepartmentAccess($request);
        }

        $lims_department_all = Department::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_department_all->map(fn (Department $department) => $this->formatDepartment($department)),
            ]);
        }

        return view('backend.department.index', compact('lims_department_all'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessDepartment()) {
            return $this->denyDepartmentAccess($request);
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('departments')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $department = Department::create([
            'name' => $request->name,
            'is_active' => true,
        ]);

        if ($request->ajax() || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Department created successfully'),
                'data' => $this->formatDepartment($department),
            ], 201);
        }

        return redirect('departments')->with('message', __('db.Department created successfully'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessDepartment()) {
            return $this->denyDepartmentAccess($request);
        }

        $departmentId = $request->input('department_id', $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('departments')->ignore($departmentId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $lims_department_data = Department::findOrFail($departmentId);
        $lims_department_data->update(['name' => $request->name]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Department updated successfully'),
                'data' => $this->formatDepartment($lims_department_data->fresh()),
            ]);
        }

        return redirect('departments')->with('message', __('db.Department updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessDepartment()) {
            return $this->denyDepartmentAccess($request);
        }

        $department_id = $request->input('departmentIdArray', []);

        foreach ($department_id as $id) {
            $lims_department_data = Department::find($id);
            if ($lims_department_data) {
                $lims_department_data->is_active = false;
                $lims_department_data->save();
            }
        }

        $message = 'Department deleted successfully!';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessDepartment()) {
            return $this->denyDepartmentAccess($request);
        }

        $lims_department_data = Department::findOrFail($id);
        $lims_department_data->is_active = false;
        $lims_department_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Department deleted successfully'),
            ]);
        }

        return redirect('departments')->with('message', __('db.Department deleted successfully'));
    }
}
