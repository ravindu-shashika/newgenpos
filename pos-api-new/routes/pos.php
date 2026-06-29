<?php

/**
 * POS API — mounted at /pos (see bootstrap/app.php, not under /api)
 *
 * - Flutter pos_app: device token (pos_*)
 * - React SPA POS: Sanctum session on dashboard routes
 */

use App\Http\Controllers\PosAppController;
use App\Http\Controllers\PosAuthController;
use App\Http\Controllers\PosCashRegisterController;
use App\Http\Controllers\PosDashboardController;
use App\Http\Controllers\PosDownloadController;
use Illuminate\Support\Facades\Route;

Route::prefix('pos')->name('pos.')->group(function () {
    // --- Public (device registration) ---
    Route::get('health', [PosAppController::class, 'health']);
    Route::get('warehouses', [PosAuthController::class, 'warehouses']);
    Route::post('register', [PosAuthController::class, 'register']);
    Route::post('auth/token', [PosAuthController::class, 'issueToken']);
    Route::post('terminal/status', [PosAuthController::class, 'terminalStatus']);

    // --- Flutter pos_app (POS device token; Sanctum also accepted in controllers) ---
    Route::middleware(['auth.pos.token'])->group(function () {
        Route::get('auth/me', [PosAuthController::class, 'me']);
        Route::get('bootstrap', [PosAppController::class, 'bootstrap']);
        Route::get('cash-register/check/{warehouseId}', [PosCashRegisterController::class, 'check']);
        Route::post('cash-register/open', [PosCashRegisterController::class, 'open']);
        Route::get('cash-register/{id}/details', [PosCashRegisterController::class, 'details']);
        Route::post('cash-register/close', [PosCashRegisterController::class, 'close']);
        Route::get('catalog', [PosAppController::class, 'catalog']);
        Route::get('scan', [PosAppController::class, 'scan']);
        Route::get('search', [PosAppController::class, 'search']);
        Route::post('sales/sync', [PosAppController::class, 'syncSales']);
        Route::post('sales/sync-status', [PosAppController::class, 'syncStatus']);
        Route::get('sales/return-lookup', [PosAppController::class, 'returnSaleLookup']);
        Route::get('returns/credits', [PosAppController::class, 'returnCredits']);
        Route::get('returns/lookup', [PosAppController::class, 'returnLookup']);
        Route::post('returns/sync', [PosAppController::class, 'syncReturns']);
        Route::post('returns/sync-status', [PosAppController::class, 'syncReturnStatus']);
        Route::post('exchanges/sync', [PosAppController::class, 'syncExchanges']);
        Route::post('exchanges/sync-status', [PosAppController::class, 'syncExchangeStatus']);
        Route::post('setup/manifest', [PosDownloadController::class, 'manifest']);
        Route::post('setup/download', [PosDownloadController::class, 'download']);
        Route::post('setup/download-all', [PosDownloadController::class, 'downloadAll']);
    });

    // --- React web POS (logged-in dashboard user) ---
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/', [PosDashboardController::class, 'bootstrap']);
        Route::get('products', [PosDashboardController::class, 'products']);
        Route::post('product-lookup', [PosDashboardController::class, 'lookupProduct']);
        Route::get('draft/{id}', [PosDashboardController::class, 'draft']);
    });
});
