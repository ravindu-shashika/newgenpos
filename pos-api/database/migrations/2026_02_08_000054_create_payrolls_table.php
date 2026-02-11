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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('employee_id');
            $table->integer('account_id');
            $table->integer('user_id');
            $table->double('amount');
            $table->string('paying_method', 191);
            $table->text('note')->nullable();
            $table->string('status', 50);
            $table->json('amount_array')->nullable();
            $table->string('month', 191)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
