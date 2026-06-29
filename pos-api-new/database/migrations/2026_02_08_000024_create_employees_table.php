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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->string('email', 191);
            $table->string('phone_number', 191);
            $table->integer('department_id');
            $table->unsignedBigInteger('designation_id')->nullable();
            $table->integer('user_id')->nullable();
            $table->string('staff_id', 191)->nullable();
            $table->string('image', 191)->nullable();
            $table->string('address', 191)->nullable();
            $table->string('city', 191)->nullable();
            $table->string('country', 191)->nullable();
            $table->boolean('is_active');
            $table->boolean('is_sale_agent');
            $table->unsignedBigInteger('shift_id')->nullable();
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('sale_commission_percent', 8, 2)->nullable();
            $table->json('sales_target')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
