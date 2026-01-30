
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import JournalIDE from './components/JournalIDE';
import LedgerView from './components/LedgerView';
import AccountProfiles from './components/AccountProfiles';
import TrialBalanceView from './components/TrialBalanceView';
import FinalAccountsView from './components/FinalAccountsView';
import SettingsView from './components/SettingsView';
import JournalLogView from './components/JournalLogView';
import SubsidiaryBooksView from './components/SubsidiaryBooksView';
import CashBookView from './components/CashBookView';
import InventoryView from './components/InventoryView';
import WorkingNotesView from './components/WorkingNotesView';
import { ViewMode } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountingProvider, useAccounting } from './context/AccountingContext';
import { BrainCircuit, Cpu, ShieldCheck, Database } from 'lucide-react';

const Bootloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing Core Systems...");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const statuses = [
      { p: 10, t: "Loading Modules..." },
      { p: 30, t: "Mounting File System..." },
      { p: 50, t: "Checking Integrity..." },
      { p: 70, t: "Syncing Ledger Database..." },
      { p: 90, t: "Starting UI Engine..." },
    ];

    statuses.forEach(s => {
      setTimeout(() => setStatus(s.t), s.p * 15);
    });

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[9999]">
      <div className="w-80 relative">
         <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-neon-blue font-mono text-[10px] md:text-xs font-bold tracking-widest uppercase">{status}</span>
            <span className="text-neon-purple font-mono text-xs font-bold">{progress}%</span>
         </div>
         <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple" style={{ width: `${progress}%` }} layoutId="loader" />
         </div>
         <div className="mt-8 flex justify-center gap-8 text-gray-600">
             <Cpu size={20} className="animate-pulse" />
             <Database size={20} className="animate-pulse delay-75" />
             <ShieldCheck size={20} className="animate-pulse delay-150" />
         </div>
         <h1 className="text-center mt-8 text-2xl md:text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 opacity-50">ACCT-IDE</h1>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isDirty, setIsDirty } = useAccounting();
  const [currentView, setView] = useState<ViewMode>(ViewMode.JOURNAL);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSetView = (newView: ViewMode) => {
    if (isDirty) {
      if (confirm("Unsaved changes detected. Switch anyway?")) {
        setIsDirty(false);
        setView(newView);
      }
    } else {
      setView(newView);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewMode.JOURNAL: return <JournalIDE setView={handleSetView} />;
      case ViewMode.CASH_BOOK: return <CashBookView />;
      case ViewMode.JOURNAL_LOG: return <JournalLogView />;
      case ViewMode.SUBSIDIARY_BOOKS: return <SubsidiaryBooksView />;
      case ViewMode.LEDGER: return <LedgerView setView={handleSetView} />;
      case ViewMode.ACCOUNT_PROFILE: return <AccountProfiles />;
      case ViewMode.TRIAL_BALANCE: return <TrialBalanceView setView={handleSetView} />;
      case ViewMode.FINAL_ACCOUNTS: return <FinalAccountsView />;
      case ViewMode.INVENTORY: return <InventoryView />;
      case ViewMode.WORKING_NOTES: return <WorkingNotesView />;
      case ViewMode.SETTINGS: return <SettingsView />;
      default: return null;
    }
  };

  return (
    <>
      <AnimatePresence>{isLoading && <Bootloader onComplete={() => setIsLoading(false)} />}</AnimatePresence>
      {!isLoading && (
        <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
          <Sidebar currentView={currentView} setView={handleSetView} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)} />
          <main className="flex-1 relative flex flex-col min-w-0 pb-16 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full w-full overflow-hidden">
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => (
  <AccountingProvider>
    <AppContent />
  </AccountingProvider>
);

export default App;
