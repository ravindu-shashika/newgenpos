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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('expense_category_id');
            $table->integer('warehouse_id');
            $table->integer('account_id');
            $table->integer('user_id');
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->string('type', 191)->nullable();
            $table->integer('cash_register_id')->nullable();
            $table->double('amount');
            $table->text('note')->nullable();
            $table->string('document', 191)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
