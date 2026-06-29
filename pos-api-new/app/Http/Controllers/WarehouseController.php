<?php

namespace App\Http\Controllers;

use Auth;
use App\Models\Product;
use App\Models\Warehouse;
use App\Traits\CacheForget;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Product_Warehouse;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    use CacheForget;
    use SpaResponse;

    protected function warehouseProductStats(int $warehouseId): array
    {
        $base = Product_Warehouse::join('products', 'product_warehouse.product_id', '=', 'products.id')
            ->where('product_warehouse.warehouse_id', $warehouseId)
            ->where('products.is_active', true);

        return [
            'product_count' => (clone $base)->count(),
            'stock_qty' => (float) (clone $base)->sum('product_warehouse.qty'),
        ];
    }

    protected function formatWarehouseForSpa(Warehouse $warehouse): array
    {
        return array_merge([
            'id' => $warehouse->id,
            'name' => $warehouse->name,
            'phone' => $warehouse->phone,
            'email' => $warehouse->email,
            'address' => $warehouse->address,
        ], $this->warehouseProductStats($warehouse->id));
    }

    public function index(Request $request)
    {
        if ($this->wantsSpaResponse($request)) {
            $warehouses = Warehouse::where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn ($warehouse) => $this->formatWarehouseForSpa($warehouse));

            return $this->spaJson($request, ['data' => $warehouses]);
        }

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
            Product_Warehouse::create([
                'product_id' => $product,
                'warehouse_id' => $lims_warehouse_data->id,
                'qty' => 0
            ]);
        }
        $this->cacheForget('warehouse_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data inserted successfully'),
                'data' => $this->formatWarehouseForSpa($lims_warehouse_data),
            ], 201);
        }

        return redirect('warehouse')->with('message', __('db.Data inserted successfully'));
    }

    public function edit(Request $request, $id)
    {
        $lims_warehouse_data = Warehouse::findOrFail($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, ['data' => $lims_warehouse_data]);
        }

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

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data updated successfully'),
                'data' => $this->formatWarehouseForSpa($lims_warehouse_data),
            ]);
        }

        return redirect('warehouse')->with('message', __('db.Data updated successfully'));
    }

    public function importWarehouse(Request $request)
    {
        //get file
        $upload=$request->file('file');
        $ext = pathinfo($upload->getClientOriginalName(), PATHINFO_EXTENSION);
        if($ext != 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Please upload a CSV file'),
                ], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }
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

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Warehouse imported successfully'),
            ]);
        }

        return redirect('warehouse')->with('message', __('db.Warehouse imported successfully'));
    }

    public function deleteBySelection(Request $request)
    {
        $warehouse_id = $request['warehouseIdArray'];
        foreach ($warehouse_id as $id) {
            $lims_warehouse_data = Warehouse::find($id);
            $lims_warehouse_data->deactivate();
        }
        $this->cacheForget('warehouse_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return __('db.Data deleted successfully');
    }

    public function destroy(Request $request, $id)
    {
        $lims_warehouse_data = Warehouse::find($id);
        $lims_warehouse_data->deactivate();
        $this->cacheForget('warehouse_list');

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Data deleted successfully'),
            ]);
        }

        return redirect('warehouse')->with('not_permitted', __('db.Data deleted successfully'));
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
