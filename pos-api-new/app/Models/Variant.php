<?php

namespace App\Models;

use App\Services\VariantMasterResolver;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Compatibility model: variant_id columns now reference variant_master_values.id.
 * The `name` attribute maps to `value` for legacy code paths.
 */
class Variant extends Model
{
    protected $table = 'variant_master_values';

    protected $fillable = ['variant_master_id', 'value', 'position', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    public function master(): BelongsTo
    {
        return $this->belongsTo(VariantMaster::class, 'variant_master_id');
    }

    public function getNameAttribute(): ?string
    {
        return $this->attributes['value'] ?? null;
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['value'] = $value;
    }

    /**
     * @param  array{name?: string, value?: string}  $attributes
     */
    public static function firstOrCreate(array $attributes = [], array $values = [])
    {
        $name = trim((string) ($attributes['name'] ?? $attributes['value'] ?? ''));
        return app(VariantMasterResolver::class)->firstOrCreateByName($name);
    }

    public function product()
    {
        return $this->belongsToMany(Product::class, 'product_variants', 'variant_id', 'product_id')
            ->withPivot('id', 'item_code', 'additional_cost', 'additional_price', 'qty');
    }
}
