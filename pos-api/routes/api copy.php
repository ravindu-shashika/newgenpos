<?php

use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\BillerController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChallanController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerGroupController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\DiscountPlanController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GiftCardController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvoiceSettingController;
use App\Http\Controllers\MoneyTransferController;
use App\Http\Controllers\SettingController;


use App\Http\Controllers\LabelsController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\ReturnPurchaseController;
use App\Http\Controllers\SaleAgentController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SmsTemplateController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransferController;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// User profile (update profile & change password)
Route::get('/user/profile', [UserController::class, 'getProfileApi'])->middleware('auth:sanctum');
Route::post('/user/profile-update', [UserController::class, 'profileUpdateApi'])->middleware('auth:sanctum');
Route::post('/user/change-password', [UserController::class, 'changePasswordApi'])->middleware('auth:sanctum');

// Public routes (no authentication required)
Route::post('/login', [AuthController::class, 'login']);

Route::group(['middleware' => 'auth:sanctum'], function () {
    //menus
    Route::post('/menu', [MenuController::class, 'store']);
    Route::get('/menus', [MenuController::class, 'index']);
    Route::post('/menu/{id}', [MenuController::class, 'update']);
    Route::delete('/menu/{id}', [MenuController::class, 'destroy']);
    Route::get('get-menu', [MenuController::class, 'getMenu']);

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

    // taxes
    Route::get('/taxes', [TaxController::class, 'getAllTaxes']);
    Route::get('/taxes/{id}', [TaxController::class, 'getTax']);
    Route::post('/save-tax', [TaxController::class, 'saveTax']);
    Route::get('/delete-tax/{id}', [TaxController::class, 'deleteTax']);
    Route::post('/taxes/delete-by-selection', [TaxController::class, 'deleteTaxBySelection']);
    Route::post('/taxes/import', [TaxController::class, 'importTaxApi']);

    // customer groups
    Route::get('/customer-groups', [CustomerGroupController::class, 'getAllCustomerGroups']);
    Route::post('/save-customer-group', [CustomerGroupController::class, 'saveCustomerGroup']);
    Route::get('/delete-customer-group/{id}', [CustomerGroupController::class, 'deleteCustomerGroup']);

    //units
    Route::get('/units', [UnitController::class, 'getAllUnits']);
    Route::get('/units/base', [UnitController::class, 'getBaseUnits']);
    Route::post('/save-unit', [UnitController::class, 'saveUnit']);
    Route::get('/delete-unit/{id}', [UnitController::class, 'deleteUnit']);

    // printers
    Route::get('/printers', [PrinterController::class, 'index']);
    Route::get('/printers/{id}/edit', [PrinterController::class, 'edit']);
    Route::post('/printers', [PrinterController::class, 'store']);
    Route::put('/printers/{id}', [PrinterController::class, 'update']);
    Route::delete('/printers/{id}', [PrinterController::class, 'destroy']);

    //invoice-settings
    Route::get('/invoice-settings', [InvoiceSettingController::class, 'getAllInvoiceSettings']);
    Route::post('/save-invoice-setting', [InvoiceSettingController::class, 'saveInvoiceSetting']);
    Route::get('/delete-invoice-setting/{id}', [InvoiceSettingController::class, 'deleteInvoiceSetting']);
    Route::get('/set-default-invoice-setting/{id}', [InvoiceSettingController::class, 'setDefaultInvoiceSetting']);

    // Create SMS (settings)
    Route::get('/create-sms-data', [SettingController::class, 'createSmsDataApi']);
    Route::post('/send-sms', [SettingController::class, 'sendSmsApi']);

    // SMS templates
    Route::get('/sms-templates', [SmsTemplateController::class, 'index']);
    Route::post('/sms-templates', [SmsTemplateController::class, 'store']);
    Route::put('/sms-templates/{id}', [SmsTemplateController::class, 'update']);
    Route::delete('/sms-templates/{id}', [SmsTemplateController::class, 'destroy']);

    //settings (Vue API)
    Route::get('/settings/general', [SettingController::class, 'getGeneralSetting']);
    Route::post('/settings/general', [SettingController::class, 'saveGeneralSetting']);
    Route::get('/settings/mail', [SettingController::class, 'getMailSetting']);
    Route::post('/settings/mail', [SettingController::class, 'saveMailSetting']);
    Route::get('/settings/reward-point', [SettingController::class, 'getRewardPointSetting']);
    Route::post('/settings/reward-point', [SettingController::class, 'saveRewardPointSetting']);
    Route::get('/settings/pos', [SettingController::class, 'getPosSetting']);
    Route::post('/settings/pos', [SettingController::class, 'savePosSetting']);
    Route::get('/settings/app', [SettingController::class, 'getAppSetting']);
    Route::get('/settings/app-token-delete/{id}', [SettingController::class, 'deleteAppToken']);

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

    // Barcode sticker settings
    Route::get('/barcodes', [BarcodeController::class, 'index']);
    Route::get('/barcodes/{id}', [BarcodeController::class, 'show']);
    Route::post('/barcodes', [BarcodeController::class, 'store']);
    Route::put('/barcodes/{id}', [BarcodeController::class, 'update']);
    Route::delete('/barcodes/{id}', [BarcodeController::class, 'destroy']);
    Route::post('/products/history/sales', [ProductController::class, 'saleHistoryData']);
    Route::post('/products/history/purchases', [ProductController::class, 'purchaseHistoryData']);
    Route::post('/products/history/sale-returns', [ProductController::class, 'saleReturnHistoryData']);
    Route::post('/products/history/purchase-returns', [ProductController::class, 'purchaseReturnHistoryData']);
    Route::post('/products/history/adjustments', [ProductController::class, 'adjustmentHistoryData']);
    Route::post('/products/history/transfers', [ProductController::class, 'transferHistoryData']);
    Route::post('/products/gallery', [ProductController::class, 'uploadGalleryImages']);
    Route::get('/generate-code', [ProductController::class, 'generateCode']);

    // Adjustments
    Route::get('/adjustments', [AdjustmentController::class, 'index']);
    Route::get('/adjustments/list', [AdjustmentController::class, 'listApi']);
    Route::get('/adjustments/form-data', [AdjustmentController::class, 'formData']);
    Route::get('/adjustments/warehouses/{warehouse}', [AdjustmentController::class, 'warehouseProducts']);
    Route::get('/adjustments/product-lookup', [AdjustmentController::class, 'productLookup']);
    Route::post('/adjustments/store', [AdjustmentController::class, 'storeApi']);
    Route::get('/adjustments/{adjustment}', [AdjustmentController::class, 'show']);
    Route::post('/adjustments', [AdjustmentController::class, 'store']);
    Route::put('/adjustments/{adjustment}', [AdjustmentController::class, 'update']);
    Route::post('/adjustments/{adjustment}', [AdjustmentController::class, 'update']);
    Route::delete('/adjustments/{adjustment}', [AdjustmentController::class, 'destroy']);
    Route::post('/adjustments/bulk-delete', [AdjustmentController::class, 'bulkDestroy']);

    // Stock Counts
    Route::get('/stock-counts', [StockCountController::class, 'index']);
    Route::get('/stock-counts/options', [StockCountController::class, 'options']);
    Route::post('/stock-counts', [StockCountController::class, 'store']);
    Route::get('/stock-counts/{stockCount}', [StockCountController::class, 'show']);
    Route::post('/stock-counts/{stockCount}/finalize', [StockCountController::class, 'finalize']);
    Route::get('/stock-counts/{stockCount}/difference', [StockCountController::class, 'difference']);
    Route::get('/stock-counts/{stockCount}/adjustment-data', [StockCountController::class, 'adjustmentData']);
    Route::delete('/stock-counts/{stockCount}', [StockCountController::class, 'destroy']);

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
    Route::get('/discount-plans', [DiscountPlanController::class, 'index']);
    Route::get('/discount-plans/form-data', [DiscountPlanController::class, 'getFormData']);
    Route::post('/discount-plans', [DiscountPlanController::class, 'store']);
    Route::get('/discount-plans/{id}', [DiscountPlanController::class, 'show']);
    Route::post('/discount-plans/{id}', [DiscountPlanController::class, 'update']);

    // Discounts
    Route::get('/discounts', [DiscountController::class, 'index']);
    Route::get('/discounts/form-data', [DiscountController::class, 'getFormData']);
    Route::get('/discounts/product-search/{code}', [DiscountController::class, 'productSearch']);
    Route::post('/discounts', [DiscountController::class, 'store']);
    Route::get('/discounts/{id}', [DiscountController::class, 'show']);
    Route::post('/discounts/{id}', [DiscountController::class, 'update']);

    // Attendance (HRM)
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::get('/attendances/form-data', [AttendanceController::class, 'formData']);
    Route::post('/attendances', [AttendanceController::class, 'store']);
    Route::delete('/attendances/{date}/{employee_id}', [AttendanceController::class, 'destroy']);
    Route::post('/attendances/delete-by-selection', [AttendanceController::class, 'deleteBySelection']);
    Route::post('/attendances/import-csv', [AttendanceController::class, 'importCsv']);

    // Departments (HRM)
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::post('/departments/update', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

    // Currencies
    Route::get('/currencies', [CurrencyController::class, 'index']);
    Route::post('/currencies', [CurrencyController::class, 'store']);
    Route::post('/currencies/update', [CurrencyController::class, 'update']);
    Route::delete('/currencies/{id}', [CurrencyController::class, 'destroy']);

    // Expense Categories
    Route::get('/expense-categories', [ExpenseCategoryController::class, 'index']);
    Route::post('/expense-categories', [ExpenseCategoryController::class, 'store']);
    Route::post('/expense-categories/update', [ExpenseCategoryController::class, 'update']);
    Route::delete('/expense-categories/{id}', [ExpenseCategoryController::class, 'destroy']);
    Route::get('/expense-categories/generate-code', [ExpenseCategoryController::class, 'generateCode']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/list', [CustomerController::class, 'customerListApi']);
    Route::get('/customers/form-data', [CustomerController::class, 'formData']);
    Route::get('/customers/{id}', [CustomerController::class, 'getApi']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::post('/customers/store', [CustomerController::class, 'storeApi']);
    Route::post('/customers/update', [CustomerController::class, 'update']);
    Route::put('/customers/{id}', [CustomerController::class, 'updateApi']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroyApi']);

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/form-data', [EmployeeController::class, 'formData']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::post('/employees/update', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Accounts
    Route::get('/accounts', [AccountsController::class, 'accountListApi']);
    Route::get('/accounts/options', [AccountsController::class, 'options']);
    Route::post('/accounts', [AccountsController::class, 'storeApi']);
    Route::post('/accounts/{id}', [AccountsController::class, 'updateApi']);
    Route::delete('/accounts/{id}', [AccountsController::class, 'destroyApi']);
    Route::post('/accounts/{id}/make-default', [AccountsController::class, 'makeDefaultApi']);
    Route::get('/accounts/balance-sheet', [AccountsController::class, 'balanceSheetApi']);
    Route::get('/accounts/statement', [AccountsController::class, 'statementApi']);

    // Money transfers
    Route::get('/money-transfers', [MoneyTransferController::class, 'indexApi']);
    Route::get('/money-transfers/accounts', [MoneyTransferController::class, 'accountsApi']);
    Route::post('/money-transfers', [MoneyTransferController::class, 'storeApi']);
    Route::put('/money-transfers/{id}', [MoneyTransferController::class, 'updateApi']);
    Route::delete('/money-transfers/{id}', [MoneyTransferController::class, 'destroyApi']);

    Route::get('suppliers/list', [SupplierController::class, 'supplierListApi']);
    Route::get('suppliers/edit/{id}', [SupplierController::class, 'getApi']);
    Route::post('suppliers/store', [SupplierController::class, 'storeApi']);
    Route::put('suppliers/{id}', [SupplierController::class, 'updateApi']);
    Route::delete('suppliers/{id}', [SupplierController::class, 'destroyApi']);
    Route::controller(SupplierController::class)->group(function () {
        Route::post('importsupplier', 'importSupplier')->name('supplier.import');
        Route::post('supplier/deletebyselection', 'deleteBySelection');
        Route::post('suppliers/clear-due', 'clearDue')->name('supplier.clearDue');
        Route::get('suppliers/all', 'suppliersAll')->name('supplier.all');
        Route::get('suppliers/ledger/{id}', 'ledger')->name('suppliers.ledger');
        Route::get('supplier-due/{id}', 'supplierDue')->name('supplier.due');
        Route::get('suppliers/{supplier_id}', 'supplierPayments')->name('suppliers.payments');
    });
    Route::resource('supplier', SupplierController::class);

    Route::get('users/list', [UserController::class, 'userListApi']);
    Route::get('users/form-data', [UserController::class, 'userFormDataApi']);
    Route::get('users/edit/{id}', [UserController::class, 'getUserApi']);
    Route::post('users/store', [UserController::class, 'storeUserApi']);
    Route::put('users/{id}', [UserController::class, 'updateUserApi']);
    Route::delete('users/{id}', [UserController::class, 'destroyUserApi']);
    Route::controller(UserController::class)->group(function () {
        Route::get('user/profile/{id}', 'profile')->name('user.profile');
        Route::put('user/update_profile/{id}', 'profileUpdate')->name('user.profileUpdate');
        Route::put('user/changepass/{id}', 'changePassword')->name('user.password');
        Route::get('user/genpass', 'generatePassword');
        Route::post('user/deletebyselection', 'deleteBySelection');
        Route::get('user/notification', 'notificationUsers')->name('user.notification');
        Route::get('user/all', 'allUsers')->name('user.all');
        Route::post('user/toggle-status', [UserController::class, 'toggleStatus'])->name('user.toggleStatus');
    });
    Route::resource('user', UserController::class);
    // Sale agents (React API)
    Route::get('/sale-agents/list', [SaleAgentController::class, 'listApi']);
    Route::get('/sale-agents/form-data', [SaleAgentController::class, 'formDataApi']);
    Route::get('/sale-agents/get/{id}', [SaleAgentController::class, 'getApi']);
    Route::post('/sale-agents/store', [SaleAgentController::class, 'storeApi']);
    Route::put('/sale-agents/update/{id}', [SaleAgentController::class, 'updateApi']);
    Route::delete('/sale-agents/delete/{id}', [SaleAgentController::class, 'destroyApi']);
    Route::resource('sale-agents', SaleAgentController::class)->except('show');

        Route::controller(BillerController::class)->group(function () {
        Route::post('importbiller', 'importBiller')->name('biller.import');
        Route::post('biller/deletebyselection', 'deleteBySelection');
        Route::get('biller/lims_biller_search', 'limsBillerSearch')->name('biller.search');
    });
    Route::get('billers/list', [BillerController::class, 'listApi']);
    Route::get('billers/edit/{id}', [BillerController::class, 'getApi']);
    Route::post('billers/store', [BillerController::class, 'storeApi']);
    Route::put('billers/{id}', [BillerController::class, 'updateApi']);
    Route::delete('billers/{id}', [BillerController::class, 'destroyApi']);
    Route::resource('biller', BillerController::class);

    Route::controller(IncomeController::class)->group(function () {
        Route::post('incomes/income-data', 'incomeData')->name('incomes.data');
        Route::post('incomes/deletebyselection', 'deleteBySelection');
    });
    Route::get('incomes/list', [IncomeController::class, 'listApi']);
    Route::get('incomes/form-data', [IncomeController::class, 'formDataApi']);
    Route::get('incomes/edit/{id}', [IncomeController::class, 'getApi']);
    Route::post('incomes/store', [IncomeController::class, 'storeApi']);
    Route::put('incomes/{id}', [IncomeController::class, 'updateApi']);
    Route::delete('incomes/{id}', [IncomeController::class, 'destroyApi']);
    Route::resource('incomes', IncomeController::class);

    Route::controller(ExpenseCategoryController::class)->group(function () {
        Route::get('expense_categories/gencode', 'generateCode');
        Route::post('expense_categories/import', 'import')->name('expense_category.import');
        Route::post('expense_categories/deletebyselection', 'deleteBySelection');
        Route::get('expense_categories/all', 'expenseCategoriesAll')->name('expense_category.all');;
    });
    Route::resource('expense_categories', ExpenseCategoryController::class);

    Route::controller(ExpenseController::class)->group(function () {
        Route::post('expenses/expense-data', 'expenseData')->name('expenses.data');
        Route::post('expenses/deletebyselection', 'deleteBySelection');
    });
    Route::get('expenses/list', [ExpenseController::class, 'listApi']);
    Route::get('expenses/form-data', [ExpenseController::class, 'formDataApi']);
    Route::get('expenses/edit/{id}', [ExpenseController::class, 'getApi']);
    Route::post('expenses/store', [ExpenseController::class, 'storeApi']);
    Route::put('expenses/{id}', [ExpenseController::class, 'updateApi']);
    Route::delete('expenses/{id}', [ExpenseController::class, 'destroyApi']);
    Route::resource('expenses', ExpenseController::class);

    
    Route::controller(TransferController::class)->group(function () {
        Route::prefix('transfers')->group(function () {
            Route::get('list', 'listApi');
            Route::get('form-data', 'formDataApi');
            Route::get('details/{id}', 'detailsApi');
            Route::post('store', 'storeApi');
            Route::post('transfer-data', 'transferData')->name('transfers.data');
            Route::get('product_transfer/{id}', 'productTransferData');
            Route::get('transfer_by_csv', 'transferByCsv')->middleware('permission:transfers-import');
            Route::get('getproduct/{id}', 'getProduct')->name('transfers.getproduct');
            Route::put('change-status/{id}', 'changeStatus')->name('transfers.changeStatus');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_transfer.search');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::delete('delete/{id}', 'destroyApi');
        });
        Route::post('importtransfer', 'importTransfer')->name('transfer.import');
    });
    Route::resource('transfers', TransferController::class);

    Route::controller(QuotationController::class)->group(function () {
        Route::prefix('quotations')->group(function () {
            Route::get('list', 'listApi');
            Route::get('form-data', 'formDataApi');
            Route::get('details/{id}', 'detailsApi');
            Route::post('store', 'storeApi');
            Route::delete('delete/{id}', 'destroyApi');
            Route::post('quotation-data', 'quotationData')->name('quotations.data');
            Route::get('product_quotation/{id}','productQuotationData');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_quotation.search');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('quotation.getcustomergroup');
            Route::get('getproduct/{id}', 'getProduct')->name('quotation.getproduct');
            Route::get('{id}/create_sale', 'createSale')->name('quotation.create_sale');
            Route::get('{id}/create_purchase', 'createPurchase')->name('quotation.create_purchase');
            Route::post('sendmail', 'sendMail')->name('quotation.sendmail');
            Route::post('deletebyselection', 'deleteBySelection');
        });
     });
    Route::resource('quotations', QuotationController::class);
    
    Route::controller(SaleController::class)->group(function () {
        Route::get('sales/list', 'listApi');
        Route::get('sales/form-data', 'formDataApi');
        Route::get('sales/pos-form-data', 'posFormDataApi');
        Route::get('sales/details/{id}', 'detailsApi');
        Route::post('sales/sale-data', 'saleData');
        Route::post('sales/sendmail', 'sendMail')->name('sale.sendmail');
        Route::get('sales/sale_by_csv', 'saleByCsv')->middleware('permission:sales-import');
        Route::get('sales/deleted_data', 'showDeletedSales')
                ->middleware('hasPermanentDeletePermission');
        Route::delete('sales/force-delete-selected', 'forceDeleteSelected')
            ->name('sales.forceDeleteSelected')
                ->middleware('hasPermanentDeletePermission');
        Route::get('sales/product_sale/{id}', 'productSaleData');
        Route::get('sales/get-sale/{id}', 'getSale');
        Route::post('importsale', 'importSale')->name('sale.import');
        Route::get('pos/{id?}', 'posSale')->name('sale.pos');
        Route::get('sales/recent-sale', 'recentSale');
        Route::get('sales/recent-draft', 'recentDraft');
        Route::get('sales/lims_sale_search', 'limsSaleSearch')->name('sale.search');
        Route::get('sales/lims_product_search', 'limsProductSearch')->name('product_sale.search');
        Route::get('sales/getcustomergroup/{id}', 'getCustomerGroup')->name('sale.getcustomergroup');

        Route::get('sales/getproduct/{id}', 'getProduct')->name('sale.getproduct');

        Route::get('sales/getproducts/{warehouse_id}/{key}/{value}', 'getProducts');

        Route::get('sales/search/{warehouse_id}/{search}', 'search');

        Route::get('sales/get_gift_card', 'getGiftCard');
        Route::get('sales/paypalSuccess', 'paypalSuccess');
        Route::get('sales/paypalPaymentSuccess/{id}', 'paypalPaymentSuccess');
        Route::get('sales/gen_invoice/{id}', 'genInvoice')->name('sale.invoice');
        Route::post('sales/add_payment', 'addPayment')->name('sale.add-payment');
        Route::get('sales/getpayment/{id}', 'getPayment')->name('sale.get-payment');
        Route::post('sales/updatepayment', 'updatePayment')->name('sale.update-payment');
        Route::post('sales/deletepayment', 'deletePayment')->name('sale.delete-payment');
        Route::get('sales/{id}/create', 'createSale')->name('sale.draft');
        Route::post('sales/deletebyselection', 'deleteBySelection');
        Route::get('customer-display', 'customerDisplay')->name('sales.customerDisplay');
        Route::get('sales/print-last-reciept', 'printLastReciept')->name('sales.printLastReciept');
        Route::get('sales/today-sale', 'todaySale');
        Route::get('sales/today-profit/{warehouse_id}', 'todayProfit');
        Route::get('sales/check-discount', 'checkDiscount');
        Route::get('sales/get-sold-items/{id}', 'getSoldItem');
        Route::post('sales/sendsms', 'sendSMS')->name('sale.sendsms');
        Route::post('sales/whatsapp-notification', 'whatsappNotificationSend')->name('sale.wappnotification');
        Route::get('customer-sales/{customer_id}', 'customerSales')->name('sales.customer');
    });
    Route::resource('sales', SaleController::class)->except('show');

    Route::controller(ReturnController::class)->group(function () {
        Route::prefix('return-sale')->group(function () {
            Route::get('list', 'listApi');
            Route::get('form-data', 'formDataApi');
            Route::get('details/{id}', 'detailsApi');
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-sale.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-sale.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-sale.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-sale.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
         });
    });
    Route::resource('return-sale', ReturnController::class);

    Route::controller(CouponController::class)->group(function () {
        Route::get('coupons/list', 'listApi');
        Route::post('coupons/store', 'storeApi');
        Route::put('coupons/update/{id}', 'updateApi');
        Route::delete('coupons/delete/{id}', 'destroyApi');
        Route::get('coupons/gencode', 'generateCode');
        Route::post('coupons/deletebyselection', 'deleteBySelection');
    });
    Route::resource('coupons', CouponController::class);
    Route::controller(GiftCardController::class)->group(function () {
        Route::get('gift_cards/list', 'listApi');
        Route::post('gift_cards/store', 'storeApi');
        Route::get('gift_cards/edit/{id}', 'editApi');
        Route::put('gift_cards/update/{id}', 'updateApi');
        Route::delete('gift_cards/delete/{id}', 'destroyApi');
        Route::post('gift_cards/recharge-api/{id}', 'rechargeApi');
        Route::get('gift_cards/gencode', 'generateCode');
        Route::post('gift_cards/deletebyselection', 'deleteBySelection');
    });
    Route::resource('gift_cards', GiftCardController::class);

    Route::controller(CourierController::class)->group(function () {
        Route::get('couriers/list', 'listApi');
        Route::get('couriers/edit/{id}', 'editApi');
        Route::post('couriers/store', 'storeApi');
        Route::put('couriers/update/{id}', 'updateApi');
        Route::delete('couriers/delete/{id}', 'destroyApi');
    });
    Route::resource('couriers', CourierController::class);

    Route::controller(DeliveryController::class)->group(function () {
        Route::prefix('delivery')->group(function () {
            Route::get('list', 'listApi');
            Route::get('edit-api/{id}', 'editApi');
            Route::get('details/{id}', 'detailsApi');
            Route::put('update-api/{id}', 'updateApi');
            Route::delete('delete-api/{id}', 'destroyApi');
            Route::get('/', 'index')->name('delivery.index');
            Route::get('delivery_list_data', 'deliveryListData');
            Route::get('product_delivery/{id}', 'productDeliveryData');
            Route::get('create/{id}', 'create');
            Route::post('store', 'store')->name('delivery.store');
            Route::post('sendmail', 'sendMail')->name('delivery.sendMail');
            Route::get('{id}/edit', 'edit');
            Route::post('update', 'update')->name('delivery.update');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::post('delete/{id}', 'delete')->name('delivery.delete');
        });
    });

     
    Route::controller(ChallanController::class)->group(function () {
        Route::prefix('challans')->group(function () {
            Route::get('/', 'index')->name('challan.index');
            Route::post('challan-data', 'challanData');
            Route::post('create', 'create')->name('challan.create');
            Route::post('store', 'store')->name('challan.store');
            Route::get('invoice/{id}', 'genInvoice')->name('challan.genInvoice');
            Route::get('money-reciept/{id}', 'moneyReciept')->name('challan.moneyReciept');
            Route::get('finalize/{id}', 'finalize')->name('challan.finalize');
            Route::post('update/{id}', 'update')->name('challan.update');
        });
    });
    Route::prefix('purchase')->controller(PurchaseController::class)->group(function () {
        Route::get('create', 'create');
        Route::get('edit-data/{id}', 'editDataApi');
        Route::post('purchase-data', 'purchaseData')->name('purchases.data');
        Route::get('product_purchase/{id}', 'productPurchaseData');
        Route::get('lims_product_search', 'limsProductSearch')->name('product_purchase.search');
        Route::post('add_payment', 'addPayment')->name('purchase.add-payment');
        Route::get('getpayment/{id}', 'getPayment')->name('purchase.get-payment');
        Route::post('updatepayment', 'updatePayment')->name('purchase.update-payment');
        Route::post('deletepayment', 'deletePayment')->name('purchase.delete-payment');
        Route::get('purchase_by_csv', 'purchaseByCsv')->middleware('permission:purchases-import');
        Route::get('deleted_data', 'showDeletedPurchases')
                ->middleware('hasPermanentDeletePermission');
        Route::get('duplicate/{id}', 'duplicate')->name('purchase.duplicate');
        Route::post('deletebyselection', 'deleteBySelection');
        Route::delete('force-delete-selected', 'forceDeleteSelected')
            ->name('purchases.forceDeleteSelected')
            ->middleware('hasPermanentDeletePermission');
        Route::get('supplier/{supplier_id}', 'supplierPurchase')->name('purchase.supplier');
        Route::post('importpurchase', 'importPurchase')->name('purchase.import');
    });

    Route::resource('purchases', PurchaseController::class);

    
    Route::controller(ReturnPurchaseController::class)->group(function () {
        Route::prefix('return-purchase')->group(function () {
            Route::get('create-data', 'createDataApi');
            Route::post('store', 'storeApi');
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-purchase.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-purchase.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-purchase.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-purchase.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
         });
    });
    Route::resource('return-purchase', ReturnPurchaseController::class);
});


Route::group(['middleware' => 'auth'], function() {
    Route::controller(HomeController::class)->group(function () {
        Route::get('home', 'home');
    });
});

Route::group(['middleware' => ['common', 'auth', 'active']], function() {

    Route::get('/languages', [LanguageController::class, 'index'])->name('languages');
    Route::post('/languages/create', [LanguageController::class, 'store']);
    Route::post('/languages/{id}/set-default', [LanguageController::class, 'setDefault']);
    Route::put('/languages/{id}', [LanguageController::class, 'update']);
    Route::delete('/languages/{id}', [LanguageController::class, 'destroy']);

    Route::get('/translations', [TranslationController::class, 'index'])->name('translations');
    Route::get('/translations/{locale}', [TranslationController::class, 'fetchByLanguage']);
    Route::post('/translations', [TranslationController::class, 'store']);
    Route::put('/translations/{id}', [TranslationController::class, 'update']);
    Route::delete('/translations/{id}', [TranslationController::class, 'destroy']);

    Route::controller(HomeController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/dashboard', 'dashboard');

        Route::get('new-release', 'newVersionReleasePage')->name('new-release');
        Route::post('version-upgrade', 'versionUpgrade')->name('version-upgrade');

        Route::get('/yearly-best-selling-price', 'yearlyBestSellingPrice');
        Route::get('/yearly-best-selling-qty', 'yearlyBestSellingQty');
        Route::get('/monthly-best-selling-qty', 'monthlyBestSellingQty');
        Route::get('/recent-sale', 'recentSale');
        Route::get('/recent-purchase', 'recentPurchase');
        Route::get('/recent-quotation', 'recentQuotation');
        Route::get('/recent-payment', 'recentPayment');
        Route::get('switch-theme/{theme}', 'switchTheme')->name('switchTheme');
        Route::get('/dashboard-filter/{start_date}/{end_date}/{warehouse_id}', 'dashboardFilter');
        Route::get('addon-list', 'addonList');
        Route::get('my-transactions/{year}/{month}', 'myTransaction');
    });

    // Need to check again
    Route::resource('products',ProductController::class)->except([ 'show']);
    Route::controller(ProductController::class)->group(function () {
        Route::post('products/product-data', 'productData');
        Route::get('products/gencode', 'generateCode')->name('product.gencode');
        Route::get('products/search', 'search');
        Route::get('products/saleunit/{id}', 'saleUnit')->name ('product-saleunit');
        Route::get('products/getdata/{id}/{variant_id}', 'getData')->name('products.getdata');
        Route::get('products/product_warehouse/{id}', 'productWarehouseData')->name('product.warehouse');
        Route::get('products/print_barcode','printBarcode')->name('product.printBarcode');
        Route::get('products/lims_product_search', 'limsProductSearch')->name('product.search');
        Route::post('products/deletebyselection', 'deleteBySelection')->name('products.deletebyselection');
        Route::post('products/update', 'updateProduct');
        Route::get('products/variant-data/{id}','variantData');
        Route::get('products/history', 'history')->name('products.history');
        Route::post('products/sale-history-data', 'saleHistoryData');
        Route::post('products/purchase-history-data', 'purchaseHistoryData');
        Route::post('products/sale-return-history-data', 'saleReturnHistoryData');
        Route::post('products/purchase-return-history-data', 'purchaseReturnHistoryData');
        Route::post('products/adjustment-history-data', 'adjustmentHistoryData');
        Route::post('products/transfer-history-data', 'transferHistoryData');

        Route::post('importproduct', 'importProduct')->name('product.import');
        Route::post('exportproduct', 'exportProduct')->name('product.export');
        Route::get('products/all-product-in-stock', 'allProductInStock')->name('product.allProductInStock');
        Route::get('products/show-all-product-online', 'showAllProductOnline')->name('product.showAllProductOnline');
        Route::get('check-batch-availability/{product_id}/{batch_no}/{warehouse_id}', 'checkBatchAvailability');
        Route::get('product-price/{id}', 'getProductPrice');
     });


    Route::get('language_switch/{id}', [LanguageController::class, 'switchLanguage']);

    Route::resource('role',RoleController::class);
    Route::controller(RoleController::class)->group(function () {
        Route::get('role/permission/{id}', 'permission')->name('role.permission');
        Route::post('role/set_permission', 'setPermission')->name('role.setPermission');
    });

    //Sms Template
    Route::resource('smstemplates',SmsTemplateController::class);
    Route::resource('unit', UnitController::class);
    Route::controller(UnitController::class)->group(function () {
        Route::post('importunit', 'importUnit')->name('unit.import');
        Route::post('unit/deletebyselection', 'deleteBySelection');
        Route::get('unit/lims_unit_search', 'limsUnitSearch')->name('unit.search');
     });

    Route::controller(CategoryController::class)->group(function () {
        Route::post('category/import', 'import')->name('category.import');
        Route::post('category/deletebyselection', 'deleteBySelection');
        Route::post('category/category-data', 'categoryData');
    });
    Route::resource('category', CategoryController::class);


    Route::controller(BrandController::class)->group(function () {
        Route::post('importbrand', 'importBrand')->name('brand.import');
        Route::post('brand/deletebyselection', 'deleteBySelection');
        Route::get('brand/lims_brand_search', 'limsBrandSearch')->name('brand.search');
    });
    Route::resource('brand', BrandController::class);


    Route::controller(SupplierController::class)->group(function () {
        Route::post('importsupplier', 'importSupplier')->name('supplier.import');
        Route::post('supplier/deletebyselection', 'deleteBySelection');
        Route::post('suppliers/clear-due', 'clearDue')->name('supplier.clearDue');
        Route::get('suppliers/all', 'suppliersAll')->name('supplier.all');
        Route::get('suppliers/ledger/{id}', 'ledger')->name('suppliers.ledger');
        Route::get('supplier-due/{id}', 'supplierDue')->name('supplier.due');
        Route::get('suppliers/{supplier_id}', 'supplierPayments')->name('suppliers.payments');
    });
    Route::resource('supplier', SupplierController::class);


    Route::controller(WarehouseController::class)->group(function () {
        Route::post('importwarehouse', 'importWarehouse')->name('warehouse.import');
        Route::post('warehouse/deletebyselection', 'deleteBySelection');
        Route::get('warehouse/lims_warehouse_search', 'limsWarehouseSearch')->name('warehouse.search');
        Route::get('warehouse/all', 'warehouseAll')->name('warehouse.all');
    });
    Route::resource('warehouse', WarehouseController::class);

    Route::resource('printers', PrinterController::class);

    Route::resource('tables', TableController::class);


    Route::controller(TaxController::class)->group(function () {
        Route::post('importtax', 'importTax')->name('tax.import');
        Route::post('tax/deletebyselection', 'deleteBySelection');
        Route::get('tax/lims_tax_search', 'limsTaxSearch')->name('tax.search');
    });
    Route::resource('tax', TaxController::class);


    Route::controller(CustomerGroupController::class)->group(function () {
        Route::post('importcustomer_group', 'importCustomerGroup')->name('customer_group.import');
        Route::post('customer_group/deletebyselection', 'deleteBySelection');
        Route::get('customer_group/lims_customer_group_search', 'limsCustomerGroupSearch')->name('customer_group.search');
        Route::get('customer_group/all', 'customerGroupAll')->name('customer_group.all');
    });
    Route::resource('customer_group', CustomerGroupController::class);


    Route::resource('discount-plans', DiscountPlanController::class);
    Route::resource('discounts', DiscountController::class);
    Route::get('discounts/product-search/{code}', [DiscountController::class,'productSearch']);


    Route::controller(CustomerController::class)->group(function () {
        Route::post('importcustomer', 'importCustomer')->name('customer.import');
        Route::post('customer/deletebyselection', 'deleteBySelection');
        Route::get('customer/lims_customer_search', 'limsCustomerSearch')->name('customer.search');
        Route::post('customers/clear-due', 'clearDue')->name('customer.clearDue');
        Route::post('customers/customer-data', 'customerData');
        Route::get('customers/all', 'customersAll')->name('customer.all');

        // customer deposit route
        Route::get('customer/getDeposit/{id}', 'getDeposit');
        Route::post('customer/add_deposit', 'addDeposit')->name('customer.addDeposit');
        Route::post('customer/update_deposit', 'updateDeposit')->name('customer.updateDeposit');
        Route::post('customer/deleteDeposit', 'deleteDeposit')->name('customer.deleteDeposit');

        //customer points route
        Route::post('customer/deletePoints', 'deletePoints')->name('customer.deletePoints');
        Route::post('customer/add-point', 'addPoint')->name('customer.addPoint');
        Route::get('customer/getPoints/{id}', 'getPoints');
        Route::post('customer/update_point', 'updatePoint')->name('customer.updatePoint');
        Route::get('customers/{customer_id}', 'customerPayments')->name('customers.payments');
        Route::get('customers/ledger/{id}', 'ledger')->name('customers.ledger');
    });

    Route::resource('customer', CustomerController::class)->where(['customer' => '[0-9]+']);


    Route::controller(BillerController::class)->group(function () {
        Route::post('importbiller', 'importBiller')->name('biller.import');
        Route::post('biller/deletebyselection', 'deleteBySelection');
        Route::get('biller/lims_biller_search', 'limsBillerSearch')->name('biller.search');
    });
    Route::resource('biller', BillerController::class);


    Route::controller(SaleController::class)->group(function () {
        Route::post('sales/sale-data', 'saleData');
        Route::post('sales/sendmail', 'sendMail')->name('sale.sendmail');
        Route::get('sales/sale_by_csv', 'saleByCsv')->middleware('permission:sales-import');
        Route::get('sales/deleted_data', 'showDeletedSales')
                ->middleware('hasPermanentDeletePermission');
        Route::delete('sales/force-delete-selected', 'forceDeleteSelected')
            ->name('sales.forceDeleteSelected')
                ->middleware('hasPermanentDeletePermission');
        Route::get('sales/product_sale/{id}', 'productSaleData');
        Route::get('sales/get-sale/{id}', 'getSale');
        Route::post('importsale', 'importSale')->name('sale.import');
        Route::get('pos/{id?}', 'posSale')->name('sale.pos');
        Route::get('sales/recent-sale', 'recentSale');
        Route::get('sales/recent-draft', 'recentDraft');
        Route::get('sales/lims_sale_search', 'limsSaleSearch')->name('sale.search');
        Route::get('sales/lims_product_search', 'limsProductSearch')->name('product_sale.search');
        Route::get('sales/getcustomergroup/{id}', 'getCustomerGroup')->name('sale.getcustomergroup');

        Route::get('sales/getproduct/{id}', 'getProduct')->name('sale.getproduct');

        Route::get('sales/getproducts/{warehouse_id}/{key}/{value}', 'getProducts');

        Route::get('sales/search/{warehouse_id}/{search}', 'search');

        Route::get('sales/get_gift_card', 'getGiftCard');
        Route::get('sales/paypalSuccess', 'paypalSuccess');
        Route::get('sales/paypalPaymentSuccess/{id}', 'paypalPaymentSuccess');
        Route::get('sales/gen_invoice/{id}', 'genInvoice')->name('sale.invoice');
        Route::post('sales/add_payment', 'addPayment')->name('sale.add-payment');
        Route::get('sales/getpayment/{id}', 'getPayment')->name('sale.get-payment');
        Route::post('sales/updatepayment', 'updatePayment')->name('sale.update-payment');
        Route::post('sales/deletepayment', 'deletePayment')->name('sale.delete-payment');
        Route::get('sales/{id}/create', 'createSale')->name('sale.draft');
        Route::post('sales/deletebyselection', 'deleteBySelection');
        Route::get('customer-display', 'customerDisplay')->name('sales.customerDisplay');
        Route::get('sales/print-last-reciept', 'printLastReciept')->name('sales.printLastReciept');
        Route::get('sales/today-sale', 'todaySale');
        Route::get('sales/today-profit/{warehouse_id}', 'todayProfit');
        Route::get('sales/check-discount', 'checkDiscount');
        Route::get('sales/get-sold-items/{id}', 'getSoldItem');
        Route::post('sales/sendsms', 'sendSMS')->name('sale.sendsms');
        Route::post('sales/whatsapp-notification', 'whatsappNotificationSend')->name('sale.wappnotification');
        Route::get('customer-sales/{customer_id}', 'customerSales')->name('sales.customer');
    });
    Route::resource('sales', SaleController::class)->except('show');

    Route::get('/installmentplan/{id}', [InstallmentPlanController::class, 'show'])->name('installmentplan.show');

    Route::post('/razorpay/pay', [RazorpayController::class, 'createOrder']);
    Route::post('/razorpay/verify', [RazorpayController::class, 'verifyPayment']);

    Route::controller(PackingSlipController::class)->group(function () {
        Route::prefix('packing-slips')->group(function () {
            Route::get('/', 'index')->name('packingSlip.index');
            Route::post('packing-slip-data', 'packingSlipData');
            Route::post('store', 'store')->name('packingSlip.store');
            Route::post('delete/{id}', 'delete')->name('packingSlip.delete');
            Route::get('invoice/{id}', 'genInvoice')->name('packingSlip.genInvoice');
        });
    });

    Route::controller(ChallanController::class)->group(function () {
        Route::prefix('challans')->group(function () {
            Route::get('/', 'index')->name('challan.index');
            Route::post('challan-data', 'challanData');
            Route::post('create', 'create')->name('challan.create');
            Route::post('store', 'store')->name('challan.store');
            Route::get('invoice/{id}', 'genInvoice')->name('challan.genInvoice');
            Route::get('money-reciept/{id}', 'moneyReciept')->name('challan.moneyReciept');
            Route::get('finalize/{id}', 'finalize')->name('challan.finalize');
            Route::post('update/{id}', 'update')->name('challan.update');
        });
    });

    Route::controller(DeliveryController::class)->group(function () {
        Route::prefix('delivery')->group(function () {
            Route::get('/', 'index')->name('delivery.index');
            Route::get('delivery_list_data','deliveryListData');
            Route::get('product_delivery/{id}','productDeliveryData');
            Route::get('create/{id}', 'create');
            Route::post('store', 'store')->name('delivery.store');
            Route::post('sendmail', 'sendMail')->name('delivery.sendMail');
            Route::get('{id}/edit', 'edit');
            Route::post('update', 'update')->name('delivery.update');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::post('delete/{id}', 'delete')->name('delivery.delete');
        });
     });

    Route::controller(SteadFastController::class)->group(function() {
        Route::get('/delivery/steadfast/{sale_id}', 'getSaleForSteadFast');
        Route::post('/steadfast/create-order', 'store')->name('steadfast.create-order');
        Route::get('/steadfast/{sale_id}', 'show')->name('steadfast.track');
    });


    Route::controller(QuotationController::class)->group(function () {
        Route::prefix('quotations')->group(function () {
            Route::post('quotation-data', 'quotationData')->name('quotations.data');
            Route::get('product_quotation/{id}','productQuotationData');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_quotation.search');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('quotation.getcustomergroup');
            Route::get('getproduct/{id}', 'getProduct')->name('quotation.getproduct');
            Route::get('{id}/create_sale', 'createSale')->name('quotation.create_sale');
            Route::get('{id}/create_purchase', 'createPurchase')->name('quotation.create_purchase');
            Route::post('sendmail', 'sendMail')->name('quotation.sendmail');
            Route::post('deletebyselection', 'deleteBySelection');
        });
     });
    Route::resource('quotations', QuotationController::class);


    Route::controller(PurchaseController::class)->group(function () {
        Route::prefix('purchases')->group(function () {
            Route::post('purchase-data', 'purchaseData')->name('purchases.data');
            Route::get('product_purchase/{id}', 'productPurchaseData');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_purchase.search');
            Route::post('add_payment', 'addPayment')->name('purchase.add-payment');
            Route::get('getpayment/{id}', 'getPayment')->name('purchase.get-payment');
            Route::post('updatepayment', 'updatePayment')->name('purchase.update-payment');
            Route::post('deletepayment', 'deletePayment')->name('purchase.delete-payment');
            Route::get('purchase_by_csv', 'purchaseByCsv')->middleware('permission:purchases-import');
            Route::get('deleted_data', 'showDeletedPurchases')
                ->middleware('hasPermanentDeletePermission');
            Route::get('duplicate/{id}', 'duplicate')->name('purchase.duplicate');
            Route::post('deletebyselection', 'deleteBySelection');
            Route::delete('force-delete-selected', 'forceDeleteSelected')
                ->name('purchases.forceDeleteSelected')
                ->middleware('hasPermanentDeletePermission');
            Route::get('supplier/{supplier_id}', 'supplierPurchase')->name('purchase.supplier');
        });
        Route::post('importpurchase', 'importPurchase')->name('purchase.import');
    });
    Route::resource('purchases', PurchaseController::class);



    Route::controller(TransferController::class)->group(function () {
        Route::prefix('transfers')->group(function () {
            Route::post('transfer-data', 'transferData')->name('transfers.data');
            Route::get('product_transfer/{id}', 'productTransferData');
            Route::get('transfer_by_csv', 'transferByCsv')->middleware('permission:transfers-import');
            Route::get('getproduct/{id}', 'getProduct')->name('transfers.getproduct');
            Route::put('change-status/{id}', 'changeStatus')->name('transfers.changeStatus');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_transfer.search');
            Route::post('deletebyselection', 'deleteBySelection');
         });
        Route::post('importtransfer', 'importTransfer')->name('transfer.import');
    });
    Route::resource('transfers', TransferController::class);



    Route::controller(AdjustmentController::class)->group(function () {
        Route::get('qty_adjustment/getproduct/{id}', 'getProduct')->name('adjustment.getproduct');
        Route::get('qty_adjustment/lims_product_search', 'limsProductSearch')->name('product_adjustment.search');
        Route::post('qty_adjustment/deletebyselection', 'deleteBySelection');
    });
    Route::resource('qty_adjustment', AdjustmentController::class);


    Route::controller(ReturnController::class)->group(function () {
        Route::prefix('return-sale')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-sale.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-sale.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-sale.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-sale.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
         });
    });
    Route::resource('return-sale', ReturnController::class);

// Replace your existing exchange routes with these:

Route::controller(ExchangeController::class)->prefix('exchange')->group(function () {
    Route::post('exchange-data', 'exchangeData')->name('exchange.data');
    Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('exchange.getcustomergroup');
    Route::post('sendmail', 'sendMail')->name('exchange.sendmail');
    Route::get('getproduct/{id}', 'getProduct')->name('exchange.getproduct');
    Route::get('lims_product_search', 'limsProductSearch')->name('exchange.lims_product_search');
    // FIXED: Changed from exchangeData to productExchange
    Route::get('product_exchange/{id}', 'productExchange')->name('exchange.product_exchange');
    Route::post('deletebyselection', 'deleteBySelection')->name('exchange.deletebyselection');
});

Route::resource('exchange', ExchangeController::class);
Route::get('/sale-exchange/search', [ExchangeController::class, 'searchByReference'])
    ->name('sale.exchange.search');

    Route::controller(ReturnPurchaseController::class)->group(function () {
        Route::prefix('return-purchase')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-purchase.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-purchase.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-purchase.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-purchase.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
         });
    });
    Route::resource('return-purchase', ReturnPurchaseController::class);


    Route::controller(ReportController::class)->group(function () {
        Route::prefix('report')->group(function () {
            Route::get('product_quantity_alert', 'productQuantityAlert')->name('report.qtyAlert');
            Route::get('daily-sale-objective', 'dailySaleObjective')->name('report.dailySaleObjective');
            Route::post('daily-sale-objective-data', 'dailySaleObjectiveData');
            Route::get('product-expiry', 'productExpiry')->name('report.productExpiry');
            Route::get('warehouse_stock', 'warehouseStock')->name('report.warehouseStock');
            Route::get('daily_sale/{year}/{month}', 'dailySale');
            Route::post('daily_sale/{year}/{month}', 'dailySaleByWarehouse')->name('report.dailySaleByWarehouse');
            Route::get('monthly_sale/{year}', 'monthlySale');
            Route::post('monthly_sale/{year}', 'monthlySaleByWarehouse')->name('report.monthlySaleByWarehouse');
            Route::get('daily_purchase/{year}/{month}', 'dailyPurchase');
            Route::post('daily_purchase/{year}/{month}', 'dailyPurchaseByWarehouse')->name('report.dailyPurchaseByWarehouse');
            Route::get('monthly_purchase/{year}', 'monthlyPurchase');
            Route::post('monthly_purchase/{year}', 'monthlyPurchaseByWarehouse')->name('report.monthlyPurchaseByWarehouse');
            Route::get('best_seller', 'bestSeller');
            Route::post('best_seller', 'bestSellerByWarehouse')->name('report.bestSellerByWarehouse');
            Route::post('profit_loss', 'profitLoss')->name('report.profitLoss');
            Route::get('product_report', 'productReport')->name('report.product');
            Route::post('product_report_data', 'productReportData');
            Route::post('purchase', 'purchaseReport')->name('report.purchase');
            Route::post('purchase_report_data', 'purchaseReportData');
            Route::post('sale_report', 'saleReport')->name('report.sale');
            Route::post('sale_report_data', 'saleReportData');
            Route::get('challan-report', 'challanReport')->name('report.challan');
            Route::post('sale-report-chart', 'saleReportChart')->name('report.saleChart');
            Route::post('payment_report_by_date', 'paymentReportByDate')->name('report.paymentByDate');
            Route::post('warehouse_report', 'warehouseReport')->name('report.warehouse');
            Route::post('warehouse-sale-data', 'warehouseSaleData');
            Route::post('warehouse-purchase-data', 'warehousePurchaseData');
            Route::post('warehouse-expense-data', 'warehouseExpenseData');
            Route::post('warehouse-quotation-data', 'warehouseQuotationData');
            Route::post('warehouse-return-data', 'warehouseReturnData');
            Route::post('user_report', 'userReport')->name('report.user');
            Route::post('user-sale-data', 'userSaleData');
            Route::post('user-purchase-data', 'userPurchaseData');
            Route::post('user-expense-data', 'userExpenseData');
            Route::post('user-quotation-data', 'userQuotationData');
            Route::post('user-payment-data', 'userPaymentData');
            Route::post('user-transfer-data', 'userTransferData');
            Route::post('user-payroll-data', 'userPayrollData');
            Route::post('biller_report', 'billerReport')->name('report.biller');
            Route::post('biller-sale-data','billerSaleData');
            Route::post('biller-quotation-data','billerQuotationData');
            Route::post('biller-payment-data','billerPaymentData');
            Route::post('customer_report', 'customerReport')->name('report.customer');
            Route::post('customer-sale-data', 'customerSaleData');
            Route::post('customer-payment-data', 'customerPaymentData');
            Route::post('customer-quotation-data', 'customerQuotationData');
            Route::post('customer-return-data', 'customerReturnData');
            Route::post('customer-group', 'customerGroupReport')->name('report.customer_group');
            Route::post('customer-group-sale-data', 'customerGroupSaleData');
            Route::post('customer-group-payment-data', 'customerGroupPaymentData');
            Route::post('customer-group-quotation-data', 'customerGroupQuotationData');
            Route::post('customer-group-return-data', 'customerGroupReturnData');
            Route::post('supplier', 'supplierReport')->name('report.supplier');
            Route::post('supplier-purchase-data', 'supplierPurchaseData');
            Route::post('supplier-payment-data', 'supplierPaymentData');
            Route::post('supplier-return-data', 'supplierReturnData');
            Route::post('supplier-quotation-data', 'supplierQuotationData');
            Route::post('customer-due-report', 'customerDueReportByDate')->name('report.customerDueByDate');
            Route::post('customer-due-report-data', 'customerDueReportData');
            Route::post('supplier-due-report', 'supplierDueReportByDate')->name('report.supplierDueByDate');
            Route::post('supplier-due-report-data', 'supplierDueReportData');
        });
    });


    Route::controller(UserController::class)->group(function () {
        Route::get('user/profile/{id}', 'profile')->name('user.profile');
        Route::put('user/update_profile/{id}', 'profileUpdate')->name('user.profileUpdate');
        Route::put('user/changepass/{id}', 'changePassword')->name('user.password');
        Route::get('user/genpass', 'generatePassword');
        Route::post('user/deletebyselection', 'deleteBySelection');
        Route::get('user/notification', 'notificationUsers')->name('user.notification');
        Route::get('user/all', 'allUsers')->name('user.all');
        Route::post('user/toggle-status', [UserController::class, 'toggleStatus'])->name('user.toggleStatus');

    });
    Route::resource('user', UserController::class);


    Route::controller(SettingController::class)->group(function () {
        Route::prefix('setting')->group(function () {
            Route::get('activity-log', 'activityLog')->name('setting.activityLog');
            Route::get('general_setting', 'generalSetting')->name('setting.general');
            Route::post('general_setting_store', 'generalSettingStore')->name('setting.generalStore');

            Route::get('app_setting', 'appSetting')->name('setting.app');
            Route::delete('app_setting/{id}', 'appSettingDelete')->name('setting.tokenDelete');

            Route::get('reward-point-setting', 'rewardPointSetting')->name('setting.rewardPoint');
            Route::post('reward-point-setting_store', 'rewardPointSettingStore')->name('setting.rewardPointStore');

            Route::get('general_setting/change-theme/{theme}', 'changeTheme');
            Route::get('mail_setting', 'mailSetting')->name('setting.mail');
            Route::get('sms_setting', 'smsSetting')->name('setting.sms');
            Route::get('createsms', 'createSms')->name('setting.createSms');
            Route::post('sendsms', 'sendSMS')->name('setting.sendSms');
            Route::get('payment-gateways/list', 'gateway')->name('setting.gateway');
            Route::post('payment-gateways/update','gatewayUpdate')->name('setting.gateway.update');
            Route::get('hrm_setting', 'hrmSetting')->name('setting.hrm');
            Route::post('hrm_setting_store', 'hrmSettingStore')->name('setting.hrmStore');
            Route::post('mail_setting_store', 'mailSettingStore')->name('setting.mailStore');
            Route::post('sms_setting_store', 'smsSettingStore')->name('setting.smsStore');
            Route::get('pos_setting', 'posSetting')->name('setting.pos');
            Route::post('pos_setting_store', 'posSettingStore')->name('setting.posStore');
            Route::get('empty-database', 'emptyDatabase')->name('setting.emptyDatabase');

         });
        Route::get('backup', 'backup')->name('setting.backup');
    });

    Route::prefix('setting')->name('settings.')->group(function () {
        Route::resource('invoice', InvoiceSettingController::class);
    });

    Route::get('/barcodes/set_default/{id}', [BarcodeController::class, 'setDefault']);
    Route::controller(BarcodeController::class)->group(function () {
        Route::post('barcodes/barcode-data', 'barcodeData')->name('barcodes.data');
    });
    Route::resource('barcodes', BarcodeController::class);


    Route::get('/labels/show', [LabelsController::class, 'show'])->name('print.labels');
    Route::get('/labels/add-product-row', [LabelsController::class, 'addProductRow']);
    Route::get('/labels/print', [LabelsController::class, 'printLabel'])->name('print.label');

    Route::controller(ExpenseCategoryController::class)->group(function () {
        Route::get('expense_categories/gencode', 'generateCode');
        Route::post('expense_categories/import', 'import')->name('expense_category.import');
        Route::post('expense_categories/deletebyselection', 'deleteBySelection');
        Route::get('expense_categories/all', 'expenseCategoriesAll')->name('expense_category.all');;
    });
    Route::resource('expense_categories', ExpenseCategoryController::class);


    Route::controller(ExpenseController::class)->group(function () {
        Route::post('expenses/expense-data', 'expenseData')->name('expenses.data');
        Route::post('expenses/deletebyselection', 'deleteBySelection');
    });
    Route::resource('expenses', ExpenseController::class);

    // IncomeCategory & Income Start
    Route::controller(IncomeCategoryController::class)->group(function () {
        Route::get('income_categories/gencode', 'generateCode');
        Route::post('income_categories/import', 'import')->name('income_category.import');
        Route::post('income_categories/deletebyselection', 'deleteBySelection');
        Route::get('income_categories/all', 'incomeCategoriesAll')->name('income_category.all');;
    });
    Route::resource('income_categories', IncomeCategoryController::class);


    Route::controller(IncomeController::class)->group(function () {
        Route::post('incomes/income-data', 'incomeData')->name('incomes.data');
        Route::post('incomes/deletebyselection', 'deleteBySelection');
    });
    Route::resource('incomes', IncomeController::class);
    // IncomeCategory & Income End


    Route::controller(GiftCardController::class)->group(function () {
        Route::get('gift_cards/gencode', 'generateCode');
        Route::post('gift_cards/recharge/{id}', 'recharge')->name('gift_cards.recharge');
        Route::post('gift_cards/deletebyselection', 'deleteBySelection');
    });
    Route::resource('gift_cards', GiftCardController::class);

    Route::resource('couriers', CourierController::class);

    Route::controller(CouponController::class)->group(function () {
        Route::get('coupons/gencode', 'generateCode');
        Route::post('coupons/deletebyselection', 'deleteBySelection');
    });
    Route::resource('coupons', CouponController::class);

    Route::get('phpfileinfo', function () {
        phpinfo();
    })->name('phpfileinfo');


    //accounting routes
    Route::controller(AccountsController::class)->group(function () {
        Route::get('make-default/{id}', 'makeDefault');
        Route::get('balancesheet', 'balanceSheet')->name('accounts.balancesheet');
        Route::post('account-statement', 'accountStatement')->name('accounts.statement');
        Route::get('accounts/all', 'accountsAll')->name('account.all');
    });
    Route::resource('accounts', AccountsController::class);


    Route::resource('money-transfers', MoneyTransferController::class);


    //HRM routes
    Route::post('departments/deletebyselection', [DepartmentController::class,'deleteBySelection']);
    Route::resource('departments', DepartmentController::class);
    Route::resource('designations', DesignationController::class);
    Route::resource('shift', ShiftController::class);
    Route::resource('overtime', OvertimeController::class);
    Route::resource('leave-type', LeaveTypeController::class);
    Route::resource('leave', LeaveController::class);
    Route::get('hrm-panel',[HrmController::class,'index'])->name('hrm-panel');
    Route::resource('sale-agents', SaleAgentController::class)->except('show');
    Route::get('/payroll/monthly-data', [PayrollController::class, 'monthlyData'])->name('payroll.monthlyData');
    Route::get('payroll/get-employees-by-warehouse', [PayrollController::class, 'getEmployeesByWarehouse'])->name('payroll.getEmployeesByWarehouse');
    Route::post('payroll/store-multiple', [PayrollController::class, 'storeMultiple'])->name('payroll.storeMultiple');
    Route::post('payroll/generate', [PayrollController::class, 'generateCards'])->name('payroll.generateCards');





    Route::post('employees/deletebyselection', [EmployeeController::class, 'deleteBySelection']);
    Route::resource('employees', EmployeeController::class);


    Route::post('payroll/deletebyselection', [PayrollController::class, 'deleteBySelection']);
    Route::resource('payroll', PayrollController::class);


    Route::post('attendance/delete/{date}/{employee_id}', [AttendanceController::class, 'delete'])->name('attendances.delete');
    Route::post('attendance/deletebyselection', [AttendanceController::class, 'deleteBySelection']);
    Route::post('attendance/importDeviceCsv', [AttendanceController::class, 'importDeviceCsv'])->name('attendances.importDeviceCsv');
    Route::resource('attendance', AttendanceController::class);

    Route::controller(StockCountController::class)->group(function () {
        Route::post('stock-count/finalize', 'finalize')->name('stock-count.finalize');
        Route::get('stock-count/stockdif/{id}', 'stockDif');
        Route::get('stock-count/{id}/qty_adjustment', 'qtyAdjustment')->name('stock-count.adjustment');
    });
    Route::resource('stock-count', StockCountController::class);


    Route::controller(HolidayController::class)->group(function () {
        Route::post('holidays/deletebyselection', 'deleteBySelection');
        Route::get('approve-holiday/{id}', 'approveHoliday')->name('approveHoliday');
        Route::get('holidays/my-holiday/{year}/{month}', 'myHoliday')->name('myHoliday');
    });
    Route::resource('holidays', HolidayController::class);


    Route::controller(CashRegisterController::class)->group(function () {
        Route::prefix('cash-register')->group(function () {
            Route::get('/', 'index')->name('cashRegister.index');
            Route::get('check-availability/{warehouse_id}', 'checkAvailability')->name('cashRegister.checkAvailability');
            Route::post('store', 'store')->name('cashRegister.store');
            Route::get('getDetails/{id}', 'getDetails');
            Route::post('close', 'close')->name('cashRegister.close');
        });
    });


    Route::controller(NotificationController::class)->group(function () {
        Route::prefix('notifications')->group(function () {
            Route::get('/', 'index')->name('notifications.index');
            Route::post('store', 'store')->name('notifications.store');
            Route::get('mark-as-read', 'markAsRead');
        });
    });


    Route::resource('currency', CurrencyController::class);

    Route::resource('custom-fields', CustomFieldController::class);

    Route::controller(AddonInstallController::class)->group(function () {
        Route::post('saas-install', 'saasInstall')->name('saas.install');
        Route::post('ecommerce-install','ecommerceInstall')->name('ecommerce.install');
        Route::post('woocommerce-install','woocommerceInstall')->name('woocommerce.install');
        Route::post('api-install', 'apiInstall')->name('api.install');
    });

    Route::prefix('whatsapp')->group(function () {
        Route::get('/settings', [WhatsappController::class, 'settings'])->name('whatsapp.settings');
        Route::post('/settings', [WhatsappController::class, 'updateSettings'])->name('whatsapp.settings.update');

        Route::get('/templates', [WhatsappController::class, 'templates'])->name('whatsapp.templates');
        Route::delete('/template/delete/{name}', [WhatsappController::class, 'deleteTemplate'])->name('whatsapp.template.delete');

        Route::get('/send', [WhatsappController::class, 'sendPage'])->name('whatsapp.send.page');
        Route::post('/send', [WhatsappController::class, 'sendMessage'])->name('whatsapp.send');
    });

    //ticket routes
    Route::controller(\App\Http\Controllers\landlord\TicketController::class)->group(function () {
        Route::get('tickets','index')->name('tickets.index');
        Route::get('tickets/create','create')->name('tickets.create');
        Route::post('tickets','store')->name('tickets.store');
        Route::get('tickets/{id}','show')->name('tickets.show');
        Route::post('tickets/{id}/reply','reply')->name('tickets.reply');
        Route::delete('tickets/{id}','destroy')->name('tickets.destroy');
    });

});