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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('user_id');
            $table->integer('warehouse_id');
            $table->integer('supplier_id')->nullable();
            $table->integer('currency_id')->nullable();
            $table->double('exchange_rate')->nullable();
            $table->integer('item');
            $table->double('total_qty');
            $table->double('total_discount');
            $table->double('total_tax');
            $table->double('total_cost');
            $table->double('order_tax_rate')->nullable();
            $table->double('order_tax')->nullable();
            $table->double('order_discount')->nullable();
            $table->double('shipping_cost')->nullable();
            $table->double('grand_total');
            $table->double('paid_amount');
            $table->integer('status');
            $table->integer('payment_status');
            $table->string('document', 191)->nullable();
            $table->text('note')->nullable();
            $table->string('purchase_type', 191)->nullable();
            $table->timestamps();
            $table->unsignedInteger('deleted_by')->nullable();
            $table->timestamp('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
