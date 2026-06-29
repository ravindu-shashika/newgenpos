<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductProduction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'production_id',
        'product_id',
        'qty',
        'recieved',
        'purchase_unit_id',
        'net_unit_cost',
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
            'net_unit_cost' => 'double',
            'tax_rate' => 'double',
            'tax' => 'double',
            'total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
