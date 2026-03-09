<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\TransferResource;
use App\Http\Requests\StoreTransferRequest;
use DB;
use Auth;
use App\Models\Tax;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Transfer;
use App\Models\Warehouse;
use App\Models\MailSetting;
use App\Models\ProductBatch;
use App\Mail\TransferDetails;
use App\Models\ProductVariant;
use App\Models\ProductPurchase;
use App\Models\ProductTransfer;
use App\Models\Product_Warehouse;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;

class TransferController extends Controller
{
    use \App\Traits\MailInfo;
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('transfers-index')) {
            $permissions = $role->permissions;
            foreach ($permissions as $permission)
                $all_permission[] = $permission->name;
            if(empty($all_permission))
                $all_permission[] = 'dummy text';

            if($request->input('from_warehouse_id'))
                $from_warehouse_id = $request->input('from_warehouse_id');
            else
                $from_warehouse_id = 0;

            if($request->input('to_warehouse_id'))
                $to_warehouse_id = $request->input('to_warehouse_id');
            else
                $to_warehouse_id = 0;

            if($request->input('starting_date')) {
                $starting_date = $request->input('starting_date');
                $ending_date = $request->input('ending_date');
            }
            else {
                $starting_date = date("Y-m-d", strtotime(date('Y-m-d', strtotime('-1 year', strtotime(date('Y-m-d') )))));
                $ending_date = date("Y-m-d");
            }
            
            // $from_warehouse_id = $request->input('from_warehouse_id');
            // $to_warehouse_id = $request->input('to_warehouse_id');
            // $q = Transfer::whereDate('created_at', '>=' ,$request->input('starting_date'))
            //              ->whereDate('created_at', '<=' ,$request->input('ending_date'));
            // if(Auth::user()->role_id > 2 && config('staff_access') == 'own')
            //     $q = $q->where('user_id', Auth::id());
            // elseif(Auth::user()->role_id > 2 && config('staff_access') == 'warehouse')
            //     $q = $q->where('from_warehouse_id', Auth::user()->warehouse_id)->orWhere('to_warehouse_id', Auth::user()->warehouse_id);
            // if($from_warehouse_id)
            //     $q = $q->where('from_warehouse_id', $from_warehouse_id);
            // if($to_warehouse_id)
            //     $q = $q->where('to_warehouse_id', $to_warehouse_id);
                
            $transfers = Transfer::with('fromWarehouse', 'toWarehouse', 'user')
                        ->orderBy('created_at','desc')
                        ->get();
            
            return response()->json(TransferResource::collection($transfers));
           
        }
        else{
            return response()->json([
                'success' => false,
                'message' => 'Sorry! You are not allowed to access this module'
            ]);
        }
    }
    
    public function store(StoreTransferRequest $request)
    {
        $data = $request->except('document');

        $data['user_id'] = Auth::id();
        $data['reference_no'] = 'tr-' . date("Ymd") . '-'. date("his");
        if(isset($data['created_at']))
            $data['created_at'] = date("Y-m-d H:i:s", strtotime($data['created_at']));
        else
            $data['created_at'] = date("Y-m-d H:i:s");
        $document = $request->document;
        if ($document) {
            $v = Validator::make(
                [
                    'extension' => strtolower($request->document->getClientOriginalExtension()),
                ],
                [
                    'extension' => 'in:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt',
                ]
            );
            if ($v->fails())
                return redirect()->back()->withErrors($v->errors());

            $documentName = $document->getClientOriginalName();
            $document->move(public_path('documents/transfer'), $documentName);
            $data['document'] = $documentName;
        }
        $lims_transfer_data = Transfer::create($data);

        $product_id = $data['product_id'];
        $imei_number = $data['imei_number'];
        $product_batch_id = $data['product_batch_id'];
        $product_code = $data['product_code'];
        $qty = $data['qty'];
        $purchase_unit = $data['purchase_unit'];
        $net_unit_cost = $data['net_unit_cost'];
        $tax_rate = $data['tax_rate'];
        $tax = $data['tax'];
        $total = $data['subtotal'];
        $product_transfer = [];

        foreach ($product_id as $i => $id) {
            $lims_purchase_unit_data  = Unit::where('unit_name', $purchase_unit[$i])->first();
            $product_transfer['variant_id'] = null;
            $product_transfer['product_batch_id'] = null;

            //get product data
            $lims_product_data = Product::select('is_variant')->find($id);
            if($lims_product_data->is_variant) {
                $lims_product_variant_data = ProductVariant::select('variant_id')->FindExactProductWithCode($id, $product_code[$i])->first();
                $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($id, $lims_product_variant_data->variant_id, $data['from_warehouse_id'])->first();
                $product_transfer['variant_id'] = $lims_product_variant_data->variant_id;
            }
            elseif($product_batch_id[$i]) {
                $lims_product_warehouse_data = Product_Warehouse::where([
                    ['product_batch_id', $product_batch_id[$i] ],
                    ['warehouse_id', $data['from_warehouse_id'] ]
                ])->first();
                $product_transfer['product_batch_id'] = $product_batch_id[$i];
            }
            else {
                $lims_product_warehouse_data = Product_Warehouse::where([
                    ['product_id', $id],
                    ['warehouse_id', $data['from_warehouse_id'] ],
                    ])->first();
            }

            if($data['status'] != 2) {
                if ($lims_purchase_unit_data->operator == '*')
                    $quantity = $qty[$i] * $lims_purchase_unit_data->operation_value;
                else
                    $quantity = $qty[$i] / $lims_purchase_unit_data->operation_value;
                //deduct imei number if available
                if($imei_number[$i]) {
                    $imei_numbers = explode(",", $imei_number[$i]);
                    $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                    foreach ($imei_numbers as $number) {
                        if (($j = array_search($number, $all_imei_numbers)) !== false) {
                            unset($all_imei_numbers[$j]);
                        }
                    }
                    $lims_product_warehouse_data->imei_number = implode(",", $all_imei_numbers);
                }
            }
            else
                $quantity = 0;
            //deduct quantity from sending warehouse
            $lims_product_warehouse_data->qty -= $quantity;
            $lims_product_warehouse_data->save();

            if($data['status'] == 1) {
                if($lims_product_data->is_variant) {
                    $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($id, $lims_product_variant_data->variant_id, $data['to_warehouse_id'])->first();
                }
                elseif($product_batch_id[$i]) {
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_batch_id', $product_batch_id[$i] ],
                        ['warehouse_id', $data['to_warehouse_id'] ]
                    ])->first();
                }
                else {
                    $lims_product_warehouse_data = Product_Warehouse::where([
                        ['product_id', $id],
                        ['warehouse_id', $data['to_warehouse_id'] ],
                    ])->first();
                }
                //add quantity to destination warehouse
                if ($lims_product_warehouse_data)
                    $lims_product_warehouse_data->qty += $quantity;
                else {
                    $lims_product_warehouse_data = new Product_Warehouse();
                    $lims_product_warehouse_data->product_id = $id;
                    $lims_product_warehouse_data->product_batch_id = $product_transfer['product_batch_id'];
                    $lims_product_warehouse_data->variant_id = $product_transfer['variant_id'];
                    $lims_product_warehouse_data->warehouse_id = $data['to_warehouse_id'];
                    $lims_product_warehouse_data->qty = $quantity;
                }
                //add imei number if available
                if($imei_number[$i]) {
                    if($lims_product_warehouse_data->imei_number)
                        $lims_product_warehouse_data->imei_number .= ',' . $imei_number[$i];
                    else
                        $lims_product_warehouse_data->imei_number = $imei_number[$i];
                }

                $lims_product_warehouse_data->save();
            }

            $product_transfer['transfer_id'] = $lims_transfer_data->id ;
            $product_transfer['product_id'] = $id;
            $product_transfer['imei_number'] = $imei_number[$i];
            $product_transfer['qty'] = $qty[$i];
            $product_transfer['purchase_unit_id'] = $lims_purchase_unit_data->id;
            $product_transfer['net_unit_cost'] = $net_unit_cost[$i];
            $product_transfer['tax_rate'] = $tax_rate[$i];
            $product_transfer['tax'] = $tax[$i];
            $product_transfer['total'] = $total[$i];
            ProductTransfer::create($product_transfer);
        }

        $message = 'Transfer created successfully';

        // Mail Send Start
        $mail_setting = MailSetting::latest()->first();
        $fromWareHouse = Warehouse::find($data['from_warehouse_id']);
        $toWareHouse = Warehouse::find($data['to_warehouse_id']);
        $mailData = [];

        //Data

        $mailData['date'] = date("Y-m-d", strtotime(str_replace("/", "-", $lims_transfer_data->created_at)));;
        $mailData['reference_no'] = $lims_transfer_data->reference_no;
        $mailData['status'] = $lims_transfer_data->status;
        $mailData['total_cost'] = $lims_transfer_data->total_cost;
        $mailData['shipping_cost'] = $lims_transfer_data->shipping_cost;
        $mailData['grand_total'] = $lims_transfer_data->grand_total;

        //From: Warehouse
        $mailData['from_warehouse'] = $fromWareHouse->name;
        $mailData['from_phone'] = $fromWareHouse->phone;
        $mailData['from_email'] = $fromWareHouse->email;
        $mailData['from_address'] = $fromWareHouse->address;

        //To: Warehouse
        $mailData['to_warehouse'] = $toWareHouse->name;
        $mailData['to_phone'] = $toWareHouse->phone;
        $mailData['to_email'] = $toWareHouse->email;
        $mailData['to_address'] = $toWareHouse->address;
        
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 201);
    }
    
    public function getProductTransferData($id)
    {
        $lims_product_transfer_data = ProductTransfer::where('transfer_id', $id)->get();
        foreach ($lims_product_transfer_data as $key => $product_transfer_data) {
            $product = Product::find($product_transfer_data->product_id);
            $unit = Unit::find($product_transfer_data->purchase_unit_id);
            if($product_transfer_data->variant_id) {
                $lims_product_variant_data = ProductVariant::select('item_code')->FindExactProduct($product_transfer_data->product_id, $product_transfer_data->variant_id)->first();
                $product->code = $lims_product_variant_data->item_code;
            }
            $product_transfer['products'][$key] = $product->name . ' [' . $product->code. ']';
            // if($product_transfer_data->imei_number)
            //     $product_transfer['imei_number'][$key] .= '<br>IMEI or Serial Number: ' . $product_transfer_data->imei_number;
            if (isset($product_transfer_data->imei_number)) {
                if (!isset($product_transfer['imei_number'][$key])) {
                    $product_transfer['imei_number'][$key] = '';  // Initialize the key if not already set
                }
                $product_transfer['imei_number'][$key] .= '<br>IMEI or Serial Number: ' . $product_transfer_data->imei_number;
            }
            $product_transfer['qty'][$key] = $product_transfer_data->qty;
            $product_transfer['unit'][$key] = $unit->unit_code;
            $product_transfer['tax'][$key] = $product_transfer_data->tax;
            $product_transfer['tax_rate'][$key] = $product_transfer_data->tax_rate;
            $product_transfer['total'][$key] = $product_transfer_data->total;
            if($product_transfer_data->product_batch_id) {
                $product_batch_data = ProductBatch::select('batch_no')->find($product_transfer_data->product_batch_id);
                $product_transfer['batch_no'][$key] = $product_batch_data->batch_no;
            }
            else
                $product_transfer['batch_no'][$key] = 'N/A';
        }
        return $product_transfer;
    }
}
