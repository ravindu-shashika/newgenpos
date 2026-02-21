import {
  Dashboard,
  Category,
  Units,
  Customers,
  Vendors,
  Employee,
  Stores,
  Design,
  ArticleSize,
  TagCreation,
  PurchaseOrders,
  Purchases,
  Invoice,
  SalesOrder,
  AdvancePayment,
  CustomerPayment,
  SupplierPayment,
  AdvanceRefund,
  TagChange,
  DefaultAccount,
  SalesReturn,
  PurchaseReturn,
  OpeningStock,
  Currency,
  JewellerySearch,
  TagTransfer,
  Metal,
  Touch,
  Color,
  Stone,
  PaymentVoucher,
  ReceiptForm,
  ReportView,
  CustomerRepair,
  IssueJewelleryForRepair,
  RecivedFromMaker,
  IssueForCustomer,
  ForfeitPurchase,
  ResellRepair,
  GoldSmithGoldIssue,
  GoldSmithGoldRecived,
  GoldMelt,
  CustomerStatement,
  RolePermissions,
  ItemCondition,
  StampFees,
  StampFeesSingle,

  InterestRates,
  Branches,
  RegionalOffices,
  BillTypes,
  BillTypesChange,
  LoanPeriods,
  Loans,
  ReLoans,
  PartPayments,
  Redemptions,
  Expenses,
  Incomes,
  CashFundTransfers,
  IssueCheques,
  ReceiveCheques,
  AccountCategories,
  AccountGroups,
  Accounts,
  AccountList,
  BankAccounts,
  BankEntry,
  BankReconciliation,
  DebitNote,
  GeneralReceipt,
  GeneralVoucher,
  JournalEntry,
  ReminderLetters,
  ReminderLetterPeriods,
  DocumentFees,
  Messages,
  Cancellations,
  BillTypeDetails,
  BillCountDetails,
  IntRateDetails,
  // AdditionalDiscounts,
  GemPawning,
  Forfeits,
  PendingForfeits,
  BillChange,
  ExpenseTypes,
  MarkBill, 
  Profile,
  UpdateProfile,
  Officers,
  PayAmountChange,
  PawningRejectSetup,
  Backdate,
  FindFormSeparateWindow,
  Role,
  TransactionLog,
  PendingRealizeCheques,
  ReturnCheques, 
  FindCheques,
  CustomerLimit,
  Brand,
  Products,
  Printer,
  InvoiceSetting,
  SmsTemplate,
  CreateSms,
  GeneralSettings,
  RewardPointSetting,
  PosSetting,
  BarcodeSetting,
  DiscountPlan,
  Discount,
  Warehouse,
  CustomerGroup,
  Tax,
  MoneyTransfer,
  BalanceSheet,
  AccountStatement,
  CustomerList,
  SupplierList,
  BillerList,
  IncomeList,
  ExpenseList,
  TransferList,
  PurchaseCreate,
  ReturnPurchaseCreate,
  AdjustmentList,
  AdjustmentCreate,
  AdjustmentEdit,
  QuotationList,
  CouponList,
  GiftCardList,
  CourierList,
  DeliveryList,
  Pos,
  SalesList,
  SaleReturnList,
  UserList,
  SaleAgentList,

} from '../views';

import { Users, Roles } from '../auth';

import { api, cookie } from '../services';

