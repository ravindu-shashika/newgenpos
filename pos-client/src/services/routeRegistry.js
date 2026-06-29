/**
 * Maps Laravel/Blade URL paths to React page components.
 * Add entries here as each screen is migrated and verified.
 */
import {
  Dashboard,
  CategoryManager,
  CustomerGroup,
  CustomerManager,
  BrandManager,
  UnitManager,
  PrinterManager,
  InvoiceSettingManager,
  WarehouseManager,
  ProductCreate,
  PrintBarcode,
  AdjustmentList,
  AdjustmentCreate,
  DamageStockList,
  DamageStockForm,
  StockCountList,
  StockCountQtyAdjustment,
  PurchaseList,
  PurchaseForm,
  SalesList,
  PosPage,
  ChallanList,
  DeliveryList,
  GiftCardList,
  CouponList,
  CourierList,
  ReturnSaleList,
  ReturnPurchaseList,
  ReturnPurchaseCreate,
  QuotationList,
  RolePermissionManager,
  SmsTemplateManager,
  DiscountPlanList,
  DiscountPlanForm,
  DiscountList,
  DiscountForm,
  NotificationList,
  TableManager,
  CurrencyManager,
  TaxManager,
  UserProfile,
  GeneralSettingManager,
  RewardPointSettingManager,
  SmsSettingManager,
  PosSettingManager,
  HrmSettingManager,
  BarcodeSettingManager,
  LanguageManager,
  DepartmentManager,
  DesignationManager,
  ShiftManager,
  EmployeeManager,
  EmployeeCreate,
} from '../views';
import BackendUserMyTransaction from '../views/backend/user/my_transaction.jsx';
import BackendHolidayMyHoliday from '../views/backend/holiday/my_holiday.jsx';
import ProductList from '../views/backend/product/ProductList';
import BackendProductHistory from '../views/backend/product/history';
import SupplierManager from '../views/backend/supplier/SupplierManager';
import UserManager from '../views/backend/user/UserManager';
import SaleAgentManager from '../views/backend/hrm/sale_agent/SaleAgentManager';
import BillerManager from '../views/backend/biller/BillerManager';
import TerminalManager from '../views/backend/terminal/TerminalManager';
import AttendanceManager from '../views/backend/hrm/attendance/AttendanceManager';
import HolidayManager from '../views/backend/hrm/holiday/HolidayManager';
import OvertimeManager from '../views/backend/hrm/overtime/OvertimeManager';
import LeaveTypeManager from '../views/backend/hrm/leave_type/LeaveTypeManager';
import LeaveManager from '../views/backend/hrm/leave/LeaveManager';
import PayrollManager from '../views/backend/hrm/payroll/PayrollManager';
import PayrollGenerate from '../views/backend/hrm/payroll/PayrollGenerate';
import PlaceholderPage from '../views/PlaceholderPage';
import QuotationForm from '../views/backend/quotation/QuotationForm';
import QuotationCreateSale from '../views/backend/quotation/QuotationCreateSale';
import QuotationCreatePurchase from '../views/backend/quotation/QuotationCreatePurchase';
import TransferList from '../views/backend/transfer/TransferList';
import TransferImport from '../views/backend/transfer/import';
import PurchaseImport from '../views/backend/purchase/import';
import PurchaseDeletedData from '../views/backend/purchase/deleted-data';
import TransferForm from '../views/backend/transfer/create';
import ExpenseList from '../views/backend/expense/ExpenseList';
import ExpenseCategoryManager from '../views/backend/expense_category/ExpenseCategoryManager';
import IncomeCategoryManager from '../views/backend/income_category/IncomeCategoryManager';
import IncomeList from '../views/backend/income/IncomeList';
import AccountList from '../views/backend/account/AccountList';
import BalanceSheet from '../views/backend/account/balance_sheet';
import AccountStatement from '../views/backend/account/account_statement';
import MoneyTransferList from '../views/backend/money_transfer/MoneyTransferList';
import ExchangeList from '../views/backend/exchange/ExchangeList';
import PackingSlipList from '../views/backend/packing_slip/PackingSlipList';
import InstallmentPlanList from '../views/backend/installment_plans/InstallmentPlanList';
import SaleForm from '../views/backend/sale/SaleForm';
import CashRegisterIndex from '../views/backend/cash_register/index';
import BookingCalendar from '../views/backend/booking/BookingCalendar';
import ProductionList from '../views/backend/manufacturing/ProductionList';
import ProductionCreate from '../views/backend/manufacturing/ProductionCreate';
import RecipeList from '../views/backend/manufacturing/RecipeList';
import RecipeForm from '../views/backend/manufacturing/RecipeForm';
import ActivityLog from '../views/backend/setting/activity_log';
import WhatsappSettings from '../views/backend/whatsapp/settings';
import WhatsappTemplates from '../views/backend/whatsapp/templates';
import WhatsappSend from '../views/backend/whatsapp/send';
import ProfitLoss from '../views/backend/report/profit_loss';
import BestSeller from '../views/backend/report/best_seller';
import ProductReport from '../views/backend/report/product_report';
import StockReport from '../views/backend/report/stock_report';
import DailySaleReport from '../views/backend/report/daily_sale';
import MonthlySaleReport from '../views/backend/report/monthly_sale';
import DailyPurchaseReport from '../views/backend/report/daily_purchase';
import MonthlyPurchaseReport from '../views/backend/report/monthly_purchase';
import SaleReport from '../views/backend/report/sale_report';
import ChallanReport from '../views/backend/report/challan_report';
import SaleReportChart from '../views/backend/report/sale_report_chart';
import PaymentReport from '../views/backend/report/payment_report';
import PurchaseReport from '../views/backend/report/purchase_report';
import CustomerReport from '../views/backend/report/customer_report';
import CustomerGroupReport from '../views/backend/report/customer_group_report';
import DueReport from '../views/backend/report/due_report';
import SupplierReport from '../views/backend/report/supplier_report';
import SupplierDueReport from '../views/backend/report/supplier_due_report';
import WarehouseReport from '../views/backend/report/warehouse_report';
import WarehouseStockReport from '../views/backend/report/warehouse_stock';
import ProductExpiryReport from '../views/backend/report/product_expiry_report';
import QtyAlertReport from '../views/backend/report/qty_alert_report';
import DailySaleObjectiveReport from '../views/backend/report/daily_sale_objective';
import UserReport from '../views/backend/report/user_report';
import BillerReport from '../views/backend/report/biller_report';

