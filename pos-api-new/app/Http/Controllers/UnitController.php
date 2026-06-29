<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Unit;
use Illuminate\Validation\Rule;
use Auth;
use App\Traits\SpaResponse;

class UnitController extends Controller
{
    use SpaResponse;

    protected function userCanAccessUnit(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        return $user->can('unit');
    }

    protected function prepareUnitInput(array $input): array
    {
        if (empty($input['base_unit'])) {
            $input['base_unit'] = null;
            $input['operator'] = '*';
            $input['operation_value'] = $input['operation_value'] ?? 1;
        }

        return $input;
    }

    protected function formatUnitForSpa(Unit $unit): array
    {
        $unit->loadMissing('baseUnit');

        return [
            'id' => $unit->id,
            'unit_code' => $unit->unit_code,
            'unit_name' => $unit->unit_name,
            'base_unit' => $unit->base_unit,
            'operator' => $unit->operator,
            'operation_value' => $unit->operation_value,
            'base_unit_name' => $unit->baseUnit?->unit_name,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessUnit()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_unit_list = Unit::where('is_active', true)
            ->orderBy('unit_name')
            ->get();

        if ($this->wantsSpaResponse($request)) {
            $data = $lims_unit_list->map(fn ($unit) => $this->formatUnitForSpa($unit));

            return $this->spaJson($request, ['data' => $data]);
        }

        return view('backend.unit.create', compact('lims_unit_list'));
    }

    public function listForSelect(Request $request)
    {
        $units = Unit::where('is_active', true)
            ->whereNull('base_unit')
            ->orderBy('unit_name')
            ->get(['id', 'unit_code', 'unit_name']);

        return $this->spaJson($request, ['data' => $units]);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
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
            'base_unit' => 'nullable|exists:units,id',
            'operator' => 'nullable|in:*,/',
            'operation_value' => 'nullable|numeric',
        ]);

        $input = $this->prepareUnitInput($request->only([
            'unit_code', 'unit_name', 'base_unit', 'operator', 'operation_value',
        ]));
        $input['is_active'] = true;

        $unit = Unit::create($input);

        if ($request->ajax() || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatUnitForSpa($unit),
            ], 201);
        }

        return redirect('unit');
    }

    public function limsUnitSearch()
    {
        $lims_unit_name = $_GET['lims_unitNameSearch'];
        $lims_unit_all = Unit::where('unit_name', $lims_unit_name)->paginate(5);
        $lims_unit_list = Unit::all();
        return view('backend.unit.create', compact('lims_unit_all', 'lims_unit_list'));
    }

    public function edit(Request $request, $id)
    {
        $lims_unit_data = Unit::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => $lims_unit_data]);
        }

        return $lims_unit_data;
    }

    public function update(Request $request, $id)
    {
        $unitId = $request->unit_id ?? $id;

        $this->validate($request, [
            'unit_code' => [
                'required',
                'max:255',
                Rule::unique('units')->ignore($unitId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'unit_name' => [
                'required',
                'max:255',
                Rule::unique('units')->ignore($unitId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'base_unit' => 'nullable|exists:units,id',
            'operator' => 'nullable|in:*,/',
            'operation_value' => 'nullable|numeric',
        ]);

        $input = $this->prepareUnitInput($request->only([
            'unit_code', 'unit_name', 'base_unit', 'operator', 'operation_value',
        ]));

        $lims_unit_data = Unit::findOrFail($unitId);
        $lims_unit_data->update($input);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatUnitForSpa($lims_unit_data->fresh()),
            ]);
        }

        return redirect('unit');
    }

    public function importUnit(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $upload = $request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if ($ext != 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Please upload a CSV file'),
                ], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }

        $filePath = $upload->getRealPath();
        $file = fopen($filePath, 'r');
        $header = fgetcsv($file);
        $escapedHeader = [];
        foreach ($header as $value) {
            $lheader = strtolower($value);
            $escapedHeader[] = preg_replace('/[^a-z]/', '', $lheader);
        }

        while ($columns = fgetcsv($file)) {
            if ($columns[0] == '') {
                continue;
            }
            $data = array_combine($escapedHeader, $columns);

            $unit = Unit::firstOrNew(['unit_code' => $data['code'] ?? $data['unitcode'] ?? '', 'is_active' => true]);
            $unit->unit_code = $data['code'] ?? $data['unitcode'] ?? $unit->unit_code;
            $unit->unit_name = $data['name'] ?? $data['unitname'] ?? $unit->unit_name;

            $baseUnitCode = $data['baseunit'] ?? null;
            if ($baseUnitCode === null || $baseUnitCode === '') {
                $unit->base_unit = null;
                $unit->operator = '*';
                $unit->operation_value = 1;
            } else {
                $base_unit = Unit::where('unit_code', $baseUnitCode)->first();
                $unit->base_unit = $base_unit?->id;
                $unit->operator = ($data['operator'] ?? null) ?: '*';
                $unit->operation_value = ($data['operationvalue'] ?? null) ?: 1;
            }

            $unit->is_active = true;
            $unit->save();
        }

        fclose($file);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Unit imported successfully'),
            ]);
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

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Unit deleted successfully!'),
            ]);
        }

        return 'Unit deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        $lims_unit_data = Unit::findOrFail($id);
        $lims_unit_data->is_active = false;
        $lims_unit_data->save();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Unit deleted successfully!'),
            ]);
        }

        return redirect('unit');
    }
}
