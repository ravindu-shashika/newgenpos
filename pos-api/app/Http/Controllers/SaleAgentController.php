<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Employee;
use App\Models\User;
use App\Models\Department;
use Auth;
use Illuminate\Validation\Rule;
use App\Traits\TenantInfo;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SaleAgentController extends Controller
{
    use TenantInfo;

    /**
     * API: Sale agent list for React.
     */
    public function listApi(Request $request)
    {
        $agents = Employee::with('department')
            ->where('is_active', true)
            ->where('is_sale_agent', 1)
            ->orderBy('created_at', 'desc')
            ->get();
        $baseUrl = rtrim(config('app.url'), '/');
        $data = [];
        foreach ($agents as $agent) {
            $addr = trim($agent->address ?? '');
            if ($agent->city) {
                $addr .= ($addr ? ', ' : '') . $agent->city;
            }
            if ($agent->country) {
                $addr .= ($addr ? ', ' : '') . $agent->country;
            }
            $imageUrl = null;
            if ($agent->image) {
                $imageUrl = $baseUrl . '/images/sale_agent/' . $agent->image;
                if (!is_file(public_path('images/sale_agent/' . $agent->image))) {
                    $imageUrl = $baseUrl . '/images/employee/' . $agent->image;
                }
            }
            $data[] = [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email ?? '—',
                'phone_number' => $agent->phone_number ?? '—',
                'department_id' => $agent->department_id,
                'department_name' => $agent->department ? $agent->department->name : '—',
                'address' => $addr ?: '—',
                'staff_id' => $agent->staff_id ?? '—',
                'image' => $agent->image,
                'image_url' => $imageUrl,
                'sales_target' => $agent->sales_target ?? [],
            ];
        }
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Form data for sale agent add/edit.
     */
    public function formDataApi(Request $request)
    {
        $departments = Department::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $roles = DB::table('roles')->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $billers = Biller::where('is_active', true)->orderBy('name')->get(['id', 'name', 'company_name']);
        return response()->json([
            'status' => 200,
            'departments' => $departments,
            'roles' => $roles,
            'warehouses' => $warehouses,
            'billers' => $billers,
        ]);
    }

    /**
     * API: Get one sale agent for edit.
     */
    public function getApi($id)
    {
        $agent = Employee::where('is_active', true)->where('is_sale_agent', 1)->find($id);
        if (!$agent) {
            return response()->json(['status' => 404, 'message' => 'Sale agent not found'], 404);
        }
        $data = $agent->toArray();
        $data['image_url'] = $agent->image ? (rtrim(config('app.url'), '/') . '/images/sale_agent/' . $agent->image) : null;
        $data['sales_target'] = $agent->sales_target ?? [];
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Store sale agent (JSON) for React.
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
        ]);
        $data = $request->only([
            'name', 'email', 'phone_number', 'address', 'city', 'country',
            'department_id', 'sales_target',
        ]);
        $data['department_id'] = $data['department_id'] ?? 0;
        $data['is_active'] = true;
        $data['is_sale_agent'] = 1;
        if (is_array($data['sales_target'] ?? null)) {
            $data['sales_target'] = array_values(array_filter($data['sales_target'], function ($row) {
                return isset($row['sales_from']) || isset($row['sales_to']) || isset($row['percent']);
            }));
        } else {
            $data['sales_target'] = null;
        }
        if (isset($request->user) && $request->user) {
            $request->validate([
                'username' => 'required|string|max:255|unique:users,name,NULL,id,is_deleted,0',
                'password' => 'required|string|min:6',
                'role_id' => 'required|exists:roles,id',
            ]);
            $userData = [
                'name' => $request->username,
                'email' => $request->email ?? $request->username . '@saleagent.local',
                'password' => bcrypt($request->password),
                'phone' => $data['phone_number'],
                'role_id' => $request->role_id,
                'warehouse_id' => $request->warehouse_id ?? null,
                'biller_id' => $request->biller_id ?? null,
                'is_active' => true,
                'is_deleted' => false,
            ];
            $user = User::create($userData);
            $data['user_id'] = $user->id;
        }
        $agent = Employee::create($data);
        return response()->json(['status' => 200, 'message' => __('db.Sale Agent created successfully'), 'id' => $agent->id]);
    }

    /**
     * API: Update sale agent (JSON) for React.
     */
    public function updateApi(Request $request, $id)
    {
        $agent = Employee::where('is_active', true)->where('is_sale_agent', 1)->find($id);
        if (!$agent) {
            return response()->json(['status' => 404, 'message' => 'Sale agent not found'], 404);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
        ]);
        $data = $request->only([
            'name', 'email', 'phone_number', 'address', 'city', 'country',
            'department_id', 'sales_target',
        ]);
        $data['department_id'] = $data['department_id'] ?? 0;
        if (array_key_exists('sales_target', $data) && is_array($data['sales_target'])) {
            $data['sales_target'] = array_values(array_filter($data['sales_target'], function ($row) {
                return isset($row['sales_from']) || isset($row['sales_to']) || isset($row['percent']);
            }));
        }
        if ($agent->user_id && $request->filled('name')) {
            User::where('id', $agent->user_id)->update(['name' => $request->name, 'email' => $request->email ?? $agent->email, 'phone' => $request->phone_number]);
        }
        $agent->update($data);
        return response()->json(['status' => 200, 'message' => __('db.Employee updated successfully')]);
    }

    /**
     * API: Destroy sale agent (soft delete) for React.
     */
    public function destroyApi($id)
    {
        $agent = Employee::find($id);
        if (!$agent) {
            return response()->json(['status' => 404, 'message' => 'Sale agent not found'], 404);
        }
        if ($agent->user_id) {
            $u = User::find($agent->user_id);
            if ($u) {
                $u->is_deleted = true;
                $u->is_active = false;
                $u->save();
            }
        }
        $agent->is_active = false;
        $agent->save();
        $this->fileDelete(public_path('images/sale_agent/'), $agent->image);
        $this->fileDelete(public_path('images/employee/'), $agent->image);
        return response()->json(['status' => 200, 'message' => __('db.Employee deleted successfully')]);
    }

    public function index()
    {
        $role = Role::find(Auth::user()->role_id);

        if ($role && $role->hasPermissionTo('sale-agents')) {

            // Get all permission names for current role
            $permissions = Role::findByName($role->name)->permissions;
            $all_permission = [];
            foreach ($permissions as $permission) {
                $all_permission[] = $permission->name;
            }
            if (empty($all_permission)) {
                $all_permission[] = 'dummy text';
            }

            // Sale agents (employees flagged as sale agents)
            $lims_sale_agent_all = Employee::with('user')
                ->where('is_active', true)
                ->where('is_sale_agent', 1)
                ->get();

            // Auxiliary lists used by the blade (create / edit forms)
            $lims_department_list = Department::where('is_active', true)->get();
            $lims_role_list       = Role::where('is_active', true)->where('id', '!=', 5)->get();
            $lims_warehouse_list  = \App\Models\Warehouse::where('is_active', true)->get();
            $lims_biller_list     = \App\Models\Biller::where('is_active', true)->get();
            $lims_shift_list      = \App\Models\Shift::where('is_active', true)->get();
            $lims_designation_list= \App\Models\Designation::where('is_active', true)->get();

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
        } else {
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }
    }


    public function create()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('employees-add')){
            $lims_role_list = Role::where('is_active', true)->where('id','!=',5)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_department_list = Department::where('is_active', true)->get();
            $numberOfEmployee = Employee::where('is_active', true)->count();
            $numberOfUserAccount = User::where('is_active', true)->count();

            $general_setting = \App\Models\GeneralSetting::first();

            if(in_array('project',explode(',',$general_setting->modules))){
                $companies = \Modules\Project\Entities\Company::where('is_active', true)->get();
            } else {
                $companies = [];
            }


            return view('backend.hrm.sale_agent.create', compact('lims_role_list', 'lims_warehouse_list', 'lims_biller_list', 'lims_department_list', 'numberOfEmployee', 'numberOfUserAccount','companies'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }
    public function store(Request $request)
    {
        try {
            $data = $request->except('image');
            $message = 'Sale Agent created successfully';

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
                    'role_id' => 'required|exists:roles,id', // added role validation
                ]);

                $data['is_active'] = true;
                $data['is_deleted'] = false;
                $data['password'] = bcrypt($data['password']);
                $data['phone'] = $data['phone_number'];

                if (isset($data['company'])) {
                    $data['company_name'] = $data['company'];
                }

                $user = User::create($data);
                $user = User::latest()->first();
                $data['user_id'] = $user->id;
                $message = 'Employee created successfully and added to user list';
            }

            // Validation in employee table
            $this->validate($request, [
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
                $imageName = date("Ymdhis");

                if (!config('database.connections.saleprosaas_landlord')) {
                    $imageName = $imageName . '.' . $ext;
                    $image->move(public_path('images/sale_agent'), $imageName);
                } else {
                    $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                    $image->move(public_path('images/sale_agent'), $imageName);
                }

                $data['image'] = $imageName;
            }

            $data['name'] = $data['name'];
            $data['is_active'] = true;
            $data['is_sale_agent'] = 1;
            $store = Employee::create($data);

            return redirect('sale-agents')->with('message', $message);

        } catch (\Illuminate\Validation\ValidationException $e) {
            dd($e);
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();

        } catch (\Exception $e) {
            // dd($e);
            Log::error('Sale Agent Store Error: '.$e->getMessage());
            return redirect()->back()
                ->with('error', 'Something went wrong: ' . $e->getMessage())
                ->withInput();
        }
    }


    public function update(Request $request, $id)
    {
        $lims_employee_data = Employee::find($request['employee_id']);
        if($lims_employee_data->user_id){
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
        //validation in employee table
        $this->validate($request, [
            'email' => [
                'email',
                'max:255',
                    Rule::unique('employees')->ignore($lims_employee_data->id)->where(function ($query) {
                    return $query->where('is_active', true);
                }),
            ],
            'image' => 'image|mimes:jpg,jpeg,png,gif|max:100000',
        ]);

        $data = $request->except('image');
        $image = $request->image;
        if ($image) {
            $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
            $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
            $imageName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $imageName = $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            }
            else {
                $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                $image->move(public_path('images/employee'), $imageName);
            }
            $data['image'] = $imageName;
        }
        $lims_employee_data->is_sale_agent = 1;
        $lims_employee_data->update($data);
        return redirect('sale-agents')->with('message', __('db.Employee updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $employee_id = $request['employeeIdArray'];
        foreach ($employee_id as $id) {
            $lims_employee_data = Employee::find($id);
            if($lims_employee_data->user_id){
                $lims_user_data = User::find($lims_employee_data->user_id);
                $lims_user_data->is_deleted = true;
                $lims_user_data->save();
            }
            $lims_employee_data->is_active = false;
            $lims_employee_data->save();

            $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);
        }

        return 'Employee deleted successfully!';
    }


    public function destroy($id)
    {
        $lims_employee_data = Employee::find($id);
        if($lims_employee_data->user_id){
            $lims_user_data = User::find($lims_employee_data->user_id);
            $lims_user_data->is_deleted = true;
            $lims_user_data->save();
        }

        $this->fileDelete(public_path('images/employee/'), $lims_employee_data->image);

        // if($lims_employee_data->image && !config('database.connections.saleprosaas_landlord')) {
        //     unlink('images/employee/'.$lims_employee_data->image);
        // }
        // elseif($lims_employee_data->image) {
        //     unlink('images/employee/'.$lims_employee_data->image);
        // }

        $lims_employee_data->is_active = false;
        $lims_employee_data->save();
        return redirect('sale-agents')->with('not_permitted', __('db.Employee deleted successfully'));
    }
}
