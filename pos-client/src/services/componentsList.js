import {
  Dashboard,
  ItemCategories,
  Items,
  ItemCondition,
  Customers,
  GoldTypes,
  StampFees,
  StampFeesSingle,
  GoldRates,
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
  AdditionalDiscounts,
  GemPawning,
  Forfeits,
  PendingForfeits,
  BillChange,
  ExpenseTypes,
  MarkBill,
  Profile,
  RolePermissions,
  Officers,
  PayAmountChange,
  PawningRejectSetup,
  Backdate,
  FindFormSeparateWindow,
  Role,
  TransactionLog,
  PendingRealizeCheques,
  ReturnCheques,
} from '../views';
import { Users, Roles, UserAccess, UserAccessMenu } from '../auth';

export const componentsList = [
  {
    name: 'Dashboard',
    value: Dashboard,
  },
  {
    name: 'ItemCategories',
    value: ItemCategories,
  },
  {
    name: 'Items',
    value: Items,
  },
  {
    name: 'ItemCondition',
    value: ItemCondition,
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
    name: 'Customers',
    value: Customers,
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
    name: 'GoldTypes',
    value: GoldTypes,
  },
  {
    name: 'LoanPeriods',
    value: LoanPeriods,
  },
  {
    name: 'GoldRates',
    value: GoldRates,
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
    name: 'Loans',
    value: Loans,
  },
  {
    name: 'ReLoans',
    value: ReLoans,
  },
  {
    name: 'PartPayments',
    value: PartPayments,
  },
  {
    name: 'Redemptions',
    value: Redemptions,
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
    name: 'CashFundTransfers',
    value: CashFundTransfers,
  },
  {
    name: 'IssueCheques',
    value: IssueCheques,
  },
  {
    name: 'ReceiveCheques',
    value: ReceiveCheques,
  },
  {
    name: 'Users',
    value: Users,
  },
  {
    name: 'Roles',
    value: Roles,
  },
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
  {
    name: 'AdditionalDiscounts',
    value: AdditionalDiscounts,
  },
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
    name: 'RolePermissions',
    value: RolePermissions,
  },
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
  {
    name: 'UserAccess',
    value: UserAccess,
  },
  {
    name: 'UserAccessMenu',
    value: UserAccessMenu,
  },
  // {
  //   name: 'Loans',
  //   route: '/new-loans/:branch_id/:bill_type_id/:bill_no/:bill_type_des',
  //   value: Loans,
  // },
];
