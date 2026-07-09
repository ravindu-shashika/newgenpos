<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('variant_masters')) {
            Schema::create('variant_masters', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->unsignedInteger('position')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('variant_master_values')) {
            Schema::create('variant_master_values', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('variant_master_id');
                $table->string('value', 100);
                $table->unsignedInteger('position')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('variant_master_id')
                    ->references('id')
                    ->on('variant_masters')
                    ->cascadeOnDelete();
                $table->unique(['variant_master_id', 'value']);
            });
        }

        if (Schema::hasTable('variant_masters') && DB::table('variant_masters')->count() === 0) {
            $now = now();
            $sizeId = DB::table('variant_masters')->insertGetId([
                'name' => 'Size',
                'position' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            foreach (['S', 'M', 'L', 'XL', 'XXL'] as $index => $value) {
                DB::table('variant_master_values')->insert([
                    'variant_master_id' => $sizeId,
                    'value' => $value,
                    'position' => $index + 1,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_master_values');
        Schema::dropIfExists('variant_masters');
    }
};
