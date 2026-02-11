<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneralSetting extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'general_settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'site_title',
        'site_logo',
        'favicon',
        'is_rtl',
        'currency',
        'package_id',
        'subscription_type',
        'staff_access',
        'without_stock',
        'date_format',
        'developed_by',
        'invoice_format',
        'decimal',
        'state',
        'theme',
        'modules',
        'currency_position',
        'expiry_date',
        'expiry_type',
        'expiry_value',
        'expiry_alert_days',
        'is_zatca',
        'company_name',
        'vat_registration_number',
        'is_packing_slip',
        'app_key',
        'token',
        'show_products_details_in_sales_table',
        'show_products_details_in_purchase_table',
        'default_margin_value',
        'timezone',
        'font_css',
        'auth_css',
        'pos_css',
        'custom_css',
        'disable_signup',
        'disable_forgot_password',
        'margin_type',
        'maintenance_allowed_ips',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'app_key',
        'token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_rtl' => 'boolean',
            'is_zatca' => 'boolean',
            'is_packing_slip' => 'boolean',
            'show_products_details_in_sales_table' => 'boolean',
            'show_products_details_in_purchase_table' => 'boolean',
            'default_margin_value' => 'decimal:2',
            'expiry_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
