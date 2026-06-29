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
        Schema::create('product_quotations', function (Blueprint $table) {
            $table->id();
            $table->integer('quotation_id');
            $table->integer('product_id');
            $table->integer('product_batch_id')->nullable();
            $table->integer('variant_id')->nullable();
            $table->double('qty');
            $table->integer('sale_unit_id');
            $table->double('net_unit_price');
            $table->double('discount');
            $table->double('tax_rate');
            $table->double('tax');
            $table->double('total');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_quotations');
    }
};
