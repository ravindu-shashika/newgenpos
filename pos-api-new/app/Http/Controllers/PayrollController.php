<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\GeneralSetting;
use App\Models\Leave;
use App\Models\MailSetting;
use App\Models\Overtime;
use App\Models\Payment;
use App\Models\Payroll;
use App\Models\Sale;
use App\Models\Warehouse;
use App\Mail\PayrollDetails;
use App\Support\Permissions;
use App\Traits\MailInfo;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Mail;
use Spatie\Permission\Models\Role;

class PayrollController extends Controller
{
    use MailInfo;
    use SpaResponse;

    protected function userCanAccessPayroll(): bool
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

        return $role && $role->hasPermissionTo('payroll');
    }

    protected function denyPayrollAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function parsePayrollDate(?string $value): string
    {
        if (!$value) {
            return date('Y-m-d');
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return $value;
        }

        return date('Y-m-d', strtotime(str_replace('/', '-', $value)));
    }

    protected function payingMethodLabel($method): string
    {
        return match ((string) $method) {
            '1' => __('db.Cheque'),
            '2' => __('db.Credit Card'),
            default => __('db.Cash'),
        };
    }

    protected function payrollStats(int $employeeId): array
    {
        $leaves = Leave::where('employee_id', $employeeId)
            ->where('status', 'Approved')
            ->sum('days');

        $attendance = Attendance::where('employee_id', $employeeId)->count();

        $workDurationSeconds = Attendance::where('employee_id', $employeeId)
            ->whereNotNull('checkin')
            ->whereNotNull('checkout')
            ->sum(DB::raw('TIME_TO_SEC(TIMEDIFF(checkout, checkin))'));

        return [
            'leaves' => (int) $leaves,
            'attendance' => (int) $attendance,
            'work_duration' => round($workDurationSeconds / 3600, 2),
        ];
    }

    protected function formatPayroll(Payroll $payroll): array
    {
        $payroll->loadMissing('employee');
        $generalSetting = GeneralSetting::latest()->first();
        $dateFormat = $generalSetting->date_format ?? 'd-m-Y';
        $decimal = $generalSetting->decimal ?? 2;
        $account = Account::find($payroll->account_id);
        $amountArray = is_string($payroll->amount_array)
            ? json_decode($payroll->amount_array, true)
            : ($payroll->amount_array ?? []);
        $stats = $this->payrollStats($payroll->employee_id);

        $monthDisplay = $payroll->month;
        if ($payroll->month) {
            try {
                $monthDisplay = Carbon::createFromFormat('Y-m', $payroll->month)->format('F Y');
            } catch (\Exception $e) {
                $monthDisplay = $payroll->month;
            }
        }

        return array_merge($stats, [
            'id' => $payroll->id,
            'employee_id' => $payroll->employee_id,
            'employee_name' => $payroll->employee->name ?? 'N/A',
            'account_id' => $payroll->account_id,
            'account_name' => $account->name ?? '',
            'reference_no' => $payroll->reference_no,
            'amount' => (float) $payroll->amount,
            'amount_display' => number_format((float) $payroll->amount, $decimal, '.', ''),
            'paying_method' => (string) $payroll->paying_method,
            'paying_method_label' => $this->payingMethodLabel($payroll->paying_method),
            'month' => $payroll->month,
            'month_display' => $monthDisplay,
            'note' => $payroll->note,
            'status' => $payroll->status,
            'created_at' => $payroll->created_at,
            'date' => $payroll->created_at ? $payroll->created_at->format('Y-m-d') : null,
            'date_display' => $payroll->created_at
                ? date($dateFormat, strtotime($payroll->created_at->toDateString()))
                : null,
            'salary' => (float) ($amountArray['salary'] ?? 0),
            'commission' => (float) ($amountArray['commission'] ?? 0),
            'expense' => (float) ($amountArray['expense'] ?? ($amountArray['previous'] ?? 0)),
            'overtime' => (float) ($amountArray['overtime'] ?? 0),
            'total' => (float) ($amountArray['total'] ?? $payroll->amount),
        ]);
    }

    protected function payrollIndexPayload(): array
    {
        $generalSetting = DB::table('general_settings')->latest()->first();

        $payrolls = Payroll::with('employee')
            ->orderBy('id', 'desc')
            ->when(Auth::user()->role_id > 2 && $generalSetting && $generalSetting->staff_access == 'own', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->get()
            ->map(fn (Payroll $payroll) => $this->formatPayroll($payroll));

        return [
            'payrolls' => $payrolls,
            'employees' => Employee::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'accounts' => Account::where('is_active', true)->orderBy('name')->get(['id', 'name', 'account_no', 'is_default']),
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    protected function sendPayrollMail(array $mailData): ?string
    {
        $mailSetting = MailSetting::latest()->first();
        if (!$mailSetting || empty($mailData['email'])) {
            return null;
        }

        $this->setMailInfo($mailSetting);
        try {
            Mail::to($mailData['email'])->send(new PayrollDetails($mailData));
        } catch (\Exception $e) {
            return 'Payroll saved. Please setup your mail setting to send mail.';
        }

        return null;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $this->payrollIndexPayload());
        }

        $lims_account_list = Account::where('is_active', true)->get();
        $lims_employee_list = Employee::where('is_active', true)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_payroll_all = Payroll::with('employee')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($payroll) {
                $stats = $this->payrollStats($payroll->employee_id);
                $payroll->leaves = $stats['leaves'];
                $payroll->attendance = $stats['attendance'];
                $payroll->work_duration = $stats['work_duration'];

                return $payroll;
            });

        return view('backend.hrm.payroll.index', compact(
            'lims_warehouse_list',
            'lims_account_list',
            'lims_employee_list',
            'lims_payroll_all'
        ));
    }


    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        $salary = (float) ($request->salary_amount ?? 0);
        $expense = (float) ($request->previous_transactions ?? $request->expense ?? 0);
        $commission = (float) ($request->commission ?? 0);
        $amount = (float) ($request->amount ?? ($salary + $commission - $expense));
        $createdAt = $this->parsePayrollDate($request->created_at);
        $referenceNo = 'payroll-' . date('Ymd') . '-' . date('his');
        $amountArray = [
            'salary' => $salary,
            'commission' => $commission,
            'expense' => $expense,
            'previous' => $expense,
            'total' => $amount,
        ];

        Payroll::create([
            'reference_no' => $referenceNo,
            'employee_id' => $request->employee_id,
            'account_id' => $request->account_id,
            'user_id' => Auth::id(),
            'amount' => $amount,
            'paying_method' => $request->paying_method ?? '0',
            'note' => $request->note,
            'month' => $request->month,
            'status' => 'draft',
            'amount_array' => json_encode($amountArray),
            'created_at' => $createdAt,
        ]);

        $message = 'Payroll created successfully';
        $employee = Employee::find($request->employee_id);
        if ($employee) {
            $mailWarning = $this->sendPayrollMail([
                'reference_no' => $referenceNo,
                'amount' => $amount,
                'name' => $employee->name,
                'email' => $employee->email,
                'currency' => config('currency'),
            ]);
            if ($mailWarning) {
                $message = $mailWarning;
            }
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => strip_tags($message)],
                $this->payrollIndexPayload()
            ), 201);
        }

        return redirect('payroll')->with('message', $message);
    }

    public function edit($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        try {
            $payroll = Payroll::findOrFail($request->payroll_id ?? $id);
            $createdAt = $this->parsePayrollDate($request->created_at ?? $payroll->created_at?->format('Y-m-d'));

            $salary = (float) ($request->salary_amount ?? 0);
            $previous = (float) ($request->expense ?? $request->previous_transactions ?? 0);
            $commission = (float) ($request->commission ?? 0);
            $total = (float) ($request->amount ?? ($salary + $commission - $previous));

            $amountArray = [
                'salary' => $salary,
                'commission' => $commission,
                'expense' => $previous,
                'previous' => $previous,
                'total' => $total,
            ];

            $payroll->update([
                'employee_id' => $request->employee_id ?? $payroll->employee_id,
                'account_id' => $request->account_id ?? $payroll->account_id,
                'amount' => $total,
                'paying_method' => $request->paying_method ?? $payroll->paying_method,
                'note' => $request->note ?? $payroll->note,
                'month' => $request->month ?? $payroll->month,
                'created_at' => $createdAt,
                'amount_array' => json_encode($amountArray),
            ]);

            $message = __('db.Payroll updated successfully');

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, array_merge(
                    ['message' => strip_tags($message)],
                    $this->payrollIndexPayload()
                ));
            }

            return redirect()->route('payroll.index')->with('message', $message);
        } catch (\Exception $e) {
            \Log::error('Payroll update error: ' . $e->getMessage());

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Something went wrong while updating payroll'),
                ], 500);
            }

            return redirect()->back()->with('error', __('db.Something went wrong while updating payroll'));
        }
    }


    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        foreach ($request->input('payrollIdArray', []) as $payrollId) {
            Payroll::find($payrollId)?->delete();
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => 'Payroll deleted successfully!'],
                $this->payrollIndexPayload()
            ));
        }

        return 'Payroll deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        Payroll::findOrFail($id)->delete();
        $message = __('db.Payroll deleted succesfully');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['message' => strip_tags($message)],
                $this->payrollIndexPayload()
            ));
        }

        return redirect('payroll')->with('not_permitted', $message);
    }

    public function monthlyData(Request $request)
    {
        $employeeId = $request->employee_id;
        $month = $request->month;


        $dummyData = [
            1 => ['salary' => 25000, 'transactions' => 1200, 'commission' => 800],
            2 => ['salary' => 30000, 'transactions' => 2500, 'commission' => 1500],
            3 => ['salary' => 18000, 'transactions' => 1000, 'commission' => 500],
            4 => ['salary' => 22000, 'transactions' => 0, 'commission' => 2000],
            5 => ['salary' => 27000, 'transactions' => 500, 'commission' => 1200],
        ];


        $data = $dummyData[$employeeId] ?? ['salary' => 20000, 'transactions' => 2500, 'commission' => 1500];


        if ($month == '2025-01') {
            $data['commission'] += 500;
        } elseif ($month == '2025-02') {
            $data['transactions'] += 300;
        }

        return response()->json($data);
    }

    public function getEmployeesByWarehouse(Request $request)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        $warehouseId = $request->warehouse_id ?? 0;
        $query = Employee::where('is_active', true);

        if ($warehouseId != 0) {
            $query->where(function ($q) use ($warehouseId) {
                $q->whereHas('user', function ($userQuery) use ($warehouseId) {
                    $userQuery->where('warehouse_id', $warehouseId);
                })->orWhere('warehouse_id', $warehouseId);
            });
        }

        return response()->json($query->orderBy('name')->get(['id', 'name']));
    }



    public function storeMultiple(Request $request)
    {
        if (!$this->userCanAccessPayroll()) {
            return $this->denyPayrollAccess($request);
        }

        $payrolls = $request->input('payrolls', []);
        if (empty($payrolls)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => 'No payroll data found!'], 422);
            }

            return redirect()->route('payroll.index')->with('error', 'No payroll data found!');
        }

        try {
            foreach ($payrolls as $empId => $payrollData) {

                if (!isset($payrollData['employee_id']) || !isset($payrollData['amount'])) {
                    continue;
                }

                // Reference No
                $reference_no = 'payroll-' . date("Ymd") . '-' . date("His") . '-' . $empId;

                // Calculate totals
                $salary = floatval($payrollData['salary_amount'] ?? $payrollData['amount'] ?? 0);
                $expense = floatval($payrollData['expense'] ?? 0);
                $overtime = floatval($payrollData['overtime'] ?? 0);
                $commission = floatval($payrollData['commission'] ?? 0);
                $total = floatval($payrollData['amount'] ?? ($salary + $commission + $overtime - $expense));

                $amountArray = [
                    'salary' => $salary,
                    'commission' => $commission,
                    'expense' => $expense,
                    'overtime' => $overtime,
                    'total' => $total,
                ];


                // ✅ Check if payroll for this employee & month already exists
                $existingPayroll = Payroll::where('employee_id', $payrollData['employee_id'])
                    ->where('month', $request->month)
                    ->first();

                if ($existingPayroll) {
                    // Update existing payroll
                    $existingPayroll->update([
                        'reference_no' => $reference_no,
                        'user_id' => Auth::id(),
                        'account_id' => $request->account_id ?? 0,
                        'amount' => $total,
                        'paying_method' => $payrollData['paying_method'] ?? 'Cash',
                        'note' => $payrollData['note'] ?? null,
                        'status' => $request->payroll_group_status ?? 'draft',
                        'amount_array' => json_encode($amountArray),
                    ]);
                    $payroll = $existingPayroll;
                } else {
                    // Create new payroll
                    $payroll = Payroll::create([
                        'reference_no' => $reference_no,
                        'employee_id' => $payrollData['employee_id'],
                        'user_id' => Auth::id(),
                        'account_id' => $request->account_id ?? 0,
                        'amount' => $total,
                        'paying_method' => $payrollData['paying_method'] ?? 'Cash',
                        'note' => $payrollData['note'] ?? null,
                        'status' => $request->payroll_group_status ?? 'draft',
                        'amount_array' => json_encode($amountArray),
                        'month' => $request->month,
                    ]);
                }

                // Send email
                $employee = Employee::find($payrollData['employee_id']);
                if ($employee) {
                    $mail_data = [
                        'reference_no' => $reference_no,
                        'amount' => $total,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'currency' => config('currency'),
                    ];

                    $mail_setting = MailSetting::latest()->first();
                    if ($mail_setting) {
                        $this->setMailInfo($mail_setting);

                        try {
                            Mail::to($mail_data['email'])->send(new PayrollDetails($mail_data));
                        } catch (\Exception $e) {
                            \Log::error('Mail send failed: ' . $e->getMessage());
                        }
                    }
                }
            }

            $message = 'All payrolls processed successfully!';

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, array_merge(
                    ['message' => $message],
                    $this->payrollIndexPayload()
                ));
            }

            return redirect()->route('payroll.index')->with('message', $message);
        } catch (\Exception $e) {
            \Log::error('Payroll store error: ' . $e->getMessage());

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => 'Something went wrong while generating payrolls.',
                ], 500);
            }

            return redirect()->back()->with('error', 'Something went wrong while generating payrolls.');
        }
    }

    public function generateCards(Request $request)
    {
        $warehouse_id = $request->warehouse_id;
        $month = $request->month; // Format: YYYY-MM
        $employee_ids = $request->employee_ids;

        // Parse start and end of month from YYYY-MM format
        $monthStart = Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
        $monthEnd = Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();

        // Get employees (all active or filtered)
        if (!$employee_ids || count($employee_ids) == 0) {
            $employees = Employee::where('is_active', true)->get();
        } else {
            $employees = Employee::whereIn('id', $employee_ids)
                ->where('is_active', true)->get();
        }

        $warehouse = $warehouse_id ? Warehouse::find($warehouse_id) : null;
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_account_list = Account::where('is_active', true)->get();

        foreach ($employees as $employee) {

            // Check if payroll exists for this employee and month
            $existingPayroll = Payroll::where('employee_id', $employee->id)
                ->where('month', $month)
                ->first();

            // Leaves: approved leaves in this month
            $leaves = Leave::where('employee_id', $employee->id)
                ->where('status', 'Approved')
                ->where(function ($q) use ($monthStart, $monthEnd) {
                    $q->whereBetween('start_date', [$monthStart, $monthEnd])
                        ->orWhereBetween('end_date', [$monthStart, $monthEnd])
                        ->orWhere(function ($q2) use ($monthStart, $monthEnd) {
                            $q2->where('start_date', '<', $monthStart)
                                ->where('end_date', '>', $monthEnd);
                        });
                })->get();

            // Attendance dates in the month
            $attendanceDates = Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->pluck('date')
                ->map(fn($d) => Carbon::parse($d)->toDateString())
                ->toArray();

            $totalLeaveDays = 0;

            foreach ($leaves as $leave) {
                $start = Carbon::parse($leave->start_date)->greaterThan($monthStart) ? $leave->start_date : $monthStart;
                $end   = Carbon::parse($leave->end_date)->lessThan($monthEnd) ? $leave->end_date : $monthEnd;

                for ($date = Carbon::parse($start); $date->lte(Carbon::parse($end)); $date->addDay()) {
                    if (!in_array($date->toDateString(), $attendanceDates)) {
                        $totalLeaveDays++;
                    }
                }
            }
            $employee->total_leaves = $totalLeaveDays;

            // Attendance days
            $employee->attendance_days = Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->count();

            // Total work hours
            $attendances = Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->get();

            $totalHours = 0;
            foreach ($attendances as $att) {
                if ($att->checkin && $att->checkout) {
                    $checkin = Carbon::parse($att->checkin);
                    $checkout = Carbon::parse($att->checkout);
                    $totalHours += $checkout->diffInMinutes($checkin) / 60;
                }
            }
            $employee->total_work_hours = number_format($totalHours, 2);

            // Total sales for sale agents
            if ($employee->is_sale_agent) {
                $employee->total_sales = Payment::where('user_id', $employee->user_id)
                    ->whereBetween('payment_at', [$monthStart, $monthEnd])
                    ->sum('amount');
            } else {
                $employee->total_sales = 0;
            }

            // ===== Commission Calculation (Sales Target Based - Max Commission) =====
            $employee->commission = 0;

            if ($employee->is_sale_agent == 1 && $employee->user_id) {

                // মোট sales amount
                $totalSales = Sale::where('user_id', $employee->user_id)
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('grand_total');
                $targets = $employee->sales_target;

                if (is_array($targets)) {

                    $maxCommission = 0;

                    foreach ($targets as $target) {

                        $from = (float) ($target['sales_from'] ?? 0);
                        $to = (float) ($target['sales_to'] ?? 0);
                        $percent = (float) ($target['percent'] ?? 0);

                        if ($totalSales >= $from && $totalSales <= $to) {

                            $commission = ($totalSales * $percent) / 100;

                            if ($commission > $maxCommission) {
                                $maxCommission = $commission;
                            }
                        }
                    }

                    // সর্বোচ্চ commission assign
                    $employee->commission = $maxCommission;
                }
            }

            // Employee Expenses
            $employee->expenses = Expense::where('employee_id', $employee->id)
                ->where('expense_category_id', 0)
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('amount');

            // Overtime: approved hours & amount
            $employee->overtime_hours = Overtime::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->sum('hours');

            $employee->overtime_amount = Overtime::where('employee_id', $employee->id)
                ->where('status', 'approved')
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->sum('amount');

            // Payroll existing
            if ($existingPayroll) {
                $amountArray = json_decode($existingPayroll->amount_array, true);
                $employee->existing_payroll = [
                    'salary' => $amountArray['salary'] ?? ($existingPayroll->amount ?? 0),
                    'commission' => $amountArray['commission'] ?? 0,
                    'expense' => $amountArray['expense'] ?? ($employee->expenses ?? 0),
                    'overtime' => $amountArray['overtime'] ?? ($employee->overtime_amount ?? 0),
                    'total_amount' => $amountArray['total'] ?? ($existingPayroll->amount ?? 0),
                    'method' => $existingPayroll->paying_method ?? '0',
                    'note' => $existingPayroll->note ?? '',
                    'status' => $existingPayroll->status ?? 'draft',
                    'date' => Carbon::parse($existingPayroll->created_at)->format('d-m-Y'),
                ];
            } else {
                $employee->existing_payroll = [
                    'salary' => $employee->basic_salary,
                    'commission' => $employee->commission, // এখন max commission আছে
                    'expense' => $employee->expenses,
                    'overtime' => $employee->overtime_amount ?? 0,
                    'total_amount' => 0,
                    'method' => '0',
                    'note' => '',
                    'status' => 'draft',
                    'date' => now()->format('d-m-Y'),
                ];
            }
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'month' => $month,
                'warehouse_id' => $warehouse_id,
                'warehouse_name' => $warehouse?->name,
                'accounts' => $lims_account_list->map(fn ($account) => [
                    'id' => $account->id,
                    'name' => $account->name,
                    'account_no' => $account->account_no,
                    'is_default' => (bool) $account->is_default,
                ]),
                'employees' => $employees->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'user_id' => $employee->user_id,
                        'is_sale_agent' => (bool) $employee->is_sale_agent,
                        'sale_commission_percent' => $employee->sale_commission_percent,
                        'total_leaves' => $employee->total_leaves ?? 0,
                        'attendance_days' => $employee->attendance_days ?? 0,
                        'total_work_hours' => $employee->total_work_hours ?? '0.00',
                        'existing_payroll' => $employee->existing_payroll ?? [],
                    ];
                }),
            ]);
        }

        return view('backend.hrm.payroll.generate-payroll', compact(
            'warehouse',
            'lims_account_list',
            'employees',
            'month',
            'warehouse_id',
            'lims_warehouse_list'
        ));
    }
}
