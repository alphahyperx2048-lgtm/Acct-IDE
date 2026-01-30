
import React, { useMemo, useState } from 'react';
import { Package, TrendingUp, Layers, Boxes, Search, Activity, Calendar, History, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { StockTransaction } from '../types';

interface ItemBatch {
  qty: number;
  rate: number;
  refDocId?: string;
}

interface ItemSummary {
  qty: number;
  value: number;
  batches: ItemBatch[];
}

const InventoryView: React.FC = () => {
  const { stockTransactions, inventoryMethod, inventoryItems } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'BATCHES'>('LEDGER');

  const processedData = useMemo(() => {
    const results: StockTransaction[] = [];
    const itemSummaries: Record<string, ItemSummary> = {};

    stockTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(txn => {
      if (!itemSummaries[txn.itemId]) {
        itemSummaries[txn.itemId] = { qty: 0, value: 0, batches: [] };
      }

      const summary = itemSummaries[txn.itemId];
      let finalTxn = { ...txn };

      if (txn.type === 'RECEIPT') {
        summary.qty += txn.quantity;
        summary.value += txn.amount;
        summary.batches.push({ qty: txn.quantity, rate: txn.rate, refDocId: txn.refDocId });
      } else {
        // ISSUE Logic (LIFO/FIFO handled in context generally, but here we simulate flow for UI)
        let needed = txn.quantity;
        let cost = 0;
        
        // Inventory flow simulation for the view
        for (let i = summary.batches.length - 1; i >= 0; i--) {
          const batch = summary.batches[i];
          if (needed <= 0) break;

          const taken = Math.min(batch.qty, needed);
          cost += taken * batch.rate;
          batch.qty -= taken;
          needed -= taken;

          if (batch.qty === 0) {
            summary.batches.splice(i, 1);
          }
        }

        summary.qty -= txn.quantity;
        summary.value -= cost;
        finalTxn.amount = cost;
        finalTxn.rate = txn.quantity > 0 ? cost / txn.quantity : 0;
      }

      finalTxn.balanceQty = summary.qty;
      finalTxn.balanceAmt = summary.value;
      finalTxn.balanceRate = summary.qty > 0 ? summary.value / summary.qty : 0;
      results.push(finalTxn);
    });

    return { 
      ledger: results.reverse(), 
      summaries: itemSummaries 
    };
  }, [stockTransactions]);

  const filteredLedger = processedData.ledger.filter(t => 
    t.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInventoryValue = (Object.values(processedData.summaries) as ItemSummary[]).reduce((s, i) => s + i.value, 0);

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight flex items-center gap-3">
            <Package size={36} className="text-emerald-400" /> Inventory Store Ledger
          </h1>
          <div className="flex items-center gap-4 mt-2">
             <div className="text-gray-500 font-mono text-[10px] uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Method: {inventoryMethod}</div>
             <div className="text-gray-600 text-[10px] flex items-center gap-1 uppercase font-black tracking-widest"><Activity size={12} /> Live Stock Valuation Active</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-glass-border p-5 rounded-2xl flex items-center gap-5 shadow-2xl">
          <div className="p-3 bg-emerald-500/10 rounded-xl"><TrendingUp className="text-emerald-400" size={28} /></div>
          <div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Store Valuation</div>
            <div className="text-2xl font-mono font-bold text-white">₹{totalInventoryValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center max-w-7xl mx-auto">
         <div className="flex bg-slate-900 p-1 rounded-2xl border border-glass-border">
            <button onClick={() => setActiveTab('LEDGER')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 tracking-widest ${activeTab === 'LEDGER' ? 'bg-emerald-500 text-slate-950' : 'text-gray-500 hover:text-white'}`}><Layers size={14} /> LOG VIEW</button>
            <button onClick={() => setActiveTab('BATCHES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 tracking-widest ${activeTab === 'BATCHES' ? 'bg-emerald-500 text-slate-950' : 'text-gray-500 hover:text-white'}`}><Boxes size={14} /> LIVE BATCHES</button>
         </div>
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input type="text" placeholder="Filter items by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3.5 bg-slate-900 border border-glass-border rounded-2xl text-white text-sm outline-none focus:border-emerald-500/50 transition-all" />
         </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'LEDGER' ? (
          <motion.div key="ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto bg-slate-900 border border-glass-border rounded-[28px] overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-glass-border">
                <tr className="bg-black/20"><th className="p-4 border-r border-white/5">Date</th><th className="p-4 border-r border-white/5">Particulars / Doc</th><th colSpan={3} className="p-2 border-r border-white/5 text-center text-emerald-400 bg-emerald-400/5 uppercase">Receipts (IN)</th><th colSpan={3} className="p-2 border-r border-white/5 text-center text-orange-400 bg-orange-400/5 uppercase">Issues (OUT)</th><th colSpan={3} className="p-2 text-center text-cyan-400 bg-cyan-400/5 uppercase">Balance</th></tr>
                <tr className="bg-white/[0.02] text-center"><th colSpan={2}></th><th className="p-2 border-r border-white/5 font-mono">Qty</th><th className="p-2 border-r border-white/5 font-mono">Rate</th><th className="p-2 border-r border-white/5 font-mono">Amt</th><th className="p-2 border-r border-white/5 font-mono">Qty</th><th className="p-2 border-r border-white/5 font-mono">Rate</th><th className="p-2 border-r border-white/5 font-mono">Amt</th><th className="p-2 border-r border-white/5 font-mono">Qty</th><th className="p-2 border-r border-white/5 font-mono">Rate</th><th className="p-2 font-mono">Amt</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLedger.map((txn, idx) => (
                  <tr key={txn.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 border-r border-white/5 text-gray-500 font-mono text-xs whitespace-nowrap">{txn.date}</td>
                    <td className="p-4 border-r border-white/5">
                      <div className="text-white font-bold">{txn.itemName}</div>
                      <div className="text-[9px] text-gray-600 font-mono tracking-widest">{txn.refDocId || 'Manual Adj'}</div>
                    </td>
                    <td className="p-2 border-r border-white/5 text-right text-emerald-400 font-mono">{txn.type === 'RECEIPT' ? txn.quantity : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-emerald-400/50 font-mono text-[10px]">{txn.type === 'RECEIPT' ? txn.rate.toFixed(2) : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-emerald-400 font-black font-mono">{txn.type === 'RECEIPT' ? txn.amount.toFixed(2) : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-orange-400 font-mono">{txn.type === 'ISSUE' ? txn.quantity : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-orange-400/50 font-mono text-[10px]">{txn.type === 'ISSUE' ? txn.rate.toFixed(2) : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-orange-400 font-black font-mono">{txn.type === 'ISSUE' ? txn.amount.toFixed(2) : '-'}</td>
                    <td className="p-2 border-r border-white/5 text-right text-cyan-400 font-black font-mono">{txn.balanceQty}</td>
                    <td className="p-2 border-r border-white/5 text-right text-cyan-400/50 font-mono text-[10px]">{txn.balanceRate?.toFixed(2)}</td>
                    <td className="p-2 text-right text-cyan-400 font-black font-mono">{txn.balanceAmt?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div key="batches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {(Object.entries(processedData.summaries) as [string, ItemSummary][]).map(([id, summary]) => {
              const item = inventoryItems.find(i => i.id === id);
              if (summary.qty <= 0) return null;
              
              // Group batches by their reference document ID
              const groupedByRef = summary.batches.reduce((acc, batch) => {
                const ref = batch.refDocId || 'Opening / Manual Adjustment';
                if (!acc[ref]) acc[ref] = [];
                acc[ref].push(batch);
                return acc;
              }, {} as Record<string, ItemBatch[]>);

              return (
                <div key={id} className="bg-slate-900 border border-glass-border rounded-[32px] overflow-hidden shadow-2xl flex flex-col group hover:border-emerald-500/50 transition-all">
                   <div className="p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                      <div className="text-[10px] text-gray-600 font-black tracking-widest mb-3 uppercase">Stock Commodity</div>
                      <h3 className="text-2xl font-black text-white mb-2">{item?.name}</h3>
                      <div className="flex justify-between items-end">
                        <span className="text-4xl font-mono font-black text-white">{summary.qty} <span className="text-sm font-normal text-gray-500 uppercase tracking-widest">{item?.unit}</span></span>
                        <div className="text-right"><div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Total Valuation</div><div className="font-mono font-black text-emerald-400 text-lg">₹{summary.value.toLocaleString()}</div></div>
                      </div>
                   </div>
                   <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[400px] custom-scrollbar">
                      <div className="flex items-center gap-2 mb-2"><Boxes size={16} className="text-emerald-500" /><span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Grouped Source Batches</span></div>
                      
                      {Object.entries(groupedByRef).map(([ref, batches], groupIdx) => (
                        <div key={groupIdx} className="space-y-3">
                           <div className="flex items-center gap-2 px-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                               <LinkIcon size={10} /> {ref}
                             </span>
                           </div>
                           
                           <div className="grid gap-2 pl-2">
                            {batches.map((b, i) => (
                               <div key={i} className="flex flex-col p-4 rounded-2xl bg-black/40 border border-white/5 transition-all hover:bg-black/60 group/batch">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-black text-white">{b.qty} {item?.unit}</span>
                                    <span className="text-[10px] font-mono text-emerald-500 font-black">@ ₹{b.rate.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-gray-600 font-mono tracking-tighter">
                                     <span>Source Trace: {ref}</span>
                                     <span>Lot Value: ₹{(b.qty * b.rate).toFixed(2)}</span>
                                  </div>
                               </div>
                            ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryView;
