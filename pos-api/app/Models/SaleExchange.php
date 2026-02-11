<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleExchange extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sale_id',
        'reference_no',
        'customer_id',
        'user_id',
        'warehouse_id',
        'biller_id',
        'item',
        'total_qty',
        'total_discount',
        'total_tax',
        'amount',
        'payment_type',
        'order_tax_rate',
        'order_tax',
        'grand_total',
        'document',
        'exchange_note',
        'staff_note',
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
            'amount' => 'double',
            'order_tax_rate' => 'double',
            'order_tax' => 'double',
            'grand_total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the customer that owns the sale exchange.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the user that owns the sale exchange.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the biller that owns the sale exchange.
     */
    public function biller()
    {
        return $this->belongsTo(Biller::class);
    }
}