const componentsList = [
  {
    name: 'Dashboard',
    route: '/home',
    value: Dashboard,
  },
  {
    name: 'Category',
    route: '/category',
    value: Category,
  },
  {
    name: 'Brand',
    route: '/brand',
    value: Brand,
  },
  {
    name: 'Products',
    route: '/products',
    value: Products,
  },
  {
    name: 'Printer',
    route: '/receipt-printers',
    value: Printer,
  },
  {
    name: 'Invoice Setting',
    route: '/invoice-settings',
    value: InvoiceSetting,
  },
  {
    name: 'SMS Template',
    route: '/sms-template',
    value: SmsTemplate,
  },
  {
    name: 'Create SMS',
    route: '/create-sms',
    value: CreateSms,
  },
  {
    name: 'General Settings',
    route: '/general-settings',
    value: GeneralSettings,
  },
  {
    name: 'Reward Point Setting',
    route: '/reward-point-setting',
    value: RewardPointSetting,
  },
  {
    name: 'POS Setting',
    route: '/pos-settings',
    value: PosSetting,
  },
  {
    name: 'Barcode Setting',
    route: '/barcode-settings',
    value: BarcodeSetting,
  },
  {
    name: 'Discount Plan',
    route: '/discount-plan',
    value: DiscountPlan,
  },
  {
    name: 'Discount',
    route: '/discount',
    value: Discount,
  },
  {
    name: 'Warehouse',
    route: '/warehouse',
    value: Warehouse,
  },
  {
    name: 'Customer Group',
    route: '/customer-group',
    value: CustomerGroup,
  },
  {
    name: 'Customer List',
    route: '/customer-list',
    value: CustomerList,
  },
  {
    name: 'Supplier List',
    route: '/supplier-list',
    value: SupplierList,
  },
  {
    name: 'Biller List',
    route: '/biller-list',
    value: BillerList,
  },
  {
    name: 'Income List',
    route: '/income-list',
    value: IncomeList,
  },
  {
    name: 'Expense List',
    route: '/expense-list',
    value: ExpenseList,
  },
  {
    name: 'Transfer List',
    route: '/transfer-list',
    value: TransferList,
  },
  {
    name: 'Add Purchase',
    route: '/purchase-create',
    value: PurchaseCreate,
  },
  {
    name: 'Update Purchase',
    route: '/purchase-create/:id',
    value: PurchaseCreate,
  },
  {
    name: 'Add Return',
    route: '/return-purchase-create/:purchaseId',
    value: ReturnPurchaseCreate,
  },
  {
    name: 'Adjustment List',
    route: '/adjustment-list',
    value: AdjustmentList,
  },
  {
    name: 'Add Adjustment',
    route: '/adjustment-create',
    value: AdjustmentCreate,
  },
  {
    name: 'Edit Adjustment',
    route: '/adjustment-edit/:id',
    value: AdjustmentEdit,
  },
  {
    name: 'Quotation List',
    route: '/quotation-list',
    value: QuotationList,
  },
  {
    name: 'Coupon List',
    route: '/coupon-list',
    value: CouponList,
  },
  {
    name: 'Gift Card List',
    route: '/gift-card-list',
    value: GiftCardList,
  },
  {
    name: 'Courier List',
    route: '/courier-list',
    value: CourierList,
  },
  {
    name: 'Delivery List',
    route: '/delivery-list',
    value: DeliveryList,
  },
  {
    name: 'POS',
    route: '/pos',
    value: Pos,
  },
  {
    name: 'Sales List',
    route: '/sales-list',
    value: SalesList,
  },
  {
    name: 'Sale Return List',
    route: '/sale-return-list',
    value: SaleReturnList,
  },
  {
    name: 'User List',
    route: '/user-list',
    value: UserList,
  },
  {
    name: 'Sale Agent',
    route: '/sale-agents',
    value: SaleAgentList,
  },
  {
    name: 'Tax',
    route: '/tax',
    value: Tax,
  },
  {
    name: 'Customers',
    route: '/customers',
    value: Customers,
  },
  {
    name: 'Units',
    route: '/units',
    value: Units,
  },
  {
    name: 'Currency',
    route: '/currencies',
    value: Currency,
  },
  {
    name: 'Expenses',
    route: '/expenses',
    value: Expenses,
  },
  // {
  //   name: 'CashFundTransfers',
  //   route: '/cash-fund-transfers',
  //   value: CashFundTransfers,
  // },
  // {
  //   name: 'IssueCheques',
  //   route: '/issue-cheques',
  //   value: IssueCheques,
  // },
  // {
  //   name: 'ReceiveCheques',
  //   route: '/receive-cheques',
  //   value: ReceiveCheques,
  // },
  // {
  //   name: 'Users',
  //   route: '/users',
  //   value: Users,
  // },
  {
    name: 'Roles',
    route: '/roles',
    value: Roles,
  },
  // {
  //   name: 'GeneralReceipt',
  //   route: '/general-receipt',
  //   value: GeneralReceipt,
  // },
  // {
  //   name: 'GeneralVoucher',
  //   route: '/general-voucher',
  //   value: GeneralVoucher,
  // },
  {
    name: 'DefaultAccount',
    route: '/default-accounts',
    value: DefaultAccount,
  },
  // {
  //   name: 'Vendors',
  //   route: '/vendors',
  //   value: Vendors,
  // },
  // {
  //   name: 'Employee',
  //   route: '/employees',
  //   value: Employee,
  // },
  // {
  //   name: 'Stores',
  //   route: '/stores',
  //   value: Stores,
  // },
  // {
  //   name: 'Design',
  //   route: '/design',
  //   value: Design,
  // },
  // {
  //   name: 'ArticleSize',
  //   route: '/article-sizes',
  //   value: ArticleSize,
  // },
  // {
  //   name: 'PurchaseOrders',
  //   route: '/purchase-orders',
  //   value: PurchaseOrders,
  // },
  // {
  //   name: 'Purchases',
  //   route: '/purchases',
  //   value: Purchases,
  // },
  {
    name: 'Purchases',
    route: '/purchases/:nno/:bc_no',
    value: Purchases,
  },
  {
    name: 'TagCreation',
    route: '/tag-creations',
    value: TagCreation,
  },

  {
    name: 'SalesOrder',
    route: '/sales-orders',
    value: SalesOrder,
  },

  {
    name: 'Invoice',
    route: '/invoices',
    value: Invoice,
  },

  {
    name: 'AdvancePayment',
    route: '/advance-payments',
    value: AdvancePayment,
  },
  {
    name: 'CashRefund',
    route: '/advance-refunds',
    value: AdvanceRefund,
  },
  {
    name: 'CustomerPayment',
    route: '/customer-payments',
    value: CustomerPayment,
  },
  {
    name: 'SupplierPayment',
    route: '/supplier-payments',
    value: SupplierPayment,
  },

  {
    name: 'TagChange',
    route: '/tag-changes',
    value: TagChange,
  },
  {
    name: 'SalesReturn',
    route: '/sales-returns',
    value: SalesReturn,
  },
  {
    name: 'PurchaseReturn',
    route: '/purchase-returns',
    value: PurchaseReturn,
  },
  {
    name: 'OpeningStock',
    route: '/opening-stock',
    value: OpeningStock,
  },
  {
    name: 'JewellerySearch',
    route: '/jewellery-search',
    value: JewellerySearch,
  },

  {
    name: 'TagTransfer',
    route: '/tag-transfer',
    value: TagTransfer,
  },
  {
    name: 'Metal',
    route: '/metal',
    value: Metal,
  },
  {
    name: 'Touch',
    route: '/touch',
    value: Touch,
  },
  {
    name: 'Color',
    route: '/color',
    value: Color,
  },
  {
    name: 'Stone',
    route: '/stone',
    value: Stone,
  },
  {
    name: 'PaymentVoucher',
    route: '/payment-voucher/:nno/:bc_no',
    value: PaymentVoucher,
  },
  {
    name: 'ReceiptForm',
    route: '/receipt/:nno/:bc_no',
    value: ReceiptForm,
  },
  {
    name: 'CustomerRepair',
    route: '/customer-repair',
    value: CustomerRepair,
  },
  {
    name: 'IssueJewelleryForRepair',
    route: '/issue-jewellery-repair',
    value: IssueJewelleryForRepair,
  },
  {
    name: 'RecivedFromMaker',
    route: '/recived-from-maker',
    value: RecivedFromMaker,
  },
  {
    name: 'IssueForCustomer',
    route: '/issue-for-customer',
    value: IssueForCustomer,
  },
  {
    name: 'ForfeitPurchase',
    route: '/forfeit-purchase',
    value: ForfeitPurchase,
  },
  {
    name: 'ResellRepair',
    route: '/resell-repair',
    value: ResellRepair,
  },
  {
    name: 'GoldSmithGoldIssue',
    route: '/supplier-issue-gold',
    value: GoldSmithGoldIssue,
  },
  {
    name: 'GoldSmithGoldRecived',
    route: '/supplier-recived-gold',
    value: GoldSmithGoldRecived,
  },
  {
    name: 'GoldMelt',
    route: '/gold-melt',
    value: GoldMelt,
  },
  {
    name: 'CustomerStatement',
    route: '/customer-statement',
    value: CustomerStatement,
  },

  {
    name: 'RolePermissions',
    route: '/role-permissions',
    value: RolePermissions,
  },
  {
    name: 'Branches',
    value: Branches,
  },
  {
    name: 'RegionalOffices',
    value: RegionalOffices,
  },
  {
    name: 'StampFees',
    value: StampFees,
  },
  {
    name: 'StampFeesSingle',
    value: StampFeesSingle,
  },

  {
    name: 'LoanPeriods',
    value: LoanPeriods,
  },
 
  {
    name: 'InterestRates',
    value: InterestRates,
  },
  {
    name: 'BillTypes',
    value: BillTypes,
  },
  {
    name: 'BillTypesChange',
    value: BillTypesChange,
  },
  {
    name: 'Expenses',
    value: Expenses,
  },
  {
    name: 'Incomes',
    value: Incomes,
  },
  {
    name: 'Users',
    value: Users,
  },
  // {
  //   name: 'Roles',
  //   value: Roles,
  // },
  {
    name: 'AccountCategories',
    value: AccountCategories,
  },
  {
    name: 'AccountGroups',
    value: AccountGroups,
  },
  {
    name: 'Accounts',
    value: Accounts,
  },
  {
    name: 'Account List',
    route: '/account-list',
    value: AccountList,
  },
  {
    name: 'Money Transfer',
    route: '/money-transfer',
    value: MoneyTransfer,
  },
  {
    name: 'Balance Sheet',
    route: '/balance-sheet',
    value: BalanceSheet,
  },
  {
    name: 'Account Statement',
    route: '/account-statement',
    value: AccountStatement,
  },
  {
    name: 'BankAccounts',
    value: BankAccounts,
  },
  {
    name: 'BankEntry',
    value: BankEntry,
  },
  {
    name: 'DebitNote',
    value: DebitNote,
  },
  {
    name: 'BankReconciliation',
    value: BankReconciliation,
  },
  {
    name: 'GeneralReceipt',
    value: GeneralReceipt,
  },
  {
    name: 'GeneralVoucher',
    value: GeneralVoucher,
  },
  {
    name: 'JournalEntry',
    value: JournalEntry,
  },
  {
    name: 'ReminderLetters',
    value: ReminderLetters,
  },
  {
    name: 'ReminderLetterPeriods',
    value: ReminderLetterPeriods,
  },
  {
    name: 'DocumentFees',
    value: DocumentFees,
  },
  {
    name: 'Messages',
    value: Messages,
  },
  {
    name: 'Cancellations',
    value: Cancellations,
  },
  {
    name: 'BillTypeDetails',
    value: BillTypeDetails,
  },
  {
    name: 'BillCountDetails',
    value: BillCountDetails,
  },
  {
    name: 'IntRateDetails',
    value: IntRateDetails,
  },
  // {
  //   name: 'AdditionalDiscounts', 
  //   value: AdditionalDiscounts,
  // },
  {
    name: 'GemPawning',
    value: GemPawning,
  },
  {
    name: 'Forfeits',
    value: Forfeits,
  },
  {
    name: 'PendingForfeits',
    value: PendingForfeits,
  },
  {
    name: 'BillChange',
    value: BillChange,
  },
  {
    name: 'MarkBill',
    value: MarkBill,
  },
  {
    name: 'Profile',
    value: Profile,
  },
  {
    name: 'Update Profile',
    route: '/user-profile',
    value: UpdateProfile,
  },
  // {
  //   name: 'RolePermissions',
  //   value: RolePermissions,
  // },
  {
    name: 'Officers',
    value: Officers,
  },
  {
    name: 'ExpenseTypes',
    value: ExpenseTypes,
  },
  {
    name: 'PayAmountChange',
    value: PayAmountChange,
  },
  {
    name: 'PawningRejectSetup',
    value: PawningRejectSetup,
  },
  {
    name: 'Backdate',
    value: Backdate,
  },
  {
    name: 'FindFormSeparateWindow',
    value: FindFormSeparateWindow,
  },
  {
    name: 'Role',
    value: Role,
  },
  {
    name: 'TransactionLog',
    value: TransactionLog,
  },
  {
    name: 'PendingRealizeCheques',
    value: PendingRealizeCheques,
  },
  {
    name: 'ReturnCheques',
    value: ReturnCheques,
  },
  // {
  //   name: 'PcRegister',
  //   value: PcRegister,
  // },
  // {
  //   name: 'UserAccess',
  //   value: UserAccess,
  // },
  // {
  //   name: 'UserAccessMenu',
  //   value: UserAccessMenu,
  // },
  {
    name: 'FindCheques',
    value: FindCheques,
  },
  {
    name: 'CustomerLimit',
    value: CustomerLimit,
  },
 
];

