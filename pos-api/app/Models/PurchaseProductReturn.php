<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseProductReturn extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'return_id',
        'product_id',
        'product_batch_id',
        'variant_id',
        'imei_number',
        'qty',
        'purchase_unit_id',
        'net_unit_cost',
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
            'net_unit_cost' => 'double',
            'discount' => 'double',
            'tax_rate' => 'double',
            'tax' => 'double',
            'total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the product batch that owns the purchase product return.
     */
    public function productBatch()
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
