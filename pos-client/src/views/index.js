export { default as Dashboard } from './Dashboard';
export { default as Pos } from './Pos';

/** -------------------------------MASTER------------------------------- */
export { default as Products } from './master/items/products';
export { default as Category } from './master/items/Category';
export { default as Brand } from './master/items/Brand';
export { default as Printer } from './master/Printer';
export { default as InvoiceSetting } from './master/InvoiceSetting';
export { default as SmsTemplate } from './master/SmsTemplate';
export { default as CreateSms } from './master/CreateSms';
export { default as GeneralSettings } from './master/GeneralSettings';
export { default as RewardPointSetting } from './master/RewardPointSetting';
export { default as PosSetting } from './master/PosSetting';
export { default as BarcodeSetting } from './master/BarcodeSetting';
export { default as DiscountPlan } from './master/DiscountPlan';
export { default as Discount } from './master/Discount';
export { default as Warehouse } from './master/Warehouse';
export { default as CustomerGroup } from './master/CustomerGroup';
export { default as Tax } from './master/Tax';
export { default as MoneyTransfer } from './master/MoneyTransfer';
export { default as BalanceSheet } from './master/BalanceSheet';
export { default as AccountStatement } from './master/AccountStatement';
export { default as CustomerList } from './master/CustomerList';
export { default as SupplierList } from './master/SupplierList';
export { default as BillerList } from './master/BillerList';
export { default as IncomeList } from './master/IncomeList';
export { default as ExpenseList } from './master/ExpenseList';
export { default as TransferList } from './master/TransferList';
export { default as PurchaseCreate } from './master/PurchaseCreate';
export { default as AdjustmentList } from './master/AdjustmentList';
export { default as AdjustmentCreate } from './master/AdjustmentCreate';
export { default as AdjustmentEdit } from './master/AdjustmentEdit';
export { default as ReturnPurchaseCreate } from './master/ReturnPurchaseCreate';
export { default as QuotationList } from './master/QuotationList';
export { default as CouponList } from './master/CouponList';
export { default as GiftCardList } from './master/GiftCardList';
export { default as CourierList } from './master/CourierList';
export { default as DeliveryList } from './master/DeliveryList';
export { default as SalesList } from './master/SalesList';
export { default as SaleReturnList } from './master/SaleReturnList';
export { default as UserList } from './master/UserList';
export { default as SaleAgentList } from './master/SaleAgentList';
export { default as ItemCondition } from './master/items/ItemCondition';
export { default as Customers } from './master/customers/Customers';
export { default as GoldTypes } from './master/pawning/GoldTypes';
export { default as GoldRates } from './master/pawning/GoldRates';
export { default as InterestRates } from './master/pawning/InterestRates';
export { default as StampFees } from './master/pawning/StampFees';
export { default as Branches } from './master/branches/Branches';
export { default as LoanPeriods } from './master/pawning/LoanPeriods';
export { default as BillTypes } from './master/pawning/BillTypes';
export { default as BillTypeDetails } from './master/pawning/BranchWiseBillTypeDetails';
export { default as BranchSelector } from './master/branches/BranchSelector';
export { default as RegionalOffices } from './master/branches/RegionalOffices';

export { default as Vendors } from './master/vendors/Vendors';

export { default as Stores } from './master/stores/Stores';
export { default as Design } from './master/design/Design';
export { default as ArticleSize } from './master/articleSize/ArticleSize';
export { default as Employee } from './master/employee/Employee';
export { default as DefaultAccount } from './master/accounts/DefaultAccount';
export { default as Currency } from './master/currency/Currency';

/** -------------------------------Transactions------------------------------- */
export { default as TagCreation } from './trans/TagCreation/TagCreation';
export { default as TagChange } from './trans/TagCreation/TagChange';
export { default as Invoice } from './trans/Invoice/Invoice';
export { default as SalesOrder } from './trans/Invoice/SalesOrder';
export { default as AdvancePayment } from './trans/Invoice/AdvancePayment';
export { default as CustomerPayment } from './trans/Invoice/CustomerPayment';
export { default as AdvanceRefund } from './trans/Invoice/AdvanceRefund';
export { default as SalesReturn } from './trans/Invoice/SalesReturn';
export { default as JewellerySearch } from './trans/TagCreation/JewellerySearch';

