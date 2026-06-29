<?php

namespace App\Http\Controllers;

use App\Mail\HolidayApprove;
use App\Models\GeneralSetting;
use App\Models\Holiday;
use App\Models\MailSetting;
use App\Support\Permissions;
use App\Traits\MailInfo;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Mail;
use Spatie\Permission\Models\Role;

class HolidayController extends Controller
{
    use MailInfo;
    use SpaResponse;

    protected function userHasHolidayPermission(): bool
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

        return $role && $role->hasPermissionTo('holiday');
    }

    protected function parseHolidayDate(string $value): string
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    protected function requestFlagEnabled(Request $request, string $key): bool
    {
        if (!$request->has($key)) {
            return false;
        }

        return in_array($request->input($key), [1, '1', true, 'true', 'on', 'yes'], true);
    }

    protected function formatHoliday(Holiday $holiday): array
    {
        $holiday->loadMissing('user');
        $generalSetting = GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';

        return [
            'id' => $holiday->id,
            'user_id' => $holiday->user_id,
            'user_name' => $holiday->user->username ?? $holiday->user->name ?? '',
            'created_at' => $holiday->created_at,
            'created_at_display' => $holiday->created_at
                ? date($dateFormat, strtotime($holiday->created_at))
                : null,
            'from_date' => $holiday->from_date,
            'to_date' => $holiday->to_date,
            'from_date_display' => $holiday->from_date
                ? date($dateFormat, strtotime($holiday->from_date))
                : null,
            'to_date_display' => $holiday->to_date
                ? date($dateFormat, strtotime($holiday->to_date))
                : null,
            'note' => $holiday->note,
            'recurring' => (int) $holiday->recurring,
            'recurring_label' => $holiday->recurring ? __('db.Yes') : __('db.No'),
            'region' => $holiday->region,
            'is_approved' => (bool) $holiday->is_approved,
        ];
    }

    protected function holidayListQuery()
    {
        if ($this->userHasHolidayPermission()) {
            return Holiday::with('user')->orderBy('id', 'desc');
        }

        return Holiday::with('user')->where('user_id', Auth::id())->orderBy('id', 'desc');
    }

    public function index(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            $holidays = $this->holidayListQuery()
                ->get()
                ->map(fn (Holiday $holiday) => $this->formatHoliday($holiday));

            return $this->spaJson($request, [
                'holidays' => $holidays,
                'approve_permission' => $this->userHasHolidayPermission(),
            ]);
        }

        $approve_permission = $this->userHasHolidayPermission();
        $lims_holiday_list = $this->holidayListQuery()->get();

        return view('backend.hrm.holiday.index', compact('lims_holiday_list', 'approve_permission'));
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $request->validate([
            'from_date' => 'required',
            'to_date' => 'required',
            'note' => 'nullable|string',
            'region' => 'nullable|string|max:255',
            'recurring' => 'nullable',
        ]);

        $data = [
            'from_date' => $this->parseHolidayDate($request->input('from_date')),
            'to_date' => $this->parseHolidayDate($request->input('to_date')),
            'user_id' => Auth::id(),
            'note' => $request->input('note'),
            'recurring' => $this->requestFlagEnabled($request, 'recurring') ? 1 : 0,
            'region' => $request->input('region'),
            'is_approved' => $this->userHasHolidayPermission(),
        ];

        Holiday::create($data);
        $message = __('db.Holiday created successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'holidays' => $this->holidayListQuery()->get()->map(fn (Holiday $holiday) => $this->formatHoliday($holiday)),
                'approve_permission' => $this->userHasHolidayPermission(),
            ], 201);
        }

        return redirect()->back()->with('message', $message);
    }

    public function show($id)
    {
        //
    }

    public function approveHoliday(Request $request, $id)
    {
        if (!$this->userHasHolidayPermission()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $holiday = Holiday::with('user')->findOrFail($id);
        $holiday->is_approved = true;
        $holiday->save();

        $mailData = [
            'name' => $holiday->user->username ?? $holiday->user->name ?? '',
            'email' => $holiday->user->email,
        ];

        $mailSetting = MailSetting::latest()->first();
        $mailWarning = null;

        if ($mailSetting && $mailData['email']) {
            $this->setMailInfo($mailSetting);
            try {
                Mail::to($mailData['email'])->send(new HolidayApprove($mailData));
            } catch (\Exception $e) {
                $mailWarning = 'Please setup your mail setting to send mail.';
            }
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'status' => true,
                'message' => $mailWarning ?: 'Holiday approved successfully!',
                'holidays' => $this->holidayListQuery()->get()->map(fn (Holiday $h) => $this->formatHoliday($h)),
                'approve_permission' => true,
            ]);
        }

        if ($mailWarning) {
            return $mailWarning;
        }

        return 'Holiday approved successfully!';
    }

    public function myHoliday($year, $month)
    {
        $start = 1;
        $number_of_day = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        while ($start <= $number_of_day) {
            if ($start < 10) {
                $date = $year . '-' . $month . '-0' . $start;
            } else {
                $date = $year . '-' . $month . '-' . $start;
            }
            $holiday_found = Holiday::whereDate('from_date', '<=', $date)
                ->whereDate('to_date', '>=', $date)
                ->where([
                    ['is_approved', true],
                    ['user_id', Auth::id()],
                ])->first();
            if ($holiday_found) {
                $general_setting = GeneralSetting::select('date_format')->latest()->first();
                $holidays[$start] = date($general_setting->date_format, strtotime($holiday_found->from_date)) . ' ' . __('db.To') . ' ' . date($general_setting->date_format, strtotime($holiday_found->to_date));
            } else {
                $holidays[$start] = false;
            }
            $start++;
        }

        $start_day = date('w', strtotime($year . '-' . $month . '-01')) + 1;
        $prev_year = date('Y', strtotime('-1 month', strtotime($year . '-' . $month . '-01')));
        $prev_month = date('m', strtotime('-1 month', strtotime($year . '-' . $month . '-01')));
        $next_year = date('Y', strtotime('+1 month', strtotime($year . '-' . $month . '-01')));
        $next_month = date('m', strtotime('+1 month', strtotime($year . '-' . $month . '-01')));

        return view('backend.hrm.holiday.my_holiday', compact('start_day', 'year', 'month', 'number_of_day', 'prev_year', 'prev_month', 'next_year', 'next_month', 'holidays'));
    }

    public function update(Request $request, $id)
    {
        $holidayId = $request->input('id', $id);
        $holiday = Holiday::findOrFail($holidayId);

        $request->validate([
            'from_date' => 'required',
            'to_date' => 'required',
            'note' => 'nullable|string',
            'region' => 'nullable|string|max:255',
            'recurring' => 'nullable',
        ]);

        $holiday->update([
            'from_date' => $this->parseHolidayDate($request->input('from_date')),
            'to_date' => $this->parseHolidayDate($request->input('to_date')),
            'note' => $request->input('note'),
            'recurring' => $this->requestFlagEnabled($request, 'recurring') ? 1 : 0,
            'region' => $request->input('region'),
        ]);

        $message = __('db.Holiday updated successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'holidays' => $this->holidayListQuery()->get()->map(fn (Holiday $h) => $this->formatHoliday($h)),
                'approve_permission' => $this->userHasHolidayPermission(),
            ]);
        }

        return redirect()->back()->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        $holidayIds = $request->input('holidayIdArray', []);
        foreach ($holidayIds as $holidayId) {
            Holiday::find($holidayId)?->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => 'Holiday deleted successfully!',
                'holidays' => $this->holidayListQuery()->get()->map(fn (Holiday $h) => $this->formatHoliday($h)),
                'approve_permission' => $this->userHasHolidayPermission(),
            ]);
        }

        return 'Holiday deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        Holiday::findOrFail($id)->delete();
        $message = __('db.Holiday deleted successfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => strip_tags($message),
                'holidays' => $this->holidayListQuery()->get()->map(fn (Holiday $h) => $this->formatHoliday($h)),
                'approve_permission' => $this->userHasHolidayPermission(),
            ]);
        }

        return redirect()->back()->with('not_permitted', $message);
    }
}
