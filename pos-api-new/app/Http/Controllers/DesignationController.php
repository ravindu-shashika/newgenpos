<?php

namespace App\Http\Controllers;

use App\Models\Designation;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class DesignationController extends Controller
{
    use SpaResponse;

    protected function userCanAccessDesignation(): bool
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

        if (!$role) {
            return false;
        }

        // Legacy index checked `department`; menu permission is `designations`.
        return $role->hasPermissionTo('designations')
            || $role->hasPermissionTo('department');
    }

    protected function denyDesignationAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function formatDesignation(Designation $designation): array
    {
        return [
            'id' => $designation->id,
            'name' => $designation->name,
            'is_active' => (bool) $designation->is_active,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessDesignation()) {
            return $this->denyDesignationAccess($request);
        }

        $lims_designation_all = Designation::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_designation_all->map(fn (Designation $designation) => $this->formatDesignation($designation)),
            ]);
        }

        return view('backend.hrm.designation.index', compact('lims_designation_all'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessDesignation()) {
            return $this->denyDesignationAccess($request);
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('designations')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $designation = Designation::create([
            'name' => $request->name,
            'is_active' => true,
        ]);

        if ($request->ajax() || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Designation created successfully'),
                'data' => $this->formatDesignation($designation),
            ], 201);
        }

        return redirect('designations')->with('message', __('db.Designation created successfully'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessDesignation()) {
            return $this->denyDesignationAccess($request);
        }

        $designationId = $request->input('designation_id', $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('designations')->ignore($designationId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);

        $lims_designation_data = Designation::findOrFail($designationId);
        $lims_designation_data->update(['name' => $request->name]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Designation updated successfully'),
                'data' => $this->formatDesignation($lims_designation_data->fresh()),
            ]);
        }

        return redirect('designations')->with('message', __('db.Designation updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessDesignation()) {
            return $this->denyDesignationAccess($request);
        }

        $designation_id = $request->input('designationIdArray', []);

        foreach ($designation_id as $id) {
            $lims_designation_data = Designation::find($id);
            if ($lims_designation_data) {
                $lims_designation_data->is_active = false;
                $lims_designation_data->save();
            }
        }

        $message = 'Designation deleted successfully!';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessDesignation()) {
            return $this->denyDesignationAccess($request);
        }

        $lims_designation_data = Designation::findOrFail($id);
        $lims_designation_data->is_active = false;
        $lims_designation_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Designation deleted successfully'),
            ]);
        }

        return redirect('designations')->with('message', __('db.Designation deleted successfully'));
    }
}
