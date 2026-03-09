<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationResource;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\Quotation;
use App\Models\Delivery;
use App\Models\PosSetting;
use App\Models\ProductQuotation;
use App\Models\Product_Warehouse;
use App\Models\ProductVariant;
use App\Models\ProductBatch;
use App\Models\Variant;
use DB;
use NumberToWords\NumberToWords;
use Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\QuotationDetails;
use Mail;
use Illuminate\Support\Facades\Validator;
use App\Models\MailSetting;
use App\Traits\MailInfo;
use App\Traits\StaffAccess;
use App\Traits\TenantInfo;

class QuotationController extends Controller
{
    use TenantInfo, MailInfo, StaffAccess;
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        
        if($role->hasPermissionTo('quotes-index')){
            if($request->input('warehouse_id'))
                $warehouse_id = $request->input('warehouse_id');
            else
                $warehouse_id = 0;

            if($request->input('starting_date')) {
                $starting_date = $request->input('starting_date');
                $ending_date = $request->input('ending_date');
            }
            else {
                $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
                $ending_date = date("Y-m-d");
            }

            $permissions = $role->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';

            if(Auth::user()->role_id > 2 && config('staff_access') == 'own')
                $quotations = Quotation::with('biller', 'customer', 'supplier', 'user', 'products')
                            ->where('user_id', Auth::id())
                            ->whereDate('created_at', '>=' ,$starting_date)
                            ->whereDate('created_at', '<=' ,$ending_date)
                            ->orderBy('created_at', 'desc')
                            ->get();
            elseif(Auth::user()->role_id > 2 && config('staff_access') == 'warehouse')
                $quotations = Quotation::with('biller', 'customer', 'supplier', 'user', 'products')
                            ->where('warehouse_id', Auth::user()->warehouse_id)
                            ->whereDate('created_at', '>=' ,$starting_date)
                            ->whereDate('created_at', '<=' ,$ending_date)
                            ->orderBy('created_at', 'desc')
                            ->get();
            elseif($warehouse_id != 0)
                $quotations = Quotation::with('biller', 'customer', 'supplier', 'user', 'products')
                            ->where('warehouse_id', $warehouse_id)
                            ->whereDate('created_at', '>=' ,$starting_date)
                            ->whereDate('created_at', '<=' ,$ending_date)
                            ->orderBy('created_at', 'desc')
                            ->get();
            else
                $quotations = Quotation::with('biller', 'customer', 'supplier', 'user', 'products')
                            ->whereDate('created_at', '>=' ,$starting_date)
                            ->whereDate('created_at', '<=' ,$ending_date)
                            ->orderBy('created_at', 'desc')
                            ->get();
            
            return response()->json(
                QuotationResource::collection($quotations)
            );
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
}
