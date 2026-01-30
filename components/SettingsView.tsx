
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Download, Upload, Eye, ShieldCheck, Printer, 
  FileText, BookOpen, FileSpreadsheet, Package, Layers, X, 
  Loader2, Database, Trash2, AlertTriangle
} from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import { NegativeBalanceFormat, ViewMode } from '../types';
import JournalLogView from './JournalLogView';
import LedgerView from './LedgerView';
import TrialBalanceView from './TrialBalanceView';
import FinalAccountsView from './FinalAccountsView';
import InventoryView from './InventoryView';

const SettingsView: React.FC = () => {
  const { 
    exportData, importData, softReset, hardReset, entries, 
    negativeFormat, setNegativeFormat 
  } = useAccounting();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState<'SOFT' | 'HARD' | null>(null);
  const [resetCheck, setResetCheck] = useState(false);
  const [restoreMetadata, setRestoreMetadata] = useState<any>(null);
  const [printComponent, setPrintComponent] = useState<ViewMode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACCT-IDE_BACKUP_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = (view: ViewMode) => {
    setIsGenerating(true);
    setPrintComponent(view);
    setTimeout(() => {
      window.print();
      setPrintComponent(null);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="h-full w-full bg-[#050b14] p-4 md:p-8 overflow-y-auto no-scrollbar font-sans pb-32">
      
      {/* Print Overlay */}
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
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
             <Loader2 size={64} className="text-neon-blue animate-spin mb-6" />
             <h2 className="text-2xl font-black text-white uppercase tracking-widest">Generating PDF Report</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/5 border border-glass-border rounded-3xl text-gray-400">
              <Settings size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Control Center</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">System Governance</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl flex items-center gap-3">
             <ShieldCheck size={20} className="text-neon-blue" />
             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Integrity: <span className="text-neon-blue">ENFORCED</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Printer className="text-neon-green" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Report Hub (PDF Export)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: ViewMode.JOURNAL_LOG, label: 'Journal', icon: FileText, color: 'text-yellow-400' },
                  { id: ViewMode.LEDGER, label: 'Ledger', icon: BookOpen, color: 'text-neon-purple' },
                  { id: ViewMode.TRIAL_BALANCE, label: 'Trial Bal.', icon: Layers, color: 'text-neon-green' },
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
              <div className="flex items-center gap-3 mb-8">
                <Database className="text-neon-blue" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Data Vault</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleExport} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-neon-blue/40 transition-all flex flex-col gap-4 text-left group/btn">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit group-hover/btn:scale-110 transition-transform"><Download size={24} /></div>
                  <div><span className="font-black text-white text-sm uppercase tracking-widest block mb-1">Backup</span></div>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-neon-blue/40 transition-all flex flex-col gap-4 text-left group/btn">
                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit group-hover/btn:scale-110 transition-transform"><Upload size={24} /></div>
                  <div><span className="font-black text-white text-sm uppercase tracking-widest block mb-1">Restore</span></div>
                  <input type="file" ref={fileInputRef} onChange={() => {}} accept=".json" className="hidden" />
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <section className="bg-slate-900 border border-glass-border rounded-[40px] p-10 shadow-2xl">
               <div className="flex items-center gap-3 mb-8">
                 <Eye className="text-neon-green" size={24} />
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Preferences</h2>
               </div>
               <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">Negative Balance Format</label>
                    <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 flex">
                      <button onClick={() => setNegativeFormat('MINUS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${negativeFormat === 'MINUS' ? 'bg-white text-slate-950' : 'text-gray-500'}`}>MINUS</button>
                      <button onClick={() => setNegativeFormat('BRACKETS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${negativeFormat === 'BRACKETS' ? 'bg-white text-slate-950' : 'text-gray-500'}`}>BRACKETS</button>
                    </div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
