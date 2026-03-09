<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use  App\Http\Resources\BillerResource;
use Illuminate\Http\Request;
use App\Models\Biller;
use App\Models\MailSetting;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use App\Mail\BillerCreate;
use Mail;

class BillerController extends Controller
{
    use \App\Traits\CacheForget;
    use \App\Traits\TenantInfo;
    use \App\Traits\MailInfo;
    
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('billers-index')) {
            $permissions = $role->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';
            $lims_biller_all = biller::where('is_active', true)->get();
            
            return response()->json([
                BillerResource::collection($lims_biller_all)
            ]);
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
}
