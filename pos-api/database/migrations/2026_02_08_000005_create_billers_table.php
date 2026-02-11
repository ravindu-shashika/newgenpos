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
        Schema::create('billers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->string('image', 191)->nullable();
            $table->string('company_name', 191);
            $table->string('vat_number', 191)->nullable();
            $table->string('email', 191);
            $table->string('phone_number', 191);
            $table->string('address', 191);
            $table->string('city', 191);
            $table->string('state', 191)->nullable();
            $table->string('postal_code', 191)->nullable();
            $table->string('country', 191)->nullable();
            $table->boolean('is_active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billers');
    }
};
