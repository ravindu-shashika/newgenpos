<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_sales')) {
            return;
        }

        Schema::table('product_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('product_sales', 'net_unit_cost')) {
                $table->double('net_unit_cost')->default(0)->after('net_unit_price');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_sales')) {
            return;
        }

        Schema::table('product_sales', function (Blueprint $table) {
            if (Schema::hasColumn('product_sales', 'net_unit_cost')) {
                $table->dropColumn('net_unit_cost');
            }
        });
    }
};
