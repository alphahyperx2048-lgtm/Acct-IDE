
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingDown, Calculator, Calendar, ArrowRight, Save, 
  CheckCircle2, Info, AlertTriangle, ShieldCheck, 
  RefreshCcw, Sparkles, Database, FileText, ChevronRight,
  Zap, ArrowDownToLine
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { motion, AnimatePresence } from 'framer-motion';

const DepreciationManagerView: React.FC = () => {
  const { getEligibleDepreciationAssets, postDepreciation } = useAccounting();
  
  const eligibleAssets = useMemo(() => getEligibleDepreciationAssets(), [getEligibleDepreciationAssets]);
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [method, setMethod] = useState<'SLM' | 'WDV'>('SLM');
  const [rate, setRate] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeAsset = useMemo(() => eligibleAssets.find(a => a.account.id === selectedAssetId), [selectedAssetId, eligibleAssets]);

  const calculations = useMemo(() => {
    if (!activeAsset) return { amount: 0, netValue: 0 };
    
    const baseValue = method === 'SLM' ? activeAsset.cost : activeAsset.currentBalance;
    const amount = (baseValue * rate) / 100;
    const netValue = activeAsset.currentBalance - amount;
    
    return { amount, netValue };
  }, [activeAsset, method, rate]);

  const handlePost = () => {
    if (!activeAsset || isPosting) return;
    
    setIsPosting(true);
    
    // Simulate thinking/processing
    setTimeout(() => {
      postDepreciation({
        accountId: activeAsset.account.id,
        amount: calculations.amount,
        date: startDate,
        narration: `Being depreciation charged on ${activeAsset.account.name} @ ${rate}% p.a. using ${method} method.`
      });
      
      setIsPosting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedAssetId('');
    }, 1200);
  };

  return (
    <div className="h-full w-full bg-[#050b14] overflow-y-auto p-4 md:p-8 font-sans pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <TrendingDown size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Depreciation Manager</h1>
              <div className="flex items-center gap-3 mt-1 opacity-50">
                <ShieldCheck size={14} className="text-neon-blue" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Fixed Asset Intelligence Module</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-glass-border">
             <div className="text-right">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Acquired Assets</div>
                <div className="text-xl font-mono font-bold text-white">{eligibleAssets.length} Eligible</div>
             </div>
             <div className="h-10 w-px bg-white/5" />
             <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                <Zap size={20} className="animate-pulse" />
             </div>
          </div>
        </div>

        {eligibleAssets.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 border border-dashed border-glass-border rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-8 border border-white/5">
                <AlertTriangle size={40} className="text-gray-600" />
             </div>
             <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">No Tangible Assets Detected</h3>
             <p className="text-gray-500 max-w-md mx-auto text-sm">
                Depreciation can only be applied to Tangible Assets with a recorded acquisition (Debit balance). 
                Please post an asset purchase via Journal or Cash Book first.
             </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Asset Selection Pane */}
            <div className="lg:col-span-4 space-y-4">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-4 block">1. Target Machinery / Asset</label>
               <div className="space-y-3">
                 {eligibleAssets.map((asset) => (
                   <motion.div
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     key={asset.account.id}
                     onClick={() => setSelectedAssetId(asset.account.id)}
                     className={`
                        cursor-pointer p-6 rounded-3xl border transition-all relative overflow-hidden group
                        ${selectedAssetId === asset.account.id 
                          ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
                          : 'bg-slate-900/50 border-glass-border hover:border-white/20'}
                     `}
                   >
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/5 rounded-xl text-gray-400 group-hover:text-white transition-colors">
                           <Database size={18} />
                        </div>
                        {selectedAssetId === asset.account.id && (
                          <div className="text-red-400 animate-pulse">
                            <Sparkles size={16} />
                          </div>
                        )}
                     </div>
                     <h4 className="text-lg font-black text-white mb-1 group-hover:text-red-400 transition-colors uppercase tracking-tight">{asset.account.name}</h4>
                     <div className="flex justify-between items-end mt-4">
                        <div>
                           <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Book Value</div>
                           <div className="font-mono text-white text-base font-black">₹{asset.currentBalance.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Cost</div>
                           <div className="font-mono text-gray-400 text-xs">₹{asset.cost.toLocaleString()}</div>
                        </div>
                     </div>
                     {selectedAssetId === asset.account.id && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                     )}
                   </motion.div>
                 ))}
               </div>
            </div>

            {/* Config & Calculation Pane */}
            <div className="lg:col-span-8 space-y-8">
               <div className={`bg-[#0a0f1c] border border-glass-border rounded-[40px] p-8 md:p-12 shadow-2xl transition-all ${!activeAsset ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                     {/* Method Select */}
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] block">2. Depreciation Method</label>
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                           <button 
                             onClick={() => setMethod('SLM')}
                             className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest transition-all ${method === 'SLM' ? 'bg-white text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                           >
                             STRAIGHT LINE (SLM)
                           </button>
                           <button 
                             onClick={() => setMethod('WDV')}
                             className={`flex-1 py-4 rounded-xl text-xs font-black tracking-widest transition-all ${method === 'WDV' ? 'bg-white text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
                           >
                             REDUCING BAL. (WDV)
                           </button>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3">
                           <Info size={16} className="text-neon-blue shrink-0 mt-0.5" />
                           <p className="text-[10px] text-gray-500 leading-relaxed italic">
                             {method === 'SLM' 
                               ? 'SLM: Uniform depreciation based on initial historical cost throughout useful life.' 
                               : 'WDV: Higher depreciation in early years as it applies to the current written down value.'}
                           </p>
                        </div>
                     </div>

                     {/* Parameters */}
                     <div className="space-y-8">
                        <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] block mb-4">3. Parameters (%)</label>
                          <div className="flex items-center gap-6">
                             <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <TrendingDown size={18} className="text-red-400" />
                                <input 
                                  type="number" 
                                  value={rate} 
                                  onChange={e => setRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="bg-transparent border-none outline-none text-right font-mono font-black text-2xl text-white w-24"
                                />
                                <span className="text-gray-500 font-bold ml-2">%</span>
                             </div>
                             <div className="flex-1 bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                                <Calendar size={18} className="text-gray-500" />
                                <input 
                                  type="date" 
                                  value={startDate} 
                                  onChange={e => setStartDate(e.target.value)}
                                  className="bg-transparent border-none outline-none text-[11px] font-mono text-gray-300 w-full"
                                />
                             </div>
                          </div>
                        </div>
                        <div className="relative pt-4">
                           <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                              />
                           </div>
                           <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase mt-2 tracking-widest">
                              <span>Min Wear</span>
                              <span>Max (100%)</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Impact & Posting */}
                  <div className="pt-12 border-t border-white/5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                           <div className="flex justify-between items-center text-gray-500">
                              <span className="text-xs font-black uppercase tracking-widest">Calculated Depreciation</span>
                              <span className="font-mono font-bold">₹{calculations.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                           </div>
                           <div className="flex justify-between items-center text-neon-green">
                              <span className="text-xs font-black uppercase tracking-widest">Projected Net Book Value</span>
                              <span className="text-3xl font-mono font-black">₹{calculations.netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                           </div>
                        </div>
                        
                        <div className="relative">
                          <AnimatePresence>
                            {showSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-12 left-0 right-0 text-center"
                              >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                  <CheckCircle2 size={12} /> Post Successful
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button 
                            onClick={handlePost}
                            disabled={!activeAsset || isPosting}
                            className={`
                               w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group
                               ${isPosting 
                                 ? 'bg-gray-800 text-gray-500 cursor-wait' 
                                 : 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-95 hover:bg-red-600'}
                            `}
                          >
                             {isPosting ? (
                               <RefreshCcw size={20} className="animate-spin" />
                             ) : (
                               <>
                                 <ArrowDownToLine size={20} className="group-hover:translate-y-1 transition-transform" /> 
                                 Confirm & Post Ledger
                               </>
                             )}
                          </button>
                        </div>
                     </div>
                  </div>

                  {!activeAsset && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c]/40 backdrop-blur-[2px] rounded-[40px] pointer-events-none">
                       <div className="bg-slate-900 border border-glass-border px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                          <Calculator size={18} className="text-red-400" />
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Awaiting Asset Selection</span>
                       </div>
                    </div>
                  )}
               </div>

               <div className="bg-slate-900/40 border border-glass-border rounded-[32px] p-8">
                  <div className="flex items-center gap-3 mb-6">
                     <FileText size={18} className="text-gray-500" />
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Accounting Impact Analysis</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-5 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                        <div className="text-[9px] font-black text-neon-purple uppercase tracking-widest">Statement of Profit & Loss</div>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">
                           Depreciation of ₹{calculations.amount.toLocaleString()} will be debited as an <span className="text-white">Indirect Expense</span>, reducing current period profitability without affecting cash flow.
                        </p>
                     </div>
                     <div className="p-5 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                        <div className="text-[9px] font-black text-neon-green uppercase tracking-widest">Balance Sheet Representation</div>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">
                           Asset value in the balance sheet will be reduced. Cumulative depreciation is tracked to show <span className="text-white">Net Book Value</span> for fair presentation.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        )}
      </div>

      <div className="h-8 border-t border-glass-border bg-[#0a0f1c] flex items-center justify-between px-6 fixed bottom-0 left-0 right-0 z-[60] md:left-20 lg:left-20 transition-all">
         <div className="flex items-center gap-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               DEP_MANAGER_ACTIVE: TRUE
            </div>
            <div className="flex items-center gap-2 opacity-50">
               AS_6_DEPRECIATION_REPLACED_BY: AS_10_PPE
            </div>
         </div>
         <div className="flex items-center gap-4 text-[9px] font-bold text-gray-700">
            Automated Adjustment Journal Enabled
         </div>
      </div>
    </div>
  );
};

export default DepreciationManagerView;
