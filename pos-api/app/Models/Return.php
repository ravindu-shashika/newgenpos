<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Return extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'returns';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'user_id',
        'sale_id',
        'cash_register_id',
        'customer_id',
        'warehouse_id',
        'biller_id',
        'account_id',
        'currency_id',
        'exchange_rate',
        'item',
        'total_qty',
        'total_discount',
        'total_tax',
        'total_price',
        'order_tax_rate',
        'order_tax',
        'grand_total',
        'document',
        'return_note',
        'staff_note',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exchange_rate' => 'double',
            'total_qty' => 'double',
            'total_discount' => 'double',
            'total_tax' => 'double',
            'total_price' => 'double',
            'order_tax_rate' => 'double',
            'order_tax' => 'double',
            'grand_total' => 'double',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the return.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the customer that owns the return.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the biller that owns the return.
     */
    public function biller()
    {
        return $this->belongsTo(Biller::class);
    }

    /**
     * Get the account that owns the return.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the sale associated with the return.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the cash register that owns the return.
     */
    public function cashRegister()
    {
        return $this->belongsTo(CashRegister::class);
    }
}
