<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

/**
 * Alias for ProductWarehouse - used by legacy Blade controller logic.
 * Table: product_warehouses
 */
class ProductWarehouse extends ProductWarehouse
{
    /**
     * Scope: Find product-warehouse record for standard (non-variant) product.
     */
    public function scopeFindProductWithoutVariant(Builder $query, $productId, $warehouseId)
    {
        return $query->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->whereNull('variant_id');
    }

    /**
     * Scope: Find product-warehouse record for variant product.
     */
    public function scopeFindProductWithVariant(Builder $query, $productId, $variantId, $warehouseId)
    {
        return $query->where('product_id', $productId)
            ->where('variant_id', $variantId)
            ->where('warehouse_id', $warehouseId);
    }
}
