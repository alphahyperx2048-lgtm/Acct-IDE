
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, Code, Save, Info, Sparkles, 
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { JournalEntry, JournalLine, ViewMode, Account, AccountType, AccountClassification } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccounting } from '../context/AccountingContext';
import AccountProfileModal from './AccountProfileModal';
import AccountRegisterModal from './AccountRegisterModal';

function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = (newState: T) => {
    if (JSON.stringify(newState) === JSON.stringify(history[currentIndex])) return;
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };
  const redo = () => { if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1); };

  return { 
    state: history[currentIndex], 
    setState, undo, redo, 
    canUndo: currentIndex > 0, 
    canRedo: currentIndex < history.length - 1, 
    resetHistory: (state: T) => { setHistory([state]); setCurrentIndex(0); } 
  };
}

const JournalIDE: React.FC<{ setView?: (view: ViewMode) => void }> = ({ setView }) => {
  const { accounts, addEntry, getAccountByName, getAccountBalance } = useAccounting();
  
  // Explicitly type initialState to ensure lines are JournalLine[]
  const initialState: { lines: JournalLine[], narration: string } = {
    lines: [
      { id: uuidv4(), type: 'DEBIT', accountId: '', accountName: '', code: '', amount: 0 },
      { id: uuidv4(), type: 'CREDIT', accountId: '', accountName: '', code: '', amount: 0 },
    ],
    narration: ''
  };

  const { state: workingState, setState: setWorkingState, undo, redo, canUndo, canRedo, resetHistory } = useHistory(initialState);
  const { lines: currentLines, narration } = workingState;

  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [profileModalAccount, setProfileModalAccount] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<{lineId: string, name: string, suggestedType?: AccountType, suggestedClass?: AccountClassification} | null>(null);

  const totalDebit = currentLines.filter(l => l.type === 'DEBIT').reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const totalCredit = currentLines.filter(l => l.type === 'CREDIT').reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-GB'), []);

  const filteredSuggestions = useMemo(() => {
    const query = suggestionQuery.toLowerCase().trim();
    if (!query || !activeLineId) return [];
    return accounts.filter(a => a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query)).slice(0, 8);
  }, [suggestionQuery, accounts, activeLineId]);

  const addLine = (type: 'DEBIT' | 'CREDIT') => {
    const nextAmount = type === 'DEBIT' ? Math.max(0, totalCredit - totalDebit) : Math.max(0, totalDebit - totalCredit);
    setWorkingState({ ...workingState, lines: [...currentLines, { id: uuidv4(), type, accountId: '', accountName: '', code: '', amount: nextAmount }] });
  };

  const removeLine = (id: string) => { if (currentLines.length > 2) setWorkingState({ ...workingState, lines: currentLines.filter(l => l.id !== id) }); };

  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    const newLines = currentLines.map(line => line.id === id ? { ...line, [field]: value } : line);
    // Cast newLines to JournalLine[] to resolve type inference issues where [field]: value may be inferred too loosely
    setWorkingState({ ...workingState, lines: newLines as JournalLine[] });
    if (field === 'accountName') { setSuggestionQuery(String(value)); setShowSuggestions(true); setActiveLineId(id); }
  };

  const handleSelectAccount = (lineId: string, acc: Account) => {
    const newLines = currentLines.map(line => line.id === lineId ? { ...line, accountName: acc.name, accountId: acc.id, code: acc.code } : line);
    setWorkingState({ ...workingState, lines: newLines as JournalLine[] });
    setShowSuggestions(false);
    setActiveLineId(null);
  };

  const validateNumericInput = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const rawVal = e.target.value;
    // Strict numeric regex: digits and at most one decimal point
    const filteredVal = rawVal.replace(/[^0-9.]/g, '');
    const finalVal = filteredVal === '' ? 0 : parseFloat(filteredVal);
    updateLine(id, 'amount', isNaN(finalVal) ? 0 : finalVal);
  };

  const getContextualMapping = (line: JournalLine) => {
    const otherLines = currentLines.filter(l => l.id !== line.id);
    const hasPurchase = otherLines.some(l => l.accountName.toLowerCase().includes('purchase'));
    const hasSales = otherLines.some(l => l.accountName.toLowerCase().includes('sales'));
    const hasPR = otherLines.some(l => l.accountName.toLowerCase().includes('purchase return'));
    const hasSR = otherLines.some(l => l.accountName.toLowerCase().includes('sales return'));

    let suggestedType: AccountType = 'ASSET';
    let suggestedClass: AccountClassification = 'CURRENT_ASSET';

    if (hasPurchase || hasSR) {
      suggestedType = 'LIABILITY';
      suggestedClass = 'SUNDRY_CREDITOR';
    } else if (hasSales || hasPR) {
      suggestedType = 'ASSET';
      suggestedClass = 'SUNDRY_DEBTOR';
    }

    setRegistrationData({ 
      lineId: line.id, 
      name: line.accountName,
      suggestedType,
      suggestedClass
    });
  };

  const handlePost = () => {
    const newErrors = [];
    if (!narration.trim()) newErrors.push("Narration is required.");
    if (currentLines.some(l => !l.accountName.trim())) newErrors.push("Undefined account head detected.");
    if (!isBalanced) newErrors.push(`Unbalanced: ${difference.toFixed(2)} diff.`);
    
    setErrors(newErrors);
    if (newErrors.length === 0) {
      const success = addEntry({ id: uuidv4(), date: new Date().toISOString(), narration, lines: currentLines });
      if (success) {
        resetHistory(initialState);
        setWorkingState(initialState);
        setSuccessMsg("TRANSACTION POSTED");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#050b14] bg-grid-white relative font-mono selection:bg-neon-blue/30 overflow-hidden">
      <AccountProfileModal isOpen={!!profileModalAccount} onClose={() => setProfileModalAccount(null)} accountName={profileModalAccount || ''} />
      <AccountRegisterModal 
        isOpen={!!registrationData} 
        onClose={() => setRegistrationData(null)} 
        accountName={registrationData?.name || ''} 
        suggestedType={registrationData?.suggestedType}
        suggestedClass={registrationData?.suggestedClass}
        onSuccess={(acc) => { handleSelectAccount(registrationData!.lineId, acc); setRegistrationData(null); }} 
      />

      {/* Top Header Bar */}
      <div className="h-14 md:h-16 border-b border-[#ffffff10] flex items-center justify-between px-3 md:px-6 bg-[#0a0f1c] shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <div className="flex items-center gap-1.5 md:gap-2 text-[#00f3ff] font-bold text-[10px] md:text-sm tracking-tight shrink-0">
            <Code size={16} className="text-[#00f3ff]" /> <span className="hidden xs:inline">JOURNAL_IDE.ax</span><span className="xs:hidden">IDE.ax</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full md:rounded-2xl border text-[8px] md:text-[10px] font-bold transition-all whitespace-nowrap ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {!isBalanced && <AlertCircle size={10} className="animate-pulse" />}
            <span className="uppercase tracking-widest">{isBalanced ? 'BALANCED' : (difference > 0 ? `DIFF ${difference.toFixed(1)}` : 'UNBALANCED')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={() => setView?.(ViewMode.JOURNAL_LOG)} className="hidden sm:block text-[9px] md:text-[10px] font-bold text-[#f59e0b] hover:underline uppercase tracking-widest">Day Book</button>
          <button onClick={handlePost} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 bg-[#00f3ff08] border border-[#00f3ff40] text-[#00f3ff] text-[9px] md:text-[11px] font-bold rounded-lg md:rounded-xl hover:bg-[#00f3ff] hover:text-slate-950 transition-all group">
            <Save size={12} /> <span className="uppercase tracking-widest">Post</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Line Gutter */}
        <div className="hidden sm:flex w-10 md:w-12 bg-transparent pt-12 flex-col items-center gap-0 text-[10px] md:text-[11px] text-gray-700 font-bold select-none shrink-0 border-r border-white/5">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="h-16 flex items-center justify-center opacity-30">{i + 1}</div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-10 py-6 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 px-1 md:px-2">
              <Sparkles size={14} className="text-[#bc13fe] animate-pulse" />
              <span className="text-gray-600 italic text-[10px] md:text-sm font-medium tracking-tight">// Transaction Date: {todayStr}</span>
            </div>

            <AnimatePresence>
              {successMsg && <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="mb-4 md:mb-6 p-3 md:p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] md:text-xs font-bold rounded-xl flex items-center gap-3"><CheckCircle2 size={16}/> {successMsg}</motion.div>}
              {errors.map((e,i)=><motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} className="mb-2 p-3 md:p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] md:text-xs font-bold rounded-xl flex items-center gap-3"><AlertCircle size={16}/> {e}</motion.div>)}
            </AnimatePresence>

            <div className="space-y-3 md:space-y-4 mb-8">
              {currentLines.map((line) => {
                const isDr = line.type === 'DEBIT';
                const acc = getAccountByName(line.accountName);
                const isNew = line.accountName && !acc;

                return (
                  <motion.div 
                    layout 
                    key={line.id} 
                    className={`group flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 p-3 md:px-5 md:py-3 rounded-xl md:rounded-2xl border transition-all ${isDr ? 'bg-[#10b98103] border-[#10b98115]' : 'bg-[#f59e0b03] border-[#f59e0b15] md:ml-12 lg:ml-16'}`}
                  >
                    <div className="flex items-center gap-3 md:gap-4 flex-1">
                      <button 
                        onClick={() => updateLine(line.id, 'type', isDr ? 'CREDIT' : 'DEBIT')}
                        className={`w-10 md:w-12 h-7 md:h-8 rounded-lg flex items-center justify-center text-[8px] md:text-[10px] font-black border transition-all shrink-0 ${isDr ? 'bg-[#10b98115] border-[#10b98130] text-[#10b981]' : 'bg-[#f59e0b15] border-[#f59e0b30] text-[#f59e0b]'}`}
                      >
                        {isDr ? 'Dr.' : 'Cr.'}
                      </button>

                      <div className="flex-1 relative flex items-center gap-2 md:gap-3">
                        <input 
                          value={line.accountName} 
                          onChange={e => updateLine(line.id, 'accountName', e.target.value)}
                          onFocus={() => { setActiveLineId(line.id); setShowSuggestions(true); }}
                          className={`flex-1 bg-transparent border-b border-white/10 py-1.5 md:py-2.5 text-xs md:text-[15px] font-medium outline-none focus:border-[#00f3ff] transition-all placeholder:text-gray-700 ${isNew ? 'text-gray-400 italic' : 'text-gray-200'}`}
                          placeholder={isDr ? "Debit Account..." : "Credit Account..."}
                        />
                        <div className="flex items-center">
                          <button 
                            onClick={() => isNew && getContextualMapping(line)}
                            className={`transition-all duration-500 p-1 rounded-full ${isNew ? 'animate-glow-pulse text-[#00f3ff] bg-[#00f3ff10] shadow-[0_0_15px_rgba(0,243,255,0.4)]' : 'text-gray-700 hover:text-white'}`}
                          >
                             <Info size={isNew ? 18 : 16} />
                          </button>
                        </div>
                        <AnimatePresence>
                          {showSuggestions && activeLineId === line.id && filteredSuggestions.length > 0 && (
                            <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="absolute top-full left-0 w-full md:max-w-sm bg-[#0a0f1c] border border-white/10 rounded-xl shadow-2xl z-[100] mt-2 overflow-hidden backdrop-blur-2xl">
                              {filteredSuggestions.map((acc) => (
                                <div key={acc.id} onClick={() => handleSelectAccount(line.id, acc)} className="px-4 py-3 cursor-pointer hover:bg-white/5 flex justify-between items-center group transition-colors border-b border-white/5 last:border-0">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] md:text-xs font-bold text-gray-300 group-hover:text-[#00f3ff]">{acc.name}</span>
                                    <span className="text-[8px] md:text-[9px] text-gray-600 tracking-widest">{acc.code}</span>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 justify-between md:justify-end">
                      <div className="flex items-center gap-1.5 md:gap-2 border-b border-white/10 focus-within:border-[#00f3ff] transition-all px-1 md:px-2 flex-1 md:flex-none">
                        <span className="text-gray-600 text-[10px] md:text-xs font-bold">₹</span>
                        <input 
                          type="text" 
                          value={line.amount || ''} 
                          onChange={e => validateNumericInput(e, line.id)}
                          className="w-full md:w-32 bg-transparent py-1.5 md:py-2.5 text-right font-mono font-black text-xs md:text-[15px] outline-none text-white placeholder:text-gray-800" 
                          placeholder="0.00"
                        />
                      </div>
                      <button onClick={() => removeLine(line.id)} className="p-2 text-gray-800 hover:text-red-500 transition-colors opacity-40 hover:opacity-100 shrink-0">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-8 px-1 md:px-2">
              <button onClick={() => addLine('DEBIT')} className="px-3 md:px-5 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all">+ DEBIT</button>
              <button onClick={() => addLine('CREDIT')} className="px-3 md:px-5 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all">+ CREDIT</button>
            </div>

            <div className="space-y-3 md:space-y-5 px-1 md:px-2">
              <div className="flex items-center gap-3">
                <span className="text-[#bc13fe] font-black italic text-[10px] md:text-sm uppercase tracking-tighter shrink-0">Narration:</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <textarea 
                value={narration} 
                onChange={e => setWorkingState({...workingState, narration: e.target.value})}
                className="w-full bg-[#0a0f1c]/30 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 text-gray-400 italic text-xs md:text-base outline-none focus:border-[#bc13fe30] resize-none h-20 md:h-24 transition-all placeholder:text-gray-800"
                placeholder="Enter transaction narration..." 
              />
            </div>

            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row justify-end gap-6 sm:gap-16 border-t border-white/5 pt-8 md:pt-12 px-2">
               <div className="text-right flex flex-col gap-1">
                  <div className="text-[8px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">DEBIT TOTAL</div>
                  <div className="text-2xl md:text-5xl font-mono font-black text-[#10b981] drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {totalDebit.toFixed(2)}
                  </div>
               </div>
               <div className="text-right flex flex-col gap-1">
                  <div className="text-[8px] md:text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">CREDIT TOTAL</div>
                  <div className="text-2xl md:text-5xl font-mono font-black text-[#f59e0b] drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {totalCredit.toFixed(2)}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default JournalIDE;
