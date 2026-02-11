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
        Schema::create('installment_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->enum('reference_type', ['sale', 'purchase']);
            $table->unsignedBigInteger('reference_id');
            $table->decimal('price', 15, 2);
            $table->decimal('additional_amount', 15, 2);
            $table->decimal('total_amount', 15, 2);
            $table->decimal('down_payment', 15, 2);
            $table->integer('months');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installment_plans');
    }
};
