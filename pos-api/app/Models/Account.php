<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'account_no',
        'name',
        'initial_balance',
        'total_balance',
        'note',
        'is_default',
        'is_active',
        'code',
        'type',
        'parent_account_id',
        'is_payment',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'initial_balance' => 'double',
            'total_balance' => 'double',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'is_payment' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the parent account.
     */
    public function parentAccount()
    {
        return $this->belongsTo(Account::class, 'parent_account_id');
    }

    /**
     * Get the child accounts.
     */
    public function childAccounts()
    {
        return $this->hasMany(Account::class, 'parent_account_id');
    }
}
