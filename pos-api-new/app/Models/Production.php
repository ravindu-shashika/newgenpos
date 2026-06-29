<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Production extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'warehouse_id',
        'user_id',
        'item',
        'total_qty',
        'total_tax',
        'total_cost',
        'shipping_cost',
        'production_cost',
        'grand_total',
        'status',
        'document',
        'note',
        'production_units_ids',
        'wastage_percent',
        'product_list',
        'product_id',
        'qty_list',
        'price_list',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_tax' => 'double',
            'total_cost' => 'double',
            'shipping_cost' => 'double',
            'production_cost' => 'double',
            'grand_total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the production.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