/** Laravel DB menu paths → React app paths */
export const MENU_PATH_ALIASES = {
  '/units': '/unit',
  '/customers': '/customer',
  '/customer-list': '/customer',
  '/people/customer-list': '/customer',
  '/supplier-list': '/supplier',
  '/people/supplier-list': '/supplier',
  '/suppliers': '/supplier',
  '/user-list': '/user',
  '/people/user-list': '/user',
  '/users': '/user',
  '/sale-agents': '/sale-agents',
  '/people/sale-agents': '/sale-agents',
  '/biller-list': '/biller',
  '/people/biller-list': '/biller',
  '/billers': '/biller',
  '/hrm/attendance': '/attendance',
  '/attendance': '/attendance',
  '/hrm/holiday': '/holidays',
  '/holidays': '/holidays',
  '/hrm/overtime': '/overtime',
  '/overtime': '/overtime',
  '/hrm/leave-type': '/leave-type',
  '/leave-type': '/leave-type',
  '/leave-types': '/leave-type',
  '/hrm/leaves': '/leave',
  '/leaves': '/leave',
  '/leave': '/leave',
  '/hrm/payroll': '/payroll',
  '/payroll': '/payroll',
  '/payrolls': '/payroll',
  '/payroll/generate': '/payroll/generate',
  '/hrm/payroll/generate': '/payroll/generate',
  '/customer_group': '/customer_group',
  '/product-list': '/products',
  // menus table: "Add Product" is wrongly stored as /product-print-barcode (see newgenpnns.sql id 6)
  '/product-print-barcode': '/products/create',
  '/add-product': '/products/create',
  '/product/print-barcode': '/products/print_barcode',
  '/product/print_barcode': '/products/print_barcode',
  '/product/category': '/category',
  '/product/brand': '/brand',
  '/product/unit': '/unit',
  '/product/list': '/products',
  '/product/add': '/products/create',
  '/sale/import-csv': '/sales/sale_by_csv',
  '/sale/challan-list': '/challans',
  '/sale/delivery-list': '/delivery',
  '/sale/gift-card-list': '/gift_cards',
  '/sale/coupon-list': '/coupons',
  '/sale/courier-list': '/couriers',
  '/reports/activity-log': '/setting/activity-log',
  '/reports/best-seller': '/report/best_seller',
  '/reports/product-report': '/report/product_report',
  '/reports/daily-sale': '/report/daily_sale',
  '/reports/monthly-sale': '/report/monthly_sale',
  '/reports/daily-purchase': '/report/daily_purchase',
  '/reports/monthly-purchase': '/report/monthly_purchase',
  '/reports/sale-report': '/report/sale_report',
  '/reports/challan-report': '/report/challan-report',
  '/reports/sale-report-chart': '/report/sale-report-chart',
  '/reports/payment-report': '/report/payment_report_by_date',
  '/reports/purchase-report': '/report/purchase',
  '/reports/customer-report': '/report/customer_report',
  '/reports/customer-group-report': '/report/customer-group',
  '/reports/customer-due-report': '/report/customer-due-report',
  '/reports/supplier-report': '/report/supplier',
  '/reports/supplier-due-report': '/report/supplier-due-report',
  '/reports/warehouse-report': '/report/warehouse_report',
  '/reports/warehouse-stock-chart': '/report/warehouse_stock',
  '/reports/product-expiry-report': '/report/product-expiry',
  '/reports/product-quantity-alert': '/report/product_quantity_alert',
  '/reports/daily-sale-objective-report': '/report/daily-sale-objective',
  '/reports/user-report': '/report/user_report',
  '/reports/biller-report': '/report/biller_report',
  '/reports/cash-register': '/cash-register',
  '/settings/custom-field-list': '/custom-fields',
  '/settings/create-sms': '/setting/createsms',
  '/settings/backup-database': '/backup',
  '/settings/mail-setting': '/setting/mail_setting',
  '/bookings': '/bookings/calendar',
  '/product/adjustment-list': '/qty_adjustment',
  '/adjustment-list': '/qty_adjustment',
  '/add-adjustment': '/qty_adjustment/create',
  '/product/add-adjustment': '/qty_adjustment/create',
  '/damage-list': '/damage-stock',
  '/product/damage-list': '/damage-stock',
  '/add-damage-stock': '/damage-stock/create',
  '/damage-stock/create': '/damage-stock/create',
  '/product/stock-count': '/stock-count',
  '/stock-counts': '/stock-count',
  '/purchase/list': '/purchases',
  '/purchase-list': '/purchases',
  '/add-purchase': '/purchases/create',
  '/purchase/create': '/purchases/create',
  '/purchase/add': '/purchases/create',
  '/quotation/list': '/quotations',
  '/quotation/add': '/quotations/create',
  '/add-quotation': '/quotations/create',
  '/quotation/create': '/quotations/create',
  '/transfer/list': '/transfers',
  '/transfer-list': '/transfers',
  '/transfer/add': '/transfers/create',
  '/transfer/import-csv': '/transfers/transfer_by_csv',
  '/add-transfer': '/transfers/create',
  '/transfer/create': '/transfers/create',
  '/expense/list': '/expenses',
  '/expense-list': '/expenses',
  '/add-expense': '/expenses',
  '/expense/add': '/expenses',
  '/expense/categories': '/expense_categories',
  '/expense-categories': '/expense_categories',
  '/expense/category': '/expense_categories',
  '/expense-category': '/expense_categories',
  '/income/categories': '/income_categories',
  '/income-categories': '/income_categories',
  '/income/category': '/income_categories',
  '/income-category': '/income_categories',
  '/income/list': '/incomes',
  '/income-list': '/incomes',
  '/income/add': '/incomes',
  '/add-income': '/incomes',
  '/account-list': '/accounts',
  '/accounting/account-list': '/accounts',
  '/accounting/add-account': '/accounts',
  '/add-account': '/accounts',
  '/money-transfer': '/money-transfers',
  '/money_transfers': '/money-transfers',
  '/accounting/money-transfer': '/money-transfers',
  '/balance-sheet': '/balancesheet',
  '/balance_sheet': '/balancesheet',
  '/accounting/balance-sheet': '/balancesheet',
  '/accounts/balancesheet': '/balancesheet',
  '/accounting/account-statement': '/account-statement',
  '/account_statement': '/account-statement',
  '/purchases/purchase_by_csv': '/purchases/purchase_by_csv',
  '/sales-list': '/sales',
  '/sale-list': '/sales',
  '/sale/list': '/sales',
  '/sale/add': '/sales/create',
  '/add-sale': '/sales/create',
  '/sale/create': '/sales/create',
  '/sale/pos': '/pos',
  '/sale/return': '/return-sale',
  '/pos-settings': '/setting/pos_setting',
  '/settings/pos-settings': '/setting/pos_setting',
  '/settings/hrm-setting': '/setting/hrm_setting',
  '/settings/barcode-settings': '/barcodes',
  '/barcode-settings': '/barcodes',
  '/settings/languages': '/languages',
  '/hrm/department': '/departments',
  '/hrm/designation': '/designations',
  '/hrm/shift': '/shift',
  '/hrm/employee': '/employees',
  '/challan-list': '/challans',
  '/challans-list': '/challans',
  '/packing-slips': '/packing-slips',
  '/sale/packing-slip-list': '/packing-slips',
  '/packing-slip-list': '/packing-slips',
  '/packing_slips': '/packing-slips',
  '/delivery-list': '/deliveries',
  '/delivery': '/deliveries',
  '/gift-card-list': '/gift-cards',
  '/gift_cards': '/gift-cards',
  '/coupon-list': '/coupons',
  '/courier-list': '/couriers',
  '/sale-return-list': '/return-sale',
  '/sale/exchange': '/exchange',
  '/sale-exchange': '/exchange',
  '/installment-plans': '/installment-plans',
  '/installment-list': '/installment-plans',
  '/sale/installment-list': '/installment-plans',
  '/installmentplan': '/installment-plans',
  '/return-purchase': '/return-purchase',
  '/return-purchase/index': '/return-purchase',
  '/return-purchase-create': '/return-purchase',
  '/purchase/return-list': '/return-purchase',
  '/receipt-printers': '/printers',
  '/invoice-settings': '/setting/invoice',
  '/settings/role-permission': '/role',
  '/settings/sms-template': '/smstemplates',
  '/sms-template': '/smstemplates',
  '/settings/discount-plan': '/discount-plans',
  '/discount-plan': '/discount-plans',
  '/settings/discount': '/discounts',
  '/discount': '/discounts',
  '/settings/all-notification': '/notifications',
  '/all-notification': '/notifications',
  '/settings/tables': '/tables',
  '/settings/customer-group': '/customer_group',
  '/customer-group': '/customer_group',
  '/settings/currency': '/currency',
  '/settings/tax': '/tax',
  '/settings/user-profile': '/user-profile',
  '/settings/general-setting': '/general-settings',
  '/setting/general_setting': '/general-settings',
  '/settings/reward-point-setting': '/reward-point-setting',
  '/setting/reward-point-setting': '/reward-point-setting',
  '/settings/sms-setting': '/sms-setting',
  '/setting/sms_setting': '/sms-setting',
};

