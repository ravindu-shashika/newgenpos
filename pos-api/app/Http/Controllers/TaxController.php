<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tax;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Auth;

class TaxController extends Controller
{
    use \App\Traits\CacheForget;

    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('tax')) {
            $lims_tax_all = Tax::where('is_active', true)->get();
            return view('backend.tax.create', compact('lims_tax_all'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'name' => [
                'max:255',
                    Rule::unique('taxes')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'rate' => 'numeric|min:0|max:100',

        ]);
        $input = $request->all();
        $input['is_active'] = true;
        $tax = Tax::create($input);
        $this->cacheForget('tax_list');
        if(isset($input['ajax']))
            return $tax;
        else
            return redirect('tax')->with('message', __('db.Data inserted successfully'));
    }

    public function limsTaxSearch()
    {
        $lims_tax_name = $_GET['lims_taxNameSearch'];
        $lims_tax_all = tax::where('name', $lims_tax_name)->paginate(5);
        $lims_tax_list = tax::all();
        return view('backend.tax.create', compact('lims_tax_all','lims_tax_list'));
    }

    public function edit($id)
    {
        $lims_tax_data = Tax::findOrFail($id);
        return $lims_tax_data;
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'name' => [
                'max:255',
                Rule::unique('taxes')->ignore($request->tax_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],

            'rate' => 'numeric|min:0|max:100'
        ]);

        $input = $request->all();
        $lims_tax_data = Tax::where('id', $input['tax_id'])->first();
        $lims_tax_data->update($input);
        $this->cacheForget('tax_list');
        return redirect('tax')->with('message', __('db.Data updated successfully'));
    }

    public function importTax(Request $request)
    {
        //get file
        $upload=$request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if($ext != 'csv')
            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        $filename =  $upload->getClientOriginalName();
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
        while($columns=fgetcsv($file))
        {
            if($columns[0]=="")
                continue;
            foreach ($columns as $key => $value) {
                $value=preg_replace('/\D/','',$value);
            }
           $data= array_combine($escapedHeader, $columns);

           $tax = Tax::firstOrNew(['name' => $data['name'], 'is_active' => true ]);
           $tax->name = $data['name'];
           $tax->rate = $data['rate'];
           $tax->is_active = true;
           $tax->save();
        }
        return redirect('tax')->with('message', __('db.Tax imported successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $tax_id = $request['taxIdArray'];
        foreach ($tax_id as $id) {
            $lims_tax_data = Tax::findOrFail($id);
            $lims_tax_data->is_active = false;
            $lims_tax_data->save();
        }
        $this->cacheForget('tax_list');
        return 'Tax deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_tax_data = Tax::findOrFail($id);
        $lims_tax_data->is_active = false;
        $lims_tax_data->save();
        $this->cacheForget('tax_list');
        return redirect('tax')->with('not_permitted', __('db.Data deleted successfully'));
    }

    // API methods for React frontend
    public function getAllTaxes(Request $request)
    {
        try {
            $taxes = Tax::where('is_active', true)->orderBy('created_at', 'desc')->get();
            return response()->json(['status' => 200, 'data' => $taxes, 'message' => 'Taxes fetched successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => 'Failed to fetch taxes', 'error' => $e->getMessage()], 500);
        }
    }

    public function getTax($id)
    {
        try {
            $tax = Tax::where('is_active', true)->findOrFail($id);
            return response()->json(['status' => 200, 'data' => $tax]);
        } catch (\Exception $e) {
            return response()->json(['status' => 404, 'message' => 'Tax not found'], 404);
        }
    }

    public function saveTax(Request $request)
    {
        try {
            $rules = [
                'name' => [
                    'required',
                    'max:255',
                    Rule::unique('taxes')->ignore($request->id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'rate' => 'required|numeric|min:0|max:100',
            ];
            $validated = $request->validate($rules);

            if ($request->id) {
                $tax = Tax::findOrFail($request->id);
                $tax->name = $request->name;
                $tax->rate = $request->rate;
                $tax->save();
                $message = __('db.Data updated successfully');
            } else {
                $tax = Tax::create([
                    'name' => $request->name,
                    'rate' => $request->rate,
                    'is_active' => true,
                ]);
                $message = __('db.Data inserted successfully');
            }

            $this->cacheForget('tax_list');
            return response()->json(['status' => 200, 'data' => $tax, 'message' => $message]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 400, 'message' => $e->getMessage(), 'errors' => $e->errors()], 400);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => 'Failed to save tax', 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteTax($id)
    {
        try {
            $tax = Tax::findOrFail($id);
            $tax->is_active = false;
            $tax->save();
            $this->cacheForget('tax_list');
            return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => 'Failed to delete tax', 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteTaxBySelection(Request $request)
    {
        try {
            $tax_id = $request->input('taxIdArray', []);
            foreach ($tax_id as $id) {
                $tax = Tax::find($id);
                if ($tax) {
                    $tax->is_active = false;
                    $tax->save();
                }
            }
            $this->cacheForget('tax_list');
            return response()->json(['status' => 200, 'message' => 'Tax deleted successfully!']);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => 'Failed to delete', 'error' => $e->getMessage()], 500);
        }
    }

    public function importTaxApi(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:csv,txt']);
            $upload = $request->file('file');
            $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
            if (strtolower($ext) !== 'csv') {
                return response()->json(['status' => 400, 'message' => __('db.Please upload a CSV file')], 400);
            }
            $filePath = $upload->getRealPath();
            $file = fopen($filePath, 'r');
            $header = fgetcsv($file);
            $escapedHeader = [];
            foreach ($header as $value) {
                $lheader = strtolower($value);
                $escapedItem = preg_replace('/[^a-z]/', '', $lheader);
                $escapedHeader[] = $escapedItem;
            }
            while ($columns = fgetcsv($file)) {
                if (empty($columns[0])) {
                    continue;
                }
                $data = array_combine($escapedHeader, $columns);
                if (empty($data['name'])) {
                    continue;
                }
                $tax = Tax::firstOrNew(['name' => $data['name'], 'is_active' => true]);
                $tax->name = $data['name'];
                $tax->rate = isset($data['rate']) ? (float) preg_replace('/[^0-9.]/', '', $data['rate']) : 0;
                $tax->is_active = true;
                $tax->save();
            }
            fclose($file);
            $this->cacheForget('tax_list');
            return response()->json(['status' => 200, 'message' => __('db.Tax imported successfully')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['status' => 400, 'message' => $e->getMessage(), 'errors' => $e->errors()], 400);
        } catch (\Exception $e) {
            return response()->json(['status' => 500, 'message' => 'Failed to import', 'error' => $e->getMessage()], 500);
        }
    }
}
