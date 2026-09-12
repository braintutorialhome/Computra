import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { getISTDateString, formatIST, getISTToday } from '../../../lib/dateUtils';
import { exportFile } from '../../../lib/downloadHelper';
import { 
  Calendar, Search, Check, X, Users, Trash2, Edit3, 
  Download, ArrowRight, CheckCircle2, XCircle, AlertTriangle, 
  RefreshCw, CalendarCheck, Clock, BookOpen, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Attendance } from '../../../types';

type AdminAttendanceTab = 'daily' | 'present_list' | 'absent_list';

export default function AttendanceManagement() {
  const { students, attendance, markAttendance, updateAttendance, deleteAttendance } = useStorage();
  
  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminAttendanceTab>('daily');

  // Daily Roll Call states
  const [selectedDate, setSelectedDate] = useState(getISTDateString());
  const [dailySearchTerm, setDailySearchTerm] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');

  // Present List states
  const [presentSearchTerm, setPresentSearchTerm] = useState('');
  const [presentDateFilter, setPresentDateFilter] = useState<string>('all');
  const [presentClassFilter, setPresentClassFilter] = useState<string>('all');
  const [confirmDeletePresentId, setConfirmDeletePresentId] = useState<string | null>(null);

  // Absent List states
  const [absentSearchTerm, setAbsentSearchTerm] = useState('');
  const [absentDateFilter, setAbsentDateFilter] = useState<string>('all');
  const [absentClassFilter, setAbsentClassFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit Modal state for modifying an attendance record
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'present' | 'absent'>('present');

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

  const handleClearDaily = (studentId: string) => {
    const rec = getAttendanceRecord(studentId, selectedDate);
    if (rec) {
      deleteAttendance(rec.id);
    }
  };

  // Daily filtered students
  const dailyFilteredStudents = useMemo(() => {
    return approvedStudents.filter(s => {
      const sName = String(s.name || '').toLowerCase();
      const sRoll = String(s.rollNumber || '').toLowerCase();
      const sClass = String(s.class || s.subject || '').toLowerCase();
      const search = dailySearchTerm.toLowerCase();
      const matchesSearch = sName.includes(search) || sRoll.includes(search) || sClass.includes(search);
      if (!matchesSearch) return false;

      const record = getAttendanceRecord(s.id, selectedDate);
      const status = record?.status;

      if (dailyStatusFilter === 'present') return status === 'present';
      if (dailyStatusFilter === 'absent') return status === 'absent';
      if (dailyStatusFilter === 'unmarked') return !status;
      return true;
    });
  }, [approvedStudents, dailySearchTerm, dailyStatusFilter, selectedDate, attendance]);

  // Daily metrics
  const dailyPresentCount = attendance.filter(a => a.date === selectedDate && a.status === 'present').length;
  const dailyAbsentCount = attendance.filter(a => a.date === selectedDate && a.status === 'absent').length;
  const dailyTotalMarked = attendance.filter(a => a.date === selectedDate).length;
  const dailyUnmarkedCount = Math.max(0, approvedStudents.length - dailyTotalMarked);

  // Master Present Records enriched with student details
  const enrichedPresentRecords = useMemo(() => {
    return attendance
      .filter(a => a.status === 'present')
      .map(a => {
        const student = students.find(s => s.id === a.studentId);
        return {
          ...a,
          studentName: student?.name || 'Unknown Student',
          rollNumber: student?.rollNumber || 'N/A',
          className: student?.class || student?.subject || 'N/A',
          mobile: student?.mobile || student?.whatsapp || 'N/A',
          studentStatus: student?.status || 'unknown'
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [attendance, students]);

  // Unique dates for present filter
  const availablePresentDates = useMemo(() => {
    const dates = enrichedPresentRecords.map(r => r.date).filter(Boolean);
    return ['all', ...Array.from(new Set(dates)).sort((a: string, b: string) => b.localeCompare(a))];
  }, [enrichedPresentRecords]);

  // Filtered Present Records
  const filteredPresentRecords = useMemo(() => {
    return enrichedPresentRecords.filter(record => {
      // Date filter
      if (presentDateFilter !== 'all' && record.date !== presentDateFilter) {
        return false;
      }
      // Class filter
      if (presentClassFilter !== 'all' && record.className !== presentClassFilter) {
        return false;
      }
      // Search term
      if (presentSearchTerm) {
        const q = presentSearchTerm.toLowerCase();
        const matches = 
          record.studentName.toLowerCase().includes(q) ||
          record.rollNumber.toLowerCase().includes(q) ||
          record.className.toLowerCase().includes(q) ||
          record.date.toLowerCase().includes(q) ||
          formatIST(record.date, 'dd MMMM yyyy EEEE').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [enrichedPresentRecords, presentDateFilter, presentClassFilter, presentSearchTerm]);

  // Quick modify present record to absent
  const handleSwitchToAbsent = (record: Attendance) => {
    updateAttendance({
      ...record,
      status: 'absent'
    });
  };

  // Delete present record
  const handleDeletePresentRecord = (id: string) => {
    deleteAttendance(id);
    setConfirmDeletePresentId(null);
  };

  // Export present records to CSV
  const handleExportPresentCsv = () => {
    const headers = ['Record ID', 'Student Name', 'Roll Number', 'Class / Batch', 'Present Date (IST)', 'Status', 'Mobile'];
    const rows = filteredPresentRecords.map(r => [
      r.id,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      `"${r.rollNumber}"`,
      `"${(r.className || '').replace(/"/g, '""')}"`,
      `"${formatIST(r.date, 'yyyy-MM-dd (EEEE)')}"`,
      'Present',
      `"${r.mobile}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `UTC_Present_List_${getISTDateString().replace(/-/g, '')}.csv`;

    exportFile({
      blob,
      fileName,
      mimeType: 'text/csv',
    });
  };

  // Master Absent Records enriched with student details
  const enrichedAbsentRecords = useMemo(() => {
    return attendance
      .filter(a => a.status === 'absent')
      .map(a => {
        const student = students.find(s => s.id === a.studentId);
        return {
          ...a,
          studentName: student?.name || 'Unknown Student',
          rollNumber: student?.rollNumber || 'N/A',
          className: student?.class || student?.subject || 'N/A',
          mobile: student?.mobile || student?.whatsapp || 'N/A',
          studentStatus: student?.status || 'unknown'
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [attendance, students]);

  // Unique dates for absent filter
  const availableAbsentDates = useMemo(() => {
    const dates = enrichedAbsentRecords.map(r => r.date).filter(Boolean);
    return ['all', ...Array.from(new Set(dates)).sort((a: string, b: string) => b.localeCompare(a))];
  }, [enrichedAbsentRecords]);

  // Filtered Absent Records
  const filteredAbsentRecords = useMemo(() => {
    return enrichedAbsentRecords.filter(record => {
      // Date filter
      if (absentDateFilter !== 'all' && record.date !== absentDateFilter) {
        return false;
      }
      // Class filter
      if (absentClassFilter !== 'all' && record.className !== absentClassFilter) {
        return false;
      }
      // Search term
      if (absentSearchTerm) {
        const q = absentSearchTerm.toLowerCase();
        const matches = 
          record.studentName.toLowerCase().includes(q) ||
          record.rollNumber.toLowerCase().includes(q) ||
          record.className.toLowerCase().includes(q) ||
          record.date.toLowerCase().includes(q) ||
          formatIST(record.date, 'dd MMMM yyyy EEEE').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [enrichedAbsentRecords, absentDateFilter, absentClassFilter, absentSearchTerm]);

  // Quick modify absent record to present
  const handleSwitchToPresent = (record: Attendance) => {
    updateAttendance({
      ...record,
      status: 'present'
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (record: Attendance) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditStatus(record.status);
  };

  // Save modified record
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updateAttendance({
      ...editingRecord,
      date: editDate,
      status: editStatus
    });
    setEditingRecord(null);
  };

  // Delete absent record
  const handleDeleteRecord = (id: string) => {
    deleteAttendance(id);
    setConfirmDeleteId(null);
  };

  // Export absent records to CSV
  const handleExportAbsentCsv = () => {
    const headers = ['Record ID', 'Student Name', 'Roll Number', 'Class / Batch', 'Absent Date (IST)', 'Status', 'Mobile'];
    const rows = filteredAbsentRecords.map(r => [
      r.id,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      `"${r.rollNumber}"`,
      `"${(r.className || '').replace(/"/g, '""')}"`,
      `"${formatIST(r.date, 'yyyy-MM-dd (EEEE)')}"`,
      'Absent',
      `"${r.mobile}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `UTC_Absent_List_${getISTDateString().replace(/-/g, '')}.csv`;

    exportFile({
      blob,
      fileName,
      mimeType: 'text/csv',
    });
  };

  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
              Operations Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-bold text-slate-500">Student Attendance</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mt-2 flex items-center gap-3">
            <CalendarCheck className="text-indigo-500" size={32} />
            Attendance <span className="text-slate-700">/</span> Management
          </h1>
          <p className="text-xs font-bold text-slate-500 max-w-xl leading-relaxed mt-1">
            Conduct daily student roll calls, monitor attendance, and review, modify or delete present and absent records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border border-white/5 w-fit flex-wrap">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={16} />
            Daily Roll Call
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
            Present List & Records
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'present_list' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {enrichedPresentRecords.length}
            </span>
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
            Absent List & Records
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'absent_list' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {enrichedAbsentRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY ROLL CALL                                    */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Operation Date Card */}
            <div className="glass p-8 rounded-[36px] border border-white/5 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operation Date (IST)</p>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-2xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setSelectedDate(getISTDateString())}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                >
                  <RefreshCw size={12} /> Today (IST)
                </button>
                <span className="text-[10px] font-bold text-slate-500">
                  {formatIST(selectedDate, 'EEEE')}
                </span>
              </div>
            </div>

            {/* Present KPI */}
            <div className="glass p-8 rounded-[36px] border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                  <Check size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Present Today</p>
                  <h3 className="text-3xl font-black text-emerald-400">{dailyPresentCount}</h3>
                </div>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${approvedStudents.length ? (dailyPresentCount / approvedStudents.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Absent KPI */}
            <div className="glass p-8 rounded-[36px] border border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl">
                  <X size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Absent Today</p>
                  <h3 className="text-3xl font-black text-rose-400">{dailyAbsentCount}</h3>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-6">
                <span>Absent Rate</span>
                <span className="text-rose-400 font-black">
                  {approvedStudents.length ? Math.round((dailyAbsentCount / approvedStudents.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Total Marked & Unmarked */}
            <div className="glass p-8 rounded-[36px] border border-white/5 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                  <Users size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Roll Call Status</p>
                  <h3 className="text-3xl font-black text-white">{dailyTotalMarked}/{approvedStudents.length}</h3>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-6 uppercase tracking-widest flex items-center justify-between">
                <span>Unmarked</span>
                <span className="text-amber-400 font-bold">{dailyUnmarkedCount} students</span>
              </p>
            </div>
          </div>

          {/* Roll Call Table Card */}
          <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Daily Roll Call
                </h3>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl">
                  {formatIST(selectedDate, 'dd MMMM yyyy')}
                </span>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                <button
                  onClick={() => setDailyStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dailyStatusFilter === 'all'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({approvedStudents.length})
                </button>
                <button
                  onClick={() => setDailyStatusFilter('absent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dailyStatusFilter === 'absent'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  <X size={12} /> Absent ({dailyAbsentCount})
                </button>
                <button
                  onClick={() => setDailyStatusFilter('present')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    dailyStatusFilter === 'present'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <Check size={12} /> Present ({dailyPresentCount})
                </button>
                <button
                  onClick={() => setDailyStatusFilter('unmarked')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dailyStatusFilter === 'unmarked'
                      ? 'bg-amber-500 text-white'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  Unmarked ({dailyUnmarkedCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search student or roll..."
                  value={dailySearchTerm}
                  onChange={(e) => setDailySearchTerm(e.target.value)}
                  className="input-glass w-full pl-11 py-2.5 rounded-2xl text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Student Information</th>
                    <th className="px-8 py-5">Batch / Class</th>
                    <th className="px-8 py-5">Status on {formatIST(selectedDate, 'dd MMM')}</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dailyFilteredStudents.length > 0 ? (
                    dailyFilteredStudents.map((s, idx) => {
                      const record = getAttendanceRecord(s.id, selectedDate);
                      const status = record?.status;

                      return (
                        <tr key={s.id ? `daily-stud-${s.id}` : `daily-idx-${idx}`} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white tracking-tight">{s.name}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                  Roll: <span className="text-indigo-400">{s.rollNumber || 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-5 text-xs font-bold text-slate-300">
                            {s.class || s.subject || 'General'}
                          </td>

                          <td className="px-8 py-5">
                            {status ? (
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border inline-flex items-center gap-1.5 ${
                                status === 'present' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {status === 'present' ? <Check size={12}/> : <X size={12}/>} 
                                {status}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic px-2 py-1 rounded bg-white/5">
                                Unmarked
                              </span>
                            )}
                          </td>

                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button 
                                onClick={() => handleMark(s.id, 'present')}
                                title="Mark Present"
                                className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 ${
                                  status === 'present' 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                }`}
                              >
                                <Check size={14} />
                                <span className="hidden sm:inline">Present</span>
                              </button>

                              <button 
                                onClick={() => handleMark(s.id, 'absent')}
                                title="Mark Absent"
                                className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 ${
                                  status === 'absent' 
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                                    : 'bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
                                }`}
                              >
                                <X size={14} />
                                <span className="hidden sm:inline">Absent</span>
                              </button>

                              {status && (
                                <button
                                  onClick={() => handleClearDaily(s.id)}
                                  title="Clear / Reset Attendance"
                                  className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-colors"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-slate-500 text-xs">
                        No students match the current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRESENT LIST & RECORDS                             */}
      {/* ========================================================= */}
      {activeTab === 'present_list' && (
        <div className="space-y-8">
          {/* Header Banner for Present Management */}
          <div className="glass p-8 rounded-[40px] border border-emerald-500/20 relative overflow-hidden bg-emerald-500/[0.02]">
            <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none text-emerald-500">
              <CheckCircle2 size={180} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                  Present Attendance Registry
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                  All Present Attendance Records
                </h2>
                <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
                  Review student present attendance across all dates. Admins can quickly convert any present record into an absent mark, modify the date/record, or permanently delete the record.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportPresentCsv}
                  disabled={filteredPresentRecords.length === 0}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 disabled:opacity-40"
                >
                  <Download size={16} className="text-emerald-400" />
                  Export Present CSV
                </button>
              </div>
            </div>

            {/* Quick present stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5 relative z-10">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Present Records</p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{enrichedPresentRecords.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtered Records</p>
                <p className="text-2xl font-black text-white mt-0.5">{filteredPresentRecords.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unique Students</p>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">
                  {new Set(enrichedPresentRecords.map(r => r.studentId)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search student, roll, or class..."
                  value={presentSearchTerm}
                  onChange={(e) => setPresentSearchTerm(e.target.value)}
                  className="input-glass w-full pl-11 py-2.5 rounded-2xl text-xs"
                />
              </div>

              {/* Date Filter */}
              <select
                value={presentDateFilter}
                onChange={(e) => setPresentDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-[#0b1329] text-white">All Present Dates</option>
                {availablePresentDates.filter(d => d !== 'all').map(d => (
                  <option key={d} value={d} className="bg-[#0b1329] text-white">
                    {formatIST(d, 'dd MMM yyyy (EEE)')}
                  </option>
                ))}
              </select>

              {/* Class Filter */}
              {availableClasses.length > 1 && (
                <select
                  value={presentClassFilter}
                  onChange={(e) => setPresentClassFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all" className="bg-[#0b1329] text-white">All Classes / Batches</option>
                  {availableClasses.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c} className="bg-[#0b1329] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {(presentSearchTerm || presentDateFilter !== 'all' || presentClassFilter !== 'all') && (
              <button
                onClick={() => {
                  setPresentSearchTerm('');
                  setPresentDateFilter('all');
                  setPresentClassFilter('all');
                }}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all self-end md:self-auto"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Present Records Table */}
          <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Student Information</th>
                    <th className="px-8 py-6">Batch / Class</th>
                    <th className="px-8 py-6">Present Date (IST)</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPresentRecords.length > 0 ? (
                    filteredPresentRecords.map((record) => {
                      return (
                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center font-black">
                                {record.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white tracking-tight">{record.studentName}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                  Roll: <span className="text-indigo-400">{record.rollNumber}</span>
                                  {record.mobile !== 'N/A' && (
                                    <span className="text-slate-500 ml-2">Ph: {record.mobile}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-6 text-xs font-bold text-slate-300">
                            {record.className}
                          </td>

                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white">
                                {formatIST(record.date, 'EEEE, dd MMMM yyyy')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {record.date} (IST)
                              </span>
                            </div>
                          </td>

                          <td className="px-8 py-6">
                            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                              <Check size={12} /> Present
                            </span>
                          </td>

                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* 1-Click Convert to Absent */}
                              <button
                                onClick={() => handleSwitchToAbsent(record)}
                                title="Change status to Absent"
                                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/20 flex items-center gap-1.5"
                              >
                                <X size={14} />
                                <span className="hidden sm:inline">Mark Absent</span>
                              </button>

                              {/* Edit record (Date or Status) */}
                              <button
                                onClick={() => handleOpenEdit(record)}
                                title="Edit Date / Record"
                                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors border border-white/5"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete Record with Confirmation */}
                              {confirmDeletePresentId === record.id ? (
                                <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20 animate-pulse">
                                  <button
                                    onClick={() => handleDeletePresentRecord(record.id)}
                                    className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors"
                                  >
                                    Confirm
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
                                  onClick={() => setConfirmDeletePresentId(record.id)}
                                  title="Delete Present Record"
                                  className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mx-auto">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                          </div>
                          <h4 className="text-lg font-black text-white uppercase">No Present Records Found</h4>
                          <p className="text-xs text-slate-400">
                            {enrichedPresentRecords.length === 0 
                              ? 'There are currently zero present records in the database.' 
                              : 'No present records match your current search or date filters.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ABSENT LIST & RECORDS                              */}
      {/* ========================================================= */}
      {activeTab === 'absent_list' && (
        <div className="space-y-8">
          {/* Header Banner for Absent Management */}
          <div className="glass p-8 rounded-[40px] border border-rose-500/20 relative overflow-hidden bg-rose-500/[0.02]">
            <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none text-rose-500">
              <XCircle size={180} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">
                  Absentee Control Registry
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                  All Absent Attendance Records
                </h2>
                <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
                  Review student absences across all dates. Admins can quickly convert any absence into a present mark, modify the date/record, or permanently delete the record.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportAbsentCsv}
                  disabled={filteredAbsentRecords.length === 0}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 disabled:opacity-40"
                >
                  <Download size={16} className="text-indigo-400" />
                  Export Absent CSV
                </button>
              </div>
            </div>

            {/* Quick absent stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5 relative z-10">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Absent Records</p>
                <p className="text-2xl font-black text-rose-400 mt-0.5">{enrichedAbsentRecords.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filtered Records</p>
                <p className="text-2xl font-black text-white mt-0.5">{filteredAbsentRecords.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unique Students</p>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">
                  {new Set(enrichedAbsentRecords.map(r => r.studentId)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search student, roll, or class..."
                  value={absentSearchTerm}
                  onChange={(e) => setAbsentSearchTerm(e.target.value)}
                  className="input-glass w-full pl-11 py-2.5 rounded-2xl text-xs"
                />
              </div>

              {/* Date Filter */}
              <select
                value={absentDateFilter}
                onChange={(e) => setAbsentDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-[#0b1329] text-white">All Absent Dates</option>
                {availableAbsentDates.filter(d => d !== 'all').map(d => (
                  <option key={d} value={d} className="bg-[#0b1329] text-white">
                    {formatIST(d, 'dd MMM yyyy (EEE)')}
                  </option>
                ))}
              </select>

              {/* Class Filter */}
              {availableClasses.length > 1 && (
                <select
                  value={absentClassFilter}
                  onChange={(e) => setAbsentClassFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all" className="bg-[#0b1329] text-white">All Classes / Batches</option>
                  {availableClasses.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c} className="bg-[#0b1329] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {(absentSearchTerm || absentDateFilter !== 'all' || absentClassFilter !== 'all') && (
              <button
                onClick={() => {
                  setAbsentSearchTerm('');
                  setAbsentDateFilter('all');
                  setAbsentClassFilter('all');
                }}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all self-end md:self-auto"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Absent Records Table */}
          <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Student Information</th>
                    <th className="px-8 py-6">Batch / Class</th>
                    <th className="px-8 py-6">Absent Date (IST)</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAbsentRecords.length > 0 ? (
                    filteredAbsentRecords.map((record) => {
                      return (
                        <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center font-black">
                                {record.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-white tracking-tight">{record.studentName}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                  Roll: <span className="text-indigo-400">{record.rollNumber}</span>
                                  {record.mobile !== 'N/A' && (
                                    <span className="text-slate-500 ml-2">Ph: {record.mobile}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-6 text-xs font-bold text-slate-300">
                            {record.className}
                          </td>

                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white">
                                {formatIST(record.date, 'EEEE, dd MMMM yyyy')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {record.date} (IST)
                              </span>
                            </div>
                          </td>

                          <td className="px-8 py-6">
                            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5">
                              <X size={12} /> Absent
                            </span>
                          </td>

                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* 1-Click Convert to Present */}
                              <button
                                onClick={() => handleSwitchToPresent(record)}
                                title="Change status to Present"
                                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/20 flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span className="hidden sm:inline">Mark Present</span>
                              </button>

                              {/* Edit record (Date or Status) */}
                              <button
                                onClick={() => handleOpenEdit(record)}
                                title="Edit Date / Record"
                                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors border border-white/5"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete Record with Confirmation */}
                              {confirmDeleteId === record.id ? (
                                <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20 animate-pulse">
                                  <button
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="p-1 text-slate-400 hover:text-white"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(record.id)}
                                  title="Delete Absent Record"
                                  className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-white/5"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 mx-auto">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                          </div>
                          <h4 className="text-lg font-black text-white uppercase">No Absent Records Found</h4>
                          <p className="text-xs text-slate-400">
                            {enrichedAbsentRecords.length === 0 
                              ? 'There are currently zero absent records in the database.' 
                              : 'No absent records match your current search or date filters.'}
                          </p>
                        </div>
                      </td>
                    </tr>
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
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
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center">
                      {s?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{s?.name || 'Unknown Student'}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Roll: <span className="text-indigo-400 font-bold">{s?.rollNumber || 'N/A'}</span> • {s?.class || s?.subject || 'General'}
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

                <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    Save Changes
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
