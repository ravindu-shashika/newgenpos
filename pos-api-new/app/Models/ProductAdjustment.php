<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class ProductAdjustment extends Model
{
    protected $table = 'product_adjustments';

    protected $fillable = [
        'adjustment_id',
        'product_id',
        'variant_id',
        'product_batch_id',
        'unit_cost',
        'qty',
        'action',
        'is_delete',
    ];

    protected $casts = [
        'is_delete' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('notDeleted', function (Builder $query) {
            if (Schema::hasColumn('product_adjustments', 'is_delete')) {
                $query->where('is_delete', false);
            }
        });
    }

    public function markDeleted(): bool
    {
        if (! Schema::hasColumn($this->getTable(), 'is_delete')) {
            return (bool) $this->delete();
        }

        return $this->update(['is_delete' => true]);
    }
}
