<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\User;
use App\Models\GiftCard;
use App\Models\GiftCardRecharge;
use Keygen;
use Auth;
use Illuminate\Validation\Rule;
use App\Mail\UserNotification;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class GiftCardController extends Controller
{
    public function index()
    {
        $role = Role::find(Auth::user()->role_id);
        if($role->hasPermissionTo('unit')) {
            $lims_customer_list = Customer::where('is_active', true)->get();
            $lims_user_list = User::where('is_active', true)->get();
            $lims_gift_card_all = GiftCard::where('is_active', true)->orderBy('id', 'desc')->get();

            return view('backend.gift_card.index', compact('lims_customer_list', 'lims_user_list', 'lims_gift_card_all'));
        }
        else
            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
    }

    /**
     * API: List active gift cards for React app.
     */
    public function listApi()
    {
        $cards = GiftCard::where('is_active', true)
            ->with(['customer', 'user', 'creator'])
            ->orderBy('id', 'desc')
            ->get();

        $list = $cards->map(function ($card) {
            $balance = $card->amount - $card->expense;
            $client = $card->customer_id
                ? ($card->customer ? $card->customer->name : '')
                : ($card->user ? $card->user->name : '');
            return [
                'id' => $card->id,
                'card_no' => $card->card_no,
                'customer_id' => $card->customer_id,
                'user_id' => $card->user_id,
                'client' => $client,
                'amount' => $card->amount,
                'expense' => $card->expense,
                'balance' => $balance,
                'created_by' => $card->creator ? $card->creator->name : null,
                'expired_date' => $card->expired_date ? $card->expired_date->format('Y-m-d') : null,
                'expired_date_formatted' => $card->expired_date ? $card->expired_date->format('d-m-Y') : null,
                'is_expired' => $card->expired_date ? $card->expired_date->isPast() : false,
            ];
        });

        return response()->json(['status' => 200, 'data' => $list]);
    }

    /**
     * API: Store new gift card.
     */
    public function storeApi(Request $request)
    {
        $request->validate([
            'card_no' => [
                'required',
                'max:255',
                Rule::unique('gift_cards')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'amount' => 'required|numeric|min:0',
            'expired_date' => 'nullable|date',
        ]);

        $user = $request->input('user');
        if ($user) {
            $request->validate(['user_id' => 'required|exists:users,id']);
        } else {
            $request->validate(['customer_id' => 'required|exists:customers,id']);
        }

        $data = [
            'card_no' => $request->card_no,
            'amount' => $request->amount,
            'expense' => 0,
            'expired_date' => $request->expired_date,
            'created_by' => Auth::id(),
            'is_active' => true,
        ];
        if ($user) {
            $data['user_id'] = $request->user_id;
            $data['customer_id'] = null;
        } else {
            $data['customer_id'] = $request->customer_id;
            $data['user_id'] = null;
        }

        GiftCard::create($data);
        return response()->json(['status' => 200, 'message' => 'Gift card created successfully']);
    }

    /**
     * API: Get one gift card for edit.
     */
    public function editApi($id)
    {
        $card = GiftCard::where('is_active', true)->findOrFail($id);
        return response()->json([
            'status' => 200,
            'data' => [
                'id' => $card->id,
                'card_no' => $card->card_no,
                'amount' => $card->amount,
                'expense' => $card->expense,
                'customer_id' => $card->customer_id,
                'user_id' => $card->user_id,
                'expired_date' => $card->expired_date ? $card->expired_date->format('Y-m-d') : null,
            ],
        ]);
    }

    /**
     * API: Update gift card.
     */
    public function updateApi(Request $request, $id)
    {
        $card = GiftCard::where('is_active', true)->findOrFail($id);

        $request->validate([
            'card_no' => [
                'required',
                'max:255',
                Rule::unique('gift_cards')->ignore($id)->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ],
            'amount' => 'required|numeric|min:0',
            'expired_date' => 'nullable|date',
        ]);

        $user = $request->input('user_edit');
        if ($user) {
            $request->validate(['user_id_edit' => 'required|exists:users,id']);
        } else {
            $request->validate(['customer_id_edit' => 'required|exists:customers,id']);
        }

        $card->card_no = $request->card_no;
        $card->amount = $request->amount;
        if ($user) {
            $card->user_id = $request->user_id_edit;
            $card->customer_id = null;
        } else {
            $card->customer_id = $request->customer_id_edit;
            $card->user_id = null;
        }
        $card->expired_date = $request->expired_date_edit;
        $card->save();

        return response()->json(['status' => 200, 'message' => __('db.GiftCard updated successfully')]);
    }

    /**
     * API: Soft delete gift card.
     */
    public function destroyApi($id)
    {
        $card = GiftCard::where('is_active', true)->findOrFail($id);
        $card->is_active = false;
        $card->save();
        return response()->json(['status' => 200, 'message' => __('db.Data deleted successfully')]);
    }

    public function create()
    {
        //
    }

    public function generateCode()
    {
        $id = Keygen::numeric(16)->generate();
        return $id;
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'card_no' => [
                'max:255',
                    Rule::unique('gift_cards')->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ]
        ]);

        $data = $request->all();

        if($request->input('user'))
            $data['customer_id'] = null;
        else
            $data['user_id'] = null;

        $data['is_active'] = true;
        $data['created_by'] = Auth::id();
        $data['expense'] = 0;
        GiftCard::create($data);
        $message = 'GiftCard created successfully';
        if($data['user_id']){
            $lims_user_data = User::find($data['user_id']);
            $data['email'] = $lims_user_data->email;
            $data['name'] = $lims_user_data->name;
            try{
                Mail::send( 'mail.gift_card_create', $data, function( $message ) use ($data)
                {
                    $message->to( $data['email'] )->subject( 'GiftCard' );
                });
            }
            catch(\Exception $e){
                $message = 'GiftCard created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }
        else{
            $lims_customer_data = Customer::find($data['customer_id']);
            if($lims_customer_data->email){
                $data['email'] = $lims_customer_data->email;
                $data['name'] = $lims_customer_data->name;
                try{
                    Mail::send( 'mail.gift_card_create', $data, function( $message ) use ($data)
                    {
                        $message->to( $data['email'] )->subject( 'GiftCard' );
                    });
                }
                catch(\Exception $e){
                    $message = 'GiftCard created successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
                }
            }
        }
        return redirect('gift_cards')->with('message', $message);
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        $lims_gift_card_data = GiftCard::find($id);
        return $lims_gift_card_data;
    }

    public function update(Request $request, $id)
    {
        $request['card_no'] = $request['card_no_edit'];
        $this->validate($request, [
            'card_no' => [
                'max:255',
                Rule::unique('gift_cards')->ignore($request['gift_card_id'])->where(function ($query) {
                    return $query->where('is_active', 1);
                }),
            ]
        ]);

        $data = $request->all();
        $lims_gift_card_data = GiftCard::find($data['gift_card_id']);
        $lims_gift_card_data->card_no = $data['card_no_edit'];
        $lims_gift_card_data->amount = $data['amount_edit'];
        if($request->input('user_edit')){
            $lims_gift_card_data->user_id = $data['user_id_edit'];
            $lims_gift_card_data->customer_id = null;
        }
        else{
            $lims_gift_card_data->user_id = null;
            $lims_gift_card_data->customer_id = $data['customer_id_edit'];
        }
        $lims_gift_card_data->expired_date = $data['expired_date_edit'];
        $lims_gift_card_data->save();
        return redirect('gift_cards')->with('message', __('db.GiftCard updated successfully'));
    }

    /**
     * API: Recharge gift card (JSON response).
     */
    public function rechargeApi(Request $request, $id)
    {
        $request->validate(['amount' => 'required|numeric|min:0.01']);
        $card = GiftCard::where('is_active', true)->findOrFail($id);
        $card->amount += $request->amount;
        $card->save();
        GiftCardRecharge::create([
            'gift_card_id' => $card->id,
            'amount' => $request->amount,
            'user_id' => Auth::id(),
        ]);
        return response()->json(['status' => 200, 'message' => 'Gift card recharged successfully']);
    }

    public function recharge(Request $request, $id)
    {
        $data = $request->all();
        $data['user_id'] = Auth::id();
        $lims_gift_card_data = GiftCard::find($data['gift_card_id']);
        if($lims_gift_card_data->customer_id)
            $lims_customer_data = Customer::find($lims_gift_card_data->customer_id);
        else
            $lims_customer_data = User::find($lims_gift_card_data->user_id);

        $lims_gift_card_data->amount += $data['amount'];
        $lims_gift_card_data->save();
        GiftCardRecharge::create($data);
        $message = 'GiftCard recharged successfully';
        if($lims_customer_data->email){
            $data['email'] = $lims_customer_data->email;
            $data['name'] = $lims_customer_data->name;
            $data['card_no'] = $lims_gift_card_data->card_no;
            $data['balance'] = $lims_gift_card_data->amount - $lims_gift_card_data->expense;
            try{
                Mail::send( 'mail.gift_card_recharge', $data, function( $message ) use ($data)
                {
                    $message->to( $data['email'] )->subject( 'GiftCard Recharge Info' );
                });
            }
            catch(\Exception $e){
                $message = 'GiftCard recharged successfully. Please setup your <a href="setting/mail_setting">mail setting</a> to send mail.';
            }
        }
        return redirect('gift_cards')->with('message', $message);
    }

    public function deleteBySelection(Request $request)
    {
        $gift_card_id = $request['gift_cardIdArray'];
        foreach ($gift_card_id as $id) {
            $lims_gift_card_data = GiftCard::find($id);
            $lims_gift_card_data->is_active = false;
            $lims_gift_card_data->save();
        }
        return 'Gift Card deleted successfully!';
    }

    public function destroy($id)
    {
        $lims_gift_card_data = GiftCard::find($id);
        $lims_gift_card_data->is_active = false;
        $lims_gift_card_data->save();
        return redirect('gift_cards')->with('not_permitted', __('db.Data deleted successfully'));
    }
}
