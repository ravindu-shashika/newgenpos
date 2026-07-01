<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'alt_code')) {
                $table->string('alt_code', 191)->nullable()->after('code');
            }
            if (! Schema::hasColumn('products', 'max_price')) {
                $table->double('max_price')->nullable()->after('price');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'alt_code')) {
                $table->dropColumn('alt_code');
            }
            if (Schema::hasColumn('products', 'max_price')) {
                $table->dropColumn('max_price');
            }
        });
    }
};
