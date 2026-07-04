<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| cPanel helpers (no SSH / artisan CLI)
|--------------------------------------------------------------------------
| 1. Update .env (e.g. CORS_ALLOWED_ORIGINS=https://kbt.newgenideas.com)
| 2. Open in browser:
|    https://YOUR-API-HOST/clear-all-cache?key=YOUR_SECRET
|
| Set ARTISAN_WEB_KEY in .env (required in production).
*/

Route::get('/clear-all-cache', function () {
    $key = (string) env('ARTISAN_WEB_KEY', '');
    $provided = (string) request()->query('key', '');

    if ($key === '' || ! hash_equals($key, $provided)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized. Add ARTISAN_WEB_KEY to .env and open /clear-all-cache?key=YOUR_SECRET',
        ], 403);
    }

    try {
        Artisan::call('optimize:clear');
        $optimizeOutput = trim(Artisan::output());

        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');

        // Rebuild config cache from current .env (includes CORS_ALLOWED_ORIGINS)
        Artisan::call('config:cache');
        $cacheOutput = trim(Artisan::output());

        return response()->json([
            'status' => 'success',
            'message' => 'Caches cleared and config rebuilt from .env',
            'cors_allowed_origins' => config('cors.allowed_origins'),
            'supports_credentials' => config('cors.supports_credentials'),
            'app_url' => config('app.url'),
            'optimize_output' => $optimizeOutput,
            'cache_output' => $cacheOutput,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});
