<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'payment_reference',
        'user_id',
        'purchase_id',
        'sale_id',
        'cash_register_id',
        'account_id',
        'payment_receiver',
        'amount',
        'currency_id',
        'installment_id',
        'exchange_rate',
        'payment_at',
        'used_points',
        'change',
        'paying_method',
        'payment_note',
        'document',
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
            'exchange_rate' => 'decimal:2',
            'used_points' => 'double',
            'change' => 'double',
            'payment_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the payment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the account that owns the payment.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the cash register that owns the payment.
     */
    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }

    /**
     * Get the sale associated with the payment.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the purchase associated with the payment.
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the installment that owns the payment.
     */
    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }
}
