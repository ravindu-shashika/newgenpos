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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->integer('customer_group_id');
            $table->integer('user_id')->nullable();
            $table->string('name', 191);
            $table->string('company_name', 191)->nullable();
            $table->string('email', 191)->nullable();
            $table->enum('type', ['regular', 'walkin']);
            $table->string('phone_number', 191);
            $table->string('wa_number', 191)->nullable();
            $table->string('tax_no', 191)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('city', 255)->nullable();
            $table->string('state', 191)->nullable();
            $table->string('postal_code', 191)->nullable();
            $table->string('country', 191)->nullable();
            $table->double('opening_balance');
            $table->double('credit_limit')->nullable();
            $table->double('points')->nullable();
            $table->double('deposit')->nullable();
            $table->integer('pay_term_no')->nullable();
            $table->string('pay_term_period', 191)->nullable();
            $table->double('expense')->nullable();
            $table->boolean('is_active')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
