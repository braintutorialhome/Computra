import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { formatIST } from '../../../lib/dateUtils';
import { 
  Calendar, CheckCircle2, XCircle, Clock, Search, 
  Filter, ShieldCheck, AlertTriangle, Sparkles, 
  CalendarDays, TrendingUp, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentAttendanceProps {
  student?: Student;
}

type TabType = 'absent' | 'present' | 'all';

export default function StudentAttendance({ student }: StudentAttendanceProps) {
  const { currentUser, attendance, students } = useStorage();
  const [activeTab, setActiveTab] = useState<TabType>('absent');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Resolve active student record
  const activeStudent = student || students.find(s => 
    s.status === 'approved' && 
    (s.rollNumber === currentUser?.username || s.id === currentUser?.id || s.name === currentUser?.name)
  );

  // Student's specific attendance records sorted by date descending (latest first)
  const myAttendance = useMemo(() => {
    if (!activeStudent) return [];
    return attendance
      .filter(a => a.studentId === activeStudent.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [attendance, activeStudent]);

  // Absent and Present subsets
  const absentRecords = useMemo(() => myAttendance.filter(a => a.status === 'absent'), [myAttendance]);
  const presentRecords = useMemo(() => myAttendance.filter(a => a.status === 'present'), [myAttendance]);

  // Overall attendance statistics
  const totalClasses = myAttendance.length;
  const presentCount = presentRecords.length;
  const absentCount = absentRecords.length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  // Available months for filtering
  const availableMonths = useMemo(() => {
    const months = myAttendance.map(a => {
      const d = String(a.date || '').trim();
      return d.length >= 7 ? d.substring(0, 7) : '';
    }).filter(Boolean);
    return ['all', ...Array.from(new Set(months)).sort((a: string, b: string) => b.localeCompare(a))];
  }, [myAttendance]);

  // Filter records based on active tab, search, and month
  const filteredRecords = useMemo(() => {
    let list = myAttendance;
    if (activeTab === 'absent') {
      list = absentRecords;
    } else if (activeTab === 'present') {
      list = presentRecords;
    }

    return list.filter(item => {
      // Month filter
      if (selectedMonth !== 'all' && !(item.date || '').startsWith(selectedMonth)) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const formattedDate = formatIST(item.date, 'dd MMMM yyyy EEEE').toLowerCase();
        const rawDate = (item.date || '').toLowerCase();
        const statusStr = (item.status || '').toLowerCase();
        return formattedDate.includes(q) || rawDate.includes(q) || statusStr.includes(q);
      }

      return true;
    });
  }, [myAttendance, absentRecords, presentRecords, activeTab, selectedMonth, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
            Attendance Registry
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs font-bold text-slate-500">Official Student Dossier</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-3">
          <CalendarDays className="text-indigo-500" size={32} />
          Attendance <span className="text-slate-700">/</span> Status & Records
        </h1>
        <p className="text-xs font-bold text-slate-500 max-w-xl leading-relaxed">
          Monitor your roll call records, review your absent dates, and track your attendance percentage.
        </p>
      </div>

      {/* Summary Profile & KPI Card */}
      <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none text-indigo-500">
          <Calendar size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-2xl uppercase">
              {(activeStudent?.name || 'S').charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {activeStudent?.name || 'Student Record'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck size={12} /> Active Student
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-400 mt-1">
                Roll No: <span className="text-indigo-400">{activeStudent?.rollNumber || 'N/A'}</span> • Class/Subject: <span className="text-white">{activeStudent?.class || activeStudent?.subject || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
            <div className="text-left md:text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Attendance Standing
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-black ${
                  attendanceRate >= 80 ? 'text-emerald-400' : attendanceRate >= 65 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {attendanceRate}%
                </span>
                <span className="text-xs font-bold text-slate-400">
                  ({presentCount}/{totalClasses})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5 relative z-10">
          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Sessions</p>
              <p className="text-2xl font-black text-white mt-0.5">{totalClasses}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Present Sessions</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{presentCount}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-rose-500/[0.03] border border-rose-500/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Absent Sessions</p>
              <p className="text-2xl font-black text-rose-400 mt-0.5">{absentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2 p-1.5 glass rounded-2xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('absent')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'absent'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle size={14} />
            Absent Dates
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'absent' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {absentCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('present')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'present'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            Present Records
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'present' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {presentCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            All Sessions
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
            }`}>
              {totalClasses}
            </span>
          </button>
        </div>

        {/* Filter Controls: Search and Month */}
        <div className="flex items-center gap-3">
          {availableMonths.length > 1 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all" className="bg-[#0b1329] text-white">All Months</option>
              {availableMonths.filter(m => m !== 'all').map(m => (
                <option key={m} value={m} className="bg-[#0b1329] text-white">
                  {formatIST(`${m}-01`, 'MMMM yyyy')}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search date or day..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Records Section */}
      <div className="space-y-4">
        {activeTab === 'absent' && absentCount > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-rose-300 uppercase tracking-wider">
                  Attention Required: {absentCount} Absent {absentCount === 1 ? 'Date' : 'Dates'} Recorded
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Review the dates you were marked absent below. If you believe any record is incorrect, please contact UTC Computra Administration.
                </p>
              </div>
            </div>
          </div>
        )}

        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecords.map((item, idx) => {
              const isAbsent = item.status === 'absent';
              return (
                <motion.div
                  key={item.id || `att-record-${item.date}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass p-6 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                    isAbsent 
                      ? 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/[0.02]' 
                      : 'border-white/5 hover:border-emerald-500/30 bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 border ${
                      isAbsent
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <span className="text-xs uppercase leading-none font-bold">
                        {formatIST(item.date, 'MMM')}
                      </span>
                      <span className="text-xl leading-none mt-1 font-black">
                        {formatIST(item.date, 'dd')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-white tracking-tight">
                          {formatIST(item.date, 'EEEE, dd MMMM yyyy')}
                        </h4>
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                          isAbsent
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isAbsent ? <X size={12} /> : <Check size={12} />}
                          {isAbsent ? 'Absent' : 'Present'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-1">
                        {isAbsent 
                          ? 'Marked absent for scheduled session' 
                          : 'Recorded attendance verified for session'}
                        {' • '}
                        <span className="text-slate-500 font-bold">{activeStudent?.class || activeStudent?.subject || 'Class Session'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-600" />
                      {formatIST(item.date, 'yyyy-MM-dd')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center glass rounded-[40px] border border-white/5 p-8">
            {activeTab === 'absent' ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  No Absent Dates Found!
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Congratulations! You have maintained an exemplary attendance record with 0 recorded absences.
                </p>
              </div>
            ) : activeTab === 'present' ? (
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-500/10 text-slate-400 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                  <Calendar size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  No Present Records Found
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No present records match your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-500/10 text-slate-400 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                  <Calendar size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  No Attendance Records Yet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No attendance entries have been published by administration yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
