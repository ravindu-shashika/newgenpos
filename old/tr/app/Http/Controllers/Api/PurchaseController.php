<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\PurchaseCollection;
use App\Http\Requests\PurchaseRequest;
use App\Models\Warehouse;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\Account;
use App\Models\Purchase;
use App\Models\ProductPurchase;
use App\Models\Product_Warehouse;
use App\Models\Payment;
use App\Models\PaymentWithCheque;
use App\Models\PaymentWithCreditCard;
use App\Models\PosSetting;
use App\Models\Currency;
use App\Models\CustomField;
use DB;
use App\Models\GeneralSetting;
use Stripe\Stripe;
use Auth;
use App\Models\User;
use App\Models\ProductVariant;
use App\Models\ProductBatch;
use App\Models\Variant;
use App\Traits\StaffAccess;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use App\Traits\TenantInfo;

class PurchaseController extends Controller
{
    use TenantInfo, StaffAccess;
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('purchases-index')) {
            $perPage = $request->input('per_page', 10);
            $purchases = Purchase::orderBy('created_at', 'desc')->paginate($perPage);
            
            return new PurchaseCollection($purchases);
            
        }
    }
    
    private function isImeiExist(string $imei, string $product_id): bool
    {
        $product_warehouses = Product_Warehouse::where('product_id', $product_id)->get();
        foreach ($product_warehouses as $p) {
            $imeis = explode(',', $p->imei_number);
            if (in_array(trim($imei), array_map('trim', $imeis))) {
                return true;
            }
        }

        return false;
    }
    
    public function store(PurchaseRequest $request)
    {
        DB::beginTransaction();

        try {
            $data = $request->except('document');
            $data['user_id'] = Auth::id();
            
            if(!isset($data['reference_no']))
            {
                $data['reference_no'] = 'pr-' . date("Ymd") . '-'. date("his");
            }
            
            $document = $request->file('document');
            // return dd($data);
            if ($document) {
                $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
                $documentName = date("Ymdhis");
                if(!config('database.connections.saleprosaas_landlord')) {
                    $documentName = $documentName . '.' . $ext;
                    $document->move(public_path('documents/purchase'), $documentName);
                }
                else {
                    $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                    $document->move(public_path('documents/purchase'), $documentName);
                }
                $data['document'] = $documentName;
            }

            if(isset($data['created_at'])) {
                $data['created_at'] = str_replace("/","-",$data['created_at']);
                $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
            }
            else
                $data['created_at'] = date("Y-m-d H:i:s");
            // return dd($data);
            $lims_purchase_data = Purchase::create($data);
            // return $lims_purchase_data;
            //inserting data for custom fields
            $custom_field_data = [];
            $custom_fields = CustomField::where('belongs_to', 'purchase')->select('name', 'type')->get();
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
                DB::table('purchases')->where('id', $lims_purchase_data->id)->update($custom_field_data);
            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            $recieved = $data['recieved'];
            $batch_no = $data['batch_no'];
            $expired_date = $data['expired_date'];
            $purchase_unit = $data['purchase_unit'];
            $net_unit_cost = $data['net_unit_cost'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];
            $imei_numbers = $data['imei_number'];
            $product_purchase = [];

            foreach ($product_id as $i => $id) {
                $lims_purchase_unit_data  = Unit::where('unit_name', $purchase_unit[$i])->first();

                if ($lims_purchase_unit_data->operator == '*') {
                    $quantity = $recieved[$i] * $lims_purchase_unit_data->operation_value;
                } else {
                    $quantity = $recieved[$i] / $lims_purchase_unit_data->operation_value;
                }
                $lims_product_data = Product::find($id);
                $price = $lims_product_data->price;
                //dealing with product barch
                if($batch_no[$i]) {
                    $product_batch_data = ProductBatch::where([
                                            ['product_id', $lims_product_data->id],
                                            ['batch_no', $batch_no[$i]]
                                        ])->first();
                    if($product_batch_data) {
                        $product_batch_data->expired_date = $expired_date[$i];
                        $product_batch_data->qty += $quantity;
                        $product_batch_data->save();
                    }
                    else {
                        $product_batch_data = ProductBatch::create([
                                                'product_id' => $lims_product_data->id,
                                                'batch_no' => $batch_no[$i],
                                                'expired_date' => $expired_date[$i],
                                                'qty' => $quantity
                                            ]);
                    }
                    $product_purchase['product_batch_id'] = $product_batch_data->id;
                }
                else
                    $product_purchase['product_batch_id'] = null;

                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($lims_product_data->id, $product_code[$i])->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $id],
                        ['variant_id', $lims_product_variant_data->variant_id],
                        ['warehouse_id', $data['warehouse_id']]
                    ])->first();
                    $product_purchase['variant_id'] = $lims_product_variant_data->variant_id;
                    //add quantity to product variant table
                    $lims_product_variant_data->qty += $quantity;
                    $lims_product_variant_data->save();

                    // Update product name with variant
                    // if (strpos($lims_product_data->name, ")")) {
                    //     continue;
                    // }
                    // $variant = Variant::where('id', $lims_product_variant_data->variant_id)->select('name')->first();
                    // $lims_product_data->name = $lims_product_data->name . '(' . $variant->name . ')';
                    // $lims_product_data->save();
                }
                else {
                    $product_purchase['variant_id'] = null;
                    if($product_purchase['product_batch_id']) {
                        //checking for price
                        $lims_product_warehouse_data = Product_Warehouse::where([
                                                        ['product_id', $id],
                                                        ['warehouse_id', $data['warehouse_id'] ],
                                                    ])
                                                    ->whereNotNull('price')
                                                    ->select('price')
                                                    ->first();
                        if($lims_product_warehouse_data)
                            $price = $lims_product_warehouse_data->price;
                        else
                            $price = null;
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $id],
                            ['product_batch_id', $product_purchase['product_batch_id'] ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $id],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                }
                //add quantity to product table
                $lims_product_data->qty = $lims_product_data->qty + $quantity;
                $lims_product_data->save();
                //add quantity to warehouse
                if ($lims_product_warehouse_data) {
                    $lims_product_warehouse_data->qty = $lims_product_warehouse_data->qty + $quantity;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                }
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $id;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                    $lims_product_warehouse_data->warehouse_id = $data['warehouse_id'];
                    $lims_product_warehouse_data->qty = $quantity;
                    if($price)
                        $lims_product_warehouse_data->price = $price;
                    if($lims_product_data->is_variant)
                        $lims_product_warehouse_data->variant_id = $lims_product_variant_data->variant_id;
                }
                
                if($imei_numbers[$i]) {
                    // prevent duplication
                    $imeis = explode(',', $imei_numbers[$i]);
                    $imeis = array_map('trim', $imeis);
                    if (count($imeis) !== count(array_unique($imeis))) {
                        DB::rollBack();
                        return redirect('purchases/create')->with('not_permitted', 'Duplicate IMEI not allowed!');
                    }
                    foreach ($imeis as $imei) {
                        if ($this->isImeiExist($imei, $id)) {
                            DB::rollBack();
                            return redirect('purchases/create')->with('not_permitted', 'Duplicate IMEI not allowed!');
                        }
                    }
                    //added imei numbers to product_warehouse table
                    if($lims_product_warehouse_data->imei_number)
                        $lims_product_warehouse_data->imei_number .= ',' . $imei_numbers[$i];
                    else
                        $lims_product_warehouse_data->imei_number = $imei_numbers[$i];
                }
                $lims_product_warehouse_data->save();

                $product_purchase['purchase_id'] = $lims_purchase_data->id ;
                $product_purchase['product_id'] = $id;
                $product_purchase['imei_number'] = $imei_numbers[$i];
                $product_purchase['qty'] = $qty[$i];
                $product_purchase['recieved'] = $recieved[$i];
                $product_purchase['purchase_unit_id'] = $lims_purchase_unit_data->id;
                $product_purchase['net_unit_cost'] = $net_unit_cost[$i];
                $product_purchase['discount'] = $discount[$i];
                $product_purchase['tax_rate'] = $tax_rate[$i];
                $product_purchase['tax'] = $tax[$i];
                $product_purchase['total'] = $total[$i];
                ProductPurchase::create($product_purchase);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase created successfully.',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback transaction if an error occurs
            return response()->json([
                'success' => false,
                'message' => 'Transaction failed: ' . $e->getMessage()
            ], 400);
        }
    }
    
    public function update(PurchaseRequest $request, $id)
    {
        $lims_purchase_data = Purchase::find($id);
        $data = $request->except('document');
        $document = $request->file('document');
        if ($document) {

            $this->fileDelete(public_path('documents/purchase/'), $lims_purchase_data->document);

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/purchase'), $documentName);
            }
            $data['document'] = $documentName;
        }
        //return dd($data);
        DB::beginTransaction();

        try {
            $balance = (float)$data['grand_total'] - (float)$data['paid_amount'];
            if ($balance < 0 || $balance > 0) {
                $data['payment_status'] = 1;
            } else {
                $data['payment_status'] = 2;
            }
            $lims_product_purchase_data = ProductPurchase::where('purchase_id', $id)->get();

            $data['created_at'] = date("Y-m-d", strtotime(str_replace("/", "-", $data['created_at']))) . ' '. date("H:i:s");
            $product_id = $data['product_id'];
            $product_code = $data['product_code'];
            $qty = $data['qty'];
            $recieved = $data['recieved'];
            $batch_no = $data['batch_no'];
            $expired_date = $data['expired_date'];
            $purchase_unit = $data['purchase_unit'];
            $net_unit_cost = $data['net_unit_cost'];
            $discount = $data['discount'];
            $tax_rate = $data['tax_rate'];
            $tax = $data['tax'];
            $total = $data['subtotal'];
            $imei_number = $new_imei_number = $data['imei_number'];
            $product_purchase = [];

            foreach ($lims_product_purchase_data as $product_purchase_data) {

                $old_recieved_value = $product_purchase_data->recieved;
                $lims_purchase_unit_data = Unit::find($product_purchase_data->purchase_unit_id);

                if ($lims_purchase_unit_data->operator == '*') {
                    $old_recieved_value = $old_recieved_value * $lims_purchase_unit_data->operation_value;
                } else {
                    $old_recieved_value = $old_recieved_value / $lims_purchase_unit_data->operation_value;
                }
                $lims_product_data = Product::find($product_purchase_data->product_id);
                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProduct($lims_product_data->id, $product_purchase_data->variant_id)->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $lims_product_data->id],
                        ['variant_id', $product_purchase_data->variant_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id]
                    ])->first();
                    $lims_product_variant_data->qty -= $old_recieved_value;
                    $lims_product_variant_data->save();
                }
                elseif($product_purchase_data->product_batch_id) {
                    $product_batch_data = ProductBatch::find($product_purchase_data->product_batch_id);
                    $product_batch_data->qty -= $old_recieved_value;
                    $product_batch_data->save();

                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['product_batch_id', $product_purchase_data->product_batch_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                else {
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $product_purchase_data->product_id],
                        ['warehouse_id', $lims_purchase_data->warehouse_id],
                    ])->first();
                }
                if($product_purchase_data->imei_number) {
                    $position = array_search($lims_product_data->id, $product_id);
                    if($imei_number[$position]) {
                        $prev_imei_numbers = explode(",", $product_purchase_data->imei_number);
                        $new_imei_numbers = explode(",", $imei_number[$position]);
                        $temp_imeis = explode(',', $lims_product_warehouse_data->imei_number);
                        foreach ($prev_imei_numbers as $prev_imei_number) {
                            // $pos = array_search($prev_imei_number, $new_imei_numbers);
                            // if ($pos !== false) {
                            //     unset($new_imei_numbers[$pos]);
                            // }
                            $pos = array_search($prev_imei_number, $temp_imeis);
                            if ($pos !== false) {
                                unset($temp_imeis[$pos]);
                            }
                        }

                        // return dd($prev_imei_number, $temp_imeis);
                        $lims_product_warehouse_data->imei_number = !empty($temp_imeis) ? implode(',', $temp_imeis) : null;

                        $new_imei_number[$position] = implode(",", $new_imei_numbers);
                    }
                }
                $lims_product_data->qty -= $old_recieved_value;
                if($lims_product_warehouse_data) {
                    $lims_product_warehouse_data->qty -= $old_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                $lims_product_data->save();
                $product_purchase_data->delete();
            }

            foreach ($product_id as $key => $pro_id) {
                $lims_purchase_unit_data = Unit::where('unit_name', $purchase_unit[$key])->first();
                if ($lims_purchase_unit_data->operator == '*') {
                    $new_recieved_value = $recieved[$key] * $lims_purchase_unit_data->operation_value;
                } else {
                    $new_recieved_value = $recieved[$key] / $lims_purchase_unit_data->operation_value;
                }

                $lims_product_data = Product::find($pro_id);
                $price = null;
                //dealing with product barch
                if($batch_no[$key]) {
                    $product_batch_data = ProductBatch::where([
                                            ['product_id', $lims_product_data->id],
                                            ['batch_no', $batch_no[$key]]
                                        ])->first();
                    if($product_batch_data) {
                        $product_batch_data->qty += $new_recieved_value;
                        $product_batch_data->expired_date = $expired_date[$key];
                        $product_batch_data->save();
                    }
                    else {
                        $product_batch_data = ProductBatch::create([
                                                'product_id' => $lims_product_data->id,
                                                'batch_no' => $batch_no[$key],
                                                'expired_date' => $expired_date[$key],
                                                'qty' => $new_recieved_value
                                            ]);
                    }
                    $product_purchase['product_batch_id'] = $product_batch_data->id;
                }
                else
                    $product_purchase['product_batch_id'] = null;

                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($pro_id, $product_code[$key])->first();
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $pro_id],
                        ['variant_id', $lims_product_variant_data->variant_id],
                        ['warehouse_id', $data['warehouse_id']]
                    ])->first();
                    $product_purchase['variant_id'] = $lims_product_variant_data->variant_id;
                    //add quantity to product variant table
                    $lims_product_variant_data->qty += $new_recieved_value;
                    $lims_product_variant_data->save();
                }
                else {
                    $product_purchase['variant_id'] = null;
                    if($product_purchase['product_batch_id']) {
                        //checking for price
                        $lims_product_warehouse_data = Product_Warehouse::where([
                                                        ['product_id', $pro_id],
                                                        ['warehouse_id', $data['warehouse_id'] ],
                                                    ])
                                                    ->whereNotNull('price')
                                                    ->select('price')
                                                    ->first();
                        if($lims_product_warehouse_data)
                            $price = $lims_product_warehouse_data->price;

                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['product_batch_id', $product_purchase['product_batch_id'] ],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_id', $pro_id],
                            ['warehouse_id', $data['warehouse_id'] ],
                        ])->first();
                    }
                }

                $lims_product_data->qty += $new_recieved_value;
                if($lims_product_warehouse_data){
                    $lims_product_warehouse_data->qty += $new_recieved_value;
                    $lims_product_warehouse_data->save();
                }
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $pro_id;
                    $lims_product_warehouse_data->product_batch_id = $product_purchase['product_batch_id'];
                    if($lims_product_data->is_variant)
                        $lims_product_warehouse_data->variant_id = $lims_product_variant_data->variant_id;
                    $lims_product_warehouse_data->warehouse_id = $data['warehouse_id'];
                    $lims_product_warehouse_data->qty = $new_recieved_value;
                    if($price)
                        $lims_product_warehouse_data->price = $price;
                }
                //dealing with imei numbers
                if($new_imei_number[$key]) {
                    // prevent duplication
                    $imeis = explode(',', $new_imei_number[$key]);
                    $imeis = array_map('trim', $imeis);
                    if (count($imeis) !== count(array_unique($imeis))) {
                        DB::rollBack();
                        return redirect()->route('purchases.edit', $id)->with('not_permitted', 'Duplicate IMEI not allowed!');
                    }
                    foreach ($imeis as $imei) {
                        if ($this->isImeiExist($imei, $product_purchase_data->product_id)) {
                            DB::rollBack();
                            return redirect()->route('purchases.edit', $id)->with('not_permitted', 'Duplicate IMEI not allowed!');
                        }
                    }

                    if(isset($lims_product_warehouse_data->imei_number)) {
                        $lims_product_warehouse_data->imei_number .= ',' . $new_imei_number[$key];
                    }
                    else {
                        $lims_product_warehouse_data->imei_number = $new_imei_number[$key];
                    }
                }

                $lims_product_data->save();
                $lims_product_warehouse_data->save();

                $product_purchase['purchase_id'] = $id ;
                $product_purchase['product_id'] = $pro_id;
                $product_purchase['qty'] = $qty[$key];
                $product_purchase['recieved'] = $recieved[$key];
                $product_purchase['purchase_unit_id'] = $lims_purchase_unit_data->id;
                $product_purchase['net_unit_cost'] = $net_unit_cost[$key];
                $product_purchase['discount'] = $discount[$key];
                $product_purchase['tax_rate'] = $tax_rate[$key];
                $product_purchase['tax'] = $tax[$key];
                $product_purchase['total'] = $total[$key];
                $product_purchase['imei_number'] = $imei_number[$key] ?? null;
                ProductPurchase::create($product_purchase);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully.',
            ], 200);
        } catch(\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
        $lims_purchase_data->update($data);
        //inserting data for custom fields
        $custom_field_data = [];
        $custom_fields = CustomField::where('belongs_to', 'purchase')->select('name', 'type')->get();
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
            DB::table('purchases')->where('id', $lims_purchase_data->id)->update($custom_field_data);
        return redirect('purchases')->with('message', 'Purchase updated successfully');
    }
    
    public function show(Purchase $purchase)
    {
        return response()->json(
            new PurchaseResource($purchase)
        );
    }
    public function destroy()
    {
        
    }
}
