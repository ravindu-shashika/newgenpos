<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSyncExchange extends Model
{
    protected $table = 'pos_sync_exchanges';

    protected $fillable = [
        'client_uuid',
        'device_id',
        'exchange_id',
        'reference_no',
        'sync_status',
        'error_message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
