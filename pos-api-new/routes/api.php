<?php

use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| API Routes (React SPA + legacy JSON)
|--------------------------------------------------------------------------
|
| Single route file for the React dashboard under /api/.
|
*/

use App\Http\Controllers\AccountDashboardController;
use App\Http\Controllers\AccountStatementDashboardController;
use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AddonInstallController;
use App\Http\Controllers\AdjustmentController as DashboardAdjustmentController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AttendanceController as DashboardAttendanceController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BalanceSheetDashboardController;
use App\Http\Controllers\BarcodeController as DashboardBarcodeController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\BillerController as DashboardBillerController;
use App\Http\Controllers\BillerController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\BookingDashboardController;
use App\Http\Controllers\BrandController as DashboardBrandController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CategoryController as DashboardCategoryController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChallanController;
use App\Http\Controllers\ChallanDashboardController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CouponDashboardController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CourierDashboardController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomFieldController;
use App\Http\Controllers\CustomerController as DashboardCustomerController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerGroupController;
use App\Http\Controllers\DamageStockController as DashboardDamageStockController;
use App\Http\Controllers\DamageStockController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DeliveryDashboardController;
use App\Http\Controllers\DepartmentController as DashboardDepartmentController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController as DashboardDesignationController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\DiscountPlanController;
use App\Http\Controllers\EmployeeController as DashboardEmployeeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\ExchangeDashboardController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseDashboardController;
use App\Http\Controllers\GiftCardController;
use App\Http\Controllers\GiftCardDashboardController;
use App\Http\Controllers\HolidayController as DashboardHolidayController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\HrmController;
use App\Http\Controllers\IncomeCategoryController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\IncomeDashboardController;
use App\Http\Controllers\InstallmentPlanController;
use App\Http\Controllers\InstallmentPlanDashboardController;
use App\Http\Controllers\InvoiceSettingController;
use App\Http\Controllers\LabelsController;
use App\Http\Controllers\LanguageController as DashboardLanguageController;
use App\Http\Controllers\LanguageController;
use App\Http\Controllers\LeaveController as DashboardLeaveController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController as DashboardLeaveTypeController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\MoneyTransferController;
use App\Http\Controllers\MoneyTransferDashboardController;
use App\Http\Controllers\NavbarController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OvertimeController as DashboardOvertimeController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\PackingSlipController;
use App\Http\Controllers\PackingSlipDashboardController;
use App\Http\Controllers\PayrollController as DashboardPayrollController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PosDashboardController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\ProductController as DashboardProductController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationDashboardController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\ReturnPurchaseController;
use App\Http\Controllers\ReturnPurchaseDashboardController;
use App\Http\Controllers\ReturnSaleDashboardController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SaleAgentController as DashboardSaleAgentController;
use App\Http\Controllers\SaleAgentController;
use App\Http\Controllers\SaleController as WebSaleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleDashboardController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ShiftController as DashboardShiftController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\SmsTemplateController;
use App\Http\Controllers\SteadFastController;
use App\Http\Controllers\StockCountController as DashboardStockCountController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\SupplierController as DashboardSupplierController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TaxController as DashboardTaxController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\TerminalController;
use App\Http\Controllers\ThemeSettingController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferDashboardController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\UnitController as DashboardUnitController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UniqueCodeController;
use App\Http\Controllers\UserController as DashboardUserController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\WhatsappController;

use Illuminate\Support\Facades\Route;

$middleware = ['api'];
    // if (config('database.connections.saleprosaas_landlord')) {
    //     $middleware[] = InitializeTenancyByDomain::class;
    //     $middleware[] = PreventAccessFromCentralDomains::class;
    // }

