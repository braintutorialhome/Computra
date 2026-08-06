import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { 
  Search, User, Trash2, Edit2, Filter, Phone, MapPin, X, Save, Hash, 
  RotateCcw, AlertTriangle, MessageSquare, CreditCard, Plus, Calendar, 
  DollarSign, CheckCircle2, AlertCircle, FileText, Clock, BookOpen, 
  ChevronRight, Eye, ShieldCheck, Mail, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Student } from '../../../types';
import { safeFormat } from '../../../lib/utils';

const compressImage = (file: File, maxWidth = 150, maxHeight = 150, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export default function StudentManagement() {
  const { 
    students, 
    fees, 
    dueFees, 
    deleteStudent, 
    removeStudentPermanently, 
    updateStudent,
    addFee,
    deleteFee,
    addDueFee,
    deleteDueFee
  } = useStorage();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  // Quick action states inside Student Detail View
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [showQuickDue, setShowQuickDue] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    month: safeFormat(new Date(), 'MMMM yyyy'),
    date: new Date().toISOString().split('T')[0]
  });
  const [dueData, setDueData] = useState({
    amount: '',
    remarks: ''
  });

  const approved = students.filter(s => s.status === 'approved');
  const deleted = students.filter(s => s.status === 'deleted' || s.status === 'rejected');
  
  const displayList = activeTab === 'active' ? approved : deleted;

  const classes = ['All', ...Array.from(new Set(approved.map(s => s.class).filter(Boolean)))];
  const subjects = ['All', ...Array.from(new Set(approved.map(s => s.subject).filter(Boolean)))];

  const filtered = displayList.filter(s => {
    const sName = String(s.name || '').toLowerCase();
    const sRoll = String(s.rollNumber || '').toLowerCase();
    const sId = String(s.id || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = sName.includes(search) || 
                          sRoll.includes(search) ||
                          sId.includes(search);
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    const matchesSubject = filterSubject === 'All' || s.subject === filterSubject;
    return matchesSearch && matchesClass && matchesSubject;
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent(editingStudent);
      // If currently selected student is updated, update selectedStudent state as well
      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent(editingStudent);
      }
      setEditingStudent(null);
    }
  };

  const handleRestore = (id: string) => {
    const student = deleted.find(s => s.id === id);
    if (student) {
      updateStudent({ ...student, status: 'approved' });
    }
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !paymentData.amount) return;

    addFee({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      amount: parseFloat(paymentData.amount),
      month: paymentData.month,
      date: paymentData.date,
      status: 'paid'
    });

    setShowQuickPayment(false);
    setPaymentData({
      amount: '',
      month: safeFormat(new Date(), 'MMMM yyyy'),
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !dueData.amount) return;

    addDueFee({
      studentId: selectedStudent.id,
      amount: parseFloat(dueData.amount),
      remarks: dueData.remarks || 'Fee Charge'
    });

    setShowQuickDue(false);
    setDueData({
      amount: '',
      remarks: ''
    });
  };

  // Calculations for selected student
  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return fees.filter(f => f.studentId === selectedStudent.id);
  }, [fees, selectedStudent]);

  const studentDues = useMemo(() => {
    if (!selectedStudent) return [];
    return dueFees.filter(df => df.studentId === selectedStudent.id);
  }, [dueFees, selectedStudent]);

  const totalPaid = useMemo(() => {
    return studentPayments.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [studentPayments]);

  const totalDue = useMemo(() => {
    return studentDues.reduce((sum, df) => sum + (Number(df.amount) || 0), 0);
  }, [studentDues]);

  const remainingBalance = totalDue - totalPaid;

  return (
    <div className="space-y-10">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-6 rounded-[32px] border border-white/5 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <User size={24} />
          </div>
          <div>
            <h3 className="font-black text-xl text-white tracking-tight">Student Directory & Fee Tracker</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Admin-only student profiles, payment histories & fee balance management</p>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1.5 glass rounded-2xl">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Active Students ({approved.length})
          </button>
          <button 
            onClick={() => setActiveTab('deleted')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deleted' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Trash ({deleted.length})
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search student name, roll number or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl appearance-none text-sm"
          >
            <option value="All" className="bg-slate-900">All Classes</option>
            {classes.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-slate-900">Class: {c}</option>)}
          </select>
        </div>
        <div className="relative">
          <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl appearance-none text-sm"
          >
            <option value="All" className="bg-slate-900">All Subjects / Batches</option>
            {subjects.filter(s => s !== 'All').map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map(s => {
          const sPaid = fees.filter(f => f.studentId === s.id).reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
          const sDue = dueFees.filter(df => df.studentId === s.id).reduce((acc, df) => acc + (Number(df.amount) || 0), 0);
          const sBal = sDue - sPaid;

          return (
            <div 
              key={s.id} 
              className={`glass rounded-[32px] overflow-hidden group hover:bg-white/10 transition-all flex flex-col cursor-pointer ${activeTab === 'deleted' ? 'opacity-80 border-rose-500/20' : ''}`}
              onClick={() => setSelectedStudent(s)}
            >
              <div className="p-8 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`w-16 h-16 ${activeTab === 'deleted' ? 'bg-rose-600/50' : 'bg-indigo-600'} text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0`}>
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'deleted' ? 'text-rose-400' : 'text-indigo-400'}`}>
                      {s.rollNumber || 'NO ROLL'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">ID: {s.id}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-black text-xl tracking-tight text-white mb-1 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    {s.name}
                    {activeTab === 'deleted' && <span className="text-[8px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-lg">DELETED</span>}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.subject} • Class {s.class}</p>
                </div>

                {/* Fee Mini Summary Pill */}
                {activeTab === 'active' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Paid</span>
                      <span className="font-black text-emerald-400">₹{sPaid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Balance Due</span>
                      <span className={`font-black ${sBal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {sBal > 0 ? `₹${sBal.toLocaleString()}` : 'Cleared'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <Phone size={14} className={activeTab === 'deleted' ? 'text-rose-500' : 'text-indigo-500'} /> {s.mobile}
                  </div>
                  {s.fatherName && (
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <ShieldCheck size={14} className="text-slate-500" /> Guardian: {s.fatherName}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <MapPin size={14} className={activeTab === 'deleted' ? 'text-rose-500' : 'text-indigo-500'} /> {s.address}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3" onClick={(e) => e.stopPropagation()}>
                {activeTab === 'active' ? (
                  <>
                    <button 
                      onClick={() => setSelectedStudent(s)}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Eye size={12} /> View Profile & Fees
                    </button>
                    <button 
                      onClick={() => setEditingStudent(s)}
                      className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      title="Edit Student Profile"
                    >
                      <Edit2 size={12} />
                    </button>
                    {deletingId === s.id ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            deleteStudent(s.id);
                            setDeletingId(null);
                          }}
                          className="py-3 px-4 rounded-xl bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="py-3 px-3 rounded-xl bg-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(s.id)}
                        className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 group/btn"
                        title="Move to trash"
                      >
                        <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleRestore(s.id)}
                      className="flex-1 py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} /> Restore Record
                    </button>
                    {deletingId === s.id ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            removeStudentPermanently(s.id);
                            setDeletingId(null);
                          }}
                          className="py-3 px-4 rounded-xl bg-rose-900 border border-rose-600 text-white text-[8px] font-black uppercase tracking-widest animate-pulse"
                        >
                          Erase
                        </button>
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="py-3 px-3 rounded-xl bg-white/10 text-white text-[8px] font-black uppercase tracking-widest"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(s.id)}
                        className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                        title="Permanent Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[40px]">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No student records found matching filters.</p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* DETAILED STUDENT PROFILE & FEE TRACKING MODAL */}
      {/* ========================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl bg-slate-950/80 animate-in fade-in duration-200">
          <div className="glass max-w-4xl w-full p-8 md:p-10 rounded-[40px] border border-white/10 overflow-y-auto max-h-[92vh] custom-scrollbar space-y-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center overflow-hidden border-2 border-indigo-500/30 shadow-xl shrink-0">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    selectedStudent.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">{selectedStudent.name}</h2>
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                      Roll: {selectedStudent.rollNumber || 'Unassigned'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedStudent.subject} • Class {selectedStudent.class} {selectedStudent.semester ? `• ${selectedStudent.semester}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedStudent.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingStudent(selectedStudent);
                  }} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button 
                  onClick={() => {
                    setSelectedStudent(null);
                    setShowQuickPayment(false);
                    setShowQuickDue(false);
                  }} 
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Fee Summary Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-indigo-950/40 border border-indigo-500/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Assessed Dues</span>
                  <DollarSign size={18} className="text-indigo-400" />
                </div>
                <p className="text-3xl font-black text-white">₹{totalDue.toLocaleString()}</p>
                <span className="text-[9px] font-bold text-indigo-300/60 uppercase tracking-wider mt-1 block">Total fee charges levied</span>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Amount Paid</span>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <p className="text-3xl font-black text-emerald-400">₹{totalPaid.toLocaleString()}</p>
                <span className="text-[9px] font-bold text-emerald-300/60 uppercase tracking-wider mt-1 block">Successfully collected</span>
              </div>

              <div className={`p-6 rounded-3xl border relative overflow-hidden ${remainingBalance > 0 ? 'bg-rose-950/40 border-rose-500/20' : 'bg-slate-900/60 border-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Remaining Balance</span>
                  <AlertCircle size={18} className={remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                </div>
                <p className={`text-3xl font-black ${remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {remainingBalance > 0 ? `₹${remainingBalance.toLocaleString()}` : '₹0 (All Clear)'}
                </p>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                  {remainingBalance > 0 ? 'Pending payment balance' : 'No balance outstanding'}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Actions</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowQuickPayment(!showQuickPayment);
                    setShowQuickDue(false);
                  }}
                  className="indigo-button px-5 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <Plus size={14} /> Collect Fee
                </button>
                <button 
                  onClick={() => {
                    setShowQuickDue(!showQuickDue);
                    setShowQuickPayment(false);
                  }}
                  className="glass-button px-5 py-2.5 text-xs font-black uppercase tracking-widest text-rose-300 border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Plus size={14} /> Add Due Charge
                </button>
              </div>
            </div>

            {/* Inline Collect Payment Form */}
            {showQuickPayment && (
              <form onSubmit={handleAddPaymentSubmit} className="p-6 bg-indigo-950/30 border border-indigo-500/30 rounded-3xl space-y-4 animate-in fade-in duration-200">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                  <CreditCard size={14} /> Record Fee Payment for {selectedStudent.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      placeholder="e.g. 1500" 
                      className="input-glass w-full py-3 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Billing Month</label>
                    <input 
                      type="text" 
                      required 
                      value={paymentData.month}
                      onChange={(e) => setPaymentData({ ...paymentData, month: e.target.value })}
                      placeholder="e.g. April 2024" 
                      className="input-glass w-full py-3 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Payment Date</label>
                    <input 
                      type="date" 
                      required 
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                      className="input-glass w-full py-3 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowQuickPayment(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="indigo-button px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Confirm & Save Payment
                  </button>
                </div>
              </form>
            )}

            {/* Inline Add Due Charge Form */}
            {showQuickDue && (
              <form onSubmit={handleAddDueSubmit} className="p-6 bg-rose-950/30 border border-rose-500/30 rounded-3xl space-y-4 animate-in fade-in duration-200">
                <h4 className="text-xs font-black uppercase tracking-widest text-rose-300 flex items-center gap-2">
                  <AlertCircle size={14} /> Add Due Charge for {selectedStudent.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Due Amount (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={dueData.amount}
                      onChange={(e) => setDueData({ ...dueData, amount: e.target.value })}
                      placeholder="e.g. 2000" 
                      className="input-glass w-full py-3 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Purpose / Remarks</label>
                    <input 
                      type="text" 
                      required 
                      value={dueData.remarks}
                      onChange={(e) => setDueData({ ...dueData, remarks: e.target.value })}
                      placeholder="e.g. Admission Fee / Monthly Fee" 
                      className="input-glass w-full py-3 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowQuickDue(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/30"
                  >
                    Add Due Charge
                  </button>
                </div>
              </form>
            )}

            {/* Personal Details Grid */}
            <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
              <h3 className="font-black text-white uppercase tracking-tight text-sm flex items-center gap-2">
                <User size={16} className="text-indigo-400" /> Student Personal & Academic Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Guardian's Name</span>
                  <span className="font-bold text-white">{selectedStudent.fatherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mobile Contact</span>
                  <span className="font-bold text-white">{selectedStudent.mobile}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">WhatsApp</span>
                  <span className="font-bold text-emerald-400">{selectedStudent.whatsapp || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Class / Grade</span>
                  <span className="font-bold text-white">Class {selectedStudent.class}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Subject / Batch</span>
                  <span className="font-bold text-indigo-400">{selectedStudent.subject}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Date of Joining</span>
                  <span className="font-bold text-white">{safeFormat(selectedStudent.dateOfJoining || selectedStudent.admissionDate, 'dd MMM yyyy')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Date of Birth</span>
                  <span className="font-bold text-white">{safeFormat(selectedStudent.dob, 'dd MMM yyyy')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Gender</span>
                  <span className="font-bold text-white">{selectedStudent.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Semester</span>
                  <span className="font-bold text-white">{selectedStudent.semester || 'N/A'}</span>
                </div>
                <div className="md:col-span-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Residential Address</span>
                  <span className="font-bold text-slate-300">{selectedStudent.address}</span>
                </div>
              </div>
            </div>

            {/* Payment History & Dues Tables */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-black text-white uppercase tracking-tight text-sm flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-400" /> Payment History ({studentPayments.length})
                </h3>
              </div>

              {studentPayments.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4">Billing Month</th>
                        <th className="px-6 py-4">Payment Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                      {studentPayments.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{p.month}</td>
                          <td className="px-6 py-4">{safeFormat(p.date, 'dd MMM yyyy')}</td>
                          <td className="px-6 py-4 font-black text-emerald-400">₹{p.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to remove this payment record?')) {
                                  deleteFee(p.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Payment Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No fee payment records logged yet for this student.</p>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-4">
                <h3 className="font-black text-white uppercase tracking-tight text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-400" /> Recorded Fee Charges / Dues ({studentDues.length})
                </h3>
              </div>

              {studentDues.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.02]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="px-6 py-4">Purpose / Remarks</th>
                        <th className="px-6 py-4">Date Added</th>
                        <th className="px-6 py-4">Charge Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                      {studentDues.map(d => (
                        <tr key={d.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{d.remarks}</td>
                          <td className="px-6 py-4">{safeFormat(d.date, 'dd MMM yyyy')}</td>
                          <td className="px-6 py-4 font-black text-rose-400">₹{d.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this due fee charge?')) {
                                  deleteDueFee(d.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Due Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No specific due charges recorded for this student.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
          <div className="glass max-w-2xl w-full p-10 rounded-[40px] border border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Student Profile</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full flex flex-col items-center justify-center py-4 bg-white/5 rounded-3xl border border-white/5 mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center font-black text-white text-3xl shadow-lg relative overflow-hidden group/form-avatar">
                  {editingStudent.photoUrl ? (
                    <img src={editingStudent.photoUrl} alt={editingStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    editingStudent.name ? editingStudent.name.charAt(0) : 'U'
                  )}
                  <label className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover/form-avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setEditingStudent(prev => prev ? { ...prev, photoUrl: compressed } : null);
                          } catch (err) {
                            console.error("Failed to compress image:", err);
                          }
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                </div>
                {editingStudent.photoUrl && (
                  <button 
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, photoUrl: undefined })}
                    className="mt-3 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove Picture
                  </button>
                )}
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Assigned Roll Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text"
                    value={editingStudent.rollNumber || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                    className="input-glass w-full pl-14 py-4 rounded-2xl text-indigo-400 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Full Name</label>
                <input 
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Guardian's Name</label>
                <input 
                  type="text"
                  value={editingStudent.fatherName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Class</label>
                <input 
                  type="text"
                  value={editingStudent.class}
                  onChange={(e) => setEditingStudent({...editingStudent, class: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Subject / Batch</label>
                <input 
                  type="text"
                  value={editingStudent.subject}
                  onChange={(e) => setEditingStudent({...editingStudent, subject: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Mobile</label>
                <input 
                  type="text"
                  value={editingStudent.mobile}
                  onChange={(e) => setEditingStudent({...editingStudent, mobile: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">WhatsApp Number</label>
                <input 
                  type="text"
                  value={editingStudent.whatsapp || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, whatsapp: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                  placeholder="WhatsApp number"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={editingStudent.dob || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl text-white animate-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Gender</label>
                <select 
                  value={editingStudent.gender || 'Male'}
                  onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value})}
                  className="input-glass w-full px-6 p-4 rounded-2xl bg-slate-950 font-bold"
                >
                  <option value="Male" className="bg-slate-900">Male</option>
                  <option value="Female" className="bg-slate-900">Female</option>
                  <option value="Other" className="bg-slate-900">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Semester</label>
                <select 
                  value={editingStudent.semester || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, semester: e.target.value})}
                  className="input-glass w-full px-6 p-4 rounded-2xl bg-slate-950 font-bold"
                >
                  <option value="" className="bg-slate-900">No Semester</option>
                  <option value="Semester-I" className="bg-slate-900">Semester-I</option>
                  <option value="Semester-II" className="bg-slate-900">Semester-II</option>
                  <option value="Semester-III" className="bg-slate-900">Semester-III</option>
                  <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Joining</label>
                <input 
                  type="date"
                  value={editingStudent.dateOfJoining || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, dateOfJoining: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl text-white animate-none"
                />
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Residential Address</label>
                <textarea 
                  rows={2}
                  value={editingStudent.address || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, address: e.target.value})}
                  className="input-glass w-full p-6 rounded-2xl resize-none"
                />
              </div>

              <div className="col-span-full">
                <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20">
                  <Save size={18} /> Update Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

