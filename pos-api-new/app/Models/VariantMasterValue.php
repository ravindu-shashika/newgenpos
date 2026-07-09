<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VariantMasterValue extends Model
{
    protected $fillable = ['variant_master_id', 'value', 'position', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    public function master(): BelongsTo
    {
        return $this->belongsTo(VariantMaster::class, 'variant_master_id');
    }
}
