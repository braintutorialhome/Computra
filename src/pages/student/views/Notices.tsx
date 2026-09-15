import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { 
  Bell, 
  Megaphone, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Copy, 
  Check, 
  Filter, 
  Clock, 
  Tag, 
  Bookmark 
} from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentNotices({ student }: { student: Student }) {
  const { notices } = useStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    notices.forEach(n => {
      if (n.category) set.add(n.category);
    });
    return ['All', ...Array.from(set)];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return notices
      .slice()
      .reverse()
      .filter(n => {
        if (selectedCategory !== 'All' && (n.category || 'General Circular') !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchContent = n.content?.toLowerCase().includes(q);
          const matchRef = n.referenceNo?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchRef) return false;
        }
        return true;
      });
  }, [notices, selectedCategory, searchQuery]);

  const handleCopyNotice = (n: any) => {
    const textToCopy = `[OFFICIAL CIRCULAR - UTC COMPUTRA]\n${n.title}\nRef: ${n.referenceNo || 'N/A'}\nDate: ${safeFormat(n.date, 'dd MMM yyyy, HH:mm')} IST\n\n${n.content}\n\nIssued by UTC Computra`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(n.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/60 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Institutional Registry</p>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Official Notice Board</h1>
          <p className="text-xs font-semibold text-slate-400">
            Official announcements, academic circulars, and institutional notifications for students
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
          <Bell size={16} className="text-indigo-400" />
          <span>{notices.length} Active Circulars</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      {notices.length > 0 && (
        <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by keyword, exam topic, or reference number..."
              className="input-glass w-full pl-12 pr-4 py-3 rounded-2xl text-sm placeholder:text-slate-500 text-white"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2 flex items-center gap-1">
                <Filter size={11} /> Filter:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div 
          key="notices"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-8"
        >
          {filteredNotices.map(n => {
            const isCopied = copiedId === n.id;
            const displayRef = n.referenceNo || `UTC/CIR/${new Date().getFullYear()}/${n.id.slice(0, 4).toUpperCase()}`;

            return (
              <div 
                key={n.id} 
                className={`glass p-8 md:p-12 rounded-[48px] border relative overflow-hidden group transition-all hover:border-white/20 shadow-2xl ${
                  n.isImportant 
                    ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-slate-900/80 to-slate-900' 
                    : 'border-white/10 bg-slate-900/60'
                }`}
              >
                {n.isImportant && (
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 pointer-events-none text-orange-400">
                    <Bell size={180} />
                  </div>
                )}
                
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl flex-shrink-0 ${
                      n.isImportant 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                        : 'bg-white/5 text-indigo-400 border border-white/10'
                    }`}>
                      <Megaphone size={26} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                          Ref: {displayRef}
                        </span>
                        {n.category && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {n.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                        <Clock size={12} className="text-slate-500" />
                        {safeFormat(n.date, 'dd MMMM yyyy, HH:mm')} IST
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {n.isImportant && (
                      <span className="bg-orange-500/20 text-orange-300 text-xs font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full border border-orange-500/30 flex items-center gap-1.5 animate-pulse">
                        <AlertCircle size={13} /> High Priority
                      </span>
                    )}

                    <button
                      onClick={() => handleCopyNotice(n)}
                      className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                      title="Copy announcement"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span className="text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Notice Title */}
                <div className="relative z-10 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                    {n.title}
                  </h3>

                  {/* Arranged Text Paragraphs Same As Provided */}
                  <div className="whitespace-pre-wrap break-words font-sans text-slate-300 leading-relaxed text-base md:text-lg space-y-3 bg-slate-950/50 p-6 md:p-8 rounded-3xl border border-white/5">
                    {n.content}
                  </div>
                </div>
    
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium relative z-10">
                  <span>Issued by: Academic & Administrative Registry, UTC Computra</span>
                  <span className="font-mono text-[10px] text-slate-600">OFFICIAL RECORD</span>
                </div>
              </div>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5 p-8 space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                <Megaphone size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                {searchQuery || selectedCategory !== 'All' ? 'No circulars match your search' : 'No active circulars on notice board'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
