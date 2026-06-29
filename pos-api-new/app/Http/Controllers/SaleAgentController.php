<?php

namespace App\Http\Controllers;

use App\Models\Biller;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\GeneralSetting;
use App\Models\Shift;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\Permissions;
use App\Traits\FileDelete;
use App\Traits\SpaResponse;
use App\Traits\TenantInfo;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class SaleAgentController extends Controller
{
    use FileDelete;
    use SpaResponse;
    use TenantInfo;

    protected function userCanAccessSaleAgents(string $action = 'index'): bool
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

        if ($action === 'add') {
            return $role->hasPermissionTo('employees-add') || $role->hasPermissionTo('sale-agents');
        }

        return $role->hasPermissionTo('sale-agents');
    }

    protected function denySaleAgentAccess(Request $request)
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

    protected function usernameUniqueRule(?int $ignoreId = null): array
    {
        $rule = Rule::unique('users', 'username')->where(function ($query) {
            return $query->where('is_deleted', false);
        });

        if ($ignoreId !== null) {
            $rule = $rule->ignore($ignoreId);
        }

        return ['max:255', $rule];
    }

    protected function saleAgentFormMetadata(): array
    {
        $generalSetting = GeneralSetting::latest()->first();
        $modules = $generalSetting && $generalSetting->modules
            ? explode(',', $generalSetting->modules)
            : [];

        return [
            'lims_role_list' => Role::where('is_active', true)->where('id', '!=', 5)->orderBy('name')->get(['id', 'name']),
            'lims_biller_list' => Biller::where('is_active', true)->orderBy('name')->get(['id', 'name', 'company_name']),
            'lims_warehouse_list' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_department_list' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_shift_list' => Shift::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_designation_list' => Designation::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'number_of_employee' => Employee::where('is_active', true)->count(),
            'project_enabled' => in_array('project', $modules, true),
            'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    protected function formatSaleAgent(Employee $agent): array
    {
        $agent->loadMissing('user');
        $department = Department::find($agent->department_id);

        $addressParts = array_filter([
            $agent->address,
            $agent->city,
            $agent->country,
        ]);

        return [
            'id' => $agent->id,
            'name' => $agent->name,
            'email' => $agent->email,
            'phone_number' => $agent->phone_number,
            'department_id' => $agent->department_id,
            'department_name' => $department->name ?? null,
            'address' => $agent->address,
            'city' => $agent->city,
            'country' => $agent->country,
            'address_display' => implode(', ', $addressParts),
            'staff_id' => $agent->staff_id,
            'company_name' => $agent->user->company_name ?? null,
            'user_id' => $agent->user_id,
            'has_user' => (bool) $agent->user_id,
            'image' => $agent->image,
            'image_url' => $agent->image ? url('images/employee/' . $agent->image) : null,
            'sales_target' => $agent->sales_target ?? [],
            'role_id' => $agent->user->role_id ?? null,
            'warehouse_id' => $agent->user->warehouse_id ?? $agent->warehouse_id ?? null,
            'biller_id' => $agent->user->biller_id ?? null,
        ];
    }

    protected function storeEmployeeImage(Request $request, ?string $existing = null): ?string
    {
        $image = $request->file('image');
        if (!$image) {
            return $existing;
        }

        if ($existing) {
            $this->fileDelete(public_path('images/employee/'), $existing);
        }

        $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
        $imageName = date('Ymdhis');
        if (!config('database.connections.saleprosaas_landlord')) {
            $imageName = $imageName . '.' . $ext;
        } else {
            $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
        }
        $image->move(public_path('images/employee'), $imageName);

        return $imageName;
    }

    protected function normalizedSalesTarget(Request $request): ?array
    {
        $targets = $request->input('sales_target');
        if (!is_array($targets)) {
            return null;
        }

        $normalized = [];
        foreach ($targets as $row) {
            if (!is_array($row)) {
                continue;
            }
            if (($row['percent'] ?? '') === '' && ($row['sales_from'] ?? '') === '' && ($row['sales_to'] ?? '') === '') {
                continue;
            }
            $normalized[] = [
                'sales_from' => $row['sales_from'] ?? null,
                'sales_to' => $row['sales_to'] ?? null,
                'percent' => $row['percent'] ?? null,
            ];
        }

        return $normalized ?: null;
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessSaleAgents('index')) {
            return $this->denySaleAgentAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $agents = Employee::with('user')
                ->where('is_active', true)
                ->where('is_sale_agent', 1)
                ->orderBy('name')
                ->get()
                ->map(fn (Employee $agent) => $this->formatSaleAgent($agent));

            return $this->spaJson($request, array_merge(
                ['sale_agents' => $agents],
                $this->saleAgentFormMetadata()
            ));
        }

        $role = Role::find(Auth::user()->role_id);

        if ($role && $role->hasPermissionTo('sale-agents')) {
            $permissions = Role::findByName($role->name)->permissions;
            $all_permission = [];
            foreach ($permissions as $permission) {
                $all_permission[] = $permission->name;
            }
            if (empty($all_permission)) {
                $all_permission[] = 'dummy text';
            }

            $lims_sale_agent_all = Employee::with('user')
                ->where('is_active', true)
                ->where('is_sale_agent', 1)
                ->get();

            $lims_department_list = Department::where('is_active', true)->get();
            $lims_role_list = Role::where('is_active', true)->where('id', '!=', 5)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_shift_list = Shift::where('is_active', true)->get();
            $lims_designation_list = Designation::where('is_active', true)->get();
            $numberOfEmployee = Employee::where('is_active', true)->count();

            return view('backend.hrm.sale_agent.index', compact(
                'lims_role_list',
                'lims_sale_agent_all',
                'lims_department_list',
                'lims_warehouse_list',
                'lims_biller_list',
                'lims_shift_list',
                'lims_designation_list',
                'all_permission',
                'numberOfEmployee'
            ));
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function create(Request $request)
    {
        if (!$this->userCanAccessSaleAgents('add')) {
            return $this->denySaleAgentAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                $this->saleAgentFormMetadata(),
                ['number_of_user_account' => User::where('is_active', true)->count()]
            ));
        }

        $role = Role::find(Auth::user()->role_id);
        if ($role->hasPermissionTo('employees-add')) {
            $lims_role_list = Role::where('is_active', true)->where('id', '!=', 5)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_department_list = Department::where('is_active', true)->get();
            $numberOfEmployee = Employee::where('is_active', true)->count();
            $numberOfUserAccount = User::where('is_active', true)->count();

            $general_setting = GeneralSetting::first();
            if (in_array('project', explode(',', $general_setting->modules ?? ''))) {
                $companies = \Modules\Project\Entities\Company::where('is_active', true)->get();
            } else {
                $companies = [];
            }

            return view('backend.hrm.sale_agent.create', compact(
                'lims_role_list',
                'lims_warehouse_list',
                'lims_biller_list',
                'lims_department_list',
                'numberOfEmployee',
                'numberOfUserAccount',
                'companies'
            ));
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessSaleAgents('add')) {
            return $this->denySaleAgentAccess($request);
        }

        try {
            $data = $request->except('image');
            $message = 'Sale Agent created successfully';

            if ($this->requestFlagEnabled($request, 'user')) {
                $this->validate($request, [
                    'username' => array_merge(['required'], $this->usernameUniqueRule()),
                    'email' => [
                        'nullable',
                        'email',
                        'max:255',
                        Rule::unique('users', 'email')->where(function ($query) {
                            return $query->where('is_deleted', false);
                        }),
                    ],
                    'password' => 'required|min:6',
                    'role_id' => 'required|exists:roles,id',
                ]);

                if ((int) $request->input('role_id') > 2) {
                    $this->validate($request, [
                        'biller_id' => 'required|exists:billers,id',
                        'warehouse_id' => 'required|exists:warehouses,id',
                    ]);
                }

                $userPayload = [
                    'username' => $request->input('username'),
                    'email' => $data['email'] ?? null,
                    'password' => bcrypt($data['password']),
                    'phone' => $data['phone_number'] ?? null,
                    'role_id' => $data['role_id'],
                    'biller_id' => $data['biller_id'] ?? null,
                    'warehouse_id' => $data['warehouse_id'] ?? null,
                    'company_name' => $data['company'] ?? null,
                    'is_active' => true,
                    'is_deleted' => false,
                ];

                $user = User::create($userPayload);
                $data['user_id'] = $user->id;
                $message = 'Employee created successfully and added to user list';
            }

            $this->validate($request, [
                'name' => 'required|max:255',
                'phone_number' => 'required|max:255',
                'address' => 'required|max:255',
                'city' => 'required|max:255',
                'email' => [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('employees')->where(function ($query) {
                        return $query->where('is_active', true);
                    }),
                ],
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:100000',
            ]);

            $data['image'] = $this->storeEmployeeImage($request);
            $data['department_id'] = $data['department_id'] ?? 0;
            $data['is_active'] = true;
            $data['is_sale_agent'] = 1;
            $data['sales_target'] = $this->normalizedSalesTarget($request);

            $employee = Employee::create([
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone_number' => $data['phone_number'],
                'address' => $data['address'],
                'city' => $data['city'],
                'country' => $data['country'] ?? null,
                'department_id' => $data['department_id'],
                'user_id' => $data['user_id'] ?? null,
                'image' => $data['image'] ?? null,
                'is_active' => true,
                'is_sale_agent' => 1,
                'sales_target' => $data['sales_target'],
                'basic_salary' => 0,
            ]);

            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => $message,
                    'data' => $this->formatSaleAgent($employee),
                ], 201);
            }

            return redirect('sale-agents')->with('message', $message);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($this->wantsSpaResponse($request)) {
                throw $e;
            }

            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => 'Something went wrong: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()
                ->with('error', 'Something went wrong: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessSaleAgents('index')) {
            return $this->denySaleAgentAccess($request);
        }

        $lims_employee_data = Employee::findOrFail($request->input('employee_id', $id));

        if ($lims_employee_data->user_id) {
            $this->validate($request, [
                'name' => $this->usernameUniqueRule((int) $lims_employee_data->user_id),
                'email' => [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($lims_employee_data->user_id)->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
            ]);
        }

        $this->validate($request, [
            'name' => 'required|max:255',
            'phone_number' => 'required|max:255',
            'address' => 'required|max:255',
            'city' => 'required|max:255',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('employees')->ignore($lims_employee_data->id)->where(function ($query) {
                    return $query->where('is_active', true);
                }),
            ],
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        if ($this->requestFlagEnabled($request, 'user') && !$lims_employee_data->user_id) {
            $this->validate($request, [
                'username' => array_merge(['required'], $this->usernameUniqueRule()),
                'password' => 'required|min:6',
                'role_id' => 'required|exists:roles,id',
            ]);

            if ((int) $request->input('role_id') > 2) {
                $this->validate($request, [
                    'biller_id' => 'required|exists:billers,id',
                    'warehouse_id' => 'required|exists:warehouses,id',
                ]);
            }
        }

        $data = $request->except('image');
        $data['image'] = $this->storeEmployeeImage($request, $lims_employee_data->image);

        if ($this->requestFlagEnabled($request, 'user') && !$lims_employee_data->user_id) {
            $user = User::create([
                'username' => $request->input('username'),
                'email' => $data['email'] ?? null,
                'password' => bcrypt($data['password']),
                'phone' => $data['phone_number'] ?? null,
                'role_id' => $data['role_id'],
                'biller_id' => $data['biller_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'is_active' => true,
                'is_deleted' => false,
            ]);
            $data['user_id'] = $user->id;
        }

        $lims_employee_data->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? $lims_employee_data->email,
            'phone_number' => $data['phone_number'],
            'address' => $data['address'],
            'city' => $data['city'],
            'country' => $data['country'] ?? $lims_employee_data->country,
            'user_id' => $data['user_id'] ?? $lims_employee_data->user_id,
            'image' => $data['image'] ?? $lims_employee_data->image,
            'is_sale_agent' => 1,
            'sales_target' => $this->normalizedSalesTarget($request),
        ]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Employee updated successfully'),
                'data' => $this->formatSaleAgent($lims_employee_data->fresh()),
            ]);
        }

        return redirect('sale-agents')->with('message', __('db.Employee updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessSaleAgents('index')) {
            return $this->denySaleAgentAccess($request);
        }

        $employee_id = $request->input('employeeIdArray', []);
        foreach ($employee_id as $id) {
            $lims_employee_data = Employee::find($id);
            if (!$lims_employee_data) {
                continue;
            }
            if ($lims_employee_data->user_id) {
                $lims_user_data = User::find($lims_employee_data->user_id);
                if ($lims_user_data) {
                    $lims_user_data->is_deleted = true;
                    $lims_user_data->is_active = false;
                    $lims_user_data->save();
                }
            }
            $lims_employee_data->is_active = false;
            $lims_employee_data->save();
            $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Employee deleted successfully')]);
        }

        return 'Employee deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessSaleAgents('index')) {
            return $this->denySaleAgentAccess($request);
        }

        $lims_employee_data = Employee::findOrFail($id);
        if ($lims_employee_data->user_id) {
            $lims_user_data = User::find($lims_employee_data->user_id);
            if ($lims_user_data) {
                $lims_user_data->is_deleted = true;
                $lims_user_data->is_active = false;
                $lims_user_data->save();
            }
        }

        $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
        $lims_employee_data->is_active = false;
        $lims_employee_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => __('db.Employee deleted successfully')]);
        }

        return redirect('sale-agents')->with('not_permitted', __('db.Employee deleted successfully'));
    }
}
