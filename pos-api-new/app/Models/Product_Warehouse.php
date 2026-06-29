<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class Product_Warehouse extends Model
{
    protected $table = 'product_warehouse';

    protected $fillable = [
        "product_id", "product_batch_id", "variant_id", "imei_number", "warehouse_id", "qty", "price"
    ];

    public function scopeFindProductWithVariant($query, $product_id, $variant_id, $warehouse_id)
    {
    	return $query->where([
            ['product_id', $product_id],
            ['variant_id', $variant_id],
            ['warehouse_id', $warehouse_id]
        ]);
    }

    public function scopeFindProductWithoutVariant($query, $product_id, $warehouse_id)
    {
    	return $query->where([
            ['product_id', $product_id],
            ['warehouse_id', $warehouse_id]
        ]);
    }

    /**
     * SalePro legacy DB uses product_warehouse; newer migrations may create product_warehouses.
     */
    public static function resolveTable(): string
    {
        static $resolved;

        if ($resolved !== null) {
            return $resolved;
        }

        if (Schema::hasTable('product_warehouse')) {
            $resolved = 'product_warehouse';
        } elseif (Schema::hasTable('product_warehouses')) {
            $resolved = 'product_warehouses';
        } else {
            $resolved = 'product_warehouse';
        }

        return $resolved;
    }

    public function getTable()
    {
        return static::resolveTable();
    }
}
