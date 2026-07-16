<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['product_warehouse', 'product_warehouses'] as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'max_price')) {
                continue;
            }

            Schema::table($table, function (Blueprint $table) {
                $table->decimal('max_price', 15, 2)->nullable()->after('price');
            });
        }
    }

    public function down(): void
    {
        foreach (['product_warehouse', 'product_warehouses'] as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'max_price')) {
                continue;
            }

            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('max_price');
            });
        }
    }
};
