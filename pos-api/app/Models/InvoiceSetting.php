<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSetting extends Model
{
    /**
     * Get the active (status=1) invoice setting used for invoice generation.
     */
    public static function active_setting(): ?self
    {
        return static::where('status', 1)->first();
    }

    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'template_name',
        'invoice_name',
        'invoice_logo',
        'file_type',
        'prefix',
        'number_of_digit',
        'numbering_type',
        'start_number',
        'last_invoice_number',
        'header_text',
        'header_title',
        'footer_text',
        'footer_title',
        'preview_invoice',
        'size',
        'primary_color',
        'secondary_color',
        'text_color',
        'company_logo',
        'logo_height',
        'logo_width',
        'is_default',
        'status',
        'invoice_date_format',
        'show_column',
        'extra',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'status' => 'boolean',
            'show_column' => 'array',
            'extra' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created the invoice setting.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the invoice setting.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
