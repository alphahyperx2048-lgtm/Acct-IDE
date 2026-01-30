import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccounting } from '../context/AccountingContext';
import { AccountType } from '../types';
import AccountProfileModal from './AccountProfileModal';
import { Search } from 'lucide-react';

const AccountProfiles: React.FC = () => {
  const { accounts, entries } = useAccounting();
  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to get badge styling
  const getBadgeStyle = (type: AccountType) => {
    switch (type) {
      case 'ASSET': return 'text-neon-green border-neon-green/30 bg-neon-green/10';
      case 'LIABILITY': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'EQUITY': return 'text-neon-purple border-neon-purple/30 bg-neon-purple/10';
      case 'REVENUE': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'EXPENSE': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  // Helper to calculate balance
  const getBalance = (accountId: string, type: AccountType) => {
    let bal = 0;
    entries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountId === accountId) {
          if (line.type === 'DEBIT') bal += line.amount;
          else bal -= line.amount;
        }
      });
    });

    // Accounting Logic for Display:
    // Assets/Expenses usually Dr (Positive if Dr > Cr)
    // Liab/Equity/Revenue usually Cr (Positive if Cr > Dr)
    // But for raw balance display, we can show absolute value
    return bal;
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.code.includes(searchTerm)
  );

  return (
    <div className="h-full w-full bg-[#050b14] p-8 overflow-y-auto">
      
      {/* Edit Modal */}
      <AccountProfileModal 
        isOpen={!!selectedAccountName}
        onClose={() => setSelectedAccountName(null)}
        accountName={selectedAccountName || ''}
      />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Profile</h1>
          <p className="text-gray-400">Manage account nature and view consolidated balances. Changes to nature will retroactively affect balance calculation logic.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative shrink-0 w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-glass-border rounded-xl text-white outline-none focus:border-neon-blue/50 focus:bg-white/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20">
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map((acc, index) => {
            const balance = getBalance(acc.id, acc.type);
            const badgeClass = getBadgeStyle(acc.type);
            const initial = acc.name.charAt(0).toUpperCase();
            
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedAccountName(acc.name)}
                className="group cursor-pointer bg-slate-900/50 backdrop-blur-sm border border-glass-border rounded-xl p-6 hover:border-neon-blue/40 transition-all hover:bg-slate-800/80 shadow-lg hover:shadow-neon-blue/5"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start gap-4">
                    {/* Initial Circle */}
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-glass-border flex items-center justify-center text-xl font-bold text-white group-hover:scale-110 transition-transform group-hover:border-neon-blue/50">
                      {initial}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">{acc.name}</h3>
                      <span className="text-xs font-mono text-gray-500">{acc.code}</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border tracking-wider ${badgeClass}`}>
                    {acc.type}
                  </div>
                </div>

                {/* Card Footer / Balance */}
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <span className="text-sm text-gray-400">Current Balance</span>
                  <span className="text-xl font-mono font-bold text-white">
                    ₹ {Math.abs(balance).toLocaleString()}
                  </span>
                </div>
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
            <p>No accounts found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountProfiles;