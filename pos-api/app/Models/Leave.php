<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'leave_types',
        'start_date',
        'end_date',
        'days',
        'status',
        'approver_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the employee that owns the leave.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the leave type that owns the leave.
     */
    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class, 'leave_types');
    }

    /**
     * Get the approver (user) of the leave.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
