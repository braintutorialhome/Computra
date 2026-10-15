import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { formatIST } from '../../../lib/dateUtils';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Search, FileText, Pencil, X, Filter, Layers, GraduationCap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResultLink } from '../../../types';

const AdminResults: React.FC = () => {
  const { resultLinks, addResultLink, updateResultLink, deleteResultLink } = useStorage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    class: 'XI',
    semester: 'Semester-I',
    subject: 'Computer Applications',
    session: '2025-2026'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    
    // Ensure URL has protocol
    let finalUrl = formData.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    if (editingId) {
      const original = resultLinks.find(r => r.id === editingId);
      if (original) {
        updateResultLink({
          ...original,
          title: formData.title.trim(),
          description: formData.description.trim(),
          url: finalUrl,
          class: formData.class,
          semester: formData.semester,
          subject: formData.subject,
          session: formData.session
        });
      }
    } else {
      addResultLink({
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: finalUrl,
        class: formData.class,
        semester: formData.semester,
        subject: formData.subject,
        session: formData.session
      });
    }
    
    setFormData({ 
      title: '', 
      description: '', 
      url: '',
      class: 'XI',
      semester: 'Semester-I',
      subject: 'Computer Applications',
      session: '2025-2026'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (result: ResultLink) => {
    setFormData({
      title: result.title,
      description: result.description || '',
      url: result.url,
      class: result.class || 'XI',
      semester: result.semester || 'Semester-I',
      subject: result.subject || 'Computer Applications',
      session: result.session || '2025-2026'
    });
    setEditingId(result.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredResults = resultLinks.filter(r => {
    const sTitle = String(r.title || '').toLowerCase();
    const sDesc = String(r.description || '').toLowerCase();
    const sClass = String(r.class || 'All');
    const sSem = String(r.semester || 'All');
    const search = searchTerm.toLowerCase();

    const matchesSearch = !search || sTitle.includes(search) || sDesc.includes(search);
    const matchesClass = filterClass === 'All' || sClass === filterClass || sClass === 'All';
    const matchesSemester = filterSemester === 'All' || sSem === filterSemester || sSem === 'All';

    return matchesSearch && matchesClass && matchesSemester;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-6 sm:p-8 rounded-[36px] border border-white/5 gap-4">
        <div className="flex items-center gap-4">
           <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
             <FileText size={26} />
           </div>
           <div>
             <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight">Result Management</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Post and manage student results semester &amp; class wise</p>
           </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ 
              title: '', 
              description: '', 
              url: '',
              class: 'XI',
              semester: 'Semester-I',
              subject: 'Computer Applications',
              session: '2025-2026'
            });
            setIsAdding(true);
          }}
          className="indigo-button px-8 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/30"
        >
          <Plus size={16} /> Publish Result
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-[40px] border border-white/10 p-6 sm:p-10 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {editingId ? 'Edit Published Result' : 'Publish New Result Link'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Select class, semester, and session to publish result links</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Result Title *</label>
                    <input
                      type="text"
                      required
                      className="input-glass w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500"
                      placeholder="e.g. Semester-I Final Board Result 2025"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Result Link / Drive URL *</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        className="input-glass w-full py-3.5 pl-11 pr-4 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500"
                        placeholder="e.g. drive.google.com/..."
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Class & Semester Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  {/* Class Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                      <Layers size={13} className="text-indigo-400" /> Class Selection
                    </label>
                    <select
                      value={formData.class}
                      onChange={(e) => {
                        const newClass = e.target.value;
                        let newSem = formData.semester;
                        if (newClass === 'XI' && !['Semester-I', 'Semester-II', 'All'].includes(newSem)) {
                          newSem = 'Semester-I';
                        } else if (newClass === 'XII' && !['Semester-III', 'Semester-IV', 'All'].includes(newSem)) {
                          newSem = 'Semester-III';
                        }
                        setFormData({ ...formData, class: newClass, semester: newSem });
                      }}
                      className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer bg-slate-900/90"
                    >
                      <option value="XI" className="bg-slate-900">Class-XI</option>
                      <option value="XII" className="bg-slate-900">Class-XII</option>
                      <option value="All" className="bg-slate-900">All Classes (General)</option>
                    </select>
                  </div>

                  {/* Semester Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-emerald-400" /> Semester Wise
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer bg-slate-900/90"
                    >
                      <option value="Semester-I" className="bg-slate-900">Semester-I</option>
                      <option value="Semester-II" className="bg-slate-900">Semester-II</option>
                      <option value="Semester-III" className="bg-slate-900">Semester-III</option>
                      <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
                      <option value="All" className="bg-slate-900">All Semesters</option>
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-400" /> Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer bg-slate-900/90"
                    >
                      <option value="Computer Applications" className="bg-slate-900">Computer Applications</option>
                      <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                      <option value="All Subjects" className="bg-slate-900">All Subjects / General</option>
                    </select>
                  </div>

                  {/* Session */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                      <Calendar size={13} className="text-amber-400" /> Academic Session
                    </label>
                    <select
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-white cursor-pointer bg-slate-900/90"
                    >
                      <option value="2026-2027" className="bg-slate-900">Session 2026-2027</option>
                      <option value="2025-2026" className="bg-slate-900">Session 2025-2026</option>
                      <option value="2024-2025" className="bg-slate-900">Session 2024-2025</option>
                      <option value="All" className="bg-slate-900">All Sessions</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Instructions / Description (Optional)</label>
                  <textarea
                    rows={2}
                    className="input-glass w-full py-3.5 px-4 rounded-2xl resize-none text-sm font-medium text-white placeholder:text-slate-500"
                    placeholder="Short description or instructions for students..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="glass-button px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="indigo-button px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-950/40"
                  >
                    {editingId ? 'Update Result Link' : 'Confirm & Publish Result'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-5 rounded-3xl border border-white/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search results..."
            className="input-glass w-full py-3 pl-11 pr-4 rounded-xl border-white/5 focus:border-indigo-500/50 transition-all text-xs font-bold text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-300 cursor-pointer bg-slate-900/90"
          >
            <option value="All" className="bg-slate-900">All Classes</option>
            <option value="XI" className="bg-slate-900">Class-XI</option>
            <option value="XII" className="bg-slate-900">Class-XII</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="input-glass w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-300 cursor-pointer bg-slate-900/90"
          >
            <option value="All" className="bg-slate-900">All Semesters</option>
            <option value="Semester-I" className="bg-slate-900">Semester-I</option>
            <option value="Semester-II" className="bg-slate-900">Semester-II</option>
            <option value="Semester-III" className="bg-slate-900">Semester-III</option>
            <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass rounded-[36px] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 sm:px-8 py-5">Result Details</th>
                <th className="px-6 py-5">Class &amp; Semester</th>
                <th className="px-6 py-5">Link</th>
                <th className="px-6 py-5">Published Date</th>
                <th className="px-6 sm:px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <motion.tr 
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-6 sm:px-8 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                          R
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-tight leading-tight mb-1">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-slate-400 line-clamp-1">{result.description}</span>
                          )}
                          {result.subject && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{result.subject}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                          Class: {result.class || 'All'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                          {result.semester || 'All Semesters'}
                        </span>
                        {result.session && result.session !== 'All' && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[9px] font-mono">
                            {result.session}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-[#10b981] hover:text-[#34d399] transition-colors bg-[#10b981]/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Open
                      </a>
                    </td>

                    <td className="px-6 py-5 text-slate-400 text-xs font-bold tracking-tight">
                      {formatIST(result.date, 'dd MMM yyyy')}
                    </td>

                    <td className="px-6 sm:px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEdit(result)}
                          className="p-2 text-indigo-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm(`Are you sure you want to delete result: "${result.title}"?`)) {
                              deleteResultLink(result.id);
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FileText size={40} className="mb-3 text-slate-600" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No result links published yet.</p>
                      <p className="text-slate-500 text-[11px] mt-1">Click "Publish Result" to publish semester &amp; class wise results.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
