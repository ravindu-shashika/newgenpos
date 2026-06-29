<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturnSaleSettlement extends Model
{
    protected $fillable = [
        'return_id',
        'sale_id',
        'amount',
        'user_id',
    ];

    public function returnRecord()
    {
        return $this->belongsTo(Returns::class, 'return_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
