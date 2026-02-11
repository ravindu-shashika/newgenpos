<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\HrmSetting;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class AttendanceApiController extends Controller
{
    /**
     * List attendance records and form data (employees, warehouses, hrm settings).
     */
    public function index(Request $request): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('attendance')) {
            return response()->json(['message' => 'Sorry! You are not allowed to access this module'], 403);
        }

        $general_setting = DB::table('general_settings')->latest()->first();
        $staff_access_own = Auth::user()->role_id > 2 && optional($general_setting)->staff_access === 'own';

        if ($staff_access_own) {
            $lims_attendance_data = Attendance::leftJoin('employees', 'employees.id', '=', 'attendances.employee_id')
                ->leftJoin('users', 'users.id', '=', 'attendances.user_id')
                ->orderBy('attendances.date', 'desc')
                ->where('attendances.user_id', Auth::id())
                ->select(['attendances.*', 'employees.name as employee_name', 'users.name as user_name', 'users.warehouse_id as warehouse_id'])
                ->get()
                ->groupBy(['date', 'employee_id']);
        } else {
            $lims_attendance_data = Attendance::leftJoin('employees', 'employees.id', '=', 'attendances.employee_id')
                ->leftJoin('users', 'users.id', '=', 'attendances.user_id')
                ->orderBy('attendances.date', 'desc')
                ->select(['attendances.*', 'employees.name as employee_name', 'users.name as user_name', 'users.warehouse_id as warehouse_id'])
                ->get()
                ->groupBy(['date', 'employee_id']);
        }

        $date_format = optional($general_setting)->date_format ?? 'Y-m-d';
        $lims_attendance_all = [];
        foreach ($lims_attendance_data as $attendance_data) {
            foreach ($attendance_data as $data) {
                $checkin_checkout = '';
                foreach ($data as $key => $dt) {
                    $date = $dt->date;
                    $employee_name = $dt->employee_name;
                    $checkin_checkout .= (($dt->checkin != null) ? $dt->checkin : 'N/A') . ' - ' . (($dt->checkout != null) ? $dt->checkout : 'N/A') . '<br>';
                    $status = $dt->status;
                    $user_name = $dt->user_name;
                    $employee_id = $dt->employee_id;
                }
                $lims_attendance_all[] = [
                    'date' => is_object($date) ? $date->format('Y-m-d') : $date,
                    'employee_id' => $employee_id,
                    'employee_name' => $employee_name,
                    'checkin_checkout' => $checkin_checkout,
                    'status' => $status,
                    'user_name' => $user_name,
                    'warehouse_id' => $dt->warehouse_id ?? null,
                ];
            }
        }

        return response()->json([
            'status' => 200,
            'data' => $lims_attendance_all,
            'date_format' => $date_format,
        ]);
    }

    /**
     * Form data for create modal and filters: employees, warehouses, hrm settings.
     */
    public function formData(): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('attendance')) {
            return response()->json(['message' => 'Sorry! You are not allowed to access this module'], 403);
        }

        $employees = Employee::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $hrm_setting = HrmSetting::latest()->first();
        $general_setting = DB::table('general_settings')->latest()->first();
        $date_format = optional($general_setting)->date_format ?? 'Y-m-d';

        return response()->json([
            'status' => 200,
            'employees' => $employees,
            'warehouses' => $warehouses,
            'hrm_setting' => $hrm_setting ? [
                'checkin' => $hrm_setting->checkin,
                'checkout' => $hrm_setting->checkout,
            ] : null,
            'date_format' => $date_format,
        ]);
    }

    /**
     * Store attendance for one or more employees.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|array',
            'employee_id.*' => 'required|integer|exists:employees,id',
            'date' => 'required|string',
            'checkin' => 'required|string',
            'checkout' => 'required|string',
            'note' => 'nullable|string',
        ]);

        $data = $request->all();
        $employee_ids = $data['employee_id'];
        $lims_hrm_setting_data = HrmSetting::latest()->first();
        $checkin = $request->checkin ?: optional($lims_hrm_setting_data)->checkin;

        foreach ($employee_ids as $id) {
            $data['date'] = date('Y-m-d', strtotime(str_replace('/', '-', $data['date'])));
            $data['user_id'] = Auth::id();
            $data['employee_id'] = $id;

            $existingAttendance = Attendance::where('date', $data['date'])
                ->where('employee_id', $id)
                ->where('checkin', $data['checkin'])
                ->first();

            if ($existingAttendance) {
                return response()->json([
                    'status' => 500,
                    'error' => "Duplicate entry: Check-in time '{$data['checkin']}' for Employee ID $id on {$data['date']} is not permissible.",
                ], 200);
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

        return response()->json([
            'status' => 200,
            'message' => __('db.Attendance created successfully'),
        ]);
    }

    /**
     * Delete a single attendance record by date and employee_id.
     */
    public function destroy(string $date, int $employee_id): JsonResponse
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role || !$role->hasPermissionTo('attendance')) {
            return response()->json(['message' => 'Sorry! You are not allowed to access this module'], 403);
        }

        Attendance::whereDate('date', $date)->where('employee_id', $employee_id)->delete();

        return response()->json([
            'status' => 200,
            'message' => __('db.Attendance deleted successfully'),
        ]);
    }

    /**
     * Delete multiple attendance records by selection.
     */
    public function deleteBySelection(Request $request): JsonResponse
    {
        $request->validate([
            'attendanceSelectedArray' => 'required|array',
            'attendanceSelectedArray.*' => 'array',
            'attendanceSelectedArray.*.0' => 'required|string',
            'attendanceSelectedArray.*.1' => 'required|integer',
        ]);

        $attendance_selected = $request->input('attendanceSelectedArray', []);
        foreach ($attendance_selected as $att_selected) {
            $date = $att_selected[0] ?? null;
            $employee_id = $att_selected[1] ?? null;
            if ($date && $employee_id) {
                Attendance::whereDate('date', $date)->where('employee_id', $employee_id)->delete();
            }
        }

        return response()->json([
            'status' => 200,
            'message' => 'Attendance deleted successfully!',
        ]);
    }

    /**
     * Import attendance from CSV (device format).
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'Attendance_Device_date_format' => 'required|string|in:d/m/Y,m/d/Y,Y/m/d',
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $upload = $request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if (strtolower($ext) !== 'csv') {
            return response()->json([
                'status' => 500,
                'message' => __('db.Please upload a CSV file'),
            ], 200);
        }

        $filePath = $upload->getRealPath();
        $file = fopen($filePath, 'r');
        fgetcsv($file); // exclude header

        $employee_all = Employee::all();
        $lims_hrm_setting_data = HrmSetting::latest()->first();
        $checkin = optional($lims_hrm_setting_data)->checkin;
        $data = [];

        while (($columns = fgetcsv($file)) !== false) {
            if (empty($columns[0]) || empty($columns[1])) {
                continue;
            }

            $staff_id = $columns[0];
            $employee = $employee_all->where('staff_id', $staff_id)->first();
            if (!$employee) {
                fclose($file);
                return response()->json([
                    'status' => 500,
                    'message' => 'Staff id - ' . $staff_id . ' is not available within the POS system',
                ], 200);
            }

            $dt_time = explode(' ', $columns[1], 2);
            $attendance_date = Carbon::createFromFormat($request->Attendance_Device_date_format, $dt_time[0])->format('Y-m-d');
            $attendance_time = str_replace(' ', '', $dt_time[1] ?? '');
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
            }
            if ($i == 0) {
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

        return response()->json([
            'status' => 200,
            'message' => __('db.Attendance created successfully'),
        ]);
    }
}
