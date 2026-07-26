<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'purchase_id',
        'user_id',
        'sale_id',
        'return_id',
        'purchase_return_id',
        'cash_register_id',
        'account_id',
        'payment_receiver',
        'payment_reference',
        'amount',
        'currency_id',
        'installment_id',
        'exchange_rate',
        'payment_at',
        'used_points',
        'change',
        'paying_method',
        'cheque_status',
        'cheque_return_reason',
        'cheque_returned_at',
        'void_reason',
        'payment_proof',
        'document',
        'payment_note',
    ];

    protected $casts = [
        'payment_at' => 'datetime',
        'cheque_returned_at' => 'datetime',
    ];

    public function isChequeReturned(): bool
    {
        return $this->paying_method === 'Cheque'
            && strtolower((string) $this->cheque_status) === 'returned';
    }
}
