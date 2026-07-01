<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('barcodes')) {
            return;
        }

        Schema::table('barcodes', function (Blueprint $table) {
            if (! Schema::hasColumn('barcodes', 'print_options')) {
                $table->json('print_options')->nullable()->after('is_custom');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('barcodes')) {
            return;
        }

        Schema::table('barcodes', function (Blueprint $table) {
            if (Schema::hasColumn('barcodes', 'print_options')) {
                $table->dropColumn('print_options');
            }
        });
    }
};
