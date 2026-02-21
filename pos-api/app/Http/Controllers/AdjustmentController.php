<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Warehouse;
use App\Models\ProductWarehouse;
use App\Models\Product;
use App\Models\Adjustment;
use App\Models\ProductAdjustment;
use Illuminate\Support\Facades\DB;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\StockCount;
use App\Models\ProductVariant;
use App\Models\ProductPurchase;
use Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class AdjustmentController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if( $role->hasPermissionTo('adjustment') ) {
            /*if(Auth::user()->role_id > 2 && config('staff_access') == 'own')
                $lims_adjustment_all = Adjustment::orderBy('id', 'desc')->where('user_id', Auth::id())->get();
            else*/
                $lims_adjustment_all = Adjustment::orderBy('id', 'desc')->get();
            return view('backend.adjustment.index', compact('lims_adjustment_all'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    public function getProduct($warehouseId)
    {
        /*
        |--------------------------------------------------------------------------
        | 1. Fetch purchase summary (ONE QUERY)
        |--------------------------------------------------------------------------
        */
        $purchaseSummary = DB::table('product_purchases')
            ->join('purchases', 'product_purchases.purchase_id', '=', 'purchases.id')
            ->where('purchases.warehouse_id', $warehouseId)
            ->whereNull('purchases.deleted_at')
            ->groupBy('product_purchases.product_id', 'product_purchases.variant_id')
            ->selectRaw('
                product_purchases.product_id,
                product_purchases.variant_id,
                SUM(product_purchases.qty) AS total_qty,
                SUM(product_purchases.total) AS total_cost
            ')
            ->get()
            ->keyBy(function ($row) {
                return $row->product_id . '_' . ($row->variant_id ?? 0);
            });

        /*
        |--------------------------------------------------------------------------
        | 2. Fetch non-variant products (ONE QUERY)
        |--------------------------------------------------------------------------
        */
        $products = DB::table('products')
                    ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                    ->whereNull('products.is_variant')
                    ->where('products.is_active', 1)
                    ->where('product_warehouse.warehouse_id', $warehouseId)
                    ->groupBy('products.id', 'products.code', 'products.name', 'products.cost')
                    ->select(
                        'products.id',
                        'products.code',
                        'products.name',
                        'products.cost',
                        DB::raw('SUM(product_warehouse.qty) as qty')
                    )
                    ->get();


        /*
        |--------------------------------------------------------------------------
        | 3. Fetch variant products (ONE QUERY)
        |--------------------------------------------------------------------------
        */
        $variantProducts = DB::table('products')
                          ->join('product_warehouse', 'products.id', '=', 'product_warehouse.product_id')
                          ->join('product_variants', 'product_warehouse.variant_id', '=', 'product_variants.variant_id')
                          ->whereNotNull('products.is_variant')
                          ->where('products.is_active', 1)
                          ->where('product_warehouse.warehouse_id', $warehouseId)
                          ->groupBy(
                              'products.id',
                              'products.name',
                              'products.cost',
                              'product_variants.item_code',
                              'product_variants.id'
                          )
                          ->select(
                              'products.id',
                              'products.name',
                              'products.cost',
                              DB::raw('SUM(product_warehouse.qty) as qty'),
                              'product_variants.item_code',
                              'product_variants.id as variant_id'
                          )
                          ->get();


        /*
        |--------------------------------------------------------------------------
        | 4. Build result in memory (FAST)
        |--------------------------------------------------------------------------
        */
        $product_code = [];
        $product_name = [];
        $product_qty  = [];
        $product_cost = [];

        /* Normal products */
        foreach ($products as $p) {
            $key = $p->id . '_0';
            $summary = $purchaseSummary[$key] ?? null;

            $cost = ($summary && $summary->total_qty > 0)
                ? round($summary->total_cost / $summary->total_qty, 4)
                : $p->cost;

            $product_code[] = $p->code;
            $product_name[] = $p->name;
            $product_qty[]  = $p->qty;
            $product_cost[] = $cost;
        }

        /* Variant products */
        foreach ($variantProducts as $p) {
            $key = $p->id . '_' . $p->variant_id;
            $summary = $purchaseSummary[$key] ?? null;

            $cost = ($summary && $summary->total_qty > 0)
                ? round($summary->total_cost / $summary->total_qty, 4)
                : $p->cost;

            $product_code[] = $p->item_code;
            $product_name[] = $p->name;
            $product_qty[]  = $p->qty;
            $product_cost[] = $cost;
        }

        /*
        |--------------------------------------------------------------------------
        | 5. Return in original SalePro format
        |--------------------------------------------------------------------------
        */
        return [
            $product_code,
            $product_name,
            $product_qty,
            $product_cost
        ];
    }

    public function limsProductSearch(Request $request)
    {
        $product_code = explode("(", $request['data']);
        $product_info = explode("|", $request['data']);
        $product_code[0] = rtrim($product_code[0], " ");

        //return $product_info;
        $lims_product_data = Product::where([
            ['code', $product_code[0]],
            ['is_active', true]
        ])->first();
        if(!$lims_product_data) {
            $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
                ->select('products.id', 'products.name', 'products.is_variant', 'product_variants.id as product_variant_id', 'product_variants.item_code')
                ->where([
                    ['product_variants.item_code', $product_code[0]],
                    ['products.is_active', true]
                ])->first();
        }

        $product[] = $lims_product_data->name;
        $product_variant_id = null;
        if($lims_product_data->is_variant) {
            $product[] = $lims_product_data->item_code;
            $product_variant_id = $lims_product_data->product_variant_id;
        }
        else
            $product[] = $lims_product_data->code;

        $product[] = $lims_product_data->id;
        $product[] = $product_variant_id;
        $product[] = $product_info[1];
        $quantity = explode("|", $request['data']);
        if (count($quantity) >= 3) {
            $product[] =  $quantity[2];
        }
        return $product;
    }

    // public function limsProductSearch(Request $request)
    // {
    //     $product_code = explode("|", $request['data']);
    //     $product_code[0] = rtrim($product_code[0], " ");
    //     $lims_product_data = Product::where([
    //                             ['code', $product_code[0]],
    //                             ['is_active', true]
    //                         ])
    //                         ->whereNull('is_variant')
    //                         ->first();
    //     if(!$lims_product_data) {
    //         $lims_product_data = Product::where([
    //                             ['name', $product_code[1]],
    //                             ['is_active', true]
    //                         ])
    //                         ->whereNotNull(['is_variant'])
    //                         ->first();
    //         $lims_product_data = Product::join('product_variants', 'products.id', 'product_variants.product_id')
    //             ->where([
    //                 ['product_variants.item_code', $product_code[0]],
    //                 ['products.is_active', true]
    //             ])
    //             ->whereNotNull('is_variant')
    //             ->select('products.*', 'product_variants.item_code', 'product_variants.additional_cost')
    //             ->first();
    //         $lims_product_data->cost += $lims_product_data->additional_cost;
    //     }
    //     $product[] = $lims_product_data->name;
    //     if($lims_product_data->is_variant)
    //         $product[] = $lims_product_data->item_code;
    //     else
    //         $product[] = $lims_product_data->code;
    //     $product[] = $lims_product_data->cost;

    //     if ($lims_product_data->tax_id) {
    //         $lims_tax_data = Tax::find($lims_product_data->tax_id);
    //         $product[] = $lims_tax_data->rate;
    //         $product[] = $lims_tax_data->name;
    //     } else {
    //         $product[] = 0;
    //         $product[] = 'No Tax';
    //     }
    //     $product[] = $lims_product_data->tax_method;

    //     $units = Unit::where("base_unit", $lims_product_data->unit_id)
    //                 ->orWhere('id', $lims_product_data->unit_id)
    //                 ->get();
    //     $unit_name = array();
    //     $unit_operator = array();
    //     $unit_operation_value = array();
    //     foreach ($units as $unit) {
    //         if ($lims_product_data->purchase_unit_id == $unit->id) {
    //             array_unshift($unit_name, $unit->unit_name);
    //             array_unshift($unit_operator, $unit->operator);
    //             array_unshift($unit_operation_value, $unit->operation_value);
    //         } else {
    //             $unit_name[]  = $unit->unit_name;
    //             $unit_operator[] = $unit->operator;
    //             $unit_operation_value[] = $unit->operation_value;
    //         }
    //     }

    //     $product[] = implode(",", $unit_name) . ',';
    //     $product[] = implode(",", $unit_operator) . ',';
    //     $product[] = implode(",", $unit_operation_value) . ',';
    //     $product[] = $lims_product_data->id;
    //     $product[] = $lims_product_data->is_batch;
    //     $product[] = $lims_product_data->is_imei;
    //     // return dd($product);
    //     return $product;
    // }

    public function create()
    {
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        $lims_product_list_without_variant = $this->productWithoutVariant();
        $lims_product_list_with_variant = $this->productWithVariant();
        return view('backend.adjustment.create', compact('lims_warehouse_list', 'lims_product_list_without_variant', 'lims_product_list_with_variant'));

    }

    /**
     * API: Form data for adjustment (warehouses).
     */
    public function formData()
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('adjustment')) {
            return response()->json(['status' => 403, 'message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $warehouses = Warehouse::where('is_active', true)->get(['id', 'name']);
        return response()->json(['status' => 200, 'data' => ['warehouses' => $warehouses]]);
    }

    /**
     * API: Products in warehouse for adjustment autocomplete (same as getProduct).
     */
    public function warehouseProducts($warehouse)
    {
        $data = $this->getProduct($warehouse);
        return response()->json($data);
    }

    /**
     * API: Product lookup for adjustment row (same as limsProductSearch).
     */
    public function productLookup(Request $request)
    {
        $data = $request->query('data') ?? $request->input('data');
        if (empty($data)) {
            return response()->json(['status' => 422, 'message' => 'Missing data parameter'], 422);
        }
        $product = $this->limsProductSearch(new Request(['data' => $data]));
        return response()->json($product);
    }

    /**
     * API: List adjustments for React.
     */
    public function listApi()
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('adjustment')) {
            return response()->json(['status' => 403, 'message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        $adjustments = Adjustment::with(['warehouse:id,name', 'productAdjustments'])
            ->orderBy('id', 'desc')
            ->get();
        $list = $adjustments->map(function ($adj) {
            $productsText = $adj->productAdjustments->map(function ($pa) {
                $product = Product::find($pa->product_id);
                $code = $pa->product_id;
                $name = $product ? $product->name : 'N/A';
                if ($pa->variant_id) {
                    $pv = ProductVariant::where('product_id', $pa->product_id)->where('variant_id', $pa->variant_id)->first();
                    $code = $pv ? $pv->item_code : $pa->product_id;
                } else {
                    $code = $product ? $product->code : $pa->product_id;
                }
                return $name . ' ' . $pa->qty . ' x ' . $pa->unit_cost;
            })->implode(', ');
            return [
                'id' => $adj->id,
                'reference_no' => $adj->reference_no,
                'warehouse_id' => $adj->warehouse_id,
                'warehouse_name' => $adj->warehouse ? $adj->warehouse->name : '',
                'products' => $productsText,
                'note' => $adj->note,
                'total_qty' => $adj->total_qty,
                'item' => $adj->item,
                'created_at' => $adj->created_at->format('Y-m-d H:i:s'),
            ];
        });
        return response()->json(['status' => 200, 'data' => $list]);
    }

    /**
     * API: Store adjustment (JSON).
     */
    public function storeApi(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if (!$role->hasPermissionTo('adjustment')) {
            return response()->json(['status' => 403, 'message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }
        try {
            DB::beginTransaction();
            $data = $request->except('document');
            $data['reference_no'] = 'adr-' . date('Ymd') . '-' . date('his');
            $lims_adjustment_data = Adjustment::create($data);

            $product_id = $data['product_id'] ?? [];
            $product_code = $data['product_code'] ?? [];
            $qty = $data['qty'] ?? [];
            $unit_cost = $data['unit_cost'] ?? [];
            $action = $data['action'] ?? [];

            foreach ($product_id as $key => $pro_id) {
                $lims_product_data = Product::find($pro_id);
                if (!$lims_product_data) {
                    continue;
                }
                $variant_id = null;
                $lims_product_warehouse_data = null;

                if ($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key] ?? '')->first();
                    if (!$lims_product_variant_data) {
                        continue;
                    }
                    $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $pro_id],
                        ['variant_id', $lims_product_variant_data->variant_id],
                        ['warehouse_id', $data['warehouse_id']],
                    ])->first();
                    if ($action[$key] == '-') {
                        $lims_product_variant_data->qty -= $qty[$key];
                    } elseif ($action[$key] == '+') {
                        $lims_product_variant_data->qty += $qty[$key];
                    }
                    $lims_product_variant_data->save();
                    $variant_id = $lims_product_variant_data->variant_id;
                } else {
                    $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $pro_id],
                        ['warehouse_id', $data['warehouse_id']],
                    ])->first();
                }

                if (!$lims_product_warehouse_data) {
                    continue;
                }
                if ($action[$key] == '-') {
                    $lims_product_data->qty -= $qty[$key];
                    $lims_product_warehouse_data->qty -= $qty[$key];
                } elseif ($action[$key] == '+') {
                    $lims_product_data->qty += $qty[$key];
                    $lims_product_warehouse_data->qty += $qty[$key];
                }
                $lims_product_data->save();
                $lims_product_warehouse_data->save();

                ProductAdjustment::create([
                    'product_id' => $pro_id,
                    'variant_id' => $variant_id,
                    'adjustment_id' => $lims_adjustment_data->id,
                    'qty' => $qty[$key],
                    'unit_cost' => $unit_cost[$key] ?? 0,
                    'action' => $action[$key],
                ]);
            }
            DB::commit();
            return response()->json([
                'status' => 200,
                'message' => __('db.Data inserted successfully'),
                'data' => ['id' => $lims_adjustment_data->id, 'reference_no' => $lims_adjustment_data->reference_no],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 500, 'message' => $e->getMessage()], 500);
        }
    }

    public function productWithoutVariant()
    {
        return Product::ActiveStandard()->select('id', 'name', 'code')
                ->whereNull('is_variant')->get();
    }

    public function productWithVariant()
    {
        return Product::join('product_variants', 'products.id', 'product_variants.product_id')
            ->ActiveStandard()
            ->whereNotNull('is_variant')
            ->select('products.id', 'products.name', 'product_variants.item_code')
            ->orderBy('position')
            ->get();
    }

    public function store(Request $request)
    {
        try{
            DB::beginTransaction();
            $data = $request->except('document');
            //return $data;
            if( isset($data['stock_count_id']) ){
                $lims_stock_count_data = StockCount::find($data['stock_count_id']);
                $lims_stock_count_data->is_adjusted = true;
                $lims_stock_count_data->save();
            }
            $data['reference_no'] = 'adr-' . date("Ymd") . '-'. date("his");
            $document = $request->document;
            if ($document) {
                $documentName = $document->getClientOriginalName();
                $document->move(public_path('documents/adjustment'), $documentName);
                $data['document'] = $documentName;
            }
            $lims_adjustment_data = Adjustment::create($data);

            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            if(isset($data['unit_cost']))
                $unit_cost = $data['unit_cost'];
            $action = $data['action'];

            foreach ($product_id as $key => $pro_id) {
                $lims_product_data = Product::find($pro_id);
                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                    $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $pro_id],
                        ['variant_id', $lims_product_variant_data->variant_id ],
                        ['warehouse_id', $data['warehouse_id'] ],
                    ])->first();

                    if($action[$key] == '-'){
                        $lims_product_variant_data->qty -= $qty[$key];
                    }
                    elseif($action[$key] == '+'){
                        $lims_product_variant_data->qty += $qty[$key];
                    }
                    $lims_product_variant_data->save();
                    $variant_id = $lims_product_variant_data->variant_id;
                }
                else {
                    $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $pro_id],
                        ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    $variant_id = null;
                }

                if($action[$key] == '-') {
                    $lims_product_data->qty -= $qty[$key];
                    $lims_product_warehouse_data->qty -= $qty[$key];
                }
                elseif($action[$key] == '+') {
                    $lims_product_data->qty += $qty[$key];
                    $lims_product_warehouse_data->qty += $qty[$key];
                }
                $lims_product_data->save();
                $lims_product_warehouse_data->save();

                $product_adjustment['product_id'] = $pro_id;
                $product_adjustment['variant_id'] = $variant_id;
                $product_adjustment['adjustment_id'] = $lims_adjustment_data->id;
                $product_adjustment['qty'] = $qty[$key];
                if(isset($data['unit_cost']))
                    $product_adjustment['unit_cost'] = $unit_cost[$key];
                $product_adjustment['action'] = $action[$key];
                ProductAdjustment::create($product_adjustment);
            }
            DB::commit();
            return redirect('qty_adjustment')->with('message', __('db.Data inserted successfully'));
        }catch(\Throwable $e){
            DB::rollBack();
             return redirect('qty_adjustment')->with('not_permitted', __('db.Someting Error Please try again'));
        }
    }

    public function edit($id)
    {
        $lims_adjustment_data = Adjustment::find($id);
        $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
        $lims_warehouse_list = Warehouse::where('is_active', true)->get();
        return view('backend.adjustment.edit', compact('lims_adjustment_data', 'lims_warehouse_list', 'lims_product_adjustment_data'));
    }

    public function update(Request $request, $id)
    {
        try{
            DB::beginTransaction();
            $data = $request->except('document');
                $lims_adjustment_data = Adjustment::find($id);

                $document = $request->document;
                if ($document) {
                    $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

                    $documentName = $document->getClientOriginalName();
                    $document->move(public_path('documents/adjustment'), $documentName);
                    $data['document'] = $documentName;
                }

                $lims_adjustment_data = Adjustment::find($id);
                $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();


                $product_id = $data['product_id'];
                $product_variant_id = $data['product_variant_id'];
                $product_code = $data['product_code'];
                $qty = $data['qty'];
                $unit_cost = $data['unit_cost'];
                $action = $data['action'];
                $old_product_variant_id = [];
                foreach ($lims_product_adjustment_data as $key => $product_adjustment_data) {

                    $old_product_id[] = $product_adjustment_data->product_id;
                    $lims_product_data = Product::find($product_adjustment_data->product_id);
                    if($product_adjustment_data->variant_id) {
                        $lims_product_variant_data = ProductVariant::where([
                            ['product_id', $product_adjustment_data->product_id],
                            ['variant_id', $product_adjustment_data->variant_id]
                        ])->first();
                        $old_product_variant_id[$key] = $lims_product_variant_data->id;
                        if($product_adjustment_data->action == '-') {
                            $lims_product_variant_data->qty -= $product_adjustment_data->qty;
                        }
                        elseif($product_adjustment_data->action == '+') {
                            $lims_product_variant_data->qty += $product_adjustment_data->qty;
                        }
                        $lims_product_variant_data->save();
                        $lims_product_warehouse_data = ProductWarehouse::where([
                            ['product_id', $product_adjustment_data->product_id],
                            ['variant_id', $product_adjustment_data->variant_id],
                            ['warehouse_id', $lims_adjustment_data->warehouse_id]
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = ProductWarehouse::where([
                                ['product_id', $product_adjustment_data->product_id],
                                ['warehouse_id', $lims_adjustment_data->warehouse_id]
                            ])->first();
                    }
                    // if($product_adjustment_data->action == '-'){
                    //     $lims_product_data->qty -= $qty[$key];
                    //     $lims_product_warehouse_data->qty -= $qty[$key];
                    // }
                    // elseif($product_adjustment_data->action == '+'){
                    //     $lims_product_data->qty += $qty[$key];
                    //     $lims_product_warehouse_data->qty += $qty[$key];
                    // }

                    // $lims_product_data->save();
                    // $lims_product_warehouse_data->save();

                    if($product_adjustment_data->variant_id && !(in_array($old_product_variant_id[$key], $product_variant_id)) ){
                        $product_adjustment_data->delete();
                    }
                    elseif( !(in_array($old_product_id[$key], $product_id)) )
                        $product_adjustment_data->delete();
                }

                foreach ($product_id as $key => $pro_id) {

                    $lims_product_data = Product::find($pro_id);
                    if($lims_product_data->is_variant) {
                        $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                        $lims_product_warehouse_data = ProductWarehouse::where([
                            ['product_id', $pro_id],
                            ['variant_id', $lims_product_variant_data->variant_id ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();

                        if($action[$key] == '-'){
                            $lims_product_variant_data->qty -= $qty[$key];
                        }
                        elseif($action[$key] == '+'){
                            $lims_product_variant_data->qty += $qty[$key];
                        }
                        $lims_product_variant_data->save();
                        $variant_id = $lims_product_variant_data->variant_id;
                    }
                    else {
                        $lims_product_warehouse_data = ProductWarehouse::where([
                            ['product_id', $pro_id],
                            ['warehouse_id', $data['warehouse_id'] ],
                            ])->first();
                        $variant_id = null;
                    }


                    if($action[$key] == '-'){
                        $lims_product_warehouse_data->qty -= $qty[$key];
                    }
                    elseif($action[$key] == '+'){
                        $lims_product_warehouse_data->qty += $qty[$key];
                    }
                    $lims_product_warehouse_data->save();

                    $product_adjustment['product_id'] = $pro_id;
                    $product_adjustment['variant_id'] = $variant_id;
                    $product_adjustment['adjustment_id'] = $id;
                    $product_adjustment['unit_cost'] = $unit_cost[$key];
                    $product_adjustment['action'] = $action[$key];


                    if($product_adjustment['variant_id'] && in_array($product_variant_id[$key], $old_product_variant_id)) {
                       $adjustment = ProductAdjustment::where([
                            ['product_id', $pro_id],
                            ['variant_id', $product_adjustment['variant_id']],
                            ['adjustment_id', $id]
                        ])->first();
                        if($action[$key] == '-'){
                            $product_adjustment['qty'] = $adjustment->qty - $qty[$key];
                        }
                        elseif($action[$key] == '+'){
                            $product_adjustment['qty'] = $adjustment->qty + $qty[$key];
                        }
                        $adjustment->update($product_adjustment);
                    }
                    elseif( $product_adjustment['variant_id'] === null && in_array($pro_id, $old_product_id) ){
                       $adjustment =  ProductAdjustment::where([
                        ['adjustment_id', $id],
                        ['product_id', $pro_id]
                        ])->first();
                        if($action[$key] == '-'){
                            $product_adjustment['qty'] = $adjustment->qty - $qty[$key];
                        }
                        elseif($action[$key] == '+'){
                            $product_adjustment['qty'] = $adjustment->qty + $qty[$key];
                        }
                        $adjustment->update($product_adjustment);
                    }
                    else{
                        $product_adjustment['qty'] = $qty[$key];
                        ProductAdjustment::create($product_adjustment);
                    }
                }
                $lims_adjustment_data->update($data);
             DB::commit();
             return redirect('qty_adjustment')->with('message', __('db.Data updated successfully'));
        }catch(\Throwable $e){
            DB::rollBack();
            dd($e);
            return redirect('qty_adjustment')->with('not_permitted', __('db.Someting Error
            Please try again'));
        }
    }

    public function deleteBySelection(Request $request)
    {
        $adjustment_id = $request['adjustmentIdArray'];
        foreach ($adjustment_id as $id) {
            $lims_adjustment_data = Adjustment::find($id);
            $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

            $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
            foreach ($lims_product_adjustment_data as $key => $product_adjustment_data) {
                $lims_product_data = Product::find($product_adjustment_data->product_id);
                if($product_adjustment_data->variant_id) {
                    $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_adjustment_data->product_id, $product_adjustment_data->variant_id)->first();
                    $lims_product_warehouse_data = ProductWarehouse::where([
                            ['product_id', $product_adjustment_data->product_id],
                            ['variant_id', $product_adjustment_data->variant_id],
                            ['warehouse_id', $lims_adjustment_data->warehouse_id]
                        ])->first();
                    if($product_adjustment_data->action == '-'){
                        $lims_product_variant_data->qty += $product_adjustment_data->qty;
                    }
                    elseif($product_adjustment_data->action == '+'){
                        $lims_product_variant_data->qty -= $product_adjustment_data->qty;
                    }
                    $lims_product_variant_data->save();
                }
                else {
                    $lims_product_warehouse_data = ProductWarehouse::where([
                            ['product_id', $product_adjustment_data->product_id],
                            ['warehouse_id', $lims_adjustment_data->warehouse_id]
                        ])->first();
                }
                if($product_adjustment_data->action == '-'){
                    $lims_product_data->qty += $product_adjustment_data->qty;
                    $lims_product_warehouse_data->qty += $product_adjustment_data->qty;
                }
                elseif($product_adjustment_data->action == '+'){
                    $lims_product_data->qty -= $product_adjustment_data->qty;
                    $lims_product_warehouse_data->qty -= $product_adjustment_data->qty;
                }
                $lims_product_data->save();
                $lims_product_warehouse_data->save();
                $product_adjustment_data->delete();
            }
            $lims_adjustment_data->delete();
        }
        return 'Data deleted successfully';
    }

    public function destroy($id)
    {
        if (request()->expectsJson()) {
            return $this->destroyApi($id);
        }
        $lims_adjustment_data = Adjustment::find($id);
        $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
        foreach ($lims_product_adjustment_data as $key => $product_adjustment_data) {
            $lims_product_data = Product::find($product_adjustment_data->product_id);
            if($product_adjustment_data->variant_id) {
                $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_adjustment_data->product_id, $product_adjustment_data->variant_id)->first();
                $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $product_adjustment_data->product_id],
                        ['variant_id', $product_adjustment_data->variant_id],
                        ['warehouse_id', $lims_adjustment_data->warehouse_id]
                    ])->first();
                if($product_adjustment_data->action == '-'){
                    $lims_product_variant_data->qty += $product_adjustment_data->qty;
                }
                elseif($product_adjustment_data->action == '+'){
                    $lims_product_variant_data->qty -= $product_adjustment_data->qty;
                }
                $lims_product_variant_data->save();
            }
            else {
                $lims_product_warehouse_data = ProductWarehouse::where([
                        ['product_id', $product_adjustment_data->product_id],
                        ['warehouse_id', $lims_adjustment_data->warehouse_id]
                    ])->first();
            }
            if($product_adjustment_data->action == '-'){
                $lims_product_data->qty += $product_adjustment_data->qty;
                $lims_product_warehouse_data->qty += $product_adjustment_data->qty;
            }
            elseif($product_adjustment_data->action == '+'){
                $lims_product_data->qty -= $product_adjustment_data->qty;
                $lims_product_warehouse_data->qty -= $product_adjustment_data->qty;
            }
            $lims_product_data->save();
            $lims_product_warehouse_data->save();
            $product_adjustment_data->delete();
        }
        $lims_adjustment_data->delete();
        $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);

        return redirect('qty_adjustment')->with('not_permitted', __('db.Data deleted successfully'));
    }

    /**
     * API: Delete adjustment (returns JSON).
     */
    public function destroyApi($id)
    {
        $lims_adjustment_data = Adjustment::find($id);
        if (!$lims_adjustment_data) {
            return response()->json(['status' => 404, 'message' => 'Adjustment not found'], 404);
        }
        $lims_product_adjustment_data = ProductAdjustment::where('adjustment_id', $id)->get();
        foreach ($lims_product_adjustment_data as $product_adjustment_data) {
            $lims_product_data = Product::find($product_adjustment_data->product_id);
            if ($product_adjustment_data->variant_id) {
                $lims_product_variant_data = ProductVariant::select('id', 'qty')->FindExactProduct($product_adjustment_data->product_id, $product_adjustment_data->variant_id)->first();
                if ($lims_product_variant_data) {
                    if ($product_adjustment_data->action == '-') {
                        $lims_product_variant_data->qty += $product_adjustment_data->qty;
                    } elseif ($product_adjustment_data->action == '+') {
                        $lims_product_variant_data->qty -= $product_adjustment_data->qty;
                    }
                    $lims_product_variant_data->save();
                }
                $lims_product_warehouse_data = ProductWarehouse::where([
                    ['product_id', $product_adjustment_data->product_id],
                    ['variant_id', $product_adjustment_data->variant_id],
                    ['warehouse_id', $lims_adjustment_data->warehouse_id],
                ])->first();
            } else {
                $lims_product_warehouse_data = ProductWarehouse::where([
                    ['product_id', $product_adjustment_data->product_id],
                    ['warehouse_id', $lims_adjustment_data->warehouse_id],
                ])->first();
            }
            if ($lims_product_data) {
                if ($product_adjustment_data->action == '-') {
                    $lims_product_data->qty += $product_adjustment_data->qty;
                } elseif ($product_adjustment_data->action == '+') {
                    $lims_product_data->qty -= $product_adjustment_data->qty;
                }
                $lims_product_data->save();
            }
            if ($lims_product_warehouse_data) {
                if ($product_adjustment_data->action == '-') {
                    $lims_product_warehouse_data->qty += $product_adjustment_data->qty;
                } elseif ($product_adjustment_data->action == '+') {
                    $lims_product_warehouse_data->qty -= $product_adjustment_data->qty;
                }
                $lims_product_warehouse_data->save();
            }
            $product_adjustment_data->delete();
        }
        $lims_adjustment_data->delete();
        $this->fileDelete(public_path('documents/adjustment/'), $lims_adjustment_data->document);
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }
}
