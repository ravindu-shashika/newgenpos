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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('grace_in')->comment('Grace period (minutes) before marking late');
            $table->integer('grace_out')->comment('Grace period (minutes) before marking early leave');
            $table->decimal('total_hours', 5, 2)->nullable()->comment('Total working hours for the shift');
            $table->boolean('is_active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
