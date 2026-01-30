
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Account, JournalEntry, AccountType, SubsidiaryEntry, SubsidiaryBookType, 
  SavedNote, MachineAsset, SimulatedLedgerLine, LedgerState, ValuationMethod, 
  StockTransaction, InventoryItem, StockBatch, CashBookEntry, AccountClassification,
  NegativeBalanceFormat, FinancialYearType
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: '1', code: '1001', name: 'Cash A/c', type: 'ASSET', classification: 'CURRENT_ASSET', description: 'Cash in hand' },
  { id: '2', code: '1002', name: 'Bank A/c', type: 'ASSET', classification: 'CURRENT_ASSET', description: 'Primary business bank account' },
  { id: '3', code: '2001', name: 'Capital A/c', type: 'EQUITY', classification: 'OWNER_CAPITAL', description: 'Owner\'s investment' },
  { id: '4', code: '3001', name: 'Sales A/c', type: 'REVENUE', classification: 'DIRECT_REVENUE', finalAccountCategory: 'DIRECT', description: 'Revenue from goods sold' },
  { id: '5', code: '4001', name: 'Purchase A/c', type: 'EXPENSE', classification: 'DIRECT_EXPENSE', finalAccountCategory: 'DIRECT', description: 'Cost of goods purchased' },
  { id: '6', code: '1003', name: 'Stock A/c', type: 'ASSET', classification: 'CURRENT_ASSET', finalAccountCategory: 'DIRECT', description: 'Opening stock/Closing stock' },
  { id: '8', code: '3002', name: 'Sales Return A/c', type: 'EXPENSE', classification: 'DIRECT_EXPENSE', finalAccountCategory: 'DIRECT', description: 'Returns from customers' },
  { id: '9', code: '4003', name: 'Purchase Return A/c', type: 'REVENUE', classification: 'DIRECT_REVENUE', finalAccountCategory: 'DIRECT', description: 'Returns to suppliers' },
  { id: '10', code: '2002', name: 'Drawings A/c', type: 'EQUITY', classification: 'OWNER_DRAWINGS', description: 'Owner\'s personal withdrawals' },
];

interface FiscalAnalysis {
  openingStock: number;
  closingStock: number;
  grossProfit: number;
  netProfit: number;
  netLoss: number;
  isBalanced: boolean;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cashBalance: number;
  bankBalance: number;
}

interface AccountingContextType {
  accounts: Account[];
  entries: JournalEntry[];
  subsidiaryEntries: SubsidiaryEntry[];
  cashBookEntries: CashBookEntry[];
  savedNotes: SavedNote[];
  stockTransactions: StockTransaction[];
  inventoryItems: InventoryItem[];
  inventoryMethod: ValuationMethod;
  negativeFormat: NegativeBalanceFormat;
  financialYear: FinancialYearType;
  setInventoryMethod: (method: ValuationMethod) => void;
  setNegativeFormat: (format: NegativeBalanceFormat) => void;
  setFinancialYear: (fy: FinancialYearType) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  
  addEntry: (entry: JournalEntry) => boolean;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  getAccountByName: (name: string) => Account | undefined;
  createAccount: (name: string, type: AccountType, classification: AccountClassification, finalCategory?: 'DIRECT' | 'INDIRECT') => Account;
  deleteAccount: (id: string) => void;
  
  exportData: () => string;
  importData: (json: string) => { success: boolean; metadata?: any };
  softReset: () => void;
  hardReset: () => void;
  
  getAccountBalance: (accountId: string) => number;
  getFiscalAnalysis: () => FiscalAnalysis;
  formatAmount: (val: number) => string;
  isDateInFiscalYear: (dateStr: string) => boolean;

