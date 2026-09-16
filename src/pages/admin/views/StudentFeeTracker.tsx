import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { 
  Search, Users, CreditCard, CheckCircle2, ShieldAlert,
  Edit2, Plus, Phone, User as UserIcon,
  DollarSign, Lock, Eye, TrendingUp, FileText,
  FileSpreadsheet, Layers, MapPin, X, AlertCircle
} from 'lucide-react';
import { safeFormat, getISTDateString, getISTToday, formatIST, getISTPreviousMonthCurrentYear } from '../../../lib/dateUtils';

export default function StudentFeeTracker() {
  const { 
    currentUser, 
    students, 
    fees, 
    dueFees, 
    updateStudent, 
    addFee, 
    addDueFee, 
    deleteDueFee 
  } = useStorage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Selected student modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Tab within detailed modal: 'overview' | 'personal' | 'addPayment' | 'adjustDue'
  const [modalTab, setModalTab] = useState<'overview' | 'personal' | 'addPayment' | 'adjustDue'>('overview');

  // Edit student form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    fatherName: '',
    mobile: '',
    class: '',
    semester: '',
    session: '',
    subject: '',
    address: '',
    rollNumber: ''
  });

  // Record payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    month: '',
    date: getISTDateString()
  });

  // Adjust due form state
  const [dueForm, setDueForm] = useState({
    amount: '',
    remarks: ''
  });

  // Feedback message toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Role-Based Access Control (RBAC) Guard - Admin Only
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 mb-6 shadow-2xl shadow-rose-950/20">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md text-sm font-bold uppercase tracking-wider mb-6">
          This feature is strictly restricted to System Administrators. You do not have permission to view or manage student fee tracking data.
        </p>
      </div>
    );
  }

  // Filter approved/active students
  const activeStudents = students.filter(s => s.status === 'approved' || s.status === 'pending');

  // Compute student fee aggregates
  const studentFeeData = activeStudents.map(student => {
    const studentFees = fees.filter(f => f.studentId === student.id);
    const studentDues = dueFees.filter(df => df.studentId === student.id);
    
    const totalPaid = studentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalAssessedDue = studentDues.reduce((sum, df) => sum + (df.amount || 0), 0);

    return {
      student,
      totalPaid,
      totalAssessedDue,
      feeCount: studentFees.length,
      dueCount: studentDues.length
    };
  });

  // Unique classes/subjects for filtering
  const availableClasses = Array.from(
    new Set(activeStudents.map(s => String(s.class || s.subject || '').trim()).filter(Boolean))
  );

  const defaultSemesters = ['Semester-I', 'Semester-II', 'Semester-III', 'Semester-IV'];
  const studentSemesters = Array.from(new Set(activeStudents.map(s => String(s.semester || '').trim()).filter(Boolean)));
  const availableSemesters = ['All', ...Array.from(new Set([...defaultSemesters, ...studentSemesters]))];

  const defaultSessions = ['2024-2025', '2025-2026', '2026-2027'];
  const studentSessions = Array.from(new Set(activeStudents.map(s => String(s.session || '').trim()).filter(Boolean)));
  const availableSessions = ['All', ...Array.from(new Set([...defaultSessions, ...studentSessions]))];

  // Filtered students list
  const filteredData = studentFeeData.filter(item => {
    const term = searchTerm.toLowerCase();
    const nameStr = item.student.name ? String(item.student.name).toLowerCase() : '';
    const rollStr = item.student.rollNumber ? String(item.student.rollNumber).toLowerCase() : '';
    const mobileStr = item.student.mobile ? String(item.student.mobile) : '';
    const classStr = item.student.class ? String(item.student.class).toLowerCase() : '';
    const subjectStr = item.student.subject ? String(item.student.subject).toLowerCase() : '';
    const semesterStr = item.student.semester ? String(item.student.semester).toLowerCase() : '';
    const sessionStr = item.student.session ? String(item.student.session).toLowerCase() : '';

    const matchesSearch = 
      nameStr.includes(term) ||
      rollStr.includes(term) ||
      mobileStr.includes(searchTerm) ||
      classStr.includes(term) ||
      subjectStr.includes(term) ||
      semesterStr.includes(term) ||
      sessionStr.includes(term);

    const matchesClass = filterClass === 'All' || 
      item.student.class === filterClass || 
      item.student.subject === filterClass;

    const matchesSemester = filterSemester === 'All' || 
      item.student.semester === filterSemester;

    const matchesSession = filterSession === 'All' || 
      item.student.session === filterSession;

    const matchesStatus = statusFilter === 'All' ||
      String(item.student.status || 'pending').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesClass && matchesSemester && matchesSession && matchesStatus;
  });

  // Global Summary Stats
  const grandTotalPaid = studentFeeData.reduce((sum, item) => sum + item.totalPaid, 0);
  const grandTotalAssessedDues = studentFeeData.reduce((sum, item) => sum + item.totalAssessedDue, 0);

  // Handle opening student detail modal
  const handleOpenStudentDetail = (
    student: Student, 
    initialTab: 'overview' | 'personal' | 'addPayment' | 'adjustDue' = 'overview'
  ) => {
    setSelectedStudent(student);
    setModalTab(initialTab);
    setIsEditingProfile(false);
    setProfileForm({
      name: String(student.name || ''),
      fatherName: String(student.fatherName || ''),
      mobile: String(student.mobile || ''),
      class: String(student.class || student.subject || ''),
      semester: String(student.semester || ''),
      session: String(student.session || ''),
      subject: String(student.subject || student.class || ''),
      address: String(student.address || ''),
      rollNumber: String(student.rollNumber || '')
    });
    setPaymentForm({
      amount: '',
      month: getISTPreviousMonthCurrentYear(),
      date: getISTDateString()
    });
    setDueForm({
      amount: '',
      remarks: 'Monthly Tuition Fee Assessment'
    });
  };

  // Handle saving edited student profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (!profileForm.name.trim() || !profileForm.mobile.trim()) {
      showToast('Student name and contact number are required.', 'error');
      return;
    }

    const updated: Student = {
      ...selectedStudent,
      name: profileForm.name.trim(),
      fatherName: profileForm.fatherName.trim(),
      mobile: profileForm.mobile.trim(),
      class: profileForm.class.trim(),
      semester: profileForm.semester.trim(),
      session: profileForm.session.trim(),
      subject: profileForm.subject.trim(),
      address: profileForm.address.trim(),
      rollNumber: profileForm.rollNumber.trim()
    };

    updateStudent(updated);
    setSelectedStudent(updated);
    setIsEditingProfile(false);
    showToast('Student profile details updated globally!');
  };

  // Handle recording new payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const numAmount = parseFloat(paymentForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    addFee({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      amount: numAmount,
      date: paymentForm.date || getISTDateString(),
      status: 'paid',
      month: paymentForm.month || 'Fee Payment'
    });

    setPaymentForm({ amount: '', month: '', date: getISTDateString() });
    setModalTab('overview');
    showToast(`Payment receipt of ₹${numAmount.toLocaleString()} recorded globally for ${selectedStudent.name}`);
  };

  // Handle assigning / adjusting due amount
  const handleAddDueFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const numAmount = parseFloat(dueForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid due amount.', 'error');
      return;
    }

    addDueFee({
      studentId: selectedStudent.id,
      amount: numAmount,
      remarks: dueForm.remarks || 'Fee Assessment'
    });

    setDueForm({ amount: '', remarks: '' });
    setModalTab('overview');
    showToast(`Assessed due of ₹${numAmount.toLocaleString()} assigned to ${selectedStudent.name}`);
  };

  // Currently selected student's fee & due lists
  const activeStudentFees = selectedStudent ? fees.filter(f => f.studentId === selectedStudent.id) : [];
  const activeStudentDues = selectedStudent ? dueFees.filter(df => df.studentId === selectedStudent.id) : [];
  
  const activeTotalPaid = activeStudentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const activeTotalDueAssessed = activeStudentDues.reduce((sum, df) => sum + (df.amount || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-top-4 ${
          toastMessage.type === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }`}>
          {toastMessage.type === 'error' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">Student Management & Fee Tracker</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <Lock size={12} /> Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Admin student directory, profile management, and global fee ledger synchronization.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{activeStudents.length}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-400">
            <span className="text-emerald-400">{activeStudents.filter(s => s.status === 'approved').length} Active</span>
            <span>•</span>
            <span className="text-amber-400">{activeStudents.filter(s => s.status === 'pending').length} Pending</span>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount Paid</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">₹{grandTotalPaid.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">Collected revenue receipts</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Assessed Dues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-400 tracking-tight">₹{grandTotalAssessedDues.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-2">
            {studentFeeData.filter(item => item.totalAssessedDue > 0).length} students with pending dues
          </p>
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
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet size={14} /> Table View
            </button>
            <button
              type="button"
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
              <option value="All" className="bg-slate-900 text-white">All Statuses</option>
              <option value="approved" className="bg-slate-900 text-white">Active / Approved</option>
              <option value="pending" className="bg-slate-900 text-white">Pending Approval</option>
              <option value="rejected" className="bg-slate-900 text-white">Rejected</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Batch / Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All" className="bg-slate-900 text-white">All Batches / Classes</option>
              {availableClasses.map(c => (
                <option key={`tracker-class-${c}`} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Semester</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {availableSemesters.map(sem => (
                <option key={`tracker-sem-${sem}`} value={sem} className="bg-slate-900 text-white">
                  {sem === 'All' ? 'All Semesters' : sem}
                </option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Session</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {availableSessions.map(sess => (
                <option key={`tracker-sess-${sess}`} value={sess} className="bg-slate-900 text-white">
                  {sess === 'All' ? 'All Sessions' : sess}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Counter */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1">
          <span>Showing {filteredData.length} of {activeStudents.length} students</span>
          {(searchTerm || statusFilter !== 'All' || filterClass !== 'All' || filterSemester !== 'All' || filterSession !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setFilterClass('All');
                setFilterSemester('All');
                setFilterSession('All');
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
                {filteredData.map(({ student, totalPaid, totalAssessedDue, feeCount, dueCount }, idx) => (
                  <tr 
                    key={student.id ? `fee-tracker-${student.id}` : `ft-idx-${idx}`}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => handleOpenStudentDetail(student, 'overview')}
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
                        <p className="text-[10px] text-slate-500 font-bold">{feeCount} receipt{feeCount === 1 ? '' : 's'}</p>
                      </div>
                    </td>

                    {/* Assessed Dues Column */}
                    <td className="py-4 px-4">
                      <div>
                        {totalAssessedDue > 0 ? (
                          <>
                            <span className="font-black text-rose-400 text-sm">
                              ₹{totalAssessedDue.toLocaleString('en-IN')}
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
                        {student.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentDetail(student, 'overview');
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} /> Profile & Fees
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentDetail(student, 'addPayment');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Record Payment"
                        >
                          <Plus size={13} /> Pay
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentDetail(student, 'adjustDue');
                          }}
                          className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Add / Adjust Due"
                        >
                          <DollarSign size={13} /> Due
                        </button>
                      </div>
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
          {filteredData.map(({ student, totalPaid, totalAssessedDue, feeCount, dueCount }, idx) => (
            <div 
              key={student.id ? `card-fee-${student.id}` : `card-ft-${idx}`}
              onClick={() => handleOpenStudentDetail(student, 'overview')}
              className="glass p-6 rounded-[32px] border border-white/10 hover:border-indigo-500/40 transition-all hover:translate-y-[-2px] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-lg overflow-hidden flex-shrink-0">
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
                      : student.status === 'rejected'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {student.status || 'Active'}
                  </span>
                </div>

                {/* Details Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-[11px] font-semibold text-slate-300">
                    {student.subject || student.class || 'General Batch'}
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
                    <span className="text-[10px] text-slate-500 block font-bold mt-0.5">{feeCount} receipts</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Due</span>
                    <span className={`text-sm font-black ${totalAssessedDue > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      ₹{totalAssessedDue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-bold mt-0.5">
                      {totalAssessedDue > 0 ? `${dueCount} pending` : 'Cleared'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStudentDetail(student, 'overview');
                    }}
                    className="py-2.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-xs font-black uppercase tracking-wider text-slate-200 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye size={13} /> Profile
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStudentDetail(student, 'addPayment');
                    }}
                    className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-xs font-black uppercase tracking-wider text-emerald-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Record Payment"
                  >
                    <Plus size={13} /> Pay
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStudentDetail(student, 'adjustDue');
                    }}
                    className="py-2.5 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-xs font-black uppercase tracking-wider text-amber-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Adjust Due"
                  >
                    <DollarSign size={13} /> Due
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Profile & Detailed Fee View Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[36px] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg uppercase">
                  {String(selectedStudent.name || 'S').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">{selectedStudent.name}</h2>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black uppercase">
                      Roll: {selectedStudent.rollNumber || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {selectedStudent.class || selectedStudent.subject || 'General Batch'} • Joining Date: {safeFormat(selectedStudent.dateOfJoining || selectedStudent.admissionDate, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 border-b border-white/10 flex items-center gap-2 bg-black/20 overflow-x-auto">
              <button 
                onClick={() => setModalTab('overview')}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  modalTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText size={14} /> Fee Breakdown & Payment History
              </button>

              <button 
                onClick={() => setModalTab('personal')}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  modalTab === 'personal' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserIcon size={14} /> Personal Details
              </button>

              <button 
                onClick={() => setModalTab('addPayment')}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  modalTab === 'addPayment' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus size={14} /> Record Payment
              </button>

              <button 
                onClick={() => setModalTab('adjustDue')}
                className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  modalTab === 'adjustDue' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign size={14} /> Adjust / Add Total Dues
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* TAB 1: OVERVIEW - Fee Breakdown (Total Due & Amount Paid ONLY) and Payment History */}
              {modalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Fee Breakdown Cards - Exactly showing Total Due and Amount Paid ONLY */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
                        <FileText size={14} /> Total Due
                      </p>
                      <h3 className="text-3xl font-black text-white">₹{activeTotalDueAssessed.toLocaleString()}</h3>
                      <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Assessed Fee Obligations</p>
                    </div>

                    <div className="glass p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                        <TrendingUp size={14} /> Amount Paid
                      </p>
                      <h3 className="text-3xl font-black text-emerald-400">₹{activeTotalPaid.toLocaleString()}</h3>
                      <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Total Verified Payments</p>
                    </div>
                  </div>

                  {/* Payment History List */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <CreditCard size={14} className="text-emerald-400" /> Payment History ({activeStudentFees.length})
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Recorded Receipts Log
                      </span>
                    </div>

                    {activeStudentFees.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] text-center space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">No payment transactions recorded yet</p>
                        <p className="text-[11px] text-slate-600 font-medium">Use the "Record Payment" tab above to add a new receipt.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-xs font-bold">
                          <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                              <th className="p-3 pl-4">Payment Date</th>
                              <th className="p-3">Month / Notes</th>
                              <th className="p-3 text-right">Amount Paid</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {activeStudentFees.map((f, idx) => (
                              <tr key={f.id ? `fee-rec-${f.id}` : `fee-rec-idx-${idx}`} className="hover:bg-white/[0.02]">
                                <td className="p-3 pl-4 font-bold text-white">
                                  {safeFormat(f.date, 'dd MMM yyyy')}
                                </td>
                                <td className="p-3 text-slate-300">{f.month || 'Fee Payment'}</td>
                                <td className="p-3 text-right font-black text-emerald-400">₹{f.amount.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase">
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

                  {/* Assessed Dues Log */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-amber-400" /> Assessed Fee Dues Log ({activeStudentDues.length})
                    </h4>

                    {activeStudentDues.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase">No dues currently assigned</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-xs font-bold">
                          <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5">
                              <th className="p-3 pl-4">Assigned Date</th>
                              <th className="p-3">Remarks / Description</th>
                              <th className="p-3 text-right">Due Amount</th>
                              <th className="p-3 pr-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {activeStudentDues.map((df, idx) => (
                              <tr key={df.id ? `due-rec-${df.id}` : `due-rec-idx-${idx}`} className="hover:bg-white/[0.02]">
                                <td className="p-3 pl-4 font-bold text-white">
                                  {safeFormat(df.date, 'dd MMM yyyy')}
                                </td>
                                <td className="p-3 text-slate-300">{df.remarks || 'Fee Assignment'}</td>
                                <td className="p-3 text-right font-black text-amber-400">₹{df.amount.toLocaleString()}</td>
                                <td className="p-3 pr-4 text-right">
                                  <button 
                                    onClick={() => {
                                      deleteDueFee(df.id);
                                      showToast('Due record removed globally');
                                    }}
                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase transition-colors"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL DETAILS */}
              {modalTab === 'personal' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <UserIcon size={16} className="text-indigo-400" /> Student Profile & Personal Details
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <Edit2 size={14} /> {isEditingProfile ? 'Cancel Editing' : 'Edit Personal Info'}
                    </button>
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4 glass p-6 rounded-3xl border border-indigo-500/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            value={profileForm.name} 
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Roll Number</label>
                          <input 
                            type="text" 
                            value={profileForm.rollNumber} 
                            onChange={(e) => setProfileForm({ ...profileForm, rollNumber: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Contact Number</label>
                          <input 
                            type="text" 
                            value={profileForm.mobile} 
                            onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Parent / Guardian Info</label>
                          <input 
                            type="text" 
                            value={profileForm.fatherName} 
                            onChange={(e) => setProfileForm({ ...profileForm, fatherName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Class</label>
                          <input 
                            type="text" 
                            value={profileForm.class} 
                            onChange={(e) => setProfileForm({ ...profileForm, class: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Semester</label>
                          <select 
                            value={profileForm.semester} 
                            onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">No Semester</option>
                            <option value="Semester-I">Semester-I</option>
                            <option value="Semester-II">Semester-II</option>
                            <option value="Semester-III">Semester-III</option>
                            <option value="Semester-IV">Semester-IV</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Session</label>
                          <input 
                            type="text" 
                            value={profileForm.session} 
                            onChange={(e) => setProfileForm({ ...profileForm, session: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. 2025-2026"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Batch / Subject</label>
                          <input 
                            type="text" 
                            value={profileForm.subject} 
                            onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Address</label>
                          <input 
                            type="text" 
                            value={profileForm.address} 
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-slate-400 hover:text-white uppercase"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black text-white uppercase tracking-wider"
                        >
                          Save Changes Globally
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Full Name</p>
                        <p className="text-sm font-black text-white mt-1 uppercase">{selectedStudent.name}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Roll Number</p>
                        <p className="text-sm font-black text-white mt-1">{selectedStudent.rollNumber || 'N/A'}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Contact Number</p>
                        <p className="text-sm font-black text-white mt-1">{selectedStudent.mobile || 'N/A'}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Parent / Guardian Info</p>
                        <p className="text-sm font-black text-white mt-1 uppercase">{selectedStudent.fatherName || 'N/A'}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Batch / Subject / Class</p>
                        <p className="text-sm font-black text-white mt-1 uppercase">
                          {selectedStudent.class || 'N/A'} {selectedStudent.subject ? `(${selectedStudent.subject})` : ''}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Semester</p>
                        <p className="text-sm font-black text-indigo-400 mt-1 uppercase">
                          {selectedStudent.semester || 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Session</p>
                        <p className="text-sm font-black text-indigo-400 mt-1 uppercase">
                          {selectedStudent.session || 'N/A'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black uppercase text-slate-500">Joining Date</p>
                        <p className="text-sm font-black text-white mt-1">
                          {safeFormat(selectedStudent.dateOfJoining || selectedStudent.admissionDate, 'dd MMM yyyy')}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 sm:col-span-2 md:col-span-3">
                        <p className="text-[10px] font-black uppercase text-slate-500">Address</p>
                        <p className="text-xs font-bold text-slate-300 mt-1">{selectedStudent.address || 'Not specified'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RECORD PAYMENT */}
              {modalTab === 'addPayment' && (
                <div className="space-y-4 max-w-xl mx-auto glass p-6 rounded-3xl border border-emerald-500/20">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Plus size={16} className="text-emerald-400" /> Record New Payment
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Enter payment receipt details for <strong className="text-white uppercase">{selectedStudent.name}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Amount Paid (₹)
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="e.g. 1500"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-black focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Payment Month / Note
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. August 2026 Tuition Fee"
                        value={paymentForm.month}
                        onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Payment Date
                      </label>
                      <input 
                        type="date" 
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/30 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Save & Sync Payment Record Globally
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: ADJUST / ADD TOTAL DUES */}
              {modalTab === 'adjustDue' && (
                <div className="space-y-4 max-w-xl mx-auto glass p-6 rounded-3xl border border-amber-500/20">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <DollarSign size={16} className="text-amber-400" /> Adjust / Add Total Dues
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Assign a new fee obligation or adjust dues for <strong className="text-white uppercase">{selectedStudent.name}</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleAddDueFee} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Due Amount (₹)
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="e.g. 2000"
                        value={dueForm.amount}
                        onChange={(e) => setDueForm({ ...dueForm, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-black focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Remarks / Fee Assessment Description
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Monthly Tuition Fee / Course Fee"
                        value={dueForm.remarks}
                        onChange={(e) => setDueForm({ ...dueForm, remarks: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Assign Fee Due & Sync Globally
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
