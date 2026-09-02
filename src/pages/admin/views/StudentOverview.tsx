import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, Eye, ShieldCheck, Download, Printer, 
  CreditCard, AlertCircle, CheckCircle2, XCircle, Calendar, 
  Phone, MapPin, BookOpen, GraduationCap, Clock, Award, 
  Layers, ChevronRight, X, FileSpreadsheet, User, UserX
} from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { format, parseISO } from 'date-fns';

export default function StudentOverview() {
  const { students, fees, dueFees, attendance, testResults, currentUser } = useStorage();

  // Strict Admin Role Enforcement Check
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-8 glass rounded-[40px] border border-rose-500/20 text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-400 mt-2 font-medium">
          The Student Overview section is exclusively accessible to authorized system administrators.
        </p>
      </div>
    );
  }

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Selected Student for Read-Only Dossier Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Safe date formatter
  const safeFormatDate = (dateStr?: string, fmt = 'dd MMM yyyy') => {
    if (!dateStr) return 'N/A';
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : format(d, fmt);
      }
      return format(parsed, fmt);
    } catch {
      return dateStr;
    }
  };

  // Dynamic filter options
  const classes = useMemo(() => {
    const list = students.map(s => String(s.class || s.subject || '').trim()).filter(Boolean);
    return ['all', ...Array.from(new Set(list))];
  }, [students]);

  const defaultSemesters = ['Semester-I', 'Semester-II', 'Semester-III', 'Semester-IV'];
  const semesters = useMemo(() => {
    const list = students.map(s => String(s.semester || '').trim()).filter(Boolean);
    return ['all', ...Array.from(new Set([...defaultSemesters, ...list]))];
  }, [students]);

  const defaultSessions = ['2024-2025', '2025-2026', '2026-2027'];
  const sessions = useMemo(() => {
    const list = students.map(s => String(s.session || '').trim()).filter(Boolean);
    return ['all', ...Array.from(new Set([...defaultSessions, ...list]))];
  }, [students]);

  // Aggregate student data with fees and dues
  const enrichedStudents = useMemo(() => {
    return students.map(student => {
      const studentPaidFees = fees.filter(f => f.studentId === student.id && f.status === 'paid');
      const totalPaid = studentPaidFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      
      const studentDueFees = dueFees.filter(df => df.studentId === student.id);
      const totalDue = studentDueFees.reduce((sum, df) => sum + (Number(df.amount) || 0), 0);

      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const presentDays = studentAttendance.filter(a => a.status === 'present').length;
      const totalAttendance = studentAttendance.length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : null;

      const studentTests = testResults.filter(tr => tr.studentId === student.id);

      return {
        student,
        totalPaid,
        paidCount: studentPaidFees.length,
        totalDue,
        dueCount: studentDueFees.length,
        attendanceRate,
        totalAttendance,
        testCount: studentTests.length,
        paidFeesList: studentPaidFees,
        dueFeesList: studentDueFees,
        testResultsList: studentTests,
      };
    });
  }, [students, fees, dueFees, attendance, testResults]);

  // Global KPIs
  const kpis = useMemo(() => {
    const totalCount = students.length;
    const approvedCount = students.filter(s => s.status === 'approved').length;
    const pendingCount = students.filter(s => s.status === 'pending').length;
    const totalCollected = enrichedStudents.reduce((sum, item) => sum + item.totalPaid, 0);
    const totalOutstanding = enrichedStudents.reduce((sum, item) => sum + item.totalDue, 0);
    const studentsWithDues = enrichedStudents.filter(item => item.totalDue > 0).length;

    return {
      totalCount,
      approvedCount,
      pendingCount,
      totalCollected,
      totalOutstanding,
      studentsWithDues
    };
  }, [students, enrichedStudents]);

  // Filtered List
  const filteredData = useMemo(() => {
    return enrichedStudents.filter(({ student, totalPaid, totalDue }) => {
      // Search
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower) {
        const matchesName = String(student.name || '').toLowerCase().includes(searchLower);
        const matchesRoll = String(student.rollNumber || '').toLowerCase().includes(searchLower);
        const matchesId = String(student.id || '').toLowerCase().includes(searchLower);
        const matchesMobile = String(student.mobile || '').toLowerCase().includes(searchLower);
        const matchesFather = String(student.fatherName || '').toLowerCase().includes(searchLower);
        const matchesSubject = String(student.subject || '').toLowerCase().includes(searchLower);
        const matchesAddress = String(student.address || '').toLowerCase().includes(searchLower);

        if (!matchesName && !matchesRoll && !matchesId && !matchesMobile && !matchesFather && !matchesSubject && !matchesAddress) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && student.status !== statusFilter) {
        return false;
      }

      // Class / Batch
      if (classFilter !== 'all') {
        const studentClass = String(student.class || student.subject || '').trim();
        if (studentClass !== classFilter) return false;
      }

      // Semester
      if (semesterFilter !== 'all') {
        const studentSem = String(student.semester || '').trim();
        if (studentSem !== semesterFilter) return false;
      }

      // Session
      if (sessionFilter !== 'all') {
        const studentSess = String(student.session || '').trim();
        if (studentSess !== sessionFilter) return false;
      }

      return true;
    });
  }, [enrichedStudents, searchTerm, statusFilter, classFilter, semesterFilter, sessionFilter]);

  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      'Student ID',
      'Roll Number',
      'Full Name',
      'Father Name',
      'Gender',
      'DOB',
      'Mobile',
      'WhatsApp',
      'Subject / Course',
      'Class / Batch',
      'Semester',
      'Session',
      'Admission Date',
      'Status',
      'Total Paid (INR)',
      'Total Due (INR)',
      'Address'
    ];

    const rows = filteredData.map(({ student, totalPaid, totalDue }) => [
      `"${student.id || ''}"`,
      `"${student.rollNumber || ''}"`,
      `"${(student.name || '').replace(/"/g, '""')}"`,
      `"${(student.fatherName || '').replace(/"/g, '""')}"`,
      `"${student.gender || ''}"`,
      `"${student.dob || ''}"`,
      `"${student.mobile || ''}"`,
      `"${student.whatsapp || ''}"`,
      `"${(student.subject || '').replace(/"/g, '""')}"`,
      `"${(student.class || '').replace(/"/g, '""')}"`,
      `"${student.semester || ''}"`,
      `"${student.session || ''}"`,
      `"${student.admissionDate || ''}"`,
      `"${student.status || ''}"`,
      totalPaid,
      totalDue,
      `"${(student.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `utc_student_overview_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected student's dossier data
  const selectedDossier = useMemo(() => {
    if (!selectedStudent) return null;
    return enrichedStudents.find(item => item.student.id === selectedStudent.id) || null;
  }, [selectedStudent, enrichedStudents]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Student Overview</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Admin Read-Only
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Comprehensive directory of student profiles, academic records, fee collections, and assessed dues.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
            title="Export full filtered report to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
            title="Print overview sheet"
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{kpis.totalCount}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-400">
            <span className="text-emerald-400">{kpis.approvedCount} Active</span>
            <span>•</span>
            <span className="text-amber-400">{kpis.pendingCount} Pending</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fees Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">₹{kpis.totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">All-time lifetime collections</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outstanding Dues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400 tracking-tight">₹{kpis.totalOutstanding.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">{kpis.studentsWithDues} students with pending dues</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Read-Only Safety</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-xl font-black text-purple-300 tracking-tight">Audit & Inspection</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">Zero accidental mutations permitted</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass p-6 rounded-[32px] border border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by student name, roll no, student ID, mobile, father, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 self-end lg:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={14} /> Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} /> Cards View
            </button>
          </div>
        </div>

        {/* Multi-Criteria Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="approved" className="bg-slate-900 text-white">Active / Approved</option>
              <option value="pending" className="bg-slate-900 text-white">Pending</option>
              <option value="rejected" className="bg-slate-900 text-white">Rejected</option>
              <option value="deleted" className="bg-slate-900 text-white">Archived / Deleted</option>
            </select>
          </div>

          {/* Class / Batch Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Batch / Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all" className="bg-slate-900 text-white">All Batches</option>
              {classes.filter(c => c !== 'all').map(c => (
                <option key={`ov-class-${c}`} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all" className="bg-slate-900 text-white">All Semesters</option>
              {semesters.filter(s => s !== 'all').map(sem => (
                <option key={`ov-sem-${sem}`} value={sem} className="bg-slate-900 text-white">{sem}</option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Session</label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all" className="bg-slate-900 text-white">All Sessions</option>
              {sessions.filter(s => s !== 'all').map(sess => (
                <option key={`ov-sess-${sess}`} value={sess} className="bg-slate-900 text-white">{sess}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Counter */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1">
          <span>Showing {filteredData.length} of {students.length} students</span>
          {(searchTerm || statusFilter !== 'all' || classFilter !== 'all' || semesterFilter !== 'all' || sessionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setClassFilter('all');
                setSemesterFilter('all');
                setSessionFilter('all');
              }}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredData.length === 0 ? (
        <div className="glass p-16 rounded-[40px] border border-white/5 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">No Students Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No student records match your current filter and search criteria. Try modifying your search term or clearing filters.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass rounded-[32px] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 pl-6 pr-4">Student Profile</th>
                  <th className="py-4 px-4">Academic Details</th>
                  <th className="py-4 px-4">Contact & Guardian</th>
                  <th className="py-4 px-4">Fees Paid</th>
                  <th className="py-4 px-4">Assessed Dues</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300 font-medium">
                {filteredData.map(({ student, totalPaid, paidCount, totalDue, dueCount }, idx) => (
                  <tr 
                    key={student.id ? `overview-${student.id}` : `ov-idx-${idx}`}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    {/* Student Profile Column */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-black flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student.name?.charAt(0) || 'S'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors leading-tight">
                            {student.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            {student.rollNumber ? (
                              <span className="text-indigo-400 font-bold">Roll: {student.rollNumber}</span>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-500">ID: {student.id}</span>
                            )}
                            <span>•</span>
                            <span className="capitalize">{student.gender || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Academic Details Column */}
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-white">{student.subject || student.class || 'General'}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {student.semester && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">
                              {student.semester}
                            </span>
                          )}
                          {student.session && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300">
                              {student.session}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact & Guardian Column */}
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-slate-300 font-semibold">{student.fatherName ? `F: ${student.fatherName}` : 'N/A'}</p>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                          <Phone size={11} className="text-slate-500" />
                          <span>{student.mobile || 'No Mobile'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Fees Paid Column */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-black text-emerald-400 text-sm">
                          ₹{totalPaid.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold">{paidCount} receipt{paidCount === 1 ? '' : 's'}</p>
                      </div>
                    </td>

                    {/* Assessed Dues Column */}
                    <td className="py-4 px-4">
                      <div>
                        {totalDue > 0 ? (
                          <>
                            <span className="font-black text-rose-400 text-sm">
                              ₹{totalDue.toLocaleString('en-IN')}
                            </span>
                            <p className="text-[10px] text-rose-500/80 font-bold">{dueCount} pending</p>
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                            Cleared
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        student.status === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : student.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : student.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} /> View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map(({ student, totalPaid, paidCount, totalDue, dueCount, attendanceRate }, idx) => (
            <div 
              key={student.id ? `card-${student.id}` : `card-idx-${idx}`}
              onClick={() => setSelectedStudent(student)}
              className="glass p-6 rounded-[32px] border border-white/10 hover:border-indigo-500/40 transition-all hover:translate-y-[-2px] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-lg overflow-hidden">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        student.name?.charAt(0) || 'S'
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-base group-hover:text-indigo-400 transition-colors leading-tight">
                        {student.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">
                        {student.rollNumber ? `Roll: ${student.rollNumber}` : `ID: ${student.id}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    student.status === 'approved' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : student.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {student.status}
                  </span>
                </div>

                {/* Details Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] font-semibold text-slate-300">
                    {student.subject || student.class || 'Course'}
                  </span>
                  {student.semester && (
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300">
                      {student.semester}
                    </span>
                  )}
                  {student.session && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-300">
                      {student.session}
                    </span>
                  )}
                </div>

                {/* Contact & Father */}
                <div className="space-y-1.5 py-3 border-y border-white/5 text-xs text-slate-400">
                  {student.fatherName && (
                    <p className="truncate"><span className="text-slate-500 font-bold">Guardian:</span> {student.fatherName}</p>
                  )}
                  {student.mobile && (
                    <p className="flex items-center gap-1.5 truncate"><Phone size={12} className="text-slate-500" /> {student.mobile}</p>
                  )}
                  {student.address && (
                    <p className="flex items-center gap-1.5 truncate"><MapPin size={12} className="text-slate-500" /> {student.address}</p>
                  )}
                </div>
              </div>

              {/* Financial & Performance Footer */}
              <div className="mt-4 pt-2">
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-2xl border border-white/5 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Paid</span>
                    <span className="text-sm font-black text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Due</span>
                    <span className={`text-sm font-black ${totalDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      ₹{totalDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStudent(student)}
                  className="w-full py-2.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-xs font-black uppercase tracking-wider text-slate-200 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={14} /> Full Read-Only Dossier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* READ-ONLY STUDENT DOSSIER MODAL */}
      {selectedStudent && selectedDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="glass w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-white/20 overflow-hidden flex flex-col my-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-white/5 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-black text-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-indigo-600/20">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedStudent.name?.charAt(0) || 'S'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white">{selectedStudent.name}</h2>
                    <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck size={11} /> Read-Only Record
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Student ID: <span className="font-mono text-indigo-400">{selectedStudent.id}</span>
                    {selectedStudent.rollNumber && <span> • Roll No: <strong className="text-white">{selectedStudent.rollNumber}</strong></span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Read Only Dossier */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8 flex-1">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Total Fees Paid</span>
                  <p className="text-2xl font-black text-emerald-300 mt-1">₹{selectedDossier.totalPaid.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-emerald-400/80 font-semibold mt-0.5">{selectedDossier.paidCount} recorded transaction(s)</p>
                </div>

                <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Assessed Due Fees</span>
                  <p className="text-2xl font-black text-rose-300 mt-1">₹{selectedDossier.totalDue.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-rose-400/80 font-semibold mt-0.5">{selectedDossier.dueCount} unpaid assessment(s)</p>
                </div>

                <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Attendance & Tests</span>
                  <p className="text-2xl font-black text-indigo-300 mt-1">
                    {selectedDossier.attendanceRate !== null ? `${selectedDossier.attendanceRate}%` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-indigo-400/80 font-semibold mt-0.5">{selectedDossier.testCount} exam result(s)</p>
                </div>
              </div>

              {/* Comprehensive Profile Dossier Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <User size={14} className="text-indigo-400" /> Student Profile & Personal Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/5 p-6 rounded-3xl border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Father's Name</span>
                    <span className="text-white font-bold">{selectedStudent.fatherName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Gender</span>
                    <span className="text-white font-bold capitalize">{selectedStudent.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Date of Birth</span>
                    <span className="text-white font-bold">{safeFormatDate(selectedStudent.dob)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Primary Mobile</span>
                    <span className="text-white font-bold">{selectedStudent.mobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">WhatsApp</span>
                    <span className="text-white font-bold">{selectedStudent.whatsapp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Admission Date</span>
                    <span className="text-white font-bold">{safeFormatDate(selectedStudent.admissionDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Subject / Course</span>
                    <span className="text-indigo-300 font-bold">{selectedStudent.subject || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Batch / Class</span>
                    <span className="text-indigo-300 font-bold">{selectedStudent.class || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Semester</span>
                    <span className="text-indigo-300 font-bold">{selectedStudent.semester || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Academic Session</span>
                    <span className="text-emerald-300 font-bold">{selectedStudent.session || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Admission Status</span>
                    <span className="text-white font-bold capitalize">{selectedStudent.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Date of Joining</span>
                    <span className="text-white font-bold">{safeFormatDate(selectedStudent.dateOfJoining)}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-white/5">
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Residential Address</span>
                    <span className="text-slate-200 font-medium">{selectedStudent.address || 'No address provided'}</span>
                  </div>
                </div>
              </div>

              {/* Read-Only Fee Payment History */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <CreditCard size={14} className="text-emerald-400" /> Fee Payment Ledger
                </h3>
                {selectedDossier.paidFeesList.length === 0 ? (
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center text-xs text-slate-400">
                    No fee payment collections recorded for this student yet.
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Receipt Date</th>
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4 text-right">Amount Paid</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {selectedDossier.paidFeesList.map((f, i) => (
                          <tr key={`paid-${f.id || i}`} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 font-bold text-white">{safeFormatDate(f.date)}</td>
                            <td className="py-2.5 px-4">{f.month || 'N/A'}</td>
                            <td className="py-2.5 px-4 text-right font-black text-emerald-400">₹{Number(f.amount).toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Read-Only Assessed Due Fees */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-400" /> Assessed Due Fees History
                </h3>
                {selectedDossier.dueFeesList.length === 0 ? (
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> All assessed dues are fully cleared for this student.
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Remarks / Description</th>
                          <th className="py-3 px-4 text-right">Assessed Due Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {selectedDossier.dueFeesList.map((df, i) => (
                          <tr key={`due-${df.id || i}`} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 font-bold text-white">{safeFormatDate(df.date)}</td>
                            <td className="py-2.5 px-4">{df.remarks || 'Standard Assessment'}</td>
                            <td className="py-2.5 px-4 text-right font-black text-rose-400">₹{Number(df.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
