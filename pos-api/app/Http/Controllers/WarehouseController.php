<?php

namespace App\Http\Controllers;

use Auth;
use App\Models\Product;
use App\Models\Warehouse;
use App\Traits\CacheForget;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\ProductWarehouse;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    use CacheForget;
    public function index()
    {
        $lims_warehouse_all = Warehouse::where('is_active', true)->get();
        $numberOfWarehouse = Warehouse::where('is_active', true)->count();
        return view('backend.warehouse.create', compact('lims_warehouse_all', 'numberOfWarehouse'));
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'name' => [
                'max:255',
                    Rule::unique('warehouses')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);
        $input = $request->all();
        $input['is_active'] = true;

        $lims_warehouse_data = Warehouse::create($input);

        $lims_product_data = Product::pluck('id');
        foreach ($lims_product_data as $product) {
            ProductWarehouse::create([
                'product_id' => $product,
                'warehouse_id' => $lims_warehouse_data->id,
                'qty' => 0
            ]);
        }
        $this->cacheForget('warehouse_list');
        return redirect('warehouse')->with('message', __('db.Data inserted successfully'));
    }

    public function edit($id)
    {
        $lims_warehouse_data = Warehouse::findOrFail($id);
        return $lims_warehouse_data;
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'name' => [
                'max:255',
                    Rule::unique('warehouses')->ignore($request->warehouse_id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
        ]);
        $input = $request->all();
        $lims_warehouse_data = Warehouse::find($input['warehouse_id']);
        $lims_warehouse_data->update($input);
        $this->cacheForget('warehouse_list');
        return redirect('warehouse')->with('message', __('db.Data updated successfully'));
    }

    public function importWarehouse(Request $request)
    {
        //get file
        $upload=$request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if($ext != 'csv')
            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        $filename =  $upload->getClientOriginalName();
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
        while($columns=fgetcsv($file))
        {
            if($columns[0]=="")
                continue;
            foreach ($columns as $key => $value) {
                $value=preg_replace('/\D/','',$value);
            }
           $data= array_combine($escapedHeader, $columns);

           $warehouse = Warehouse::firstOrNew([ 'name'=>$data['name'], 'is_active'=>true ]);
           $warehouse->name = $data['name'];
           $warehouse->phone = $data['phone'];
           $warehouse->email = $data['email'];
           $warehouse->address = $data['address'];
           $warehouse->is_active = true;
           $warehouse->save();
        }
        $this->cacheForget('warehouse_list');
        return redirect('warehouse')->with('message', __('db.Warehouse imported successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $warehouse_id = $request['warehouseIdArray'];
        foreach ($warehouse_id as $id) {
            $lims_warehouse_data = Warehouse::find($id);
            if ($lims_warehouse_data) {
                $lims_warehouse_data->is_active = false;
                $lims_warehouse_data->save();
            }
        }
        $this->cacheForget('warehouse_list');
        return __('db.Data deleted successfully');
    }

    public function destroy($id)
    {
        $lims_warehouse_data = Warehouse::find($id);
        if ($lims_warehouse_data) {
            $lims_warehouse_data->is_active = false;
            $lims_warehouse_data->save();
        }
        $this->cacheForget('warehouse_list');
        return redirect('warehouse')->with('not_permitted', __('db.Data deleted successfully'));
    }

    // API methods for Vue frontend
    public function getAllWarehouses()
    {
        try {
            $warehouses = Warehouse::where('is_active', true)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $warehouses,
                'message' => 'Warehouses fetched successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to fetch warehouses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function saveWarehouse(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => [
                    'required',
                    'max:255',
                    Rule::unique('warehouses')->ignore($request->id)->where(function ($query) {
                        return $query->where('is_active', 1);
                    }),
                ],
                'phone' => 'required|max:50',
                'email' => 'nullable|email|max:255',
                'address' => 'required|string|max:500',
            ]);

            if ($request->id) {
                $warehouse = Warehouse::findOrFail($request->id);
                $warehouse->name = $request->name;
                $warehouse->phone = $request->phone;
                $warehouse->email = $request->email ?? null;
                $warehouse->address = $request->address;
                $warehouse->is_active = $request->is_active ?? true;
                $warehouse->save();
                $message = 'Warehouse updated successfully';
            } else {
                $input = [
                    'name' => $request->name,
                    'phone' => $request->phone,
                    'email' => $request->email ?? null,
                    'address' => $request->address,
                    'is_active' => true,
                ];
                $warehouse = Warehouse::create($input);

                // Create ProductWarehouse entries for all products
                $products = Product::pluck('id');
                foreach ($products as $productId) {
                    ProductWarehouse::create([
                        'product_id' => $productId,
                        'warehouse_id' => $warehouse->id,
                        'qty' => 0
                    ]);
                }
                $message = 'Warehouse created successfully';
            }

            $this->cacheForget('warehouse_list');

            return response()->json([
                'status' => 200,
                'data' => $warehouse,
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
                'message' => 'Failed to save warehouse',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteWarehouse($id)
    {
        try {
            $warehouse = Warehouse::findOrFail($id);
            $warehouse->is_active = false;
            $warehouse->save();

            $this->cacheForget('warehouse_list');

            return response()->json([
                'status' => 200,
                'message' => 'Warehouse deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete warehouse',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function warehouseAll()
    {
        if(Auth::user()->role_id > 2)
            $lims_warehouse_list = DB::table('warehouses')->where([
            ['is_active', true],
            ['id', Auth::user()->warehouse_id]
        ])->get();
        else
            $lims_warehouse_list = DB::table('warehouses')->where('is_active', true)->get();

        $html = '';
        foreach($lims_warehouse_list as $warehouse){
            $html .='<option value="'.$warehouse->id.'">'.$warehouse->name.'</option>';
        }

        return response()->json($html);
    }
}
