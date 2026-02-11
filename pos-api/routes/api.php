<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InvoiceSettingController;
use App\Http\Controllers\SettingApiController;
use App\Http\Controllers\Api\AccountApiController;
use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\DiscountPlanApiController;
use App\Http\Controllers\Api\DiscountApiController;
use App\Http\Controllers\LabelsController;
use App\Http\Controllers\Api\AdjustmentApiController;
use App\Http\Controllers\Api\StockCountApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public routes (no authentication required)
Route::post('/login', [AuthController::class, 'login']);

Route::group(['middleware' => 'auth:sanctum'], function () {
    //menus
    Route::post('/menu', [MenuController::class, 'store']);
    Route::get('/menus', [MenuController::class, 'index']);
    Route::post('/menu/{id}', [MenuController::class, 'update']);
    Route::delete('/menu/{id}', [MenuController::class, 'destroy']);
    Route::get('menus/current-role', [MenuController::class, 'getMenuCurrentRole']);

    //categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/save-category', [CategoryController::class, 'saveCategory']);
    Route::get('/delete-category/{id}', [CategoryController::class, 'deleteCategory']);
    Route::get('/categories/parent', [CategoryController::class, 'getParentCategories']);

    //brands
    Route::get('/brands', [BrandController::class, 'getAllBrands']);
    Route::post('/save-brand', [BrandController::class, 'saveBrand']);
    Route::get('/delete-brand/{id}', [BrandController::class, 'deleteBrand']);

    //warehouses
    Route::get('/warehouses', [WarehouseController::class, 'getAllWarehouses']);
    Route::post('/save-warehouse', [WarehouseController::class, 'saveWarehouse']);
    Route::get('/delete-warehouse/{id}', [WarehouseController::class, 'deleteWarehouse']);

    //units
    Route::get('/units', [UnitController::class, 'getAllUnits']);
    Route::get('/units/base', [UnitController::class, 'getBaseUnits']);
    Route::post('/save-unit', [UnitController::class, 'saveUnit']);
    Route::get('/delete-unit/{id}', [UnitController::class, 'deleteUnit']);

    //invoice-settings
    Route::get('/invoice-settings', [InvoiceSettingController::class, 'getAllInvoiceSettings']);
    Route::post('/save-invoice-setting', [InvoiceSettingController::class, 'saveInvoiceSetting']);
    Route::get('/delete-invoice-setting/{id}', [InvoiceSettingController::class, 'deleteInvoiceSetting']);
    Route::get('/set-default-invoice-setting/{id}', [InvoiceSettingController::class, 'setDefaultInvoiceSetting']);

    //settings (Vue API)
    Route::get('/settings/general', [SettingApiController::class, 'getGeneralSetting']);
    Route::post('/settings/general', [SettingApiController::class, 'saveGeneralSetting']);
    Route::get('/settings/mail', [SettingApiController::class, 'getMailSetting']);
    Route::post('/settings/mail', [SettingApiController::class, 'saveMailSetting']);
    Route::get('/settings/reward-point', [SettingApiController::class, 'getRewardPointSetting']);
    Route::post('/settings/reward-point', [SettingApiController::class, 'saveRewardPointSetting']);
    Route::get('/settings/pos', [SettingApiController::class, 'getPosSetting']);
    Route::post('/settings/pos', [SettingApiController::class, 'savePosSetting']);
    Route::get('/settings/app', [SettingApiController::class, 'getAppSetting']);
    Route::get('/settings/app-token-delete/{id}', [SettingApiController::class, 'deleteAppToken']);

    //products
    Route::get('/products', [ProductController::class, 'getAllProducts']);
    Route::get('/products/form-data', [ProductController::class, 'getProductFormData']);
    Route::get('/product/{id}', [ProductController::class, 'getProduct']);
    Route::post('/save-product', [ProductController::class, 'saveProduct']);
    Route::get('/delete-product/{id}', [ProductController::class, 'deleteProduct']);
    Route::post('/products/import', [ProductController::class, 'importProduct']);
    Route::post('/products/all-in-stock', [ProductController::class, 'allProductInStock']);
    Route::post('/products/show-online', [ProductController::class, 'showAllProductOnline']);
    Route::get('/products/{id}/warehouse-data', [ProductController::class, 'productWarehouseData']);
    Route::get('/products/search', [ProductController::class, 'searchProducts']);
    Route::get('/products/barcode/init', [ProductController::class, 'barcodeInit']);
    Route::get('/products/barcode/lookup', [ProductController::class, 'barcodeLookup']);
    Route::post('/products/barcode/preview', [LabelsController::class, 'printLabelApi']);
    Route::post('/products/history/sales', [ProductController::class, 'saleHistoryData']);
    Route::post('/products/history/purchases', [ProductController::class, 'purchaseHistoryData']);
    Route::post('/products/history/sale-returns', [ProductController::class, 'saleReturnHistoryData']);
    Route::post('/products/history/purchase-returns', [ProductController::class, 'purchaseReturnHistoryData']);
    Route::post('/products/history/adjustments', [ProductController::class, 'adjustmentHistoryData']);
    Route::post('/products/history/transfers', [ProductController::class, 'transferHistoryData']);
    Route::post('/products/gallery', [ProductController::class, 'uploadGalleryImages']);
    Route::get('/generate-code', [ProductController::class, 'generateCode']);

    // Adjustments
    Route::get('/adjustments', [AdjustmentApiController::class, 'index']);
    Route::get('/adjustments/form-data', [AdjustmentApiController::class, 'formData']);
    Route::get('/adjustments/warehouses/{warehouse}', [AdjustmentApiController::class, 'warehouseProducts']);
    Route::get('/adjustments/product-lookup', [AdjustmentApiController::class, 'productLookup']);
    Route::get('/adjustments/{adjustment}', [AdjustmentApiController::class, 'show']);
    Route::post('/adjustments', [AdjustmentApiController::class, 'store']);
    Route::put('/adjustments/{adjustment}', [AdjustmentApiController::class, 'update']);
    Route::post('/adjustments/{adjustment}', [AdjustmentApiController::class, 'update']);
    Route::delete('/adjustments/{adjustment}', [AdjustmentApiController::class, 'destroy']);
    Route::post('/adjustments/bulk-delete', [AdjustmentApiController::class, 'bulkDestroy']);

    // Stock Counts
    Route::get('/stock-counts', [StockCountApiController::class, 'index']);
    Route::get('/stock-counts/options', [StockCountApiController::class, 'options']);
    Route::post('/stock-counts', [StockCountApiController::class, 'store']);
    Route::get('/stock-counts/{stockCount}', [StockCountApiController::class, 'show']);
    Route::post('/stock-counts/{stockCount}/finalize', [StockCountApiController::class, 'finalize']);
    Route::get('/stock-counts/{stockCount}/difference', [StockCountApiController::class, 'difference']);
    Route::get('/stock-counts/{stockCount}/adjustment-data', [StockCountApiController::class, 'adjustmentData']);
    Route::delete('/stock-counts/{stockCount}', [StockCountApiController::class, 'destroy']);

    //permission
    Route::get('/roles', [RoleController::class, 'getRoles']);
    Route::post('/roles', [RoleController::class, 'createRole']);
    Route::get('/roles/{id}/permissions', [RolePermissionController::class, 'getRolePermissions']);
    Route::post('/roles/{id}/assign-permissions', [RolePermissionController::class, 'assignPermissions']);
    Route::get('/roles/{id}', [RoleController::class, 'getRole']);
    Route::post('/roles/{id}', [RoleController::class, 'updateRole']);
    Route::delete('/roles/{id}', [RoleController::class, 'deleteRole']);
    Route::get('/users', [RoleController::class, 'users']);
    Route::post('/users/{user}/assign-role', [RoleController::class, 'assignRole']);

    Route::get('fetch-user-permissions', [RolePermissionController::class, 'getUserPermissions']);
    Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);
    Route::post('/permissions', [RolePermissionController::class, 'createPermission']);

    // Discount Plans
    Route::get('/discount-plans', [DiscountPlanApiController::class, 'index']);
    Route::get('/discount-plans/form-data', [DiscountPlanApiController::class, 'getFormData']);
    Route::post('/discount-plans', [DiscountPlanApiController::class, 'store']);
    Route::get('/discount-plans/{id}', [DiscountPlanApiController::class, 'show']);
    Route::post('/discount-plans/{id}', [DiscountPlanApiController::class, 'update']);

    // Discounts
    Route::get('/discounts', [DiscountApiController::class, 'index']);
    Route::get('/discounts/form-data', [DiscountApiController::class, 'getFormData']);
    Route::get('/discounts/product-search/{code}', [DiscountApiController::class, 'productSearch']);
    Route::post('/discounts', [DiscountApiController::class, 'store']);
    Route::get('/discounts/{id}', [DiscountApiController::class, 'show']);
    Route::post('/discounts/{id}', [DiscountApiController::class, 'update']);

    // Attendance (HRM)
    Route::get('/attendances', [AttendanceApiController::class, 'index']);
    Route::get('/attendances/form-data', [AttendanceApiController::class, 'formData']);
    Route::post('/attendances', [AttendanceApiController::class, 'store']);
    Route::delete('/attendances/{date}/{employee_id}', [AttendanceApiController::class, 'destroy']);
    Route::post('/attendances/delete-by-selection', [AttendanceApiController::class, 'deleteBySelection']);
    Route::post('/attendances/import-csv', [AttendanceApiController::class, 'importCsv']);

    // Accounts
    Route::get('/accounts', [AccountApiController::class, 'index']);
    Route::get('/accounts/options', [AccountApiController::class, 'options']);
    Route::post('/accounts', [AccountApiController::class, 'store']);
    Route::post('/accounts/{id}', [AccountApiController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountApiController::class, 'destroy']);
    Route::post('/accounts/{id}/make-default', [AccountApiController::class, 'makeDefault']);
    Route::get('/accounts/balance-sheet', [AccountApiController::class, 'balanceSheet']);
    Route::get('/accounts/statement', [AccountApiController::class, 'statement']);
});