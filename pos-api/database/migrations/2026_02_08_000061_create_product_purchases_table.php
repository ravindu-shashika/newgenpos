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
        Schema::create('product_purchases', function (Blueprint $table) {
            $table->id();
            $table->integer('purchase_id');
            $table->integer('product_id');
            $table->integer('product_batch_id')->nullable();
            $table->integer('variant_id')->nullable();
            $table->text('imei_number')->nullable();
            $table->double('qty');
            $table->double('recieved');
            $table->double('return_qty');
            $table->integer('purchase_unit_id');
            $table->double('net_unit_cost');
            $table->decimal('net_unit_margin', 8, 2);
            $table->enum('net_unit_margin_type', ['flat', 'percentage']);
            $table->decimal('net_unit_price', 8, 2);
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
        Schema::dropIfExists('product_purchases');
    }
};
