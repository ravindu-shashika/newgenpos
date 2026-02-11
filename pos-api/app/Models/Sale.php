<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'user_id',
        'cash_register_id',
        'table_id',
        'queue',
        'customer_id',
        'warehouse_id',
        'biller_id',
        'item',
        'total_qty',
        'total_discount',
        'total_tax',
        'total_price',
        'grand_total',
        'currency_id',
        'exchange_rate',
        'order_tax_rate',
        'order_tax',
        'order_discount_type',
        'order_discount_value',
        'order_discount',
        'coupon_id',
        'coupon_discount',
        'shipping_cost',
        'sale_status',
        'payment_status',
        'document',
        'paid_amount',
        'sale_note',
        'staff_note',
        'deleted_by',
        'sale_type',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_qty' => 'double',
            'total_discount' => 'double',
            'total_tax' => 'double',
            'total_price' => 'double',
            'grand_total' => 'double',
            'exchange_rate' => 'double',
            'order_tax_rate' => 'double',
            'order_tax' => 'double',
            'order_discount_value' => 'double',
            'order_discount' => 'double',
            'coupon_discount' => 'double',
            'shipping_cost' => 'double',
            'paid_amount' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the sale.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the customer that owns the sale.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the biller that owns the sale.
     */
    public function biller()
    {
        return $this->belongsTo(Biller::class);
    }

    /**
     * Get the cash register that owns the sale.
     */
    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }

    /**
     * Get the coupon that owns the sale.
     */
    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    /**
     * Get the user who deleted the sale.
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
