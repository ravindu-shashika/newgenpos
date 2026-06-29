<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'access_pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('access_pin', 255)->nullable()->after('password');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'access_pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('access_pin');
            });
        }
    }
};
