<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'user_id',
        'biller_id',
        'supplier_id',
        'customer_id',
        'warehouse_id',
        'item',
        'total_qty',
        'total_discount',
        'total_tax',
        'total_price',
        'order_tax_rate',
        'order_tax',
        'order_discount',
        'shipping_cost',
        'grand_total',
        'quotation_status',
        'document',
        'note',
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
            'order_tax_rate' => 'double',
            'order_tax' => 'double',
            'order_discount' => 'double',
            'shipping_cost' => 'double',
            'grand_total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the quotation.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the biller that owns the quotation.
     */
    public function biller()
    {
        return $this->belongsTo(Biller::class);
    }

    /**
     * Get the customer that owns the quotation.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
