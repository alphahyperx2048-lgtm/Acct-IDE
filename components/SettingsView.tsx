
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Monitor, Moon, Volume2, Shield, Download, Laptop, 
  Check, Database, Upload, RefreshCw, Calendar, Eye, 
  Lock, AlertTriangle, ShieldCheck, FileJson, Trash2, 
  CheckCircle2, Info, LayoutGrid, Scale, Printer, FileText,
  BookOpen, FileSpreadsheet, Package, Layers, X, Loader2
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { FinancialYearType, NegativeBalanceFormat, ViewMode } from '../types';
import JournalLogView from './JournalLogView';
import LedgerView from './LedgerView';
import TrialBalanceView from './TrialBalanceView';
import FinalAccountsView from './FinalAccountsView';
import InventoryView from './InventoryView';

const SettingsView: React.FC = () => {
  const { 
    exportData, importData, softReset, hardReset, entries, 
    financialYear, setFinancialYear, negativeFormat, setNegativeFormat 
  } = useAccounting();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState<'SOFT' | 'HARD' | null>(null);
  const [resetCheck, setResetCheck] = useState(false);
  const [restoreMetadata, setRestoreMetadata] = useState<any>(null);
  const [printComponent, setPrintComponent] = useState<ViewMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasTransactions = entries.length > 0;

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACCT-IDE_SECURE_BACKUP_${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importData(event.target?.result as string);
      if (result.success) {
        setRestoreMetadata(result.metadata);
        setTimeout(() => setRestoreMetadata(null), 5000);
      } else {
        alert("CRITICAL: Backup file is corrupted or incompatible.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeReset = () => {
    if (!resetCheck) return;
    if (showResetModal === 'SOFT') softReset();
    else hardReset();
    setShowResetModal(null);
    setResetCheck(false);
  };

  const triggerPrint = (view: ViewMode) => {
    setIsGenerating(true);
    setPrintComponent(view);
    // Short delay to ensure component is rendered before printing
    setTimeout(() => {
      window.print();
      setPrintComponent(null);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="h-full w-full bg-[#050b14] p-4 md:p-8 overflow-y-auto no-scrollbar font-sans pb-32">
      
      {/* Print Preview Overlay (Hidden in UI, Visible in Print) */}
      {printComponent && (
        <div className="fixed inset-0 z-[9999] bg-white text-black p-10 overflow-auto hidden print:block print-container">
           <div className="mb-8 border-b-2 border-black pb-4 text-center">
              <h1 className="text-4xl font-black uppercase tracking-tighter">FINANCIAL STATEMENT</h1>
              <p className="text-sm font-bold opacity-70">Generated via ACCT-IDE Intelligent Engine • {new Date().toLocaleString()}</p>
           </div>
           
           {printComponent === ViewMode.JOURNAL_LOG && <JournalLogView />}
           {printComponent === ViewMode.LEDGER && <LedgerView />}
           {printComponent === ViewMode.TRIAL_BALANCE && <TrialBalanceView />}
           {printComponent === ViewMode.FINAL_ACCOUNTS && <FinalAccountsView />}
           {printComponent === ViewMode.INVENTORY && <InventoryView />}
           
           <div className="mt-12 pt-8 border-t border-black text-[10px] flex justify-between uppercase font-bold opacity-50">
              <span>Verified Ledger Consistency</span>
              <span>Proprietary Report Format V2.7</span>
           </div>
        </div>
      )}

      {/* Loading Overlay for Print Generation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
             <Loader2 size={64} className="text-neon-blue animate-spin mb-6" />
             <h2 className="text-2xl font-black text-white uppercase tracking-widest">Generating PDF Report</h2>
             <p className="text-gray-500 text-xs mt-2 font-mono">Synthesizing Ledger Assets & Vouchers...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/5 border border-glass-border rounded-3xl text-gray-400">
              <Settings size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Control Center</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">System Governance & Accounting Parameters</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl flex items-center gap-3">
             <ShieldCheck size={20} className="text-neon-blue" />
             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Integrity: <span className="text-neon-blue">ENFORCED</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Data Management Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* NEW: Reporting Hub */}
            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-neon-green/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-3 mb-8">
                <Printer className="text-neon-green" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Report Hub (PDF Export)</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: ViewMode.JOURNAL_LOG, label: 'Journal', icon: FileText, color: 'text-yellow-400' },
                  { id: ViewMode.LEDGER, label: 'Ledger', icon: BookOpen, color: 'text-neon-purple' },
                  { id: ViewMode.TRIAL_BALANCE, label: 'Trial Bal.', icon: LayoutGrid, color: 'text-neon-green' },
                  { id: ViewMode.INVENTORY, label: 'Stock', icon: Package, color: 'text-emerald-400' },
                  { id: ViewMode.FINAL_ACCOUNTS, label: 'Final A/c', icon: FileSpreadsheet, color: 'text-orange-400' },
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => triggerPrint(item.id)}
                    className="p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-white/20 transition-all flex flex-col items-center gap-3 text-center group/btn"
                  >
                    <div className={`p-3 bg-white/5 rounded-2xl ${item.color} group-hover/btn:scale-110 transition-transform shadow-lg`}>
                       <item.icon size={20} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-neon-blue/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex items-center gap-3 mb-8">
                <Database className="text-neon-blue" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Data Vault</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleExport} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-neon-blue/40 transition-all flex flex-col gap-4 text-left group/btn">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit group-hover/btn:scale-110 transition-transform"><Download size={24} /></div>
                  <div>
                    <span className="font-black text-white text-sm uppercase tracking-widest block mb-1">Create Backup</span>
                    <span className="text-[10px] text-gray-500 font-medium">Capture 100% of vouchers & ledgers in atomic JSON.</span>
                  </div>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-neon-blue/40 transition-all flex flex-col gap-4 text-left group/btn">
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit group-hover/btn:scale-110 transition-transform"><Upload size={24} /></div>
                  <div>
                    <span className="font-black text-white text-sm uppercase tracking-widest block mb-1">Restore State</span>
                    <span className="text-[10px] text-gray-500 font-medium">Roll back to a previous point-in-time state.</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
                </button>
              </div>

              <AnimatePresence>
                {restoreMetadata && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <div className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      System Rolled Back Successfully. <br/>
                      <span className="opacity-60 text-[8px]">Backup ID: {restoreMetadata.timestamp} • {restoreMetadata.entryCount} Vouchers Restored</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex justify-between items-center bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                   <div className="flex items-center gap-3">
                     <Trash2 size={20} className="text-red-500" />
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">System Purge</span>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setShowResetModal('SOFT')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all">Soft Reset</button>
                     <button onClick={() => setShowResetModal('HARD')} className="px-4 py-2 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-red-600">Hard Reset</button>
                   </div>
                </div>
              </div>
            </section>
          </div>

          {/* Preferences Column */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 shadow-2xl">
               <div className="flex items-center gap-3 mb-8">
                 <Eye className="text-neon-green" size={24} />
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Display Styles</h2>
               </div>
               
               <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Negative Balance Format</label>
                    <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 flex">
                      <button 
                        onClick={() => setNegativeFormat('MINUS')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${negativeFormat === 'MINUS' ? 'bg-white text-slate-950' : 'text-gray-500'}`}
                      >
                        MINUS (-5,000)
                      </button>
                      <button 
                        onClick={() => setNegativeFormat('BRACKETS')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${negativeFormat === 'BRACKETS' ? 'bg-white text-slate-950' : 'text-gray-500'}`}
                      >
                        BRACKETS (5,000)
                      </button>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Interface Theme</span>
                       <span className="text-[10px] font-black text-neon-blue uppercase">Neon Dark (Active)</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">System Sounds</span>
                       <div className="w-10 h-5 bg-neon-green/10 border border-neon-green/30 rounded-full relative">
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-neon-green rounded-full shadow-[0_0_10px_#0aff68]" />
                       </div>
                    </div>
                  </div>
               </div>
            </section>

            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 shadow-2xl">
               <div className="flex items-center gap-3 mb-6 text-gray-400">
                  <Scale size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Accounting Context</h3>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 italic"><span>Rule Engine</span> <span>IFRS / Indian GAAP v2</span></div>
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 italic"><span>Validation Depth</span> <span>L3 Integrity Guard</span></div>
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 italic"><span>Storage Engine</span> <span>Local Persistence V10</span></div>
               </div>
            </section>
          </div>

        </div>

        <div className="text-center mt-16 pb-20 opacity-30">
          <div className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-2">ACCT-IDE PREMIUM ENGINE</div>
          <div className="text-[8px] font-mono text-gray-500 tracking-widest uppercase">Version 2.5.0-PRO • Build 2024.12.01 • AES-256 State Hash</div>
        </div>

      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#0F172A] border border-red-500/50 rounded-[40px] p-10 overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.2)]">
               <div className="flex flex-col items-center text-center">
                  <div className="p-5 bg-red-500/10 rounded-full text-red-500 mb-8 border border-red-500/20">
                     <AlertTriangle size={48} className="animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Confirm System {showResetModal} Reset</h2>
                  <p className="text-gray-500 text-sm mb-8 leading-relaxed italic">
                    {showResetModal === 'HARD' 
                      ? "This action is irreversible. All masters, transactions, and settings will be permanently wiped. Ensure you have a JSON backup before proceeding." 
                      : "All transactions and books will be cleared. Masters (Accounts & Stock Items) will be preserved."}
                  </p>

                  <label className="flex items-center gap-4 bg-black/40 p-6 rounded-3xl border border-white/5 w-full cursor-pointer hover:bg-black/60 transition-colors mb-10">
                     <input type="checkbox" checked={resetCheck} onChange={e => setResetCheck(e.target.checked)} className="w-5 h-5 rounded border-red-500 bg-black text-red-500 focus:ring-red-500" />
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">I have created a secure backup and understand this action is irreversible.</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4 w-full">
                     <button onClick={() => { setShowResetModal(null); setResetCheck(false); }} className="py-5 rounded-2xl border border-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-white/5">Cancel</button>
                     <button 
                       disabled={!resetCheck}
                       onClick={executeReset}
                       className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${resetCheck ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                     >
                       Execute Purge
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsView;
