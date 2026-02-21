<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'sale_id',
        'packing_slip_ids',
        'user_id',
        'courier_id',
        'address',
        'delivered_by',
        'recieved_by',
        'file',
        'note',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the delivery.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the courier that handles the delivery.
     */
    public function courier()
    {
        return $this->belongsTo(Courier::class);
    }

    /**
     * Get the sale that owns the delivery.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
