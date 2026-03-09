<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\TaxResource;
use App\Http\Requests\TaxRequest;
use App\Models\Tax;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Auth;
class TaxController extends Controller
{
    use \App\Traits\CacheForget;
    
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('tax')) {
            $lims_tax_all = Tax::where('is_active', true)->get();
            return response()->json(
                TaxResource::collection($lims_tax_all)
            );
        }   
    }
    
    public function store(TaxRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = true;
        
        $tax = Tax::create($data);
        
        $this->cacheForget('tax_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Tax created successfully.',
            'data' => new TaxResource($tax),
        ], 201);
    }
    
    public function update(TaxRequest $request, Tax $tax)
    {
        $data = $request->validated();

        $tax->update($data);
        
        $this->cacheForget('tax_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Tax updated successfully.',
            'data' => new TaxResource($tax),
        ], 200);
    }
    
    public function destroy(Tax $tax)
    {
        $tax->is_active = false;
        $tax->save();
        $this->cacheForget('tax_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Tax has been deleted successfully.'
        ], 200);
    }
}
