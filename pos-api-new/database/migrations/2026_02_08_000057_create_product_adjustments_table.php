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
        Schema::create('product_adjustments', function (Blueprint $table) {
            $table->id();
            $table->integer('adjustment_id');
            $table->integer('product_id');
            $table->integer('variant_id')->nullable();
            $table->double('unit_cost')->nullable();
            $table->double('qty');
            $table->string('action', 191);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_adjustments');
    }
};
