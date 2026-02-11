<?php

/**
 * EXAMPLE API ROUTES WITH PERMISSION PROTECTION
 * 
 * Copy these patterns to your actual routes/api.php file
 * This file is for reference only
 */

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExamplePermissionController;

// Public routes (no authentication required)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    
    // Products routes with permission checks
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->middleware('permission:products-view');
        Route::post('/', [ProductController::class, 'store'])->middleware('permission:products-create');
        Route::get('/{id}', [ProductController::class, 'show'])->middleware('permission:products-view');
        Route::put('/{id}', [ProductController::class, 'update'])->middleware('permission:products-edit');
        Route::delete('/{id}', [ProductController::class, 'destroy'])->middleware('permission:products-delete');
    });

    // Sales routes with permission checks
    Route::prefix('sales')->group(function () {
        Route::get('/', [SaleController::class, 'index'])->middleware('permission:sales-view');
        Route::post('/', [SaleController::class, 'store'])->middleware('permission:sales-create');
        Route::get('/{id}', [SaleController::class, 'show'])->middleware('permission:sales-view');
        Route::put('/{id}', [SaleController::class, 'update'])->middleware('permission:sales-edit');
        Route::delete('/{id}', [SaleController::class, 'destroy'])->middleware('permission:sales-delete');
    });

    // Admin only routes (role-based)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/settings', [SettingController::class, 'index']);
    });

    // Super Admin only routes
    Route::middleware('role:super-admin')->prefix('super-admin')->group(function () {
        Route::get('/system-settings', [SystemController::class, 'settings']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::post('/permissions', [PermissionController::class, 'store']);
    });

    // Manager or Admin routes (multiple roles)
    Route::middleware(['auth:sanctum', 'role:admin|manager'])->group(function () {
        Route::get('/reports/sales', [ReportController::class, 'sales']);
        Route::get('/reports/inventory', [ReportController::class, 'inventory']);
    });

    // Multiple permission checks (user needs ANY of these)
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('permission:sales-view|purchases-view');

    // Group routes with same permission
    Route::middleware('permission:customers-view')->prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index']);
        Route::get('/{id}', [CustomerController::class, 'show']);
    });
});

// Example: Using Spatie's built-in middleware directly
Route::group([
    'middleware' => ['auth:sanctum', 'role:admin|super-admin']
], function () {
    Route::resource('warehouses', WarehouseController::class);
});

// Example: Complex permission checks in route groups
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Accounting module (accountant or admin)
    Route::middleware('role:accountant|admin')->prefix('accounting')->group(function () {
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::get('/reports', [AccountingReportController::class, 'index']);
    });

    // Inventory management (warehouse-manager or admin)
    Route::middleware('role:warehouse-manager|admin')->prefix('inventory')->group(function () {
        Route::get('/stock', [InventoryController::class, 'stock']);
        Route::post('/adjustments', [AdjustmentController::class, 'store']);
        Route::post('/transfers', [TransferController::class, 'store']);
    });
});