// Accounts
export { default as AccountCategories } from './master/accounts/AccountCategories';
export { default as AccountGroups } from './master/accounts/AccountGroups';
export { default as Accounts } from './master/accounts/Accounts';
export { default as AccountList } from './master/AccountList';
export { default as BankAccounts } from './master/accounts/BankAccounts';

//Reminder Letters
export { default as ReminderLetters } from './master/reminderLetters/ReminderLetters';
export { default as ReminderLetterPeriods } from './master/reminderLetters/ReminderLetterPeriods';
export { default as DocumentFees } from './master/reminderLetters/DocumentFees';

// Messages
export { default as Messages } from './master/messages/Messages';
export { default as NavMsg } from './master/messages/NavMsg';

// Cancellations
export { default as Cancellations } from './trans/Cancellations';

//Find
export { default as Find } from './master/Find/Find';

/** -------------------------------TRANSACTIONS------------------------------- */
export { default as Loans } from './trans/Loans';
export { default as GemPawning } from './trans/GemPawning';
export { default as PartPayments } from './trans/PartPayments';
export { default as Redemptions } from './trans/Redemptions';
export { default as Expenses } from './trans/Expenses';
export { default as CashFundTransfers } from './trans/CashFundTransfers';
export { default as IssueCheques } from './trans/IssueCheques';
export { default as ReceiveCheques } from './trans/ReceiveCheques';
export { default as PawningApprovals } from './trans/PawningApprovals';
export { default as CustomerApprovals } from './trans/CustomerApprovals';
export { default as DiscountApprovals } from './trans/DiscountApprovals';

// Accounts
export { default as BankEntry } from './trans/accounts/BankEntry';
export { default as BankReconciliation } from './trans/accounts/BankReconciliation';
export { default as DebitNote } from './trans/accounts/DebitNote';
export { default as GeneralReceipt } from './trans/accounts/GeneralReceipt';
export { default as GeneralVoucher } from './trans/accounts/GeneralVoucher';
export { default as JournalEntry } from './trans/accounts/JournalEntry';

// Approvals
export { default as Approvals } from './trans/approvals/Approvals';
export { default as PurchaseApprovals } from './trans/approvals/PurchaseApprovals';

// Reports
export { default as Reports } from './reports/Reports';

// Purchase
export { default as PurchaseOrders } from './trans/Purchases/PurchaseOrders';
export { default as Purchases } from './trans/Purchases/Purchases';
export { default as SupplierPayment } from './trans/Purchases/SupplierPayment';
export { default as PurchaseReturn } from './trans/Purchases/PurchaseReturn';
export { default as OpeningStock } from './trans/Purchases/OpeningStock';

//Units
export { default as Units } from './master/goldRate/Units';

//TagTransfer
export { default as TagTransfer } from './trans/TagCreation/TagTransfer';

//newmasterfiles
export { default as Metal } from './master/metal/Metal';
export { default as Touch } from './master/touch/Touch';
export { default as Color } from './master/color/Color';
export { default as Stone } from './master/category/Stone';

//paymentVoucher
export { default as PaymentVoucher } from './trans/voucher/PaymentVoucher';

export { default as ReceiptForm } from './trans/receipt/ReceiptForm';

export { default as ReportView } from './reports/ReportView';

//repair part
export { default as CustomerRepair } from './trans/repair/CustomerRepair';
export { default as IssueJewelleryForRepair } from './trans/repair/IssueJewelleryForRepair';
export { default as RecivedFromMaker } from './trans/repair/RecivedFromMaker';
export { default as IssueForCustomer } from './trans/repair/IssueForCustomer';

export { default as ForfeitPurchase } from './trans/Purchases/ForfeitPurchase';

export { default as ResellRepair } from './trans/repair/ResellRepair';

export { default as GoldSmithGoldIssue } from './trans/goldSmith/GoldSmithGoldIssue';

export { default as GoldSmithGoldRecived } from './trans/goldSmith/GoldSmithGoldRecived';

export { default as GoldMelt } from './trans/melt/GoldMelt';

export { default as CustomerStatement } from './trans/customerStatment/CustomerStatement';

export { default as RolePermissions } from '../auth/RolePermissions';



/** -------------------------------MASTER------------------------------- */


export { default as StampFeesSingle } from './master/pawning/StampFeesSingle';


