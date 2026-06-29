<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Product;
use App\Models\Category;
use App\Models\Product_Warehouse;
use App\Models\Warehouse;
use App\Models\StockCount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Traits\SpaResponse;
use Spatie\Permission\Models\Role;

class StockCountController extends Controller
{
    use SpaResponse;

    protected function userCanAccessStockCount(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return ($role && $role->hasPermissionTo('stock_count'))
            || $user->can('stock_count');
    }

    private function formatStockCountForSpa(StockCount $row): array
    {
        $warehouse = Warehouse::find($row->warehouse_id);
        $categoryNames = [];
        $brandNames = [];

        if ($row->category_id) {
            foreach (explode(',', $row->category_id) as $categoryId) {
                $category = Category::find($categoryId);
                if ($category) {
                    $categoryNames[] = $category->name;
                }
            }
        }

        if ($row->brand_id) {
            foreach (explode(',', $row->brand_id) as $brandId) {
                $brand = Brand::find($brandId);
                if ($brand) {
                    $brandNames[] = $brand->title;
                }
            }
        }

        $fileBase = url('stock_count');

        return [
            'id' => $row->id,
            'date' => $row->created_at->format('d-m-Y H:i:s'),
            'reference_no' => $row->reference_no,
            'warehouse_id' => $row->warehouse_id,
            'warehouse_name' => $warehouse->name ?? '',
            'category_names' => $categoryNames,
            'category_label' => implode(', ', $categoryNames),
            'brand_names' => $brandNames,
            'brand_label' => implode(', ', $brandNames),
            'type' => $row->type,
            'type_label' => $row->type === 'full' ? 'Full' : 'Partial',
            'initial_file' => $row->initial_file,
            'initial_file_url' => $row->initial_file ? "{$fileBase}/{$row->initial_file}" : null,
            'final_file' => $row->final_file,
            'final_file_url' => $row->final_file ? "{$fileBase}/{$row->final_file}" : null,
            'note' => $row->note ?? '',
            'is_adjusted' => (bool) $row->is_adjusted,
            'has_final_file' => (bool) $row->final_file,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $generalSetting = DB::table('general_settings')->latest()->first();
        $query = StockCount::orderBy('id', 'desc');

        if (Auth::user()->role_id > 2 && ($generalSetting->staff_access ?? '') === 'own') {
            $query->where('user_id', Auth::id());
        }

        $lims_stock_count_all = $query->get();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'data' => $lims_stock_count_all->map(fn ($row) => $this->formatStockCountForSpa($row)),
                'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
                'categories' => Category::where('is_active', true)->get(['id', 'name']),
                'brands' => Brand::where('is_active', true)->get(['id', 'title']),
                'file_base_url' => url('stock_count'),
                'decimal' => (int) (config('decimal') ?? ($generalSetting->decimal ?? 2)),
            ]);
        }

        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_brand_list = Brand::where('is_active', true)->get();
        $lims_category_list = Category::where('is_active', true)->get();

        return view('backend.stock_count.index', compact(
            'lims_warehouse_list',
            'lims_brand_list',
            'lims_category_list',
            'lims_stock_count_all'
        ));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $data = $request->all();
        if (isset($request->category_id) || isset($request->brand_id)) {
            $data['type'] = 'partial';
        } else {
            $data['type'] = 'full';
        }

        if (isset($data['brand_id']) && isset($data['category_id'])) {
            $lims_product_list = DB::table('products')
                ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                ->whereIn('products.category_id', (array) $data['category_id'])
                ->whereIn('products.brand_id', (array) $data['brand_id'])
                ->where([['products.is_active', true], ['product_warehouse.warehouse_id', $data['warehouse_id']]])
                ->select('products.name', 'products.code', 'product_warehouse.imei_number', 'product_warehouse.qty')
                ->get();

            $data['category_id'] = implode(',', (array) $data['category_id']);
            $data['brand_id'] = implode(',', (array) $data['brand_id']);
        } elseif (isset($data['category_id'])) {
            $lims_product_list = DB::table('products')
                ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                ->whereIn('products.category_id', (array) $data['category_id'])
                ->where([['products.is_active', true], ['product_warehouse.warehouse_id', $data['warehouse_id']]])
                ->select('products.name', 'products.code', 'product_warehouse.imei_number', 'product_warehouse.qty')
                ->get();

            $data['category_id'] = implode(',', (array) $data['category_id']);
        } elseif (isset($data['brand_id'])) {
            $lims_product_list = DB::table('products')
                ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                ->whereIn('products.brand_id', (array) $data['brand_id'])
                ->where([['products.is_active', true], ['product_warehouse.warehouse_id', $data['warehouse_id']]])
                ->select('products.name', 'products.code', 'product_warehouse.imei_number', 'product_warehouse.qty')
                ->get();

            $data['brand_id'] = implode(',', (array) $data['brand_id']);
        } else {
            $lims_product_list = DB::table('products')
                ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                ->where([['products.is_active', true], ['product_warehouse.warehouse_id', $data['warehouse_id']]])
                ->select('products.name', 'products.code', 'product_warehouse.imei_number', 'product_warehouse.qty')
                ->get();
        }

        if (!count($lims_product_list)) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.No product found!')], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.No product found!'));
        }

        $csvData = ['Product Name, Product Code, IMEI or Serial Numbers, Counted'];
        foreach ($lims_product_list as $product) {
            $csvData[] = $product->name . ',' . $product->code . ',' . str_replace(',', '/', $product->imei_number ?? '');
        }

        if (!file_exists(public_path() . '/stock_count/')) {
            mkdir(public_path() . '/stock_count/', 0777, true);
        }

        $filename = date('Ymd') . '-' . date('his') . '.csv';
        $file_path = public_path() . '/stock_count/' . $filename;
        $file = fopen($file_path, 'w+');
        foreach ($csvData as $cellData) {
            fputcsv($file, explode(',', $cellData));
        }
        fclose($file);

        $data['user_id'] = Auth::id();
        $data['reference_no'] = 'scr-' . date('Ymd') . '-' . date('his');
        $data['initial_file'] = $filename;
        $data['is_adjusted'] = false;
        $record = StockCount::create($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Stock Count created successfully! Please download the initial file to complete it'),
                'id' => $record->id,
                'reference_no' => $record->reference_no,
                'initial_file_url' => url('stock_count/' . $filename),
            ]);
        }

        return redirect()->back()->with('message', __('db.Stock Count created successfully! Please download the initial file to complete it'));
    }

    public function finalize(Request $request)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $ext = pathinfo($request->file('final_file')->getClientOriginalName(), PATHINFO_EXTENSION);
        if (strtolower($ext) !== 'csv') {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, ['message' => __('db.Please upload a CSV file')], 422);
            }

            return redirect()->back()->with('not_permitted', __('db.Please upload a CSV file'));
        }

        $data = $request->all();
        $document = $request->final_file;
        $documentName = date('Ymd') . '-' . date('his') . '.csv';
        $document->move(public_path('stock_count/'), $documentName);
        $data['final_file'] = $documentName;
        $lims_stock_count_data = StockCount::find($data['stock_count_id']);
        $lims_stock_count_data->update($data);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Stock Count finalized successfully!'),
                'id' => $lims_stock_count_data->id,
                'final_file_url' => url('stock_count/' . $documentName),
            ]);
        }

        return redirect()->back()->with('message', __('db.Stock Count finalized successfully!'));
    }

    public function stockDif(Request $request, $id)
    {
        if (!$this->userCanAccessStockCount()) {
            if ($this->wantsSpaResponse($request)) {
                return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
            }

            abort(403);
        }

        $result = $this->buildStockDifference($id);

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, $result);
        }

        return [
            $result['products'],
            $result['expected'],
            $result['counted'],
            $result['difference'],
            $result['cost'],
            $result['is_adjusted'],
        ];
    }

    private function buildStockDifference($id): array
    {
        $lims_stock_count_data = StockCount::findOrFail($id);
        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_path = public_path('stock_count/') . $lims_stock_count_data->final_file;

        $product = [];
        $expected = [];
        $counted = [];
        $difference = [];
        $cost = [];

        if (!$lims_stock_count_data->final_file || !file_exists($file_path)) {
            return [
                'products' => [],
                'expected' => [],
                'counted' => [],
                'difference' => [],
                'cost' => [],
                'is_adjusted' => (bool) $lims_stock_count_data->is_adjusted,
            ];
        }

        $file_handle = fopen($file_path, 'r');
        $i = 0;
        $hasDifference = false;

        while (($current_line = fgetcsv($file_handle)) !== false) {
            if ($i === 0) {
                $i++;
                continue;
            }

            if (!isset($current_line[1])) {
                continue;
            }

            $product_data = Product::select('id', 'code', 'cost')
                ->where('code', $current_line[1])
                ->orWhere('code', 'LIKE', "%{$current_line[1]}%")
                ->first();

            if (!$product_data) {
                continue;
            }

            $product_warehouse = Product_Warehouse::where([
                'warehouse_id' => $warehouse_id,
                'product_id' => $product_data->id,
            ])->first();

            $expected_qty = (float) ($product_warehouse->qty ?? 0);
            $counted_qty = 0;

            if (isset($current_line[3])) {
                $csvQty = str_replace(',', '', trim($current_line[3]));
                if (is_numeric($csvQty)) {
                    $counted_qty = (float) $csvQty;
                }
            }

            $diff = $counted_qty - $expected_qty;

            if ($diff != 0) {
                $hasDifference = true;
            }

            $product[] = $current_line[0] . ' [' . $product_data->code . ']';
            $expected[] = $expected_qty;
            $counted[] = $counted_qty;
            $difference[] = $diff;
            $cost[] = $diff * (float) $product_data->cost;
            $i++;
        }

        fclose($file_handle);

        if (!$hasDifference) {
            $lims_stock_count_data->is_adjusted = true;
            $lims_stock_count_data->save();
        }

        return [
            'products' => $product,
            'expected' => $expected,
            'counted' => $counted,
            'difference' => $difference,
            'cost' => $cost,
            'is_adjusted' => (bool) $lims_stock_count_data->fresh()->is_adjusted,
        ];
    }

    public function adjustmentForm(Request $request, $id)
    {
        if (!$this->userCanAccessStockCount()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $lims_stock_count_data = StockCount::findOrFail($id);

        if (!$lims_stock_count_data->final_file) {
            return $this->spaJson($request, ['message' => __('db.Final file not found')], 404);
        }

        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_handle = fopen(public_path('stock_count/') . $lims_stock_count_data->final_file, 'r');
        $i = 0;
        $lines = [];

        while (!feof($file_handle)) {
            $current_line = fgetcsv($file_handle);
            if ($current_line && $i > 0) {
                $product_data = Product::select('id', 'code', 'qty')->where('code', $current_line[1])->first();
                if (!$product_data) {
                    $i++;
                    continue;
                }

                $product_warehouse_data = Product_Warehouse::select('qty')->where([
                    'warehouse_id' => $warehouse_id,
                    'product_id' => $product_data->id,
                ])->first();

                if (isset($current_line[3])) {
                    $temp_qty = $current_line[3] - $product_warehouse_data->qty;
                } else {
                    $temp_qty = $product_warehouse_data->qty * (-1);
                }

                if ($temp_qty < 0) {
                    $qty = $temp_qty * (-1);
                    $action = '-';
                } else {
                    $qty = $temp_qty;
                    $action = '+';
                }

                $lines[] = [
                    'product_id' => $product_data->id,
                    'product_code' => $current_line[1],
                    'name' => $current_line[0],
                    'qty' => (float) $qty,
                    'action' => $action,
                    'unit_cost' => 0,
                ];
            }
            $i++;
        }
        fclose($file_handle);

        return $this->spaJson($request, [
            'stock_count_id' => $lims_stock_count_data->id,
            'reference_no' => $lims_stock_count_data->reference_no,
            'warehouse_id' => $warehouse_id,
            'lines' => $lines,
        ]);
    }

    public function qtyAdjustment($id)
    {
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_stock_count_data = StockCount::find($id);
        $warehouse_id = $lims_stock_count_data->warehouse_id;
        $file_handle = fopen(public_path('stock_count/') . $lims_stock_count_data->final_file, 'r');
        $i = 0;
        $product_id = [];
        $names = [];
        $code = [];
        $qty = [];
        $action = [];

        while (!feof($file_handle)) {
            $current_line = fgetcsv($file_handle);
            if ($current_line && $i > 0) {
                $product_data = Product::select('id', 'code', 'qty')->where('code', $current_line[1])->first();
                $product_id[] = $product_data->id;
                $names[] = $current_line[0];
                $code[] = $current_line[1];

                $product_warehouse_data = Product_Warehouse::select('qty')->where([
                    'warehouse_id' => $warehouse_id,
                    'product_id' => $product_data->id,
                ])->first();

                if (isset($current_line[3])) {
                    $temp_qty = $current_line[3] - $product_warehouse_data->qty;
                } else {
                    $temp_qty = $product_warehouse_data->qty * (-1);
                }

                if ($temp_qty < 0) {
                    $qty[] = $temp_qty * (-1);
                    $action[] = '-';
                } else {
                    $qty[] = $temp_qty;
                    $action[] = '+';
                }
            }
            $i++;
        }

        return view('backend.stock_count.qty_adjustment', compact(
            'lims_warehouse_list',
            'warehouse_id',
            'id',
            'product_id',
            'names',
            'code',
            'qty',
            'action'
        ));
    }
}
