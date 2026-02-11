<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomField extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'belongs_to',
        'name',
        'type',
        'default_value',
        'option_value',
        'grid_value',
        'is_table',
        'is_invoice',
        'is_required',
        'is_admin',
        'is_disable',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_table' => 'boolean',
            'is_invoice' => 'boolean',
            'is_required' => 'boolean',
            'is_admin' => 'boolean',
            'is_disable' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
