<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Http\Resources\WarehouseResource;
use App\Http\Requests\StoreWarehouseRequest;
use App\Models\Warehouse;
use Auth;
use DB;
use App\Traits\CacheForget;

class WarehouseController extends Controller
{
    use CacheForget;
    
    public function index()
    {
        $warehouses = Warehouse::where('is_active', true)->get();
     
        return response()->json(
            WarehouseResource::collection($warehouses)
        );
    }
    
    public function store(StoreWarehouseRequest $request)
    {
        $validatedData = $request->validated();
        $validatedData['is_active'] = true;
        $warehouse = Warehouse::create($validatedData);
        $this->cacheForget('warehouse_list');
        return response()->json([
            'success' => true,
            'message' => 'Warehouse created successfully.',
            'data' => new WarehouseResource($warehouse),
        ], 201);
    }
    
    public function update(StoreWarehouseRequest $request, Warehouse $warehouse)
    {
        $validatedData = $request->validated();
        $warehouse->update($validatedData);
        $this->cacheForget('warehouse_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Warehouse updated successfully.',
            'data' => new WarehouseResource($warehouse),
        ], 200);
        
    }
    
    public function destroy(Warehouse $warehouse)
    {
        $warehouse->is_active = false;
        $warehouse->save();
        $this->cacheForget('warehouse_list');
        
        return response()->json([
            'success' => true,
            'message' => 'Warehouse has been deleted successfully.'
        ], 200);
    }
}
