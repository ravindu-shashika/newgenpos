<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sale_exchanges')) {
            Schema::table('sale_exchanges', function (Blueprint $table) {
                if (!Schema::hasColumn('sale_exchanges', 'client_uuid')) {
                    $table->uuid('client_uuid')->nullable()->unique()->after('id');
                }
            });
        }

        if (!Schema::hasTable('pos_sync_exchanges')) {
            Schema::create('pos_sync_exchanges', function (Blueprint $table) {
                $table->id();
                $table->uuid('client_uuid')->unique();
                $table->string('device_id', 191)->nullable()->index();
                $table->unsignedBigInteger('exchange_id')->nullable()->index();
                $table->string('reference_no', 191)->nullable();
                $table->string('sync_status', 32)->default('pending')->index();
                $table->text('error_message')->nullable();
                $table->json('payload')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sync_exchanges');

        if (Schema::hasTable('sale_exchanges') && Schema::hasColumn('sale_exchanges', 'client_uuid')) {
            Schema::table('sale_exchanges', function (Blueprint $table) {
                $table->dropColumn('client_uuid');
            });
        }
    }
};
