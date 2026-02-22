<?php

use App\Http\Controllers\AccountsController;
use App\Http\Controllers\AdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\BillerController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ChallanController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerGroupController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\DiscountPlanController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExchangeController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GiftCardController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\HRMController;
use App\Http\Controllers\IncomeCategoryController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\InstallmentPlanController;
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
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\PackingSlipController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PrinterController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\ReturnPurchaseController;
use App\Http\Controllers\SaleAgentController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\SmsTemplateController;
use App\Http\Controllers\SteadFastController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\WhatsappController;
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


    Route::controller(SupplierController::class)->prefix('supplier')->group(function () {
        Route::post('importsupplier', 'importSupplier')->name('supplier.import');
        Route::post('supplier/deletebyselection', 'deleteBySelection');
        Route::post('clear-due', 'clearDue')->name('supplier.clearDue');
        Route::get('all', 'suppliersAll')->name('supplier.all');
        Route::get('ledger/{id}', 'ledger')->name('suppliers.ledger');
        Route::get('supplier-due/{id}', 'supplierDue')->name('supplier.due');
        Route::get('{supplier_id}', 'supplierPayments')->name('suppliers.payments');
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
    Route::post('purchases/purchase-data', 'purchaseData')->name('purchases.data');
    Route::get('purchases/product_purchase/{id}', 'productPurchaseData');
    Route::get('purchases/lims_product_search', 'limsProductSearch')->name('product_purchase.search');
    Route::post('purchases/add_payment', 'addPayment')->name('purchase.add-payment');
    Route::get('purchases/getpayment/{id}', 'getPayment')->name('purchase.get-payment');
    Route::post('purchases/updatepayment', 'updatePayment')->name('purchase.update-payment');
    Route::post('purchases/deletepayment', 'deletePayment')->name('purchase.delete-payment');
    Route::get('purchases/purchase_by_csv', 'purchaseByCsv')->name('purchases.purchase_by_csv');
    Route::get('purchases/deleted_data', 'showDeletedPurchases')->name('purchases.deletedData');
    Route::get('purchases/duplicate/{id}', 'duplicate')->name('purchase.duplicate');
    Route::post('purchases/deletebyselection', 'deleteBySelection');
    Route::delete('purchases/force-delete-selected', 'forceDeleteSelected')->name('purchases.forceDeleteSelected');
    Route::get('purchases/supplier/{supplier_id}', 'supplierPurchase')->name('purchase.supplier');
    Route::post('importpurchase', 'importPurchase')->name('purchase.import');
    });
    Route::resource('purchases', PurchaseController::class);

    



    Route::controller(TransferController::class)->group(function () {
            Route::post('transfers/transfer-data', 'transferData')->name('transfers.data');
            Route::get('transfers/product_transfer/{id}', 'productTransferData');
            Route::get('transfers/transfer_by_csv', 'transferByCsv')->middleware('permission:transfers-import');
            Route::get('transfers/getproduct/{id}', 'getProduct')->name('transfers.getproduct');
            Route::put('transfers/change-status/{id}', 'changeStatus')->name('transfers.changeStatus');
            Route::get('transfers/lims_product_search', 'limsProductSearch')->name('product_transfer.search');
            Route::post('transfers/deletebyselection', 'deleteBySelection');
            Route::post('transfers/importtransfer', 'importTransfer')->name('transfer.import');
    });
    Route::resource('transfers', TransferController::class);



    Route::controller(AdjustmentController::class)->prefix('qty_adjustment')->group(function () {
        Route::get('getproduct/{id}', 'getProduct')->name('adjustment.getproduct');
        Route::get('lims_product_search', 'limsProductSearch')->name('product_adjustment.search');
        Route::post('deletebyselection', 'deleteBySelection');
    });
    Route::resource('qty_adjustment', AdjustmentController::class);


    Route::controller(ReturnController::class)->prefix('return-sale')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-sale.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-sale.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-sale.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-sale.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');

    });
    Route::resource('return-sale', ReturnController::class);


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
    Route::get('/sale-exchange/search', [ExchangeController::class, 'searchByReference'])->name('sale.exchange.search');

    Route::controller(ReturnPurchaseController::class)->prefix('return-purchase')->group(function () {
            Route::post('return-data', 'returnData');
            Route::get('getcustomergroup/{id}', 'getCustomerGroup')->name('return-purchase.getcustomergroup');
            Route::post('sendmail', 'sendMail')->name('return-purchase.sendmail');
            Route::get('getproduct/{id}', 'getProduct')->name('return-purchase.getproduct');
            Route::get('lims_product_search', 'limsProductSearch')->name('product_return-purchase.search');
            Route::get('product_return/{id}', 'productReturnData');
            Route::post('deletebyselection', 'deleteBySelection');
    });
    Route::resource('return-purchase', ReturnPurchaseController::class);


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


    Route::controller(SettingController::class)->prefix('setting')->group(function () {
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
    Route::controller(IncomeCategoryController::class)->prefix('income_categories')->group(function () {
        Route::get('gencode', 'generateCode');
        Route::post('import', 'import')->name('income_category.import');
        Route::post('deletebyselection', 'deleteBySelection');
        Route::get('all', 'incomeCategoriesAll')->name('income_category.all');;
    });
    Route::resource('income_categories', IncomeCategoryController::class);


    Route::controller(IncomeController::class)->prefix('incomes')->group(function () {
        Route::post('income-data', 'incomeData')->name('incomes.data');
        Route::post('deletebyselection', 'deleteBySelection');
    });
    Route::resource('incomes', IncomeController::class);
    // IncomeCategory & Income End


    Route::controller(GiftCardController::class)->prefix('gift_cards')->group(function () {
        Route::get('gencode', 'generateCode');
        Route::post('recharge/{id}', 'recharge')->name('gift_cards.recharge');
        Route::post('deletebyselection', 'deleteBySelection');
    });
    Route::resource('gift_cards', GiftCardController::class);

    Route::resource('couriers', CourierController::class);

    Route::controller(CouponController::class)->prefix('coupons')->group(function () {
        Route::get('gencode', 'generateCode');
        Route::post('deletebyselection', 'deleteBySelection');
    });
    Route::resource('coupons', CouponController::class);


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
    Route::get('hrm-panel',[HRMController::class,'index'])->name('hrm-panel');
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

    Route::controller(StockCountController::class)->prefix('stock-count')->group(function () {
        Route::post('finalize', 'finalize')->name('stock-count.finalize');
        Route::get('stockdif/{id}', 'stockDif');
        Route::get('{id}/qty_adjustment', 'qtyAdjustment')->name('stock-count.adjustment');
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


    Route::prefix('whatsapp')->group(function () {
        Route::get('/settings', [WhatsappController::class, 'settings'])->name('whatsapp.settings');
        Route::post('/settings', [WhatsappController::class, 'updateSettings'])->name('whatsapp.settings.update');
        Route::get('/templates', [WhatsappController::class, 'templates'])->name('whatsapp.templates');
        Route::delete('/template/delete/{name}', [WhatsappController::class, 'deleteTemplate'])->name('whatsapp.template.delete');
        Route::get('/send', [WhatsappController::class, 'sendPage'])->name('whatsapp.send.page');
        Route::post('/send', [WhatsappController::class, 'sendMessage'])->name('whatsapp.send');
    });

});


