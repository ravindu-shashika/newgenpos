<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('stock_counts') || Schema::hasColumn('stock_counts', 'count_scope')) {
            return;
        }

        Schema::table('stock_counts', function (Blueprint $table) {
            $table->string('count_scope', 32)->default('all')->after('type');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('stock_counts') || !Schema::hasColumn('stock_counts', 'count_scope')) {
            return;
        }

        Schema::table('stock_counts', function (Blueprint $table) {
            $table->dropColumn('count_scope');
        });
    }
};
