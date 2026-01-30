
import React from 'react';
import { ViewMode } from '../types';
import { 
  BookOpen, 
  Code, 
  LayoutDashboard, 
  FileSpreadsheet, 
  BrainCircuit, 
  Settings, 
  Package,
  CreditCard,
  ScrollText,
  BookCopy,
  ClipboardList,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, toggleCollapse }) => {
  
  const menuItems = [
    { id: ViewMode.JOURNAL, icon: Code, label: 'Journal', color: 'text-neon-blue' },
    { id: ViewMode.CASH_BOOK, icon: Wallet, label: 'Cash Book', color: 'text-yellow-400' },
    { id: ViewMode.JOURNAL_LOG, icon: ScrollText, label: 'DayBook', color: 'text-yellow-600' },
    { id: ViewMode.SUBSIDIARY_BOOKS, icon: BookCopy, label: 'Sub.Books', color: 'text-pink-400' },
    { id: ViewMode.LEDGER, icon: BookOpen, label: 'Ledger', color: 'text-neon-purple' },
    { id: ViewMode.TRIAL_BALANCE, icon: LayoutDashboard, label: 'TB', color: 'text-neon-green' },
    { id: ViewMode.FINAL_ACCOUNTS, icon: FileSpreadsheet, label: 'Final A/c', color: 'text-orange-400' },
    { id: ViewMode.ACCOUNT_PROFILE, icon: CreditCard, label: 'Profiles', color: 'text-indigo-400' },
    { id: ViewMode.INVENTORY, icon: Package, label: 'Stock', color: 'text-emerald-400' },
    { id: ViewMode.WORKING_NOTES, icon: ClipboardList, label: 'Notes', color: 'text-cyan-400' },
    { id: ViewMode.SETTINGS, icon: Settings, label: 'Config', color: 'text-gray-400' },
  ];

  return (
    <>
      <div 
        className={`
          hidden md:flex
          h-screen bg-[#020617] border-r border-glass-border flex-col 
          transition-all duration-500 ease-in-out z-50
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-glass-border relative">
          <div className="cursor-pointer flex items-center gap-2" onClick={toggleCollapse}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(188,19,254,0.5)]">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                ACCT-IDE
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  relative group flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-blue rounded-r-full shadow-[0_0_10px_#00f3ff]" />
                )}
                <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'}`} />
                {!isCollapsed && (
                  <span className={`ml-3 font-medium transition-colors duration-300 whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {item.label}
                  </span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 border border-glass-border text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!isCollapsed && (
          <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span>System Online v2.7</span>
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#020617]/95 backdrop-blur-xl border-t border-glass-border z-50 flex items-center justify-between px-2 overflow-x-auto no-scrollbar">
        {menuItems.map((item) => {
           const isActive = currentView === item.id;
           const Icon = item.icon;
           return (
             <button key={item.id} onClick={() => setView(item.id)} className={`flex flex-col items-center justify-center min-w-[4.5rem] h-full gap-1 transition-all ${isActive ? 'text-white' : 'text-gray-500'}`}>
               <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`}>
                 <Icon size={20} className={isActive ? item.color : 'text-gray-500'} />
               </div>
               <span className="text-[9px] font-medium tracking-wide truncate max-w-full px-1">{item.label}</span>
             </button>
           );
        })}
      </div>
    </>
  );
};

export default Sidebar;
