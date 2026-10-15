import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { formatIST } from '../../../lib/dateUtils';
import { 
  Plus, Trash2, Link as LinkIcon, ExternalLink, Search, Pencil, 
  X, ClipboardList, Filter, Layers, GraduationCap, Calendar, BookOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalTest } from '../../../types';

const AdminTestMaster: React.FC = () => {
  const { externalTests, addExternalTest, updateExternalTest, deleteExternalTest } = useStorage();
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
      const original = externalTests.find(t => t.id === editingId);
      if (original) {
        updateExternalTest({
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
      addExternalTest({
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

  const handleEdit = (test: ExternalTest) => {
    setFormData({
      title: test.title,
      description: test.description || '',
      url: test.url,
      class: test.class || 'XI',
      semester: test.semester || 'Semester-I',
      subject: test.subject || 'Computer Applications',
      session: test.session || '2025-2026'
    });
    setEditingId(test.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter external tests by search term, class, and semester
  const filteredTests = useMemo(() => {
    return externalTests.filter(t => {
      const sTitle = String(t.title || '').toLowerCase();
      const sDesc = String(t.description || '').toLowerCase();
      const sSubject = String(t.subject || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = !search || sTitle.includes(search) || sDesc.includes(search) || sSubject.includes(search);

      // Class match
      const testClass = String(t.class || 'All').replace('Class-', '').trim();
      const selectedClass = filterClass.replace('Class-', '').trim();
      const matchesClass = filterClass === 'All' || testClass === 'All' || testClass.toLowerCase() === selectedClass.toLowerCase();

      // Semester match
      const testSem = String(t.semester || 'All').trim();
      const matchesSemester = filterSemester === 'All' || testSem === 'All' || testSem.toLowerCase() === filterSemester.toLowerCase();

      return matchesSearch && matchesClass && matchesSemester;
    });
  }, [externalTests, searchTerm, filterClass, filterSemester]);

  // Statistics
  const stats = useMemo(() => {
    const total = externalTests.length;
    const classXI = externalTests.filter(t => {
      const c = String(t.class || '').replace('Class-', '').trim();
      return c === 'XI';
    }).length;
    const classXII = externalTests.filter(t => {
      const c = String(t.class || '').replace('Class-', '').trim();
      return c === 'XII';
    }).length;
    const allGen = externalTests.filter(t => !t.class || t.class === 'All').length;
    return { total, classXI, classXII, allGen };
  }, [externalTests]);

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-6 sm:p-8 rounded-[36px] border border-white/5 gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
            <ClipboardList size={26} />
          </div>
          <div>
            <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight">Exam Portal Linker</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Post and manage online exam &amp; test links semester &amp; class wise
            </p>
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
          className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus size={16} /> Add New Exam Link
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Exams</div>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.classXI}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class XI Exams</div>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.classXII}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class XII Exams</div>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats.allGen}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">General Exams</div>
          </div>
        </div>
      </div>

      {/* Create / Edit Form Modal/Drawer */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-[36px] border border-purple-500/20 p-6 sm:p-10 mb-8 shadow-2xl bg-gradient-to-b from-purple-950/20 via-slate-900/60 to-slate-950/80">
              <div className="flex items-center justify-between mb-8 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {editingId ? 'Edit Exam Portal Link' : 'Publish New Online Exam Link'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Configure semester, class, and assessment link for students</p>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-glass w-full py-3.5 px-4 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500"
                      placeholder="e.g. Semester-I Unit Test 2: Python Fundamentals"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* URL */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      External Test / Exam Portal URL *
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        className="input-glass w-full py-3.5 pl-11 pr-4 rounded-2xl text-sm font-bold text-white placeholder:text-slate-500"
                        placeholder="e.g. docs.google.com/forms/... or testportal.com/..."
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
                      <Layers size={13} className="text-purple-400" /> Class Selection
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
                      <BookOpen size={13} className="text-blue-400" /> Subject
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

                  {/* Academic Session */}
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

                {/* Description / Instructions */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Description &amp; Examination Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="input-glass w-full py-3 px-4 rounded-2xl resize-none text-xs text-white placeholder:text-slate-500"
                    placeholder="Provide exam timing, total marks, instructions, or topics covered..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-10 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    {editingId ? 'Update Exam Link' : 'Save & Publish Exam Link'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Toolbar */}
      <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by exam title, subject, instructions..."
              className="input-glass w-full py-3 pl-11 pr-4 rounded-2xl border-white/5 focus:border-purple-500/50 text-xs font-medium text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Drops */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2.5">Class:</span>
              {['All', 'XI', 'XII'].map(c => (
                <button
                  key={c}
                  onClick={() => setFilterClass(c)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    filterClass === c
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {c === 'All' ? 'All' : `Class-${c}`}
                </button>
              ))}
            </div>

            {/* Semester Filter */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2.5">Sem:</span>
              {['All', 'Semester-I', 'Semester-II', 'Semester-III', 'Semester-IV'].map(sem => (
                <button
                  key={sem}
                  onClick={() => setFilterSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    filterSemester === sem
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sem === 'All' ? 'All' : sem.replace('Semester-', 'Sem ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(filterClass !== 'All' || filterSemester !== 'All' || searchTerm) && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <div>
              Showing <span className="font-bold text-white">{filteredTests.length}</span> of {externalTests.length} published exams
              {filterClass !== 'All' && <span className="ml-2 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">Class-{filterClass}</span>}
              {filterSemester !== 'All' && <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">{filterSemester}</span>}
            </div>
            <button
              onClick={() => {
                setFilterClass('All');
                setFilterSemester('All');
                setSearchTerm('');
              }}
              className="text-purple-400 hover:text-purple-300 text-[11px] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Tests Table */}
      <div className="glass rounded-[36px] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Exam Details</th>
                <th className="px-6 py-5">Class &amp; Semester</th>
                <th className="px-6 py-5">Portal URL</th>
                <th className="px-6 py-5">Posted Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => {
                  const testClass = test.class || 'All';
                  const testSem = test.semester || 'All';
                  const testSub = test.subject || 'Computer Applications';

                  return (
                    <motion.tr 
                      key={test.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Title & Subject */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <ClipboardList size={18} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white tracking-tight leading-snug mb-1">
                              {test.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                {testSub}
                              </span>
                              {test.session && test.session !== 'All' && (
                                <span className="text-[10px] text-slate-400">
                                  Session {test.session}
                                </span>
                              )}
                            </div>
                            {test.description && (
                              <span className="text-xs text-slate-400 line-clamp-1 mt-1">
                                {test.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class & Semester Badges */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              testClass === 'XI' || testClass === 'Class-XI'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                                : testClass === 'XII' || testClass === 'Class-XII'
                                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                                : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'
                            }`}>
                              {testClass === 'All' ? 'All Classes' : `Class-${testClass.replace('Class-', '')}`}
                            </span>
                          </div>
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              testSem === 'Semester-I'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : testSem === 'Semester-II'
                                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                                : testSem === 'Semester-III'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                : testSem === 'Semester-IV'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'
                            }`}>
                              {testSem}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* URL Link */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <a 
                          href={test.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3.5 py-2 rounded-xl border border-purple-500/20 shadow-md shadow-purple-500/5 hover:bg-purple-500/20"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Launch Test
                        </a>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-slate-400 font-bold text-xs whitespace-nowrap">
                        {formatIST(test.date, 'dd MMM yyyy')}
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleEdit(test)}
                            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                            title="Edit Exam"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${test.title}"?`)) {
                                deleteExternalTest(test.id);
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <ClipboardList size={44} className="mb-3 text-slate-600" />
                      <p className="text-white font-bold text-sm">No exam portal links found</p>
                      <p className="text-slate-400 text-xs mt-1">Try adjusting your search query, class, or semester filters.</p>
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

export default AdminTestMaster;
