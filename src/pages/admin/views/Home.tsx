import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStorage } from '../../../hooks/useStorage';
import { getISTDateString } from '../../../lib/dateUtils';
import { 
  Users, FileCheck, Calendar, GraduationCap, UserCheck, ArrowRight, CreditCard, ChevronRight, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
  <div className="glass p-6 rounded-3xl group hover:bg-white/10 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      {subValue && (
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{subValue}</span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-4xl font-black tracking-tighter text-white">{value}</h3>
    </div>
  </div>
);

export default function AdminHome() {
  const { 
    students, expenses, fees, attendance, dueFees
  } = useStorage();

  const totalStudents = students.filter(s => s.status === 'approved').length;
  const pendingAdmissions = students.filter(s => s.status === 'pending').length;
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalFees - totalExpenses;
  const pendingDuesCount = dueFees.length;
  const totalDueAmount = dueFees.reduce((sum, df) => sum + (Number(df.amount) || 0), 0);

  const today = getISTDateString();
  const attendanceToday = attendance.filter(a => a.date === today);
  const attendancePercent = attendanceToday.length > 0 
    ? Math.round((attendanceToday.filter(a => a.status === 'present').length / attendanceToday.length) * 100)
    : 0;

  const data = [
    { name: 'Fees', amount: totalFees, color: '#10B981' },
    { name: 'Expenses', amount: totalExpenses, color: '#EF4444' },
    { name: 'Balance', amount: netBalance, color: '#6366F1' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Overview <span className="text-indigo-500">Center</span></h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Real-time institutional metrics and student management controls
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/student-overview"
            className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <GraduationCap size={15} />
            Student Overview
          </Link>
          <Link
            to="/admin/student-fee-tracker"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <UserCheck size={15} />
            Student Fee Tracker
          </Link>
          <Link
            to="/admin/due-fees"
            className="px-4 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <AlertCircle size={15} />
            Assigned Due Fee
          </Link>
        </div>
      </div>

      {/* Primary Institutional Option Cards: Student Overview, Student Fee Tracker & Assigned Due Fee */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Option 1: Student Overview */}
        <Link 
          to="/admin/student-overview" 
          className="glass p-8 rounded-[36px] border border-white/10 hover:border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-slate-900/90 group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all pointer-events-none text-indigo-400">
            <GraduationCap size={160} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="p-4 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-indigo-500/20">
                <GraduationCap size={28} />
              </div>
              <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                Academic Profiles
              </span>
            </div>

            <div>
              <h4 className="text-2xl font-black text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                Student Overview
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 line-clamp-2">
                Detailed student dossiers, academic performance, test results, enrollment verification, and one-click official PDF exports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                {totalStudents} Active Students
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                Dossier & Audit Records
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 relative z-10">
            <span>Launch Student Overview</span>
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Option 2: Student Fee Tracker */}
        <Link 
          to="/admin/student-fee-tracker" 
          className="glass p-8 rounded-[36px] border border-white/10 hover:border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/70 to-slate-900/90 group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all pointer-events-none text-emerald-400">
            <UserCheck size={160} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="p-4 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/20">
                <UserCheck size={28} />
              </div>
              <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                Fee Management
              </span>
            </div>

            <div>
              <h4 className="text-2xl font-black text-white tracking-tight group-hover:text-emerald-200 transition-colors">
                Student Fee Tracker
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 line-clamp-2">
                Monthly student fee collection tracking, pending balance ledgers, direct payment recording, and real-time status reviews.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                ₹{totalFees.toLocaleString('en-IN')} Collected
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                {pendingDuesCount} Pending Records
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-emerald-400 group-hover:text-emerald-300 relative z-10">
            <span>Launch Student Fee Tracker</span>
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Option 3: Assigned Due Fee */}
        <Link 
          to="/admin/due-fees" 
          className="glass p-8 rounded-[36px] border border-white/10 hover:border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900/70 to-slate-900/90 group transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-rose-500/10 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all pointer-events-none text-rose-400">
            <AlertCircle size={160} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg shadow-rose-500/20">
                <AlertCircle size={28} />
              </div>
              <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-300 border border-rose-500/25">
                Fee Assessments
              </span>
            </div>

            <div>
              <h4 className="text-2xl font-black text-white tracking-tight group-hover:text-rose-200 transition-colors">
                Assigned Due Fee
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 line-clamp-2">
                Assign pending dues to students, monitor unpaid fee balances, configure fee remarks, and track outstanding collections.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-bold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
                ₹{totalDueAmount.toLocaleString('en-IN')} Total Pending
              </span>
              <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                {pendingDuesCount} Due Records
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black uppercase tracking-widest text-rose-400 group-hover:text-rose-300 relative z-10">
            <span>Launch Assigned Due Fee</span>
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="Total Students" value={totalStudents} icon={Users} color="blue" />
        <StatCard label="Pending Admissions" value={pendingAdmissions} icon={FileCheck} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[40px]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Fees Collection and Expenses</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Fees</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="amount" radius={[12, 12, 0, 0]} barSize={80}>
                   {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="glass p-10 rounded-[40px] flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <Calendar size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Today's Attendance</h3>
            <div className="text-5xl font-black text-white mb-6 leading-none">
              {attendancePercent}%
            </div>
            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-4 border border-white/10">
              <div className="bg-indigo-500 h-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${attendancePercent}%` }}></div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Institutional Average</p>
          </div>
        </div>
      </div>
    </div>
  );
}
