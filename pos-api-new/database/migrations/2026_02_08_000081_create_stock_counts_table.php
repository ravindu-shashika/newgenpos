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
        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('warehouse_id');
            $table->string('category_id', 191)->nullable();
            $table->string('brand_id', 191)->nullable();
            $table->integer('user_id');
            $table->string('type', 191);
            $table->string('initial_file', 191)->nullable();
            $table->string('final_file', 191)->nullable();
            $table->text('note')->nullable();
            $table->boolean('is_adjusted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_counts');
    }
};
