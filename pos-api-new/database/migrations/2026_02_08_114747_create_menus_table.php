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
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('main_menu_icon', 191)->nullable();
            $table->string('main_menu', 191)->nullable();
            $table->string('sub_menu_icon', 191)->nullable();
            $table->string('sub_menu', 191)->nullable();
            $table->string('sub_menu_route', 191)->nullable();
            $table->string('second_sub_menu_icon', 191)->nullable();
            $table->string('second_sub_menu', 191)->nullable();
            $table->string('route', 191)->nullable();
            $table->string('controller', 191)->nullable();
            $table->integer('main_menu_order')->nullable();
            $table->integer('sub_menu_order')->nullable();
            $table->integer('child_menu_order')->nullable();
            $table->boolean('is_active')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menus');
    }
};
