<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('products') || !Schema::hasColumn('products', 'batch_number_mode')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->string('batch_number_mode', 20)->nullable()->default(null)->change();
        });

        // Keep mode only on batch-marked products.
        DB::table('products')
            ->where(function ($q) {
                $q->whereNull('is_batch')
                    ->orWhere('is_batch', 0)
                    ->orWhere('is_batch', false)
                    ->orWhere('is_batch', '0');
            })
            ->update(['batch_number_mode' => null]);

        DB::table('products')
            ->where(function ($q) {
                $q->where('is_batch', 1)
                    ->orWhere('is_batch', true)
                    ->orWhere('is_batch', '1');
            })
            ->whereNull('batch_number_mode')
            ->update(['batch_number_mode' => 'auto']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('products') || !Schema::hasColumn('products', 'batch_number_mode')) {
            return;
        }

        DB::table('products')->whereNull('batch_number_mode')->update(['batch_number_mode' => 'auto']);

        Schema::table('products', function (Blueprint $table) {
            $table->string('batch_number_mode', 20)->default('auto')->nullable(false)->change();
        });
    }
};