Route::middleware($middleware)->name('api.')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth.api.token')->get('labels/print', [LabelsController::class, 'printLabel']);

    Route::middleware(['auth:sanctum'])->group(function () {
        // --- Auth bootstrap ---
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/generalsettings', [AuthController::class, 'generalsettings']);
        Route::get('fetch-user-permissions', [RolePermissionController::class, 'getUserPermissions']);
        Route::get('codes/check', [UniqueCodeController::class, 'check']);
        Route::get('get-menu', [MenuController::class, 'getMenu']);
        Route::get('navbar/bootstrap', [NavbarController::class, 'bootstrap']);
        Route::post('navbar/language/{id}', [NavbarController::class, 'switchLanguage']);

        // --- SPA static routes (register before {id} resources) ---
        Route::controller(DashboardProductController::class)->group(function () {
            Route::get('products/initial-data', 'createInitialData');
            Route::get('products/gencode', 'generateCode');
            Route::get('products/search', 'search');
            Route::get('products/lims_product_search', 'limsProductSearch');
            Route::get('products/catalog-search/{term}', 'catalogSearch');
            Route::get('products/saleunit/{id}', 'saleUnit');
            Route::get('products/{id}/edit', 'editInitialData');
            Route::post('products/product-data', 'productData');
            Route::post('products/update', 'updateProduct');
        });
        Route::post('product', [DashboardProductController::class, 'store']);
        Route::delete('products/{id}', [DashboardProductController::class, 'destroy']);
        Route::post('tax', [DashboardTaxController::class, 'store']);
        // SPA static paths — register before resource `{id}` routes
        Route::controller(DashboardCategoryController::class)->group(function () {
            Route::get('categories/list', 'listForSelect');
        });
        Route::controller(DashboardUnitController::class)->group(function () {
            Route::get('unit/base-units', 'listForSelect');
        });
        Route::controller(DashboardAdjustmentController::class)->group(function () {
            Route::post('qty_adjustment/deletebyselection', 'deleteBySelection');
            Route::get('qty_adjustment/getproduct/{id}', 'getProduct');
            Route::get('qty_adjustment/lims_product_search', 'limsProductSearch');
        });
        Route::resource('qty_adjustment', DashboardAdjustmentController::class)->only(['index', 'destroy', 'create', 'store', 'edit', 'update']);
        Route::controller(DashboardDamageStockController::class)->group(function () {
            Route::post('damage-stock/deletebyselection', 'deleteBySelection');
            Route::get('damage-stock/getproduct/{id}', 'getProduct');
            Route::get('damage-stock/lims_product_search', 'limsProductSearch');
        });
        Route::resource('damage-stock', DashboardDamageStockController::class)->only(['index', 'destroy', 'create', 'store', 'edit', 'update']);
        Route::controller(DashboardStockCountController::class)->group(function () {
            Route::post('stock-count/finalize', 'finalize');
            Route::get('stock-count/stockdif/{id}', 'stockDif');
            Route::get('stock-count/{id}/adjustment-form', 'adjustmentForm');
        });
        Route::resource('stock-count', DashboardStockCountController::class)->only(['index', 'store']);
        // Purchase static paths — register before `purchases/{purchase}` resource
        Route::get('purchases/lims_product_search', [PurchaseController::class, 'limsProductSearch']);
        Route::get('purchases/suggest-batch', [PurchaseController::class, 'suggestPurchaseBatch']);
        Route::get('purchases/product-search', [PurchaseController::class, 'productSearch']);
        Route::get('purchases/products/{productId}/variants', [PurchaseController::class, 'productVariants']);
        Route::get('purchases/create', [PurchaseController::class, 'create']);
        Route::get('purchases/purchase_by_csv', [PurchaseController::class, 'purchaseByCsv']);
        Route::get('purchases/deleted_data', [PurchaseController::class, 'showDeletedPurchases']);
        Route::get('purchases/{id}/edit', [PurchaseController::class, 'edit']);
        Route::post('importpurchase', [PurchaseController::class, 'importPurchase']);
        Route::post('purchases/deletebyselection', [PurchaseController::class, 'deleteBySelection']);
        Route::delete('purchases/force-delete-selected', [PurchaseController::class, 'forceDeleteSelected']);
        // Quotation static paths — register before `quotations/{id}` resource
        Route::get('quotations/warehouse-products', [QuotationDashboardController::class, 'warehouseProducts']);
        Route::get('quotations/product-search', [QuotationDashboardController::class, 'productSearch']);
        Route::get('quotations/customer-group/{customerId}', [QuotationDashboardController::class, 'customerGroup']);
        Route::get('quotations/create', [QuotationDashboardController::class, 'createForm']);
        Route::get('quotations/{id}/edit', [QuotationDashboardController::class, 'editForm']);
        Route::get('quotations/{id}/create-sale', [QuotationDashboardController::class, 'createSaleForm']);
        Route::get('quotations/{id}/create-purchase', [QuotationDashboardController::class, 'createPurchaseForm']);
        // Transfer static paths — register before `transfers/{id}` resource
        Route::get('transfers/warehouse-products', [TransferDashboardController::class, 'warehouseProducts']);
        Route::get('transfers/product-search', [TransferDashboardController::class, 'productSearch']);
        Route::get('transfers/create', [TransferDashboardController::class, 'createForm']);
        Route::get('transfers/transfer_by_csv', [TransferDashboardController::class, 'importForm']);
        Route::get('expenses/{id}/edit', [ExpenseController::class, 'edit']);
        Route::get('incomes/{id}/edit', [IncomeController::class, 'edit']);
        Route::get('expense_categories/gencode', [ExpenseCategoryController::class, 'generateCode']);
        Route::get('income_categories/gencode', [IncomeCategoryController::class, 'generateCode']);
        Route::controller(WebSaleController::class)->group(function () {
            Route::get('sales/lims_product_search', 'limsProductSearch');
            Route::get('sales/lims_sale_search', 'limsSaleSearch');
            Route::get('sales/sale_by_csv', 'saleByCsv');
            Route::get('sales/deleted_data', 'showDeletedSales');
            Route::get('sales/recent-sale', 'recentSale');
            Route::get('sales/recent-draft', 'recentDraft');
            Route::get('sales/search', 'search');
            });

        // --- Dashboard SPA controllers (brand, POS, …) ---
Route::controller(DashboardBrandController::class)->group(function () {
            Route::post('brand/import', 'importBrand');
            Route::post('brand/deletebyselection', 'deleteBySelection');
        });
        Route::resource('brand', DashboardBrandController::class);

        Route::controller(DashboardCategoryController::class)->group(function () {
            Route::get('categories/list', 'listForSelect');
            Route::post('category/import', 'import');
            Route::post('category/deletebyselection', 'deleteBySelection');
        });
        Route::resource('category', DashboardCategoryController::class);

        Route::controller(DashboardUnitController::class)->group(function () {
            Route::get('unit/base-units', 'listForSelect');
            Route::post('unit/import', 'importUnit');
            Route::post('unit/deletebyselection', 'deleteBySelection');
        });
        Route::resource('unit', DashboardUnitController::class);

        /*
        |----------------------------------------------------------------------
        | POS routes → routes/pos.php mounted at /pos (not /api)
        |----------------------------------------------------------------------
        */

        // --- Legacy web routes (reports, settings, manufacturing, …) ---

        Route::get('/languages', [LanguageController::class, 'index']);
        Route::post('/languages/create', [LanguageController::class, 'store']);
        Route::post('/languages/{id}/set-default', [LanguageController::class, 'setDefault']);
        Route::put('/languages/{id}', [LanguageController::class, 'update']);
        Route::delete('/languages/{id}', [LanguageController::class, 'destroy']);

        Route::get('/translations', [TranslationController::class, 'index']);
    Route::get('/translations/{locale}', [TranslationController::class, 'fetchByLanguage']);
    Route::post('/translations', [TranslationController::class, 'store']);
    Route::put('/translations/{id}', [TranslationController::class, 'update']);
    Route::delete('/translations/{id}', [TranslationController::class, 'destroy']);

    Route::controller(HomeController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/dashboard', 'dashboard');

        Route::get('new-release', 'newVersionReleasePage');
        Route::post('version-upgrade', 'versionUpgrade');

        Route::get('/yearly-best-selling-price', 'yearlyBestSellingPrice');
        Route::get('/yearly-best-selling-qty', 'yearlyBestSellingQty');
        Route::get('/monthly-best-selling-qty', 'monthlyBestSellingQty');
        Route::get('/recent-sale', 'recentSale');
        Route::get('/recent-purchase', 'recentPurchase');
        Route::get('/recent-quotation', 'recentQuotation');
        Route::get('/recent-payment', 'recentPayment');
        Route::get('switch-theme/{theme}', 'switchTheme');
        Route::get('/dashboard-filter/{start_date}/{end_date}/{warehouse_id}', 'dashboardFilter');
        Route::get('addon-list', 'addonList');
        Route::get('my-transactions/{year}/{month}', 'myTransaction');
    });
Route::controller(ProductController::class)->group(function () {
        Route::get('products/getdata/{id}/{variant_id}', 'getData');
        Route::get('products/product_warehouse/{id}', 'productWarehouseData');
        Route::get('products/print_barcode', 'printBarcode');
        Route::post('products/deletebyselection', 'deleteBySelection');
        Route::get('products/variant-data/{id}', 'variantData');
        Route::get('products/history', 'history');
        Route::post('products/sale-history-data', 'saleHistoryData');
        Route::post('products/purchase-history-data', 'purchaseHistoryData');
        Route::post('products/sale-return-history-data', 'saleReturnHistoryData');
        Route::post('products/purchase-return-history-data', 'purchaseReturnHistoryData');
        Route::post('products/adjustment-history-data', 'adjustmentHistoryData');
        Route::post('products/transfer-history-data', 'transferHistoryData');

        Route::post('importproduct', 'importProduct');
        Route::post('exportproduct', 'exportProduct');
        Route::get('products/all-product-in-stock', 'allProductInStock');
        Route::get('products/show-all-product-online', 'showAllProductOnline');
        Route::get('check-batch-availability/{product_id}/{batch_no}/{warehouse_id}', 'checkBatchAvailability');
        Route::get('product-price/{id}', 'getProductPrice');
    });


    Route::get('language_switch/{id}', [LanguageController::class, 'switchLanguage']);

    Route::resource('role', RoleController::class);
    Route::controller(RoleController::class)->group(function () {
        Route::get('role/permission/{id}', 'permission');
        Route::post('role/set_permission', 'setPermission');
    });

    //Sms Template
    Route::resource('smstemplates', SmsTemplateController::class);
Route::controller(WarehouseController::class)->group(function () {
        Route::post('importwarehouse', 'importWarehouse');
        Route::post('warehouse/deletebyselection', 'deleteBySelection');
        Route::get('warehouse/lims_warehouse_search', 'limsWarehouseSearch');
        Route::get('warehouse/all', 'warehouseAll');
    });
    Route::resource('warehouse', WarehouseController::class);

    Route::controller(PrinterController::class)->group(function () {
        Route::get('printers/pre-load', 'preLoad');
        Route::post('printers/deletebyselection', 'deleteBySelection');
    });
    Route::resource('printers', PrinterController::class);

    Route::resource('tables', TableController::class);


    Route::controller(TaxController::class)->group(function () {
        Route::post('importtax', 'importTax');
        Route::post('tax/deletebyselection', 'deleteBySelection');
        Route::get('tax/lims_tax_search', 'limsTaxSearch');
    });
    Route::resource('tax', TaxController::class);


    Route::controller(CustomerGroupController::class)->group(function () {
        Route::post('importcustomer_group', 'importCustomerGroup');
        Route::post('customer_group/deletebyselection', 'deleteBySelection');
        Route::get('customer_group/lims_customer_group_search', 'limsCustomerGroupSearch');
        Route::get('customer_group/all', 'customerGroupAll');
    });
    Route::resource('customer_group', CustomerGroupController::class);


    Route::resource('discount-plans', DiscountPlanController::class);
    Route::get('discounts/product-search/{code}', [DiscountController::class, 'productSearch']);
    Route::resource('discounts', DiscountController::class);
Route::controller(SaleController::class)->group(function () {
        Route::post('sales/sale-data', 'saleData');
        Route::post('sales/sendmail', 'sendMail');
        Route::get('sales/sale_by_csv', 'saleByCsv');
        Route::get('sales/deleted_data', 'showDeletedSales')
            ;
        Route::delete('sales/force-delete-selected', 'forceDeleteSelected')
            
            ;
        Route::get('sales/product_sale/{id}', 'productSaleData');
        Route::get('sales/get-sale/{id}', 'getSale');
        Route::post('importsale', 'importSale');
        // pos/{id?} → PosDashboardController JSON routes in api.php
        Route::get('sales/recent-sale', 'recentSale');
        Route::get('sales/recent-draft', 'recentDraft');
        Route::get('sales/lims_sale_search', 'limsSaleSearch');
        Route::get('sales/lims_product_search', 'limsProductSearch');
        Route::get('sales/getcustomergroup/{id}', 'getCustomerGroup');

        Route::get('sales/getproduct/{id}', 'getProduct');

        Route::get('sales/getproducts/{warehouse_id}/{key}/{value}', 'getProducts');

        Route::get('sales/search', 'search');

        Route::get('sales/get_gift_card', 'getGiftCard');
        Route::get('sales/paypalSuccess', 'paypalSuccess');
        Route::get('sales/paypalPaymentSuccess/{id}', 'paypalPaymentSuccess');
        Route::get('sales/gen_invoice/{id}', 'genInvoice');
        Route::post('sales/add_payment', 'addPayment');
        Route::get('sales/getpayment/{id}', 'getPayment');
        Route::post('sales/updatepayment', 'updatePayment');
        Route::post('sales/deletepayment', 'deletePayment');
        Route::get('sales/{id}/create', 'createSale');
        Route::post('sales/deletebyselection', 'deleteBySelection');
        Route::get('customer-display', 'customerDisplay');
        Route::get('sales/print-last-reciept', 'printLastReciept');
        Route::get('sales/today-sale', 'todaySale');
        Route::get('sales/today-profit/{warehouse_id}', 'todayProfit');
        Route::get('sales/check-discount', 'checkDiscount');
        Route::get('sales/get-sold-items/{id}', 'getSoldItem');
        Route::post('sales/sendsms', 'sendSMS');
        Route::post('sales/whatsapp-notification', 'whatsappNotificationSend');
        Route::get('customer-sales/{customer_id}', 'customerSales');

        Route::post('sales/set-price-type', 'setPriceType');
    });
    Route::resource('sales', SaleController::class)->except('show');

    Route::get('/installmentplan/{id}', [InstallmentPlanController::class, 'show']);

    Route::post('/razorpay/pay', [RazorpayController::class, 'createOrder']);
    Route::post('/razorpay/verify', [RazorpayController::class, 'verifyPayment']);

    Route::controller(PackingSlipController::class)->group(function () {
        Route::prefix('packing-slips')->group(function () {
            Route::get('/', 'index');
            Route::post('packing-slip-data', 'packingSlipData');
            Route::post('store', 'store');
            Route::post('delete/{id}', 'delete');
            Route::get('invoice/{id}', 'genInvoice');
        });
    });

    Route::controller(ChallanController::class)->group(function () {
        Route::prefix('challans')->group(function () {
            Route::get('/', 'index');
            Route::post('challan-data', 'challanData');
            Route::post('create', 'create');
            Route::post('store', 'store');
            Route::get('invoice/{id}', 'genInvoice');
            Route::get('money-reciept/{id}', 'moneyReciept');
            Route::get('finalize/{id}', 'finalize');
            Route::post('update/{id}', 'update');
        });
    });

    Route::controller(DeliveryController::class)->group(function () {
        Route::prefix('delivery')->group(function () {
            Route::get('/', 'index');
            Route::get('delivery_list_data', 'deliveryListData');
            Route::get('product_delivery/{id}', 'productDeliveryData');
            Route::get('create/{id}', 'create');
            Route::post('store', 'store');
            Route::post('sendmail', 'sendMail');
            Route::get('{id}/edit', 'edit');
            Route::post('update', 'update');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::post('delete/{id}', 'delete');
        });
    });

    Route::controller(SteadFastController::class)->group(function () {
        Route::get('/delivery/steadfast/{sale_id}', 'getSaleForSteadFast');
        Route::post('/steadfast/create-order', 'store');
        Route::get('/steadfast/{sale_id}', 'show');
    });


    Route::controller(QuotationController::class)->group(function () {
        Route::prefix('quotations')->group(function () {
            Route::post('quotation-data', 'quotationData');
            Route::get('product_quotation/{id}', 'productQuotationData');
            Route::get('lims_product_search', 'limsProductSearch');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup');
            Route::get('getproduct/{id}', 'getProduct');
            Route::get('{id}/create_sale', 'createSale');
            Route::get('{id}/create_purchase', 'createPurchase');
            Route::post('sendmail', 'sendMail');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::get('invoice/{id}','genInvoice');

        });
    });
    Route::resource('quotations', QuotationController::class);


    Route::controller(PurchaseController::class)->group(function () {
        Route::prefix('purchases')->group(function () {
            Route::post('purchase-data', 'purchaseData');
            Route::get('product_purchase/{id}', 'productPurchaseData');
            Route::get('{id}/details', 'purchaseDetails');
            Route::get('lims_product_search', 'limsProductSearch');
            Route::post('add_payment', 'addPayment');
            Route::get('getpayment/{id}', 'getPayment');
            Route::post('updatepayment', 'updatePayment');
            Route::post('deletepayment', 'deletePayment');
            Route::get('purchase_by_csv', 'purchaseByCsv');
            Route::get('deleted_data', 'showDeletedPurchases')
                ;
            Route::get('duplicate/{id}', 'duplicate');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::delete('force-delete-selected', 'forceDeleteSelected')
                
                ;
            Route::get('supplier/{supplier_id}', 'supplierPurchase');
        });
        Route::post('importpurchase', 'importPurchase');
    });
    Route::resource('purchases', PurchaseController::class)->except(['show']);



    Route::controller(TransferController::class)->group(function () {
        Route::prefix('transfers')->group(function () {
            Route::post('transfer-data', 'transferData');
            Route::get('product_transfer/{id}', 'productTransferData');
            Route::get('transfer_by_csv', 'transferByCsv');
            Route::get('getproduct/{id}', 'getProduct');
            Route::put('change-status/{id}', 'changeStatus');
            Route::get('lims_product_search', 'limsProductSearch');
            Route::post('deletebyselection', 'deleteBySelection');
        });
        Route::post('importtransfer', 'importTransfer');
    });
    Route::resource('transfers', TransferController::class);



    Route::controller(AdjustmentController::class)->group(function () {
        Route::get('qty_adjustment/getproduct/{id}', 'getProduct');
        Route::get('qty_adjustment/lims_product_search', 'limsProductSearch');
        Route::post('qty_adjustment/deletebyselection', 'deleteBySelection');
    });
Route::controller(ReturnController::class)->group(function () {
        Route::prefix('return-sale')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup');
            Route::post('sendmail', 'sendMail');
            Route::get('getproduct/{id}', 'getProduct');
            Route::get('lims_product_search', 'limsProductSearch');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
        });
    });
    Route::resource('return-sale', ReturnController::class);

    // Replace your existing exchange routes with these:

    Route::controller(ExchangeController::class)->prefix('exchange')->group(function () {
        Route::post('exchange-data', 'exchangeData');
        Route::get('getcustomergroup/{id}', 'getCustomerGroup');
        Route::post('sendmail', 'sendMail');
        Route::get('getproduct/{id}', 'getProduct');
        Route::get('lims_product_search', 'limsProductSearch');
        // FIXED: Changed from exchangeData to productExchange
        Route::get('product_exchange/{id}', 'productExchange');
        Route::post('deletebyselection', 'deleteBySelection');
    });

    Route::resource('exchange', ExchangeController::class);
    Route::get('/sale-exchange/search', [ExchangeController::class, 'searchByReference'])
        ;

    Route::controller(ReturnPurchaseController::class)->group(function () {
        Route::prefix('return-purchase')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup');
            Route::post('sendmail', 'sendMail');
            Route::get('getproduct/{id}', 'getProduct');
            Route::get('lims_product_search', 'limsProductSearch');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
        });
    });

    Route::resource('return-purchase', ReturnPurchaseController::class);

    Route::controller(ReportController::class)->group(function () {
        Route::prefix('report')->group(function () {
            Route::get('product_quantity_alert', 'productQuantityAlert');
            Route::get('daily-sale-objective', 'dailySaleObjective');
            Route::post('daily-sale-objective-data', 'dailySaleObjectiveData');
            Route::get('product-expiry', 'productExpiry');
            Route::get('warehouse_stock', 'warehouseStock');
            Route::get('daily_sale/{year}/{month}', 'dailySale');
            Route::post('daily_sale/{year}/{month}', 'dailySaleByWarehouse');
            Route::get('monthly_sale/{year}', 'monthlySale');
            Route::post('monthly_sale/{year}', 'monthlySaleByWarehouse');
            Route::get('daily_purchase/{year}/{month}', 'dailyPurchase');
            Route::post('daily_purchase/{year}/{month}', 'dailyPurchaseByWarehouse');
            Route::get('monthly_purchase/{year}', 'monthlyPurchase');
            Route::post('monthly_purchase/{year}', 'monthlyPurchaseByWarehouse');
            Route::get('best_seller', 'bestSeller');
            Route::post('best_seller', 'bestSellerByWarehouse');
            Route::get('profit-loss', 'summary');
            Route::post('profit-loss', 'profitLoss');
            Route::get('product_report', 'productReport');
            Route::post('product_report_data', 'productReportData');
            Route::get('purchase', 'purchaseReport');
            Route::post('purchase', 'purchaseReport');
            Route::post('purchase_report_data', 'purchaseReportData');
            Route::get('sale_report', 'saleReport');
            Route::post('sale_report', 'saleReport');
            Route::post('sale_report_data', 'saleReportData');
            Route::get('stock', 'stockReport');
            Route::post('stock-data', 'stockReportData');
            Route::get('challan-report', 'challanReport');
            Route::get('sale-report-chart', 'saleReportChart');
            Route::post('sale-report-chart', 'saleReportChart');
            Route::get('payment_report_by_date', 'paymentReportByDate');
            Route::post('payment_report_by_date', 'paymentReportByDate');
            Route::get('warehouse_report', 'warehouseReport');
            Route::post('warehouse_report', 'warehouseReport');
            Route::post('warehouse-sale-data', 'warehouseSaleData');
            Route::post('warehouse-purchase-data', 'warehousePurchaseData');
            Route::post('warehouse-expense-data', 'warehouseExpenseData');
            Route::post('warehouse-quotation-data', 'warehouseQuotationData');
            Route::post('warehouse-return-data', 'warehouseReturnData');
            Route::get('user_report', 'userReport');
            Route::post('user_report', 'userReport');
            Route::post('user-sale-data', 'userSaleData');
            Route::post('user-purchase-data', 'userPurchaseData');
            Route::post('user-expense-data', 'userExpenseData');
            Route::post('user-quotation-data', 'userQuotationData');
            Route::post('user-payment-data', 'userPaymentData');
            Route::post('user-transfer-data', 'userTransferData');
            Route::post('user-payroll-data', 'userPayrollData');
            Route::get('biller_report', 'billerReport');
            Route::post('biller_report', 'billerReport');
            Route::post('biller-sale-data', 'billerSaleData');
            Route::post('biller-quotation-data', 'billerQuotationData');
            Route::post('biller-payment-data', 'billerPaymentData');
            Route::get('customer_report', 'customerReport');
            Route::post('customer_report', 'customerReport');
            Route::post('customer-sale-data', 'customerSaleData');
            Route::post('customer-payment-data', 'customerPaymentData');
            Route::post('customer-quotation-data', 'customerQuotationData');
            Route::post('customer-return-data', 'customerReturnData');
            Route::get('customer-group', 'customerGroupReport');
            Route::post('customer-group', 'customerGroupReport');
            Route::post('customer-group-sale-data', 'customerGroupSaleData');
            Route::post('customer-group-payment-data', 'customerGroupPaymentData');
            Route::post('customer-group-quotation-data', 'customerGroupQuotationData');
            Route::post('customer-group-return-data', 'customerGroupReturnData');
            Route::get('supplier', 'supplierReport');
            Route::post('supplier', 'supplierReport');
            Route::post('supplier-purchase-data', 'supplierPurchaseData');
            Route::post('supplier-payment-data', 'supplierPaymentData');
            Route::post('supplier-return-data', 'supplierReturnData');
            Route::post('supplier-quotation-data', 'supplierQuotationData');
            Route::get('customer-due-report', 'customerDueReportByDate');
            Route::post('customer-due-report', 'customerDueReportByDate');
            Route::post('customer-due-report-data', 'customerDueReportData');
            Route::get('supplier-due-report', 'supplierDueReportByDate');
            Route::post('supplier-due-report', 'supplierDueReportByDate');
            Route::post('supplier-due-report-data', 'supplierDueReportData');
        });
    });
