<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Resources\SaleResource;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Resources\SaleCollection;
use Illuminate\Support\Facades\Redirect;
use App\Models\Customer;
use App\Models\CustomerGroup;
use App\Models\Warehouse;
use App\Models\Biller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\Sale;
use App\Models\Delivery;
use App\Models\PosSetting;
use App\Models\Product_Sale;
use App\Models\Product_Warehouse;
use App\Models\Payment;
use App\Models\Account;
use App\Models\Coupon;
use App\Models\GiftCard;
use App\Models\PaymentWithCheque;
use App\Models\PaymentWithGiftCard;
use App\Models\PaymentWithCreditCard;
use App\Models\PaymentWithPaypal;
use App\Models\User;
use App\Models\Variant;
use App\Models\ProductVariant;
use App\Models\CashRegister;
use App\Models\Returns;
use App\Models\ProductReturn;
use App\Models\Expense;
use App\Models\ProductPurchase;
use App\Models\ProductBatch;
use App\Models\Purchase;
use App\Models\RewardPointSetting;
use App\Models\CustomField;
use App\Models\Table;
use App\Models\Courier;
use App\Models\ExternalService;
use DB;
use Cache;
use App\Models\GeneralSetting;
use App\Models\MailSetting;
use Stripe\Stripe;
use NumberToWords\NumberToWords;
use Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Mail\SaleDetails;
use App\Mail\LogMessage;
use App\Mail\PaymentDetails;
use Mail;
use Srmklive\PayPal\Services\ExpressCheckout;
use Srmklive\PayPal\Services\AdaptivePayments;
use GeniusTS\HijriDate\Date;
use Illuminate\Support\Facades\Validator;
use App\Models\Currency;
use App\Models\SaleWarrantyGuarantee;
use App\Models\SmsTemplate;
use App\Services\SmsService;
use App\SMSProviders\TonkraSms;
use App\ViewModels\ISmsModel;
use DateTime;
use PHPUnit\Framework\MockObject\Stub\ReturnSelf;
use Salla\ZATCA\GenerateQrCode;
use Salla\ZATCA\Tags\InvoiceDate;
use Salla\ZATCA\Tags\InvoiceTaxAmount;
use Salla\ZATCA\Tags\InvoiceTotalAmount;
use Salla\ZATCA\Tags\Seller;
use Salla\ZATCA\Tags\TaxNumber;

class SaleController extends Controller
{
    use \App\Traits\TenantInfo;
    use \App\Traits\MailInfo;

    private $_smsModel;

    public function __construct(ISmsModel $smsModel)
    {
        $this->_smsModel = $smsModel;
    }
    
