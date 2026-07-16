<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products')) {
            return;
        }
        if (Schema::hasColumn('products', 'batch_number_mode')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            // Nullable: only batch-marked products store auto/manual.
            $table->string('batch_number_mode', 20)->nullable()->after('is_batch');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('products') || !Schema::hasColumn('products', 'batch_number_mode')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('batch_number_mode');
        });
    }
};
