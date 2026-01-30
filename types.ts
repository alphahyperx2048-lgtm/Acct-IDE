
export enum ViewMode {
  JOURNAL = 'JOURNAL',
  JOURNAL_LOG = 'JOURNAL_LOG',
  LEDGER = 'LEDGER',
  TRIAL_BALANCE = 'TRIAL_BALANCE',
  FINAL_ACCOUNTS = 'FINAL_ACCOUNTS',
  SUBSIDIARY_BOOKS = 'SUBSIDIARY_BOOKS',
  CASH_BOOK = 'CASH_BOOK',
  INVENTORY = 'INVENTORY',
  WORKING_NOTES = 'WORKING_NOTES',
  ACCOUNT_PROFILE = 'ACCOUNT_PROFILE',
  SETTINGS = 'SETTINGS',
  DEPRECIATION = 'DEPRECIATION'
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type NegativeBalanceFormat = 'MINUS' | 'BRACKETS';
export type FinancialYearType = 'INDIAN' | 'CALENDAR';

export type AccountClassification = 
  | 'TANGIBLE_ASSET' | 'INTANGIBLE_ASSET' | 'CURRENT_ASSET' | 'SUNDRY_DEBTOR' | 'INVESTMENT' | 'ADVANCES'
  | 'LOANS' | 'SUNDRY_CREDITOR' | 'OUTSTANDING_EXP' | 'SUNDRY_LIABILITY'
  | 'OWNER_CAPITAL' | 'OWNER_DRAWINGS'
  | 'DIRECT_REVENUE' | 'INDIRECT_REVENUE'
  | 'DIRECT_EXPENSE' | 'INDIRECT_EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  classification: AccountClassification;
  description?: string;
  finalAccountCategory?: 'DIRECT' | 'INDIRECT';
  relatedAssetId?: string;
  linkedMachineId?: string;
}

export interface JournalLine {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  accountId: string;
  accountName: string;
  code?: string;
  amount: number;
}

export interface JournalEntry {
  id: string;
  transactionId?: string;
  date: string;
  narration: string;
  lines: JournalLine[];
  isDepreciationEntry?: boolean;
}

export type SubsidiaryBookType = 'SALES' | 'PURCHASE' | 'SALES_RETURN' | 'PURCHASE_RETURN' | 'CASH';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface CashBookEntry {
  id: string;
  date: string;
  type: 'RECEIPT' | 'PAYMENT';
  accountId: string;
  accountName: string;
  particulars: string;
  cashAmount: number;
  bankAmount: number;
  discountAmount: number;
  isContra: boolean;
  isOpeningBalance: boolean;
  posted: boolean;
}

export interface SubsidiaryEntry {
  id: string;
  invoiceNumber?: string;
  referenceId?: string;
  transactionId?: string;
  date: string;
  bookType: SubsidiaryBookType;
  partyName: string;
  items: InvoiceItem[];
  tradeDiscountPercent: number;
  cashDiscountAmount: number;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  posted: boolean;
}

export type ValuationMethod = 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE';

export interface StockBatch {
  id: string;
  refDocId: string;
  date: string;
  quantity: number;
  rate: number;
  value: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  lastPurchaseRate: number;
  batches: StockBatch[];
}

export interface StockTransaction {
  id: string;
  date: string;
  type: 'RECEIPT' | 'ISSUE';
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  refDocId?: string;
  balanceQty?: number;
  balanceRate?: number;
  balanceAmt?: number;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface SimulatedLedgerLine {
  id: string;
  particulars: string;
  amount: number;
  isAutoBalanced?: boolean;
}

export interface LedgerState {
  debits: SimulatedLedgerLine[];
  credits: SimulatedLedgerLine[];
  isBalanced: boolean;
}

export interface MachineAsset {
  id: string;
  name: string;
  purchaseCost: number;
  purchaseDate: string;
  method: 'SLM' | 'WDV';
  rate: number;
  saleDate?: string;
  saleValue?: number;
  useProvision: boolean;
  hasDisposal: boolean;
  assetLedger: LedgerState;
  provisionLedger: LedgerState;
  disposalLedger: LedgerState;
  isPosted?: boolean;
}

export interface DepreciationSchedule {
  id: string;
  accountId: string;
  accountName: string;
  cost: number;
  accumulatedDepreciation: number;
  bookValue: number;
  method: 'SLM' | 'WDV';
  rate: number;
  lastDepreciationDate?: string;
}
