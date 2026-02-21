<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


/**
 * @property-read \App\Models\Warehouse $warehouse
 */
class Income extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'income_category_id',
        'warehouse_id',
        'account_id',
        'user_id',
        'cash_register_id',
        'amount',
        'note',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the income category that owns the income.
     */
    public function incomeCategory()
    {
        return $this->belongsTo(IncomeCategory::class);
    }

    /**
     * Get the account that owns the income.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the user that owns the income.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the warehouse that owns the income.
     */
    public function warehouse()
    {
        return $this->belongsTo(\App\Models\Warehouse::class);
    }

    /**
     * Get the cash register that owns the income.
     */
    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
