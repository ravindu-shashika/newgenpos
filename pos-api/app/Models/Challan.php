<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Challan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'reference_no',
        'status',
        'courier_id',
        'packing_slip_list',
        'amount_list',
        'cash_list',
        'online_payment_list',
        'cheque_list',
        'delivery_charge_list',
        'status_list',
        'closing_date',
        'created_by_id',
        'closed_by_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'closing_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created the challan.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * Get the user who closed the challan.
     */
    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by_id');
    }
}
