<?php

namespace App\Http\Controllers;

use Hash;
use Mail;
use Keygen;
use App\Models\User;
use App\Models\Roles;
use App\Models\Biller;
use App\Models\Account;
use App\Models\Customer;
use App\Mail\UserDetails;
use App\Models\Warehouse;
use App\Models\MailSetting;
use Illuminate\Http\Request;
use App\Models\CustomerGroup;
use App\Models\Role as AppRole;
use App\Models\GeneralSetting;
use App\Support\Permissions;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    use \App\Traits\MailInfo;
    use \App\Traits\SpaResponse;

    protected function formatProfileUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->username,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'company_name' => $user->company_name,
        ];
    }

    protected function canAccessProfile(int $id): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ((int) $user->id === (int) $id) {
            return true;
        }

        if (Permissions::bypassed() || $user->role_id <= 2) {
            return true;
        }

        $role = AppRole::find($user->role_id);

        return $role && (
            $role->hasPermissionTo('user-profile.view')
            || $role->hasPermissionTo('user-profile.edit')
            || $role->hasPermissionTo('user-profile-view')
            || $role->hasPermissionTo('user-profile-edit')
        );
    }

    protected function canUpdateProfile(int $id): bool
    {
        return $this->canAccessProfile($id);
    }

    protected function denyProfileAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    protected function userCanAccessUsers(string $action = 'index'): bool
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

        $role = AppRole::find($user->role_id);
        if (!$role) {
            return false;
        }

        $permissionMap = [
            'index' => 'users-index',
            'add' => 'users-add',
            'edit' => 'users-edit',
            'delete' => 'users-delete',
        ];

        return $role->hasPermissionTo($permissionMap[$action] ?? 'users-index');
    }

    protected function denyUserAccess(Request $request)
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

    protected function spaSuccess(Request $request, string $message, array $extra = [], int $status = 200)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(['message' => strip_tags($message)], $extra), $status);
        }

        return null;
    }

    protected function formatUserForSpa(User $user): array
    {
        $role = Role::find($user->role_id);

        return [
            'id' => $user->id,
            'name' => $user->username,
            'username' => $user->username,
            'email' => $user->email,
            'company_name' => $user->company_name,
            'phone' => $user->phone,
            'role_id' => $user->role_id,
            'role' => $role ? ($role->display_name ?? $role->name) : '',
            'biller_id' => $user->biller_id,
            'warehouse_id' => $user->warehouse_id,
            'account_id' => $user->account_id,
            'is_active' => (bool) $user->is_active,
            'service_staff' => (bool) $user->service_staff,
            'has_access_pin' => !empty($user->access_pin),
        ];
    }

    protected function userFormMetadata(): array
    {
        $generalSetting = GeneralSetting::latest()->first();
        $modules = $generalSetting && $generalSetting->modules
            ? explode(',', $generalSetting->modules)
            : [];

        return [
            'lims_role_list' => Roles::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_biller_list' => Biller::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_warehouse_list' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'lims_account_list' => Account::select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'lims_customer_group_list' => CustomerGroup::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'number_of_user_account' => User::where('is_active', true)->count(),
            'user_verified' => filter_var(env('USER_VERIFIED', false), FILTER_VALIDATE_BOOLEAN),
            'restaurant_enabled' => in_array('restaurant', $modules, true),
        ];
    }

    protected function userAttributesFromRequest(array $data): array
    {
        $attrs = collect($data)->only((new User)->getFillable())->all();
        $username = trim($data['name'] ?? $data['username'] ?? '');
        if ($username !== '') {
            $attrs['username'] = $username;
        }

        return $attrs;
    }

    protected function usernameUniqueRule(?int $ignoreId = null): array
    {
        $rule = Rule::unique('users', 'username')->where(function ($query) {
            return $query->where('is_deleted', false);
        });

        if ($ignoreId !== null) {
            $rule = $rule->ignore($ignoreId, 'id');
        }

        return ['required', 'max:255', $rule];
    }

    protected function emailUniqueRule(?int $ignoreId = null): array
    {
        $rule = Rule::unique('users', 'email')->where(function ($query) {
            return $query->where('is_deleted', false);
        });

        if ($ignoreId !== null) {
            $rule = $rule->ignore($ignoreId, 'id');
        }

        return ['required', 'email', 'max:255', $rule];
    }

    /** @return list<string|Rule> */
    protected function emailRulesForUpdate(User $user, Request $request): array
    {
        $rules = ['required', 'email', 'max:255'];
        $incoming = strtolower(trim((string) $request->input('email', '')));
        $current = strtolower(trim((string) ($user->email ?? '')));

        if ($incoming !== $current) {
            $rules[] = Rule::unique('users', 'email')
                ->ignore($user->id, 'id')
                ->where(function ($query) {
                    return $query->where('is_deleted', false);
                });
        }

        return $rules;
    }

    /** @return list<string|Rule> */
    protected function usernameRulesForUpdate(User $user, Request $request): array
    {
        $rules = ['required', 'max:255'];
        $incoming = trim((string) $request->input('name', $request->input('username', '')));
        $current = trim((string) ($user->username ?? ''));

        if ($incoming !== $current) {
            $rules[] = Rule::unique('users', 'username')
                ->ignore($user->id, 'id')
                ->where(function ($query) {
                    return $query->where('is_deleted', false);
                });
        }

        return $rules;
    }

    protected function customerAttributesFromUserData(array $data): array
    {
        return collect($data)->only((new Customer)->getFillable())->all();
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessUsers('index')) {
            return $this->denyUserAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            $users = User::where('is_deleted', false)
                ->orderBy('username')
                ->get()
                ->map(fn (User $user) => $this->formatUserForSpa($user));

            return $this->spaJson($request, array_merge(
                ['users' => $users],
                $this->userFormMetadata()
            ));
        }

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

    public function create(Request $request)
    {
        if (!$this->userCanAccessUsers('add')) {
            return $this->denyUserAccess($request);
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $this->userFormMetadata());
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('users-add')){
            $lims_role_list = Roles::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_customer_group_list = CustomerGroup::where('is_active', true)->get();
            $numberOfUserAccount = User::where('is_active', true)->count();
            $lims_account_list = Account::select('id', 'name')->where('is_active', true)->get();
            return view('backend.user.create', compact('lims_role_list', 'lims_biller_list', 'lims_warehouse_list', 'lims_account_list', 'lims_customer_group_list', 'numberOfUserAccount'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function generatePassword(Request $request)
    {
        $password = Keygen::numeric(6)->generate();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['password' => $password]);
        }

        return $password;
    }

    public function generateAccessPin(Request $request)
    {
        $pin = Keygen::numeric(6)->generate();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['access_pin' => $pin]);
        }

        return $pin;
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessUsers('add')) {
            return $this->denyUserAccess($request);
        }

        $this->validate($request, [
            'name' => $this->usernameUniqueRule(),
            'email' => $this->emailUniqueRule(),
            'phone_number' => 'required|max:255',
            'password' => 'required|min:6',
            'access_pin' => 'nullable|digits_between:4,8',
            'role_id' => 'required|exists:roles,id',
        ]);

        if ((int) $request->input('role_id') === 5) {
            $this->validate($request, [
                'phone_number' => [
                    'required',
                    'max:255',
                    Rule::unique('customers')->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'customer_name' => 'required|max:255',
                'customer_group_id' => 'required|exists:customer_groups,id',
                'address' => 'required|max:255',
                'city' => 'required|max:255',
            ]);
        } elseif ((int) $request->input('role_id') > 2) {
            $this->validate($request, [
                'biller_id' => 'required|exists:billers,id',
                'warehouse_id' => 'required|exists:warehouses,id',
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

        $data['is_active'] = $this->requestFlagEnabled($request, 'is_active');
        $data['service_staff'] = $this->requestFlagEnabled($request, 'service_staff');
        $data['is_deleted'] = false;
        $data['password'] = bcrypt($data['password']);
        if (!empty($data['access_pin'])) {
            $data['access_pin'] = bcrypt((string) $data['access_pin']);
        }
        $data['phone'] = $data['phone_number'];
        $user_data = User::create($this->userAttributesFromRequest($data));

        if ((int) $data['role_id'] === 5) {
            $customerData = $data;
            $customerData['user_id'] = $user_data->id;
            $customerData['name'] = $data['customer_name'];
            $customerData['phone_number'] = $data['phone'];
            $customerData['is_active'] = true;
            Customer::create($this->customerAttributesFromUserData($customerData));
        }

        cache()->forget('user_role');

        if ($response = $this->spaSuccess($request, __($message))) {
            return $response;
        }

        return redirect('user')->with('message1', $message);
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccessUsers('edit')) {
            return $this->denyUserAccess($request);
        }

        $lims_user_data = User::find($id);
        if (!$lims_user_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.User not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.User not found'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, array_merge(
                ['user' => $this->formatUserForSpa($lims_user_data)],
                $this->userFormMetadata()
            ));
        }

        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('users-edit')){
            $lims_role_list = Roles::where('is_active', true)->get();
            $lims_biller_list = Biller::where('is_active', true)->get();
            $lims_warehouse_list = Warehouse::where('is_active', true)->get();
            $lims_account_list = Account::select('id', 'name')->where('is_active', true)->get();
            return view('backend.user.edit', compact('lims_user_data', 'lims_role_list', 'lims_biller_list', 'lims_warehouse_list', 'lims_account_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccessUsers('edit')) {
            return $this->denyUserAccess($request);
        }

        if(!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $lims_user_data = User::findOrFail($id);

        $this->validate($request, [
            'name' => $this->usernameRulesForUpdate($lims_user_data, $request),
            'email' => $this->emailRulesForUpdate($lims_user_data, $request),
            'phone' => 'required|max:255',
            'role_id' => 'required|exists:roles,id',
            'access_pin' => 'nullable|digits_between:4,8',
        ]);

        if ((int) $request->input('role_id') > 2 && (int) $request->input('role_id') !== 5) {
            $this->validate($request, [
                'biller_id' => 'required|exists:billers,id',
                'warehouse_id' => 'required|exists:warehouses,id',
            ]);
        }

        $input = $request->except('password', 'access_pin');
        $input['is_active'] = $this->requestFlagEnabled($request, 'is_active');
        $input['service_staff'] = $this->requestFlagEnabled($request, 'service_staff');
        if(!empty($request['password'])) {
            $input['password'] = bcrypt($request['password']);
        }
        if ($request->filled('access_pin')) {
            $input['access_pin'] = bcrypt((string) $request->input('access_pin'));
        }
        if ($request->filled('phone')) {
            $input['phone'] = $request->input('phone');
        }

        $lims_user_data->update($this->userAttributesFromRequest($input));

        cache()->forget('user_role');

        if ($response = $this->spaSuccess($request, __('db.Data updated successfullly'))) {
            return $response;
        }

        return redirect('user')->with('message2', __('db.Data updated successfullly'));
    }

    public function toggleStatus(Request $request)
    {
        if (!$this->userCanAccessUsers('edit')) {
            return $this->denyUserAccess($request);
        }

        if(!env('USER_VERIFIED')) {
            return response()->json([
                'success' => false,
                'message' => __('db.This feature is disable for demo!'),
            ], 403);
        }
        
        $user = User::find($request->id);

        if ($user) {
            $user->is_active = in_array($request->input('is_active'), [1, '1', true, 'true'], true);
            $user->save();

            return response()->json(['success' => true, 'message' => 'User status updated successfully.']);
        }

        return response()->json(['success' => false, 'message' => 'User not found.'], 404);
    } 

    public function superadminProfile($id)
    {
        $lims_user_data = User::find($id);
        return view('landlord.profile', compact('lims_user_data'));
    }

    public function profile(Request $request, $id)
    {
        if (!$this->canAccessProfile((int) $id)) {
            return $this->denyProfileAccess($request);
        }

        $lims_user_data = User::find($id);
        if (!$lims_user_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.User not found'),
                ], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.User not found'));
        }

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatProfileUser($lims_user_data),
            ]);
        }

        return view('backend.user.profile', compact('lims_user_data'));
    }

    public function profileUpdate(Request $request, $id)
    {
        if (!$this->canUpdateProfile((int) $id)) {
            return $this->denyProfileAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $lims_user_data = User::findOrFail($id);

        $this->validate($request, [
            'name' => $this->usernameRulesForUpdate($lims_user_data, $request),
            'email' => $this->emailRulesForUpdate($lims_user_data, $request),
            'phone' => 'required|max:255',
            'company_name' => 'nullable|max:255',
        ]);

        $lims_user_data->username = $request->input('name', $request->input('username'));
        $lims_user_data->email = $request->email;
        $lims_user_data->phone = $request->phone;
        $lims_user_data->company_name = $request->company_name;
        $lims_user_data->save();

        cache()->forget('user_role');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfullly'),
                'data' => $this->formatProfileUser($lims_user_data->fresh()),
            ]);
        }

        return redirect()->back()->with('message3', __('db.Data updated successfullly'));
    }

    public function changePassword(Request $request, $id)
    {
        if (!$this->canUpdateProfile((int) $id)) {
            return $this->denyProfileAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $this->validate($request, [
            'current_pass' => 'required',
            'new_pass' => 'required|min:6',
            'confirm_pass' => 'required|same:new_pass',
        ]);

        $lims_user_data = User::findOrFail($id);

        if ($request->new_pass != $request->confirm_pass) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Please Confirm your new password'),
                ], 422);
            }

            return redirect('user/profile/' . $id)->with('message2', __('db.Please Confirm your new password'));
        }

        if (!Hash::check($request->current_pass, $lims_user_data->password)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Current Password does not match'),
                ], 422);
            }

            return redirect('user/profile/' . $id)->with('message1', __('db.Current Password does not match'));
        }

        $lims_user_data->password = bcrypt($request->new_pass);
        $lims_user_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Password changed successfully'),
                'logout' => true,
            ]);
        }

        auth()->logout();

        return redirect('/');
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccessUsers('delete')) {
            return $this->denyUserAccess($request);
        }

        if(!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return response('This feature is disable for demo!', 403);
        }

        $user_id = $request->input('userIdArray', []);
        
        foreach ($user_id as $id) {
            $lims_user_data = User::find($id);
            if (!$lims_user_data) {
                continue;
            }
            $lims_user_data->is_deleted = true;
            $lims_user_data->is_active = false;
            $lims_user_data->save();
        }

        cache()->forget('user_role');

        if ($response = $this->spaSuccess($request, __('db.User deleted successfully!'))) {
            return $response;
        }

        return 'User deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccessUsers('delete')) {
            return $this->denyUserAccess($request);
        }

        if(!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $lims_user_data = User::find($id);
        if (!$lims_user_data) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.User not found')], 404);
            }

            return redirect()->back()->with('not_permitted', __('db.User not found'));
        }

        $lims_user_data->is_deleted = true;
        $lims_user_data->is_active = false;
        $lims_user_data->save();
        cache()->forget('user_role');

        if ((int) Auth::id() === (int) $id) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Data deleted successfullly'),
                    'logout' => true,
                ]);
            }

            auth()->logout();

            return redirect('/login');
        }

        if ($response = $this->spaSuccess($request, __('db.Data deleted successfullly'))) {
            return $response;
        }

        return redirect('user')->with('message3', __('db.Data deleted successfullly'));
    }

    public function notificationUsers()
    {
        $notification_users = DB::table('users')->where([
            ['is_active', true],
            ['id', '!=', Auth::user()->id],
            ['role_id', '!=', '5']
        ])->get();

        $html = '';
        foreach($notification_users as $user){
            $html .='<option value="'.$user->id.'">'.$user->username . ' (' . $user->email. ')'.'</option>';
        }

        return response()->json($html);
    }

    public function allUsers()
    {
        $lims_user_list = DB::table('users')->where('is_active', true)->get();

        $html = '';
        foreach($lims_user_list as $user){
            $html .='<option value="'.$user->id.'">'.$user->username . ' (' . $user->phone. ')'.'</option>';
        }

        return response()->json($html);
    }
}
