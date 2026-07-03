<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_exchanges', function (Blueprint $table) {
            if (!Schema::hasColumn('product_exchanges', 'product_sale_id')) {
                $table->unsignedInteger('product_sale_id')->nullable()->after('exchange_id');
            }
            if (!Schema::hasColumn('product_exchanges', 'variant_id')) {
                $table->unsignedInteger('variant_id')->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('product_exchanges', 'product_batch_id')) {
                $table->unsignedInteger('product_batch_id')->nullable()->after('variant_id');
            }
            if (!Schema::hasColumn('product_exchanges', 'imei_number')) {
                $table->text('imei_number')->nullable()->after('product_batch_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_exchanges', function (Blueprint $table) {
            foreach (['imei_number', 'product_batch_id', 'variant_id', 'product_sale_id'] as $col) {
                if (Schema::hasColumn('product_exchanges', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
