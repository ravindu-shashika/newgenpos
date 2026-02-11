<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'value',
        'applicable_for',
        'product_list',
        'valid_from',
        'valid_till',
        'days',
        'minimum_qty',
        'maximum_qty',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'valid_from' => 'date',
            'valid_till' => 'date',
            'value' => 'decimal:2',
        ];
    }

    public function discountPlans()
    {
        return $this->belongsToMany(DiscountPlan::class, 'discount_plan_discounts', 'discount_id', 'discount_plan_id');
    }
}
