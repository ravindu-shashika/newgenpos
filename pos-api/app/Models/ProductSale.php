<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductSale extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_batch_id',
        'variant_id',
        'imei_number',
        'qty',
        'return_qty',
        'sale_unit_id',
        'net_unit_price',
        'discount',
        'tax_rate',
        'tax',
        'total',
        'is_delivered',
        'is_packing',
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
            'return_qty' => 'double',
            'net_unit_price' => 'double',
            'discount' => 'double',
            'tax_rate' => 'double',
            'tax' => 'double',
            'total' => 'double',
            'is_delivered' => 'boolean',
            'is_packing' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the product batch that owns the product sale.
     */
    public function productBatch()
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
