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
        Schema::create('general_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_title', 191);
            $table->string('site_logo', 191)->nullable();
            $table->string('favicon', 191)->nullable();
            $table->boolean('is_rtl')->nullable();
            $table->string('currency', 191);
            $table->integer('package_id')->nullable();
            $table->string('subscription_type', 255)->nullable();
            $table->string('staff_access', 191);
            $table->string('without_stock', 255);
            $table->string('date_format', 191);
            $table->string('developed_by', 191)->nullable();
            $table->string('invoice_format', 191)->nullable();
            $table->integer('decimal')->nullable();
            $table->integer('state')->nullable();
            $table->string('theme', 191);
            $table->text('modules')->nullable();
            $table->string('currency_position', 191);
            $table->date('expiry_date')->nullable();
            $table->string('expiry_type', 255);
            $table->string('expiry_value', 255);
            $table->unsignedInteger('expiry_alert_days')->comment('Number of days before expiry to show alert');
            $table->boolean('is_zatca')->nullable();
            $table->string('company_name', 191)->nullable();
            $table->string('vat_registration_number', 191)->nullable();
            $table->boolean('is_packing_slip');
            $table->string('app_key', 100)->nullable();
            $table->string('token', 191)->nullable();
            $table->tinyInteger('show_products_details_in_sales_table');
            $table->tinyInteger('show_products_details_in_purchase_table');
            $table->decimal('default_margin_value', 8, 2);
            $table->string('timezone', 191)->nullable();
            $table->text('font_css')->nullable();
            $table->longText('auth_css')->nullable();
            $table->longText('pos_css')->nullable();
            $table->longText('custom_css')->nullable();
            $table->integer('disable_signup');
            $table->integer('disable_forgot_password');
            $table->integer('margin_type');
            $table->text('maintenance_allowed_ips')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_settings');
    }
};
