<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
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
        'warehouse_id',
        'supplier_id',
        'currency_id',
        'exchange_rate',
        'item',
        'total_qty',
        'total_discount',
        'total_tax',
        'total_cost',
        'order_tax_rate',
        'order_tax',
        'order_discount',
        'shipping_cost',
        'grand_total',
        'paid_amount',
        'status',
        'payment_status',
        'document',
        'note',
        'purchase_type',
        'deleted_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exchange_rate' => 'double',
            'total_qty' => 'double',
            'total_discount' => 'double',
            'total_tax' => 'double',
            'total_cost' => 'double',
            'order_tax_rate' => 'double',
            'order_tax' => 'double',
            'order_discount' => 'double',
            'shipping_cost' => 'double',
            'grand_total' => 'double',
            'paid_amount' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the purchase.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who deleted the purchase.
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
