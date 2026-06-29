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
        Schema::create('reward_point_settings', function (Blueprint $table) {
            $table->id();
            $table->double('per_point_amount');
            $table->double('minimum_amount');
            $table->integer('duration')->nullable();
            $table->string('type', 191)->nullable();
            $table->boolean('is_active');
            $table->decimal('redeem_amount_per_unit_rp', 10, 2)->nullable();
            $table->decimal('min_order_total_for_redeem', 10, 2)->nullable();
            $table->integer('min_redeem_point')->nullable();
            $table->integer('max_redeem_point')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reward_point_settings');
    }
};
