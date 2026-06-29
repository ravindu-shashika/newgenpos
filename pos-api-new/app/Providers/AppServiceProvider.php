<?php

namespace App\Providers;

use App\Models\Currency;
use App\Models\GeneralSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\ViewModels\ISmsModel::class,
            \App\ViewModels\NullSmsModel::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (!Schema::hasTable('general_settings')) {
            return;
        }

        $general = Cache::remember('general_setting', 60 * 60 * 24, function () {
            return GeneralSetting::latest()->first();
        });

        if (!$general) {
            return;
        }

        $currency = null;
        if ($general->currency && Schema::hasTable('currencies')) {
            $currency = Cache::remember('currency_'.$general->currency, 60 * 60 * 24, function () use ($general) {
                return Currency::find($general->currency);
            });
        }

        config([
            'staff_access' => $general->staff_access ?? null,
            'date_format' => $general->date_format ?? 'd-m-Y',
            'currency' => $currency?->symbol ?? $currency?->code ?? '',
            'currency_position' => $general->currency_position ?? 'prefix',
            'decimal' => (int) ($general->decimal ?? 2),
            'company_name' => $general->company_name ?? config('app.name'),
        ]);

        if (!empty($general->timezone)) {
            config(['app.timezone' => $general->timezone]);
            date_default_timezone_set($general->timezone);
        }
    }
}
