<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\GeneralSetting;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class LeaveController extends Controller
{
    use SpaResponse;

    protected function userCanAccessLeave(): bool
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

        return $role && $role->hasPermissionTo('leave');
    }

    protected function denyLeaveAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function parseLeaveDate(string $value): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    protected function calculateDays(string $startDate, string $endDate): int
    {
        return (int) ((strtotime($endDate) - strtotime($startDate)) / 86400) + 1;
    }

    protected function formatLeave(Leave $leave): array
    {
        $leave->loadMissing(['employee', 'leaveType']);
        $generalSetting = GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';

        return [
            'id' => $leave->id,
            'employee_id' => $leave->employee_id,
            'employee_name' => $leave->employee->name ?? 'N/A',
            'leave_types' => $leave->leave_types,
            'leave_type_name' => $leave->leaveType->name ?? 'N/A',
            'start_date' => $leave->start_date,
            'end_date' => $leave->end_date,
            'start_date_display' => $leave->start_date
                ? date($dateFormat, strtotime($leave->start_date))
                : null,
            'end_date_display' => $leave->end_date
                ? date($dateFormat, strtotime($leave->end_date))
                : null,
            'days' => (int) $leave->days,
            'status' => $leave->status,
            'approver_id' => $leave->approver_id,
        ];
    }

    protected function leaveListPayload(): array
    {
        return [
            'leaves' => Leave::with(['employee', 'leaveType'])
                ->latest()
                ->get()
                ->map(fn (Leave $leave) => $this->formatLeave($leave)),
            'leave_types' => LeaveType::orderBy('name')->get(['id', 'name']),
            'employees' => Employee::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessLeave()) {
            return $this->denyLeaveAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $this->leaveListPayload());
        }

        $leaves = Leave::with(['employee', 'leaveType'])->latest()->get();
        $leaveTypes = LeaveType::all();
        $employees = Employee::query()->where('is_active', 1)->get();

        return view('backend.hrm.leave.index', compact('leaves', 'leaveTypes', 'employees'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessLeave()) {
            return $this->denyLeaveAccess($request);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_types' => 'required|exists:leave_types,id',
            'start_date' => 'required',
            'end_date' => 'required',
        ]);

        $startDate = $this->parseLeaveDate($request->input('start_date'));
        $endDate = $this->parseLeaveDate($request->input('end_date'));

        if (strtotime($endDate) < strtotime($startDate)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => 'End date must be on or after start date.',
                ], 422);
            }

            return redirect()->back()->with('not_permitted', 'End date must be on or after start date.');
        }

        Leave::create([
            'employee_id' => $request->employee_id,
            'leave_types' => $request->leave_types,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days' => $this->calculateDays($startDate, $endDate),
            'status' => 'Pending',
            'approver_id' => Auth::id(),
        ]);

        $message = __('db.Leave request added successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => strip_tags($message)],
                $this->leaveListPayload()
            ), 201);
        }

        return redirect()->back()->with('message', $message);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessLeave()) {
            return $this->denyLeaveAccess($request);
        }

        $leave = Leave::findOrFail($id);

        if ($request->has('status') && !$request->has('employee_id')) {
            $request->validate([
                'status' => 'required|in:Pending,Approved,Rejected',
            ]);

            $leave->update([
                'status' => $request->status,
                'approver_id' => Auth::id(),
            ]);
        } else {
            $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'leave_types' => 'required|exists:leave_types,id',
                'start_date' => 'required',
                'end_date' => 'required',
            ]);

            $startDate = $this->parseLeaveDate($request->input('start_date'));
            $endDate = $this->parseLeaveDate($request->input('end_date'));

            if (strtotime($endDate) < strtotime($startDate)) {
                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, [
                        'message' => 'End date must be on or after start date.',
                    ], 422);
                }

                return redirect()->back()->with('not_permitted', 'End date must be on or after start date.');
            }

            $leave->update([
                'employee_id' => $request->employee_id,
                'leave_types' => $request->leave_types,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'days' => $this->calculateDays($startDate, $endDate),
            ]);
        }

        $message = __('db.Leave updated successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => strip_tags($message)],
                $this->leaveListPayload()
            ));
        }

        return redirect()->back()->with('message', $message);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessLeave()) {
            return $this->denyLeaveAccess($request);
        }

        Leave::findOrFail($id)->delete();
        $message = __('db.Leave deleted successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => strip_tags($message)],
                $this->leaveListPayload()
            ));
        }

        return redirect()->back()->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessLeave()) {
            return $this->denyLeaveAccess($request);
        }

        $ids = $request->input('leaveIdArray', []);
        Leave::whereIn('id', $ids)->delete();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => __('db.Selected leaves deleted successfully')],
                $this->leaveListPayload()
            ));
        }

        return response()->json(['message' => __('db.Selected leaves deleted successfully')]);
    }
}
