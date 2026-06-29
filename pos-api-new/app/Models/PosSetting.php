<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSetting extends Model
{
    protected $table = 'pos_setting';
    protected $fillable =[
        "customer_id", "warehouse_id", "biller_id", "product_number", "stripe_public_key", "stripe_secret_key","paypal_live_api_username","paypal_live_api_password","paypal_live_api_secret","payment_options","show_print_invoice","invoice_option","thermal_invoice_size", "keybord_active", "is_table"
    ];

    /** Normalized payload for Flutter POS / React POS bootstrap & download. */
    public function toDeviceArray(): array
    {
        $paymentOptions = $this->payment_options
            ? array_values(array_filter(array_map('trim', explode(',', $this->payment_options))))
            : ['cash', 'card', 'cheque', 'deposit'];

        return [
            'customer_id' => $this->customer_id,
            'biller_id' => $this->biller_id,
            'warehouse_id' => $this->warehouse_id,
            'product_number' => (int) ($this->product_number ?: 15),
            'keyboard_active' => (bool) $this->keybord_active,
            'is_table' => (bool) ($this->is_table ?? false),
            'send_sms' => (bool) ($this->send_sms ?? false),
            'cash_register' => (bool) ($this->cash_register ?? false),
            'show_print_invoice' => (bool) $this->show_print_invoice,
            'invoice_option' => $this->invoice_option,
            'thermal_invoice_size' => $this->thermal_invoice_size,
            'stripe_public_key' => $this->stripe_public_key,
            'payment_options' => $paymentOptions,
        ];
    }
}
