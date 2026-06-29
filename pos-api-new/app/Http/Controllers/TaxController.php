<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Tax;
use App\Support\Permissions;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Auth;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxController extends Controller
{
    use CacheForget, SpaResponse;

    protected function userCanAccess(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('tax');
    }

    protected function formatTax(Tax $tax): array
    {
        return [
            'id' => $tax->id,
            'name' => $tax->name,
            'rate' => $tax->rate,
        ];
    }

    protected function denyAccess(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Sorry! You are not allowed to access this module'),
            ], 403);
        }

        return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $lims_tax_all = Tax::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_tax_all->map(fn ($tax) => $this->formatTax($tax)),
            ]);
        }

        return view('backend.tax.create', compact('lims_tax_all'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('taxes')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'rate' => 'required|numeric|min:0|max:100',
        ]);

        $input = $request->only(['name', 'rate']);
        $input['is_active'] = true;
        $tax = Tax::create($input);
        $this->cacheForget('tax_list');

        if ($request->input('ajax') || $this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatTax($tax),
            ], 201);
        }

        return redirect('tax')->with('message', __('db.Data inserted successfully'));
    }

    public function limsTaxSearch(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $lims_tax_name = $request->input('lims_taxNameSearch', $_GET['lims_taxNameSearch'] ?? '');
        $lims_tax_all = Tax::where('name', $lims_tax_name)->paginate(5);
        $lims_tax_list = Tax::all();

        return view('backend.tax.create', compact('lims_tax_all', 'lims_tax_list'));
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $lims_tax_data = Tax::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatTax($lims_tax_data),
            ]);
        }

        return $lims_tax_data;
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $taxId = (int) ($request->input('tax_id') ?: $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('taxes')->ignore($taxId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'rate' => 'required|numeric|min:0|max:100',
        ]);

        $lims_tax_data = Tax::findOrFail($taxId);
        $lims_tax_data->update($request->only(['name', 'rate']));
        $this->cacheForget('tax_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatTax($lims_tax_data->fresh()),
            ]);
        }

        return redirect('tax')->with('message', __('db.Data updated successfully'));
    }

    public function importTax(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $upload = $request->file('file');
        if (!$upload) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Please upload a CSV file'),
                ], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }

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
            $escapedItem = preg_replace('/[^a-z]/', '', $lheader);
            array_push($escapedHeader, $escapedItem);
        }

        while ($columns = fgetcsv($file)) {
            if ($columns[0] == '') {
                continue;
            }
            foreach ($columns as $key => $value) {
                $value = preg_replace('/\D/', '', $value);
            }
            $data = array_combine($escapedHeader, $columns);

            $tax = Tax::firstOrNew(['name' => $data['name'], 'is_active' => true]);
            $tax->name = $data['name'];
            $tax->rate = $data['rate'];
            $tax->is_active = true;
            $tax->save();
        }

        fclose($file);
        $this->cacheForget('tax_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Tax imported successfully'),
            ]);
        }

        return redirect('tax')->with('message', __('db.Tax imported successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        if (!env('USER_VERIFIED')) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.This feature is disable for demo!'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.This feature is disable for demo!'));
        }

        $tax_id = $request->input('taxIdArray', []);
        foreach ($tax_id as $id) {
            $lims_tax_data = Tax::find($id);
            if ($lims_tax_data) {
                $lims_tax_data->is_active = false;
                $lims_tax_data->save();
            }
        }

        $this->cacheForget('tax_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Tax deleted successfully'),
            ]);
        }

        return 'Tax deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return $this->denyAccess($request);
        }

        $lims_tax_data = Tax::findOrFail($id);
        $lims_tax_data->is_active = false;
        $lims_tax_data->save();
        $this->cacheForget('tax_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect('tax')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
