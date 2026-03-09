<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\Unit;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;
use App\Services\getDataService;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        
        if ($role->hasPermissionTo('unit')) {
            $units = Unit::where('is_active', true)->with('baseUnit')->get();
    
            return response()->json($units, 200);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to units.',
            ], 403);
        }
    }

    public function store(Request $request)
    {
        $validator = \Validator::make($request->all(), [
            'unit_code' => [
                'required',
                'max:255',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'unit_name' => [
                'required',
                'max:255',
                Rule::unique('units')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'base_unit' => 'nullable|integer|exists:units,id',
            'operator' => 'nullable|string|in:*,/,+,−',
            'operation_value' => 'nullable|numeric',
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }
    
        $input = $request->all();
        $input['is_active'] = true;
    
        if (empty($input['base_unit'])) {
            $input['operator'] = '*';
            $input['operation_value'] = 1;
        }
    
        $unit = Unit::create($input);
    
        return response()->json([
            'success' => true,
            'message' => 'Unit created successfully.',
            'data' => $unit,
        ], 201);
    }
    
    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'unit_code' => [
                'max:255',
                Rule::unique('units')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'unit_name' => [
                'max:255',
                Rule::unique('units')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);
    
        $input = $request->all();
    
        if (!isset($input['base_unit']) || !$input['base_unit']) {
            $input['operator'] = '*';
            $input['operation_value'] = 1;
        }
    
        $unit = Unit::find($id);
    
        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit not found.',
            ], 404);
        }
    
        $unit->update($input);
    
        return response()->json([
            'success' => true,
            'message' => 'Unit updated successfully.',
            'data' => $unit,
        ], 200);
    }
    
    public function destroy($id)
    {
        // Find the unit by ID or throw a 404 error if not found
        $lims_unit_data = Unit::findOrFail($id);
        
        // Mark the unit as inactive
        $lims_unit_data->is_active = false;
        $lims_unit_data->save();
    
        // Return a JSON response
        return response()->json([
            'success' => true,
            'message' => 'Unit has been deleted successfully.'
        ], 200);
    }


    public function getAllUnit(getDataService $service)
    {
        return $service->getAllUnit();
    }
}