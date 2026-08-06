import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { 
  Search, Filter, User, CreditCard, DollarSign, Wallet, AlertCircle, CheckCircle2, 
  Plus, Edit2, Trash2, X, Phone, MapPin, Calendar, Hash, Save, MessageSquare, 
  UserCheck, ChevronRight, ArrowUpRight, Clock, FileText, Check, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Fee, DueFee } from '../../../types';
import { safeFormat } from '../../../lib/utils';
import SearchableSelect from '../../../components/ui/SearchableSelect';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function StudentFeeTracker() {
  const { 
    students, fees, dueFees, 
    updateStudent, addFee, deleteFee, 
    addDueFee, updateDueFee, deleteDueFee,
    currentUser 
  } = useStorage();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'due' | 'cleared'>('All');

  // Modal states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'profile' | 'payments' | 'dues'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Quick Action Forms
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [showAssignDue, setShowAssignDue] = useState(false);

  // Form States
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: '',
    month: safeFormat(new Date(), 'MMMM yyyy'),
    date: new Date().toISOString().split('T')[0]
  });

  const [dueForm, setDueForm] = useState({
    studentId: '',
    amount: '',
    remarks: ''
  });

  const [editStudentForm, setEditStudentForm] = useState<Student | null>(null);
  const [editingDueId, setEditingDueId] = useState<string | null>(null);

  // Approved Students List
  const approvedStudents = useMemo(() => 
    students.filter(s => s.status === 'approved'), 
    [students]
  );

  // Filter options
  const classesList = useMemo(() => ['All', ...Array.from(new Set(approvedStudents.map(s => s.class).filter(Boolean)))], [approvedStudents]);
  const subjectsList = useMemo(() => ['All', ...Array.from(new Set(approvedStudents.map(s => s.subject).filter(Boolean)))], [approvedStudents]);

  const approvedSelectOptions = useMemo(() => 
    approvedStudents.map(s => ({
      id: s.id,
      label: s.name,
      subLabel: `${s.rollNumber ? `Roll: ${s.rollNumber} • ` : ''}Class ${s.class}`
    })),
    [approvedStudents]
  );

  // Calculate student financial summary map
  const studentFinances = useMemo(() => {
    const map = new Map<string, { totalDue: number; totalPaid: number; balance: number; paymentsCount: number; duesCount: number }>();

    approvedStudents.forEach(st => {
      map.set(st.id, { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 });
    });

    dueFees.forEach(df => {
      const current = map.get(df.studentId) || { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
      current.totalDue += (Number(df.amount) || 0);
      current.duesCount += 1;
      map.set(df.studentId, current);
    });

    fees.forEach(f => {
      if (f.status === 'paid' || !f.status) {
        const current = map.get(f.studentId) || { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
        current.totalPaid += (Number(f.amount) || 0);
        current.paymentsCount += 1;
        map.set(f.studentId, current);
      }
    });

    // Compute balance
    map.forEach((val, key) => {
      val.balance = val.totalDue - val.totalPaid;
    });

    return map;
  }, [approvedStudents, dueFees, fees]);

  // Overall Metrics
  const globalMetrics = useMemo(() => {
    let totalDuesAssessed = 0;
    let totalFeesCollected = 0;
    let studentsWithPendingDues = 0;

    studentFinances.forEach((fin) => {
      totalDuesAssessed += fin.totalDue;
      totalFeesCollected += fin.totalPaid;
      if (fin.balance > 0) studentsWithPendingDues += 1;
    });

    return {
      totalStudents: approvedStudents.length,
      totalDuesAssessed,
      totalFeesCollected,
      netBalance: totalDuesAssessed - totalFeesCollected,
      studentsWithPendingDues
    };
  }, [approvedStudents, studentFinances]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return approvedStudents.filter(st => {
      const search = searchTerm.toLowerCase();
      const sName = String(st.name || '').toLowerCase();
      const sRoll = String(st.rollNumber || '').toLowerCase();
      const sId = String(st.id || '').toLowerCase();
      const sMobile = String(st.mobile || '').toLowerCase();
      const sFather = String(st.fatherName || '').toLowerCase();

      const matchesSearch = !searchTerm || 
        sName.includes(search) || 
        sRoll.includes(search) || 
        sId.includes(search) || 
        sMobile.includes(search) ||
        sFather.includes(search);

      const matchesClass = selectedClass === 'All' || st.class === selectedClass;
      const matchesSubject = selectedSubject === 'All' || st.subject === selectedSubject;

      const fin = studentFinances.get(st.id) || { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
      const matchesStatus = 
        paymentStatusFilter === 'All' ? true :
        paymentStatusFilter === 'due' ? fin.balance > 0 :
        fin.balance <= 0;

      return matchesSearch && matchesClass && matchesSubject && matchesStatus;
    });
  }, [approvedStudents, searchTerm, selectedClass, selectedSubject, paymentStatusFilter, studentFinances]);

  // Selected Student Data
  const activeStudent = useMemo(() => 
    approvedStudents.find(s => s.id === selectedStudentId) || null,
    [approvedStudents, selectedStudentId]
  );

  const activeFinances = useMemo(() => {
    if (!selectedStudentId) return { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
    return studentFinances.get(selectedStudentId) || { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
  }, [selectedStudentId, studentFinances]);

  const activeStudentPayments = useMemo(() => {
    if (!selectedStudentId) return [];
    return fees.filter(f => f.studentId === selectedStudentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudentId, fees]);

  const activeStudentDues = useMemo(() => {
    if (!selectedStudentId) return [];
    return dueFees.filter(df => df.studentId === selectedStudentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudentId, dueFees]);

  // Handlers
  const handleOpenStudentModal = (student: Student) => {
    setSelectedStudentId(student.id);
    setEditStudentForm(student);
    setActiveModalTab('overview');
    setIsEditingProfile(false);
  };

  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId || !paymentForm.amount) return;

    addFee({
      studentId: paymentForm.studentId,
      amount: parseFloat(paymentForm.amount),
      month: paymentForm.month,
      date: paymentForm.date,
      status: 'paid'
    });

    setPaymentForm({
      studentId: selectedStudentId || '',
      amount: '',
      month: safeFormat(new Date(), 'MMMM yyyy'),
      date: new Date().toISOString().split('T')[0]
    });
    setShowCollectPayment(false);
  };

  const handleAssignDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueForm.studentId || !dueForm.amount) return;

    if (editingDueId) {
      updateDueFee({
        id: editingDueId,
        studentId: dueForm.studentId,
        amount: parseFloat(dueForm.amount),
        remarks: dueForm.remarks,
        date: new Date().toISOString()
      });
      setEditingDueId(null);
    } else {
      addDueFee({
        studentId: dueForm.studentId,
        amount: parseFloat(dueForm.amount),
        remarks: dueForm.remarks
      });
    }

    setDueForm({ studentId: selectedStudentId || '', amount: '', remarks: '' });
    setShowAssignDue(false);
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editStudentForm) {
      updateStudent(editStudentForm);
      setIsEditingProfile(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* RBAC Verification Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-[32px] bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/60 border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="p-3.5 bg-indigo-600/20 border border-indigo-400/30 text-indigo-400 rounded-2xl shadow-lg shadow-indigo-600/20">
            <UserCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Student Management & Fee Tracker</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Admin Guard Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Comprehensive student profiles, total dues, payment tracking & real-time database sync
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setDueForm({ studentId: selectedStudentId || '', amount: '', remarks: '' });
              setEditingDueId(null);
              setShowAssignDue(true);
            }}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} className="text-amber-400" />
            Assign Due Fee
          </button>
          <button
            onClick={() => {
              setPaymentForm({
                studentId: selectedStudentId || '',
                amount: '',
                month: safeFormat(new Date(), 'MMMM yyyy'),
                date: new Date().toISOString().split('T')[0]
              });
              setShowCollectPayment(true);
            }}
            className="flex-1 sm:flex-initial indigo-button px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Collect Payment
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-[28px] border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Enrolled</span>
            <User className="text-indigo-400" size={18} />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{globalMetrics.totalStudents}</div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {globalMetrics.studentsWithPendingDues} students with balance
          </p>
        </div>

        <div className="glass p-6 rounded-[28px] border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Total Dues Assessed</span>
            <AlertCircle className="text-amber-400" size={18} />
          </div>
          <div className="text-3xl font-black text-amber-300 tracking-tight">{formatCurrency(globalMetrics.totalDuesAssessed)}</div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assigned coarse & due fees</p>
        </div>

        <div className="glass p-6 rounded-[28px] border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Payments Collected</span>
            <CheckCircle2 className="text-emerald-400" size={18} />
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(globalMetrics.totalFeesCollected)}</div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Real-time collections</p>
        </div>

        <div className="glass p-6 rounded-[28px] border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Net Outstanding Balance</span>
            <Wallet className="text-rose-400" size={18} />
          </div>
          <div className={`text-3xl font-black tracking-tight ${globalMetrics.netBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatCurrency(globalMetrics.netBalance)}
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Remaining balance to collect</p>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="glass p-6 rounded-[32px] border border-white/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search student name, roll number, ID, mobile, or guardian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="md:col-span-3 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-glass w-full pl-11 py-3.5 rounded-2xl text-xs appearance-none bg-slate-900 font-bold text-slate-200"
            >
              <option value="All">All Classes ({classesList.length - 1})</option>
              {classesList.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-glass w-full px-4 py-3.5 rounded-2xl text-xs appearance-none bg-slate-900 font-bold text-slate-200"
            >
              <option value="All">All Batches/Subjects</option>
              {subjectsList.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <select 
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="input-glass w-full px-4 py-3.5 rounded-2xl text-xs appearance-none bg-slate-900 font-bold text-slate-200"
            >
              <option value="All">All Payment Status</option>
              <option value="due">Pending Dues Only</option>
              <option value="cleared">Fully Cleared</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-[11px] font-bold text-slate-400">
          <span>Showing <strong className="text-white">{filteredStudents.length}</strong> of {approvedStudents.length} students</span>
          {(searchTerm || selectedClass !== 'All' || selectedSubject !== 'All' || paymentStatusFilter !== 'All') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('All');
                setSelectedSubject('All');
                setPaymentStatusFilter('All');
              }}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(st => {
          const fin = studentFinances.get(st.id) || { totalDue: 0, totalPaid: 0, balance: 0, paymentsCount: 0, duesCount: 0 };
          const hasDue = fin.balance > 0;

          return (
            <div 
              key={st.id}
              onClick={() => handleOpenStudentModal(st)}
              className="glass p-6 rounded-[32px] border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 transition-all cursor-pointer group flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {st.photoUrl ? (
                        <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        st.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
                        {st.name}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                        Class {st.class} • {st.subject}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Roll: <span className="text-slate-300">{st.rollNumber || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 border ${
                    hasDue 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {hasDue ? `Due: ${formatCurrency(fin.balance)}` : 'Cleared'}
                  </span>
                </div>

                {/* Guardian & Contact */}
                <div className="space-y-1.5 pt-4 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Guardian</span>
                    <span className="font-bold text-slate-300">{st.fatherName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mobile</span>
                    <span className="font-bold text-slate-300">{st.mobile || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 block">Total Due</span>
                    <span className="text-xs font-black text-white">{formatCurrency(fin.totalDue)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 block">Paid</span>
                    <span className="text-xs font-black text-emerald-400">{formatCurrency(fin.totalPaid)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 block">Balance</span>
                    <span className={`text-xs font-black ${fin.balance > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {formatCurrency(fin.balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-2 text-xs font-black text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                <span>View Full Profile & Fee Log</span>
                <ChevronRight size={16} />
              </div>
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[40px] space-y-3">
            <User className="mx-auto text-slate-600" size={40} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching student records found</p>
          </div>
        )}
      </div>

      {/* Detailed Student Modal & Drawer */}
      <AnimatePresence>
        {activeStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-950/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass max-w-4xl w-full rounded-[40px] border border-white/10 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
            >
              {/* Modal Top Header */}
              <div className="p-6 sm:p-8 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-indigo-600/30">
                    {activeStudent.photoUrl ? (
                      <img src={activeStudent.photoUrl} alt={activeStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeStudent.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white tracking-tight">{activeStudent.name}</h3>
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        activeFinances.balance > 0 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {activeFinances.balance > 0 ? `Balance Due: ${formatCurrency(activeFinances.balance)}` : 'Cleared'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      Roll Number: <span className="text-indigo-400">{activeStudent.rollNumber || 'Unassigned'}</span> • Class {activeStudent.class} • {activeStudent.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button 
                    onClick={() => {
                      setPaymentForm({
                        studentId: activeStudent.id,
                        amount: '',
                        month: safeFormat(new Date(), 'MMMM yyyy'),
                        date: new Date().toISOString().split('T')[0]
                      });
                      setShowCollectPayment(true);
                    }}
                    className="indigo-button px-4 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <CreditCard size={14} /> Collect Payment
                  </button>
                  <button 
                    onClick={() => setSelectedStudentId(null)}
                    className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-8 bg-slate-900/40 border-b border-white/5 flex gap-2 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'overview', label: 'Financial Summary' },
                  { id: 'profile', label: 'Personal Profile' },
                  { id: 'payments', label: `Payment History (${activeStudentPayments.length})` },
                  { id: 'dues', label: `Assigned Fee Charges (${activeStudentDues.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveModalTab(tab.id as any);
                      if (tab.id === 'profile') setIsEditingProfile(false);
                    }}
                    className={`py-4 px-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                      activeModalTab === tab.id
                        ? 'border-indigo-500 text-indigo-400 bg-white/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body Content */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                
                {/* TAB 1: FINANCIAL OVERVIEW */}
                {activeModalTab === 'overview' && (
                  <div className="space-y-8">
                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Total Dues Assessed</span>
                        <span className="text-2xl font-black">{formatCurrency(activeFinances.totalDue)}</span>
                        <p className="text-[10px] text-amber-400/70 font-medium">{activeFinances.duesCount} charge records</p>
                      </div>

                      <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Total Amount Paid</span>
                        <span className="text-2xl font-black text-emerald-400">{formatCurrency(activeFinances.totalPaid)}</span>
                        <p className="text-[10px] text-emerald-400/70 font-medium">{activeFinances.paymentsCount} past payments</p>
                      </div>

                      <div className={`p-6 rounded-3xl border space-y-1 ${
                        activeFinances.balance > 0 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                      }`}>
                        <span className="text-[10px] font-black uppercase tracking-widest block">Remaining Balance</span>
                        <span className="text-2xl font-black">{formatCurrency(activeFinances.balance)}</span>
                        <p className="text-[10px] opacity-70 font-medium">
                          {activeFinances.balance > 0 ? 'Pending collection' : 'Zero outstanding balance'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Quick Action Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                            <Plus size={18} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm">Quick Record Payment</h4>
                            <p className="text-[10px] text-slate-400">Add a new payment receipt for {activeStudent.name}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setPaymentForm({
                              studentId: activeStudent.id,
                              amount: activeFinances.balance > 0 ? String(activeFinances.balance) : '',
                              month: safeFormat(new Date(), 'MMMM yyyy'),
                              date: new Date().toISOString().split('T')[0]
                            });
                            setShowCollectPayment(true);
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                          <CreditCard size={14} /> Record Payment Received
                        </button>
                      </div>

                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm">Assign New Fee Charge</h4>
                            <p className="text-[10px] text-slate-400">Log monthly tuition or admission fee due</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setDueForm({ studentId: activeStudent.id, amount: '', remarks: '' });
                            setEditingDueId(null);
                            setShowAssignDue(true);
                          }}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                        >
                          <Plus size={14} /> Add Due Charge
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PROFILE DETAILS & EDIT */}
                {activeModalTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Student Record # {activeStudent.id}</span>
                      {!isEditingProfile ? (
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <Edit2 size={14} /> Edit Student Profile
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-black uppercase tracking-widest"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>

                    {!isEditingProfile ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-white/5 border border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</span>
                          <p className="text-sm font-bold text-white">{activeStudent.name}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Roll Number</span>
                          <p className="text-sm font-bold text-indigo-400">{activeStudent.rollNumber || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Father / Guardian Name</span>
                          <p className="text-sm font-bold text-white">{activeStudent.fatherName || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Class & Subject/Batch</span>
                          <p className="text-sm font-bold text-white">Class {activeStudent.class} ({activeStudent.subject})</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Mobile</span>
                          <p className="text-sm font-bold text-white">{activeStudent.mobile || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp Number</span>
                          <p className="text-sm font-bold text-emerald-400">{activeStudent.whatsapp || activeStudent.mobile || 'N/A'}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Joining / Admission Date</span>
                          <p className="text-sm font-bold text-white">
                            {activeStudent.dateOfJoining || activeStudent.admissionDate || 'N/A'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date of Birth & Gender</span>
                          <p className="text-sm font-bold text-white">{activeStudent.dob || 'N/A'} ({activeStudent.gender || 'N/A'})</p>
                        </div>

                        <div className="col-span-full space-y-1 pt-4 border-t border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Residential Address</span>
                          <p className="text-sm font-medium text-slate-300">{activeStudent.address || 'No address provided'}</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.name || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, name: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                            required 
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Roll Number</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.rollNumber || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, rollNumber: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm font-bold text-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Father / Guardian Name</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.fatherName || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, fatherName: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.class || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, class: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject / Batch</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.subject || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, subject: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mobile Number</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.mobile || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, mobile: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">WhatsApp Number</label>
                          <input 
                            type="text" 
                            value={editStudentForm?.whatsapp || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, whatsapp: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Joining Date</label>
                          <input 
                            type="date" 
                            value={editStudentForm?.dateOfJoining || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, dateOfJoining: e.target.value} : null)}
                            className="input-glass w-full px-4 py-3 rounded-2xl text-sm"
                          />
                        </div>

                        <div className="col-span-full">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Address</label>
                          <textarea 
                            rows={2}
                            value={editStudentForm?.address || ''} 
                            onChange={(e) => setEditStudentForm(prev => prev ? {...prev, address: e.target.value} : null)}
                            className="input-glass w-full p-4 rounded-2xl text-sm resize-none"
                          />
                        </div>

                        <div className="col-span-full pt-4 flex gap-3">
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Save size={16} /> Save Changes Globally
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: PAYMENT HISTORY */}
                {activeModalTab === 'payments' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-white text-sm">Collected Fees History</h4>
                      <button 
                        onClick={() => {
                          setPaymentForm({
                            studentId: activeStudent.id,
                            amount: '',
                            month: safeFormat(new Date(), 'MMMM yyyy'),
                            date: new Date().toISOString().split('T')[0]
                          });
                          setShowCollectPayment(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Payment
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeStudentPayments.map(p => (
                        <div key={p.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <div className="font-black text-white text-base">{formatCurrency(p.amount)}</div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Month: {p.month || 'General'} • Date: {p.date ? safeFormat(p.date, 'dd MMM yyyy') : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              PAID
                            </span>
                            <button 
                              onClick={() => {
                                if (window.confirm('Delete this payment record? This will adjust the balance.')) {
                                  deleteFee(p.id);
                                }
                              }}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Payment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {activeStudentPayments.length === 0 && (
                        <div className="py-12 text-center bg-white/5 rounded-3xl border border-white/5 space-y-2">
                          <CreditCard className="mx-auto text-slate-600" size={32} />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No payment records found for this student</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: ASSIGNED DUES */}
                {activeModalTab === 'dues' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-white text-sm">Assigned Fee Dues & Charges</h4>
                      <button 
                        onClick={() => {
                          setDueForm({ studentId: activeStudent.id, amount: '', remarks: '' });
                          setEditingDueId(null);
                          setShowAssignDue(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Assign Due
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeStudentDues.map(d => (
                        <div key={d.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                              <AlertCircle size={18} />
                            </div>
                            <div>
                              <div className="font-black text-white text-base">{formatCurrency(d.amount)}</div>
                              <p className="text-xs text-amber-300/80 font-medium">{d.remarks || 'No remarks'}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                Assigned Date: {d.date ? safeFormat(d.date, 'dd MMM yyyy') : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setDueForm({
                                  studentId: d.studentId,
                                  amount: String(d.amount),
                                  remarks: d.remarks
                                });
                                setEditingDueId(d.id);
                                setShowAssignDue(true);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Delete this assigned fee due?')) {
                                  deleteDueFee(d.id);
                                }
                              }}
                              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {activeStudentDues.length === 0 && (
                        <div className="py-12 text-center bg-white/5 rounded-3xl border border-white/5 space-y-2">
                          <AlertCircle className="mx-auto text-slate-600" size={32} />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending dues or fee charges logged</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COLLECT PAYMENT MODAL */}
      <AnimatePresence>
        {showCollectPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-md w-full p-8 rounded-[36px] border border-white/10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white">Record Fee Payment</h3>
                </div>
                <button onClick={() => setShowCollectPayment(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Student</label>
                  <SearchableSelect 
                    options={approvedSelectOptions}
                    value={paymentForm.studentId}
                    onChange={(val) => setPaymentForm({ ...paymentForm, studentId: val })}
                    placeholder="Search & choose student..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="input-glass w-full px-5 py-3.5 rounded-2xl text-lg font-black text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fee Month / Period</label>
                  <input 
                    type="text" 
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                    className="input-glass w-full px-5 py-3.5 rounded-2xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Date</label>
                  <input 
                    type="date" 
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="input-glass w-full px-5 py-3.5 rounded-2xl text-sm text-white"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Check size={18} /> Confirm Payment Receipt
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN DUE FEE MODAL */}
      <AnimatePresence>
        {showAssignDue && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-md w-full p-8 rounded-[36px] border border-white/10 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {editingDueId ? 'Edit Assigned Fee Due' : 'Assign New Fee Due'}
                  </h3>
                </div>
                <button onClick={() => setShowAssignDue(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>

              <form onSubmit={handleAssignDueSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Student</label>
                  <SearchableSelect 
                    options={approvedSelectOptions}
                    value={dueForm.studentId}
                    onChange={(val) => setDueForm({ ...dueForm, studentId: val })}
                    placeholder="Search & choose student..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Due Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 3000"
                    value={dueForm.amount}
                    onChange={(e) => setDueForm({ ...dueForm, amount: e.target.value })}
                    className="input-glass w-full px-5 py-3.5 rounded-2xl text-lg font-black text-amber-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Remarks / Fee Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Monthly Tuition Fee - August"
                    value={dueForm.remarks}
                    onChange={(e) => setDueForm({ ...dueForm, remarks: e.target.value })}
                    className="input-glass w-full px-5 py-3.5 rounded-2xl text-sm"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Save size={18} /> {editingDueId ? 'Update Due Fee' : 'Assign Fee Due'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
