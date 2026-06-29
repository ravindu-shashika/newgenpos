<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSyncSale extends Model
{
    protected $fillable = [
        'client_uuid',
        'device_id',
        'sale_id',
        'reference_no',
        'sync_status',
        'error_message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
