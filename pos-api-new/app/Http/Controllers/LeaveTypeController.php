<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class LeaveTypeController extends Controller
{
    use SpaResponse;

    protected function userCanAccessLeaveType(): bool
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

        return $role && $role->hasPermissionTo('leave-type');
    }

    protected function denyLeaveTypeAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function requestFlagEnabled(Request $request, string $key): bool
    {
        if (!$request->has($key)) {
            return false;
        }

        return in_array($request->input($key), [1, '1', true, 'true', 'on', 'yes'], true);
    }

    protected function formatLeaveType(LeaveType $leaveType): array
    {
        return [
            'id' => $leaveType->id,
            'name' => $leaveType->name,
            'annual_quota' => (int) $leaveType->annual_quota,
            'encashable' => (bool) $leaveType->encashable,
            'encashable_label' => $leaveType->encashable ? __('db.Yes') : __('db.No'),
            'carry_forward_limit' => (int) $leaveType->carry_forward_limit,
        ];
    }

    protected function leaveTypePayload(Request $request): array
    {
        return [
            'name' => $request->input('name'),
            'annual_quota' => $request->input('annual_quota'),
            'encashable' => $this->requestFlagEnabled($request, 'encashable') ? 1 : 0,
            'carry_forward_limit' => $request->input('carry_forward_limit'),
        ];
    }

    protected function leaveTypeList()
    {
        return LeaveType::orderBy('name')->get()->map(fn (LeaveType $type) => $this->formatLeaveType($type));
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessLeaveType()) {
            return $this->denyLeaveTypeAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'leave_types' => $this->leaveTypeList(),
                'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $leaveTypes = LeaveType::all();

        return view('backend.hrm.leave_type.index', compact('leaveTypes'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessLeaveType()) {
            return $this->denyLeaveTypeAccess($request);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name',
            'annual_quota' => 'required|numeric|min:0',
            'encashable' => 'required',
            'carry_forward_limit' => 'required|numeric|min:0',
        ]);

        $leaveType = LeaveType::create($this->leaveTypePayload($request));
        $message = 'Leave Type added successfully';

        if ($request->ajax() || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'id' => $leaveType->id,
                'name' => $leaveType->name,
                'leave_types' => $this->leaveTypeList(),
            ], 201);
        }

        return redirect()->back()->with('message', $message);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessLeaveType()) {
            return $this->denyLeaveTypeAccess($request);
        }

        $leaveTypeId = $request->input('leave_types', $id);

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('leave_types', 'name')->ignore($leaveTypeId),
            ],
            'annual_quota' => 'required|numeric|min:0',
            'encashable' => 'required',
            'carry_forward_limit' => 'required|numeric|min:0',
        ]);

        $leaveType = LeaveType::findOrFail($leaveTypeId);
        $leaveType->update($this->leaveTypePayload($request));
        $message = 'Leave Type updated successfully';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'leave_types' => $this->leaveTypeList(),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessLeaveType()) {
            return $this->denyLeaveTypeAccess($request);
        }

        foreach ($request->input('leaveTypeIdArray', []) as $leaveTypeId) {
            LeaveType::find($leaveTypeId)?->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Leave Type deleted successfully!',
                'leave_types' => $this->leaveTypeList(),
            ]);
        }

        return 'Leave Type deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessLeaveType()) {
            return $this->denyLeaveTypeAccess($request);
        }

        LeaveType::findOrFail($id)->delete();
        $message = 'Leave Type deleted successfully';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'leave_types' => $this->leaveTypeList(),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }
}
