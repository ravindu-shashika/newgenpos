<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Unit;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;

class UnitController extends Controller
{
    // API Methods for Vue Frontend
    public function getAllUnits()
    {
        try {
            $units = Unit::where('is_active', true)
                ->with('baseUnit')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $units,
                'message' => 'Units fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch units',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getBaseUnits()
    {
        try {
            // Get base units (units that don't have a parent base_unit)
            $baseUnits = Unit::where('is_active', true)
                ->whereNull('base_unit')
                ->orderBy('unit_name', 'asc')
                ->get(['id', 'unit_code', 'unit_name']);

            return response()->json([
                'status' => 200,
                'data' => $baseUnits,
                'message' => 'Base units fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch base units',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function saveUnit(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'unit_code' => [
                    'required',
                    'max:255',
                    Rule::unique('units')->ignore($request->id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'unit_name' => [
                    'required',
                    'max:255',
                    Rule::unique('units')->ignore($request->id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'base_unit' => 'nullable|exists:units,id',
                'operator' => 'nullable|in:*,/',
                'operation_value' => 'nullable|numeric|min:0',
                'is_active' => 'boolean'
            ]);

            // Check if it's an update or create
            if ($request->id) {
                // Update existing unit
                $unit = Unit::findOrFail($request->id);
                $unit->unit_code = $request->unit_code;
                $unit->unit_name = $request->unit_name;
                $unit->base_unit = $request->base_unit;
                $unit->operator = $request->operator ?? '*';
                $unit->operation_value = $request->operation_value ?? 1;
                $unit->is_active = $request->is_active ?? true;

                // If no base unit, set default operator and value
                if (!$request->base_unit) {
                    $unit->operator = '*';
                    $unit->operation_value = 1;
                }

                $unit->save();
                $message = 'Unit updated successfully';
            } else {
                // Create new unit
                $input = [
                    'unit_code' => $request->unit_code,
                    'unit_name' => $request->unit_name,
                    'base_unit' => $request->base_unit,
                    'operator' => $request->operator ?? '*',
                    'operation_value' => $request->operation_value ?? 1,
                    'is_active' => $request->is_active ?? true
                ];

                // If no base unit, set default operator and value
                if (!$request->base_unit) {
                    $input['operator'] = '*';
                    $input['operation_value'] = 1;
                }

                $unit = Unit::create($input);
                $message = 'Unit created successfully';
            }

            // Reload with relationship
            $unit->load('baseUnit');

            return response()->json([
                'status' => 200,
                'data' => $unit,
                'message' => $message
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 400,
                'message' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to save unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteUnit($id)
    {
        try {
            $unit = Unit::findOrFail($id);
            
            // Check if this unit is being used as a base unit
            $derivedUnits = Unit::where('base_unit', $id)->where('is_active', true)->count();
            if ($derivedUnits > 0) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot delete this unit. It is being used as a base unit for other units.'
                ], 400);
            }
            
            // Soft delete by setting is_active to false
            $unit->is_active = false;
            $unit->save();

            return response()->json([
                'status' => 200,
                'message' => 'Unit deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('unit')) {
            $lims_unit_list = Unit::where('is_active', true)->get();
            return view('backend.unit.create', compact('lims_unit_list'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'unit_code' => [
                'max:255',
                    Rule::unique('units')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'unit_name' => [
                'max:255',
                    Rule::unique('units')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ]

        ]);
        $input = $request->all();
        $input['is_active'] = true;
        if(!$input['base_unit']){
            $input['operator'] = '*';
            $input['operation_value'] = 1;
        }
        $unit = Unit::create($input);

        // Handle AJAX request
        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'unit' => $unit
            ]);
        }

        return redirect('unit');
    }

    public function limsUnitSearch()
    {
        $lims_unit_name = $_GET['lims_unitNameSearch'];
        $lims_unit_all = Unit::where('unit_name', $lims_unit_name)->paginate(5);
        $lims_unit_list = Unit::all();
        return view('backend.unit.create', compact('lims_unit_all','lims_unit_list'));
    }

    public function edit($id)
    {
        $lims_unit_data = Unit::findOrFail($id);
        return $lims_unit_data;
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'unit_code' => [
                'max:255',
                    Rule::unique('units')->ignore($request->unit_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'unit_name' => [
                'max:255',
                    Rule::unique('units')->ignore($request->unit_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ]
        ]);

        $input = $request->all();
        if(!$input['base_unit']){
            $input['operator'] = '*';
            $input['operation_value'] = 1;
        }
        $lims_unit_data = Unit::where('id',$input['unit_id'])->first();
        $lims_unit_data->update($input);
        return redirect('unit');
    }

    public function importUnit(Request $request)
    {
        //get file
        $filename =  $request->file->getClientOriginalName();
        $upload=$request->file('file');
        $filePath=$upload->getRealPath();
        //open and read
        $file=fopen($filePath, 'r');
        $header= fgetcsv($file);
        $escapedHeader=[];
        //validate
        foreach ($header as $key => $value) {
            $lheader=strtolower($value);
            $escapedItem=preg_replace('/[^a-z]/', '', $lheader);
            array_push($escapedHeader, $escapedItem);
        }
        //looping through othe columns
        $lims_unit_data = [];
        while($columns=fgetcsv($file))
        {
            if($columns[0]=="")
                continue;
            foreach ($columns as $key => $value) {
                $value=preg_replace('/\D/','',$value);
            }
            $data= array_combine($escapedHeader, $columns);

            $unit = Unit::firstOrNew(['unit_code' => $data['code'],'is_active' => true ]);
            $unit->unit_code = $data['code'];
            $unit->unit_name = $data['name'];
            if($data['baseunit']==null)
                $unit->base_unit = null;
            else{
                $base_unit = Unit::where('unit_code', $data['baseunit'])->first();
                $unit->base_unit = $base_unit->id;
            }
            if($data['operator'] == null)
                $unit->operator = '*';
            else
                $unit->operator = $data['operator'];
            if($data['operationvalue'] == null)
                $unit->operation_value = 1;
            else
                $unit->operation_value = $data['operationvalue'];
            $unit->save();
        }
        return redirect('unit')->with('message', __('db.Unit imported successfully'));

    }

    public function deleteBySelection(Request $request)
    {
        $unit_id = $request['unitIdArray'];
        foreach ($unit_id as $id) {
            $lims_unit_data = Unit::findOrFail($id);
            $lims_unit_data->is_active = false;
            $lims_unit_data->save();
        }
        return 'Unit deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_unit_data = Unit::findOrFail($id);
        $lims_unit_data->is_active = false;
        $lims_unit_data->save();
        return redirect('unit');
    }
}
