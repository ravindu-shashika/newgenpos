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
        Schema::create('pos_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('customer_id');
            $table->integer('warehouse_id');
            $table->integer('biller_id');
            $table->integer('product_number');
            $table->boolean('keybord_active');
            $table->boolean('is_table');
            $table->boolean('send_sms');
            $table->string('stripe_public_key', 191)->nullable();
            $table->string('stripe_secret_key', 191)->nullable();
            $table->string('paypal_live_api_username', 191)->nullable();
            $table->string('paypal_live_api_password', 191)->nullable();
            $table->string('paypal_live_api_secret', 191)->nullable();
            $table->text('payment_options')->nullable();
            $table->boolean('show_print_invoice');
            $table->string('invoice_option', 10)->nullable();
            $table->string('thermal_invoice_size', 255);
            $table->tinyInteger('cash_register');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_settings');
    }
};
