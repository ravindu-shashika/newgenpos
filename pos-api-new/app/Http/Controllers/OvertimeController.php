<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\GeneralSetting;
use App\Models\Overtime;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class OvertimeController extends Controller
{
    use SpaResponse;

    protected function userCanAccessOvertime(): bool
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

        return $role && $role->hasPermissionTo('overtime');
    }

    protected function denyOvertimeAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function parseOvertimeDate(string $value): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    protected function formatOvertime(Overtime $overtime): array
    {
        $overtime->loadMissing('employee');
        $generalSetting = GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';

        return [
            'id' => $overtime->id,
            'employee_id' => $overtime->employee_id,
            'employee_name' => $overtime->employee->name ?? '',
            'date' => $overtime->date,
            'date_display' => $overtime->date
                ? date($dateFormat, strtotime($overtime->date))
                : null,
            'hours' => (float) $overtime->hours,
            'rate' => (float) $overtime->rate,
            'amount' => (float) $overtime->amount,
            'status' => $overtime->status,
            'status_label' => ucfirst($overtime->status ?? 'pending'),
        ];
    }

    protected function overtimePayload(Request $request, bool $includeStatus = false): array
    {
        $payload = [
            'employee_id' => $request->input('employee_id'),
            'date' => $this->parseOvertimeDate($request->input('date')),
            'hours' => $request->input('hours'),
            'rate' => $request->input('rate'),
        ];

        if ($includeStatus) {
            $payload['status'] = $request->input('status');
        }

        return $payload;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessOvertime()) {
            return $this->denyOvertimeAccess($request);
        }

        $overtimes = Overtime::with('employee')->orderBy('id', 'desc')->get();
        $employees = Employee::orderBy('name')->get(['id', 'name']);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'overtimes' => $overtimes->map(fn (Overtime $overtime) => $this->formatOvertime($overtime)),
                'employees' => $employees,
                'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        return view('backend.hrm.overtime.index', compact('overtimes', 'employees'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessOvertime()) {
            return $this->denyOvertimeAccess($request);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required',
            'hours' => 'required|numeric|min:0',
            'rate' => 'required|numeric|min:0',
        ]);

        $overtime = Overtime::create($this->overtimePayload($request));
        $message = 'Overtime added successfully';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'overtimes' => Overtime::with('employee')->orderBy('id', 'desc')->get()
                    ->map(fn (Overtime $row) => $this->formatOvertime($row)),
            ], 201);
        }

        return redirect()->back()->with('message', $message);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessOvertime()) {
            return $this->denyOvertimeAccess($request);
        }

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required',
            'hours' => 'required|numeric|min:0',
            'rate' => 'required|numeric|min:0',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        $overtime = Overtime::findOrFail($id);
        $overtime->update($this->overtimePayload($request, true));
        $message = 'Overtime updated successfully';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'overtimes' => Overtime::with('employee')->orderBy('id', 'desc')->get()
                    ->map(fn (Overtime $row) => $this->formatOvertime($row)),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessOvertime()) {
            return $this->denyOvertimeAccess($request);
        }

        foreach ($request->input('overtimeIdArray', []) as $overtimeId) {
            Overtime::find($overtimeId)?->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Overtime deleted successfully!',
                'overtimes' => Overtime::with('employee')->orderBy('id', 'desc')->get()
                    ->map(fn (Overtime $row) => $this->formatOvertime($row)),
            ]);
        }

        return 'Overtime deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessOvertime()) {
            return $this->denyOvertimeAccess($request);
        }

        Overtime::findOrFail($id)->delete();
        $message = 'Overtime deleted successfully';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'overtimes' => Overtime::with('employee')->orderBy('id', 'desc')->get()
                    ->map(fn (Overtime $row) => $this->formatOvertime($row)),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }
}
