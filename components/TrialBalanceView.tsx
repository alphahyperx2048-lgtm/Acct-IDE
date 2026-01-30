
import React, { useMemo } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { LayoutDashboard, AlertTriangle, CheckCircle2, ArrowRight, XCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewMode } from '../types';

interface TrialBalanceViewProps {
  setView?: (view: ViewMode) => void;
}

const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({ setView }) => {
  const { accounts, entries, formatAmount } = useAccounting();

  const tbData = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map(account => {
      let balance = 0;
      let hasEntries = false;

      entries.forEach(entry => {
        entry.lines.forEach(line => {
          if (line.accountId === account.id) {
            hasEntries = true;
            if (line.type === 'DEBIT') balance += line.amount;
            else balance -= line.amount;
          }
        });
      });

      const isDebit = balance > 0.001;
      const isCredit = balance < -0.001;
      const absBal = Math.abs(balance);

      if (isDebit) totalDebit += absBal;
      if (isCredit) totalCredit += absBal;

      const isReturn = account.name.toLowerCase().includes('return');
      let isAnomaly = false;
      if (absBal > 0.01) {
          if (['ASSET', 'EXPENSE'].includes(account.type) && isCredit && !isReturn) isAnomaly = true;
          if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.type) && isDebit && !isReturn) isAnomaly = true;
      }

      return { account, debit: isDebit ? absBal : 0, credit: isCredit ? absBal : 0, isAnomaly, hasEntries, balance };
    }).filter(row => row.hasEntries || row.account.code === '1001');

    return { rows, totalDebit, totalCredit };
  }, [accounts, entries]);

  const difference = Math.abs(tbData.totalDebit - tbData.totalCredit);
  const isBalanced = difference < 0.01;
  const canProceed = isBalanced;

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 font-sans pb-32 no-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 uppercase">
            <LayoutDashboard className="text-neon-green" /> Trial Balance
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-50">Integrity Validation Stage</p>
        </div>

        <div className={`px-5 py-3 rounded-2xl border flex items-center gap-3 transition-all ${isBalanced ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
          {isBalanced ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} className="animate-pulse" />}
          <div><div className="text-[10px] font-black uppercase tracking-widest opacity-70">Control Status</div><div className="font-mono font-black">{isBalanced ? 'BALANCED' : `DIFF: ${formatAmount(difference)}`}</div></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-glass-border rounded-[32px] shadow-2xl overflow-hidden relative mb-10">
        <div className="grid grid-cols-12 bg-white/5 border-b border-glass-border p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <div className="col-span-1">L.F.</div><div className="col-span-5">Heads of Accounts</div><div className="col-span-2 text-center">Nature</div><div className="col-span-2 text-right">Debit (₹)</div><div className="col-span-2 text-right">Credit (₹)</div>
        </div>
        <div className="divide-y divide-white/5">
          {tbData.rows.map((row) => (
            <div key={row.account.id} className="grid grid-cols-12 p-5 text-sm hover:bg-white/[0.02] transition-colors items-center group">
              <div className="col-span-1 font-mono text-gray-600 group-hover:text-white">{row.account.code}</div>
              <div className="col-span-5 font-black text-gray-200 group-hover:text-white flex items-center gap-3">
                {row.account.name}
                {row.isAnomaly && <AlertTriangle size={14} className="text-orange-500" title="Balance nature mismatch detected"/>}
              </div>
              <div className="col-span-2 flex justify-center"><span className="text-[9px] font-black px-2 py-1 rounded border border-white/5 uppercase tracking-widest bg-white/5 text-gray-500">{row.account.type}</span></div>
              <div className="col-span-2 text-right font-mono font-black text-white">{row.debit > 0 ? formatAmount(row.debit) : '-'}</div>
              <div className="col-span-2 text-right font-mono font-black text-white">{row.credit > 0 ? formatAmount(row.credit) : '-'}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 bg-black/40 border-t border-glass-border p-6 text-sm font-black text-white">
          <div className="col-span-8 text-right pr-10 uppercase tracking-widest text-gray-500 text-[10px]">Fiscal Cycle Aggregation</div>
          <div className="col-span-2 text-right font-mono text-neon-green text-lg">{formatAmount(tbData.totalDebit)}</div>
          <div className="col-span-2 text-right font-mono text-neon-green text-lg">{formatAmount(tbData.totalCredit)}</div>
        </div>
      </div>

      {setView && (
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#0a0f1c] p-8 rounded-[32px] border border-glass-border gap-6">
           <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${canProceed ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
                 {canProceed ? <CheckCircle2 size={32}/> : <XCircle size={32}/>}
              </div>
              <div className="max-w-md">
                 <h4 className="text-white text-xl font-black uppercase tracking-tight">{canProceed ? 'Verification Success' : 'Integrity Error'}</h4>
                 <p className="text-gray-500 text-[10px] font-medium leading-relaxed uppercase tracking-widest mt-1">{canProceed ? 'The Trial Balance matches. You can proceed to generate final statements.' : 'Trial Balance mismatch detected. System refuses to generate financial statements until balanced.'}</p>
              </div>
           </div>
           <button 
             onClick={() => canProceed && setView(ViewMode.FINAL_ACCOUNTS)}
             disabled={!canProceed}
             className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canProceed ? 'bg-orange-500 text-white shadow-xl hover:scale-105 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'}`}
           >
             GENERATE FINAL STATEMENTS <ArrowRight size={20} />
           </button>
        </div>
      )}
    </div>
  );
};

export default TrialBalanceView;
