<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('returns')) {
            Schema::table('returns', function (Blueprint $table) {
                if (!Schema::hasColumn('returns', 'settled_amount')) {
                    $table->decimal('settled_amount', 15, 4)->default(0)->after('grand_total');
                }
                if (!Schema::hasColumn('returns', 'client_uuid')) {
                    $table->uuid('client_uuid')->nullable()->unique()->after('id');
                }
            });
        }

        if (Schema::hasTable('product_returns')) {
            Schema::table('product_returns', function (Blueprint $table) {
                if (!Schema::hasColumn('product_returns', 'is_damage')) {
                    $table->boolean('is_damage')->default(false)->after('total');
                }
            });
        }

        if (!Schema::hasTable('return_sale_settlements')) {
            Schema::create('return_sale_settlements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('return_id')->index();
                $table->unsignedBigInteger('sale_id')->index();
                $table->decimal('amount', 15, 4);
                $table->unsignedBigInteger('user_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('pos_sync_returns')) {
            Schema::create('pos_sync_returns', function (Blueprint $table) {
                $table->id();
                $table->uuid('client_uuid')->unique();
                $table->string('device_id', 191)->nullable()->index();
                $table->unsignedBigInteger('return_id')->nullable()->index();
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
        Schema::dropIfExists('pos_sync_returns');
        Schema::dropIfExists('return_sale_settlements');

        if (Schema::hasTable('product_returns') && Schema::hasColumn('product_returns', 'is_damage')) {
            Schema::table('product_returns', function (Blueprint $table) {
                $table->dropColumn('is_damage');
            });
        }

        if (Schema::hasTable('returns')) {
            Schema::table('returns', function (Blueprint $table) {
                if (Schema::hasColumn('returns', 'settled_amount')) {
                    $table->dropColumn('settled_amount');
                }
                if (Schema::hasColumn('returns', 'client_uuid')) {
                    $table->dropColumn('client_uuid');
                }
            });
        }
    }
};
