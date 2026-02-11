<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barcode extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'description',
        'width',
        'height',
        'paper_width',
        'paper_height',
        'top_margin',
        'left_margin',
        'row_distance',
        'col_distance',
        'stickers_in_one_row',
        'is_default',
        'is_continuous',
        'stickers_in_one_sheet',
        'is_custom',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'width' => 'double',
            'height' => 'double',
            'paper_width' => 'double',
            'paper_height' => 'double',
            'top_margin' => 'double',
            'left_margin' => 'double',
            'row_distance' => 'double',
            'col_distance' => 'double',
            'is_default' => 'boolean',
            'is_continuous' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
