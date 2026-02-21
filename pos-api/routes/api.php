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

    // React Purchase Create/Edit API – explicit paths so they never conflict with resource('purchases')
    Route::get('purchase-create/form-data', [PurchaseController::class, 'formDataApi']);
    Route::get('purchase-create/product-codes', [PurchaseController::class, 'productCodesApi']);
    Route::get('purchase-create/lims_product_search', [PurchaseController::class, 'limsProductSearchApi']);
    Route::post('purchase-create/store', [PurchaseController::class, 'storeApi']);
    Route::get('purchase-create/edit-data/{id}', [PurchaseController::class, 'getEditDataApi']);
    Route::put('purchase-create/update/{id}', [PurchaseController::class, 'updateApi']);

    Route::controller(PurchaseController::class)->group(function () {
        Route::prefix('purchases')->group(function () {
            Route::post('purchase-data', 'purchaseData')->name('purchases.data');
            Route::get('product_purchase/{id}', 'productPurchaseData');
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