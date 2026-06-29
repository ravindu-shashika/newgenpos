<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\GiftCard;
use App\Models\PosSetting;
use Illuminate\Http\Request;
use App\Models\InstallmentPlan;
use App\Models\RewardPointSetting;

class InstallmentPlanController extends Controller
{
    public function store(array $data) {
        $plan = InstallmentPlan::create($data);

        $months = $data['months'];
        $amount = $plan->total_amount - $plan->down_payment;
        if ($months > 0) {
            $amount = $amount / $months;
        }
        $startDate = now();

        for ($i = 1; $i <= $months; $i++) {
            $paymentDate = $startDate->copy()->addMonths($i);

            $plan->installments()->create([
                'status' => 'pending',
                'reference_type' => $data['reference_type'],
                'reference_id' => $data['reference_id'],
                'payment_date' => $paymentDate,
                'amount' => $amount,
            ]);
        }
    }

    public function show($id)
    {
        $plan = InstallmentPlan::with('installments')->findOrFail($id);
        
        $lims_gift_card_list = GiftCard::where("is_active", true)->get();
        $lims_pos_setting_data = PosSetting::latest()->first();
        $lims_reward_point_setting_data = RewardPointSetting::latest()->first();
        $lims_account_list = Account::where('is_active', true)->get();

        if($lims_pos_setting_data)
            $options = explode(',', $lims_pos_setting_data->payment_options);
        else
            $options = [];
        
        return view('backend.installment_plans.show', compact('plan', 'lims_pos_setting_data', 'options', 'lims_reward_point_setting_data', 'lims_account_list', 'lims_gift_card_list'));
    }
}
