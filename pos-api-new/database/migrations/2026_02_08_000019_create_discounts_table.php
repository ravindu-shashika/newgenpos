<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discounts')) {
            return;
        }
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->enum('type', ['percentage', 'flat']);
            $table->decimal('value', 15, 2);
            $table->string('applicable_for', 20)->default('All');
            $table->text('product_list')->nullable();
            $table->date('valid_from');
            $table->date('valid_till');
            $table->string('days', 255)->nullable();
            $table->integer('minimum_qty')->default(1);
            $table->integer('maximum_qty')->default(999999);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
