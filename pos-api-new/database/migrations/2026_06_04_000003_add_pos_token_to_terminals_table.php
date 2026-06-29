<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('terminals', function (Blueprint $table) {
            $table->string('client_token', 128)->nullable()->after('activation_token');
            $table->string('pos_token', 128)->nullable()->unique()->after('client_token');
            $table->timestamp('pos_token_issued_at')->nullable()->after('pos_token');
        });
    }

    public function down(): void
    {
        Schema::table('terminals', function (Blueprint $table) {
            $table->dropColumn(['client_token', 'pos_token', 'pos_token_issued_at']);
        });
    }
};
