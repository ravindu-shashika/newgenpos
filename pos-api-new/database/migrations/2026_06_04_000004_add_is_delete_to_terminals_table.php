<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terminals', function (Blueprint $table) {
            $table->boolean('is_delete')->default(false)->after('is_active');
            $table->index('is_delete');
        });
    }

    public function down(): void
    {
        Schema::table('terminals', function (Blueprint $table) {
            $table->dropIndex(['is_delete']);
            $table->dropColumn('is_delete');
        });
    }
};
