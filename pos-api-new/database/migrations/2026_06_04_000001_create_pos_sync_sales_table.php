<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sync_sales', function (Blueprint $table) {
            $table->id();
            $table->uuid('client_uuid')->unique();
            $table->string('device_id', 191)->nullable()->index();
            $table->unsignedBigInteger('sale_id')->nullable()->index();
            $table->string('reference_no', 191)->nullable();
            $table->string('sync_status', 32)->default('synced')->index();
            $table->text('error_message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sync_sales');
    }
};