export { default as BillTypesChange } from './master/pawning/BillTypesChange';
// export { default as BillTypeDetails } from './master/pawning/BranchWiseBillTypeDetails';
export { default as BillCountDetails } from './master/pawning/BranchWiseBillCount';
export { default as IntRateDetails } from './master/pawning/BranchWiseIntRateDetails';
export { default as AdditionalDiscounts } from './master/pawning/AdditionalDiscounts';
// export { default as BranchSelector } from './master/branches/BranchSelector';
// export { default as RegionalOffices } from './master/branches/RegionalOffices';
// export { default as ExpenseTypes } from './master/expenses/ExpenseTypes';

// Accounts
// export { default as AccountCategories } from './master/accounts/AccountCategories';
// export { default as AccountGroups } from './master/accounts/AccountGroups';
// export { default as Accounts } from './master/accounts/Accounts';
// export { default as BankAccounts } from './master/accounts/BankAccounts';

//Reminder Letters
// export { default as ReminderLetters } from './master/reminderLetters/ReminderLetters';
// export { default as ReminderLetterPeriods } from './master/reminderLetters/ReminderLetterPeriods';
// export { default as DocumentFees } from './master/reminderLetters/DocumentFees';

// Messages
// export { default as Messages } from './master/messages/Messages';
// export { default as NavMsg } from './master/messages/NavMsg';

//notifications
// Messages
export { default as NavNotification } from './master/notification/NavNotification';

// Cancellations
// export { default as Cancellations } from './trans/Cancellations';

//Find
// export { default as Find } from './master/Find/Find';

//CashTransferNotification
export { default as CashTransferNotification } from './master/notification/CashTransferNotification';
/** -------------------------------TRANSACTIONS------------------------------- */
// export { default as Loans } from './trans/Loans';
export { default as ReLoans } from './trans/ReLoans';
// export { default as GemPawning } from './trans/GemPawning';
// export { default as PartPayments } from './trans/PartPayments';
// export { default as Redemptions } from './trans/Redemptions';
// export { default as Expenses } from './trans/Expenses';
export { default as Incomes } from './trans/Incomes';
// export { default as CashFundTransfers } from './trans/CashFundTransfers';
// export { default as IssueCheques } from './trans/IssueCheques';
// export { default as ReceiveCheques } from './trans/ReceiveCheques';
// export { default as PawningApprovals } from './trans/PawningApprovals';
// export { default as CustomerApprovals } from './trans/CustomerApprovals';
// export { default as DiscountApprovals } from './trans/DiscountApprovals';
// export { default as Approvals } from './trans/Approvals';
export { default as Forfeits } from './trans/Forfeits';
export { default as PendingForfeits } from './trans/PendingForfeits';
export { default as CustomerLimit } from './trans/CustomerLimit';

// Accounts
// export { default as BankEntry } from './trans/accounts/BankEntry';
// export { default as BankReconciliation } from './trans/accounts/BankReconciliation';
// export { default as DebitNote } from './trans/accounts/DebitNote';
// export { default as GeneralReceipt } from './trans/accounts/GeneralReceipt';
// export { default as GeneralVoucher } from './trans/accounts/GeneralVoucher';
// export { default as JournalEntry } from './trans/accounts/JournalEntry';

// Special
export { default as BillChange } from './trans/BillChange';
export { default as MarkBill } from './trans/MarkBill';

//user
export { default as Profile } from './master/profile/Profile';
export { default as UpdateProfile } from './master/profile/UpdateProfile';

// export { default as RolePermissions } from '../auth/RolePermissions';

// export { default as UserAccess } from '../auth/UserAccess';

// export { default as UserAccessMenu } from '../auth/UserAccessMenu';

//officers
// export { default as Officers } from './master/officer/Officer';
export { default as Officers } from './master/officers/Officers';

export { default as ExpenseTypes } from './master/expenses/ExpenseTypes';

/** -------------------------------REPORT-S------------------------------ */
// export { default as Reports } from './reports/ReportViewer';
// export { default as Reports } from './reports/Reports/Reports';

export { default as PayAmountChange } from './trans/PayAmountChange';

export { default as PawningRejectSetup } from './master/pawning/PawningRejectSetup';

// settings
export { default as Backdate } from './settings/Backdate';

// find form
export { default as FindFormSeparateWindow } from './master/Find/FindFormSeparateWindow';

// export { default as TestUI } from './trans/TestUI';

// role
export { default as Role } from './settings/Roles'; 

// transaction log
export { default as TransactionLog } from './trans/TransactionLog';

export { default as PendingRealizeCheques } from './trans/PendingRealizeCheques';

export { default as FindCheques } from './trans/FindCheques';

export { default as ReturnCheques } from './trans/ReturnCheques';
