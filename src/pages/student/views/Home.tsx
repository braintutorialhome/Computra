import React, { useState, useEffect, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { getISTDateString, formatIST } from '../../../lib/dateUtils';
import { Student } from '../../../types';
import { 
  CreditCard, Calendar, Bell, ArrowRight, BookOpen, 
  Trophy, AlertCircle, ExternalLink, FileCheck, User, Eye, 
  MessageSquareQuote, CheckCircle2, Clock, Phone, MessageSquare,
  ShieldCheck, Sparkles, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentHome({ student }: { student: Student }) {
  const { 
    fees, attendance, testResults, tests, notices, dueFees, 
    materials, remarks, externalTests 
  } = useStorage();

  // Current Kolkata / IST Time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kolkataDateStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(currentTime);

  const kolkataHour = parseInt(new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    hour12: false
  }).format(currentTime), 10);

  let greeting = 'Good Evening';
  if (kolkataHour >= 4 && kolkataHour < 12) greeting = 'Good Morning';
  else if (kolkataHour >= 12 && kolkataHour < 17) greeting = 'Good Afternoon';

  // Financial calculations
  const studentPaidFees = useMemo(() => {
    return fees.filter(f => f.studentId === student.id && f.status === 'paid');
  }, [fees, student.id]);

  const totalPaid = useMemo(() => {
    return studentPaidFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [studentPaidFees]);

  const myDueFees = useMemo(() => {
    return dueFees.filter(df => df.studentId === student.id);
  }, [dueFees, student.id]);

  const totalDue = useMemo(() => {
    return myDueFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [myDueFees]);

  // Attendance
  const today = getISTDateString();
  const myAttendanceRecords = useMemo(() => {
    return attendance.filter(a => a.studentId === student.id);
  }, [attendance, student.id]);

  const presentDaysCount = useMemo(() => {
    return myAttendanceRecords.filter(a => a.status === 'present').length;
  }, [myAttendanceRecords]);

  const totalAttendanceDays = myAttendanceRecords.length;
  const attendanceRate = totalAttendanceDays > 0 
    ? Math.round((presentDaysCount / totalAttendanceDays) * 100) 
    : null;

  const todayRecord = attendance.find(a => a.date === today && a.studentId === student.id);
  const todayStatus = todayRecord ? todayRecord.status : 'unmarked';

  // Academic Results
  const studentResults = useMemo(() => {
    return testResults
      .filter(r => r.studentId === student.id)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [testResults, student.id]);

  // Materials for student's class
  const sClassClean = String(student.class || '').replace('Class-', '').trim();
  const studentMaterials = useMemo(() => {
    return materials.filter(m => {
      if (!m.class) return true;
      const mClassClean = String(m.class).replace('Class-', '').trim();
      return !sClassClean || mClassClean === sClassClean;
    });
  }, [materials, sClassClean]);

  // Latest notice
  const latestNotice = notices.length > 0 ? notices[notices.length - 1] : null;

  // Latest remark
  const myRemarks = useMemo(() => {
    return remarks.filter(r => r.studentId === student.id);
  }, [remarks, student.id]);
  const latestRemark = myRemarks[0] || null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Student Identity Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg relative">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={36} className="text-indigo-400" />
            )}
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#060c18] rounded-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" /> {greeting}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={11} /> Verified Student
              </span>
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 ml-1">
                <Clock size={12} className="text-indigo-400" /> {kolkataDateStr}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {student.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 font-semibold">
              <span>Roll: <strong className="text-white font-mono">{student.rollNumber || 'N/A'}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Student ID: <strong className="text-indigo-400 font-mono">{student.id}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Class: <strong className="text-white">{student.class || 'N/A'}</strong></span>
              {student.subject && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{student.subject}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
          <Link 
            to="/student/overview" 
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Eye size={15} /> My Overview
          </Link>
          <Link 
            to="/student/profile" 
            className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2 transition-all"
          >
            <User size={15} /> Profile
          </Link>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Pending Dues Alert (High Priority) */}
      {totalDue > 0 && (
        <div className="glass p-6 rounded-[32px] border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-rose-950/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30 animate-pulse">
              <AlertCircle size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  Fee Clearance Action Required
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                Outstanding Balance: <span className="text-rose-400 font-mono">₹{totalDue.toLocaleString('en-IN')}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                You have {myDueFees.length} pending fee record(s). Please clear pending dues on time to ensure uninterrupted access.
              </p>
            </div>
          </div>

          <Link 
            to="/student/due-fees" 
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-rose-600/30"
          >
            Pay / View Due Dues <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance */}
        <Link to="/student/attendance" className="glass p-6 rounded-[32px] border border-white/5 hover:border-indigo-500/30 transition-all group block relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Attendance</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Calendar size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">
            {attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {presentDaysCount} attended / {totalAttendanceDays} total days
          </p>
          <div className="mt-3 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (attendanceRate ?? 100) >= 75 ? 'bg-indigo-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(attendanceRate ?? 0, 100)}%` }}
            />
          </div>
        </Link>

        {/* Fees Paid */}
        <Link to="/student/fees" className="glass p-6 rounded-[32px] border border-white/5 hover:border-emerald-500/30 transition-all group block relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Fees Paid</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CreditCard size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-400 font-mono">
            ₹{totalPaid.toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {studentPaidFees.length} receipt(s) issued
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 size={12} /> Clear Statements Available
          </div>
        </Link>

        {/* Tests / Results */}
        <Link to="/student/results" className="glass p-6 rounded-[32px] border border-white/5 hover:border-purple-500/30 transition-all group block relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Exam Results</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Trophy size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">
            {studentResults.length}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Assessments recorded
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-purple-400">
            <Award size={12} /> View Scorecards & History
          </div>
        </Link>

        {/* Study Material */}
        <Link to="/student/materials" className="glass p-6 rounded-[32px] border border-white/5 hover:border-amber-500/30 transition-all group block relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Study Materials</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <BookOpen size={18} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">
            {studentMaterials.length}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Class {student.class || 'All'} files
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
            <BookOpen size={12} /> Download PDF & Notes
          </div>
        </Link>
      </div>

      {/* 4. Main Two Column Section: Notices & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Notice */}
        <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Latest Notice</h3>
                <p className="text-xs text-slate-400">Institutional announcements</p>
              </div>
            </div>
            <Link to="/student/notices" className="text-xs font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {latestNotice ? (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                  {latestNotice.category || 'General'}
                </span>
                <span>{formatIST(latestNotice.date, 'dd MMM yyyy')}</span>
              </div>
              <h4 className="text-base font-bold text-white leading-snug">
                {latestNotice.title}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {latestNotice.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No notices published yet</p>
          )}
        </div>

        {/* Online Exam Portals */}
        <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <ExternalLink size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Online Exam Portal</h3>
                <p className="text-xs text-slate-400">Live tests and practice assessments</p>
              </div>
            </div>
            <Link to="/student/test-master" className="text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 flex items-center gap-1">
              All Exams <ArrowRight size={13} />
            </Link>
          </div>

          {externalTests.length > 0 ? (
            <div className="space-y-2.5">
              {externalTests.slice(0, 3).map(test => (
                <div key={test.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{test.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{test.description}</p>
                  </div>
                  <a 
                    href={test.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                  >
                    Open Exam <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No active exams scheduled right now</p>
          )}
        </div>
      </div>

      {/* 5. Remarks & Direct Assistance Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Faculty Remark */}
        <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MessageSquareQuote size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Teacher's Remarks</h3>
                <p className="text-xs text-slate-400">Academic & conduct feedback</p>
              </div>
            </div>
            <Link to="/student/remarks" className="text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              History <ArrowRight size={13} />
            </Link>
          </div>

          {latestRemark ? (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">{latestRemark.category || 'Academic'}</span>
                <span>{formatIST(latestRemark.date, 'dd MMM yyyy')}</span>
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{latestRemark.remark}"
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-400">Good academic standing. No negative remarks or warnings recorded.</p>
            </div>
          )}
        </div>

        {/* Advanced Support & Instant Chat Cards */}
        <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-4">
          <div className="pb-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Direct Assistance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Instant helpdesk & WhatsApp support</p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Support Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Instant Support */}
            <a 
              href="tel:+919647046334" 
              className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 flex flex-col justify-between gap-3 text-slate-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/40 group-hover:scale-105 transition-transform">
                  <Phone size={18} />
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Helpline</span>
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-indigo-200 transition-colors">Instant Support</p>
                <p className="font-mono text-xs text-slate-300 mt-0.5">+91 96470 46334</p>
                <p className="text-[10px] text-slate-400 mt-1">Tap to call admin desk</p>
              </div>
            </a>

            {/* Instant Chat */}
            <a 
              href="https://wa.me/919647046334" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex flex-col justify-between gap-3 text-slate-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/40 group-hover:scale-105 transition-transform">
                  <MessageSquare size={18} />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">WhatsApp</span>
              </div>
              <div>
                <p className="text-xs font-black text-white group-hover:text-emerald-200 transition-colors">Instant Chat</p>
                <p className="text-xs text-emerald-300 mt-0.5 font-bold">Live Admin Helpdesk</p>
                <p className="text-[10px] text-slate-400 mt-1">Chat on WhatsApp</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
