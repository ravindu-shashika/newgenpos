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
        Schema::create('invoice_settings', function (Blueprint $table) {
            $table->id();
            $table->string('template_name', 191);
            $table->string('invoice_name', 191)->nullable();
            $table->string('invoice_logo', 191)->nullable();
            $table->string('file_type', 191)->nullable();
            $table->string('prefix', 191)->nullable();
            $table->string('number_of_digit', 191)->nullable();
            $table->string('numbering_type', 191)->nullable();
            $table->unsignedBigInteger('start_number')->nullable();
            $table->unsignedBigInteger('last_invoice_number')->nullable();
            $table->text('header_text')->nullable();
            $table->string('header_title', 191)->nullable();
            $table->text('footer_text')->nullable();
            $table->string('footer_title', 191)->nullable();
            $table->string('preview_invoice', 191)->nullable();
            $table->string('size', 191)->nullable();
            $table->string('primary_color', 191)->nullable();
            $table->string('secondary_color', 191)->nullable();
            $table->string('text_color', 191)->nullable();
            $table->string('company_logo', 191)->nullable();
            $table->string('logo_height', 191)->nullable();
            $table->string('logo_width', 191)->nullable();
            $table->boolean('is_default')->comment('0=not default, 1=default');
            $table->boolean('status');
            $table->string('invoice_date_format', 191);
            $table->json('show_column')->nullable();
            $table->json('extra')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_settings');
    }
};
