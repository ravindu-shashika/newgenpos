<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RewardPointSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'per_point_amount',
        'minimum_amount',
        'duration',
        'type',
        'is_active',
        'redeem_amount_per_unit_rp',
        'min_order_total_for_redeem',
        'min_redeem_point',
        'max_redeem_point',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'per_point_amount' => 'double',
            'minimum_amount' => 'double',
            'is_active' => 'boolean',
            'redeem_amount_per_unit_rp' => 'decimal:2',
            'min_order_total_for_redeem' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
