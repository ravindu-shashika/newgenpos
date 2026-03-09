<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
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
            return redirect()->back()->with('not_permitted', 'Sorry! You are not allowed to access this module');
    }
    
    public function generatePassword()
    {
        $id = Keygen::numeric(6)->generate();
        return $id;
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->all();
        $message = 'User created successfully';
        $mail_setting = MailSetting::latest()->first();
        if($mail_setting) {
            $this->setMailInfo($mail_setting);
            try {
                Mail::to($data['email'])->send(new UserDetails($data));
            }
            catch(\Exception $e){
                $message = 'User created successfully. Please setup your mail from mail setting to send mail.';
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
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 201);
    }

    public function update(StoreUserRequest $request, $id)
    {

        $input = $request->except('password');
        if(!isset($input['is_active']))
            $input['is_active'] = false;
        if(!empty($request['password']))
            $input['password'] = bcrypt($request['password']);
        $lims_user_data = User::find($id);
        $lims_user_data->update($input);

        cache()->forget('user_role');
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => $lims_user_data,
        ], 200);
    }
    
    public function destroy($ID)
    {
        $lims_user_data = User::find($id);
        $lims_user_data->is_deleted = true;
        $lims_user_data->is_active = false;
        $lims_user_data->save();
        if(Auth::id() == $id){
            auth()->logout();
            return redirect('/login');
        }
        else
            return response()->json([
                'success' => true,
                'message' => 'Data has been deleted successfully.'
            ], 200);
    }
    
    public function profileUpdate(Request $request, $id)
    {
        $input = $request->all();
        $lims_user_data = User::find($id);
        $lims_user_data->update($input);
        return response()->json([
            'success' => true,
            'message' => 'Data updated successfully.',
            'data' => $lims_user_data,
        ], 200);
    }

    public function changePassword(Request $request, $id)
    {
        if(!env('USER_VERIFIED'))
            return redirect()->back()->with('not_permitted', 'This feature is disable for demo!');

        $input = $request->all();
        $lims_user_data = User::find($id);
        if($input['new_pass'] != $input['confirm_pass'])
            // return redirect("user/" .  "profile/" . $id )->with('message2', "Please Confirm your new password");
        return response()->json([
            'success' => false,
            'message' => 'Please Confirm your new password'
        ], 200);
        if (Hash::check($input['current_pass'], $lims_user_data->password)) {
            $lims_user_data->password = bcrypt($input['new_pass']);
            $lims_user_data->save();
        }
        else {
            // return redirect("user/" .  "profile/" . $id )->with('message1', "Current Password doesn't match");
            return response()->json([
                'success' => false,
                'message' => "Current Password doesn't match"
            ], 200);
        }
        auth()->logout();
        return response()->json([
            'success' => false,
            'message' => "Password Changed Successfully"
        ], 200);
    }
}
