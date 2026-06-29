<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('account_id')->nullable()->after('id');
            $table->string('phone', 191)->after('password');
            $table->string('company_name', 191)->nullable()->after('phone');
            $table->integer('role_id')->after('company_name');
            $table->integer('biller_id')->nullable()->after('role_id');
            $table->integer('warehouse_id')->nullable()->after('biller_id');
            $table->boolean('is_active')->default(1)->after('warehouse_id');
            $table->boolean('is_deleted')->default(0)->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'account_id',
                'phone',
                'company_name',
                'role_id',
                'biller_id',
                'warehouse_id',
                'is_active',
                'is_deleted',
            ]);
        });
    }
};
