<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->string('code', 191);
            $table->string('type', 191);
            $table->string('barcode_symbology', 191);
            $table->integer('brand_id')->nullable();
            $table->integer('category_id');
            $table->integer('unit_id');
            $table->integer('purchase_unit_id');
            $table->integer('sale_unit_id');
            $table->double('cost');
            $table->double('price');
            $table->decimal('profit_margin', 8, 2);
            $table->enum('profit_margin_type', ['flat', 'percentage']);
            $table->double('wholesale_price')->nullable();
            $table->double('qty')->nullable();
            $table->double('alert_quantity')->nullable();
            $table->double('daily_sale_objective')->nullable();
            $table->tinyInteger('promotion')->nullable();
            $table->string('promotion_price', 191)->nullable();
            $table->string('starting_date', 200)->nullable();
            $table->date('last_date')->nullable();
            $table->integer('tax_id')->nullable();
            $table->integer('tax_method')->nullable();
            $table->longText('image')->nullable();
            $table->string('file', 191)->nullable();
            $table->boolean('is_embeded')->nullable();
            $table->boolean('is_variant')->nullable();
            $table->boolean('is_batch')->nullable();
            $table->boolean('is_diffPrice')->nullable();
            $table->boolean('is_imei')->nullable();
            $table->tinyInteger('featured')->nullable();
            $table->string('product_list', 191)->nullable();
            $table->string('variant_list', 191)->nullable();
            $table->string('qty_list', 191)->nullable();
            $table->string('price_list', 191)->nullable();
            $table->text('product_details')->nullable();
            $table->text('variant_option')->nullable();
            $table->text('variant_value')->nullable();
            $table->boolean('is_active')->nullable();
            $table->integer('guarantee')->nullable();
            $table->integer('warranty')->nullable();
            $table->string('guarantee_type', 191)->nullable();
            $table->string('warranty_type', 191)->nullable();
            $table->string('wastage_percent', 191);
            $table->string('combo_unit_id', 191)->nullable();
            $table->string('production_cost', 191);
            $table->unsignedBigInteger('is_recipe');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
