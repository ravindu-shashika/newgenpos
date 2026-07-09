<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_purchases')) {
            return;
        }

        if (!Schema::hasColumn('product_purchases', 'discount_type')) {
            Schema::table('product_purchases', function (Blueprint $table) {
                $table->enum('discount_type', ['flat', 'percentage'])
                    ->default('flat')
                    ->after('discount');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_purchases') || !Schema::hasColumn('product_purchases', 'discount_type')) {
            return;
        }

        Schema::table('product_purchases', function (Blueprint $table) {
            $table->dropColumn('discount_type');
        });
    }
};
