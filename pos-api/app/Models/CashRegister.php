<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'cash_in_hand',
        'closing_balance',
        'actual_cash',
        'user_id',
        'warehouse_id',
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
            'cash_in_hand' => 'double',
            'closing_balance' => 'double',
            'actual_cash' => 'double',
            'status' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the cash register.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
