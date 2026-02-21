<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Roles;
use App\Models\Biller;
use App\Models\Warehouse;
use App\Models\CustomerGroup;
use App\Models\Customer;
use DB;
use Auth;
use Hash;
use Keygen;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\UserDetails;
use Mail;
use App\Models\MailSetting;

class UserController extends Controller
{
    use \App\Traits\MailInfo;

    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('users-index')){
            $permissions = Role::findByName($role->name)->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            $lims_user_list = User::where('is_deleted', false)->get();
            $numberOfUserAccount = User::where('is_active', true)->count();
            return view('backend.user.index', compact('lims_user_list', 'all_permission', 'numberOfUserAccount'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    /**
     * API: User list for React (name, email, company_name, phone, role, is_active).
     */
    public function userListApi(Request $request)
    {
        $users = User::where('is_deleted', false)->orderBy('created_at', 'desc')->get();
        $roles = DB::table('roles')->get()->keyBy('id');
        $data = [];
        foreach ($users as $user) {
            $role = $roles->get($user->role_id);
            $data[] = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_name' => $user->company_name ?? '—',
                'phone' => $user->phone ?? '—',
                'role_id' => $user->role_id,
                'role_name' => $role ? $role->name : '—',
                'is_active' => (bool) $user->is_active,
            ];
        }
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Form data for user add/edit (roles, billers, warehouses, customer_groups).
     */
    public function userFormDataApi(Request $request)
    {
        $roles = DB::table('roles')->orderBy('name')->get(['id', 'name']);
        $billers = Biller::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $customer_groups = CustomerGroup::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        return response()->json([
            'status' => 200,
            'roles' => $roles,
            'billers' => $billers,
            'warehouses' => $warehouses,
            'customer_groups' => $customer_groups,
        ]);
    }

    /**
     * API: Get one user for edit (React).
     */
    public function getUserApi($id)
    {
        $user = User::where('is_deleted', false)->find($id);
        if (!$user) {
            return response()->json(['status' => 404, 'message' => 'User not found'], 404);
        }
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'company_name' => $user->company_name ?? '',
            'role_id' => $user->role_id,
            'biller_id' => $user->biller_id ?? '',
            'warehouse_id' => $user->warehouse_id ?? '',
            'is_active' => (bool) $user->is_active,
        ];
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Store user (JSON) for React.
     */
    public function storeUserApi(Request $request)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->where(fn ($q) => $q->where('is_deleted', false)),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->where(fn ($q) => $q->where('is_deleted', false)),
            ],
            'password' => 'required|string|min:6',
            'phone_number' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id',
        ]);
        $data = $request->all();
        $data['phone'] = $data['phone_number'] ?? '';
        $data['is_active'] = isset($data['is_active']) ? (bool) $data['is_active'] : true;
        $data['is_deleted'] = false;
        $data['password'] = bcrypt($data['password']);
        unset($data['phone_number']);
        $user = User::create($data);
        if (isset($data['role_id']) && $data['role_id'] == 5) {
            $data['user_id'] = $user->id;
            $data['name'] = $data['customer_name'] ?? $user->name;
            $data['phone_number'] = $data['phone'];
            $data['is_active'] = true;
            $data['customer_group_id'] = $data['customer_group_id'] ?? 1;
            Customer::create($data);
        }
        return response()->json(['status' => 200, 'message' => __('db.User created successfully'), 'id' => $user->id]);
    }

    /**
     * API: Update user (JSON) for React.
     */
    public function updateUserApi(Request $request, $id)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $user = User::where('is_deleted', false)->find($id);
        if (!$user) {
            return response()->json(['status' => 404, 'message' => 'User not found'], 404);
        }
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->ignore($id)->where(fn ($q) => $q->where('is_deleted', false)),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($id)->where(fn ($q) => $q->where('is_deleted', false)),
            ],
            'phone' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id',
        ]);
        $input = $request->only(['name', 'email', 'phone', 'company_name', 'role_id', 'biller_id', 'warehouse_id', 'is_active']);
        $input['is_active'] = isset($input['is_active']) ? (bool) $input['is_active'] : false;
        if ($request->filled('password')) {
            $input['password'] = bcrypt($request->password);
        }
        $user->update($input);
        cache()->forget('user_role');
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfullly')]);
    }

    /**
     * API: Destroy user (soft delete) for React.
     */
    public function destroyUserApi($id)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 404, 'message' => 'User not found'], 404);
        }
        $user->is_deleted = true;
        $user->is_active = false;
        $user->save();
        if (Auth::id() == $id) {
            return response()->json(['status' => 200, 'message' => __('db.Data deleted successfullly'), 'logout' => true]);
        }
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfullly')]);
    }

    public function create()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('users-add')){
            $lims_role_list = Roles::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_customer_group_list = CustomerGroup::where('is_active', true)->get();
            $numberOfUserAccount = User::where('is_active', true)->count();
            return view('backend.user.create', compact('lims_role_list', 'lims_biller_list', 'lims_warehouse_list', 'lims_customer_group_list', 'numberOfUserAccount'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function generatePassword()
    {
        $id = Keygen::numeric(6)->generate();
        return $id;
    }

    public function store(Request $request)
    {
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

        if($request->role_id == 5) {
            $this->validate($request, [
                'phone_number' => [
                    'max:255',
                        Rule::unique('customers')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
            ]);
        }
        $data = $request->all();
        $message = 'User created successfully';
        $mail_setting = MailSetting::latest()->first();
        if($mail_setting) {
            $this->setMailInfo($mail_setting);
            try {
                Mail::to($data['email'])->send(new UserDetails($data));
            }
            catch(\Exception $e){
                $message = 'User created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }
        if(!isset($data['is_active']))
            $data['is_active'] = false;
        $data['is_deleted'] = false;
        $data['password'] = bcrypt($data['password']);
        $data['phone'] = $data['phone_number'];
        $user_data = User::create($data);
        if($data['role_id'] == 5) {
            $data['user_id'] = $user_data->id;
            $data['name'] = $data['customer_name'];
            $data['phone_number'] = $data['phone'];
            $data['is_active'] = true;
            Customer::create($data);
        }
        return redirect('user')->with('message1', $message);
    }

    public function edit($id)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('users-edit')){
            $lims_user_data = User::find($id);
            $lims_role_list = Roles::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            return view('backend.user.edit', compact('lims_user_data', 'lims_role_list', 'lims_biller_list', 'lims_warehouse_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function update(Request $request, $id)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        $this->validate($request, [
            'name' => [
                'max:255',
                Rule::unique('users')->ignore($id)->where(function ($query) {
                    return $query->where('is_deleted', false);
                }),
            ],
            'email' => [
                'email',
                'max:255',
                    Rule::unique('users')->ignore($id)->where(function ($query) {
                    return $query->where('is_deleted', false);
                }),
            ],
        ]);

        $input = $request->except('password');
        if(!isset($input['is_active']))
            $input['is_active'] = false;
        if(!empty($request['password']))
            $input['password'] = bcrypt($request['password']);
        $lims_user_data = User::find($id);
        $lims_user_data->update($input);

        cache()->forget('user_role');
        return redirect('user')->with('message2', __('db.Data updated successfullly'));
    }

    public function toggleStatus(Request $request)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        
        $user = User::find($request->id);

        if ($user) {
            $user->is_active = $request->is_active;
            $user->save();

            return response()->json(['success' => true, 'message' => 'User status updated successfully.']);
        }

        return response()->json(['success' => false, 'message' => 'User not found.']);
    } 

    public function superadminProfile($id)
    {
        $lims_user_data = User::find($id);
        return view('landlord.profile', compact('lims_user_data'));
    }

    public function profile($id)
    {
        $lims_user_data = User::find($id);
        return view('backend.user.profile', compact('lims_user_data'));
    }

    public function profileUpdate(Request $request, $id)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        $input = $request->all();
        $lims_user_data = User::find($id);
        $lims_user_data->update($input);
        return redirect()->back()->with('message3', __('db.Data updated successfullly'));
    }

    public function changePassword(Request $request, $id)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        $input = $request->all();
        $lims_user_data = User::find($id);
        if($input['new_pass'] != $input['confirm_pass'])
            return redirect("user/" .  "profile/" . $id )->with('message2', __("db.Please Confirm your new password"));

        if (Hash::check($input['current_pass'], $lims_user_data->password)) {
            $lims_user_data->password = bcrypt($input['new_pass']);
            $lims_user_data->save();
        }
        else {
            return redirect("user/" .  "profile/" . $id )->with('message1', __("db.Current Password does not match"));
        }
        auth()->logout();
        return redirect('/');
    }

    public function deleteBySelection(Request $request)
    {
        $user_id = $request['userIdArray'];
        
        foreach ($user_id as $id) {
            $lims_user_data = User::find($id);
            $lims_user_data->is_deleted = true;
            $lims_user_data->is_active = false;
            $lims_user_data->save();
        }
        return 'User deleted successfully!';
    }

    public function destroy($id)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));

        $lims_user_data = User::find($id);
        $lims_user_data->is_deleted = true;
        $lims_user_data->is_active = false;
        $lims_user_data->save();
        if(Auth::id() == $id){
            auth()->logout();
            return redirect('/login');
        }
        else
            return redirect('user')->with('message3', __('db.Data deleted successfullly'));
    }

    public function notificationUsers()
    {
        $notification_users = DB::table('users')->where([
            ['is_active', true],
            ['id', '!=', \Auth::user()->id],
            ['role_id', '!=', '5']
        ])->get();

        $html = '';
        foreach($notification_users as $user){
            $html .='<option value="'.$user->id.'">'.$user->name . ' (' . $user->email. ')'.'</option>';
        }

        return response()->json($html);
    }

    public function allUsers()
    {
        $lims_user_list = DB::table('users')->where('is_active', true)->get();

        $html = '';
        foreach($lims_user_list as $user){
            $html .='<option value="'.$user->id.'">'.$user->name . ' (' . $user->phone. ')'.'</option>';
        }

        return response()->json($html);
    }

    /**
     * API: Get current user profile (for React).
     */
    public function getProfileApi(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthenticated'], 401);
        }
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'company_name' => $user->company_name ?? '',
        ];
        return response()->json(['status' => 200, 'data' => $data]);
    }

    /**
     * API: Update current user profile (for React).
     */
    public function profileUpdateApi(Request $request)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthenticated'], 401);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
        ]);
        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone ?? $user->phone;
        $user->company_name = $request->company_name ?? $user->company_name;
        $user->save();
        return response()->json(['status' => 200, 'message' => __('db.Data updated successfullly'), 'data' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone ?? '', 'company_name' => $user->company_name ?? '']]);
    }

    /**
     * API: Change password for current user (for React). On success returns 200; client should re-login.
     */
    public function changePasswordApi(Request $request)
    {
        if (!env('USER_VERIFIED', true)) {
            return response()->json(['status' => 403, 'message' => __('db.This feature is disable for demo!')], 403);
        }
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthenticated'], 401);
        }
        $request->validate([
            'current_pass' => 'required|string',
            'new_pass' => 'required|string|min:6',
            'confirm_pass' => 'required|string|same:new_pass',
        ], [
            'confirm_pass.same' => __('db.Please Confirm your new password'),
        ]);
        if (!Hash::check($request->current_pass, $user->password)) {
            return response()->json(['status' => 400, 'message' => __('db.Current Password does not match')], 400);
        }
        $user->password = bcrypt($request->new_pass);
        $user->save();
        return response()->json(['status' => 200, 'message' => __('db.Password updated successfully. Please sign in again.')]);
    }
}
