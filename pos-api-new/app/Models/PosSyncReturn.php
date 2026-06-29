<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSyncReturn extends Model
{
    protected $table = 'pos_sync_returns';

    protected $fillable = [
        'client_uuid',
        'device_id',
        'return_id',
        'reference_no',
        'sync_status',
        'error_message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