let routesList = [];

/**
 * Resolve React component from route path or controller name using componentsList.
 */
function resolveComponent(pathURL, controllerOrName) {
  if (pathURL) {
    const normalized = pathURL.startsWith('/') ? pathURL : '/' + pathURL;
    const byRoute = componentsList.find((c) => {
      if (!c.route) return false;
      const base = c.route.split(':')[0];
      return c.route === pathURL || c.route === normalized || pathURL === c.route || pathURL.startsWith(base) || normalized.startsWith(base);
    });
    if (byRoute) return byRoute.value;
  }
  if (controllerOrName) {
    const byName = componentsList.find(
      (c) =>
        c.name === controllerOrName ||
        String(c.name).toLowerCase() === String(controllerOrName).toLowerCase()
    );
    if (byName) return byName.value;
  }
  return null;
}

/**
 * Flatten menu tree (from buildMenuTree) to flat route list for SideNav.
 * Each leaf: sub_menu + sub_menu_route, or second_sub_menu + second_sub_menu_route.
 * @param {Array} menuTree - from buildMenuTree(menuData, permissions)
 * @returns {Array<{ name, pathURL, componentName, group }>}
 */
export function flattenMenuTreeToRoutes(menuTree) {
  if (!Array.isArray(menuTree) || menuTree.length === 0) return [];
  const out = [];
  for (const main of menuTree) {
    const group = main.main_menu || 'N/A';
    if (!main.children || main.children.length === 0) continue;
    for (const sub of main.children) {
      if (sub.children && sub.children.length > 0) {
        for (const second of sub.children) {
          const pathURL = second.second_sub_menu_route || second.route || null;
          if (!pathURL) continue;
          const comp = resolveComponent(pathURL, second.controller);
          if (!comp) continue;
          out.push({
            name: second.second_sub_menu || second.sub_menu,
            pathURL,
            componentName: comp,
            group,
          });
        }
      } else {
        const pathURL = sub.sub_menu_route || null;
        if (!pathURL) continue;
        const comp = resolveComponent(pathURL, null);
        if (!comp) continue;
        out.push({
          name: sub.sub_menu,
          pathURL,
          componentName: comp,
          group,
        });
      }
    }
  }
  return out;
}

