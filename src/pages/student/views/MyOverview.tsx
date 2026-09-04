import React, { useMemo } from 'react';
import { 
  ShieldCheck, CreditCard, AlertCircle, 
  CheckCircle2, Calendar, Phone, MapPin, BookOpen, 
  GraduationCap, Clock, Award, Layers, User, FileText,
  MessageSquare
} from 'lucide-react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { format, parseISO } from 'date-fns';
import { StudentDossierData } from '../../../lib/studentDossierPdf';

interface MyOverviewProps {
  student: Student;
}

export default function MyOverview({ student }: MyOverviewProps) {
  const { fees, dueFees } = useStorage();

  // Safe date formatting helper
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

  // Compile dossier data for the logged-in student
  const dossierData = useMemo<StudentDossierData>(() => {
    const studentPaidFees = fees.filter(f => f.studentId === student.id && f.status === 'paid');
    const totalPaid = studentPaidFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    
    const studentDueFees = dueFees.filter(df => df.studentId === student.id);
    const totalDue = studentDueFees.reduce((sum, df) => sum + (Number(df.amount) || 0), 0);

    return {
      student,
      totalPaid,
      paidCount: studentPaidFees.length,
      totalDue,
      dueCount: studentDueFees.length,
      attendanceRate: null,
      totalAttendance: 0,
      testCount: 0,
      paidFeesList: studentPaidFees,
      dueFeesList: studentDueFees,
      testResultsList: [],
    };
  }, [student, fees, dueFees]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 sm:p-8 rounded-[36px] border border-white/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-4">
            {/* Student Photo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-indigo-500/30 bg-slate-900/90 flex items-center justify-center overflow-hidden shadow-xl shrink-0 relative group">
              {student.photoUrl ? (
                <img 
                  src={student.photoUrl} 
                  alt={student.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/60 to-slate-900 text-indigo-400">
                  <User size={28} />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">{student.name}</h1>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Record
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Roll No: <strong className="text-white font-mono">{student.rollNumber || 'N/A'}</strong>
                <span className="mx-2 text-slate-600">•</span>
                Student ID: <strong className="text-indigo-400 font-mono">{student.id}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Financial Snapshot KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-6 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">Total Fees Paid</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-300">₹{dossierData.totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-xs text-emerald-400/80 font-semibold mt-1">
            {dossierData.paidCount} recorded transaction{dossierData.paidCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-6 rounded-[32px] bg-rose-500/10 border border-rose-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">Assessed Due Fees</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-300">₹{dossierData.totalDue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-rose-400/80 font-semibold mt-1">
            {dossierData.dueCount} pending assessment{dossierData.dueCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Comprehensive Student Profile & Personal Dossier */}
      <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2.5">
            <User size={16} className="text-indigo-400" /> Student Profile & Personal Information
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            ID: <span className="font-mono text-indigo-400">{student.id}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-xs">
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Full Name</span>
            <span className="text-white font-black text-sm mt-0.5 block">{student.name}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Roll Number</span>
            <span className="text-indigo-300 font-mono font-bold text-sm mt-0.5 block">{student.rollNumber || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Father's / Guardian Name</span>
            <span className="text-white font-bold mt-0.5 block">{student.fatherName || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Gender</span>
            <span className="text-white font-bold capitalize mt-0.5 block">{student.gender || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Date of Birth</span>
            <span className="text-white font-bold mt-0.5 block">{safeFormatDate(student.dob)}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Primary Mobile</span>
            <span className="text-white font-bold mt-0.5 block">{student.mobile || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">WhatsApp</span>
            <span className="text-white font-bold mt-0.5 block">{student.whatsapp || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Admission Date</span>
            <span className="text-white font-bold mt-0.5 block">{safeFormatDate(student.admissionDate)}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Subject / Course</span>
            <span className="text-indigo-300 font-bold mt-0.5 block">{student.subject || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Batch / Class</span>
            <span className="text-indigo-300 font-bold mt-0.5 block">{student.class || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Semester</span>
            <span className="text-indigo-300 font-bold mt-0.5 block">{student.semester || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Academic Session</span>
            <span className="text-emerald-300 font-bold mt-0.5 block">{student.session || 'N/A'}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Enrollment Status</span>
            <span className="text-emerald-400 font-bold capitalize mt-0.5 block">{student.status}</span>
          </div>

          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Date of Joining</span>
            <span className="text-white font-bold mt-0.5 block">{safeFormatDate(student.dateOfJoining)}</span>
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Residential Address</span>
            <span className="text-slate-300 font-medium mt-0.5 block">{student.address || 'No address provided'}</span>
          </div>
        </div>
      </div>

      {/* Read-Only Fee Payment History */}
      <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2.5">
            <CreditCard size={16} className="text-emerald-400" /> Fee Payment Ledger
          </h3>
          <span className="text-xs text-slate-500 font-bold">
            Total Paid: <strong className="text-emerald-400 font-black">₹{dossierData.totalPaid.toLocaleString('en-IN')}</strong>
          </span>
        </div>

        {dossierData.paidFeesList.length === 0 ? (
          <div className="bg-white/[0.02] p-8 rounded-2xl border border-white/5 text-center text-xs text-slate-400">
            No fee payment receipts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {dossierData.paidFeesList.map((f, i) => (
                  <tr key={`paid-${f.id || i}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{safeFormatDate(f.date)}</td>
                    <td className="py-3 px-4">{f.month || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400">₹{Number(f.amount).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
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

      {/* Read-Only Assessed Due Fees History */}
      <div className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2.5">
            <AlertCircle size={16} className="text-rose-400" /> Assessed Due Fees History
          </h3>
          <span className="text-xs text-slate-500 font-bold">
            Total Outstanding: <strong className="text-rose-400 font-black">₹{dossierData.totalDue.toLocaleString('en-IN')}</strong>
          </span>
        </div>

        {dossierData.dueFeesList.length === 0 ? (
          <div className="bg-emerald-500/5 p-8 rounded-2xl border border-emerald-500/20 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 size={18} /> All assessed dues are fully cleared. You have zero outstanding balance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Remarks / Description</th>
                  <th className="py-3 px-4 text-right">Assessed Due Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {dossierData.dueFeesList.map((df, i) => (
                  <tr key={`due-${df.id || i}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{safeFormatDate(df.date)}</td>
                    <td className="py-3 px-4">{df.remarks || 'Standard Assessment'}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-400">₹{Number(df.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
