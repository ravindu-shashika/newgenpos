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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('belongs_to', 191);
            $table->string('name', 191);
            $table->string('type', 191);
            $table->text('default_value')->nullable();
            $table->text('option_value')->nullable();
            $table->integer('grid_value');
            $table->boolean('is_table');
            $table->boolean('is_invoice');
            $table->boolean('is_required');
            $table->boolean('is_admin');
            $table->boolean('is_disable');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
