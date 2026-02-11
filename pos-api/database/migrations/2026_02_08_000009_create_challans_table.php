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
        Schema::create('challans', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 255);
            $table->string('status', 255);
            $table->integer('courier_id');
            $table->longText('packing_slip_list');
            $table->longText('amount_list');
            $table->longText('cash_list')->nullable();
            $table->longText('online_payment_list')->nullable();
            $table->longText('cheque_list')->nullable();
            $table->longText('delivery_charge_list')->nullable();
            $table->longText('status_list')->nullable();
            $table->date('closing_date')->nullable();
            $table->integer('created_by_id');
            $table->integer('closed_by_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challans');
    }
};
