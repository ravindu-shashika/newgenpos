<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Terminal extends Model
{
    protected $fillable = [
        'name',
        'code',
        'activation_token',
        'client_token',
        'pos_token',
        'pos_token_issued_at',
        'warehouse_id',
        'device_id',
        'ip',
        'is_active',
        'is_delete',
        'activated_at',
        'last_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_delete' => 'boolean',
        'activated_at' => 'datetime',
        'last_active' => 'datetime',
        'pos_token_issued_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('notDeleted', function (Builder $query) {
            $query->where('is_delete', false);
        });
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
