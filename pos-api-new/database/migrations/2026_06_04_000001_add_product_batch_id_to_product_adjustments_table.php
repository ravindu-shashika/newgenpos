<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_adjustments')) {
            return;
        }

        if (!Schema::hasColumn('product_adjustments', 'product_batch_id')) {
            Schema::table('product_adjustments', function (Blueprint $table) {
                $table->unsignedInteger('product_batch_id')->nullable()->after('variant_id');
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('product_adjustments')
            && Schema::hasColumn('product_adjustments', 'product_batch_id')
        ) {
            Schema::table('product_adjustments', function (Blueprint $table) {
                $table->dropColumn('product_batch_id');
            });
        }
    }
};
