<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barcode extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_continuous' => 'boolean',
        'is_default' => 'boolean',
        'is_custom' => 'boolean',
        'print_options' => 'array',
    ];

    public static function defaultPrintOptions(): array
    {
        return [
            'layout' => 'zebra',
            'business_name' => true,
            'business_name_size' => 13,
            'name' => true,
            'name_size' => 12,
            'brand_name' => false,
            'brand_name_size' => 12,
            'product_code' => true,
            'product_code_size' => 12,
            'alt_code' => true,
            'alt_code_size' => 12,
            'price' => true,
            'price_size' => 12,
            'promo_price' => false,
            'promo_price_size' => 15,
        ];
    }
}
