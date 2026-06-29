<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barcode extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_continuous' => 'boolean',
        'is_default' => 'boolean',
        'is_custom' => 'boolean',
    ];
}
