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
        Schema::create('mobile_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191)->nullable();
            $table->string('ip', 191)->nullable();
            $table->string('location', 191)->nullable();
            $table->string('token', 191);
            $table->boolean('is_active');
            $table->timestamp('last_active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_tokens');
    }
};
