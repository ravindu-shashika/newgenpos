<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSetting extends Model
{
    use HasFactory;
    protected $table = 'invoice_settings';
    protected $fillable = [
        'template_name',
        'invoice_name',
        'invoice_logo',
        'file_type',
        'prefix',
        'number_of_digit',
        'numbering_type',
        'start_number',
        'status',
        'header_text',
        'header_title',
        'footer_text',
        'footer_title',
        'show_barcode',
        'show_qr_code',
        'is_default',
        'show_customer_details',
        'show_shipping_details',
        'show_payment_info',
        'show_discount',
        'show_tax_info',
        'show_description',
        'show_billing_info',
        'show_column',
        'preview_invoice',
        'show_in_words',
        'company_logo',
        'logo_height',
        'logo_width',
        'primary_color',
        'primary_color',
        'text_color',
        'secondary_color',
        'size',
        'invoice_date_format',
        'created_by',
        'updated_by',
    ];

    protected static function boot(){
        parent::boot();
        static::creating(function ($query){
            $query->created_by = auth()->user()->id;
        });
        static::updating(function ($query){
            $query->updated_by = auth()->user()->id;
        });
    }

    public static function active_setting(){
        $settings = static::where('status', 1)->first();
        if($settings == null){
            $settings = self::where('is_default',1)->first();
        }
        return $settings;
    }

    /** Normalized payload for Flutter POS / React POS bootstrap & download. */
    public function toDeviceArray(): array
    {
        $showColumn = $this->show_column;
        if (is_string($showColumn) && $showColumn !== '') {
            $decoded = json_decode($showColumn, true);
            $showColumn = is_array($decoded) ? $decoded : [];
        } elseif (! is_array($showColumn)) {
            $showColumn = [];
        }

        return [
            'id' => $this->id,
            'template_name' => $this->template_name,
            'invoice_name' => $this->invoice_name,
            'size' => $this->size,
            'header_text' => $this->header_text,
            'header_title' => $this->header_title,
            'footer_text' => $this->footer_text,
            'footer_title' => $this->footer_title,
            'show_barcode' => (bool) $this->show_barcode,
            'show_qr_code' => (bool) $this->show_qr_code,
            'show_column' => $showColumn,
            'company_logo' => $this->company_logo,
            'logo_height' => $this->logo_height,
            'logo_width' => $this->logo_width,
            'invoice_date_format' => $this->invoice_date_format,
        ];
    }

    public static function activeDeviceArray(): ?array
    {
        $settings = static::active_setting();

        return $settings?->toDeviceArray();
    }
}
