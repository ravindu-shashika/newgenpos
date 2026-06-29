<?php

namespace App\Http\Controllers;

use App\Models\CustomerGroup;
use App\Models\Role;
use App\Support\Permissions;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Auth;
use DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerGroupController extends Controller
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

        return $role && $role->hasPermissionTo('customer_group');
    }

    protected function formatCustomerGroup(CustomerGroup $group): array
    {
        return [
            'id' => $group->id,
            'name' => $group->name,
            'percentage' => $group->percentage,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_customer_group_all = CustomerGroup::where('is_active', true)->orderBy('name')->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_customer_group_all->map(fn ($group) => $this->formatCustomerGroup($group)),
            ]);
        }

        return view('backend.customer_group.create', compact('lims_customer_group_all'));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('customer_groups')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'percentage' => 'required|numeric',
        ]);

        $lims_customer_group_data = $request->only(['name', 'percentage']);
        $lims_customer_group_data['is_active'] = true;
        $group = CustomerGroup::create($lims_customer_group_data);
        $this->cacheForget('customer_group_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatCustomerGroup($group),
            ], 201);
        }

        return redirect('customer_group')->with('message', __('db.Data inserted successfully'));
    }

    public function edit(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_customer_group_data = CustomerGroup::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $this->formatCustomerGroup($lims_customer_group_data),
            ]);
        }

        return $lims_customer_group_data;
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $groupId = $request->input('customer_group_id', $id);

        $this->validate($request, [
            'name' => [
                'required',
                'max:255',
                Rule::unique('customer_groups')->ignore($groupId)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'percentage' => 'required|numeric',
        ]);

        $lims_customer_group_data = CustomerGroup::findOrFail($groupId);
        $lims_customer_group_data->update($request->only(['name', 'percentage']));
        $this->cacheForget('customer_group_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatCustomerGroup($lims_customer_group_data->fresh()),
            ]);
        }

        return redirect('customer_group')->with('message', __('db.Data updated successfully'));
    }

    public function importCustomerGroup(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
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
                $columns[$key] = preg_replace('/\D/', '', $value);
            }
            $data = array_combine($escapedHeader, $columns);

            $customer_group = CustomerGroup::firstOrNew(['name' => $data['name'], 'is_active' => true]);
            $customer_group->name = $data['name'];
            $customer_group->percentage = $data['percentage'];
            $customer_group->is_active = true;
            $customer_group->save();
        }

        fclose($file);
        $this->cacheForget('customer_group_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Customer Group imported successfully'),
            ]);
        }

        return redirect('customer_group')->with('message', __('db.Customer Group imported successfully'));
    }

    public function exportCustomerGroup(Request $request)
    {
        $lims_customer_group_data = $request['customer_groupArray'];
        $csvData = ['name, percentage'];
        foreach ($lims_customer_group_data as $customer_group) {
            if ($customer_group > 0) {
                $data = CustomerGroup::where('id', $customer_group)->first();
                $csvData[] = $data->name . ',' . $data->percentage;
            }
        }
        $filename = 'customer_group- ' . date('d-m-Y') . '.csv';
        $file_path = public_path() . '/downloads/' . $filename;
        $file_url = url('/') . '/downloads/' . $filename;
        $file = fopen($file_path, 'w+');
        foreach ($csvData as $exp_data) {
            fputcsv($file, explode(',', $exp_data));
        }
        fclose($file);

        return $file_url;
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $customer_group_id = $request->input('customer_groupIdArray', []);
        foreach ($customer_group_id as $id) {
            $lims_customer_group_data = CustomerGroup::find($id);
            if ($lims_customer_group_data) {
                $lims_customer_group_data->is_active = false;
                $lims_customer_group_data->save();
            }
        }

        $this->cacheForget('customer_group_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Customer Group deleted successfully'),
            ]);
        }

        return 'Customer Group deleted successfully!';
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_customer_group_data = CustomerGroup::findOrFail($id);
        $lims_customer_group_data->is_active = false;
        $lims_customer_group_data->save();

        $this->cacheForget('customer_group_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect('customer_group')->with('not_permitted', __('db.Data deleted successfully'));
    }

    public function customerGroupAll()
    {
        $lims_customer_group_list = DB::table('customer_groups')->where('is_active', true)->get();

        $html = '';
        foreach ($lims_customer_group_list as $customer_group) {
            $html .= '<option value="' . $customer_group->id . '">' . $customer_group->name . '</option>';
        }

        return response()->json($html);
    }
}
