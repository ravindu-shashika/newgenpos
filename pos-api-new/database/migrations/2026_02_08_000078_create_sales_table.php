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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('user_id');
            $table->integer('cash_register_id')->nullable();
            $table->integer('table_id')->nullable();
            $table->integer('queue')->nullable();
            $table->integer('customer_id');
            $table->integer('warehouse_id');
            $table->integer('biller_id')->nullable();
            $table->integer('item');
            $table->double('total_qty');
            $table->double('total_discount');
            $table->double('total_tax');
            $table->double('total_price');
            $table->double('grand_total');
            $table->integer('currency_id')->nullable();
            $table->double('exchange_rate')->nullable();
            $table->double('order_tax_rate')->nullable();
            $table->double('order_tax')->nullable();
            $table->string('order_discount_type', 191)->nullable();
            $table->double('order_discount_value')->nullable();
            $table->double('order_discount')->nullable();
            $table->integer('coupon_id')->nullable();
            $table->double('coupon_discount')->nullable();
            $table->double('shipping_cost')->nullable();
            $table->integer('sale_status');
            $table->integer('payment_status');
            $table->string('document', 191)->nullable();
            $table->double('paid_amount')->nullable();
            $table->text('sale_note')->nullable();
            $table->text('staff_note')->nullable();
            $table->string('sale_type', 191)->nullable();
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
        Schema::dropIfExists('sales');
    }
};
