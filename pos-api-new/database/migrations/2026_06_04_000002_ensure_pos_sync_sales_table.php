<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safety net when migrations table says "ran" but pos_sync_sales was never created.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pos_sync_sales')) {
            return;
        }

        Schema::create('pos_sync_sales', function (Blueprint $table) {
            $table->id();
            $table->uuid('client_uuid')->unique();
            $table->string('device_id', 191)->nullable()->index();
            $table->unsignedBigInteger('sale_id')->nullable()->index();
            $table->string('reference_no', 191)->nullable();
            $table->string('sync_status', 32)->default('pending')->index();
            $table->text('error_message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Intentionally no-op — do not drop data on rollback of ensure migration.
    }
};
