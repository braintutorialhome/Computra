import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Notice } from '../../../types';
import { 
  Plus, 
  Bell, 
  Trash2, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit3, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Pin, 
  Clock, 
  Tag,
  FileText,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { getISTISOString, getISTToday } from '../../../lib/dateUtils';

const NOTICE_CATEGORIES = [
  'General Circular',
  'Academic',
  'Examination',
  'Holiday Notice',
  'Fee Notification',
  'Administrative',
  'Event / Workshop'
];

export default function NoticeManagement() {
  const { notices, addNotice, updateNotice, deleteNotice } = useStorage();
  
  // Modals state
  const [showAdd, setShowAdd] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterPriorityOnly, setFilterPriorityOnly] = useState(false);
  
  // Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New Notice Form state
  const [newNotice, setNewNotice] = useState({ 
    title: '', 
    content: '', 
    isImportant: false,
    category: 'General Circular',
    referenceNo: ''
  });

  // Edit Form state
  const [editForm, setEditForm] = useState<{
    id: string;
    title: string;
    content: string;
    isImportant: boolean;
    category: string;
    referenceNo?: string;
  }>({
    id: '',
    title: '',
    content: '',
    isImportant: false,
    category: 'General Circular',
    referenceNo: ''
  });

  // Open Edit modal pre-filled
  const handleOpenEdit = (n: Notice) => {
    setEditForm({
      id: n.id,
      title: n.title,
      content: n.content,
      isImportant: n.isImportant,
      category: n.category || 'General Circular',
      referenceNo: n.referenceNo || `UTC/CIR/${new Date().getFullYear()}/${n.id.slice(0, 4).toUpperCase()}`
    });
    setEditingNotice(n);
    setEditorTab('write');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;

    const refNo = newNotice.referenceNo.trim() || `UTC/CIR/${new Date().getFullYear()}/${String(notices.length + 1).padStart(2, '0')}`;
    
    addNotice({
      title: newNotice.title.trim(),
      content: newNotice.content,
      isImportant: newNotice.isImportant,
      category: newNotice.category,
      referenceNo: refNo
    });

    setShowAdd(false);
    setNewNotice({ 
      title: '', 
      content: '', 
      isImportant: false,
      category: 'General Circular',
      referenceNo: ''
    });
    setEditorTab('write');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editForm.title.trim() || !editForm.content.trim()) return;

    updateNotice({
      ...editingNotice,
      title: editForm.title.trim(),
      content: editForm.content,
      isImportant: editForm.isImportant,
      category: editForm.category,
      referenceNo: editForm.referenceNo?.trim() || editingNotice.referenceNo,
      updatedAt: getISTISOString()
    });

    setEditingNotice(null);
  };

  const handleTogglePriority = (n: Notice) => {
    updateNotice({
      ...n,
      isImportant: !n.isImportant,
      updatedAt: getISTISOString()
    });
  };

  const handleCopyNotice = (n: Notice) => {
    const textToCopy = `[OFFICIAL CIRCULAR - UTC COMPUTRA]\n${n.title}\nRef: ${n.referenceNo || 'N/A'}\nDate: ${safeFormat(n.date, 'dd MMM yyyy, HH:mm')} IST\nCategory: ${n.category || 'General'}\n\n${n.content}\n\nIssued by Administration, UTC Computra.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(n.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalCount = notices.length;
  const priorityCount = notices.filter(n => n.isImportant).length;
  const academicCount = notices.filter(n => n.category === 'Academic' || n.category === 'Examination').length;
  const holidayCount = notices.filter(n => n.category === 'Holiday Notice').length;

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices
      .slice()
      .reverse()
      .filter(n => {
        if (filterPriorityOnly && !n.isImportant) return false;
        if (selectedCategory !== 'All' && (n.category || 'General Circular') !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title?.toLowerCase().includes(q);
          const matchContent = n.content?.toLowerCase().includes(q);
          const matchRef = n.referenceNo?.toLowerCase().includes(q);
          const matchCategory = n.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchRef && !matchCategory) return false;
        }
        return true;
      });
  }, [notices, filterPriorityOnly, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      {/* 1. OFFICIAL INSTITUTIONAL NOTICE BOARD BANNER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/80 p-8 md:p-10 rounded-[40px] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-white">
          <Bell size={240} />
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-purple-500/20 text-indigo-400 rounded-3xl shadow-xl border border-indigo-500/30 flex-shrink-0">
            <Megaphone size={34} className="text-indigo-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-black text-2xl md:text-3xl text-white tracking-tight">
                Official Notice Board
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Bookmark size={12} /> Institutional Registry
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">
              Institutional Circulars, Academic Notifications & Official Announcements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10 w-full lg:w-auto">
          <button 
            onClick={() => {
              setNewNotice({ 
                title: '', 
                content: '', 
                isImportant: false, 
                category: 'General Circular',
                referenceNo: `UTC/CIR/${new Date().getFullYear()}/${String(notices.length + 1).padStart(2, '0')}` 
              });
              setEditorTab('write');
              setShowAdd(true);
            }}
            className="indigo-button w-full lg:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Publish Notice
          </button>
        </div>
      </div>

      {/* 2. ADVANCE METRICS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Circulars</p>
            <p className="text-3xl font-black text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <FileText size={22} />
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Priority Alerts</p>
            <p className="text-3xl font-black text-orange-300 mt-1">{priorityCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Academic / Exams</p>
            <p className="text-3xl font-black text-indigo-300 mt-1">{academicCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Tag size={22} />
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Holidays & Breaks</p>
            <p className="text-3xl font-black text-emerald-300 mt-1">{holidayCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTER CONTROLS */}
      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by headline, reference number, or keywords..."
              className="input-glass w-full pl-12 pr-4 py-3 rounded-2xl text-sm placeholder:text-slate-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterPriorityOnly(!filterPriorityOnly)}
            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${
              filterPriorityOnly 
                ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30' 
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlertCircle size={15} />
            Priority Only
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2 flex items-center gap-1.5">
            <Filter size={12} /> Category:
          </span>
          {['All', ...NOTICE_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CIRCULARS & NOTICES LIST */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Official Circulars ({filteredNotices.length} of {notices.length})
          </p>
          {notices.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Preserving exact paragraph formatting, blank lines, and bullet lists
            </p>
          )}
        </div>

        {filteredNotices.map((n) => {
          const isCopied = copiedId === n.id;
          const displayRef = n.referenceNo || `UTC/CIR/${new Date().getFullYear()}/${n.id.slice(0, 4).toUpperCase()}`;

          return (
            <div 
              key={n.id} 
              className={`glass p-8 md:p-10 rounded-[36px] border relative group transition-all hover:border-white/20 ${
                n.isImportant 
                  ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-slate-900/60 to-slate-900/90 shadow-xl shadow-orange-500/5' 
                  : 'border-white/10 bg-slate-900/50'
              }`}
            >
              {/* Header metadata row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`p-3 rounded-2xl flex-shrink-0 ${
                    n.isImportant 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    <Megaphone size={20} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">
                        Ref: {displayRef}
                      </span>

                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                        n.category === 'Examination' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : n.category === 'Holiday Notice'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : n.category === 'Academic'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : n.category === 'Fee Notification'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {n.category || 'General Circular'}
                      </span>

                      {n.isImportant && (
                        <span className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                          <AlertCircle size={11} /> High Priority Alert
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-500" />
                        Published: {safeFormat(n.date, 'dd MMM yyyy • HH:mm')} IST
                      </span>
                      {n.updatedAt && (
                        <span className="text-indigo-400 text-[10px] font-bold">
                          • (Edited {safeFormat(n.updatedAt, 'dd MMM, HH:mm')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Controls: Edit, Copy, Priority Toggle, Delete */}
                <div className="flex items-center gap-2 self-end md:self-auto bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handleCopyNotice(n)}
                    title="Copy announcement text"
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} className="text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied!</span>
                      </>
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>

                  <button
                    onClick={() => handleTogglePriority(n)}
                    title={n.isImportant ? 'Remove priority' : 'Mark as high priority'}
                    className={`p-2.5 rounded-xl transition-all ${
                      n.isImportant 
                        ? 'text-orange-400 hover:bg-orange-500/20' 
                        : 'text-slate-400 hover:text-orange-400 hover:bg-white/10'
                    }`}
                  >
                    <Pin size={16} className={n.isImportant ? 'rotate-45' : ''} />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(n)}
                    title="Edit notice details and paragraphs"
                    className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                  >
                    <Edit3 size={16} />
                    <span className="hidden sm:inline text-[11px]">Edit</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setNoticeToDelete(n);
                    }}
                    title="Delete notice"
                    className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Notice Headline */}
              <h4 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug mb-4">
                {n.title}
              </h4>

              {/* Exact Paragraph Arrangement as Provided */}
              <div className="whitespace-pre-wrap break-words font-sans text-slate-300 leading-relaxed text-base md:text-lg space-y-3 bg-slate-950/40 p-6 md:p-8 rounded-2xl border border-white/5">
                {n.content}
              </div>

              {/* Official Footnote / Issuer Seal */}
              <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Issued by: Academic & Administrative Registry, UTC Computra</span>
                <span className="font-mono text-[10px] text-slate-600">STATUS: ACTIVE & VERIFIED</span>
              </div>
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="py-24 text-center glass rounded-[40px] border-2 border-dashed border-white/10 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-600">
              <Bell size={32} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">No Official Notices Found</p>
              <p className="text-slate-500 text-xs mt-1">
                {searchQuery || selectedCategory !== 'All' || filterPriorityOnly 
                  ? 'No circulars match your active filters. Try clearing your search filters.' 
                  : 'No official announcements or circulars have been published yet.'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'All' || filterPriorityOnly) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setFilterPriorityOnly(false);
                }}
                className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:underline pt-2"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. PUBLISH NEW NOTICE MODAL (ADVANCED MULTI-PARAGRAPH EDITOR) */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="glass rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/10 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Publish Official Notice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Post an institutional announcement with preserved paragraph formatting</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdd(false)} 
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-8 space-y-6">
              {/* Row: Title */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                  <span>Notice Headline / Subject *</span>
                  <span className="text-slate-500 font-normal">{newNotice.title.length} chars</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="input-glass w-full py-3.5 px-4 rounded-2xl font-bold text-white placeholder:text-slate-600"
                  placeholder="e.g. Schedule for Upcoming Examination & Lab Assessment"
                />
              </div>

              {/* Grid: Category & Reference No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Category / Classification
                  </label>
                  <select
                    value={newNotice.category}
                    onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                    className="input-glass w-full py-3.5 px-4 rounded-2xl font-semibold text-white bg-slate-900"
                  >
                    {NOTICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Reference Number
                  </label>
                  <input 
                    type="text" 
                    value={newNotice.referenceNo}
                    onChange={(e) => setNewNotice({ ...newNotice, referenceNo: e.target.value })}
                    className="input-glass w-full py-3.5 px-4 rounded-2xl font-mono text-sm text-slate-300"
                    placeholder="e.g. UTC/CIR/2026/05"
                  />
                </div>
              </div>

              {/* Content Editor with Write / Preview Tabs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Notice Content & Text Paragraphs *
                  </label>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editorTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                </div>

                {editorTab === 'write' ? (
                  <div className="space-y-2">
                    <textarea 
                      required
                      rows={8}
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                      className="input-glass w-full p-4 rounded-2xl resize-y font-sans text-sm md:text-base leading-relaxed text-slate-200 placeholder:text-slate-600"
                      placeholder={`Draft your circular here with proper paragraphs...\n\nParagraph 1: State the primary announcement or academic notice clearly.\n\nParagraph 2: List the detailed instructions or bullet schedule:\n• Batch A: Monday to Wednesday\n• Batch B: Thursday to Saturday\n\nParagraph 3: Contact details or office instructions.`}
                    ></textarea>
                    <p className="text-[11px] text-slate-500 italic">
                      Tip: Line breaks, multiple blank lines, and bullet lists will be preserved exactly as entered.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 min-h-[200px] max-h-[320px] overflow-y-auto">
                    {newNotice.content.trim() ? (
                      <div className="whitespace-pre-wrap break-words font-sans text-slate-300 leading-relaxed text-base">
                        {newNotice.content}
                      </div>
                    ) : (
                      <p className="text-slate-600 italic text-sm text-center py-10">
                        Type content in the Write tab to see preview of paragraphs here.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Priority Toggle */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <AlertCircle size={15} className="text-orange-400" />
                    High Priority / Urgent Alert
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Highlight this notice with an orange priority badge and emphasize it for all students
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={newNotice.isImportant}
                    onChange={(e) => setNewNotice({ ...newNotice, isImportant: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="w-1/3 py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Publish Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT NOTICE MODAL (ADMIN EDITING CAPABILITY) */}
      {editingNotice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[60] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="glass rounded-[40px] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/10 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-8 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-500/30">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Edit Notice / Circular</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Modify headline, paragraphs, priority, or category</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingNotice(null)} 
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              {/* Row: Title */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                  <span>Notice Headline / Subject *</span>
                  <span className="text-slate-500 font-normal">{editForm.title.length} chars</span>
                </label>
                <input 
                  required
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input-glass w-full py-3.5 px-4 rounded-2xl font-bold text-white"
                />
              </div>

              {/* Grid: Category & Reference No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Category / Classification
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-glass w-full py-3.5 px-4 rounded-2xl font-semibold text-white bg-slate-900"
                  >
                    {NOTICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Reference Number
                  </label>
                  <input 
                    type="text" 
                    value={editForm.referenceNo || ''}
                    onChange={(e) => setEditForm({ ...editForm, referenceNo: e.target.value })}
                    className="input-glass w-full py-3.5 px-4 rounded-2xl font-mono text-sm text-slate-300"
                  />
                </div>
              </div>

              {/* Content Editor with Write / Preview Tabs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Notice Content & Text Paragraphs *
                  </label>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editorTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                </div>

                {editorTab === 'write' ? (
                  <div className="space-y-2">
                    <textarea 
                      required
                      rows={8}
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="input-glass w-full p-4 rounded-2xl resize-y font-sans text-sm md:text-base leading-relaxed text-slate-200"
                    ></textarea>
                    <p className="text-[11px] text-slate-500 italic">
                      Tip: Paragraphs, blank lines, and bullet lists will be preserved exactly as entered.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/10 min-h-[200px] max-h-[320px] overflow-y-auto">
                    <div className="whitespace-pre-wrap break-words font-sans text-slate-300 leading-relaxed text-base">
                      {editForm.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Toggle */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <AlertCircle size={15} className="text-orange-400" />
                    High Priority / Urgent Alert
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Highlight this notice with an orange priority badge and emphasize it for all students
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={editForm.isImportant}
                    onChange={(e) => setEditForm({ ...editForm, isImportant: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="w-1/3 py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {noticeToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[70] flex items-center justify-center p-4 md:p-6">
          <div className="glass rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-rose-500/30 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 flex-shrink-0">
                <Trash2 size={26} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Delete Notice?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will permanently remove this circular from the board.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {noticeToDelete.referenceNo || 'REF: N/A'}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {noticeToDelete.category || 'General Circular'}
                </span>
              </div>
              <p className="text-sm font-bold text-white line-clamp-2">
                {noticeToDelete.title}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNoticeToDelete(null)}
                className="w-1/2 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNotice(noticeToDelete.id);
                  setNoticeToDelete(null);
                }}
                className="w-1/2 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
