<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountPlan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'type',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function customers()
    {
        return $this->belongsToMany(Customer::class, 'discount_plan_customers', 'discount_plan_id', 'customer_id');
    }

    public function discounts()
    {
        return $this->belongsToMany(Discount::class, 'discount_plan_discounts', 'discount_plan_id', 'discount_id');
    }
}
