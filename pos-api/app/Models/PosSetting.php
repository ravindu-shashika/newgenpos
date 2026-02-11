<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'customer_id',
        'warehouse_id',
        'biller_id',
        'product_number',
        'keybord_active',
        'is_table',
        'send_sms',
        'stripe_public_key',
        'stripe_secret_key',
        'paypal_live_api_username',
        'paypal_live_api_password',
        'paypal_live_api_secret',
        'payment_options',
        'show_print_invoice',
        'invoice_option',
        'thermal_invoice_size',
        'cash_register',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'stripe_secret_key',
        'paypal_live_api_password',
        'paypal_live_api_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'keybord_active' => 'boolean',
            'is_table' => 'boolean',
            'send_sms' => 'boolean',
            'show_print_invoice' => 'boolean',
            'cash_register' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the customer that owns the POS setting.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the biller that owns the POS setting.
     */
    public function biller()
    {
        return $this->belongsTo(Biller::class);
    }
}