  postDepreciation: (data: { accountId: string, amount: number, date: string, narration: string }) => void;
  addCashBookEntry: (entry: CashBookEntry) => void;
  addSubsidiaryEntry: (entry: SubsidiaryEntry) => void;
  postSubsidiaryEntry: (entry: SubsidiaryEntry) => void;
  generateDocumentId: (type: SubsidiaryBookType) => string;
  getValidReferenceDocs: (forBookType: SubsidiaryBookType) => SubsidiaryEntry[];
  addSavedNote: (title: string, content: string) => void;
  deleteSavedNote: (id: string) => void;
  getEligibleDepreciationAssets: () => { account: Account, currentBalance: number, cost: number, accumulatedDepreciation: number }[];
  getCurrentStockBalance: (itemId: string) => number;
  balanceCashBook: (date: string) => { cash: number, bank: number };
  hasOpeningBalance: () => boolean;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);
const STORAGE_KEY = 'ACCT_IDE_ENGINE_V16_STABLE';

export const AccountingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Load failed", e); }
    return {
      accounts: DEFAULT_ACCOUNTS,
      entries: [],
      subsidiaryEntries: [],
      cashBookEntries: [],
      savedNotes: [],
      stockTransactions: [],
      inventoryItems: [],
      inventoryMethod: 'FIFO',
      negativeFormat: 'MINUS',
      financialYear: 'INDIAN'
    };
  };

  const initialState = loadState();

  const [accounts, setAccounts] = useState<Account[]>(initialState.accounts);
  const [entries, setEntries] = useState<JournalEntry[]>(initialState.entries);
  const [subsidiaryEntries, setSubsidiaryEntries] = useState<SubsidiaryEntry[]>(initialState.subsidiaryEntries || []);
  const [cashBookEntries, setCashBookEntries] = useState<CashBookEntry[]>(initialState.cashBookEntries || []);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(initialState.savedNotes || []);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(initialState.stockTransactions || []);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialState.inventoryItems || []);
  const [inventoryMethod, setInventoryMethod] = useState<ValuationMethod>(initialState.inventoryMethod || 'FIFO');
  const [negativeFormat, setNegativeFormat] = useState<NegativeBalanceFormat>(initialState.negativeFormat || 'MINUS');
  const [financialYear, setFinancialYear] = useState<FinancialYearType>(initialState.financialYear || 'INDIAN');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const data = { accounts, entries, subsidiaryEntries, cashBookEntries, savedNotes, stockTransactions, inventoryItems, inventoryMethod, negativeFormat, financialYear };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [accounts, entries, subsidiaryEntries, cashBookEntries, savedNotes, stockTransactions, inventoryItems, inventoryMethod, negativeFormat, financialYear]);

  const isDateInFiscalYear = (dateStr: string): boolean => true;

  const formatAmount = (val: number): string => {
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val < -0.001) {
      return negativeFormat === 'MINUS' ? `-${formatted}` : `(${formatted})`;
    }
    return formatted;
  };

  const getAccountBalance = (accountId: string): number => {
    const balance = entries.reduce((bal, entry) => {
      return bal + entry.lines.filter(l => l.accountId === accountId).reduce((s, l) => s + (l.type === 'DEBIT' ? l.amount : -l.amount), 0);
    }, 0);
    return balance;
  };

  const getCurrentStockBalance = (itemId: string): number => {
    return stockTransactions
      .filter(t => t.itemId === itemId)
      .reduce((sum, t) => t.type === 'RECEIPT' ? sum + t.quantity : sum - t.quantity, 0);
  };

  const addEntry = (entry: JournalEntry): boolean => {
    const totalDr = entry.lines.filter(l => l.type === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const totalCr = entry.lines.filter(l => l.type === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    if (Math.abs(totalDr - totalCr) > 0.01) return false;
    setEntries(prev => [{ ...entry, transactionId: entry.transactionId || `TXN-${uuidv4().slice(0, 8)}` }, ...prev]);
    return true;
  };

  const createAccount = (name: string, type: AccountType, classification: AccountClassification, finalCategory?: 'DIRECT' | 'INDIRECT'): Account => {
    const prefixes: Record<AccountType, string> = { ASSET: '1', LIABILITY: '2', EQUITY: '2', REVENUE: '3', EXPENSE: '4' };
    const code = `${prefixes[type] || '9'}${Math.floor(100 + Math.random() * 899)}`;
    const newAcc: Account = { id: uuidv4(), code, name: name.trim(), type, classification, finalAccountCategory: finalCategory };
    setAccounts(prev => [...prev, newAcc]);
    return newAcc;
  };

  const getAccountByName = (n: string) => accounts.find(a => a.name.toLowerCase() === n.trim().toLowerCase());
  const updateAccount = (id: string, updates: Partial<Account>) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const deleteAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));
  const generateDocumentId = (type: SubsidiaryBookType) => `${type.slice(0, 1)}-${uuidv4().slice(0, 4).toUpperCase()}`;

  const balanceCashBook = (date: string) => {
    const totalCashRec = cashBookEntries.filter(e => e.type === 'RECEIPT').reduce((s, e) => s + e.cashAmount, 0);
    const totalBankRec = cashBookEntries.filter(e => e.type === 'RECEIPT').reduce((s, e) => s + e.bankAmount, 0);
    const totalCashPay = cashBookEntries.filter(e => e.type === 'PAYMENT').reduce((s, e) => s + e.cashAmount, 0);
    const totalBankPay = cashBookEntries.filter(e => e.type === 'PAYMENT').reduce((s, e) => s + e.bankAmount, 0);
    
    return {
      cash: totalCashRec - totalCashPay,
      bank: totalBankRec - totalBankPay
    };
  };

  const hasOpeningBalance = () => cashBookEntries.some(e => e.isOpeningBalance);
  
  const getValidReferenceDocs = (forBookType: SubsidiaryBookType): SubsidiaryEntry[] => {
    if (forBookType === 'PURCHASE_RETURN') return subsidiaryEntries.filter(e => e.bookType === 'PURCHASE');
    if (forBookType === 'SALES_RETURN') return subsidiaryEntries.filter(e => e.bookType === 'SALES');
    return [];
  };

  const calculateFIFOCost = (itemId: string, quantityToValue: number): number => {
    const receipts = stockTransactions
      .filter(t => t.itemId === itemId && t.type === 'RECEIPT')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const totalIssued = stockTransactions
      .filter(t => t.itemId === itemId && t.type === 'ISSUE')
      .reduce((s, t) => s + t.quantity, 0);

    let skipped = 0;
    let cost = 0;
    let remaining = quantityToValue;

    for (const r of receipts) {
      if (skipped + r.quantity <= totalIssued) {
        skipped += r.quantity;
        continue;
      }
      const availableInBatch = r.quantity - Math.max(0, totalIssued - skipped);
      const toTake = Math.min(remaining, availableInBatch);
      cost += toTake * r.rate;
      remaining -= toTake;
      skipped += r.quantity;
      if (remaining <= 0) break;
    }
    
    if (remaining > 0) {
      const item = inventoryItems.find(i => i.id === itemId);
      cost += remaining * (item?.lastPurchaseRate || 0);
    }
    return cost;
  };

  const postSubsidiaryEntry = (entry: SubsidiaryEntry) => {
    const isSalesContext = entry.bookType === 'SALES' || entry.bookType === 'SALES_RETURN';
    const isPurchaseContext = entry.bookType === 'PURCHASE' || entry.bookType === 'PURCHASE_RETURN';

    const partyAcc = getAccountByName(entry.partyName) || createAccount(
        entry.partyName, 
        isSalesContext ? 'ASSET' : 'LIABILITY', 
        isSalesContext ? 'SUNDRY_DEBTOR' : 'SUNDRY_CREDITOR'
    );
    
    let mainAccName = '';
    let classification: AccountClassification = 'DIRECT_REVENUE';
    const isReturn = entry.bookType.includes('RETURN');

    switch (entry.bookType) {
      case 'PURCHASE': mainAccName = 'Purchase A/c'; classification = 'DIRECT_EXPENSE'; break;
      case 'SALES': mainAccName = 'Sales A/c'; classification = 'DIRECT_REVENUE'; break;
      case 'PURCHASE_RETURN': mainAccName = 'Purchase Return A/c'; classification = 'DIRECT_REVENUE'; break;
      case 'SALES_RETURN': mainAccName = 'Sales Return A/c'; classification = 'DIRECT_EXPENSE'; break;
    }

    const mainAcc = getAccountByName(mainAccName) || createAccount(mainAccName, entry.bookType.includes('PURCHASE') ? (isReturn ? 'REVENUE' : 'EXPENSE') : (isReturn ? 'EXPENSE' : 'REVENUE'), classification, 'DIRECT');

    const lines: any[] = [];
    const isSales = entry.bookType === 'SALES';
    const isPurchase = entry.bookType === 'PURCHASE';
    const isSalesReturn = entry.bookType === 'SALES_RETURN';
    const isPurchaseReturn = entry.bookType === 'PURCHASE_RETURN';

    const grossAfterTradeDiscount = entry.subTotal - entry.discountAmount;
    const cashDiscount = entry.cashDiscountAmount || 0;

    if (isPurchase) {
      lines.push({ id: uuidv4(), type: 'DEBIT', accountId: mainAcc.id, accountName: mainAcc.name, amount: grossAfterTradeDiscount, code: mainAcc.code });
      lines.push({ id: uuidv4(), type: 'CREDIT', accountId: partyAcc.id, accountName: partyAcc.name, amount: entry.totalAmount, code: partyAcc.code });
      if (cashDiscount > 0) {
        const discRec = getAccountByName('Discount Received A/c') || createAccount('Discount Received A/c', 'REVENUE', 'INDIRECT_REVENUE', 'INDIRECT');
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: discRec.id, accountName: discRec.name, amount: cashDiscount, code: discRec.code });
      }
    } else if (isSales) {
      lines.push({ id: uuidv4(), type: 'DEBIT', accountId: partyAcc.id, accountName: partyAcc.name, amount: entry.totalAmount, code: partyAcc.code });
      if (cashDiscount > 0) {
        const discAllowed = getAccountByName('Discount Allowed A/c') || createAccount('Discount Allowed A/c', 'EXPENSE', 'INDIRECT_EXPENSE', 'INDIRECT');
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: discAllowed.id, accountName: discAllowed.name, amount: cashDiscount, code: discAllowed.code });
      }
      lines.push({ id: uuidv4(), type: 'CREDIT', accountId: mainAcc.id, accountName: mainAcc.name, amount: grossAfterTradeDiscount, code: mainAcc.code });
    } else if (isSalesReturn) {
      lines.push({ id: uuidv4(), type: 'DEBIT', accountId: mainAcc.id, accountName: mainAcc.name, amount: entry.totalAmount, code: mainAcc.code });
      lines.push({ id: uuidv4(), type: 'CREDIT', accountId: partyAcc.id, accountName: partyAcc.name, amount: entry.totalAmount, code: partyAcc.code });
    } else if (isPurchaseReturn) {
      lines.push({ id: uuidv4(), type: 'DEBIT', accountId: partyAcc.id, accountName: partyAcc.name, amount: entry.totalAmount, code: partyAcc.code });
      lines.push({ id: uuidv4(), type: 'CREDIT', accountId: mainAcc.id, accountName: mainAcc.name, amount: entry.totalAmount, code: mainAcc.code });
    }

    addEntry({ id: uuidv4(), date: entry.date, narration: `Being ${entry.bookType.toLowerCase()} posted from book`, lines });

    const newStockTxns: StockTransaction[] = [];
    entry.items.forEach(item => {
      let invItem = inventoryItems.find(i => i.name.toLowerCase() === item.description.trim().toLowerCase());
      if (!invItem && item.description.trim()) {
        const newItem: InventoryItem = { id: uuidv4(), name: item.description.trim(), unit: item.unit || 'Pcs', lastPurchaseRate: isPurchase ? item.rate : 0, batches: [] };
        setInventoryItems(prev => [...prev, newItem]);
        invItem = newItem;
      }
      if (invItem) {
        let finalRate = item.rate;
        let finalAmount = item.amount;
        let txnType: 'RECEIPT' | 'ISSUE' = (isPurchase || isSalesReturn) ? 'RECEIPT' : 'ISSUE';
        if (isSales || isPurchaseReturn) {
          finalAmount = calculateFIFOCost(invItem.id, item.quantity);
          finalRate = item.quantity > 0 ? finalAmount / item.quantity : 0;
        }
        newStockTxns.push({ id: uuidv4(), date: entry.date, type: txnType, itemId: invItem.id, itemName: invItem.name, quantity: item.quantity, rate: finalRate, amount: finalAmount, refDocId: entry.invoiceNumber });
        if (isPurchase) updateInventoryItemRate(invItem.id, item.rate);
      }
    });
    if (newStockTxns.length > 0) setStockTransactions(prev => [...prev, ...newStockTxns]);
  };

  const updateInventoryItemRate = (id: string, rate: number) => {
    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, lastPurchaseRate: rate } : i));
  };

  const getFiscalAnalysis = (): FiscalAnalysis => {
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
    let tradingDr = 0, tradingCr = 0, plDr = 0, plCr = 0;

    const balances = accounts.reduce((acc, curr) => {
      acc[curr.id] = getAccountBalance(curr.id);
      return acc;
    }, {} as Record<string, number>);

    accounts.forEach(acc => {
      const bal = balances[acc.id];
      if (Math.abs(bal) < 0.001) return;
      if (acc.type === 'REVENUE' || acc.type === 'EXPENSE') {
        const absBal = Math.abs(bal);
        const isDirect = acc.finalAccountCategory === 'DIRECT';
        if (acc.type === 'REVENUE') { if (isDirect) tradingCr += absBal; else plCr += absBal; }
        else { if (isDirect) tradingDr += absBal; else plDr += absBal; }
      } else {
        if (acc.type === 'ASSET') totalAssets += bal;
        else if (acc.type === 'LIABILITY') totalLiabilities += Math.abs(bal);
        else if (acc.type === 'EQUITY' && acc.classification !== 'OWNER_DRAWINGS') totalEquity += Math.abs(bal);
      }
    });

    const cashAcc = accounts.find(a => a.name === 'Cash A/c');
    const bankAcc = accounts.find(a => a.name === 'Bank A/c');
    const cashBal = cashAcc ? balances[cashAcc.id] : 0;
    const bankBal = bankAcc ? balances[bankAcc.id] : 0;

    const openingStockAccount = accounts.find(a => a.name === 'Stock A/c');
    const openingStockValue = openingStockAccount ? Math.abs(balances[openingStockAccount.id]) : 0;
    const closingStockValue = stockTransactions.reduce((s, t) => t.type === 'RECEIPT' ? s + t.amount : s - t.amount, 0);
    
    tradingDr += openingStockValue;
    tradingCr += closingStockValue;
    totalAssets += closingStockValue;

    const drawingsBal = accounts.filter(a => a.classification === 'OWNER_DRAWINGS').reduce((s, a) => s + Math.abs(balances[a.id]), 0);
    totalEquity -= drawingsBal;

    const grossProfit = Math.max(0, tradingCr - tradingDr);
    const grossLoss = Math.max(0, tradingDr - tradingCr);
    plCr += grossProfit; plDr += grossLoss;

    const netProfit = Math.max(0, plCr - plDr);
    const netLoss = Math.max(0, plDr - plCr);
    const finalEquity = totalEquity + netProfit - netLoss;

    return { 
      openingStock: openingStockValue,
      closingStock: closingStockValue,
      grossProfit, 
      netProfit, 
      netLoss, 
      isBalanced: Math.abs(totalAssets - (totalLiabilities + finalEquity)) < 1, 
      totalAssets, 
      totalLiabilities, 
      totalEquity: finalEquity,
      cashBalance: cashBal,
      bankBalance: bankBal
    };
  };

  const postDepreciation = (data: { accountId: string, amount: number, date: string, narration: string }) => {
    const depAcc = getAccountByName('Depreciation A/c') || createAccount('Depreciation A/c', 'EXPENSE', 'INDIRECT_EXPENSE', 'INDIRECT');
    const assetAcc = accounts.find(a => a.id === data.accountId);
    if (!assetAcc) return;
    addEntry({ id: uuidv4(), date: data.date, narration: data.narration, isDepreciationEntry: true, lines: [ { id: uuidv4(), type: 'DEBIT', accountId: depAcc.id, accountName: depAcc.name, amount: data.amount, code: depAcc.code }, { id: uuidv4(), type: 'CREDIT', accountId: assetAcc.id, accountName: assetAcc.name, amount: data.amount, code: assetAcc.code } ] });
  };

  const addCashBookEntry = (entry: CashBookEntry) => {
    setCashBookEntries(prev => [...prev, entry]);
    const lines: any[] = [];
    const isReceipt = entry.type === 'RECEIPT';
    const cashAcc = accounts.find(a => a.name === 'Cash A/c') || createAccount('Cash A/c', 'ASSET', 'CURRENT_ASSET');
    const bankAcc = accounts.find(a => a.name === 'Bank A/c') || createAccount('Bank A/c', 'ASSET', 'CURRENT_ASSET');

    if (entry.isOpeningBalance) {
      const capAcc = getAccountByName('Capital A/c') || createAccount('Capital A/c', 'EQUITY', 'OWNER_CAPITAL');
      if (entry.cashAmount > 0) {
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: cashAcc.id, accountName: cashAcc.name, amount: entry.cashAmount });
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: capAcc.id, accountName: capAcc.name, amount: entry.cashAmount });
      }
      if (entry.bankAmount > 0) {
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: bankAcc.id, accountName: bankAcc.name, amount: entry.bankAmount });
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: capAcc.id, accountName: capAcc.name, amount: entry.bankAmount });
      }
    } else if (entry.isContra) {
      if (entry.accountName.toLowerCase().includes('bank')) {
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: bankAcc.id, accountName: bankAcc.name, amount: entry.bankAmount });
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: cashAcc.id, accountName: cashAcc.name, amount: entry.bankAmount });
      } else {
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: cashAcc.id, accountName: cashAcc.name, amount: entry.cashAmount });
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: bankAcc.id, accountName: bankAcc.name, amount: entry.bankAmount });
      }
    } else {
      const otherAcc = getAccountByName(entry.accountName) || createAccount(entry.accountName, isReceipt ? 'REVENUE' : 'EXPENSE', 'CURRENT_ASSET');
      if (isReceipt) {
        if (entry.cashAmount > 0) lines.push({ id: uuidv4(), type: 'DEBIT', accountId: cashAcc.id, accountName: cashAcc.name, amount: entry.cashAmount });
        if (entry.bankAmount > 0) lines.push({ id: uuidv4(), type: 'DEBIT', accountId: bankAcc.id, accountName: bankAcc.name, amount: entry.bankAmount });
        lines.push({ id: uuidv4(), type: 'CREDIT', accountId: otherAcc.id, accountName: otherAcc.name, amount: entry.cashAmount + entry.bankAmount + entry.discountAmount });
        if (entry.discountAmount > 0) {
          const discAllowed = getAccountByName('Discount Allowed A/c') || createAccount('Discount Allowed A/c', 'EXPENSE', 'INDIRECT_EXPENSE', 'INDIRECT');
          lines.push({ id: uuidv4(), type: 'DEBIT', accountId: discAllowed.id, accountName: discAllowed.name, amount: entry.discountAmount });
        }
      } else {
        lines.push({ id: uuidv4(), type: 'DEBIT', accountId: otherAcc.id, accountName: otherAcc.name, amount: entry.cashAmount + entry.bankAmount + entry.discountAmount });
        if (entry.cashAmount > 0) lines.push({ id: uuidv4(), type: 'CREDIT', accountId: cashAcc.id, accountName: cashAcc.name, amount: entry.cashAmount });
        if (entry.bankAmount > 0) lines.push({ id: uuidv4(), type: 'CREDIT', accountId: bankAcc.id, accountName: bankAcc.name, amount: entry.bankAmount });
        if (entry.discountAmount > 0) {
          const discRec = getAccountByName('Discount Received A/c') || createAccount('Discount Received A/c', 'REVENUE', 'INDIRECT_REVENUE', 'INDIRECT');
          lines.push({ id: uuidv4(), type: 'CREDIT', accountId: discRec.id, accountName: discRec.name, amount: entry.discountAmount });
        }
      }
    }
    if (lines.length > 0) addEntry({ id: uuidv4(), date: entry.date, narration: entry.particulars, lines });
  };

  const getEligibleDepreciationAssets = () => {
    return accounts.filter(acc => acc.classification === 'TANGIBLE_ASSET').map(acc => {
      const bal = getAccountBalance(acc.id);
      const depEntries = entries.filter(e => e.isDepreciationEntry);
      let accumulatedDep = 0;
      depEntries.forEach(e => { e.lines.forEach(l => { if (l.accountId === acc.id && l.type === 'CREDIT') accumulatedDep += l.amount; }); });
      return { account: acc, currentBalance: bal, cost: bal + accumulatedDep, accumulatedDepreciation: accumulatedDep };
    }).filter(item => item.currentBalance > 0.1);
  };

  const addSubsidiaryEntry = (entry: SubsidiaryEntry) => setSubsidiaryEntries(prev => [...prev, entry]);
  const addSavedNote = (title: string, content: string) => setSavedNotes(prev => [{ id: uuidv4(), title, content, date: new Date().toISOString() }, ...prev]);
  const deleteSavedNote = (id: string) => setSavedNotes(prev => prev.filter(n => n.id !== id));
  const exportData = () => JSON.stringify({ accounts, entries, subsidiaryEntries, cashBookEntries, savedNotes, stockTransactions, inventoryItems, inventoryMethod, negativeFormat, financialYear });
  const importData = (json: string) => { try { const d = JSON.parse(json); if (d.accounts) setAccounts(d.accounts); if (d.entries) setEntries(d.entries); if (d.subsidiaryEntries) setSubsidiaryEntries(d.subsidiaryEntries); if (d.cashBookEntries) setCashBookEntries(d.cashBookEntries); if (d.stockTransactions) setStockTransactions(d.stockTransactions); if (d.inventoryItems) setInventoryItems(d.inventoryItems); return { success: true, metadata: d._metadata }; } catch { return { success: false }; } };
  const softReset = () => { setEntries([]); setSubsidiaryEntries([]); setCashBookEntries([]); setStockTransactions([]); setIsDirty(false); };
  const hardReset = () => { setAccounts(DEFAULT_ACCOUNTS); setEntries([]); setSubsidiaryEntries([]); setCashBookEntries([]); setSavedNotes([]); setStockTransactions([]); setInventoryItems([]); localStorage.removeItem(STORAGE_KEY); window.location.reload(); };

  return (
    <AccountingContext.Provider value={{ 
      accounts, entries, subsidiaryEntries, cashBookEntries, savedNotes, stockTransactions, inventoryItems, inventoryMethod, negativeFormat, financialYear,
      setInventoryMethod, setNegativeFormat, setFinancialYear, isDirty, setIsDirty,
      addEntry, updateAccount, getAccountByName, createAccount, deleteAccount, 
      exportData, importData, softReset, hardReset,
      getAccountBalance, getFiscalAnalysis, formatAmount, isDateInFiscalYear,
      postDepreciation, addCashBookEntry, addSubsidiaryEntry, postSubsidiaryEntry, generateDocumentId, getValidReferenceDocs, addSavedNote, deleteSavedNote, getEligibleDepreciationAssets,
      getCurrentStockBalance, balanceCashBook, hasOpeningBalance
    }}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) throw new Error('useAccounting must be used within an AccountingProvider');
  return context;
};