Route::controller(SettingController::class)->group(function () {
        Route::prefix('setting')->group(function () {
            Route::get('activity-log', 'activityLog');
            Route::get('general_setting', 'generalSetting');
            Route::post('general_setting_store', 'generalSettingStore');

            Route::get('app_setting', 'appSetting');
            Route::delete('app_setting/{id}', 'appSettingDelete');

            Route::get('reward-point-setting', 'rewardPointSetting');
            Route::post('reward-point-setting_store', 'rewardPointSettingStore');

            Route::get('general_setting/change-theme/{theme}', 'changeTheme');
            Route::get('mail_setting', 'mailSetting');
            Route::get('sms_setting', 'smsSetting');
            Route::get('createsms', 'createSms');
            Route::post('sendsms', 'sendSMS');
            Route::get('payment-gateways/list', 'gateway');
            Route::post('payment-gateways/update', 'gatewayUpdate');
            Route::get('hrm_setting', 'hrmSetting');
            Route::post('hrm_setting_store', 'hrmSettingStore');
            Route::post('mail_setting_store', 'mailSettingStore');
            Route::post('sms_setting_store', 'smsSettingStore');
            Route::get('pos_setting', 'posSetting');
            Route::post('pos_setting_store', 'posSettingStore');
            Route::get('empty-database', 'emptyDatabase');
        });
        Route::get('backup', 'backup');
    });

    Route::prefix('setting')->group(function () {
        Route::resource('invoice', InvoiceSettingController::class);
    });

    Route::prefix('setting')->group(function () {
        Route::get('theme-settings', [ThemeSettingController::class, 'index']);
        Route::get('theme-settings/create', [ThemeSettingController::class, 'create']);
        Route::get('theme-settings/palette', [ThemeSettingController::class, 'palette']);
        Route::post('theme-settings', [ThemeSettingController::class, 'store']);
        Route::get('theme-settings/{themeSetting}/edit', [ThemeSettingController::class, 'edit']);
        Route::put('theme-settings/{themeSetting}', [ThemeSettingController::class, 'update']);
        Route::delete('theme-settings/{themeSetting}', [ThemeSettingController::class, 'destroy']);
        Route::put('theme-settings/{themeSetting}/active-for', [ThemeSettingController::class, 'updateActiveFor']);
    });
        Route::get('/barcodes/set_default/{id}', [BarcodeController::class, 'setDefault']);
        Route::controller(BarcodeController::class)->group(function () {
            Route::post('barcodes/barcode-data', 'barcodeData');
        });
        Route::resource('barcodes', BarcodeController::class);

        Route::get('/labels/show', [LabelsController::class, 'show']);
        Route::get('/labels/add-product-row', [LabelsController::class, 'addProductRow']);

        Route::controller(ExpenseCategoryController::class)->group(function () {
            Route::get('expense_categories/gencode', 'generateCode');
            Route::post('expense_categories/import', 'import');
            Route::post('expense_categories/deletebyselection', 'deleteBySelection');
            Route::get('expense_categories/all', 'expenseCategoriesAll');
        });
        Route::resource('expense_categories', ExpenseCategoryController::class);

        Route::controller(ExpenseController::class)->group(function () {
            Route::post('expenses/expense-data', 'expenseData');
            Route::post('expenses/deletebyselection', 'deleteBySelection');
        });
        Route::resource('expenses', ExpenseController::class);

        Route::controller(IncomeCategoryController::class)->group(function () {
            Route::get('income_categories/gencode', 'generateCode');
            Route::post('income_categories/import', 'import');
            Route::post('income_categories/deletebyselection', 'deleteBySelection');
            Route::get('income_categories/all', 'incomeCategoriesAll');
        });
        Route::resource('income_categories', IncomeCategoryController::class);

        Route::controller(IncomeController::class)->group(function () {
            Route::post('incomes/income-data', 'incomeData');
            Route::post('incomes/deletebyselection', 'deleteBySelection');
        });
        Route::resource('incomes', IncomeController::class);

        Route::controller(GiftCardController::class)->group(function () {
            Route::get('gift_cards/gencode', 'generateCode');
            Route::post('gift_cards/recharge/{id}', 'recharge');
            Route::post('gift_cards/deletebyselection', 'deleteBySelection');
        });
        Route::resource('gift_cards', GiftCardController::class);

        Route::resource('couriers', CourierController::class);

        Route::controller(CouponController::class)->group(function () {
            Route::get('coupons/gencode', 'generateCode');
            Route::post('coupons/deletebyselection', 'deleteBySelection');
        });
        Route::resource('coupons', CouponController::class);

        Route::controller(AccountsController::class)->group(function () {
            Route::get('make-default/{id}', 'makeDefault');
            Route::get('balancesheet', 'balanceSheet');
            Route::post('account-statement', 'accountStatement');
            Route::get('accounts/all', 'accountsAll');
        });
        Route::resource('accounts', AccountsController::class);

        Route::resource('money-transfers', MoneyTransferController::class);

        Route::post('departments/deletebyselection', [DepartmentController::class, 'deleteBySelection']);
        Route::resource('departments', DepartmentController::class);
        Route::post('designations/deletebyselection', [DesignationController::class, 'deleteBySelection']);
        Route::resource('designations', DesignationController::class);
        Route::post('shift/deletebyselection', [ShiftController::class, 'deleteBySelection']);
        Route::resource('shift', ShiftController::class);
        Route::resource('overtime', OvertimeController::class);
        Route::resource('leave-type', LeaveTypeController::class);
        Route::resource('leave', LeaveController::class);
        Route::get('hrm-panel', [HrmController::class, 'index']);
        Route::resource('sale-agents', SaleAgentController::class)->except('show');
        Route::get('/payroll/monthly-data', [PayrollController::class, 'monthlyData']);
        Route::get('payroll/get-employees-by-warehouse', [PayrollController::class, 'getEmployeesByWarehouse']);
        Route::post('payroll/store-multiple', [PayrollController::class, 'storeMultiple']);
        Route::post('payroll/generate', [PayrollController::class, 'generateCards']);

        Route::post('employees/deletebyselection', [EmployeeController::class, 'deleteBySelection']);
        Route::resource('employees', EmployeeController::class);

        Route::post('payroll/deletebyselection', [PayrollController::class, 'deleteBySelection']);
        Route::resource('payroll', PayrollController::class);

        Route::post('attendance/delete/{date}/{employee_id}', [AttendanceController::class, 'delete']);
        Route::post('attendance/deletebyselection', [AttendanceController::class, 'deleteBySelection']);
        Route::post('attendance/importDeviceCsv', [AttendanceController::class, 'importDeviceCsv']);
        Route::resource('attendance', AttendanceController::class);

        Route::controller(StockCountController::class)->group(function () {
            Route::post('stock-count/finalize', 'finalize');
            Route::get('stock-count/stockdif/{id}', 'stockDif');
            Route::get('stock-count/{id}/qty_adjustment', 'qtyAdjustment');
        });
        Route::resource('stock-count', StockCountController::class);

        Route::controller(HolidayController::class)->group(function () {
            Route::post('holidays/deletebyselection', 'deleteBySelection');
            Route::get('approve-holiday/{id}', 'approveHoliday');
            Route::get('holidays/my-holiday/{year}/{month}', 'myHoliday');
        });
        Route::resource('holidays', HolidayController::class);

        Route::controller(CashRegisterController::class)->group(function () {
        Route::prefix('cash-register')->group(function () {
            Route::get('/', 'index');
            Route::get('check-availability/{warehouse_id}', 'checkAvailability');
            Route::post('store', 'store');
            Route::get('getDetails/{id}', 'getDetails');
            Route::post('close', 'close');
        });
    });


    Route::controller(NotificationController::class)->group(function () {
        Route::prefix('notifications')->group(function () {
            Route::get('/', 'index');
            Route::post('store', 'store');
            Route::get('mark-as-read', 'markAsRead');
        });
    });


    Route::resource('currency', CurrencyController::class);

    Route::resource('custom-fields', CustomFieldController::class);

    Route::controller(AddonInstallController::class)->group(function () {
        Route::post('saas-install', 'saasInstall');
        Route::post('ecommerce-install', 'ecommerceInstall');
        Route::post('woocommerce-install', 'woocommerceInstall');
        Route::post('api-install', 'apiInstall');
    });

    Route::prefix('whatsapp')->group(function () {
        Route::get('/settings', [WhatsappController::class, 'settings']);
        Route::post('/settings', [WhatsappController::class, 'updateSettings']);

        Route::get('/templates', [WhatsappController::class, 'templates']);
        Route::delete('/template/delete/{name}', [WhatsappController::class, 'deleteTemplate']);

        Route::get('/send', [WhatsappController::class, 'sendPage']);
        Route::post('/send', [WhatsappController::class, 'sendMessage']);
    });
// Manufacturing module (Modules/Manufacturing)
    Route::prefix('manufacturing')->name('manufacturing.')->group(function () {
        Route::controller(\Modules\Manufacturing\Http\Controllers\ProductionController::class)->prefix('productions')->group(function () {
            Route::post('production-data', 'productionData');
            Route::get('product_production/{id}', 'productProductionData');
        });
        Route::resource('productions', \Modules\Manufacturing\Http\Controllers\ProductionController::class)->except(['show']);
        Route::resource('recipes', \Modules\Manufacturing\Http\Controllers\RecipeController::class)->except(['show']);
        Route::post('product-data', [\Modules\Manufacturing\Http\Controllers\RecipeController::class, 'productData']);
        Route::post('get-ingredients', [\Modules\Manufacturing\Http\Controllers\ProductionController::class, 'getIngredients']);
    });


        // --- Dashboard JSON overrides (after legacy resources) ---
// JSON list/form endpoints (registered after mirror so they override index)
        Route::get('purchases', [PurchaseController::class, 'index']);
        Route::post('purchases', [PurchaseController::class, 'store']);
        Route::put('purchases/{id}', [PurchaseController::class, 'update']);
        Route::delete('purchases/{id}', [PurchaseController::class, 'destroy']);

        Route::get('sales', [SaleDashboardController::class, 'index']);
        Route::get('sales/create', [SaleDashboardController::class, 'createForm']);
        Route::get('sales/product-search', [SaleDashboardController::class, 'productSearch']);
        Route::get('sales/warehouse-products', [SaleDashboardController::class, 'warehouseProducts']);
        Route::get('sales/customer-group/{customerId}', [SaleDashboardController::class, 'customerGroup']);

        Route::get('challans', [ChallanDashboardController::class, 'index']);

        Route::get('packing-slips', [PackingSlipDashboardController::class, 'index']);
        Route::delete('packing-slips/{id}', [PackingSlipDashboardController::class, 'destroy']);

        Route::get('deliveries', [DeliveryDashboardController::class, 'index']);
        Route::delete('deliveries/{id}', [DeliveryDashboardController::class, 'destroy']);

        Route::get('gift-cards/gencode', [GiftCardDashboardController::class, 'generateCode']);
        Route::post('gift-cards/deletebyselection', [GiftCardDashboardController::class, 'deleteBySelection']);
        Route::get('gift-cards/{id}', [GiftCardDashboardController::class, 'show']);
        Route::post('gift-cards', [GiftCardDashboardController::class, 'store']);
        Route::put('gift-cards/{id}', [GiftCardDashboardController::class, 'update']);
        Route::post('gift-cards/{id}/recharge', [GiftCardDashboardController::class, 'recharge']);
        Route::get('gift-cards', [GiftCardDashboardController::class, 'index']);
        Route::delete('gift-cards/{id}', [GiftCardDashboardController::class, 'destroy']);

        Route::get('coupons/generate-code', [CouponDashboardController::class, 'generateCode']);
        Route::post('coupons/deletebyselection', [CouponDashboardController::class, 'deleteBySelection']);
        Route::get('coupons', [CouponDashboardController::class, 'index']);
        Route::post('coupons', [CouponDashboardController::class, 'store']);
        Route::put('coupons/{id}', [CouponDashboardController::class, 'update']);
        Route::delete('coupons/{id}', [CouponDashboardController::class, 'destroy']);

        Route::post('couriers/deletebyselection', [CourierDashboardController::class, 'deleteBySelection']);
        Route::get('couriers/{id}', [CourierDashboardController::class, 'show']);
        Route::post('couriers', [CourierDashboardController::class, 'store']);
        Route::put('couriers/{id}', [CourierDashboardController::class, 'update']);
        Route::get('couriers', [CourierDashboardController::class, 'index']);
        Route::delete('couriers/{id}', [CourierDashboardController::class, 'destroy']);

        Route::get('bookings/calendar', [BookingDashboardController::class, 'bootstrap']);
        Route::get('bookings/events', [BookingDashboardController::class, 'events']);
        Route::post('bookings/deletebyselection', [BookingDashboardController::class, 'deleteBySelection']);
        Route::get('bookings/{id}', [BookingDashboardController::class, 'show']);
        Route::post('bookings', [BookingDashboardController::class, 'store']);
        Route::put('bookings/{id}', [BookingDashboardController::class, 'update']);
        Route::delete('bookings/{id}', [BookingDashboardController::class, 'destroy']);
        Route::get('bookings', [BookingDashboardController::class, 'index']);

        Route::get('return-sale', [ReturnSaleDashboardController::class, 'index']);
        Route::get('return-sale/{id}', [ReturnSaleDashboardController::class, 'show']);
        Route::delete('return-sale/{id}', [ReturnSaleDashboardController::class, 'destroy']);

        Route::get('exchange/{id}', [ExchangeDashboardController::class, 'show']);
        Route::get('exchange', [ExchangeDashboardController::class, 'index']);

        Route::get('installment-plans/{id}', [InstallmentPlanDashboardController::class, 'show']);
        Route::get('installment-plans', [InstallmentPlanDashboardController::class, 'index']);

        Route::get('return-purchase', [ReturnPurchaseDashboardController::class, 'index']);
        Route::get('return-purchase/create', [ReturnPurchaseDashboardController::class, 'create']);
        Route::get('return-purchase/{id}', [ReturnPurchaseDashboardController::class, 'show']);
        Route::post('return-purchase', [ReturnPurchaseController::class, 'store']);
        Route::delete('return-purchase/{id}', [ReturnPurchaseDashboardController::class, 'destroy']);

        // Quotation SPA paths — override legacy quotation resource routes
        Route::get('quotations/{id}', [QuotationDashboardController::class, 'show']);
        Route::get('quotations', [QuotationDashboardController::class, 'index']);
        Route::post('quotations', [QuotationController::class, 'store']);
        Route::match(['put', 'post'], 'quotations/{id}', [QuotationController::class, 'update']);
        Route::delete('quotations/{id}', [QuotationDashboardController::class, 'destroy']);

        Route::get('transfers/{id}', [TransferDashboardController::class, 'show']);
        Route::put('transfers/{id}/approve', [TransferDashboardController::class, 'approve']);
        Route::get('transfers', [TransferDashboardController::class, 'index']);
        Route::post('transfers', [TransferController::class, 'store']);
        Route::post('importtransfer', [TransferController::class, 'importTransfer']);
        Route::delete('transfers/{id}', [TransferDashboardController::class, 'destroy']);

        Route::get('expenses', [ExpenseDashboardController::class, 'index']);
        Route::post('expenses', [ExpenseController::class, 'store']);
        Route::match(['put', 'post'], 'expenses/{id}', [ExpenseController::class, 'update']);
        Route::delete('expenses/{id}', [ExpenseDashboardController::class, 'destroy']);

        Route::get('expense_categories', [ExpenseCategoryController::class, 'index']);
        Route::post('expense_categories', [ExpenseCategoryController::class, 'store']);
        Route::match(['put', 'post'], 'expense_categories/{id}', [ExpenseCategoryController::class, 'update']);
        Route::delete('expense_categories/{id}', [ExpenseCategoryController::class, 'destroy']);
        Route::post('expense_categories/import', [ExpenseCategoryController::class, 'import']);
        Route::post('expense_categories/deletebyselection', [ExpenseCategoryController::class, 'deleteBySelection']);

        Route::get('income_categories', [IncomeCategoryController::class, 'index']);
        Route::post('income_categories', [IncomeCategoryController::class, 'store']);
        Route::match(['put', 'post'], 'income_categories/{id}', [IncomeCategoryController::class, 'update']);
        Route::delete('income_categories/{id}', [IncomeCategoryController::class, 'destroy']);
        Route::post('income_categories/deletebyselection', [IncomeCategoryController::class, 'deleteBySelection']);

        Route::get('incomes', [IncomeDashboardController::class, 'index']);
        Route::post('incomes', [IncomeController::class, 'store']);
        Route::match(['put', 'post'], 'incomes/{id}', [IncomeController::class, 'update']);
        Route::delete('incomes/{id}', [IncomeDashboardController::class, 'destroy']);

        Route::get('accounts', [AccountDashboardController::class, 'index']);
        Route::post('accounts', [AccountsController::class, 'store']);
        Route::match(['put', 'post'], 'accounts/{id}', [AccountsController::class, 'update']);
        Route::delete('accounts/{id}', [AccountDashboardController::class, 'destroy']);
        Route::get('make-default/{id}', [AccountsController::class, 'makeDefault']);

        Route::get('money-transfers', [MoneyTransferDashboardController::class, 'index']);
        Route::post('money-transfers', [MoneyTransferController::class, 'store']);
        Route::match(['put', 'post'], 'money-transfers/{id}', [MoneyTransferController::class, 'update']);
        Route::delete('money-transfers/{id}', [MoneyTransferDashboardController::class, 'destroy']);

        Route::get('balancesheet', [BalanceSheetDashboardController::class, 'index']);

        Route::get('account-statement', [AccountStatementDashboardController::class, 'formData']);
        Route::post('account-statement', [AccountStatementDashboardController::class, 'generate']);

        Route::post('sales', [WebSaleController::class, 'store']);

        Route::get('barcodes', [DashboardBarcodeController::class, 'index']);
        Route::post('barcodes', [DashboardBarcodeController::class, 'store']);
        Route::get('barcodes/{id}/edit', [DashboardBarcodeController::class, 'edit']);
        Route::put('barcodes/{id}', [DashboardBarcodeController::class, 'update']);
        Route::delete('barcodes/{id}', [DashboardBarcodeController::class, 'destroy']);
        Route::post('barcodes/{id}/set-default', [DashboardBarcodeController::class, 'setDefault']);

        Route::get('products/print_barcode', [DashboardProductController::class, 'printBarcode']);

        Route::get('languages', [DashboardLanguageController::class, 'index']);
        Route::post('languages/create', [DashboardLanguageController::class, 'store']);
        Route::put('languages/{id}', [DashboardLanguageController::class, 'update']);
        Route::delete('languages/{id}', [DashboardLanguageController::class, 'destroy']);
        Route::post('languages/{id}/set-default', [DashboardLanguageController::class, 'setDefault']);

        Route::get('departments', [DashboardDepartmentController::class, 'index']);
        Route::post('departments', [DashboardDepartmentController::class, 'store']);
        Route::put('departments/{id}', [DashboardDepartmentController::class, 'update']);
        Route::delete('departments/{id}', [DashboardDepartmentController::class, 'destroy']);
        Route::post('departments/deletebyselection', [DashboardDepartmentController::class, 'deleteBySelection']);

        Route::get('designations', [DashboardDesignationController::class, 'index']);
        Route::post('designations', [DashboardDesignationController::class, 'store']);
        Route::put('designations/{id}', [DashboardDesignationController::class, 'update']);
        Route::delete('designations/{id}', [DashboardDesignationController::class, 'destroy']);
        Route::post('designations/deletebyselection', [DashboardDesignationController::class, 'deleteBySelection']);

        Route::get('shift', [DashboardShiftController::class, 'index']);
        Route::post('shift', [DashboardShiftController::class, 'store']);
        Route::put('shift/{id}', [DashboardShiftController::class, 'update']);
        Route::delete('shift/{id}', [DashboardShiftController::class, 'destroy']);
        Route::post('shift/deletebyselection', [DashboardShiftController::class, 'deleteBySelection']);

        Route::get('employees/create', [DashboardEmployeeController::class, 'create']);
        Route::get('employees', [DashboardEmployeeController::class, 'index']);
        Route::post('employees', [DashboardEmployeeController::class, 'store']);
        Route::put('employees/{id}', [DashboardEmployeeController::class, 'update']);
        Route::delete('employees/{id}', [DashboardEmployeeController::class, 'destroy']);
        Route::post('employees/deletebyselection', [DashboardEmployeeController::class, 'deleteBySelection']);

        Route::get('customer', [DashboardCustomerController::class, 'index']);
        Route::post('customer', [DashboardCustomerController::class, 'store']);
        Route::put('customer/{id}', [DashboardCustomerController::class, 'update']);
        Route::delete('customer/{id}', [DashboardCustomerController::class, 'destroy']);
        Route::post('customer/deletebyselection', [DashboardCustomerController::class, 'deleteBySelection']);
        Route::post('importcustomer', [DashboardCustomerController::class, 'importCustomer']);
        Route::post('customers/clear-due', [DashboardCustomerController::class, 'clearDue']);
        Route::get('customer/getDeposit/{id}', [DashboardCustomerController::class, 'getDeposit']);
        Route::post('customer/add_deposit', [DashboardCustomerController::class, 'addDeposit']);
        Route::post('customer/update_deposit', [DashboardCustomerController::class, 'updateDeposit']);
        Route::post('customer/deleteDeposit', [DashboardCustomerController::class, 'deleteDeposit']);
        Route::post('customer/deletePoints', [DashboardCustomerController::class, 'deletePoints']);
        Route::post('customer/add-point', [DashboardCustomerController::class, 'addPoint']);
        Route::get('customer/getPoints/{id}', [DashboardCustomerController::class, 'getPoints']);
        Route::post('customer/update_point', [DashboardCustomerController::class, 'updatePoint']);

        Route::get('supplier', [DashboardSupplierController::class, 'index']);
        Route::post('supplier', [DashboardSupplierController::class, 'store']);
        Route::put('supplier/{id}', [DashboardSupplierController::class, 'update']);
        Route::delete('supplier/{id}', [DashboardSupplierController::class, 'destroy']);
        Route::post('supplier/deletebyselection', [DashboardSupplierController::class, 'deleteBySelection']);
        Route::post('importsupplier', [DashboardSupplierController::class, 'importSupplier']);
        Route::post('suppliers/clear-due', [DashboardSupplierController::class, 'clearDue']);

        Route::get('user', [DashboardUserController::class, 'index']);
        Route::get('user/create', [DashboardUserController::class, 'create']);
        Route::get('user/genpass', [DashboardUserController::class, 'generatePassword']);
        Route::get('user/genpin', [DashboardUserController::class, 'generateAccessPin']);
        Route::post('user', [DashboardUserController::class, 'store']);
        Route::get('user/{id}/edit', [DashboardUserController::class, 'edit']);
        Route::put('user/{id}', [DashboardUserController::class, 'update']);
        Route::delete('user/{id}', [DashboardUserController::class, 'destroy']);
        Route::post('user/deletebyselection', [DashboardUserController::class, 'deleteBySelection']);
        Route::post('user/toggle-status', [DashboardUserController::class, 'toggleStatus']);

        Route::get('sale-agents', [DashboardSaleAgentController::class, 'index']);
        Route::get('sale-agents/create', [DashboardSaleAgentController::class, 'create']);
        Route::post('sale-agents', [DashboardSaleAgentController::class, 'store']);
        Route::put('sale-agents/{id}', [DashboardSaleAgentController::class, 'update']);
        Route::delete('sale-agents/{id}', [DashboardSaleAgentController::class, 'destroy']);
        Route::post('sale-agents/deletebyselection', [DashboardSaleAgentController::class, 'deleteBySelection']);

        Route::get('biller', [DashboardBillerController::class, 'index']);
        Route::post('biller', [DashboardBillerController::class, 'store']);
        Route::put('biller/{id}', [DashboardBillerController::class, 'update']);
        Route::delete('biller/{id}', [DashboardBillerController::class, 'destroy']);
        Route::post('biller/deletebyselection', [DashboardBillerController::class, 'deleteBySelection']);
        Route::post('importbiller', [DashboardBillerController::class, 'importBiller']);

        Route::get('terminal', [TerminalController::class, 'index']);
        Route::get('terminal/{id}', [TerminalController::class, 'show']);
        Route::post('terminal', [TerminalController::class, 'store']);
        Route::put('terminal/{id}', [TerminalController::class, 'update']);
        Route::delete('terminal/{id}', [TerminalController::class, 'destroy']);
        Route::post('terminal/{id}/activate', [TerminalController::class, 'activate']);
        Route::post('terminal/{id}/deactivate', [TerminalController::class, 'deactivate']);
        Route::post('terminal/{id}/regenerate-token', [TerminalController::class, 'regenerateToken']);

        Route::get('attendance', [DashboardAttendanceController::class, 'index']);
        Route::post('attendance', [DashboardAttendanceController::class, 'store']);
        Route::delete('attendance/{date}/{employee_id}', [DashboardAttendanceController::class, 'delete']);
        Route::post('attendance/deletebyselection', [DashboardAttendanceController::class, 'deleteBySelection']);
        Route::post('attendance/importDeviceCsv', [DashboardAttendanceController::class, 'importDeviceCsv']);

        Route::get('holidays', [DashboardHolidayController::class, 'index']);
        Route::post('holidays', [DashboardHolidayController::class, 'store']);
        Route::put('holidays/{id}', [DashboardHolidayController::class, 'update']);
        Route::delete('holidays/{id}', [DashboardHolidayController::class, 'destroy']);
        Route::post('holidays/deletebyselection', [DashboardHolidayController::class, 'deleteBySelection']);
        Route::get('approve-holiday/{id}', [DashboardHolidayController::class, 'approveHoliday']);

        Route::get('overtime', [DashboardOvertimeController::class, 'index']);
        Route::post('overtime', [DashboardOvertimeController::class, 'store']);
        Route::put('overtime/{id}', [DashboardOvertimeController::class, 'update']);
        Route::delete('overtime/{id}', [DashboardOvertimeController::class, 'destroy']);
        Route::post('overtime/deletebyselection', [DashboardOvertimeController::class, 'deleteBySelection']);

        Route::get('leave-type', [DashboardLeaveTypeController::class, 'index']);
        Route::post('leave-type', [DashboardLeaveTypeController::class, 'store']);
        Route::put('leave-type/{id}', [DashboardLeaveTypeController::class, 'update']);
        Route::delete('leave-type/{id}', [DashboardLeaveTypeController::class, 'destroy']);
        Route::post('leave-type/deletebyselection', [DashboardLeaveTypeController::class, 'deleteBySelection']);

        Route::get('leave', [DashboardLeaveController::class, 'index']);
        Route::post('leave', [DashboardLeaveController::class, 'store']);
        Route::put('leave/{id}', [DashboardLeaveController::class, 'update']);
        Route::delete('leave/{id}', [DashboardLeaveController::class, 'destroy']);
        Route::post('leave/deletebyselection', [DashboardLeaveController::class, 'deleteBySelection']);

        Route::get('payroll', [DashboardPayrollController::class, 'index']);
        Route::post('payroll', [DashboardPayrollController::class, 'store']);
        Route::put('payroll/{id}', [DashboardPayrollController::class, 'update']);
        Route::delete('payroll/{id}', [DashboardPayrollController::class, 'destroy']);
        Route::post('payroll/deletebyselection', [DashboardPayrollController::class, 'deleteBySelection']);
        Route::get('payroll/monthly-data', [DashboardPayrollController::class, 'monthlyData']);
        Route::get('payroll/get-employees-by-warehouse', [DashboardPayrollController::class, 'getEmployeesByWarehouse']);
        Route::post('payroll/generate', [DashboardPayrollController::class, 'generateCards']);
        Route::post('payroll/store-multiple', [DashboardPayrollController::class, 'storeMultiple']);
    });
});
