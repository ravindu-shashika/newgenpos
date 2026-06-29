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
        Schema::create('productions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 255);
            $table->integer('warehouse_id');
            $table->integer('user_id');
            $table->integer('item');
            $table->integer('total_qty');
            $table->double('total_tax');
            $table->double('total_cost');
            $table->double('shipping_cost')->nullable();
            $table->double('production_cost')->nullable();
            $table->double('grand_total');
            $table->integer('status');
            $table->string('document', 255)->nullable();
            $table->text('note')->nullable();
            $table->string('production_units_ids', 191)->nullable();
            $table->string('wastage_percent', 191)->nullable();
            $table->string('product_list', 191)->nullable();
            $table->string('product_id', 191)->nullable();
            $table->string('qty_list', 191)->nullable();
            $table->string('price_list', 191)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productions');
    }
};
