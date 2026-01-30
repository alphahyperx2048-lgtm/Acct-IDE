
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Plus, History, ArrowDownLeft, ArrowUpRight, Calendar, User, 
  Hash, Save, CheckCircle2, AlertTriangle, Search, Info, RefreshCw,
  Shuffle, Calculator, DollarSign, Landmark, Percent, AlertOctagon, TrendingDown,
  UserPlus
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { CashBookEntry, Account } from '../types';
import { v4 as uuidv4 } from 'uuid';
import AccountRegisterModal from './AccountRegisterModal';

const CashBookView: React.FC = () => {
  const { cashBookEntries, addCashBookEntry, accounts, balanceCashBook, createAccount, getAccountByName } = useAccounting();
  
  const [viewMode, setViewMode] = useState<'NEW' | 'REGISTER'>('NEW');
  const [txnType, setTxnType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [accountQuery, setAccountQuery] = useState('');
  const [selectedAcc, setSelectedAcc] = useState<Account | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [bankAmount, setBankAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isContra, setIsContra] = useState(false);
  const [isOpeningBal, setIsOpeningBal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [registrationData, setRegistrationData] = useState<{name: string} | null>(null);
  const [showBalancedSummary, setShowBalancedSummary] = useState<{cash: number, bank: number} | null>(null);

  const filteredAccounts = useMemo(() => {
    const query = accountQuery.toLowerCase();
    if (!query) return [];
    return accounts.filter(a => a.name.toLowerCase().includes(query) && a.name !== 'Cash A/c' && a.name !== 'Bank A/c');
  }, [accountQuery, accounts]);

  const totalTxnValue = cashAmount + bankAmount + discountAmount;

  const handlePost = () => {
    if (!selectedAcc && !isContra) {
      const existing = getAccountByName(accountQuery);
      if (existing) {
        setSelectedAcc(existing);
      } else if (accountQuery.trim()) {
        setRegistrationData({ name: accountQuery });
        return;
      } else {
        alert("Please select or enter an account head.");
        return;
      }
    }

    if (totalTxnValue <= 0) {
      alert("Transaction value must be greater than zero.");
      return;
    }

    const entry: CashBookEntry = {
      id: uuidv4(),
      date,
      type: txnType,
      accountId: selectedAcc?.id || '',
      accountName: isContra ? (txnType === 'RECEIPT' ? 'Contra: Bank to Cash' : 'Contra: Cash to Bank') : selectedAcc!.name,
      particulars: isOpeningBal ? 'Balance b/d' : (isContra ? 'Contra Entry' : `Being ${txnType.toLowerCase()} ${txnType === 'RECEIPT' ? 'from' : 'to'} ${selectedAcc?.name}`),
      cashAmount,
      bankAmount,
      discountAmount,
      isContra,
      isOpeningBalance: isOpeningBal,
      posted: true
    };

    addCashBookEntry(entry);
    resetForm();
    alert(isOpeningBal ? "Opening Balance Posted to Ledger!" : "Cash Book Entry Posted!");
  };

  const resetForm = () => {
    setAccountQuery('');
    setSelectedAcc(null);
    setCashAmount(0);
    setBankAmount(0);
    setDiscountAmount(0);
    setIsContra(false);
    setIsOpeningBal(false);
  };

  const toggleContra = () => {
    setIsContra(!isContra);
    if (!isContra) {
      setSelectedAcc(null);
      setAccountQuery(txnType === 'RECEIPT' ? 'Bank A/c' : 'Cash A/c');
    }
  };

  const receipts = useMemo(() => cashBookEntries.filter(e => e.type === 'RECEIPT'), [cashBookEntries]);
  const payments = useMemo(() => cashBookEntries.filter(e => e.type === 'PAYMENT'), [cashBookEntries]);

  const currentBalances = useMemo(() => balanceCashBook(date), [cashBookEntries, date]);

  const handleForceBalance = () => {
    const bal = balanceCashBook(date);
    setShowBalancedSummary(bal);
    setTimeout(() => setShowBalancedSummary(null), 5000);
  };

  const TableRow: React.FC<{ entry: CashBookEntry; side: 'Dr' | 'Cr' }> = ({ entry, side }) => (
    <div className="grid grid-cols-12 text-[11px] font-mono border-b border-white/5 py-2.5 px-3 hover:bg-white/5 transition-colors group">
      <div className="col-span-2 text-gray-500">{entry.date}</div>
      <div className="col-span-4 text-white font-bold truncate">
        {entry.particulars.includes('Balance') ? entry.particulars : (side === 'Dr' ? 'To ' : 'By ') + entry.accountName}
      </div>
      <div className="col-span-1 text-center text-neon-blue font-black">{entry.isContra ? 'C' : ''}</div>
      <div className="col-span-2 text-right text-neon-green">{entry.cashAmount > 0 ? entry.cashAmount.toFixed(2) : '-'}</div>
      <div className="col-span-2 text-right text-cyan-400">{entry.bankAmount > 0 ? entry.bankAmount.toFixed(2) : '-'}</div>
      <div className="col-span-1 text-right text-pink-400">{entry.discountAmount > 0 ? entry.discountAmount.toFixed(2) : '-'}</div>
    </div>
  );

  return (
    <div className="h-full w-full bg-[#050b14] overflow-hidden flex flex-col p-4 md:p-8">
      <AccountRegisterModal 
        isOpen={!!registrationData} 
        onClose={() => setRegistrationData(null)} 
        accountName={registrationData?.name || ''} 
        onSuccess={(acc) => { setSelectedAcc(acc); setAccountQuery(acc.name); setRegistrationData(null); }} 
      />

      <div className="flex justify-center mb-10 shrink-0">
        <div className="flex bg-[#0a0f1c] p-1 rounded-full border border-glass-border shadow-2xl">
          <button onClick={() => setViewMode('NEW')} className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${viewMode === 'NEW' ? 'bg-white text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}>NEW ENTRY</button>
          <button onClick={() => setViewMode('REGISTER')} className={`px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${viewMode === 'REGISTER' ? 'bg-white text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}>VIEW REGISTER</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'NEW' ? (
          <motion.div key="new-entry" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 max-w-4xl mx-auto w-full bg-[#0F172A]/80 backdrop-blur-2xl border border-glass-border rounded-[32px] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col overflow-y-auto no-scrollbar">
            <div className="flex gap-4 mb-10">
              <button onClick={() => setTxnType('RECEIPT')} className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all ${txnType === 'RECEIPT' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700'}`}><ArrowDownLeft size={24} /> <span className="font-black uppercase tracking-widest">RECEIPT (In)</span></button>
              <button onClick={() => setTxnType('PAYMENT')} className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all ${txnType === 'PAYMENT' ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-700'}`}><ArrowUpRight size={24} /> <span className="font-black uppercase tracking-widest">PAYMENT (Out)</span></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="relative">
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">{txnType === 'RECEIPT' ? 'FROM ACCOUNT' : 'TO ACCOUNT'}</label>
                <div className="relative flex items-center">
                   <User className="absolute left-4 text-gray-600" size={18} />
                   <input type="text" value={accountQuery} disabled={isContra} onChange={(e) => { setAccountQuery(e.target.value); setShowSuggestions(true); }} className="w-full bg-slate-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-5 text-white font-bold outline-none focus:border-neon-blue/50 disabled:opacity-50" placeholder={isContra ? "CONTRA MODE" : "Select Account..."} />
                   {!isContra && accountQuery && !selectedAcc && !filteredAccounts.length && (
                     <button onClick={() => setRegistrationData({name: accountQuery})} className="absolute right-4 p-2 bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-black transition-all"><UserPlus size={16}/></button>
                   )}
                </div>
                {showSuggestions && filteredAccounts.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-[#0a0f1c] border border-glass-border rounded-2xl shadow-2xl z-50 mt-2 overflow-hidden">
                    {filteredAccounts.map(acc => (
                      <div key={acc.id} onClick={() => { setSelectedAcc(acc); setAccountQuery(acc.name); setShowSuggestions(false); }} className="px-6 py-4 hover:bg-white/5 cursor-pointer flex justify-between items-center group">
                         <span className="text-white font-bold group-hover:text-neon-blue">{acc.name}</span>
                         <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{acc.type}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-neon-purple/10 border border-neon-purple/30 px-4 py-2 rounded-xl text-neon-purple text-[10px] font-black uppercase tracking-widest">
                      <input type="checkbox" checked={isOpeningBal} onChange={e => setIsOpeningBal(e.target.checked)} className="rounded bg-black border-neon-purple/50" />
                      Opening Balance
                    </label>
                    <button onClick={toggleContra} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isContra ? 'bg-neon-blue text-slate-950' : 'bg-slate-900 text-gray-500 border border-gray-800'}`}><Shuffle size={14} /> Contra</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">DATE</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-4 text-gray-600" size={18} />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-5 text-white font-bold outline-none font-mono" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-2 text-emerald-400 mb-4"><DollarSign size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">CASH</span></div>
                <input type="number" value={cashAmount || ''} onChange={e => setCashAmount(Number(e.target.value))} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none focus:border-emerald-400" placeholder="0.00" />
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border group hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-2 text-cyan-400 mb-4"><Landmark size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">BANK</span></div>
                <input type="number" value={bankAmount || ''} onChange={e => setBankAmount(Number(e.target.value))} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none focus:border-cyan-400" placeholder="0.00" />
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border group hover:border-pink-500/50 transition-all">
                <div className="flex items-center gap-2 text-pink-400 mb-4"><Percent size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">DISCOUNT</span></div>
                <input type="number" value={discountAmount || ''} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none focus:border-pink-400" placeholder="0.00" />
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-xs font-mono text-gray-500 w-full md:w-auto">
                 <div className="flex justify-between w-full md:gap-12 text-lg">
                   <span className="text-white font-black uppercase">Post Value</span> 
                   <span className="text-yellow-400 font-black">₹{totalTxnValue.toFixed(2)}</span>
                 </div>
              </div>
              <button onClick={handlePost} className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-[13px] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em]"><Save size={20}/> POST ENTRY</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
               <div className="bg-[#0a0f1c] border border-glass-border p-5 rounded-[24px] flex justify-between items-center shadow-xl">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><DollarSign size={20}/></div>
                   <div>
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Cash Balance</span>
                     <div className="text-xl font-mono font-black text-white">₹{currentBalances.cash.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                   </div>
                 </div>
               </div>
               <div className={`p-5 rounded-[24px] border flex justify-between items-center shadow-xl transition-all ${currentBalances.bank < 0 ? 'bg-orange-500/10 border-orange-500/50' : 'bg-[#0a0f1c] border-glass-border'}`}>
                 <div className="flex items-center gap-3">
                   <div className={`p-3 rounded-xl ${currentBalances.bank < 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/10 text-cyan-400'}`}><Landmark size={20}/></div>
                   <div>
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Bank Balance</span>
                     <div className={`text-xl font-mono font-black ${currentBalances.bank < 0 ? 'text-orange-400' : 'text-white'}`}>₹{Math.abs(currentBalances.bank).toLocaleString(undefined, {minimumFractionDigits: 2})} {currentBalances.bank < 0 ? 'Cr' : 'Dr'}</div>
                   </div>
                 </div>
               </div>
            </div>

            <div className="flex justify-between items-center shrink-0">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 flex items-center gap-2"><History size={16}/> Triple Column Register</h3>
               <button onClick={handleForceBalance} className="px-6 py-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-neon-blue/20 transition-all flex items-center gap-2"><Calculator size={14}/> Force Balance Check</button>
            </div>

            <AnimatePresence>
              {showBalancedSummary && (
                <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-3"><CheckCircle2 className="text-neon-blue"/><span className="text-xs font-black text-white uppercase tracking-widest">Balancing Complete: Carried Forward</span></div>
                   <div className="flex gap-10 font-mono text-sm">
                      <div className="text-emerald-400"><span className="text-gray-500">Cash c/d:</span> ₹{showBalancedSummary.cash.toFixed(2)}</div>
                      <div className="text-cyan-400"><span className="text-gray-500">Bank c/d:</span> ₹{showBalancedSummary.bank.toFixed(2)}</div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
               <div className="bg-[#0F172A] border border-glass-border rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="bg-emerald-500/10 p-4 text-center border-b border-white/5 flex justify-between items-center px-6"><span className="text-[10px] font-black text-emerald-500 tracking-[0.3em]">Dr. RECEIPTS</span><ArrowDownLeft size={16}/></div>
                  <div className="grid grid-cols-12 bg-white/5 text-[9px] font-black text-gray-500 uppercase py-2 px-3 border-b border-white/10 tracking-widest"><div className="col-span-2">Date</div><div className="col-span-4">Particulars</div><div className="col-span-1 text-center">L.F.</div><div className="col-span-2 text-right">Cash</div><div className="col-span-2 text-right">Bank</div><div className="col-span-1 text-right">Disc.</div></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {receipts.map(e => <TableRow key={e.id} entry={e} side="Dr" />)}
                  </div>
               </div>
               <div className="bg-[#0F172A] border border-glass-border rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="bg-orange-500/10 p-4 text-center border-b border-white/5 flex justify-between items-center px-6"><span className="text-[10px] font-black text-orange-400 tracking-[0.3em]">Cr. PAYMENTS</span><ArrowUpRight size={16}/></div>
                  <div className="grid grid-cols-12 bg-white/5 text-[9px] font-black text-gray-500 uppercase py-2 px-3 border-b border-white/10 tracking-widest"><div className="col-span-2">Date</div><div className="col-span-4">Particulars</div><div className="col-span-1 text-center">L.F.</div><div className="col-span-2 text-right">Cash</div><div className="col-span-2 text-right">Bank</div><div className="col-span-1 text-right">Disc.</div></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {payments.map(e => <TableRow key={e.id} entry={e} side="Cr" />)}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashBookView;
