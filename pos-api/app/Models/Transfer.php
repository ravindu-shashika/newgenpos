<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
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
        'status',
        'from_warehouse_id',
        'to_warehouse_id',
        'item',
        'total_qty',
        'total_tax',
        'total_cost',
        'shipping_cost',
        'grand_total',
        'document',
        'note',
        'is_sent',
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
            'total_tax' => 'double',
            'total_cost' => 'double',
            'shipping_cost' => 'double',
            'grand_total' => 'double',
            'is_sent' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the transfer.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