export function buildRoutesFromMenuItems(menuItems) {
  if (!Array.isArray(menuItems) || menuItems.length === 0) return [];
  const out = [];
  for (const item of menuItems) {
    const compName =
      item.component ?? item.controller ?? item.name ?? item.module_name ?? item.sub_menu;
    if (!compName) continue;
    const comp = componentsList.find(
      (c) => c.name === compName || String(c.name).toLowerCase() === String(compName).toLowerCase()
    );
    if (!comp) continue;
    const pathURL =
      item.route ??
      item.path ??
      item.module_path ??
      item.sub_menu_route ??
      comp.route;
    if (!pathURL) continue;
    const name =
      item.name ?? item.module_name ?? item.sub_menu ?? item.main_menu ?? comp.name;
    const group =
      item.group ??
      item.module_category ??
      item.main_menu ??
      'N/A';
    const order = item.order ?? item.order_no ?? 999;
    out.push({
      name,
      pathURL,
      componentName: comp.value,
      group: group ?? 'N/A',
      order,
      level: item.level ?? 1,
    });
  }
  out.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return out;
}

class Routes {
  /**
   * Legacy: returns all components as routes (no API). Prefer using
   * roleStore.fetchMenuByRole() + buildRoutesFromMenuItems(menus) for role-based menu.
   */
  async routes() {
    routesList = [];
    componentsList.forEach((component) => {
      if (component.route) {
        routesList.push({
          name: component.name,
          pathURL: component.route,
          componentName: component.value,
          group: 'N/A',
        });
      }
    });
    return Promise.resolve(routesList);
  }
}

export default new Routes();
