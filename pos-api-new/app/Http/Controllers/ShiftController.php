<?php

namespace App\Http\Controllers;

use App\Models\HrmSetting;
use App\Models\Shift;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class ShiftController extends Controller
{
    use SpaResponse;

    protected function userCanAccessShift(): bool
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

        return $role && $role->hasPermissionTo('shift');
    }

    protected function denyShiftAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function formatShift(Shift $shift): array
    {
        return [
            'id' => $shift->id,
            'name' => $shift->name,
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'grace_in' => $shift->grace_in ?? 0,
            'grace_out' => $shift->grace_out ?? 0,
            'total_hours' => $shift->total_hours,
            'is_active' => (bool) $shift->is_active,
        ];
    }

    protected function defaultShiftTimes(): array
    {
        $hrm = HrmSetting::latest()->first();

        return [
            'start_time' => $hrm->checkin ?? '09:00',
            'end_time' => $hrm->checkout ?? '18:00',
        ];
    }

    protected function prepareShiftInput(Request $request): array
    {
        return [
            'name' => $request->name,
            'start_time' => Carbon::parse($request->start_time)->format('H:i:s'),
            'end_time' => Carbon::parse($request->end_time)->format('H:i:s'),
            'grace_in' => (int) ($request->grace_in ?? 0),
            'grace_out' => (int) ($request->grace_out ?? 0),
            'is_active' => true,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessShift()) {
            return $this->denyShiftAccess($request);
        }

        $lims_shift_all = Shift::where('is_active', true)->orderBy('name')->get();
        $lims_hrm_setting_data = HrmSetting::latest()->first();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_shift_all->map(fn (Shift $shift) => $this->formatShift($shift)),
                'defaults' => $this->defaultShiftTimes(),
                'hrm_setting' => $lims_hrm_setting_data ? [
                    'checkin' => $lims_hrm_setting_data->checkin,
                    'checkout' => $lims_hrm_setting_data->checkout,
                ] : null,
            ]);
        }

        return view('backend.hrm.shift.index', compact('lims_shift_all', 'lims_hrm_setting_data'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessShift()) {
            return $this->denyShiftAccess($request);
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('shifts')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'start_time' => 'required',
            'end_time' => 'required',
            'grace_in' => 'nullable|integer|min:0',
            'grace_out' => 'nullable|integer|min:0',
        ]);

        $shift = Shift::create($this->prepareShiftInput($request));

        if ($request->ajax() || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Shift created successfully'),
                'data' => $this->formatShift($shift),
            ], 201);
        }

        return redirect('shift')->with('message', __('db.Shift created successfully'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessShift()) {
            return $this->denyShiftAccess($request);
        }

        $shiftId = $request->input('shift_id', $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('shifts')->ignore($shiftId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'start_time' => 'required',
            'end_time' => 'required',
            'grace_in' => 'nullable|integer|min:0',
            'grace_out' => 'nullable|integer|min:0',
        ]);

        $lims_shift_data = Shift::findOrFail($shiftId);
        $lims_shift_data->update($this->prepareShiftInput($request));

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Shift updated successfully'),
                'data' => $this->formatShift($lims_shift_data->fresh()),
            ]);
        }

        return redirect('shift')->with('message', __('db.Shift updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessShift()) {
            return $this->denyShiftAccess($request);
        }

        $shift_id = $request->input('shiftIdArray', []);

        foreach ($shift_id as $id) {
            $lims_shift_data = Shift::find($id);
            if ($lims_shift_data) {
                $lims_shift_data->is_active = false;
                $lims_shift_data->save();
            }
        }

        $message = 'Shift deleted successfully!';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessShift()) {
            return $this->denyShiftAccess($request);
        }

        $lims_shift_data = Shift::findOrFail($id);
        $lims_shift_data->is_active = false;
        $lims_shift_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Shift deleted successfully'),
            ]);
        }

        return redirect('shift')->with('message', __('db.Shift deleted successfully'));
    }
}
