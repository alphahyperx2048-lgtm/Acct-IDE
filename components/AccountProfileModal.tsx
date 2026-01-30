
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, ShieldCheck, Activity, Users, ArrowRightLeft, 
  Database, Landmark, TrendingUp, TrendingDown, HelpCircle, 
  CircleDollarSign, Warehouse, CreditCard, 
  FileText, ShoppingBag, Receipt
} from 'lucide-react';
import { Account, AccountType, AccountClassification } from '../types';
import { useAccounting } from '../context/AccountingContext';

interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
}

const TYPE_CONFIG: Record<AccountType, { label: string; color: string; activeColor: string }> = {
  ASSET: { label: 'ASSET', color: 'border-gray-800 text-gray-500', activeColor: 'border-neon-green text-neon-green shadow-neon-green/20' },
  LIABILITY: { label: 'LIABILITY', color: 'border-gray-800 text-gray-500', activeColor: 'border-orange-500 text-orange-400 shadow-orange-500/20' },
  EQUITY: { label: 'EQUITY', color: 'border-gray-800 text-gray-500', activeColor: 'border-neon-purple text-neon-purple shadow-neon-purple/20' },
  REVENUE: { label: 'REVENUE', color: 'border-gray-800 text-gray-500', activeColor: 'border-blue-500 text-blue-400 shadow-blue-500/20' },
  EXPENSE: { label: 'EXPENSE', color: 'border-gray-800 text-gray-500', activeColor: 'border-red-500 text-red-400 shadow-red-500/20' },
};

const CLASSIFICATION_MAP: Record<AccountType, { id: AccountClassification; label: string; icon: any }[]> = {
  ASSET: [
    { id: 'SUNDRY_DEBTOR', label: 'SUNDRY DEBTOR', icon: Users },
    { id: 'INTANGIBLE_ASSET', label: 'INTANGIBLE ASSET', icon: Database },
    { id: 'TANGIBLE_ASSET', label: 'TANGIBLE ASSET', icon: Warehouse },
    { id: 'CURRENT_ASSET', label: 'CURRENT ASSET', icon: Activity },
    { id: 'INVESTMENT', label: 'INVESTMENT', icon: TrendingUp },
    { id: 'ADVANCES', label: 'ADVANCES', icon: ArrowRightLeft },
  ],
  LIABILITY: [
    { id: 'LOANS', label: 'LOANS', icon: Landmark },
    { id: 'SUNDRY_CREDITOR', label: 'SUNDRY CREDITOR', icon: Users },
    { id: 'OUTSTANDING_EXP', label: 'OUTSTANDING EXP', icon: Receipt },
    { id: 'SUNDRY_LIABILITY', label: 'SUNDRY LIABILITY', icon: HelpCircle },
  ],
  EQUITY: [
    { id: 'OWNER_CAPITAL', label: 'CAPITAL ACCOUNT', icon: CircleDollarSign },
    { id: 'OWNER_DRAWINGS', label: 'DRAWINGS ACCOUNT', icon: TrendingDown },
  ],
  REVENUE: [
    { id: 'DIRECT_REVENUE', label: 'DIRECT REVENUE', icon: ShoppingBag },
    { id: 'INDIRECT_REVENUE', label: 'INDIRECT REVENUE', icon: CreditCard },
  ],
  EXPENSE: [
    { id: 'DIRECT_EXPENSE', label: 'DIRECT EXPENSE', icon: FileText },
    { id: 'INDIRECT_EXPENSE', label: 'INDIRECT EXPENSE', icon: Receipt },
  ],
};

const AccountProfileModal: React.FC<AccountProfileModalProps> = ({ isOpen, onClose, accountName }) => {
  const { getAccountByName, updateAccount, entries } = useAccounting();
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<AccountType>('ASSET');
  const [classification, setClassification] = useState<AccountClassification | undefined>(undefined);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isOpen && accountName) {
      const acc = getAccountByName(accountName);
      if (acc) {
        setAccount(acc);
        setSelectedType(acc.type);
        setClassification(acc.classification);
        
        let bal = 0;
        entries.forEach(entry => {
          entry.lines.forEach(line => {
            if (line.accountId === acc.id) {
              if (line.type === 'DEBIT') bal += line.amount;
              else bal -= line.amount;
            }
          });
        });
        setBalance(bal);
      }
    }
  }, [isOpen, accountName, getAccountByName, entries]);

  const handleUpdate = () => {
    if (account && classification) {
      updateAccount(account.id, {
        type: selectedType,
        classification,
        finalAccountCategory: (selectedType === 'REVENUE' || selectedType === 'EXPENSE') 
          ? (classification.includes('DIRECT') ? 'DIRECT' : 'INDIRECT') 
          : undefined
      });
      onClose();
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[#0F172A] border border-glass-border rounded-[32px] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
               <ShieldCheck size={22} />
             </div>
             <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{account.name}</h2>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
          
          {/* Step 1: Account Type */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">1. ACCOUNT TYPE</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(TYPE_CONFIG) as AccountType[]).map((type) => {
                const isActive = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setClassification(undefined); }}
                    className={`
                      py-3 rounded-xl border font-black text-[10px] transition-all tracking-widest uppercase
                      ${isActive 
                        ? `${TYPE_CONFIG[type].activeColor} bg-white/[0.05] ring-2 ring-current ring-opacity-10 shadow-lg` 
                        : `${TYPE_CONFIG[type].color} hover:border-gray-700 hover:text-gray-400`}
                    `}
                  >
                    {TYPE_CONFIG[type].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Classification Grid */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 block">2. MAPPING CLASSIFICATION</label>
            <div className="grid grid-cols-2 gap-4">
              {CLASSIFICATION_MAP[selectedType].map((item) => {
                const Icon = item.icon;
                const isActive = classification === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setClassification(item.id)}
                    className={`
                      group relative p-5 rounded-2xl border flex flex-col items-start gap-4 transition-all text-left min-h-[100px]
                      ${isActive 
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(0,243,255,0.15)] ring-1 ring-cyan-500' 
                        : 'bg-black/20 border-gray-800 hover:border-gray-700'}
                    `}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'text-neon-green' : 'text-gray-600'}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className={`text-[11px] font-black tracking-[0.1em] uppercase transition-colors ${isActive ? 'text-neon-green' : 'text-gray-500'}`}>
                        {item.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4">
          <button 
            disabled={!classification} 
            onClick={handleUpdate} 
            className={`
              w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3
              ${classification 
                ? 'bg-[#00f3ff] text-slate-950 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(0,243,255,0.3)]' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'}
            `}
          >
            <Save size={20} /> UPDATE PROFILE
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountProfileModal;