/** Routes not in DB menu but required for CRUD navigation */
export const EXTRA_SPA_ROUTES = [
  '/purchases/create',
  '/purchases/:id/edit',
  '/products/:id/edit',
  '/product-list/:id/edit',
  '/qty_adjustment/:id/edit',
  '/damage-stock/create',
  '/damage-stock/:id/edit',
  '/stock-count/:id/qty_adjustment',
  '/pos/:draftId',
  '/discount-plans/create',
  '/discount-plans/:id/edit',
  '/discounts/create',
  '/discounts/:id/edit',
  '/employees/create',
  '/user/profile/:id',
  '/return-purchase/create',
  '/return-purchase/:id/edit',
  '/quotations/create',
  '/quotations/:id/edit',
  '/quotations/:id/create_sale',
  '/quotations/:id/create_purchase',
  '/sales/create',
  '/installment-plans/:id',
  '/installmentplan/:id',
  '/transfers/:id/edit',
  '/payroll/generate',
  '/hrm/payroll/generate',
  '/my-transactions/:year/:month',
  '/holidays/my-holiday/:year/:month',
  '/manufacturing/productions/create',
  '/manufacturing/recipes/create',
  '/manufacturing/recipes/:id/edit',
  '/products/history',
  '/report/daily_sale/:year/:month',
  '/report/monthly_sale/:year',
  '/report/daily_purchase/:year/:month',
  '/report/monthly_purchase/:year',
];

