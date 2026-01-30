
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Plus, History, ArrowDownLeft, ArrowUpRight, Calendar, User, 
  Save, Search, Info, RefreshCw, Shuffle, Calculator, DollarSign, 
  Landmark, Percent, UserPlus, CheckCircle2
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

  const filteredAccounts = useMemo(() => {
    const query = accountQuery.toLowerCase();
    if (!query) return [];
    return accounts.filter(a => a.name.toLowerCase().includes(query) && a.name !== 'Cash A/c' && a.name !== 'Bank A/c');
  }, [accountQuery, accounts]);

  const validateAndSet = (val: string, setter: (n: number) => void) => {
    const filtered = val.replace(/[^0-9.]/g, '');
    setter(filtered === '' ? 0 : parseFloat(filtered));
  };

  const handlePost = () => {
    if (!selectedAcc && !isContra) {
      const existing = getAccountByName(accountQuery);
      if (existing) setSelectedAcc(existing);
      else if (accountQuery.trim()) { setRegistrationData({ name: accountQuery }); return; }
      else return;
    }

    const entry: CashBookEntry = {
      id: uuidv4(),
      date,
      type: txnType,
      accountId: selectedAcc?.id || '',
      accountName: isContra ? (txnType === 'RECEIPT' ? 'Contra: Bank to Cash' : 'Contra: Cash to Bank') : selectedAcc!.name,
      particulars: isOpeningBal ? 'Balance b/d' : (isContra ? 'Contra Entry' : `Being ${txnType.toLowerCase()}`),
      cashAmount,
      bankAmount,
      discountAmount,
      isContra,
      isOpeningBalance: isOpeningBal,
      posted: true
    };

    addCashBookEntry(entry);
    setAccountQuery(''); setSelectedAcc(null); setCashAmount(0); setBankAmount(0); setDiscountAmount(0);
  };

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
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 max-w-4xl mx-auto w-full bg-[#0F172A]/80 backdrop-blur-2xl border border-glass-border rounded-[32px] p-8 md:p-12 shadow-2xl overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
               <div className="relative">
                 <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">ACCOUNT HEAD</label>
                 <input type="text" value={accountQuery} onChange={(e) => { setAccountQuery(e.target.value); setShowSuggestions(true); }} className="w-full bg-slate-900 border border-gray-800 rounded-2xl p-5 text-white font-bold outline-none" />
               </div>
               <div>
                 <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 block">DATE</label>
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-gray-800 rounded-2xl p-5 text-white font-bold outline-none font-mono" />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border">
                <div className="flex items-center gap-2 text-emerald-400 mb-4 font-black">CASH</div>
                <input type="text" value={cashAmount || ''} onChange={e => validateAndSet(e.target.value, setCashAmount)} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none" placeholder="0.00" />
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border">
                <div className="flex items-center gap-2 text-cyan-400 mb-4 font-black">BANK</div>
                <input type="text" value={bankAmount || ''} onChange={e => validateAndSet(e.target.value, setBankAmount)} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none" placeholder="0.00" />
              </div>
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-glass-border">
                <div className="flex items-center gap-2 text-pink-400 mb-4 font-black">DISCOUNT</div>
                <input type="text" value={discountAmount || ''} onChange={e => validateAndSet(e.target.value, setDiscountAmount)} className="w-full bg-transparent border-b border-gray-800 text-3xl font-mono font-black text-white outline-none" placeholder="0.00" />
              </div>
            </div>
            <button onClick={handlePost} className="w-full py-5 bg-yellow-500 text-slate-950 font-black text-[13px] rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-[0.2em]">POST ENTRY</button>
          </motion.div>
        ) : (
          <div className="text-gray-500 text-center p-20">Viewing Register...</div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashBookView;
