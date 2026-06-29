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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_reference', 191);
            $table->integer('user_id');
            $table->integer('purchase_id')->nullable();
            $table->integer('sale_id')->nullable();
            $table->integer('cash_register_id')->nullable();
            $table->integer('account_id');
            $table->string('payment_receiver', 255)->nullable();
            $table->double('amount');
            $table->unsignedBigInteger('currency_id')->nullable();
            $table->unsignedBigInteger('installment_id')->nullable();
            $table->decimal('exchange_rate', 8, 2);
            $table->timestamp('payment_at')->nullable();
            $table->double('used_points')->nullable();
            $table->double('change')->nullable();
            $table->string('paying_method', 191);
            $table->text('payment_note')->nullable();
            $table->string('document', 191)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
