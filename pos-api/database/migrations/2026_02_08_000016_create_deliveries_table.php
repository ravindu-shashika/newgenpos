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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 191);
            $table->integer('sale_id');
            $table->string('packing_slip_ids', 255)->nullable();
            $table->integer('user_id')->nullable();
            $table->integer('courier_id')->nullable();
            $table->text('address');
            $table->string('delivered_by', 191)->nullable();
            $table->string('recieved_by', 191)->nullable();
            $table->string('file', 191)->nullable();
            $table->string('note', 191)->nullable();
            $table->string('status', 191);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
