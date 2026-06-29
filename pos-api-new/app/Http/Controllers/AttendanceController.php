<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\GeneralSetting;
use App\Models\HrmSetting;
use App\Models\Warehouse;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class AttendanceController extends Controller
{
    use SpaResponse;

    protected function userCanAccessAttendance(): bool
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

        return $role && $role->hasPermissionTo('attendance');
    }

    protected function denyAttendanceAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function attendanceQuery()
    {
        $generalSetting = DB::table('general_settings')->latest()->first();
        $query = Attendance::leftJoin('employees', 'employees.id', '=', 'attendances.employee_id')
            ->leftJoin('users', 'users.id', '=', 'attendances.user_id')
            ->orderBy('attendances.date', 'desc')
            ->select([
                'attendances.*',
                'employees.name as employee_name',
                'users.username as user_name',
                'users.warehouse_id as warehouse_id',
            ]);

        if (Auth::user()->role_id > 2 && $generalSetting && $generalSetting->staff_access === 'own') {
            $query->where('attendances.user_id', Auth::id());
        }

        return $query;
    }

    protected function groupedAttendanceRows(): array
    {
        $generalSetting = GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';

        $grouped = $this->attendanceQuery()
            ->get()
            ->groupBy(['date', 'employee_id']);

        $rows = [];
        foreach ($grouped as $attendanceData) {
            foreach ($attendanceData as $data) {
                $checkinCheckouts = [];
                $date = null;
                $employeeName = null;
                $status = 0;
                $userName = null;
                $employeeId = null;
                $warehouseId = null;

                foreach ($data as $dt) {
                    $date = $dt->date;
                    $employeeName = $dt->employee_name;
                    $status = (int) $dt->status;
                    $userName = $dt->user_name;
                    $employeeId = $dt->employee_id;
                    $warehouseId = $dt->warehouse_id;
                    $checkinCheckouts[] = [
                        'checkin' => $dt->checkin,
                        'checkout' => $dt->checkout,
                        'display' => (($dt->checkin !== null) ? $dt->checkin : 'N/A') . ' - ' . (($dt->checkout !== null) ? $dt->checkout : 'N/A'),
                    ];
                }

                $checkinCheckoutHtml = implode('<br>', array_column($checkinCheckouts, 'display'));

                $rows[] = [
                    'date' => $date,
                    'date_display' => $date ? date($dateFormat, strtotime($date)) : null,
                    'employee_id' => $employeeId,
                    'employee_name' => $employeeName,
                    'checkin_checkouts' => $checkinCheckouts,
                    'checkin_checkout' => $checkinCheckoutHtml,
                    'checkin_checkout_display' => implode("\n", array_column($checkinCheckouts, 'display')),
                    'status' => $status,
                    'status_label' => $status === 1 ? __('db.Present') : __('db.Late'),
                    'user_name' => $userName,
                    'warehouse_id' => $warehouseId,
                ];
            }
        }

        return $rows;
    }

    protected function parseAttendanceDate(string $value): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessAttendance()) {
            return $this->denyAttendanceAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $hrmSetting = HrmSetting::latest()->first();
            $generalSetting = GeneralSetting::latest()->first();

            return $this->spaJson($request, [
                'attendances' => $this->groupedAttendanceRows(),
                'employees' => Employee::where('is_active', true)->orderBy('name')->get(['id', 'name']),
                'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
                'defaults' => [
                    'checkin' => $hrmSetting->checkin ?? '',
                    'checkout' => $hrmSetting->checkout ?? '',
                ],
                'date_format' => $generalSetting->date_format ?? 'd-m-Y',
                'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('attendance')) {
            $lims_employee_list = Employee::where('is_active', true)->get();
            $lims_hrm_setting_data = HrmSetting::latest()->first();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $general_setting = DB::table('general_settings')->latest()->first();
            $lims_attendance_all = $this->groupedAttendanceRows();

            return view('backend.attendance.index', compact('lims_employee_list', 'lims_hrm_setting_data', 'lims_attendance_all', 'lims_warehouse_list'));
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessAttendance()) {
            return $this->denyAttendanceAccess($request);
        }

        $request->validate([
            'employee_id' => 'required|array|min:1',
            'employee_id.*' => 'required|integer|exists:employees,id',
            'date' => 'required',
            'checkin' => 'required',
            'checkout' => 'required',
            'note' => 'nullable|string',
        ]);

        $employeeIds = $request->input('employee_id');
        $lims_hrm_setting_data = HrmSetting::latest()->first();

        if ($request->checkin) {
            $checkin = $request->checkin;
        } elseif ($lims_hrm_setting_data && $lims_hrm_setting_data->checkin) {
            $checkin = $lims_hrm_setting_data->checkin;
        } else {
            $checkin = null;
        }

        $date = $this->parseAttendanceDate($request->date);

        foreach ($employeeIds as $id) {
            $data = [
                'date' => $date,
                'user_id' => Auth::id(),
                'employee_id' => $id,
                'checkin' => $request->checkin,
                'checkout' => $request->checkout,
                'note' => $request->note,
            ];

            $existingAttendance = Attendance::where('date', $data['date'])
                ->where('employee_id', $id)
                ->where('checkin', $data['checkin'])
                ->first();

            if ($existingAttendance) {
                $message = "Duplicate entry: Check-in time '{$data['checkin']}' for Employee ID $id on {$data['date']} is not permissible.";

                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, ['message' => $message], 422);
                }

                return redirect()->back()->with('error', $message);
            }

            $lims_attendance_data = Attendance::whereDate('date', $data['date'])
                ->where('employee_id', $id)
                ->first();

            if (!$lims_attendance_data) {
                $diff = strtotime($checkin) - strtotime($data['checkin']);
                $data['status'] = ($diff >= 0) ? 1 : 0;
            } else {
                $data['status'] = $lims_attendance_data->status;
            }

            Attendance::create($data);
        }

        $message = __('db.Attendance created successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'attendances' => $this->groupedAttendanceRows(),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function importDeviceCsv(Request $request)
    {
        if (!$this->userCanAccessAttendance()) {
            return $this->denyAttendanceAccess($request);
        }

        $upload = $request->file('file');
        if ($request->Attendance_Device_date_format == null || $upload == null) {
            $message = __('db.Please select Attendance Device Date Format and upload a CSV file');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if ($ext != 'csv') {
            $message = __('db.Please upload a CSV file');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => $message], 422);
            }

            return redirect()->back()->with('not_permitted', $message);
        }

        $filePath = $upload->getRealPath();
        $file = fopen($filePath, 'r');
        fgetcsv($file);

        $employee_all = Employee::all();
        $lims_hrm_setting_data = HrmSetting::latest()->first();
        $checkin = $lims_hrm_setting_data->checkin ?? null;
        $data = [];

        while ($columns = fgetcsv($file)) {
            if ($columns[0] == '' || $columns[1] == '') {
                continue;
            }

            $staff_id = $columns[0];
            $employee = $employee_all->where('staff_id', $staff_id)->first();
            if (!$employee) {
                $message = 'Staff id - ' . $staff_id . ' is not available within the POS system';

                if ($this->wantsSpaResponse($request)) {
                    return $this->spaJson($request, ['message' => $message], 422);
                }

                return redirect()->back()->with('not_permitted', $message);
            }

            $dt_time = explode(' ', $columns[1], 2);
            $attendance_date = Carbon::createFromFormat($request->Attendance_Device_date_format, $dt_time[0])->format('Y-m-d');
            $attendance_time = str_replace(' ', '', $dt_time[1]);
            $i = 0;
            $status = 0;

            foreach ($data as $key => $dt) {
                if ($dt['date'] == $attendance_date && $dt['employee_id'] == $employee->id) {
                    $status = $dt['status'];
                    $i++;
                    if ($dt['checkout'] == null) {
                        $data[$key]['checkout'] = $attendance_time;
                        $i = -1;
                        break;
                    }
                }
            }

            if ($i == -1) {
                continue;
            } elseif ($i == 0) {
                $diff = strtotime($checkin) - strtotime($attendance_time);
                $status = ($diff >= 0) ? 1 : 0;

                $data[] = [
                    'date' => $attendance_date,
                    'employee_id' => $employee->id,
                    'user_id' => Auth::id(),
                    'checkin' => $attendance_time,
                    'checkout' => null,
                    'status' => $status,
                ];
            } else {
                $data[] = [
                    'date' => $attendance_date,
                    'employee_id' => $employee->id,
                    'user_id' => Auth::id(),
                    'checkin' => $attendance_time,
                    'checkout' => null,
                    'status' => $status,
                ];
            }
        }

        fclose($file);

        if (!empty($data)) {
            Attendance::upsert($data, ['date', 'employee_id', 'checkin'], ['checkout']);
        }

        $message = __('db.Attendance created successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'attendances' => $this->groupedAttendanceRows(),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessAttendance()) {
            return $this->denyAttendanceAccess($request);
        }

        $attendanceSelected = $request->input('attendanceSelectedArray', []);
        foreach ($attendanceSelected as $attSelected) {
            Attendance::wheredate('date', $attSelected[0])->where('employee_id', $attSelected[1])->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Attendance deleted successfully!',
                'attendances' => $this->groupedAttendanceRows(),
            ]);
        }

        return 'Attendance deleted successfully!';
    }

    public function delete(Request $request, $date, $employee_id)
    {
        if (!$this->userCanAccessAttendance()) {
            return $this->denyAttendanceAccess($request);
        }

        Attendance::wheredate('date', $date)->where('employee_id', $employee_id)->delete();

        $message = __('db.Attendance deleted successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'attendances' => $this->groupedAttendanceRows(),
            ]);
        }

        return redirect()->back()->with('not_permitted', $message);
    }
}
