
import React, { useMemo, useState } from 'react';
import { useAccounting } from '../context/AccountingContext';
import { FileSpreadsheet, Package, TrendingUp, MinusCircle, PlusCircle, CreditCard, Info, AlertOctagon, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FinalAccountsView: React.FC = () => {
  const { accounts, entries, stockTransactions, getFiscalAnalysis } = useAccounting();
  const [activeTab, setActiveTab] = useState<'TRADING' | 'PL' | 'BS'>('TRADING');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const fiscalSummary = useMemo(() => getFiscalAnalysis(), [getFiscalAnalysis]);

  const data = useMemo(() => {
    const ledgerBalances = accounts.map(acc => {
      let balance = 0;
      entries.forEach(entry => {
        entry.lines.forEach(line => {
          if (line.accountId === acc.id) {
            if (line.type === 'DEBIT') balance += line.amount;
            else balance -= line.amount;
          }
        });
      });
      return { 
        ...acc, rawBalance: balance, absBalance: Math.abs(balance),
        isDebit: balance > 0, isCredit: balance < 0
      };
    }).filter(a => a.absBalance > 0.001);

    const salesAcc = ledgerBalances.find(a => a.name === 'Sales A/c');
    const salesReturnAcc = ledgerBalances.find(a => a.name === 'Sales Return A/c');
    const purchaseAcc = ledgerBalances.find(a => a.name === 'Purchase A/c');
    const purchaseReturnAcc = ledgerBalances.find(a => a.name === 'Purchase Return A/c');

    const grossSales = salesAcc?.absBalance || 0;
    const salesReturn = salesReturnAcc?.absBalance || 0;
    const netSales = Math.max(0, grossSales - salesReturn);

    const grossPurchases = purchaseAcc?.absBalance || 0;
    const purchaseReturn = purchaseReturnAcc?.absBalance || 0;
    const netPurchases = Math.max(0, grossPurchases - purchaseReturn);

    const openingStock = fiscalSummary.openingStock; 
    const closingStock = fiscalSummary.closingStock;

    const directExpenses = ledgerBalances.filter(a => 
      a.type === 'EXPENSE' && a.finalAccountCategory === 'DIRECT' && 
      a.name !== 'Purchase A/c' && a.name !== 'Sales Return A/c'
    );

    const totalDirectExp = openingStock + netPurchases + directExpenses.reduce((sum, a) => sum + a.absBalance, 0);
    const totalDirectInc = netSales + closingStock;
    
    const grossProfit = totalDirectInc > totalDirectExp ? totalDirectInc - totalDirectExp : 0;
    const grossLoss = totalDirectExp > totalDirectInc ? totalDirectExp - totalDirectInc : 0;
    const tradingTotal = Math.max(totalDirectExp + grossProfit, totalDirectInc + grossLoss);

    const indirectExpenses = ledgerBalances.filter(a => a.type === 'EXPENSE' && a.finalAccountCategory !== 'DIRECT');
    const indirectIncomes = ledgerBalances.filter(a => a.type === 'REVENUE' && a.finalAccountCategory !== 'DIRECT');

    let plDebitTotal = indirectExpenses.reduce((sum, a) => sum + a.absBalance, 0) + grossLoss;
    let plCreditTotal = indirectIncomes.reduce((sum, a) => sum + a.absBalance, 0) + grossProfit;

    const netProfit = plCreditTotal > plDebitTotal ? plCreditTotal - plDebitTotal : 0;
    const netLoss = plDebitTotal > plCreditTotal ? plDebitTotal - plCreditTotal : 0;
    const plTotal = Math.max(plDebitTotal, plCreditTotal);

    const drawingsAcc = ledgerBalances.find(a => a.classification === 'OWNER_DRAWINGS');
    const capitalAcc = ledgerBalances.find(a => a.classification === 'OWNER_CAPITAL') || { name: 'Capital A/c', absBalance: 0, id: 'man-cap', isCredit: true };

    const drawingsAmount = drawingsAcc?.absBalance || 0;
    const openingCapital = capitalAcc?.absBalance || 0;
    const netCapital = openingCapital + netProfit - netLoss - drawingsAmount;

    const cashBalance = fiscalSummary.cashBalance;
    const bankBalance = fiscalSummary.bankBalance;
    
    const isOverdraft = bankBalance < 0;

    const debtors = ledgerBalances.filter(a => a.classification === 'SUNDRY_DEBTOR');
    const creditors = ledgerBalances.filter(a => a.classification === 'SUNDRY_CREDITOR');
    
    const fixedAssets = ledgerBalances.filter(a => 
      a.type === 'ASSET' && a.classification === 'TANGIBLE_ASSET'
    );

    const assetSideTotal = (cashBalance > 0 ? cashBalance : 0) + (isOverdraft ? 0 : bankBalance) + 
                          fixedAssets.reduce((sum, a) => sum + a.absBalance, 0) + 
                          debtors.reduce((sum, d) => sum + d.absBalance, 0) + 
                          closingStock;
    
    const otherLiabilities = ledgerBalances.filter(a => 
      a.type === 'LIABILITY' && a.classification !== 'SUNDRY_CREDITOR' && 
      a.classification !== 'OWNER_CAPITAL' && a.name !== 'Bank A/c'
    );

    const liabilitySideTotal = netCapital + 
                              otherLiabilities.reduce((sum, l) => sum + l.absBalance, 0) + 
                              creditors.reduce((sum, c) => sum + c.absBalance, 0) +
                              (isOverdraft ? Math.abs(bankBalance) : 0) +
                              (cashBalance < 0 ? Math.abs(cashBalance) : 0);

    return {
      openingStock, closingStock, netPurchases, netSales, grossSales, salesReturn, grossPurchases, purchaseReturn, directExpenses, grossProfit, grossLoss, tradingTotal,
      indirectExpenses, indirectIncomes, netProfit, netLoss, plTotal,
      netCapital, openingCapital, drawingsAmount, otherLiabilities, creditors, bankBalance, isOverdraft, cashBalance, fixedAssets, debtors,
      assetSideTotal, liabilitySideTotal, bsDifference: Math.abs(assetSideTotal - liabilitySideTotal)
    };
  }, [accounts, entries, stockTransactions, fiscalSummary]);

  const TableRow = ({ label, amount, isTotal, isHighlight }: any) => (
    <div className={`flex justify-between py-2.5 px-3 md:px-4 border-b border-white/5 transition-colors ${isTotal ? 'bg-white/10 font-black text-white' : 'text-gray-300 hover:bg-white/5'} ${isHighlight ? 'text-neon-green font-black' : ''}`}>
      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate pr-2">{label}</span>
      <span className="font-mono font-bold text-xs md:text-sm whitespace-nowrap">{amount !== undefined ? Math.abs(amount).toLocaleString('en-IN', {minimumFractionDigits: 2}) : '0.00'}</span>
    </div>
  );

  const isMatched = data.bsDifference < 1;

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 font-sans pb-32 custom-scrollbar">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-12 gap-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter flex items-center gap-3 md:gap-4">
            <FileSpreadsheet className="text-orange-400 w-8 h-8 md:w-10 md:h-10" size={40} /> FINAL ACCOUNTS
          </h2>
          <p className="text-gray-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <CheckCircle2 size={12} className="text-neon-green" /> GAAPI SECURE ENGINE
          </p>
        </div>
        <div className="flex bg-slate-900 border border-glass-border rounded-xl md:rounded-2xl p-1 md:p-1.5 shadow-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['TRADING', 'PL', 'BS'].map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 lg:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-950' : 'text-gray-500'}`}>
               {tab === 'TRADING' ? 'TRADING' : tab === 'PL' ? 'P & L' : 'BALANCE SHEET'}
             </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showDiagnostic && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowDiagnostic(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{scale:0.9, y:20, opacity:0}} animate={{scale:1, y:0, opacity:1}} exit={{scale:0.9, y:20, opacity:0}} className="relative bg-[#0F172A] border border-neon-blue/30 rounded-3xl md:rounded-[40px] p-6 md:p-10 max-w-2xl w-full shadow-[0_0_50px_rgba(0,243,255,0.2)]">
               <h2 className="text-xl md:text-3xl font-black text-white mb-4 md:mb-6 uppercase tracking-tighter flex items-center gap-3"><Info className="text-neon-blue"/> Diagnostic Log</h2>
               <div className="space-y-4 md:space-y-6 text-gray-300 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  <div className="p-4 md:p-5 bg-black/40 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Audit Status</p>
                     <p className="text-sm">Balance Sheet deviation: <span className={isMatched ? 'text-neon-green' : 'text-red-400'}>₹{data.bsDifference.toLocaleString()}</span></p>
                     <ul className="mt-4 space-y-2 text-[10px] md:text-xs list-disc list-inside text-gray-400">
                        <li>Cash/Bank balances synced from live book.</li>
                        <li>Closing Stock valuation via FIFO perpetual engine.</li>
                        <li>P&L Net Surplus integrated into Owner's Equity.</li>
                     </ul>
                  </div>
               </div>
               <button onClick={() => setShowDiagnostic(false)} className="w-full mt-6 md:mt-10 py-4 md:py-5 bg-neon-blue text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl">Dismiss Diagnostics</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto overflow-hidden">
        {activeTab === 'TRADING' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#0a0f1c] border border-glass-border rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex flex-col"><div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">DEBITS (Dr)</div><div className="flex-1 p-2 space-y-1">
                  <TableRow label="Opening Stock" amount={data.openingStock} />
                  <div className="px-3 md:px-4 py-2 bg-white/[0.02] rounded-xl my-1 border border-white/5">
                    <div className="flex justify-between text-[8px] text-gray-500 font-black uppercase mb-1"><span>Purchases</span><span>{data.grossPurchases.toLocaleString()}</span></div>
                    <div className="flex justify-between text-[8px] text-red-500 italic mb-1"><span>Less: PR</span><span>({data.purchaseReturn.toLocaleString()})</span></div>
                    <div className="flex justify-between text-[10px] md:text-xs text-white font-black border-t border-white/10 pt-1"><span>NET PUR.</span><span>₹{data.netPurchases.toLocaleString()}</span></div>
                  </div>
                  {data.directExpenses.map(e => <TableRow key={e.id} label={e.name} amount={e.absBalance} />)}
                  {data.grossProfit > 0 && <TableRow label="Gross Profit c/d" amount={data.grossProfit} isHighlight={true} />}
                </div><TableRow label="TOTAL" amount={data.tradingTotal} isTotal={true} /></div>
              <div className="flex flex-col"><div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">CREDITS (Cr)</div><div className="flex-1 p-2 space-y-1">
                  <div className="px-3 md:px-4 py-2 bg-white/[0.02] rounded-xl my-1 border border-white/5">
                    <div className="flex justify-between text-[8px] text-gray-500 font-black uppercase mb-1"><span>Sales</span><span>{data.grossSales.toLocaleString()}</span></div>
                    <div className="flex justify-between text-[8px] text-red-500 italic mb-1"><span>Less: SR</span><span>({data.salesReturn.toLocaleString()})</span></div>
                    <div className="flex justify-between text-[10px] md:text-xs text-white font-black border-t border-white/10 pt-1"><span>NET SALES</span><span>₹{data.netSales.toLocaleString()}</span></div>
                  </div>
                  <TableRow label="Closing Stock" amount={data.closingStock} isHighlight={true} />
                  {data.grossLoss > 0 && <TableRow label="Gross Loss c/d" amount={data.grossLoss} isHighlight={true} />}
                </div><TableRow label="TOTAL" amount={data.tradingTotal} isTotal={true} /></div>
            </div>
          </motion.div>
        )}

        {activeTab === 'PL' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#0a0f1c] border border-glass-border rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex flex-col"><div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">EXPENSES (Dr)</div><div className="flex-1 p-2 space-y-1">
                  {data.grossLoss > 0 && <TableRow label="Gross Loss b/d" amount={data.grossLoss} />}
                  {data.indirectExpenses.map(e => <TableRow key={e.id} label={e.name} amount={e.absBalance} />)}
                  {data.netProfit > 0 && <TableRow label="Net Profit" amount={data.netProfit} isHighlight={true} />}
                </div><TableRow label="TOTAL" amount={data.plTotal} isTotal={true} /></div>
              <div className="flex flex-col"><div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">INCOMES (Cr)</div><div className="flex-1 p-2 space-y-1">
                  {data.grossProfit > 0 && <TableRow label="Gross Profit b/d" amount={data.grossProfit} />}
                  {data.indirectIncomes.map(e => <TableRow key={e.id} label={e.name} amount={e.absBalance} />)}
                  {data.netLoss > 0 && <TableRow label="Net Loss" amount={data.netLoss} isHighlight={true} />}
                </div><TableRow label="TOTAL" amount={data.plTotal} isTotal={true} /></div>
            </div>
          </motion.div>
        )}

        {activeTab === 'BS' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-[#0a0f1c] border border-glass-border rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex flex-col">
                 <div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">LIABILITIES & EQUITY</div>
                 <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="p-4 md:p-6 bg-black/40 rounded-2xl md:rounded-3xl border border-white/5 shadow-inner">
                       <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Capital Mix</h3>
                       <div className="space-y-2 font-mono">
                          <div className="flex justify-between text-[10px] text-white"><span>Opening</span><span>{data.openingCapital.toLocaleString()}</span></div>
                          {data.netProfit > 0 && <div className="flex justify-between text-[10px] text-neon-green"><span>+ NP</span><span>{data.netProfit.toLocaleString()}</span></div>}
                          {data.netLoss > 0 && <div className="flex justify-between text-[10px] text-red-500"><span>- NL</span><span>({data.netLoss.toLocaleString()})</span></div>}
                          {data.drawingsAmount > 0 && <div className="flex justify-between text-[10px] text-orange-400"><span>- Drw</span><span>({data.drawingsAmount.toLocaleString()})</span></div>}
                          <div className="pt-2 border-t border-white/10 flex justify-between text-xs md:text-sm text-white font-black"><span>TOTAL</span><span>₹{data.netCapital.toLocaleString()}</span></div>
                       </div>
                    </div>
                    <div className="space-y-1">
                       {data.isOverdraft && <TableRow label="Bank Overdraft" amount={data.bankBalance} />}
                       {data.cashBalance < 0 && <TableRow label="Cash Credit" amount={data.cashBalance} />}
                       {data.creditors.map(c => <TableRow key={c.id} label={c.name} amount={c.absBalance} />)}
                       {data.otherLiabilities.map(l => <TableRow key={l.id} label={l.name} amount={l.absBalance} />)}
                    </div>
                 </div>
                 <TableRow label="TOTAL L & E" amount={data.liabilitySideTotal} isTotal={true} />
              </div>
              <div className="flex flex-col">
                 <div className="bg-white/5 p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-gray-500 tracking-[0.3em]">ASSETS</div>
                 <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
                    {data.fixedAssets.map(a => <TableRow key={a.id} label={a.name} amount={a.absBalance} />)}
                    <div className="bg-emerald-500/10 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-emerald-500/20 flex justify-between items-center shadow-lg">
                       <div className="flex items-center gap-2 md:gap-3">
                         <div className="p-2 md:p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Package size={18}/></div>
                         <span className="text-[10px] font-black text-white uppercase tracking-tight">Closing Stock</span>
                       </div>
                       <span className="text-base md:text-xl font-mono font-black text-emerald-400">₹{data.closingStock.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                       {data.cashBalance > 0 && <TableRow label="Cash In Hand" amount={data.cashBalance} />}
                       {!data.isOverdraft && data.bankBalance > 0 && <TableRow label="Bank Balance" amount={data.bankBalance} />}
                       {data.debtors.map(d => <TableRow key={d.id} label={d.name} amount={d.absBalance} />)}
                    </div>
                 </div>
                 <TableRow label="TOTAL ASSETS" amount={data.assetSideTotal} isTotal={true} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="mt-8 max-w-7xl mx-auto flex justify-center pb-10">
         <button onClick={() => setShowDiagnostic(true)} className="px-5 py-2.5 bg-slate-900 border border-glass-border text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-full hover:text-white transition-all flex items-center gap-2 shadow-lg"><ShieldAlert size={14}/> Integrity Audit</button>
      </div>
    </div>
  );
};

export default FinalAccountsView;
