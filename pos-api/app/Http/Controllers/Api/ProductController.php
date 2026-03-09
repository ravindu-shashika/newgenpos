<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductCollection;
use App\Http\Requests\StoreProductRequest;
use DB;
use Auth;
use DNS1D;
use Exception;
use Keygen\Keygen;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Brand;
use App\Models\Barcode;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Variant;
use App\Models\Category;
use App\Models\Purchase;
use App\Models\Warehouse;
use App\Traits\TenantInfo;
use App\Models\CustomField;
use App\Traits\CacheForget;
use Illuminate\Support\Str;
use App\Models\ProductBatch;
use App\Models\ProductVariant;
use App\Models\ProductPurchase;
use Illuminate\Validation\Rule;
use App\Models\Product_Warehouse;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Http;
use Intervention\Image\ImageManager;

class ProductController extends Controller
{
    use CacheForget;
    use TenantInfo;
    public function index(Request $request)
    {
        $paginate = filter_var($request->input('paginate', 'true'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10); // Default: 10 items per page
        $query = Product::with('category', 'brand', 'unit')->where('is_active', true);

        if ($paginate) {
            $products = $query->paginate($perPage);
            $requirePagination = true;
        } else {
            $products = $query->get();
            $requirePagination = false;
        }

        return new ProductCollection($products,$requirePagination);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(StoreProductRequest $request)
    {
        // return dd($request->all());
        //  $messages = [
        //     'name.required' => 'The product name is required.',
        //     'name.unique' => 'The product name must be unique.',
        //     'code.required' => 'The product code is required.',
        //     'code.unique' => 'The product code must be unique.',
        //     'type.required' => 'The product type is required.',
        //     'type.in' => 'The product type must be one of: standard, digital, combo, or service.',
        //     'barcode_symbology.required' => 'The barcode symbology is required.',
        //     'category_id.required' => 'Please select a category.',
        //     'category_id.exists' => 'The selected category does not exist.',
        //     'unit_id.required' => 'The unit field is required.',
        //     'unit_id.exists' => 'The selected unit does not exist.',
        //     'purchase_unit_id.required' => 'The purchase unit field is required.',
        //     'purchase_unit_id.exists' => 'The selected purchase unit does not exist.',
        //     'sale_unit_id.required' => 'The sale unit field is required.',
        //     'sale_unit_id.exists' => 'The selected sale unit does not exist.',
        //     'cost.required' => 'The cost field is required.',
        //     'cost.numeric' => 'The cost must be a valid number.',
        //     'cost.min' => 'The cost must be at least 0.',
        //     'price.required' => 'The price field is required.',
        //     'price.numeric' => 'The price must be a valid number.',
        //     'price.min' => 'The price must be at least 0.',
        // ];

        // $validator = \Validator::make($request->all(), [
        //     'name' => 'required|string|max:255|unique:products,name',
        //     'code' => 'required|string|max:255|unique:products,code',
        //     'type' => 'required|string|in:standard,digital,combo,service',
        //     'barcode_symbology' => 'required|string|max:50',
        //     'category_id' => 'required|exists:categories,id',
        //     'unit_id' => 'required|exists:units,id',
        //     'purchase_unit_id' => 'required|exists:units,id',
        //     'sale_unit_id' => 'required|exists:units,id',
        //     'cost' => 'required|numeric|min:0',
        //     'price' => 'required|numeric|min:0',
        // ], $messages);

        // if ($validator->fails()) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Validation failed.',
        //         'errors' => $validator->errors(),
        //     ], 422);
        // }

        $data = $request->except('image', 'file');
        
        // handle warranty and guarantee
        if (!isset($data['warranty'])) {
            unset($data['warranty']);
            unset($data['warranty_type']);
        }
        if (!isset($data['guarantee'])) {
            unset($data['guarantee']);
            unset($data['guarantee_type']);
        }
        // return dd($data);

        if(isset($data['is_variant'])) {
            $data['variant_option'] = json_encode(array_unique($data['variant_option']));
            $data['variant_value'] = json_encode(array_unique($data['variant_value']));
        }
        else {
            $data['variant_option'] = $data['variant_value'] = null;
        }

        $data['name'] = preg_replace('/[\n\r]/', "<br>", htmlspecialchars(trim($data['name']), ENT_QUOTES));

        if(in_array('ecommerce', explode(',',config('addons')))) {
            $data['slug'] = Str::slug($data['name'], '-');
            $data['slug'] = preg_replace('/[^A-Za-z0-9\-]/', '', $data['slug']);
            $data['slug'] = str_replace( '\/', '/', $data['slug'] );
        }

        if(in_array('restaurant', explode(',',config('addons')))) {
            $data['menu_type'] = implode(",", $request->menu_type);
        }

        if($data['type'] == 'combo') {
            $data['product_list'] = implode(",", $data['product_id']);
            $data['variant_list'] = implode(",", $data['variant_id']);
            $data['qty_list'] = implode(",", $data['product_qty']);
            $data['price_list'] = implode(",", $data['unit_price']);
            //$data['cost'] = $data['unit_id'] = $data['purchase_unit_id'] = $data['sale_unit_id'] = 0;
        }
        elseif($data['type'] == 'digital' || $data['type'] == 'service')
            $data['cost'] = $data['unit_id'] = $data['purchase_unit_id'] = $data['sale_unit_id'] = 0;

        // $data['product_details'] = str_replace('"', '@', $data['product_details']);

        // if($data['starting_date'])
        //     $data['starting_date'] = date('Y-m-d', strtotime($data['starting_date']));
        // if($data['last_date'])
        //     $data['last_date'] = date('Y-m-d', strtotime($data['last_date']));
        $data['is_active'] = true;
        $images = $request->image;
        $image_names = [];
        if ($images) {
            // Ensure the necessary directories exist using public_path()
            $this->diffSizeOfImagePathExistOrCreate();

            foreach ($images as $key => $image) {
                $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);
                $imageName = date("Ymdhis") . ($key + 1);

                // Handle multi-tenant logic if necessary
                if (!config('database.connections.saleprosaas_landlord')) {
                    $imageName = $imageName . '.' . $ext;

                } else {
                    $imageName = $this->getTenantId() . '_' . $imageName . '.' . $ext;
                }
                

                $image->move(public_path('images/product'), $imageName);

                $manager = new ImageManager();
                $image = $manager->make(public_path('images/product/'). $imageName);

                $image->fit(1000, 1250)->save(public_path('images/product/xlarge/'). $imageName, 100);

                $image->fit(500, 500)->save(public_path('images/product/large/'). $imageName, 100);

                $image->fit(250, 250)->save(public_path('images/product/medium/' . $imageName), 100);

                $image->fit(100, 100)->save(public_path('images/product/small/' . $imageName), 100);

                // Collect image names for saving in the database
                $image_names[] = $imageName;
            }

            // Save the image names in the database
            $data['image'] = implode(",", $image_names);
        }

        else {
            $data['image'] = 'zummXD2dvAtI.png';
        }
        $file = $request->file;
        if ($file) {
            $ext = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);
            $fileName = strtotime(date('Y-m-d H:i:s'));
            $fileName = $fileName . '.' . $ext;
            $file->move(public_path('product/files'), $fileName);
            $data['file'] = $fileName;
        }
        if(!isset($data['is_sync_disable']) && \Schema::hasColumn('products', 'is_sync_disable'))
                $data['is_sync_disable'] = null;
        //return $data;
        $lims_product_data = Product::create($data);
        
        $custom_field_data = [];
        $custom_fields = CustomField::where('belongs_to', 'product')->select('name', 'type')->get();
        foreach ($custom_fields as $type => $custom_field) {
            $field_name = str_replace(' ', '_', strtolower($custom_field->name));
            if(isset($data[$field_name])) {
                if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                    $custom_field_data[$field_name] = implode(",", $data[$field_name]);
                else
                    $custom_field_data[$field_name] = $data[$field_name];
            }
        }
        if(count($custom_field_data))
            DB::table('products')->where('id', $lims_product_data->id)->update($custom_field_data);
        //dealing with initial stock and auto purchase
        $initial_stock = 0;
        if(isset($data['is_initial_stock']) && !isset($data['is_variant']) && !isset($data['is_batch'])) {
            foreach ($data['stock_warehouse_id'] as $key => $warehouse_id) {
                $stock = $data['stock'][$key];
                if($stock > 0) {
                    $this->autoPurchase($lims_product_data, $warehouse_id, $stock);
                    $initial_stock += $stock;
                }
            }
        }
        if($initial_stock > 0) {
            $lims_product_data->qty += $initial_stock;
            $lims_product_data->save();
        }
        //dealing with product variant
        if(!isset($data['is_batch']))
            $data['is_batch'] = null;
        $variant_ids = [];
        if(isset($data['is_variant'])) {
            foreach ($data['variant_name'] as $key => $variant_name) {
                $lims_variant_data = Variant::firstOrCreate(['name' => $data['variant_name'][$key]]);
                $variant_ids[] = $lims_variant_data->id;
                $product_variant = ProductVariant::firstOrNew([
                    'product_id' => $lims_product_data->id,
                    'variant_id' => $lims_variant_data->id,
                    'item_code' => $data['item_code'][$key],
                    'additional_cost' => $data['additional_cost'][$key],
                    'additional_price' => $data['additional_price'][$key],
                    'qty' => 0,
                ]);
                $product_variant->position = $key + 1;
                $product_variant->save();
            }
        }
        if(isset($data['is_diffPrice'])) {
            foreach ($data['diff_price'] as $key => $diff_price) {
                if($diff_price) {
                    Product_Warehouse::firstOrCreate([
                        "product_id" => $lims_product_data->id,
                        "warehouse_id" => $data["warehouse_id"][$key],
                        "qty" => 0,
                        "price" => $diff_price
                    ]);
                }
            }
        }
        elseif(!isset($data['is_initial_stock']) && !isset($data['is_batch']) && config('without_stock') == 'yes') {
            $warehouse_ids = Warehouse::where('is_active', true)->pluck('id');
            foreach ($warehouse_ids as $warehouse_id) {
                if(count($variant_ids)) {
                    foreach ($variant_ids as $variant_id) {
                        Product_Warehouse::firstOrCreate([
                            "product_id" => $lims_product_data->id,
                            "variant_id" => $variant_id,
                            "warehouse_id" => $warehouse_id,
                            "qty" => 0,
                        ]);
                    }
                }
                else {
                    Product_Warehouse::firstOrCreate([
                        "product_id" => $lims_product_data->id,
                        "warehouse_id" => $warehouse_id,
                        "qty" => 0,
                    ]);
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => $lims_product_data,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    public function update(StoreProductRequest $request, Product $product)
    {
        $lims_product_data = $product;
        $data = $request->except('image', 'file', 'prev_img');
        $data['name'] = htmlspecialchars(trim($data['name']), ENT_QUOTES);

        $general_setting = DB::table('general_settings')->select('modules')->first();
        if(in_array('ecommerce', explode(',',$general_setting->modules))) {
            $data['slug'] = Str::slug($data['name'], '-');
            $data['slug'] = preg_replace('/[^A-Za-z0-9\-]/', '', $data['slug']);
            $data['slug'] = str_replace( '\/', '/', $data['slug'] );
            $data['related_products'] = rtrim($request->products, ",");

            if(isset($request->in_stock))
                $data['in_stock'] = $request->input('in_stock');
            else
                $data['in_stock'] = 0;

            if(isset($request->is_online))
                $data['is_online'] = $request->input('is_online');
            else
                $data['is_online'] = 0;
        }

        if(in_array('restaurant', explode(',',$general_setting->modules))) {
            $data['slug'] = Str::slug($data['name'], '-');
            $data['slug'] = preg_replace('/[^A-Za-z0-9\-]/', '', $data['slug']);
            $data['slug'] = str_replace( '\/', '/', $data['slug'] );
            $data['related_products'] = rtrim($request->products, ",");
            $data['extras'] = rtrim($request->extras, ",");

            if(isset($request->is_online))
                $data['is_online'] = $request->input('is_online');
            else
                $data['is_online'] = 0;

            if(isset($request->is_addon))
                $data['is_addon'] = $request->input('is_addon');
            else
                $data['is_addon'] = 0;

            $data['kitchen_id'] = $request->kitchen_id;
            $data['menu_type'] = implode(",", $request->menu_type);
        }


        if($data['type'] == 'combo') {
            $data['product_list'] = implode(",", $data['product_id']);
            $data['variant_list'] = implode(",", $data['variant_id']);
            $data['qty_list'] = implode(",", $data['product_qty']);
            $data['price_list'] = implode(",", $data['unit_price']);
            //$data['cost'] = $data['unit_id'] = $data['purchase_unit_id'] = $data['sale_unit_id'] = 0;
        }
        elseif($data['type'] == 'digital' || $data['type'] == 'service')
            $data['cost'] = $data['unit_id'] = $data['purchase_unit_id'] = $data['sale_unit_id'] = 0;

        if(!isset($data['featured']))
            $data['featured'] = 0;

        if(!isset($data['is_embeded']))
            $data['is_embeded'] = 0;

        if(!isset($data['promotion']))
            $data['promotion'] = null;

        if(!isset($data['is_batch']))
            $data['is_batch'] = null;

        if(!isset($data['is_imei']))
            $data['is_imei'] = null;

        if(!isset($data['is_sync_disable']) && \Schema::hasColumn('products', 'is_sync_disable'))
            $data['is_sync_disable'] = null;

        if(isset($data['short_description']))
            $data['short_description'] = $data['short_description'];
        $data['product_details'] = str_replace('"', '@', $data['product_details']);
        if($data['starting_date'])
            $data['starting_date'] = date('Y-m-d', strtotime($data['starting_date']));
        if($data['last_date'])
            $data['last_date'] = date('Y-m-d', strtotime($data['last_date']));

        $previous_images = [];
        //dealing with previous images
        if($request->prev_img) {
            foreach ($request->prev_img as $key => $prev_img) {
                if(!in_array($prev_img, $previous_images))
                    $previous_images[] = $prev_img;
            }
            $lims_product_data->image = implode(",", $previous_images);
            $lims_product_data->save();
        }
        else {
            $lims_product_data->image = null;
            $lims_product_data->save();
        }

            //dealing with new images
            if ($request->image) {
                // Ensure the necessary directories exist using public_path()
                $this->diffSizeOfImagePathExistOrCreate();

                $images = $request->image;
                $image_names = [];
                $length = count(explode(",", $lims_product_data->image));

                foreach ($images as $key => $image) {
                    $ext = pathinfo($image->getClientOriginalName(), PATHINFO_EXTENSION);

                    if (!config('database.connections.saleprosaas_landlord')) {
                        $imageName = date("Ymdhis") . ($length + $key + 1) . '.' . $ext;
                    } else {
                        $imageName = $this->getTenantId() . '_' . date("Ymdhis") . ($length + $key + 1) . '.' . $ext;
                    }

                    $image->move(public_path('images/product'), $imageName);

                    $manager = new ImageManager();
                    $image = $manager->make(public_path('images/product/'). $imageName);

                    $image->fit(1000, 1250)->save(public_path('images/product/xlarge/'). $imageName, 100);

                    $image->fit(500, 500)->save(public_path('images/product/large/'). $imageName, 100);

                    $image->fit(250, 250)->save(public_path('images/product/medium/' . $imageName), 100);

                    $image->fit(100, 100)->save(public_path('images/product/small/' . $imageName), 100);

                    $image_names[] = $imageName;
                }

                // Append or set the image field with the new image names
                if($lims_product_data->image)
                    $data['image'] = $lims_product_data->image. ',' . implode(",", $image_names);
                else
                    $data['image'] = implode(",", $image_names);
            }
            else
                $data['image'] = $lims_product_data->image;

            $file = $request->file;
            if ($file) {
                $ext = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);
                $fileName = strtotime(date('Y-m-d H:i:s'));
                $fileName = $fileName . '.' . $ext;
                $file->move(public_path('product/files'), $fileName);
                $data['file'] = $fileName;
            }

            $old_product_variant_ids = ProductVariant::where('product_id', $request->input('id'))->pluck('id')->toArray();
            $new_product_variant_ids = [];
            //dealing with product variant
            if(isset($data['is_variant'])) {
                if(isset($data['variant_option']) && isset($data['variant_value'])) {
                    $data['variant_option'] = json_encode(array_unique($data['variant_option']));
                    $data['variant_value'] = json_encode(array_unique($data['variant_value']));
                }
                foreach ($data['variant_name'] as $key => $variant_name) {
                    $lims_variant_data = Variant::firstOrCreate(['name' => $data['variant_name'][$key]]);
                    $lims_product_variant_data = ProductVariant::where([
                                                    ['product_id', $lims_product_data->id],
                                                    ['variant_id', $lims_variant_data->id]
                                                ])->first();
                    if($lims_product_variant_data) {
                        $lims_product_variant_data->update([
                            'position' => $key+1,
                            'item_code' => $data['item_code'][$key],
                            'additional_cost' => $data['additional_cost'][$key],
                            'additional_price' => $data['additional_price'][$key]
                        ]);
                    }
                    else {
                        $lims_product_variant_data = ProductVariant::firstOrNew([
                            'product_id' => $lims_product_data->id,
                            'variant_id' => $lims_variant_data->id,
                            'item_code' => $data['item_code'][$key],
                            'additional_cost' => $data['additional_cost'][$key],
                            'additional_price' => $data['additional_price'][$key],
                            'qty' => 0,
                        ]);
                        $lims_product_variant_data->position = $key + 1;
                        $lims_product_variant_data->save();
                    }
                    $new_product_variant_ids[] = $lims_product_variant_data->id;
                }
            }
            else {
                $data['is_variant'] = null;
                $data['variant_option'] = null;
                $data['variant_value'] = null;
            }
            //deleting old product variant if not exist
            foreach ($old_product_variant_ids as $key => $product_variant_id) {
                if (!in_array($product_variant_id, $new_product_variant_ids))
                    ProductVariant::find($product_variant_id)->delete();
            }
            if(isset($data['is_diffPrice'])) {
                foreach ($data['diff_price'] as $key => $diff_price) {
                    if($diff_price) {
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($lims_product_data->id, $data['warehouse_id'][$key])->first();
                        if($lims_product_warehouse_data) {
                            $lims_product_warehouse_data->price = $diff_price;
                            $lims_product_warehouse_data->save();
                        }
                        else {
                            Product_Warehouse::firstOrCreate([
                                "product_id" => $lims_product_data->id,
                                "warehouse_id" => $data["warehouse_id"][$key],
                                "qty" => 0,
                                "price" => $diff_price
                            ]);
                        }
                    }
                }
            }
            else {
                $data['is_diffPrice'] = false;
                if(isset($data['warehouse_id'])){
                    foreach ($data['warehouse_id'] as $key => $warehouse_id) {
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($lims_product_data->id, $warehouse_id)->first();
                        if($lims_product_warehouse_data) {
                            $lims_product_warehouse_data->price = null;
                            $lims_product_warehouse_data->save();
                        }
                    }
                }
            }
            // handle warranty and guarantee
            if (!isset($data['warranty'])) {
                $data['warranty'] = null;
                $data['warranty_type'] = null;
            }
            if (!isset($data['guarantee'])) {
                $data['guarantee'] = null;
                $data['guarantee_type'] = null;
            }
            $lims_product_data->update($data);
            //inserting data for custom fields
            $custom_field_data = [];
            $custom_fields = CustomField::where('belongs_to', 'product')->select('name', 'type')->get();
            foreach ($custom_fields as $type => $custom_field) {
                $field_name = str_replace(' ', '_', strtolower($custom_field->name));
                if(isset($data[$field_name])) {
                    if($custom_field->type == 'checkbox' || $custom_field->type == 'multi_select')
                        $custom_field_data[$field_name] = implode(",", $data[$field_name]);
                    else
                        $custom_field_data[$field_name] = $data[$field_name];
                }
            }
            if(count($custom_field_data))
                DB::table('products')->where('id', $lims_product_data->id)->update($custom_field_data);
            $this->cacheForget('product_list');
            $this->cacheForget('product_list_with_variant');
           return response()->json([
                'success' => true,
                'message' => 'Product updated successfully.',
                'data' => $lims_product_data,
            ], 200);
    }

    public function destroy(Product $product)
    {
        $product->is_active = false;
        if($product->image != 'zummXD2dvAtI.png') {
            $images = explode(",", $product->image);
            foreach ($images as $key => $image) {
                $this->fileDelete(public_path('images/product/'), $image);
                $this->fileDelete(public_path('images/product/large/'), $image);
                $this->fileDelete(public_path('images/product/medium/'), $image);
                $this->fileDelete(public_path('images/product/small/'), $image);
            }
        }
        $product->save();
        $this->cacheForget('product_list');
        $this->cacheForget('product_list_with_variant');
      
        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.'
        ], 200);
        
    }
    
    public function generateCode()
    {
        $id = Keygen::numeric(8)->generate();
        return response()->json(['code'=>$id]);
    }
   
}
