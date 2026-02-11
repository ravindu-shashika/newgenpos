<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPurchase extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'purchase_id',
        'product_id',
        'product_batch_id',
        'variant_id',
        'imei_number',
        'qty',
        'recieved',
        'return_qty',
        'purchase_unit_id',
        'net_unit_cost',
        'net_unit_margin',
        'net_unit_margin_type',
        'net_unit_price',
        'discount',
        'tax_rate',
        'tax',
        'total',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty' => 'double',
            'recieved' => 'double',
            'return_qty' => 'double',
            'net_unit_cost' => 'double',
            'net_unit_margin' => 'decimal:2',
            'net_unit_price' => 'decimal:2',
            'discount' => 'double',
            'tax_rate' => 'double',
            'tax' => 'double',
            'total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the product batch that owns the product purchase.
     */
    public function productBatch()
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
