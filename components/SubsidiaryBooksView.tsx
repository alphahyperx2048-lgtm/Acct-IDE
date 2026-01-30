
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccounting } from '../context/AccountingContext';
import { SubsidiaryBookType, InvoiceItem, SubsidiaryEntry, AccountType } from '../types';
import { 
  Plus, Trash2, ShoppingCart, Store, ArrowLeftRight, Wallet,
  History, ChevronDown, CheckCircle2, FileText, Search, Sparkles, Calculator, Boxes, Info, Link as LinkIcon, X, Calendar, User, TrendingUp, ShieldAlert, UserPlus, Fingerprint, RefreshCcw, AlertOctagon, Check
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const StockErrorModal: React.FC<{ isOpen: boolean; onClose: () => void; itemName: string; available: number; requested: number }> = ({ isOpen, onClose, itemName, available, requested }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="relative bg-[#0F172A] border border-red-500/50 rounded-[32px] p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <AlertOctagon size={40} className="text-red-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Stock Constraint Alert</h2>
            <p className="text-gray-400 text-sm mb-6">Insufficient units available in the Store Ledger to complete this outward transaction.</p>
            <div className="w-full bg-black/40 rounded-2xl p-5 border border-white/5 space-y-3 mb-8">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500"><span>Commodity</span> <span className="text-white">{itemName}</span></div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500"><span>In-Hand Store Balance</span> <span className="text-emerald-400 font-mono text-base">{available} Units</span></div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500"><span>Transaction Quantity</span> <span className="text-red-400 font-mono text-base">{requested} Units</span></div>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-red-600 transition-all">Revise Entry</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SubsidiaryBooksView: React.FC = () => {
  const { 
    addSubsidiaryEntry, postSubsidiaryEntry, subsidiaryEntries, accounts, 
    generateDocumentId, inventoryItems, getValidReferenceDocs, getAccountByName, createAccount, getCurrentStockBalance
  } = useAccounting();

  const [activeBook, setActiveBook] = useState<SubsidiaryBookType>('PURCHASE');
  const [viewMode, setViewMode] = useState<'ENTRY' | 'REGISTER'>('ENTRY');
  const [stockError, setStockError] = useState<{ isOpen: boolean; item: string; available: number; requested: number }>({ isOpen: false, item: '', available: 0, requested: 0 });
  
  const [partyName, setPartyName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceItem[]>([{ id: uuidv4(), description: '', quantity: 1, unit: 'Pcs', rate: 0, amount: 0 }]);
  const [tradeDiscount, setTradeDiscount] = useState(0);
  const [cashDiscount, setCashDiscount] = useState(0);
  const [referenceId, setReferenceId] = useState('');
  
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [activeItemLine, setActiveItemLine] = useState<string | null>(null);
  const [refSearchQuery, setRefSearchQuery] = useState('');

  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tradeDiscountAmount = (subTotal * tradeDiscount) / 100;
  const netBeforeCashDiscount = subTotal - tradeDiscountAmount;
  const totalAmount = netBeforeCashDiscount - cashDiscount;

  const isReturnBook = activeBook === 'PURCHASE_RETURN' || activeBook === 'SALES_RETURN';
  const isPurchaseContext = activeBook === 'PURCHASE' || activeBook === 'PURCHASE_RETURN';
  const isSalesBook = activeBook === 'SALES';

  const filteredParties = useMemo(() => {
    const query = partyName.trim().toLowerCase();
    if (!query) return [];
    return accounts.filter(a => a.name.toLowerCase().includes(query) || a.code.includes(query));
  }, [partyName, accounts]);

  const availableRefs = useMemo(() => {
    const refs = getValidReferenceDocs(activeBook);
    if (!refSearchQuery) return refs;
    const q = refSearchQuery.toLowerCase();
    return refs.filter(r => r.invoiceNumber?.toLowerCase().includes(q) || r.partyName.toLowerCase().includes(q));
  }, [activeBook, subsidiaryEntries, refSearchQuery, getValidReferenceDocs]);

  const handleSelectReference = (refEntry: SubsidiaryEntry) => {
    setReferenceId(refEntry.invoiceNumber || '');
    setPartyName(refEntry.partyName);
    setItems(refEntry.items.map(it => ({ ...it, id: uuidv4() })));
    setTradeDiscount(refEntry.tradeDiscountPercent);
    setShowRefDropdown(false);
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Trigger real-time calculation whenever Qty or Rate is touched
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const selectInventoryItem = (id: string, invItem: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        // Automatically populate unit and rate. 
        // For purchases, use last purchase rate if available.
        // For sales, use it as a suggested base.
        const populatedRate = invItem.lastPurchaseRate || item.rate || 0;
        const populatedAmount = item.quantity * populatedRate;
        
        return { 
          ...item, 
          description: invItem.name, 
          unit: invItem.unit, 
          rate: populatedRate, 
          amount: populatedAmount 
        };
      }
      return item;
    }));
    setActiveItemLine(null);
  };

  const addItem = () => setItems(prev => [...prev, { id: uuidv4(), description: '', quantity: 1, unit: 'Pcs', rate: 0, amount: 0 }]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id)); };

  const handleSaveEntry = () => {
    if (!partyName.trim()) { alert("Identity of the Accounting Party is required."); return; }
    
    // PERPETUAL STOCK VALIDATION:
    if (activeBook === 'SALES' || activeBook === 'PURCHASE_RETURN') {
      for (const item of items) {
        const invItem = inventoryItems.find(i => i.name.toLowerCase() === item.description.trim().toLowerCase());
        if (invItem) {
          const liveStock = getCurrentStockBalance(invItem.id);
          if (item.quantity > liveStock) {
            setStockError({ isOpen: true, item: invItem.name, available: liveStock, requested: item.quantity });
            return;
          }
        }
      }
    }

    const newEntry: SubsidiaryEntry = { 
      id: uuidv4(), 
      invoiceNumber: generateDocumentId(activeBook), 
      referenceId: isReturnBook ? referenceId : undefined, 
      date: invoiceDate, 
      bookType: activeBook, 
      partyName, 
      items, 
      tradeDiscountPercent: tradeDiscount, 
      cashDiscountAmount: cashDiscount, 
      subTotal, 
      discountAmount: tradeDiscountAmount, 
      totalAmount, 
      posted: false 
    };

    addSubsidiaryEntry(newEntry);
    postSubsidiaryEntry(newEntry);
    
    setPartyName(''); 
    setItems([{ id: uuidv4(), description: '', quantity: 1, unit: 'Pcs', rate: 0, amount: 0 }]); 
    setTradeDiscount(0); setCashDiscount(0); setReferenceId('');
    alert(`Entry posted successfully. Ledger accounts and store register updated.`);
  };

  const config = useMemo(() => {
    const map = {
      'PURCHASE': { color: 'text-[#00f3ff]', icon: ShoppingCart, label: 'Purchase Book' },
      'SALES': { color: 'text-neon-green', icon: Store, label: 'Sales Book' },
      'PURCHASE_RETURN': { color: 'text-orange-400', icon: ArrowLeftRight, label: 'Returns Outward' },
      'SALES_RETURN': { color: 'text-pink-400', icon: ArrowLeftRight, label: 'Returns Inward' },
      'CASH': { color: 'text-yellow-400', icon: Wallet, label: 'Cash Journal' }
    };
    return map[activeBook];
  }, [activeBook]);

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
      <StockErrorModal {...stockError} onClose={() => setStockError({...stockError, isOpen: false})} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 max-w-7xl mx-auto">
        <div className="flex items-start gap-4">
          <div className={`p-3 bg-slate-900 border border-glass-border rounded-2xl ${config.color} shadow-xl`}><config.icon size={32} /></div>
          <div><h1 className="text-3xl font-bold text-white tracking-tight uppercase">{config.label}</h1><p className="text-gray-500 text-sm mt-1">Intelligent Source Document Recording</p></div>
        </div>
        <div className="flex bg-[#0a0f1c] p-1 rounded-2xl border border-glass-border">
          {(['PURCHASE', 'SALES', 'PURCHASE_RETURN', 'SALES_RETURN', 'CASH'] as SubsidiaryBookType[]).map((type) => (
             <button key={type} onClick={() => { setActiveBook(type); setViewMode('ENTRY'); }} className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${activeBook === type ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-white'}`}>
                {type === 'PURCHASE' && <ShoppingCart size={20}/>}
                {type === 'SALES' && <Store size={20}/>}
                {type === 'PURCHASE_RETURN' && <ArrowLeftRight size={20} className="text-orange-400"/>}
                {type === 'SALES_RETURN' && <ArrowLeftRight size={20} className="text-pink-400"/>}
                {type === 'CASH' && <Wallet size={20}/>}
             </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <div className="flex bg-[#0a0f1c] p-1 rounded-full border border-glass-border shadow-2xl">
           <button onClick={() => setViewMode('ENTRY')} className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${viewMode === 'ENTRY' ? 'bg-[#00f3ff] text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}>SOURCE ENTRY</button>
           <button onClick={() => setViewMode('REGISTER')} className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${viewMode === 'REGISTER' ? 'bg-slate-800 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>DAY BOOK REGISTER</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'ENTRY' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto bg-[#0f172a]/60 backdrop-blur-xl border border-glass-border rounded-[28px] p-6 md:p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-10">
              <div className="md:col-span-7 lg:col-span-8 relative">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">ACCOUNTING PARTY (LEDGER)</label>
                <div className="relative flex items-center">
                  <User className="absolute left-5 text-gray-600" size={18} />
                  <input type="text" value={partyName} onBlur={() => setTimeout(() => setShowPartyDropdown(false), 200)} onChange={(e) => { setPartyName(e.target.value); setShowPartyDropdown(true); }} className="w-full bg-slate-900/50 border border-gray-800 rounded-2xl pl-14 pr-6 py-4.5 text-white font-medium outline-none focus:border-[#00f3ff]/50 transition-all text-lg" placeholder="Select Customer or Supplier Name..." />
                </div>
                <AnimatePresence>{showPartyDropdown && filteredParties.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-full mt-2 w-full bg-[#0a0f1c] border border-glass-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl max-h-60 overflow-y-auto">
                       {filteredParties.map(p => (<div key={p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { setPartyName(p.name); setShowPartyDropdown(false); }} className="px-6 py-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 group transition-colors"><span className="text-white font-bold group-hover:text-[#00f3ff]">{p.name}</span><span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{p.type}</span></div>))}
                    </motion.div>
                )}</AnimatePresence>
              </div>
              <div className="md:col-span-5 lg:col-span-4 grid grid-cols-2 gap-4">
                <div><label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">BOOK DATE</label><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-slate-900/50 border border-gray-800 rounded-2xl px-5 py-4.5 text-white text-sm outline-none focus:border-[#00f3ff]/50 transition-all font-mono" /></div>
                <div className="relative"><label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">REF. DOC</label><div className={`group flex items-center bg-slate-900/50 border border-gray-800 rounded-2xl px-5 py-4.5 text-sm transition-all relative ${isReturnBook ? 'cursor-pointer hover:border-[#00f3ff]/50' : 'opacity-20 cursor-not-allowed'}`} onClick={() => isReturnBook && setShowRefDropdown(!showRefDropdown)}><LinkIcon size={14} className="mr-2 text-gray-700"/><span className="truncate text-gray-500">{referenceId || (isReturnBook ? 'Select Doc...' : 'Auto')}</span>{isReturnBook && <ChevronDown className="ml-auto" size={16}/>}</div><AnimatePresence>{showRefDropdown && isReturnBook && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-3 w-80 bg-[#0a0f1c] border border-glass-border rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl">
                       <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-2"><Search size={14} className="text-gray-500"/><input type="text" placeholder="Filter invoices..." value={refSearchQuery} onChange={(e) => setRefSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs text-white w-full"/></div>
                       <div className="max-h-64 overflow-y-auto">{availableRefs.filter(r => r.partyName.toLowerCase().includes(refSearchQuery.toLowerCase())).map(ref => (<div key={ref.id} onMouseDown={(e) => e.preventDefault()} onClick={() => handleSelectReference(ref)} className="px-6 py-5 hover:bg-white/10 cursor-pointer border-b border-white/5 flex justify-between items-center"><span className="text-neon-blue font-bold font-mono">{ref.invoiceNumber}</span><span className="text-xs text-white">₹{ref.totalAmount}</span></div>))}</div>
                    </motion.div>
                )}</AnimatePresence></div>
              </div>
            </div>

            <div className="mt-8">
              <div className="hidden lg:grid grid-cols-12 gap-6 mb-6 text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] px-4">
                 <div className="col-span-5 flex items-center gap-2"><Boxes size={14}/> STORE ITEM DESCRIPTION</div><div className="col-span-2 text-center">QUANTITY</div><div className="col-span-1 text-center">UNIT</div><div className="col-span-2 text-center">RATE (₹)</div><div className="col-span-2 text-right">TOTAL (₹)</div>
              </div>
              <div className="space-y-4">
                {items.map((item) => {
                  const query = item.description.toLowerCase().trim();
                  const suggestedItems = query ? inventoryItems.filter(i => i.name.toLowerCase().includes(query)) : [];
                  const isMasterLinked = inventoryItems.some(i => i.name.toLowerCase() === item.description.toLowerCase().trim() && item.description.trim().length > 0);

                  return (
                    <motion.div layout key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center bg-slate-900/40 p-4 lg:p-0 rounded-2xl lg:bg-transparent relative">
                      <div className="col-span-5 relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex gap-2">
                           {isMasterLinked && <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter" title="Linked to Store Master"><Check size={10}/> Master</span>}
                        </div>
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                          onFocus={() => setActiveItemLine(item.id)}
                          onBlur={() => setTimeout(() => setActiveItemLine(null), 250)}
                          className={`w-full bg-slate-900/50 lg:bg-transparent border border-gray-800 lg:border-none rounded-xl pl-4 pr-16 py-3 font-bold outline-none focus:bg-white/5 transition-all ${isMasterLinked ? 'text-[#00f3ff]' : 'text-gray-200'}`}
                          placeholder="Search or Enter Item Description..." 
                        />
                        <AnimatePresence>
                          {activeItemLine === item.id && suggestedItems.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-full mt-2 w-full bg-[#0a0f1c] border border-glass-border rounded-xl shadow-2xl z-[100] overflow-hidden max-h-48 overflow-y-auto backdrop-blur-3xl">
                              <div className="p-2 border-b border-white/5 bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Master Records Found</div>
                              {suggestedItems.map(inv => {
                                const inHand = getCurrentStockBalance(inv.id);
                                return (
                                  <div key={inv.id} onMouseDown={(e) => e.preventDefault()} onClick={() => selectInventoryItem(item.id, inv)} className="px-5 py-3 hover:bg-white/10 cursor-pointer flex justify-between items-center border-b border-white/5 group">
                                    <div className="flex flex-col">
                                       <span className="text-white font-bold group-hover:text-neon-blue transition-colors">{inv.name}</span>
                                       <span className="text-[9px] text-gray-600 font-mono">Last Pur. Rate: ₹{inv.lastPurchaseRate || '0.00'}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-right">
                                       <span className="text-gray-500 block">Available</span> 
                                       <span className={inHand > 0 ? 'text-emerald-400 font-bold' : 'text-red-400'}>{inHand} {inv.unit}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="col-span-2"><input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="w-full bg-slate-900/60 rounded-xl border border-gray-800 text-center text-white py-3 font-mono font-bold outline-none focus:border-neon-blue/30" placeholder="0" /></div>
                      <div className="col-span-1"><input type="text" value={item.unit} readOnly className="w-full bg-slate-900/60 rounded-xl border border-gray-800 text-center text-gray-500 py-3 text-[10px] font-black uppercase cursor-default" /></div>
                      <div className="col-span-2"><input type="number" value={item.rate || ''} onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))} className="w-full bg-slate-900/60 rounded-xl border border-gray-800 text-center text-white py-3 font-mono font-bold outline-none focus:border-neon-blue/30" placeholder="0.00" /></div>
                      <div className="col-span-2 flex items-center justify-end gap-4"><span className="font-mono font-black text-white text-lg min-w-[100px] text-right">₹{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span><button onClick={() => removeItem(item.id)} className="text-gray-700 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button></div>
                    </motion.div>
                  );
                })}
              </div>
              <button onClick={addItem} className="mt-8 text-[11px] font-black tracking-widest text-[#00f3ff] uppercase flex items-center gap-2 hover:opacity-80 transition-opacity bg-[#00f3ff]/5 border border-[#00f3ff]/20 px-6 py-3 rounded-xl"><Plus size={16}/> New Line Entry</button>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-10">
                 <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">TRADE DISCOUNT (%)</label>
                      <span className="text-xs font-mono font-black text-[#00f3ff]">{tradeDiscount}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="0.5" value={tradeDiscount} onChange={e => setTradeDiscount(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-[#00f3ff] cursor-pointer" />
                 </div>
                 <div className="relative">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">CASH DISCOUNT {isPurchaseContext ? 'RECEIVED' : 'ALLOWED'}</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={18} />
                      <input type="number" value={cashDiscount || ''} onChange={e => setCashDiscount(Number(e.target.value))} className="w-full bg-slate-900/50 border border-gray-800 rounded-2xl py-4.5 pl-12 pr-6 text-white font-mono outline-none focus:border-pink-500/30" placeholder="Fixed reduction amount..." />
                    </div>
                 </div>
               </div>
               <div className="bg-black/20 p-8 rounded-[32px] border border-white/5 shadow-inner space-y-4">
                  <div className="flex justify-between text-gray-500 text-sm"><span>Gross Total</span><span className="font-mono">₹{subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-red-500/80 text-sm italic"><span>Less: Trade Discount</span><span className="font-mono">({tradeDiscountAmount.toFixed(2)})</span></div>
                  {cashDiscount > 0 && <div className="flex justify-between text-pink-500/80 text-sm italic"><span>Less: Cash Discount</span><span className="font-mono">({cashDiscount.toFixed(2)})</span></div>}
                  <div className="flex justify-between items-end pt-8 border-t border-white/10"><span className="text-2xl font-bold text-white tracking-tight uppercase">Net Posting Value</span><span className={`text-4xl font-mono font-black ${isSalesBook ? 'text-neon-green' : 'text-[#00f3ff]'}`}>₹{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
               </div>
            </div>

            <div className="mt-12 flex justify-end">
               <button onClick={handleSaveEntry} className={`px-12 py-5 ${isSalesBook ? 'bg-neon-green text-black' : 'bg-[#00f3ff] text-slate-950'} font-black text-[13px] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest`}>
                 <FileText size={20}/> CONFIRM & POST TO REGISTER
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto bg-slate-900 border border-glass-border rounded-[28px] overflow-hidden shadow-2xl overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-white/5">
                 <tr><th className="p-8">Document #</th><th className="p-8">Date</th><th className="p-8">Party Account</th><th className="p-8 text-right">Net Posted (₹)</th><th className="p-8 text-center">Status</th></tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {subsidiaryEntries.filter(e => e.bookType === activeBook).map(entry => (
                   <tr key={entry.id} className="hover:bg-white/[0.02] transition-all"><td className="p-8 font-mono text-xs text-[#00f3ff] font-bold">{entry.invoiceNumber}</td><td className="p-8 font-mono text-xs text-gray-500">{entry.date}</td><td className="p-8 text-white font-bold">{entry.partyName}</td><td className="p-8 text-right font-mono font-black text-white text-lg">₹{entry.totalAmount.toLocaleString()}</td><td className="p-8 text-center"><span className="text-neon-green text-[10px] font-black border border-neon-green/20 px-4 py-2 rounded-full bg-neon-green/5 tracking-widest uppercase">Verified & Posted</span></td></tr>
                 ))}
                 {subsidiaryEntries.filter(e => e.bookType === activeBook).length === 0 && (
                   <tr><td colSpan={5} className="p-20 text-center text-gray-600 font-black uppercase tracking-widest text-xs italic">Archive Empty • No Transactions Recorded</td></tr>
                 )}
               </tbody>
             </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubsidiaryBooksView;