    public function index(Request $request)
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('sales-index')) {
            $perPage = $request->input('per_page', 10);
            $sales = Sale::join('payments', 'sales.id', '=', 'payments.sale_id')
                           ->select('sales.id', 'sales.*')
                           ->orderBy('created_at','desc')
                           ->paginate($perPage);
            
            return new SaleCollection($sales);
            
        }
    }
    
    public function store(StoreSaleRequest $request)
    {
        $data = $request->all();
        $data['user_id'] = Auth::id();
        
        $cash_register_data = CashRegister::where([
            ['user_id', $data['user_id']],
            ['warehouse_id', $data['warehouse_id']],
            ['status', true]
        ])->first();
        
        if($cash_register_data)
            $data['cash_register_id'] = $cash_register_data->id;

        if(isset($data['created_at']))
            $data['created_at'] = date("Y-m-d", strtotime(str_replace("/", "-", $data['created_at']))) . ' '. date("H:i:s");
        else
            $data['created_at'] = date("Y-m-d H:i:s");
        
        //set the paid_amount value to $new_data variable
        $new_data['paid_amount'] = $data['paid_amount'];

        if (is_array($data['paid_amount'])) {
            $data['paid_amount'] = array_sum($data['paid_amount']);
        }
        
        // Sale from POS page
        if($data['pos']) {
            if(!isset($data['reference_no']))
                $data['reference_no'] = 'posr-' . date("Ymd") . '-'. date("his");

            $balance = $data['grand_total'] - $data['paid_amount'];

            if (is_array($data['paid_amount'])) {
                $data['paid_amount'] = array_sum($data['paid_amount']);
            }
            if($balance > 0 || $balance < 0)
                $data['payment_status'] = 2;
            else
                $data['payment_status'] = 4;

            if($data['draft']) {
                $lims_sale_data = Sale::find($data['sale_id']);
                $lims_product_sale_data = Product_Sale::where('sale_id', $data['sale_id'])->get();
                foreach ($lims_product_sale_data as $product_sale_data) {
                    $product_sale_data->delete();
                }
                $lims_sale_data->delete();
            }
        }
        else {
            if(!isset($data['reference_no']))
                $data['reference_no'] = 'sr-' . date("Ymd") . '-'. date("his");
        }
        
        //process document
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

            $ext = pathinfo($document->getClientOriginalName(), PATHINFO_EXTENSION);
            $documentName = date("Ymdhis");
            if(!config('database.connections.saleprosaas_landlord')) {
                $documentName = $documentName . '.' . $ext;
                $document->move(public_path('documents/sale'), $documentName);
            }
            else {
                $documentName = $this->getTenantId() . '_' . $documentName . '.' . $ext;
                $document->move(public_path('documents/sale'), $documentName);
            }
            $data['document'] = $documentName;
        }
        
        if($data['coupon_active']) {
            $lims_coupon_data = Coupon::find($data['coupon_id']);
            $lims_coupon_data->used += 1;
            $lims_coupon_data->save();
        }
        
        if(isset($data['table_id'])) {
            $latest_sale = Sale::whereNotNull('table_id')->whereDate('created_at', date('Y-m-d'))->where('warehouse_id', $data['warehouse_id'])->select('queue')->orderBy('id', 'desc')->first();
            if($latest_sale)
                $data['queue'] = $latest_sale->queue + 1;
            else
                $data['queue'] = 1;
        }

        //inserting data to sales table
        $lims_sale_data = Sale::create($data);

        // add the $new_data variable value to $data['paid_amount'] variable
        $data['paid_amount'] = $new_data['paid_amount'];
        
        //inserting data for custom fields
        $custom_field_data = [];
        $custom_fields = CustomField::where('belongs_to', 'sale')->select('name', 'type')->get();
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
            DB::table('sales')->where('id', $lims_sale_data->id)->update($custom_field_data);
        $lims_customer_data = Customer::find($data['customer_id']);
        $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
        //checking if customer gets some points or not
        if($lims_reward_point_setting_data && $lims_reward_point_setting_data->is_active &&  $data['grand_total'] >= $lims_reward_point_setting_data->minimum_amount) {
            $point = (int)($data['grand_total'] / $lims_reward_point_setting_data->per_point_amount);
            $lims_customer_data->points += $point;
            $lims_customer_data->save();
        }
        
        //collecting male data
        $mail_data['email'] = $lims_customer_data->email;
        $mail_data['reference_no'] = $lims_sale_data->reference_no;
        $mail_data['sale_status'] = $lims_sale_data->sale_status;
        $mail_data['payment_status'] = $lims_sale_data->payment_status;
        $mail_data['total_qty'] = $lims_sale_data->total_qty;
        $mail_data['total_price'] = $lims_sale_data->total_price;
        $mail_data['order_tax'] = $lims_sale_data->order_tax;
        $mail_data['order_tax_rate'] = $lims_sale_data->order_tax_rate;
        $mail_data['order_discount'] = $lims_sale_data->order_discount;
        $mail_data['shipping_cost'] = $lims_sale_data->shipping_cost;
        $mail_data['grand_total'] = $lims_sale_data->grand_total;
        $mail_data['paid_amount'] = $lims_sale_data->paid_amount;

        $product_id = $data['product_id'];
        $product_batch_id = $data['product_batch_id'];
        $imei_number = $data['imei_number'];
        $product_code = $data['product_code'];
        $qty = $data['qty'];
        $sale_unit = $data['sale_unit'];
        $net_unit_price = $data['net_unit_price'];
        $discount = $data['discount'];
        $tax_rate = $data['tax_rate'];
        $tax = $data['tax'];
        $total = $data['subtotal'];
        $product_sale = [];
        
        foreach ($product_id as $i => $id) {
            $lims_product_data = Product::where('id', $id)->first();
            // DB::rollback();
            $product_sale['variant_id'] = null;
            $product_sale['product_batch_id'] = null;
            if($lims_product_data->type == 'combo' && $data['sale_status'] == 1){
                if(!in_array('manufacturing',explode(',',config('addons')))) {
                    $product_list = explode(",", $lims_product_data->product_list);
                    $variant_list = explode(",", $lims_product_data->variant_list);
                    if($lims_product_data->variant_list)
                        $variant_list = explode(",", $lims_product_data->variant_list);
                    else
                        $variant_list = [];
                    $qty_list = explode(",", $lims_product_data->qty_list);
                    $price_list = explode(",", $lims_product_data->price_list);

                    foreach ($product_list as $key => $child_id) {
                        $child_data = Product::find($child_id);
                        if(count($variant_list) && $variant_list[$key]) {
                            $child_product_variant_data = ProductVariant::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$key]]
                            ])->first();

                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['variant_id', $variant_list[$key]],
                                ['warehouse_id', $data['warehouse_id'] ],
                            ])->first();

                            $child_product_variant_data->qty -= $qty[$i] * $qty_list[$key];
                            $child_product_variant_data->save();
                        }
                        else {
                            $child_warehouse_data = Product_Warehouse::where([
                                ['product_id', $child_id],
                                ['warehouse_id', $data['warehouse_id'] ],
                            ])->first();
                        }

                        $child_data->qty -= $qty[$i] * $qty_list[$key];
                        $child_warehouse_data->qty -= $qty[$i] * $qty_list[$key];

                        $child_data->save();
                        $child_warehouse_data->save();
                    }
                }
            }

            if($sale_unit[$i] != 'n/a') {
                $lims_sale_unit_data  = Unit::where('unit_name', $sale_unit[$i])->first();
                $sale_unit_id = $lims_sale_unit_data->id;
                if($lims_product_data->is_variant) {
                    $lims_product_variant_data = ProductVariant::select('id', 'variant_id', 'qty')->FindExactProductWithCode($id, $product_code[$i])->first();
                    $product_sale['variant_id'] = $lims_product_variant_data->variant_id;
                }
                if($lims_product_data->is_batch && $product_batch_id[$i]) {
                    $product_sale['product_batch_id'] = $product_batch_id[$i];
                }

                if($data['sale_status'] == 1) {
                    if($lims_sale_unit_data->operator == '*')
                        $quantity = $qty[$i] * $lims_sale_unit_data->operation_value;
                    elseif($lims_sale_unit_data->operator == '/')
                        $quantity = $qty[$i] / $lims_sale_unit_data->operation_value;
                    //deduct quantity
                    $lims_product_data->qty = $lims_product_data->qty - $quantity;
                    $lims_product_data->save();
                    //deduct product variant quantity if exist
                    if($lims_product_data->is_variant) {
                        $lims_product_variant_data->qty -= $quantity;
                        $lims_product_variant_data->save();
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithVariant($id, $lims_product_variant_data->variant_id, $data['warehouse_id'])->first();
                    }
                    elseif($product_batch_id[$i]) {
                        $lims_product_warehouse_data = Product_Warehouse::where([
                            ['product_batch_id', $product_batch_id[$i] ],
                            ['warehouse_id', $data['warehouse_id'] ]
                        ])->first();
                        $lims_product_batch_data = ProductBatch::find($product_batch_id[$i]);
                        //deduct product batch quantity
                        $lims_product_batch_data->qty -= $quantity;
                        $lims_product_batch_data->save();
                    }
                    else {
                        $lims_product_warehouse_data = Product_Warehouse::FindProductWithoutVariant($id, $data['warehouse_id'])->first();
                    }
                    //deduct quantity from warehouse
                    $lims_product_warehouse_data->qty -= $quantity;
                    $lims_product_warehouse_data->save();
                }
            }
            else
                $sale_unit_id = 0;

            if($product_sale['variant_id']) {
                $variant_data = Variant::select('name')->find($product_sale['variant_id']);
                $mail_data['products'][$i] = $lims_product_data->name . ' ['. $variant_data->name .']';
            }
            else
            $mail_data['products'][$i] = $lims_product_data->name;
            //deduct imei number if available
            if($imei_number[$i] && !str_contains($imei_number[$i], "null") && $data['sale_status'] == 1) {
                $imei_numbers = explode(",", $imei_number[$i]);
                $all_imei_numbers = explode(",", $lims_product_warehouse_data->imei_number);
                foreach ($imei_numbers as $number) {
                    if (($j = array_search($number, $all_imei_numbers)) !== false) {
                        unset($all_imei_numbers[$j]);
                    }
                }

                $lims_product_warehouse_data->imei_number = implode(",", $all_imei_numbers);
                $lims_product_warehouse_data->save();
            }
            if($lims_product_data->type == 'digital')
                $mail_data['file'][$i] = url('/product/files').'/'.$lims_product_data->file;
            else
                $mail_data['file'][$i] = '';
            if($sale_unit_id)
                $mail_data['unit'][$i] = $lims_sale_unit_data->unit_code;
            else
                $mail_data['unit'][$i] = '';

            $product_sale['sale_id'] = $lims_sale_data->id ;
            $product_sale['product_id'] = $id;
            $product_sale['imei_number'] = $imei_number[$i];
            $product_sale['qty'] = $mail_data['qty'][$i] = $qty[$i];
            $product_sale['sale_unit_id'] = $sale_unit_id;
            $product_sale['net_unit_price'] = $net_unit_price[$i];
            $product_sale['discount'] = $discount[$i];
            $product_sale['tax_rate'] = $tax_rate[$i];
            $product_sale['tax'] = $tax[$i];
            $product_sale['total'] = $mail_data['total'][$i] = $total[$i];

            $general_setting = DB::table('general_settings')->select('modules')->first();
            if(in_array('restaurant',explode(',',$general_setting->modules))){
                $product_sale['topping_id'] = $data['topping_product'][$i];
            };

            Product_Sale::create($product_sale);
        }
        if($data['sale_status'] == 3)
            $message = 'Sale successfully added to draft';
        else
            $message = ' Sale created successfully';
        $mail_setting = MailSetting::latest()->first();
        if($mail_data['email'] && $data['sale_status'] == 1 && $mail_setting) {
            $this->setMailInfo($mail_setting);
            try {
                Mail::to($mail_data['email'])->send(new SaleDetails($mail_data));
                /*$log_data['message'] = Auth::user()->name . ' has created a sale. Reference No: ' .$lims_sale_data->reference_no;
                $admin_email = 'ashfaqdev.php@gmail.com';
                Mail::to($admin_email)->send(new LogMessage($log_data));*/
            }
            catch(\Exception $e){
                $message = ' Sale created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }

        if($data['payment_status'] == 3 || $data['payment_status'] == 4 || ($data['payment_status'] == 2 && $data['pos'] && $data['paid_amount'] > 0)) {
            foreach($data['paid_by_id'] as $key=>$value)
            {
                if($data['paid_amount'][$key] > 0) {
                    $lims_payment_data = new Payment();
                    $lims_payment_data->user_id = Auth::id();
                    $paying_method = '';

                    if($data['paid_by_id'][$key] == 1)
                        $paying_method = 'Cash';
                    elseif ($data['paid_by_id'][$key] == 2) {
                        $paying_method = 'Gift Card';
                    }
                    elseif ($data['paid_by_id'][$key] == 3)
                        $paying_method = 'Credit Card';
                    elseif ($data['paid_by_id'][$key] == 4)
                        $paying_method = 'Cheque';
                    elseif ($data['paid_by_id'][$key] == 5)
                        $paying_method = 'Paypal';
                    elseif($data['paid_by_id'][$key] == 6)
                        $paying_method = 'Deposit';
                    elseif($data['paid_by_id'][$key] == 7) {
                        $paying_method = 'Points';
                        $lims_payment_data->used_points = $data['used_points'];
                    }
                    elseif($data['paid_by_id'][$key] == 8) {
                        $paying_method = 'Pesapal';
                    }
                    else {

                        $paying_method = ucfirst($data['paid_by_id_select'][0]); // For string values like 'Pesapal', 'Stripe', etc.
                    }

                    if($cash_register_data)
                        $lims_payment_data->cash_register_id = $cash_register_data->id;
                    $lims_account_data = Account::where('is_default', true)->first();
                    $lims_payment_data->account_id = $lims_account_data->id;
                    $lims_payment_data->sale_id = $lims_sale_data->id;
                    $data['payment_reference'] = 'spr-'.date("Ymd").'-'.date("his");
                    $lims_payment_data->payment_reference = $data['payment_reference'];
                    $lims_payment_data->amount = $data['paid_amount'][$key];
                    $lims_payment_data->change = $data['paying_amount'][$key] - $data['paid_amount'][$key];
                    $lims_payment_data->paying_method = $paying_method;
                    $lims_payment_data->payment_note = $data['payment_note'];
                    if(isset($data['payment_receiver'])){
                        $lims_payment_data->payment_receiver = $data['payment_receiver'];
                    }
                    $lims_payment_data->save();

                    if(isset($data['cash']) && $data['cash'] > 0 &&  isset($data['bank']) && $data['bank'])

                    $lims_payment_data = Payment::latest()->first();
                    $data['payment_id'] = $lims_payment_data->id;
                    $lims_pos_setting_data = PosSetting::latest()->first();
                    // Check Payment Method is Card
                    if($paying_method == 'Credit Card'){
                        $cardDetails = [];
                        $cardDetails['card_number'] = $data['card_number'];
                        $cardDetails['card_holder_name'] = $data['card_holder_name'];
                        $cardDetails['card_type'] = $data['card_type'];
                        $data['charge_id'] = '12345';
                        $data['data'] = json_encode($cardDetails);

                        PaymentWithCreditCard::create($data);
                    }
                    else if ($paying_method == 'Gift Card') {
                        $lims_gift_card_data = GiftCard::find($data['gift_card_id']);
                        $lims_gift_card_data->expense += $data['paid_amount'][$key];
                        $lims_gift_card_data->save();
                        PaymentWithGiftCard::create($data);
                    }
                    else if ($paying_method == 'Cheque') {
                        PaymentWithCheque::create($data);
                    }
                    else if($paying_method == 'Deposit'){
                        $lims_customer_data->expense += $data['paid_amount'][$key];
                        $lims_customer_data->save();
                    }
                    else if($paying_method == 'Points'){
                        $lims_customer_data->points -= $data['used_points'];
                        $lims_customer_data->save();
                    }
                    else if($paying_method == 'Pesapal'){
                        $redirectUrl = $this->submitOrderRequest($lims_customer_data,$data['paid_amount'][$key]); // Assume this returns a URL
                        $lims_customer_data->save();

                        return response()->json([
                            'payment_method' => 'pesapal',
                            'redirect_url' => $redirectUrl,
                        ]);
                    }
                }
            }
        }
        /*}
        catch(Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()]);
        }*/

        //sms send start
        $smsData = [];

        $smsTemplate = SmsTemplate::where('is_default',1)->latest()->first();
        $smsProvider = ExternalService::where('active',true)->where('type','sms')->first();
        if($smsProvider && $smsTemplate && $lims_pos_setting_data['send_sms'] == 1) {
            $smsData['type'] = 'onsite';
            $smsData['template_id'] = $smsTemplate['id'];
            $smsData['sale_status'] = $data['sale_status'];
            $smsData['payment_status'] = $data['payment_status'];
            $smsData['customer_id'] = $data['customer_id'];
            $smsData['reference_no'] = $data['reference_no'];
            $this->_smsModel->initialize($smsData);
        }
        //sms send end
            
        return response()->json([
            'success' => true,
            'message' => 'Sale created successfully.',
            'data' => $lims_sale_data->id
        ], 201);
    }
}
