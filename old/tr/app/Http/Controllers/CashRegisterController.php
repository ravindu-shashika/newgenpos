<?php

namespace App\Http\Controllers;

use Auth;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Returns;
use App\Models\CashRegister;
use App\Models\PosSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashRegisterController extends Controller
{
	public function index()
	{
		if(Auth::user()->role_id <= 2) {
			$lims_cash_register_all = CashRegister::with('user', 'warehouse')->get();
			return view('backend.cash_register.index', compact('lims_cash_register_all'));
		}
		else
			return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
	}
	public function store(Request $request)
	{
		$data = $request->all();
		$data['status'] = true;
		$data['user_id'] = Auth::id();
		CashRegister::create($data);
		return redirect()->back()->with('message', __('db.Cash register created successfully'));
	}

	public function getDetails($id)
	{
		$fixed_methods = array_map('strtolower', [
			'cash', 'card', 'credit', 'cheque', 'gift_card',
			'deposit', 'points', 'razorpay', 'pesapal', 'installment'
		]);
		$current_methods = PosSetting::value('payment_options');
		$current_methods = array_map(
			fn ($method) => strtolower(trim($method)),
			explode(',', $current_methods)
		);
		$custom_methods = array_values(
			array_diff($current_methods, $fixed_methods)
		);

		$cash_register_data = CashRegister::find($id);

		$data['cash_in_hand'] = $cash_register_data->cash_in_hand;
		$data['total_sale_amount'] = Sale::where([
										['cash_register_id', $cash_register_data->id],
										['sale_status', 1]
									])
									->whereNull('deleted_at')
									->where(function ($q) {
                                        $q->where('sale_type', '!=', 'opening balance')
                                        ->orWhereNull('sale_type');
                                    })
									->sum(DB::raw('grand_total / exchange_rate'));
		$data['total_payment'] = Payment::where('cash_register_id', $cash_register_data->id)
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['cash_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Cash']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['credit_card_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Credit Card']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['gift_card_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Gift Card']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['deposit_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Deposit']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['cheque_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Cheque']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['paypal_payment'] = Payment::where([
									['cash_register_id', $cash_register_data->id],
									['paying_method', 'Paypal']
								])
								->whereNotNull('sale_id')
								->sum(DB::raw('amount / exchange_rate'));
		$data['total_supplier_payment'] = Payment::where('cash_register_id', $cash_register_data->id)
										->whereNotNull('purchase_id')
										->sum(DB::raw('amount / exchange_rate'));
		$data['total_sale_return'] = Returns::where('cash_register_id', $cash_register_data->id)->sum(DB::raw('grand_total / exchange_rate'));
		$data['total_expense'] = Expense::where('cash_register_id', $cash_register_data->id)->sum('amount');
		$data['total_cash'] = $data['cash_in_hand'] + $data['total_payment'] - ($data['total_sale_return'] + $data['total_expense'] + $data['total_supplier_payment']);
		$data['status'] = $cash_register_data->status;

		foreach ($custom_methods as $method) {
			$key = $method . '_payment';
			$data['custom_methods'][$key] = Payment::where('cash_register_id', $id)
				->whereRaw('LOWER(paying_method) = ?', [$method])
				->sum(DB::raw('amount / exchange_rate'));
		}
		
		return $data;
	}

	public function close(Request $request)
	{
		$cash_register_data = CashRegister::find($request->cash_register_id);
		$cash_register_data->closing_balance = $request->closing_balance;
		$cash_register_data->actual_cash = $request->actual_cash;
		$cash_register_data->status = 0;
		$cash_register_data->save();
		return redirect()->back()->with('message', __('db.Cash register closed successfully'));
	}

    public function checkAvailability($warehouse_id)
    {
    	$open_register_number = CashRegister::select('id')->where([
						    		['user_id', Auth::id()],
						    		['warehouse_id', $warehouse_id],
						    		['status', true]
						    	])->first();
    	if($open_register_number)
    		return $open_register_number->id;
    	else
    		return 'false';
    }
}
