<?php

namespace App\Http\Controllers;

use App\Models\Biller;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
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

class EmployeeController extends Controller
{
    use FileDelete;
    use SpaResponse;
    use TenantInfo;

    protected function userCanAccessEmployees(string $action = 'index'): bool
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

        $permissionMap = [
            'index' => 'employees-index',
            'add' => 'employees-add',
            'edit' => 'employees-edit',
            'delete' => 'employees-delete',
        ];

        return $role->hasPermissionTo($permissionMap[$action] ?? 'employees-index');
    }

    protected function denyEmployeeAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function employeeFormMetadata(): array
    {
        return [
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'designations' => Designation::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'shifts' => Shift::where('is_active', true)->orderBy('name')->get(['id', 'name', 'start_time', 'end_time']),
            'roles' => Role::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'billers' => Biller::where('is_active', true)->orderBy('name')->get(['id', 'name', 'company_name']),
        ];
    }

    protected function formatEmployee(Employee $employee): array
    {
        $employee->loadMissing('user');
        $department = Department::find($employee->department_id);

        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'email' => $employee->email,
            'phone_number' => $employee->phone_number,
            'address' => $employee->address,
            'city' => $employee->city,
            'country' => $employee->country,
            'staff_id' => $employee->staff_id,
            'basic_salary' => $employee->basic_salary,
            'department_id' => $employee->department_id,
            'department_name' => $department->name ?? null,
            'shift_id' => $employee->shift_id,
            'designation_id' => $employee->designation_id,
            'role_id' => $employee->role_id,
            'warehouse_id' => $employee->warehouse_id,
            'biller_id' => $employee->biller_id,
            'user_id' => $employee->user_id,
            'has_user' => (bool) $employee->user_id,
            'image' => $employee->image,
            'image_url' => $employee->image ? url('images/employee/' . $employee->image) : null,
            'is_sale_agent' => (bool) $employee->is_sale_agent,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessEmployees('index')) {
            return $this->denyEmployeeAccess($request);
        }

        $lims_employee_all = Employee::with('user')->where('is_active', true)->orderBy('name')->get();
        $lims_department_list = Department::where('is_active', true)->get();
        $numberOfEmployee = Employee::where('is_active', true)->count();
        $lims_shift_list = Shift::where('is_active', true)->get();
        $lims_designation_list = Designation::active()->get();
        $lims_role_list = Role::where('is_active', true)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_biller_list = Biller::where('is_active', true)->get();

        $role = Role::find(Auth::user()->role_id);
        $permissions = Role::findByName($role->name)->permissions;
        $all_permission = [];
        foreach ($permissions as $permission) {
            $all_permission[] = $permission->name;
        }
        if (empty($all_permission)) {
            $all_permission[] = 'dummy text';
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_employee_all->map(fn (Employee $employee) => $this->formatEmployee($employee)),
                'metadata' => $this->employeeFormMetadata(),
                'number_of_employee' => $numberOfEmployee,
            ]);
        }

        return view('backend.employee.index', compact(
            'lims_biller_list',
            'lims_warehouse_list',
            'lims_role_list',
            'lims_designation_list',
            'lims_shift_list',
            'lims_employee_all',
            'lims_department_list',
            'all_permission',
            'numberOfEmployee'
        ));
    }

    public function create(Request $request)
    {
        if (!$this->userCanAccessEmployees('add')) {
            return $this->denyEmployeeAccess($request);
        }

        $lims_role_list = Role::where('is_active', true)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_biller_list = Biller::where('is_active', true)->get();
        $lims_department_list = Department::where('is_active', true)->get();
        $lims_shift_list = Shift::where('is_active', true)->get();
        $lims_designation_list = Designation::active()->get();
        $numberOfEmployee = Employee::where('is_active', true)->count();
        $numberOfUserAccount = User::where('is_active', true)->count();

        $general_setting = \App\Models\GeneralSetting::first();
        if (in_array('project', explode(',', $general_setting->modules))) {
            $companies = \Modules\Project\Entities\Company::where('is_active', true)->get();
        } else {
            $companies = [];
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'metadata' => $this->employeeFormMetadata(),
                'number_of_employee' => $numberOfEmployee,
                'number_of_user_account' => $numberOfUserAccount,
                'companies' => $companies,
            ]);
        }

        return view('backend.employee.create', compact(
            'lims_role_list',
            'lims_warehouse_list',
            'lims_biller_list',
            'lims_department_list',
            'numberOfEmployee',
            'numberOfUserAccount',
            'companies',
            'lims_shift_list',
            'lims_designation_list'
        ));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessEmployees('add')) {
            return $this->denyEmployeeAccess($request);
        }

        $data = $request->except('image');
        $message = 'Employee created successfully';

        $data['name'] = $data['employee_name'] ?? $data['name'] ?? null;
        $data['is_active'] = true;

        if (isset($data['user'])) {
            $this->validate($request, [
                'name' => [
                    'max:255',
                    Rule::unique('users')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'email' => [
                    'email',
                    'max:255',
                    Rule::unique('users')->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
            ]);

            $data['is_deleted'] = false;
            $data['password'] = bcrypt($data['password']);
            $data['phone'] = $data['phone_number'];
            if (isset($data['company'])) {
                $data['company_name'] = $data['company'];
            }

            User::create($data);
            $user = User::latest()->first();
            $data['user_id'] = $user->id;
            $message = 'Employee created successfully and added to user list';
        }

        $this->validate($request, [
            'employee_name' => 'required_without:name|max:255',
            'email' => [
                'max:255',
                Rule::unique('employees')->where(function ($query) {
                    return $query->where('is_active', true);
                }),
            ],
            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $image = $request->image;
        if ($image) {
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = date('Ymdhis');
            if (!config('database.connections.saleprosaas_landlord')) {
                $imageName = $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            } else {
                $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            }
            $data['image'] = $imageName;
        }

        $isSaleAgent = $data['is_sale_agent'] ?? 0;

        $employee = Employee::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone_number' => $data['phone_number'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'country' => $data['country'] ?? null,
            'basic_salary' => $data['basic_salary'] ?? null,
            'staff_id' => $data['staff_id'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'shift_id' => $data['shift_id'] ?? null,
            'designation_id' => $data['designation_id'] ?? null,
            'role_id' => $data['role_id'] ?? null,
            'warehouse_id' => $data['warehouse_id'] ?? null,
            'biller_id' => $data['biller_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'image' => $data['image'] ?? null,
            'is_active' => true,
            'is_sale_agent' => $isSaleAgent,
            'sales_target' => $isSaleAgent == 1 ? ($data['sales_target'] ?? null) : null,
        ]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => $message,
                'data' => $this->formatEmployee($employee),
                'redirect' => $isSaleAgent ? '/sale-agents' : '/employees',
            ], 201);
        }

        if ($isSaleAgent) {
            return redirect('sale-agents')->with('message', $message);
        }

        return redirect('employees')->with('message', $message);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessEmployees('edit')) {
            return $this->denyEmployeeAccess($request);
        }

        $lims_employee_data = Employee::findOrFail($request->input('employee_id', $id));

        if ($lims_employee_data->user_id) {
            $this->validate($request, [
                'name' => [
                    'max:255',
                    Rule::unique('users')->ignore($lims_employee_data->user_id)->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
                'email' => [
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($lims_employee_data->user_id)->where(function ($query) {
                        return $query->where('is_deleted', false);
                    }),
                ],
            ]);
        }

        $this->validate($request, [
            'email' => [
                'email',
                'max:255',
                Rule::unique('employees')->ignore($lims_employee_data->id)->where(function ($query) {
                    return $query->where('is_active', true);
                }),
            ],
            'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $data = $request->except('image');
        $image = $request->image;
        if ($image) {
            $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = date('Ymdhis');
            if (!config('database.connections.saleprosaas_landlord')) {
                $imageName = $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            } else {
                $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            }
            $data['image'] = $imageName;
        }

        $lims_employee_data->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? $lims_employee_data->email,
            'phone_number' => $data['phone_number'] ?? $lims_employee_data->phone_number,
            'address' => $data['address'] ?? $lims_employee_data->address,
            'city' => $data['city'] ?? $lims_employee_data->city,
            'country' => $data['country'] ?? $lims_employee_data->country,
            'basic_salary' => $data['basic_salary'] ?? $lims_employee_data->basic_salary,
            'staff_id' => $data['staff_id'] ?? $lims_employee_data->staff_id,
            'department_id' => $data['department_id'] ?? $lims_employee_data->department_id,
            'shift_id' => $data['shift_id'] ?? $lims_employee_data->shift_id,
            'designation_id' => $data['designation_id'] ?? $lims_employee_data->designation_id,
            'role_id' => $data['role_id'] ?? $lims_employee_data->role_id,
            'warehouse_id' => $data['warehouse_id'] ?? $lims_employee_data->warehouse_id,
            'biller_id' => $data['biller_id'] ?? $lims_employee_data->biller_id,
            'user_id' => $data['user_id'] ?? $lims_employee_data->user_id,
            'image' => $data['image'] ?? $lims_employee_data->image,
        ]);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Employee updated successfully'),
                'data' => $this->formatEmployee($lims_employee_data->fresh()),
            ]);
        }

        return redirect('employees')->with('message', __('db.Employee updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessEmployees('delete')) {
            return $this->denyEmployeeAccess($request);
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
                    $lims_user_data->save();
                }
            }
            $lims_employee_data->is_active = false;
            $lims_employee_data->save();
            $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
        }

        $message = 'Employee deleted successfully!';

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['message' => $message]);
        }

        return $message;
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessEmployees('delete')) {
            return $this->denyEmployeeAccess($request);
        }

        $lims_employee_data = Employee::findOrFail($id);
        if ($lims_employee_data->user_id) {
            $lims_user_data = User::find($lims_employee_data->user_id);
            if ($lims_user_data) {
                $lims_user_data->is_deleted = true;
                $lims_user_data->save();
            }
        }

        $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);

        $lims_employee_data->is_active = false;
        $lims_employee_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Employee deleted successfully'),
            ]);
        }

        return redirect('employees')->with('not_permitted', __('db.Employee deleted successfully'));
    }
}
