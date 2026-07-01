<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_adjustments')) {
            return;
        }

        Schema::table('product_adjustments', function (Blueprint $table) {
            if (! Schema::hasColumn('product_adjustments', 'is_delete')) {
                $table->boolean('is_delete')->default(false)->after('action');
                $table->index('is_delete');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('product_adjustments')) {
            return;
        }

        Schema::table('product_adjustments', function (Blueprint $table) {
            if (Schema::hasColumn('product_adjustments', 'is_delete')) {
                $table->dropIndex(['is_delete']);
                $table->dropColumn('is_delete');
            }
        });
    }
};