const DATED_REPORT_REDIRECTS = {
  '/report/daily_sale': () => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    return `/report/daily_sale/${y}/${m}`;
  },
  '/report/monthly_sale': () => {
    const y = new Date().getFullYear();
    return `/report/monthly_sale/${y}`;
  },
  '/report/daily_purchase': () => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    return `/report/daily_purchase/${y}/${m}`;
  },
  '/report/monthly_purchase': () => {
    const y = new Date().getFullYear();
    return `/report/monthly_purchase/${y}`;
  },
};

const DATED_REPORT_PARAMETRIC = [
  [/^\/report\/daily_sale\/\d+\/\d+$/, '/report/daily_sale/:year/:month'],
  [/^\/report\/monthly_sale\/\d+$/, '/report/monthly_sale/:year'],
  [/^\/report\/daily_purchase\/\d+\/\d+$/, '/report/daily_purchase/:year/:month'],
  [/^\/report\/monthly_purchase\/\d+$/, '/report/monthly_purchase/:year'],
];

export function parametricReportPath(pathURL) {
  if (!pathURL) return pathURL;
  for (const [pattern, parametric] of DATED_REPORT_PARAMETRIC) {
    if (pattern.test(pathURL)) return parametric;
  }
  return pathURL;
}

export function normalizeMenuPath(path, label = '') {
  if (!path) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/products' && label && !/list/i.test(label)) {
    return '/products/create';
  }
  // Purchase return list (old Blade: return-purchase.index) — never open create form from list menu
  if (label && /purchase return|return list/i.test(label) && !/add/i.test(label)) {
    if (
      normalized === '/return-purchase/create'
      || normalized === '/return-purchase-create'
      || normalized.endsWith('/return/create')
    ) {
      return '/return-purchase';
    }
  }
  // Quotation list — never open create form from list menu
  if (label && /quotation list/i.test(label) && !/add/i.test(label)) {
    if (normalized === '/quotations/create') {
      return '/quotations';
    }
  }
  let resolved = MENU_PATH_ALIASES[normalized] ?? normalized;
  if (DATED_REPORT_REDIRECTS[resolved]) {
    resolved = DATED_REPORT_REDIRECTS[resolved]();
  }
  return parametricReportPath(resolved);
}

