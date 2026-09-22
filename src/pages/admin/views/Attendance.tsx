import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { getISTDateString, formatIST, getISTToday } from '../../../lib/dateUtils';
import { exportCsvFile } from '../../../lib/downloadHelper';
import { 
  Calendar, Search, Check, X, Users, Trash2, Edit3, 
  Download, CheckCircle2, XCircle, AlertTriangle, 
  RefreshCw, Plus, Filter, ListFilter, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Attendance } from '../../../types';

type AdminAttendanceTab = 'daily' | 'all_records' | 'present_list' | 'absent_list';

export default function AttendanceManagement() {
  const { students, attendance, markAttendance, updateAttendance, deleteAttendance } = useStorage();
  
  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminAttendanceTab>('daily');

  // Daily Roll Call states
  const [selectedDate, setSelectedDate] = useState(getISTDateString());
  const [dailySearchTerm, setDailySearchTerm] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
  const [confirmDeleteDailyId, setConfirmDeleteDailyId] = useState<string | null>(null);
  const [confirmClearDailyDate, setConfirmClearDailyDate] = useState(false);
  const [confirmMarkAllPresent, setConfirmMarkAllPresent] = useState(false);

  // All Records Master Tab states
  const [allSearchTerm, setAllSearchTerm] = useState('');
  const [allDateFilter, setAllDateFilter] = useState<string>('all');
  const [allClassFilter, setAllClassFilter] = useState<string>('all');
  const [allStatusFilter, setAllStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [confirmDeleteAllId, setConfirmDeleteAllId] = useState<string | null>(null);
  const [selectedAllIds, setSelectedAllIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteAll, setConfirmBulkDeleteAll] = useState(false);

  // Present List states
  const [presentSearchTerm, setPresentSearchTerm] = useState('');
  const [presentDateFilter, setPresentDateFilter] = useState<string>('all');
  const [presentClassFilter, setPresentClassFilter] = useState<string>('all');
  const [confirmDeletePresentId, setConfirmDeletePresentId] = useState<string | null>(null);
  const [selectedPresentIds, setSelectedPresentIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeletePresent, setConfirmBulkDeletePresent] = useState(false);

  // Absent List states
  const [absentSearchTerm, setAbsentSearchTerm] = useState('');
  const [absentDateFilter, setAbsentDateFilter] = useState<string>('all');
  const [absentClassFilter, setAbsentClassFilter] = useState<string>('all');
  const [confirmDeleteAbsentId, setConfirmDeleteAbsentId] = useState<string | null>(null);
  const [selectedAbsentIds, setSelectedAbsentIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteAbsent, setConfirmBulkDeleteAbsent] = useState(false);

  // Edit Modal state for modifying an attendance record
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'present' | 'absent'>('present');
  const [confirmDeleteInModal, setConfirmDeleteInModal] = useState(false);

  // Add / Manual Record Attendance Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStudentId, setAddStudentId] = useState<string>('');
  const [addDate, setAddDate] = useState<string>(getISTDateString());
  const [addStatus, setAddStatus] = useState<'present' | 'absent'>('present');

  // Banner notification message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  // Approved students
  const approvedStudents = useMemo(() => {
    return students.filter(s => s.status === 'approved');
  }, [students]);

  // Unique classes for filtering
  const availableClasses = useMemo(() => {
    const classes = approvedStudents.map(s => s.class || s.subject || 'General').filter(Boolean);
    return ['all', ...Array.from(new Set(classes))];
  }, [approvedStudents]);

  // Daily roll call attendance status getter
  const getAttendanceRecord = (studentId: string, date: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === date);
  };

  const handleMark = (studentId: string, status: 'present' | 'absent') => {
    markAttendance(selectedDate, studentId, status);
  };

  // Daily filtered students
  const dailyFilteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const sName = String(s.name || '').toLowerCase();
      const sRoll = String(s.rollNumber || '').toLowerCase();
      const sClass = String(s.class || s.subject || '').toLowerCase();
      const query = dailySearchTerm.toLowerCase();
      
      const matchesSearch = sName.includes(query) || sRoll.includes(query) || sClass.includes(query);
      if (!matchesSearch) return false;

      const record = getAttendanceRecord(s.id, selectedDate);
      if (dailyStatusFilter === 'present') return record?.status === 'present';
      if (dailyStatusFilter === 'absent') return record?.status === 'absent';
      if (dailyStatusFilter === 'unmarked') return !record;

      return true;
    });
  }, [approvedStudents, dailySearchTerm, dailyStatusFilter, selectedDate, attendance]);

  // Daily stats for selected date
  const dailyStats = useMemo(() => {
    const dateRecords = attendance.filter(a => a.date === selectedDate);
    const presentCount = dateRecords.filter(a => a.status === 'present').length;
    const absentCount = dateRecords.filter(a => a.status === 'absent').length;
    const totalApproved = approvedStudents.length;
    const unmarkedCount = Math.max(0, totalApproved - (presentCount + absentCount));
    const percentage = totalApproved > 0 ? Math.round((presentCount / totalApproved) * 100) : 0;
    return {
      presentCount,
      absentCount,
      unmarkedCount,
      totalApproved,
      percentage,
      recordsCount: dateRecords.length
    };
  }, [attendance, selectedDate, approvedStudents]);

  // All Records enriched list
  const enrichedAllRecords = useMemo(() => {
    return attendance.map(rec => {
      const student = students.find(s => s.id === rec.studentId);
      return {
        ...rec,
        studentName: student?.name || 'Unknown Student',
        studentRoll: student?.rollNumber || 'N/A',
        studentClass: student?.class || student?.subject || 'General',
        studentPhoto: student?.photoUrl || null,
        studentPhone: student?.mobile || student?.whatsapp || 'N/A'
      };
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [attendance, students]);

  // Filtered All Records
  const filteredAllRecords = useMemo(() => {
    return enrichedAllRecords.filter(r => {
      const sName = r.studentName.toLowerCase();
      const sRoll = r.studentRoll.toLowerCase();
      const sClass = r.studentClass.toLowerCase();
      const query = allSearchTerm.toLowerCase();

      const matchesSearch = sName.includes(query) || sRoll.includes(query) || sClass.includes(query);
      if (!matchesSearch) return false;

      if (allDateFilter !== 'all' && r.date !== allDateFilter) return false;
      if (allClassFilter !== 'all' && r.studentClass !== allClassFilter) return false;
      if (allStatusFilter !== 'all' && r.status !== allStatusFilter) return false;

      return true;
    });
  }, [enrichedAllRecords, allSearchTerm, allDateFilter, allClassFilter, allStatusFilter]);

  // Present Records enriched list
  const enrichedPresentRecords = useMemo(() => {
    return enrichedAllRecords.filter(r => r.status === 'present');
  }, [enrichedAllRecords]);

  // Filtered Present Records
  const filteredPresentRecords = useMemo(() => {
    return enrichedPresentRecords.filter(r => {
      const sName = r.studentName.toLowerCase();
      const sRoll = r.studentRoll.toLowerCase();
      const sClass = r.studentClass.toLowerCase();
      const query = presentSearchTerm.toLowerCase();

      const matchesSearch = sName.includes(query) || sRoll.includes(query) || sClass.includes(query);
      if (!matchesSearch) return false;

      if (presentDateFilter !== 'all' && r.date !== presentDateFilter) return false;
      if (presentClassFilter !== 'all' && r.studentClass !== presentClassFilter) return false;

      return true;
    });
  }, [enrichedPresentRecords, presentSearchTerm, presentDateFilter, presentClassFilter]);

  // Absent Records enriched list
  const enrichedAbsentRecords = useMemo(() => {
    return enrichedAllRecords.filter(r => r.status === 'absent');
  }, [enrichedAllRecords]);

  // Filtered Absent Records
  const filteredAbsentRecords = useMemo(() => {
    return enrichedAbsentRecords.filter(r => {
      const sName = r.studentName.toLowerCase();
      const sRoll = r.studentRoll.toLowerCase();
      const sClass = r.studentClass.toLowerCase();
      const query = absentSearchTerm.toLowerCase();

      const matchesSearch = sName.includes(query) || sRoll.includes(query) || sClass.includes(query);
      if (!matchesSearch) return false;

      if (absentDateFilter !== 'all' && r.date !== absentDateFilter) return false;
      if (absentClassFilter !== 'all' && r.studentClass !== absentClassFilter) return false;

      return true;
    });
  }, [enrichedAbsentRecords, absentSearchTerm, absentDateFilter, absentClassFilter]);

  // Handlers for Edit
  const handleOpenEdit = (rec: Attendance) => {
    setEditingRecord(rec);
    setEditDate(rec.date);
    setEditStatus(rec.status);
    setConfirmDeleteInModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    updateAttendance(editingRecord.id, {
      date: editDate,
      status: editStatus
    });

    showNotification(`Attendance updated successfully for ${formatIST(editDate, 'dd MMM yyyy')}`);
    setEditingRecord(null);
  };

  const handleDeleteFromModal = () => {
    if (!editingRecord) return;
    deleteAttendance(editingRecord.id);
    showNotification('Attendance record deleted successfully');
    setEditingRecord(null);
    setConfirmDeleteInModal(false);
  };

  // 1-Click Status Toggle
  const handleToggleStatus = (rec: Attendance) => {
    const newStatus: 'present' | 'absent' = rec.status === 'present' ? 'absent' : 'present';
    updateAttendance(rec.id, { status: newStatus });
    showNotification(`Status switched to ${newStatus.toUpperCase()}`);
  };

  // Daily Mark All Present
  const handleMarkAllFilteredPresent = () => {
    dailyFilteredStudents.forEach(s => {
      markAttendance(selectedDate, s.id, 'present');
    });
    setConfirmMarkAllPresent(false);
    showNotification(`Marked ${dailyFilteredStudents.length} students Present for ${formatIST(selectedDate, 'dd MMM yyyy')}`);
  };

  // Daily Clear Attendance for Selected Date
  const handleClearDailyDate = () => {
    const dateRecords = attendance.filter(a => a.date === selectedDate);
    dateRecords.forEach(r => {
      deleteAttendance(r.id);
    });
    setConfirmClearDailyDate(false);
    showNotification(`Cleared ${dateRecords.length} attendance records for ${formatIST(selectedDate, 'dd MMM yyyy')}`);
  };

  // Manual Add / Record Attendance
  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStudentId) return;
    markAttendance(addDate, addStudentId, addStatus);
    setShowAddModal(false);
    showNotification('Attendance record created successfully');
  };

  // Bulk Delete Helpers
  const toggleSelectAll = (ids: string[], currentSet: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    if (currentSet.size === ids.length && ids.length > 0) {
      setFn(new Set());
    } else {
      setFn(new Set(ids));
    }
  };

  const toggleSelectOne = (id: string, currentSet: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    const next = new Set(currentSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setFn(next);
  };

  const executeBulkDelete = (selectedSet: Set<string>, clearFn: () => void) => {
    const count = selectedSet.size;
    selectedSet.forEach(id => {
      deleteAttendance(id);
    });
    clearFn();
    showNotification(`Deleted ${count} attendance records successfully`);
  };

  // Export CSV Helper
  const handleExportCSV = (records: typeof enrichedAllRecords, filename: string) => {
    const headers = ['Record ID', 'Student Name', 'Roll Number', 'Class / Course', 'Date (IST)', 'Status', 'Phone'];
    const rows = records.map(r => [
      r.id,
      `"${r.studentName}"`,
      r.studentRoll,
      `"${r.studentClass}"`,
      r.date,
      r.status.toUpperCase(),
      `"${r.studentPhone}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    exportCsvFile(csvContent, filename);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Action Notification Toast */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400"
          >
            <CheckCircle2 size={18} />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Attendance Master System
            </span>
            <span className="text-slate-500 text-xs font-bold">•</span>
            <span className="text-slate-400 text-xs font-bold">Edit, Modify & Delete Controls Enabled</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Attendance Management
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Conduct daily roll calls, modify dates or statuses, and delete erroneous records with full administrative control.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setAddStudentId(approvedStudents[0]?.id || '');
              setAddDate(selectedDate || getISTDateString());
              setAddStatus('present');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Record Attendance</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border border-white/5 w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar size={16} />
          Daily Roll Call
        </button>

        <button
          onClick={() => setActiveTab('all_records')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'all_records'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListFilter size={16} />
          All Attendance Records
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'all_records' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
          }`}>
            {enrichedAllRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('present_list')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'present_list'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={16} />
          Present List ({enrichedPresentRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('absent_list')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'absent_list'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <XCircle size={16} />
          Absent List ({enrichedAbsentRecords.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY ROLL CALL                                    */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Daily Toolbar & Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Selected Date (IST)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-glass px-3 py-1.5 rounded-xl text-xs font-bold text-white w-full"
                />
                <button
                  onClick={() => setSelectedDate(getISTDateString())}
                  className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border border-blue-500/20"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Present</span>
                <span className="text-2xl font-black text-white">{dailyStats.presentCount}</span>
                <span className="text-[10px] text-slate-500 block font-bold">of {dailyStats.totalApproved} students</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">Absent</span>
                <span className="text-2xl font-black text-white">{dailyStats.absentCount}</span>
                <span className="text-[10px] text-slate-500 block font-bold">marked absent</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle size={24} />
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Unmarked</span>
                <span className="text-2xl font-black text-white">{dailyStats.unmarkedCount}</span>
                <span className="text-[10px] text-slate-500 block font-bold">Turnout: {dailyStats.percentage}%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Quick Actions & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search students by name, roll number, or class..."
                  value={dailySearchTerm}
                  onChange={(e) => setDailySearchTerm(e.target.value)}
                  className="input-glass pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-white w-full"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                {(['all', 'present', 'absent', 'unmarked'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDailyStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      dailyStatusFilter === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Daily Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {confirmMarkAllPresent ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 p-1.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-400">Mark all {dailyFilteredStudents.length} present?</span>
                  <button
                    onClick={handleMarkAllFilteredPresent}
                    className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-600"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmMarkAllPresent(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmMarkAllPresent(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> Mark All Present
                </button>
              )}

              {dailyStats.recordsCount > 0 && (
                <>
                  {confirmClearDailyDate ? (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400">Delete all {dailyStats.recordsCount} records on this date?</span>
                      <button
                        onClick={handleClearDailyDate}
                        className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmClearDailyDate(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClearDailyDate(true)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Clear Day's Attendance
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Daily Roll Call Table */}
          <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Roll Call for {formatIST(selectedDate, 'EEEE, dd MMMM yyyy')}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Showing {dailyFilteredStudents.length} student records
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-4">Student</th>
                    <th className="px-6 py-4">Class / Course</th>
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-8 py-4 text-right">Attendance Action & Modification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                  {dailyFilteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-500">
                        No students found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    dailyFilteredStudents.map(student => {
                      const record = getAttendanceRecord(student.id, selectedDate);
                      const status = record?.status;

                      return (
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center shrink-0 border border-white/5">
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  student.name?.charAt(0) || 'S'
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm tracking-tight">{student.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">Roll: {student.rollNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-300">
                              {student.class || student.subject || 'General'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {status === 'present' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Check size={12} /> Present
                              </span>
                            )}
                            {status === 'absent' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <X size={12} /> Absent
                              </span>
                            )}
                            {!status && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5">
                                Not Marked
                              </span>
                            )}
                          </td>

                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* Present / Absent Mark Buttons */}
                              <button
                                onClick={() => handleMark(student.id, 'present')}
                                title="Mark Present"
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                                  status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                }`}
                              >
                                <Check size={14} />
                                <span className="hidden sm:inline">Present</span>
                              </button>

                              <button
                                onClick={() => handleMark(student.id, 'absent')}
                                title="Mark Absent"
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                                  status === 'absent'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                    : 'bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
                                }`}
                              >
                                <X size={14} />
                                <span className="hidden sm:inline">Absent</span>
                              </button>

                              {/* Modify / Edit Record Button */}
                              {record && (
                                <button
                                  onClick={() => handleOpenEdit(record)}
                                  title="Edit / Modify Record Date & Status"
                                  className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-colors border border-white/5"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}

                              {/* Delete Attendance Button with Confirmation */}
                              {record && (
                                <>
                                  {confirmDeleteDailyId === record.id ? (
                                    <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                                      <button
                                        onClick={() => {
                                          deleteAttendance(record.id);
                                          setConfirmDeleteDailyId(null);
                                          showNotification('Attendance record deleted');
                                        }}
                                        className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteDailyId(null)}
                                        className="p-1 text-slate-400 hover:text-white"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteDailyId(record.id)}
                                      title="Delete Attendance Record"
                                      className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ALL ATTENDANCE RECORDS (MASTER TABLE)              */}
      {/* ========================================================= */}
      {activeTab === 'all_records' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="glass p-6 rounded-[32px] border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search all records by student, roll number, or class..."
                  value={allSearchTerm}
                  onChange={(e) => setAllSearchTerm(e.target.value)}
                  className="input-glass pl-12 pr-4 py-3 rounded-2xl text-sm font-bold text-white w-full"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                {/* Status Selector */}
                <select
                  value={allStatusFilter}
                  onChange={(e) => setAllStatusFilter(e.target.value as any)}
                  className="input-glass px-4 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Only Present</option>
                  <option value="absent">Only Absent</option>
                </select>

                {/* Class Selector */}
                <select
                  value={allClassFilter}
                  onChange={(e) => setAllClassFilter(e.target.value)}
                  className="input-glass px-4 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
                >
                  <option value="all">All Classes</option>
                  {availableClasses.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Date Filter */}
                <input
                  type="date"
                  value={allDateFilter === 'all' ? '' : allDateFilter}
                  onChange={(e) => setAllDateFilter(e.target.value || 'all')}
                  className="input-glass px-3 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
                />
                {allDateFilter !== 'all' && (
                  <button
                    onClick={() => setAllDateFilter('all')}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Clear Date
                  </button>
                )}

                {/* Export CSV */}
                <button
                  onClick={() => handleExportCSV(filteredAllRecords, `attendance-master-${getISTDateString()}.csv`)}
                  className="px-4 py-3 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-2"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {selectedAllIds.size > 0 && (
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300">
                  {selectedAllIds.size} record{selectedAllIds.size > 1 ? 's' : ''} selected
                </span>

                <div className="flex items-center gap-2">
                  {confirmBulkDeleteAll ? (
                    <div className="flex items-center gap-2 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400">Permanently delete {selectedAllIds.size} records?</span>
                      <button
                        onClick={() => executeBulkDelete(selectedAllIds, () => {
                          setSelectedAllIds(new Set());
                          setConfirmBulkDeleteAll(false);
                        })}
                        className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-black uppercase hover:bg-rose-600"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmBulkDeleteAll(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBulkDeleteAll(true)}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={14} /> Delete Selected
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAllIds(new Set())}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Master Table */}
          <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Master Attendance Log
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Showing {filteredAllRecords.length} records • Click Modify to change date or status • Click Trash to delete
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4 w-12 text-center">
                      <button
                        onClick={() => toggleSelectAll(filteredAllRecords.map(r => r.id), selectedAllIds, setSelectedAllIds)}
                        className="text-slate-400 hover:text-white"
                      >
                        {selectedAllIds.size > 0 && selectedAllIds.size === filteredAllRecords.length ? (
                          <CheckSquare size={16} className="text-blue-400" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Attendance Date (IST)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Admin Actions (Edit / Delete / Toggle)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                  {filteredAllRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-500">
                        No attendance records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAllRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleSelectOne(rec.id, selectedAllIds, setSelectedAllIds)}
                            className="text-slate-400 hover:text-white"
                          >
                            {selectedAllIds.has(rec.id) ? (
                              <CheckSquare size={16} className="text-blue-400" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center shrink-0">
                              {rec.studentPhoto ? (
                                <img src={rec.studentPhoto} alt="" className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                rec.studentName?.charAt(0) || 'S'
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm tracking-tight">{rec.studentName}</p>
                              <p className="text-[10px] font-mono text-slate-400">Roll: {rec.studentRoll}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-300">{rec.studentClass}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-white">{formatIST(rec.date, 'dd MMM yyyy')}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{rec.date}</span>
                        </td>

                        <td className="px-6 py-4">
                          {rec.status === 'present' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check size={12} /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <X size={12} /> Absent
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Quick 1-click status switch */}
                            <button
                              onClick={() => handleToggleStatus(rec)}
                              title={`Switch to ${rec.status === 'present' ? 'Absent' : 'Present'}`}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex items-center gap-1.5 border border-white/5"
                            >
                              <RefreshCw size={12} />
                              <span>Switch</span>
                            </button>

                            {/* Edit / Modify button */}
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              title="Modify Attendance Date & Status"
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors border border-blue-500/20"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete button with 2-step confirmation */}
                            {confirmDeleteAllId === rec.id ? (
                              <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                                <button
                                  onClick={() => {
                                    deleteAttendance(rec.id);
                                    setConfirmDeleteAllId(null);
                                    showNotification('Attendance record deleted');
                                  }}
                                  className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteAllId(null)}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteAllId(rec.id)}
                                title="Delete Attendance Record"
                                className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PRESENT LIST & RECORDS                             */}
      {/* ========================================================= */}
      {activeTab === 'present_list' && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search present students by name, roll, or class..."
                value={presentSearchTerm}
                onChange={(e) => setPresentSearchTerm(e.target.value)}
                className="input-glass pl-12 pr-4 py-3 rounded-2xl text-sm font-bold text-white w-full"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={presentClassFilter}
                onChange={(e) => setPresentClassFilter(e.target.value)}
                className="input-glass px-4 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
              >
                <option value="all">All Classes</option>
                {availableClasses.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <input
                type="date"
                value={presentDateFilter === 'all' ? '' : presentDateFilter}
                onChange={(e) => setPresentDateFilter(e.target.value || 'all')}
                className="input-glass px-3 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
              />
              {presentDateFilter !== 'all' && (
                <button
                  onClick={() => setPresentDateFilter('all')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  All Dates
                </button>
              )}

              <button
                onClick={() => handleExportCSV(filteredPresentRecords, `present-students-${getISTDateString()}.csv`)}
                className="px-4 py-3 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-2"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedPresentIds.size > 0 && (
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                {selectedPresentIds.size} present record{selectedPresentIds.size > 1 ? 's' : ''} selected
              </span>

              <div className="flex items-center gap-2">
                {confirmBulkDeletePresent ? (
                  <div className="flex items-center gap-2 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                    <span className="text-[10px] font-bold text-rose-400">Delete {selectedPresentIds.size} records?</span>
                    <button
                      onClick={() => executeBulkDelete(selectedPresentIds, () => {
                        setSelectedPresentIds(new Set());
                        setConfirmBulkDeletePresent(false);
                      })}
                      className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-black uppercase hover:bg-rose-600"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmBulkDeletePresent(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmBulkDeletePresent(true)}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedPresentIds(new Set())}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Present Log ({filteredPresentRecords.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4 w-12 text-center">
                      <button
                        onClick={() => toggleSelectAll(filteredPresentRecords.map(r => r.id), selectedPresentIds, setSelectedPresentIds)}
                        className="text-slate-400 hover:text-white"
                      >
                        {selectedPresentIds.size > 0 && selectedPresentIds.size === filteredPresentRecords.length ? (
                          <CheckSquare size={16} className="text-emerald-400" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions (Edit / Delete / Switch to Absent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                  {filteredPresentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                        No present records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPresentRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleSelectOne(rec.id, selectedPresentIds, setSelectedPresentIds)}
                            className="text-slate-400 hover:text-white"
                          >
                            {selectedPresentIds.has(rec.id) ? (
                              <CheckSquare size={16} className="text-emerald-400" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{rec.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-400">Roll: {rec.studentRoll}</p>
                        </td>

                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{rec.studentClass}</td>

                        <td className="px-6 py-4 text-xs font-bold text-white">{formatIST(rec.date, 'dd MMM yyyy')}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Switch to Absent */}
                            <button
                              onClick={() => handleToggleStatus(rec)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1 border border-rose-500/20 transition-colors"
                            >
                              <X size={12} /> Switch to Absent
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/5"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete */}
                            {confirmDeletePresentId === rec.id ? (
                              <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                                <button
                                  onClick={() => {
                                    deleteAttendance(rec.id);
                                    setConfirmDeletePresentId(null);
                                    showNotification('Record deleted');
                                  }}
                                  className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeletePresentId(null)}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeletePresentId(rec.id)}
                                className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ABSENT LIST & RECORDS                              */}
      {/* ========================================================= */}
      {activeTab === 'absent_list' && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search absent students by name, roll, or class..."
                value={absentSearchTerm}
                onChange={(e) => setAbsentSearchTerm(e.target.value)}
                className="input-glass pl-12 pr-4 py-3 rounded-2xl text-sm font-bold text-white w-full"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={absentClassFilter}
                onChange={(e) => setAbsentClassFilter(e.target.value)}
                className="input-glass px-4 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
              >
                <option value="all">All Classes</option>
                {availableClasses.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <input
                type="date"
                value={absentDateFilter === 'all' ? '' : absentDateFilter}
                onChange={(e) => setAbsentDateFilter(e.target.value || 'all')}
                className="input-glass px-3 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-900 border border-white/10"
              />
              {absentDateFilter !== 'all' && (
                <button
                  onClick={() => setAbsentDateFilter('all')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  All Dates
                </button>
              )}

              <button
                onClick={() => handleExportCSV(filteredAbsentRecords, `absent-students-${getISTDateString()}.csv`)}
                className="px-4 py-3 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-2"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedAbsentIds.size > 0 && (
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">
                {selectedAbsentIds.size} absent record{selectedAbsentIds.size > 1 ? 's' : ''} selected
              </span>

              <div className="flex items-center gap-2">
                {confirmBulkDeleteAbsent ? (
                  <div className="flex items-center gap-2 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                    <span className="text-[10px] font-bold text-rose-400">Delete {selectedAbsentIds.size} records?</span>
                    <button
                      onClick={() => executeBulkDelete(selectedAbsentIds, () => {
                        setSelectedAbsentIds(new Set());
                        setConfirmBulkDeleteAbsent(false);
                      })}
                      className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-black uppercase hover:bg-rose-600"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setConfirmBulkDeleteAbsent(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmBulkDeleteAbsent(true)}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedAbsentIds(new Set())}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Absent Log ({filteredAbsentRecords.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-4 w-12 text-center">
                      <button
                        onClick={() => toggleSelectAll(filteredAbsentRecords.map(r => r.id), selectedAbsentIds, setSelectedAbsentIds)}
                        className="text-slate-400 hover:text-white"
                      >
                        {selectedAbsentIds.size > 0 && selectedAbsentIds.size === filteredAbsentRecords.length ? (
                          <CheckSquare size={16} className="text-rose-400" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions (Edit / Delete / Switch to Present)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                  {filteredAbsentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-500">
                        No absent records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAbsentRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleSelectOne(rec.id, selectedAbsentIds, setSelectedAbsentIds)}
                            className="text-slate-400 hover:text-white"
                          >
                            {selectedAbsentIds.has(rec.id) ? (
                              <CheckSquare size={16} className="text-rose-400" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{rec.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-400">Roll: {rec.studentRoll}</p>
                        </td>

                        <td className="px-6 py-4 text-xs font-bold text-slate-300">{rec.studentClass}</td>

                        <td className="px-6 py-4 text-xs font-bold text-white">{formatIST(rec.date, 'dd MMM yyyy')}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Switch to Present */}
                            <button
                              onClick={() => handleToggleStatus(rec)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-500/20 transition-colors"
                            >
                              <Check size={12} /> Switch to Present
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(rec)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/5"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete */}
                            {confirmDeleteAbsentId === rec.id ? (
                              <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                                <button
                                  onClick={() => {
                                    deleteAttendance(rec.id);
                                    setConfirmDeleteAbsentId(null);
                                    showNotification('Record deleted');
                                  }}
                                  className="px-2 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteAbsentId(null)}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteAbsentId(rec.id)}
                                className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT ATTENDANCE RECORD MODAL                             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 rounded-[36px] border border-white/10 max-w-lg w-full space-y-6 bg-[#0c1322] shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    Modify Attendance
                  </span>
                  <h3 className="text-xl font-black text-white uppercase mt-0.5">
                    Edit Attendance Record
                  </h3>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student details indicator */}
              {editingRecord && (() => {
                const s = students.find(st => st.id === editingRecord.studentId);
                return (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center">
                      {s?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{s?.name || 'Unknown Student'}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Roll: <span className="text-blue-400 font-bold">{s?.rollNumber || 'N/A'}</span> • {s?.class || s?.subject || 'General'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Attendance Date (IST)
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="input-glass w-full px-4 py-3 rounded-2xl text-sm font-bold text-white"
                  />
                  <span className="text-[11px] text-slate-500 font-bold mt-1 block">
                    {formatIST(editDate, 'EEEE, dd MMMM yyyy')}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditStatus('present')}
                      className={`p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        editStatus === 'present'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <Check size={16} /> Present
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatus('absent')}
                      className={`p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        editStatus === 'absent'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <X size={16} /> Absent
                    </button>
                  </div>
                </div>

                {/* Footer with Delete Record Option */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
                  {confirmDeleteInModal ? (
                    <div className="flex items-center gap-2 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400">Confirm Delete?</span>
                      <button
                        type="button"
                        onClick={handleDeleteFromModal}
                        className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-600"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInModal(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteInModal(true)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete Record
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* ADD / MANUAL RECORD ATTENDANCE MODAL                      */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 rounded-[36px] border border-white/10 max-w-lg w-full space-y-6 bg-[#0c1322] shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    New Attendance Entry
                  </span>
                  <h3 className="text-xl font-black text-white uppercase mt-0.5">
                    Record Attendance
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAttendance} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Select Student
                  </label>
                  <select
                    required
                    value={addStudentId}
                    onChange={(e) => setAddStudentId(e.target.value)}
                    className="input-glass w-full px-4 py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 border border-white/10"
                  >
                    {approvedStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll: {s.rollNumber || 'N/A'} • {s.class || s.subject || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Date (IST)
                  </label>
                  <input
                    type="date"
                    required
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="input-glass w-full px-4 py-3 rounded-2xl text-sm font-bold text-white"
                  />
                  <span className="text-[11px] text-slate-500 font-bold mt-1 block">
                    {formatIST(addDate, 'EEEE, dd MMMM yyyy')}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAddStatus('present')}
                      className={`p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        addStatus === 'present'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <Check size={16} /> Present
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddStatus('absent')}
                      className={`p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                        addStatus === 'absent'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                          : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <X size={16} /> Absent
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
                  >
                    Save Attendance
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
