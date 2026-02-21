<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\DiscountPlan;

class Customer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'customer_group_id',
        'user_id',
        'name',
        'company_name',
        'email',
        'type',
        'phone_number',
        'wa_number',
        'tax_no',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'opening_balance',
        'credit_limit',
        'points',
        'deposit',
        'pay_term_no',
        'pay_term_period',
        'expense',
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
            'opening_balance' => 'double',
            'credit_limit' => 'double',
            'points' => 'double',
            'deposit' => 'double',
            'expense' => 'double',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the customer group that owns the customer.
     */
    public function customerGroup()
    {
        return $this->belongsTo(CustomerGroup::class);
    }

    /**
     * Get the user that owns the customer.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the discount plans assigned to the customer.
     */
    public function discountPlans()
    {
        return $this->belongsToMany(DiscountPlan::class, 'discount_plan_customers', 'customer_id', 'discount_plan_id');
    }
}
