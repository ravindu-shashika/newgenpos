<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerGroupRequest;
use App\Http\Resources\CustomerGroupResource;
use Illuminate\Http\Request;
use App\Models\CustomerGroup;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use DB;
use App\Traits\CacheForget;

class CustomerGroupController extends Controller
{
    use CacheForget;
    
    public function index()
    {
        $customerGroup = CustomerGroup::where('is_active', true)->get();
        
        return response()->json(
            CustomerGroupResource::collection($customerGroup)
        );
    }
    
    public function store(StoreCustomerGroupRequest $request)
    {
        $lims_customer_group_data = $request->validated();
        $lims_customer_group_data['is_active'] = true;
        $customerGroup = CustomerGroup::create($lims_customer_group_data);
        $this->cacheForget('customer_group_list');
        return response()->json([
            'success' => true,
            'message' => 'Customer Group created successfully.',
            'data' => new CustomerGroupResource($customerGroup),
        ], 201);
    }
    
    public function update(StoreCustomerGroupRequest $request, CustomerGroup $customergroup)
    {
        $input = $request->validated();

        $customergroup->update($input);
        $this->cacheForget('customer_group_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Customer Group updated successfully.',
            'data' => new CustomerGroupResource($customergroup) ,
        ], 200);
    }
    
    public function destroy(CustomerGroup $customergroup){
        $customergroup->is_active = false;
        $customergroup->save();
        
        $this->cacheForget('customer_group_list');
        
         return response()->json([
            'success' => true,
            'message' => 'Customer Group has been deleted successfully.'
        ], 200);
    }
}
