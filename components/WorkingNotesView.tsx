
import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2, PenTool, TrendingDown, Save, Eye, CheckCircle2 } from 'lucide-react';
import { useAccounting } from '../context/AccountingContext';
import DepreciationManagerView from './DepreciationManagerView';

type NoteMode = 'ROUGH' | 'DEPRECIATION';

const WorkingNotesView: React.FC = () => {
  const { addSavedNote, savedNotes, deleteSavedNote } = useAccounting();
  
  const [mode, setMode] = useState<NoteMode>('ROUGH');
  
  // Rough Note State
  const [roughTitle, setRoughTitle] = useState('');
  const [roughText, setRoughText] = useState('');
  const [showSavedNotes, setShowSavedNotes] = useState(false);

  const handleSaveNote = () => {
    if(!roughText.trim()) return;
    addSavedNote(roughTitle, roughText);
    setRoughTitle('');
    setRoughText('');
  };

  const loadNote = (note: any) => {
    setRoughTitle(note.title);
    setRoughText(note.content);
    setShowSavedNotes(false);
  };

  return (
    <div className="h-full w-full bg-[#050b14] flex flex-col font-sans">
      {/* Integrated Navigation Header */}
      <div className="shrink-0 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-glass-border bg-[#0a0f1c]/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Working Intelligence</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Workspace Notes & Asset Adjustments</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl border border-glass-border shadow-2xl">
          <button 
            onClick={() => setMode('ROUGH')} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${mode === 'ROUGH' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <PenTool size={14}/> ROUGH PAD
          </button>
          <button 
            onClick={() => setMode('DEPRECIATION')} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2 ${mode === 'DEPRECIATION' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <TrendingDown size={14}/> DEPRECIATION MANAGER
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'ROUGH' ? (
          <div className="h-full p-8 flex flex-col gap-6 max-w-7xl mx-auto">
             <div className="flex gap-4">
               <div className="flex-1 relative">
                 <input 
                   type="text" 
                   placeholder="Note Identifier / Topic..." 
                   value={roughTitle}
                   onChange={(e) => setRoughTitle(e.target.value)}
                   className="w-full bg-slate-900 border border-glass-border rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-cyan-500/50 transition-all"
                 />
               </div>
               <button 
                 onClick={handleSaveNote}
                 className="px-8 py-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-500 hover:text-slate-950 transition-all flex items-center gap-3 shadow-lg group"
               >
                 <Save size={18} className="group-hover:scale-110 transition-transform" /> Save Draft
               </button>
             </div>
             
             <div className="flex-1 relative">
                <textarea 
                  value={roughText}
                  onChange={(e) => setRoughText(e.target.value)}
                  className="w-full h-full bg-slate-900/30 border border-glass-border rounded-[32px] p-8 text-gray-300 font-mono text-base outline-none resize-none focus:border-cyan-500/30 transition-all placeholder:text-gray-800"
                  placeholder="Record temporary calculations, audit observations, or accounting logic drafts here..."
                />
             </div>

             {/* Saved Archive */}
             <div className="bg-[#0a0f1c] border border-glass-border rounded-3xl overflow-hidden shadow-2xl">
                <div 
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                  onClick={() => setShowSavedNotes(!showSavedNotes)}
                >
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg text-gray-500">
                        <Eye size={16} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Saved Intelligence Archive ({savedNotes.length})</span>
                   </div>
                   <div className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">{showSavedNotes ? 'Collapse' : 'Expand'}</div>
                </div>
                
                {showSavedNotes && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto no-scrollbar">
                     {savedNotes.length === 0 ? (
                       <div className="col-span-full py-10 text-center text-gray-700 text-xs italic">No drafts archived in persistent storage.</div>
                     ) : (
                       savedNotes.map(note => (
                         <div key={note.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 group relative transition-all">
                            <h4 className="font-black text-white text-[11px] uppercase truncate mb-2 pr-12 tracking-tight">{note.title || 'Untitled Draft'}</h4>
                            <p className="text-[10px] text-gray-600 font-mono line-clamp-2">{note.content}</p>
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => loadNote(note)} className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-slate-950 transition-all"><Eye size={12}/></button>
                               <button onClick={() => deleteSavedNote(note.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            <DepreciationManagerView />
          </div>
        )}
      </div>

      {/* Compact Status Footer */}
      <div className="h-8 border-t border-glass-border bg-[#0a0f1c] flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
               WORKING_NOTES: ACTIVE
            </div>
            <div className="flex items-center gap-2 opacity-50">
               AUTO_SAVE: ON_LOCAL_STORAGE
            </div>
         </div>
         <div className="flex items-center gap-4 text-[9px] font-bold text-gray-700">
            Engine v2.7 • Session Secure
         </div>
      </div>
    </div>
  );
};

export default WorkingNotesView;
