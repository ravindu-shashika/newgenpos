<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'unit_code',
        'unit_name',
        'base_unit',
        'operator',
        'operation_value',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'operation_value' => 'double',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the base unit that owns this unit.
     */
    public function baseUnit()
    {
        return $this->belongsTo(Unit::class, 'base_unit');
    }

    /**
     * Get the derived units for this base unit.
     */
    public function derivedUnits()
    {
        return $this->hasMany(Unit::class, 'base_unit');
    }
}
