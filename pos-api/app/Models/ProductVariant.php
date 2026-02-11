<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'variant_id',
        'position',
        'item_code',
        'additional_cost',
        'additional_price',
        'qty',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'additional_cost' => 'double',
            'additional_price' => 'double',
            'qty' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
