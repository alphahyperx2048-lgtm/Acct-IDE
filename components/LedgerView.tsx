
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from '../types';
import { TrendingUp, TrendingDown, Layers, BookOpen, ArrowRight, Loader2, Search, Activity, Scale, CreditCard } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';

interface LedgerViewProps {
  setView?: (view: ViewMode) => void;
}

const LedgerView: React.FC<LedgerViewProps> = ({ setView }) => {
  const { accounts, entries, formatAmount } = useAccounting();
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const ledgers = useMemo(() => {
    return accounts.map(account => {
      const accountLines = entries.flatMap(entry => {
        const line = entry.lines.find(l => l.accountId === account.id);
        if (!line) return [];
        
        const oppositeLines = entry.lines.filter(l => l.type !== line.type);
        const prefix = line.type === 'DEBIT' ? 'To ' : 'By ';
        
        let particulars = '';
        if (oppositeLines.length === 1) {
          particulars = prefix + oppositeLines[0].accountName;
        } else if (oppositeLines.length > 1) {
          particulars = prefix + oppositeLines.map(l => l.accountName).join(' & ');
        } else {
          particulars = prefix + 'Self (Opening/Adj)';
        }

        return [{
          entryId: entry.id,
          date: entry.date,
          particulars: particulars,
          debit: line.type === 'DEBIT' ? line.amount : undefined,
          credit: line.type === 'CREDIT' ? line.amount : undefined,
        }];
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const totalDebit = accountLines.reduce((sum, item) => sum + (item.debit || 0), 0);
      const totalCredit = accountLines.reduce((sum, item) => sum + (item.credit || 0), 0);
      const netBalance = totalDebit - totalCredit;

      return {
        account,
        entries: accountLines,
        balance: netBalance,
        totalDebit,
        totalCredit
      };
    }).filter(l => l.entries.length > 0 || l.account.code === '1001' || l.account.code === '2001');
  }, [accounts, entries]);

  const filteredLedgers = ledgers.filter(ledger => 
    ledger.account.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ledger.account.code.includes(searchTerm)
  );

  const handlePostToTrialBalance = () => {
    if (!setView) return;
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setView(ViewMode.TRIAL_BALANCE);
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 selection:bg-neon-purple/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter flex items-center gap-3 md:gap-4 uppercase">
            <div className="p-2 md:p-3 bg-neon-purple/10 rounded-xl md:rounded-2xl border border-neon-purple/20">
               <Layers className="text-neon-purple w-6 h-6 md:w-8 md:h-8" size={32}/>
            </div>
            GENRAL LEDGER
          </h2>
          <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
             <div className="flex items-center gap-2 text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
               <Activity size={12} className="text-neon-green" />
               <span className="hidden xs:inline">Live Account Verification Engine</span>
               <span className="xs:hidden">Live Engine</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-gray-800" />
             <div className="text-gray-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{ledgers.length} Accounts</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-purple transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter Profiles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 md:py-4 bg-[#0a0f1c] border border-glass-border rounded-[15px] md:rounded-[20px] text-white outline-none focus:border-neon-purple/50 transition-all text-xs md:text-sm shadow-2xl"
            />
          </div>

          {setView && (
            <button 
              onClick={handlePostToTrialBalance}
              disabled={isPosting}
              className="w-full md:w-auto flex items-center justify-center gap-4 px-6 md:px-10 py-3 md:py-4 rounded-[15px] md:rounded-[20px] bg-white text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 group"
            >
              {isPosting ? <Loader2 size={16} className="animate-spin" /> : <>TRIAL BALANCE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          )}
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 max-w-7xl mx-auto"
      >
        {filteredLedgers.map((ledger) => {
          const isDebitBalance = ledger.balance >= 0;
          const absBalance = Math.abs(ledger.balance);
          const grandTotal = Math.max(ledger.totalDebit, ledger.totalCredit);
          const balanceWidth = grandTotal > 0 ? (absBalance / grandTotal) * 100 : 0;

          return (
            <motion.div
              key={ledger.account.id}
              variants={itemVariants}
              className="group relative bg-[#0a0f1c] border border-glass-border rounded-2xl md:rounded-[40px] overflow-hidden hover:border-white/10 transition-all shadow-2xl flex flex-col h-auto md:h-[700px] border-b-4 border-b-transparent hover:border-b-neon-purple"
            >
              <div className="p-6 md:p-10 pb-6 md:pb-8 border-b border-glass-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-neon-purple/5 rounded-full blur-[60px] md:blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start relative z-10 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest">{ledger.account.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${isDebitBalance ? 'text-neon-green border-neon-green/20' : 'text-orange-400 border-orange-400/20'}`}>
                        {ledger.account.type} Profile
                      </span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white truncate tracking-tighter uppercase group-hover:text-neon-purple transition-colors">
                      {ledger.account.name}
                    </h3>
                  </div>
                  
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                    <div className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Position Net</div>
                    <div className={`text-2xl md:text-3xl font-mono font-black ${isDebitBalance ? 'text-neon-green' : 'text-orange-400'}`}>
                      ₹{formatAmount(absBalance)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 space-y-2">
                   <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-500">
                      <span>Capital Utilization</span>
                      <span>{balanceWidth.toFixed(1)}% Scale</span>
                   </div>
                   <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${balanceWidth}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${isDebitBalance ? 'bg-neon-green' : 'bg-orange-400'} shadow-[0_0_10px_currentColor] opacity-60`}
                      />
                   </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row flex-1 text-[10px] md:text-[11px] font-mono overflow-hidden">
                {/* DEBIT SIDE */}
                <div className="flex-1 border-r border-white/5 flex flex-col min-h-[200px] md:min-h-0">
                  <div className="bg-emerald-500/5 px-4 py-2 text-center text-[9px] md:text-[10px] text-emerald-500 font-black border-b border-glass-border tracking-[0.4em]">DR</div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-2 md:space-y-3">
                    {ledger.entries.filter(e => e.debit).map((e, i) => (
                      <div key={i} className="flex flex-col py-2 border-b border-white/[0.03] group/line">
                         <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-400 group-hover/line:text-white transition-colors truncate">{e.particulars}</span>
                            <span className="text-neon-green font-bold shrink-0">{formatAmount(e.debit || 0)}</span>
                         </div>
                         <div className="flex justify-between mt-1 opacity-40 text-[7px] md:text-[8px] font-sans">
                            <span>{e.date.split('T')[0]}</span>
                            <span className="hidden xs:inline">#TXN_{e.entryId.slice(0, 4)}</span>
                         </div>
                      </div>
                    ))}
                    {!isDebitBalance && absBalance > 0 && (
                      <div className="py-2 md:py-4 px-3 md:px-5 bg-white/5 border border-dashed border-white/10 rounded-xl md:rounded-2xl mt-2 md:mt-4">
                        <div className="flex justify-between font-black text-neon-blue italic uppercase tracking-tighter text-[9px] md:text-[11px]">
                          <span>To Balance c/d</span>
                          <span>{formatAmount(absBalance)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6 bg-black/40 text-right font-mono font-black text-gray-600 border-t border-glass-border text-[10px] md:text-xs">
                    {formatAmount(grandTotal)}
                  </div>
                </div>

                {/* CREDIT SIDE */}
                <div className="flex-1 flex flex-col bg-white/[0.01] min-h-[200px] md:min-h-0">
                  <div className="bg-orange-500/5 px-4 py-2 text-center text-[9px] md:text-[10px] text-orange-400 font-black border-b border-glass-border tracking-[0.4em]">CR</div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-2 md:space-y-3">
                    {ledger.entries.filter(e => e.credit).map((e, i) => (
                      <div key={i} className="flex flex-col py-2 border-b border-white/[0.03] group/line">
                         <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-400 group-hover/line:text-white transition-colors truncate">{e.particulars}</span>
                            <span className="text-orange-400 font-bold shrink-0">{formatAmount(e.credit || 0)}</span>
                         </div>
                         <div className="flex justify-between mt-1 opacity-40 text-[7px] md:text-[8px] font-sans">
                            <span>{e.date.split('T')[0]}</span>
                            <span className="hidden xs:inline">#TXN_{e.entryId.slice(0, 4)}</span>
                         </div>
                      </div>
                    ))}
                    {isDebitBalance && absBalance > 0 && (
                      <div className="py-2 md:py-4 px-3 md:px-5 bg-white/5 border border-dashed border-white/10 rounded-xl md:rounded-2xl mt-2 md:mt-4">
                        <div className="flex justify-between font-black text-neon-blue italic uppercase tracking-tighter text-[9px] md:text-[11px]">
                          <span>By Balance c/d</span>
                          <span>{formatAmount(absBalance)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-6 bg-black/40 text-right font-mono font-black text-gray-600 border-t border-glass-border text-[10px] md:text-xs">
                    {formatAmount(grandTotal)}
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-10 py-4 md:py-5 bg-[#0a0f1c] border-t border-glass-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                   <div className="hidden xs:flex -space-x-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[7px] md:text-[8px] font-black text-gray-500">L</div>
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[7px] md:text-[8px] font-black text-gray-500">P</div>
                   </div>
                   <span className="text-[8px] md:text-[9px] text-gray-600 font-black uppercase tracking-widest truncate">Profile Finalized • V2.5</span>
                </div>
                <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 rounded-full border text-[8px] md:text-[10px] font-black whitespace-nowrap ${isDebitBalance ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                  {isDebitBalance ? 'DEBIT OK' : 'CREDIT OK'}
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDebitBalance ? 'bg-neon-green' : 'bg-orange-400'}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      
      {filteredLedgers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 md:py-40 text-gray-600">
           <Search size={48} className="md:w-16 md:h-16 mb-6 opacity-20" />
           <p className="text-sm md:text-xl font-black uppercase tracking-widest opacity-40">No Ledgers Matches</p>
        </div>
      )}
    </div>
  );
};

export default LedgerView;
