<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VariantMaster extends Model
{
    protected $fillable = ['name', 'position', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    public function values(): HasMany
    {
        return $this->hasMany(VariantMasterValue::class)->where('is_active', true)->orderBy('position');
    }

    public function allValues(): HasMany
    {
        return $this->hasMany(VariantMasterValue::class)->orderBy('position');
    }
}
