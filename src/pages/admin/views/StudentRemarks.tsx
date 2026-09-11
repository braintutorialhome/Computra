import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { 
  MessageSquareQuote, Search, Plus, Trash2, Edit2, AlertCircle, 
  CheckCircle2, X, Download, User, Calendar, BookOpen, Filter,
  Sparkles, Award, ShieldAlert, Clock, GraduationCap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SearchableSelect from '../../../components/ui/SearchableSelect';
import { exportCsvFile } from '../../../lib/downloadHelper';
import { StudentRemark } from '../../../types';
import { formatIST, getISTDateString, getISTISOString } from '../../../lib/dateUtils';

type RemarkCategory = 'Academic' | 'Performance' | 'Discipline' | 'Attendance' | 'General';

const CATEGORIES: { label: RemarkCategory; color: string; bg: string; border: string }[] = [
  { label: 'Academic', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'Performance', color: 'text-[#1a72f2]', bg: 'bg-[#1a72f2]/10', border: 'border-[#1a72f2]/20' },
  { label: 'Discipline', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { label: 'Attendance', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { label: 'General', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
];

const PRESET_REMARKS = [
  { category: 'Academic' as RemarkCategory, text: 'Exhibits strong comprehension of course concepts and active participation.' },
  { category: 'Performance' as RemarkCategory, text: 'Demonstrated outstanding scores in theoretical tests and laboratory tasks.' },
  { category: 'Performance' as RemarkCategory, text: 'Needs additional practice in laboratory assignments to improve test marks.' },
  { category: 'Attendance' as RemarkCategory, text: 'Regular and punctual attendance maintained throughout the current session.' },
  { category: 'Attendance' as RemarkCategory, text: 'Irregular attendance noticed. Please maintain minimum required attendance.' },
  { category: 'Discipline' as RemarkCategory, text: 'Displays high degree of institutional discipline and cooperative attitude.' },
  { category: 'General' as RemarkCategory, text: 'Keep up the good effort and continue working towards career milestones.' }
];

export default function StudentRemarks() {
  const { students, remarks, addRemark, updateRemark, deleteRemark, currentUser } = useStorage();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'remarks' | 'students'>('remarks');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState<StudentRemark | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<RemarkCategory>('General');
  const [remarkText, setRemarkText] = useState('');
  const [remarkDate, setRemarkDate] = useState(() => getISTDateString());
  const [formError, setFormError] = useState('');

  // Approved students options for SearchableSelect
  const studentOptions = useMemo(() => 
    students
      .filter(s => s.status === 'approved')
      .map(s => ({
        id: s.id,
        label: `${s.name} (${s.rollNumber || 'No Roll'})`,
        subLabel: `${s.class || s.subject || 'Course'} • ${s.contact || 'No Phone'}`
      })),
    [students]
  );

  // Safe date formatter in IST
  const safeFormatDate = (dateStr?: string, fmt = 'dd MMM yyyy') => {
    return formatIST(dateStr, fmt);
  };

  // Filtered Remarks
  const filteredRemarks = useMemo(() => {
    return remarks.filter(r => {
      const student = students.find(s => s.id === r.studentId);
      const studentName = (student?.name || r.studentName || '').toLowerCase();
      const studentRoll = (student?.rollNumber || '').toLowerCase();
      const studentCourse = (student?.class || student?.subject || '').toLowerCase();
      const text = (r.remark || '').toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch = !q || 
        studentName.includes(q) || 
        studentRoll.includes(q) || 
        studentCourse.includes(q) || 
        text.includes(q);

      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesStudent = studentFilter === 'all' || r.studentId === studentFilter;

      return matchesSearch && matchesCategory && matchesStudent;
    });
  }, [remarks, students, searchTerm, categoryFilter, studentFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = remarks.length;
    const uniqueStudentIds = new Set(remarks.map(r => r.studentId));
    const studentsWithRemarks = uniqueStudentIds.size;
    const academicCount = remarks.filter(r => r.category === 'Academic' || r.category === 'Performance').length;
    const disciplineCount = remarks.filter(r => r.category === 'Discipline' || r.category === 'Attendance').length;

    return { total, studentsWithRemarks, academicCount, disciplineCount };
  }, [remarks]);

  // Open Add Modal
  const handleOpenAdd = (prefillStudentId?: string) => {
    setEditingRemark(null);
    setSelectedStudentId(prefillStudentId || (studentOptions[0]?.id || ''));
    setCategory('General');
    setRemarkText('');
    setRemarkDate(getISTDateString());
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rem: StudentRemark) => {
    setEditingRemark(rem);
    setSelectedStudentId(rem.studentId);
    setCategory((rem.category as RemarkCategory) || 'General');
    setRemarkText(rem.remark);
    setRemarkDate(rem.date ? (rem.date.includes('T') ? rem.date.split('T')[0] : rem.date) : getISTDateString());
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Remark (Add or Update)
  const handleSaveRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!remarkText.trim()) {
      setFormError('Please enter the remark text.');
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    const studentName = student?.name || 'Unknown Student';

    if (editingRemark) {
      updateRemark({
        ...editingRemark,
        studentId: selectedStudentId,
        studentName,
        remark: remarkText.trim(),
        category,
        date: remarkDate ? getISTISOString(remarkDate) : getISTISOString(),
        createdBy: currentUser?.name || 'Admin'
      });
    } else {
      addRemark({
        studentId: selectedStudentId,
        studentName,
        remark: remarkText.trim(),
        category,
        createdBy: currentUser?.name || 'Admin'
      });
    }

    setIsModalOpen(false);
    setEditingRemark(null);
  };

  // Delete Remark
  const handleDeleteConfirm = (id: string) => {
    deleteRemark(id);
    setConfirmDeleteId(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRemarks.length === 0) return;

    const headers = [
      'Student Name',
      'Roll Number',
      'Class / Course',
      'Contact',
      'Category',
      'Remark',
      'Date',
      'Author'
    ];

    const rows = filteredRemarks.map(r => {
      const student = students.find(s => s.id === r.studentId);
      return [
        student?.name || r.studentName || 'Unknown Student',
        student?.rollNumber || 'N/A',
        student?.class || student?.subject || 'N/A',
        student?.contact || 'N/A',
        r.category || 'General',
        r.remark || '',
        safeFormatDate(r.date),
        r.createdBy || 'Admin'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    exportCsvFile(csvContent, `student_remarks_${getISTDateString()}.csv`);
  };

  // Find Category Styling
  const getCategoryMeta = (cat?: string) => {
    return CATEGORIES.find(c => c.label === cat) || CATEGORIES[4];
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#1a72f2]">
              Institutional Dossier
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a72f2]" />
            <span className="text-xs font-bold text-slate-400">Admin Clearance</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mt-1 flex items-center gap-3">
            <MessageSquareQuote className="text-[#1a72f2]" size={32} />
            Student Remarks
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Record, manage, and edit official academic, disciplinary, and performance remarks for students.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={filteredRemarks.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title="Export to CSV"
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1a72f2] hover:bg-[#155fc7] text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#1a72f2]/20 active:scale-95"
          >
            <Plus size={16} />
            Add Student Remark
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-widest">Total Remarks</span>
            <MessageSquareQuote size={18} className="text-[#1a72f2]" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{stats.total}</p>
          <p className="text-[11px] text-slate-500 font-medium">Recorded notes on file</p>
        </div>

        <div className="glass p-5 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-widest">Students Tagged</span>
            <User size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{stats.studentsWithRemarks}</p>
          <p className="text-[11px] text-slate-500 font-medium">Distinct students reviewed</p>
        </div>

        <div className="glass p-5 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-widest">Academic & Scores</span>
            <GraduationCap size={18} className="text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{stats.academicCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Learning & performance</p>
        </div>

        <div className="glass p-5 rounded-3xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-widest">Conduct & Attendance</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{stats.disciplineCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Disciplinary & presence</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('remarks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'remarks'
              ? 'bg-[#1a72f2] text-white shadow-lg shadow-[#1a72f2]/20'
              : 'text-slate-400 hover:text-white glass border border-white/5'
          }`}
        >
          <MessageSquareQuote size={14} />
          All Remarks Feed ({filteredRemarks.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'students'
              ? 'bg-[#1a72f2] text-white shadow-lg shadow-[#1a72f2]/20'
              : 'text-slate-400 hover:text-white glass border border-white/5'
          }`}
        >
          <User size={14} />
          Student Roster Quick-Add
        </button>
      </div>

      {/* Remarks Feed Tab */}
      {activeTab === 'remarks' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search by student name, roll number, course, or remark keyword..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#1a72f2] transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">Category:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setCategoryFilter(cat.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    categoryFilter === cat.label
                      ? `${cat.bg} ${cat.color} ${cat.border} border`
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Student Dropdown Filter */}
            {remarks.length > 0 && (
              <div className="md:w-56">
                <select
                  value={studentFilter}
                  onChange={e => setStudentFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#1a72f2]"
                >
                  <option value="all">All Students</option>
                  {Array.from(new Set(remarks.map(r => r.studentId))).map(sid => {
                    const student = students.find(s => s.id === sid);
                    return (
                      <option key={sid} value={sid}>
                        {student?.name || 'Unknown'} {student?.rollNumber ? `(${student.rollNumber})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Remarks Feed Cards */}
          {filteredRemarks.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-white/5 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-16 h-16 bg-[#1a72f2]/10 text-[#1a72f2] rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquareQuote size={32} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">No Remarks Found</h3>
              <p className="text-xs text-slate-400 font-medium">
                {searchTerm || categoryFilter !== 'all' || studentFilter !== 'all'
                  ? 'No remarks matched your active filters. Try resetting the search or category filter.'
                  : 'No student remarks have been recorded yet. Click "Add Student Remark" to create the first institutional remark.'}
              </p>
              <button
                onClick={() => handleOpenAdd()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1a72f2] text-white text-xs font-black uppercase tracking-wider hover:bg-[#155fc7] transition-all"
              >
                <Plus size={14} />
                Create Remark Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRemarks.map(remark => {
                const student = students.find(s => s.id === remark.studentId);
                const catMeta = getCategoryMeta(remark.category);
                const isConfirmingDelete = confirmDeleteId === remark.id;

                return (
                  <motion.div
                    key={remark.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-6 rounded-3xl border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Row: Student info & Category Badge */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#1a72f2]/10 border border-[#1a72f2]/20 flex items-center justify-center text-[#1a72f2] font-black text-sm uppercase shrink-0">
                            {(student?.name || remark.studentName || 'U').charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white tracking-tight uppercase">
                              {student?.name || remark.studentName || 'Unknown Student'}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                              <span className="font-mono text-slate-300">
                                {student?.rollNumber || 'No Roll ID'}
                              </span>
                              {student?.class && (
                                <>
                                  <span>•</span>
                                  <span>{student.class}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}>
                          {remark.category || 'General'}
                        </span>
                      </div>

                      {/* Remark Text Body */}
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                          "{remark.remark}"
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Metadata & Actions */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>{safeFormatDate(remark.date)}</span>
                        <span>•</span>
                        <span>By {remark.createdBy || 'Admin'}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 p-1 rounded-xl animate-fadeIn">
                            <span className="text-[10px] text-rose-300 font-bold px-1.5">Confirm?</span>
                            <button
                              onClick={() => handleDeleteConfirm(remark.id)}
                              className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(remark)}
                              className="p-2 rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                              title="Edit Remark"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(remark.id)}
                              className="p-2 rounded-xl glass hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                              title="Delete Remark"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Student Roster Quick-Add Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="glass p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Student Directory Quick-Action
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse through enrolled students and click "Add Remark" to immediately append administrative feedback to their record.
              </p>
            </div>
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Filter roster..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#1a72f2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students
              .filter(s => s.status === 'approved')
              .filter(s => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return (
                  s.name.toLowerCase().includes(q) ||
                  (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
                  (s.class && s.class.toLowerCase().includes(q)) ||
                  (s.subject && s.subject.toLowerCase().includes(q))
                );
              })
              .map(student => {
                const studentRemarks = remarks.filter(r => r.studentId === student.id);
                return (
                  <div 
                    key={student.id} 
                    className="glass p-5 rounded-3xl border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-white uppercase">{student.name}</h4>
                          <span className="font-mono text-xs text-[#1a72f2] font-bold">
                            {student.rollNumber || 'No Roll No'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                          {studentRemarks.length} {studentRemarks.length === 1 ? 'Remark' : 'Remarks'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 font-medium">
                        <p>Course: <span className="text-slate-300 font-bold">{student.class || student.subject || 'N/A'}</span></p>
                        {student.contact && <p>Contact: <span className="text-slate-300">{student.contact}</span></p>}
                      </div>

                      {studentRemarks.length > 0 && (
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Latest Remark:</p>
                          <p className="text-xs text-slate-300 italic line-clamp-2">
                            "{studentRemarks[0].remark}"
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenAdd(student.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-[#1a72f2] text-slate-300 hover:text-white border border-white/10 hover:border-transparent text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Plus size={14} />
                      Add Remark
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Remark */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-6 md:p-8 rounded-[36px] border border-white/15 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a72f2]/10 border border-[#1a72f2]/20 flex items-center justify-center text-[#1a72f2]">
                    <MessageSquareQuote size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {editingRemark ? 'Edit Student Remark' : 'New Student Remark'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Official administrative feedback visible on student portal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveRemark} className="space-y-5">
                {/* Student Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Target Student <span className="text-rose-400">*</span>
                  </label>
                  <SearchableSelect
                    options={studentOptions}
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                    placeholder="Search by student name, roll number..."
                    label="Select Student"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Remark Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        type="button"
                        key={cat.label}
                        onClick={() => setCategory(cat.label)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                          category === cat.label
                            ? `${cat.bg} ${cat.color} ${cat.border} border shadow-md`
                            : 'glass border border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Remark Date
                  </label>
                  <input
                    type="date"
                    value={remarkDate}
                    onChange={e => setRemarkDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#1a72f2]"
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <Sparkles size={12} className="text-[#1a72f2]" />
                    <span>Quick Templates / Presets:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_REMARKS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRemarkText(preset.text)}
                        className="text-[11px] px-2.5 py-1 rounded-lg glass border border-white/5 hover:border-white/20 text-slate-300 hover:text-white text-left transition-colors"
                      >
                        + {preset.text.slice(0, 42)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remark Text Area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Official Remark Statement <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                    placeholder="Enter thorough institutional feedback, performance review, or disciplinary remarks..."
                    className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#1a72f2] leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    This note will be visible to the student in their personal student portal under "Remarks".
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl glass text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-[#1a72f2] hover:bg-[#155fc7] text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#1a72f2]/20"
                  >
                    {editingRemark ? 'Save Changes' : 'Publish Remark'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