/** @type {Record<string, React.ComponentType>} */
export const ROUTE_REGISTRY = {
  '/home': Dashboard,
  '/dashboard': Dashboard,
  '/category': CategoryManager,
  '/brand': BrandManager,
  '/unit': UnitManager,
  '/units': UnitManager, // DB menu route (menus table sub_menu_route)
  '/products': ProductList,
  '/product-list': ProductList, // DB menu route (menus.sub_menu_route)
  '/products/create': ProductCreate,
  '/add-product': ProductCreate,
  '/products/:id/edit': ProductCreate,
  '/product-list/:id/edit': ProductCreate,
  '/products/print_barcode': PrintBarcode,
  '/products/history': BackendProductHistory,
  '/qty_adjustment': AdjustmentList,
  '/qty_adjustment/create': AdjustmentCreate,
  '/qty_adjustment/:id/edit': AdjustmentCreate,
  '/add-adjustment': AdjustmentCreate,
  '/product/add-adjustment': AdjustmentCreate,
  '/product/adjustment-list': AdjustmentList,
  '/adjustment-list': AdjustmentList,
  '/damage-stock': DamageStockList,
  '/damage-stock/create': DamageStockForm,
  '/damage-stock/:id/edit': DamageStockForm,
  '/damage-list': DamageStockList,
  '/add-damage-stock': DamageStockForm,
  '/stock-count': StockCountList,
  '/stock-count/:id/qty_adjustment': StockCountQtyAdjustment,
  '/product/stock-count': StockCountList,
  '/stock-counts': StockCountList,
  '/purchases': PurchaseList,
  '/purchase/list': PurchaseList,
  '/purchase-list': PurchaseList,
  '/purchases/create': PurchaseForm,
  '/add-purchase': PurchaseForm,
  '/purchase/create': PurchaseForm,
  '/purchase/add': PurchaseForm,
  '/purchases/:id/edit': PurchaseForm,
  '/purchases/purchase_by_csv': PurchaseImport,
  '/purchases/deleted_data': PurchaseDeletedData,
  '/sales': SalesList,
  '/sales-list': SalesList,
  '/sale-list': SalesList,
  '/sale/list': SalesList,
  '/sales/create': SaleForm,
  '/sale/add': SaleForm,
  '/add-sale': SaleForm,
  '/sale/create': SaleForm,
  '/pos': PosPage,
  '/pos/:draftId': PosPage,
  '/challans': ChallanList,
  '/challan-list': ChallanList,
  '/challans-list': ChallanList,
  '/packing-slips': PackingSlipList,
  '/sale/packing-slip-list': PackingSlipList,
  '/packing-slip-list': PackingSlipList,
  '/packing_slips': PackingSlipList,
  '/deliveries': DeliveryList,
  '/delivery-list': DeliveryList,
  '/delivery': DeliveryList,
  '/gift-cards': GiftCardList,
  '/gift-card-list': GiftCardList,
  '/gift_cards': GiftCardList,
  '/coupons': CouponList,
  '/coupon-list': CouponList,
  '/couriers': CourierList,
  '/courier-list': CourierList,
  '/return-sale': ReturnSaleList,
  '/sale-return-list': ReturnSaleList,
  '/exchange': ExchangeList,
  '/sale/exchange': ExchangeList,
  '/sale-exchange': ExchangeList,
  '/installment-plans': InstallmentPlanList,
  '/installment-list': InstallmentPlanList,
  '/sale/installment-list': InstallmentPlanList,
  '/return-purchase': ReturnPurchaseList,
  '/purchase/return-list': ReturnPurchaseList,
  '/return-purchase-create': ReturnPurchaseList,
  '/return-purchase/create': ReturnPurchaseCreate,
  '/quotations': QuotationList,
  '/quotation-list': QuotationList,
  '/quotation/list': QuotationList,
  '/quotations/create': QuotationForm,
  '/quotation/add': QuotationForm,
  '/add-quotation': QuotationForm,
  '/quotation/create': QuotationForm,
  '/quotations/:id/edit': QuotationForm,
  '/quotations/:id/create_sale': QuotationCreateSale,
  '/quotations/:id/create_purchase': QuotationCreatePurchase,
  '/transfers': TransferList,
  '/transfer-list': TransferList,
  '/transfer/list': TransferList,
  '/transfers/create': TransferForm,
  '/transfer/add': TransferForm,
  '/add-transfer': TransferForm,
  '/transfer/create': TransferForm,
  '/transfers/transfer_by_csv': TransferImport,
  '/transfer/import-csv': TransferImport,
  '/expenses': ExpenseList,
  '/expense/list': ExpenseList,
  '/expense-list': ExpenseList,
  '/expense/add': ExpenseList,
  '/add-expense': ExpenseList,
  '/expense_categories': ExpenseCategoryManager,
  '/expense/categories': ExpenseCategoryManager,
  '/expense-categories': ExpenseCategoryManager,
  '/expense/category': ExpenseCategoryManager,
  '/expense-category': ExpenseCategoryManager,
  '/income_categories': IncomeCategoryManager,
  '/income/categories': IncomeCategoryManager,
  '/income-categories': IncomeCategoryManager,
  '/income/category': IncomeCategoryManager,
  '/income-category': IncomeCategoryManager,
  '/incomes': IncomeList,
  '/income/list': IncomeList,
  '/income-list': IncomeList,
  '/income/add': IncomeList,
  '/add-income': IncomeList,
  '/accounts': AccountList,
  '/account-list': AccountList,
  '/accounting/account-list': AccountList,
  '/accounting/add-account': AccountList,
  '/add-account': AccountList,
  '/money-transfers': MoneyTransferList,
  '/money-transfer': MoneyTransferList,
  '/money_transfers': MoneyTransferList,
  '/accounting/money-transfer': MoneyTransferList,
  '/balancesheet': BalanceSheet,
  '/balance-sheet': BalanceSheet,
  '/balance_sheet': BalanceSheet,
  '/accounting/balance-sheet': BalanceSheet,
  '/accounts/balancesheet': BalanceSheet,
  '/account-statement': AccountStatement,
  '/accounting/account-statement': AccountStatement,
  '/account_statement': AccountStatement,
  '/customer': CustomerManager,
  '/customer-list': CustomerManager,
  '/people/customer-list': CustomerManager,
  '/customers': CustomerManager,
  '/supplier': SupplierManager,
  '/supplier-list': SupplierManager,
  '/people/supplier-list': SupplierManager,
  '/suppliers': SupplierManager,
  '/customer_group': CustomerGroup,
  '/settings/customer-group': CustomerGroup,
  '/customer-group': CustomerGroup,
  '/warehouse': WarehouseManager,
  '/terminals': TerminalManager,
  '/pos-terminals': TerminalManager,
  '/printers': PrinterManager,
  '/receipt-printers': PrinterManager,
  '/setting/invoice': InvoiceSettingManager,
  '/invoice-settings': InvoiceSettingManager,
  '/role': RolePermissionManager,
  '/settings/role-permission': RolePermissionManager,
  '/smstemplates': SmsTemplateManager,
  '/settings/sms-template': SmsTemplateManager,
  '/sms-template': SmsTemplateManager,
  '/discount-plans': DiscountPlanList,
  '/settings/discount-plan': DiscountPlanList,
  '/discount-plan': DiscountPlanList,
  '/discount-plans/create': DiscountPlanForm,
  '/discount-plans/:id/edit': DiscountPlanForm,
  '/discounts': DiscountList,
  '/settings/discount': DiscountList,
  '/discount': DiscountList,
  '/discounts/create': DiscountForm,
  '/discounts/:id/edit': DiscountForm,
  '/notifications': NotificationList,
  '/settings/all-notification': NotificationList,
  '/all-notification': NotificationList,
  '/tables': TableManager,
  '/settings/tables': TableManager,
  '/currency': CurrencyManager,
  '/settings/currency': CurrencyManager,
  '/tax': TaxManager,
  '/settings/tax': TaxManager,
  '/user-profile': UserProfile,
  '/settings/user-profile': UserProfile,
  '/user/profile/:id': UserProfile,
  '/my-transactions/:year/:month': BackendUserMyTransaction,
  '/holidays/my-holiday/:year/:month': BackendHolidayMyHoliday,
  '/general-settings': GeneralSettingManager,
  '/settings/general-setting': GeneralSettingManager,
  '/setting/general_setting': GeneralSettingManager,
  '/reward-point-setting': RewardPointSettingManager,
  '/settings/reward-point-setting': RewardPointSettingManager,
  '/setting/reward-point-setting': RewardPointSettingManager,
  '/sms-setting': SmsSettingManager,
  '/settings/sms-setting': SmsSettingManager,
  '/setting/sms_setting': SmsSettingManager,
  '/setting/pos_setting': PosSettingManager,
  '/settings/pos-settings': PosSettingManager,
  '/pos-settings': PosSettingManager,
  '/setting/hrm_setting': HrmSettingManager,
  '/settings/hrm-setting': HrmSettingManager,
  '/barcodes': BarcodeSettingManager,
  '/settings/barcode-settings': BarcodeSettingManager,
  '/barcode-settings': BarcodeSettingManager,
  '/languages': LanguageManager,
  '/settings/languages': LanguageManager,
  '/departments': DepartmentManager,
  '/hrm/department': DepartmentManager,
  '/designations': DesignationManager,
  '/hrm/designation': DesignationManager,
  '/shift': ShiftManager,
  '/hrm/shift': ShiftManager,
  '/employees': EmployeeManager,
  '/hrm/employee': EmployeeManager,
  '/employees/create': EmployeeCreate,
  '/user': UserManager,
  '/user-list': UserManager,
  '/people/user-list': UserManager,
  '/users': UserManager,
  '/sale-agents': SaleAgentManager,
  '/people/sale-agents': SaleAgentManager,
  '/biller': BillerManager,
  '/biller-list': BillerManager,
  '/people/biller-list': BillerManager,
  '/billers': BillerManager,
  '/attendance': AttendanceManager,
  '/hrm/attendance': AttendanceManager,
  '/holidays': HolidayManager,
  '/hrm/holiday': HolidayManager,
  '/overtime': OvertimeManager,
  '/hrm/overtime': OvertimeManager,
  '/leave-type': LeaveTypeManager,
  '/hrm/leave-type': LeaveTypeManager,
  '/leave-types': LeaveTypeManager,
  '/leave': LeaveManager,
  '/hrm/leaves': LeaveManager,
  '/leaves': LeaveManager,
  '/payroll': PayrollManager,
  '/hrm/payroll': PayrollManager,
  '/payrolls': PayrollManager,
  '/payroll/generate': PayrollGenerate,
  '/hrm/payroll/generate': PayrollGenerate,
  '/cash-register': CashRegisterIndex,
  '/setting/activity-log': ActivityLog,
  '/whatsapp/settings': WhatsappSettings,
  '/whatsapp/templates': WhatsappTemplates,
  '/whatsapp/send': WhatsappSend,
  '/bookings/calendar': BookingCalendar,
  '/manufacturing/productions': ProductionList,
  '/manufacturing/productions/create': ProductionCreate,
  '/manufacturing/recipes': RecipeList,
  '/manufacturing/recipes/create': RecipeForm,
  '/manufacturing/recipes/:id/edit': RecipeForm,
  '/custom-fields': PlaceholderPage,
  '/backup': PlaceholderPage,
  '/setting/createsms': PlaceholderPage,
  '/report/profit-loss': ProfitLoss,
  '/report/best_seller': BestSeller,
  '/report/product_report': ProductReport,
  '/report/stock': StockReport,
  '/report/daily_sale/:year/:month': DailySaleReport,
  '/report/monthly_sale/:year': MonthlySaleReport,
  '/report/daily_purchase/:year/:month': DailyPurchaseReport,
  '/report/monthly_purchase/:year': MonthlyPurchaseReport,
  '/report/sale_report': SaleReport,
  '/report/challan-report': ChallanReport,
  '/report/sale-report-chart': SaleReportChart,
  '/report/payment_report_by_date': PaymentReport,
  '/report/purchase': PurchaseReport,
  '/report/customer_report': CustomerReport,
  '/report/customer-group': CustomerGroupReport,
  '/report/customer-due-report': DueReport,
  '/report/supplier': SupplierReport,
  '/report/supplier-due-report': SupplierDueReport,
  '/report/warehouse_report': WarehouseReport,
  '/report/warehouse_stock': WarehouseStockReport,
  '/report/product-expiry': ProductExpiryReport,
  '/report/product_quantity_alert': QtyAlertReport,
  '/report/daily-sale-objective': DailySaleObjectiveReport,
  '/report/user_report': UserReport,
  '/report/biller_report': BillerReport,
};

export function resolveRouteComponent(pathURL) {
  if (!pathURL) return PlaceholderPage;
  const normalized = normalizeMenuPath(pathURL);
  if (ROUTE_REGISTRY[normalized]) return ROUTE_REGISTRY[normalized];

  const datedReportRoutes = [
    [/^\/report\/daily_sale\/\d+\/\d+$/, '/report/daily_sale/:year/:month'],
    [/^\/report\/monthly_sale\/\d+$/, '/report/monthly_sale/:year'],
    [/^\/report\/daily_purchase\/\d+\/\d+$/, '/report/daily_purchase/:year/:month'],
    [/^\/report\/monthly_purchase\/\d+$/, '/report/monthly_purchase/:year'],
  ];
  for (const [pattern, registryKey] of datedReportRoutes) {
    if (pattern.test(normalized) && ROUTE_REGISTRY[registryKey]) {
      return ROUTE_REGISTRY[registryKey];
    }
  }

  for (const [pattern, component] of Object.entries(ROUTE_REGISTRY)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(normalized)) return component;
  }

  return PlaceholderPage;
}
