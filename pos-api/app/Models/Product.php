<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Tax;
use App\Models\ProductVariant;
use App\Models\ProductWarehouse;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'alt_code',
        'type',
        'barcode_symbology',
        'brand_id',
        'category_id',
        'unit_id',
        'purchase_unit_id',
        'sale_unit_id',
        'cost',
        'price',
        'profit_margin',
        'profit_margin_type',
        'wholesale_price',
        'qty',
        'alert_quantity',
        'daily_sale_objective',
        'promotion',
        'promotion_price',
        'starting_date',
        'last_date',
        'tax_id',
        'tax_method',
        'image',
        'file',
        'is_embeded',
        'is_variant',
        'is_batch',
        'is_diffPrice',
        'is_imei',
        'featured',
        'product_list',
        'variant_list',
        'qty_list',
        'price_list',
        'product_details',
        'variant_option',
        'variant_value',
        'is_active',
        'guarantee',
        'warranty',
        'guarantee_type',
        'warranty_type',
        'wastage_percent',
        'combo_unit_id',
        'production_cost',
        'is_recipe',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost' => 'double',
            'price' => 'double',
            'profit_margin' => 'decimal:2',
            'wholesale_price' => 'double',
            'qty' => 'double',
            'alert_quantity' => 'double',
            'daily_sale_objective' => 'double',
            'promotion' => 'boolean',
            'last_date' => 'date',
            'is_embeded' => 'boolean',
            'is_variant' => 'boolean',
            'is_batch' => 'boolean',
            'is_diffPrice' => 'boolean',
            'is_imei' => 'boolean',
            'featured' => 'boolean',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the brand that owns the product.
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the base unit for the product.
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the tax associated with the product.
     */
    public function tax()
    {
        return $this->belongsTo(Tax::class);
    }

    /**
     * Get the product variants.
     */
    public function productVariants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get the product warehouses.
     */
    public function productWarehouses()
    {
        return $this->hasMany(ProductWarehouse::class);
    }
}
