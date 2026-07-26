<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'cheque_status')) {
                $table->string('cheque_status', 32)->nullable()->after('paying_method');
            }
            if (!Schema::hasColumn('payments', 'cheque_return_reason')) {
                $table->text('cheque_return_reason')->nullable()->after('cheque_status');
            }
            if (!Schema::hasColumn('payments', 'cheque_returned_at')) {
                $table->timestamp('cheque_returned_at')->nullable()->after('cheque_return_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'cheque_returned_at')) {
                $table->dropColumn('cheque_returned_at');
            }
            if (Schema::hasColumn('payments', 'cheque_return_reason')) {
                $table->dropColumn('cheque_return_reason');
            }
            if (Schema::hasColumn('payments', 'cheque_status')) {
                $table->dropColumn('cheque_status');
            }
        });
    }
};
