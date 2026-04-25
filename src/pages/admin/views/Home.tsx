import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStorage } from '../../../hooks/useStorage';
import { 
  Users, FileCheck, CreditCard, Wallet, Calendar, TrendingUp, DollarSign, Share2, Loader2, CheckCircle2, AlertCircle, RefreshCw, Terminal, Cloud, Lock
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
    students, expenses, fees, users, attendance, tests, testResults, materials, notices,
    clearAllData, scriptUrl, setScriptUrl, refreshCloudData 
  } = useStorage();
  const [isResetting, setIsResetting] = useState(false);
  const [scriptSyncStatus, setScriptSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setScriptSyncStatus('syncing');
    setErrorMessage(null);
    try {
      await refreshCloudData();
      setScriptSyncStatus('success');
      setTimeout(() => setScriptSyncStatus('idle'), 2000);
    } catch (err: any) {
      console.error(err);
      setScriptSyncStatus('error');
      setErrorMessage(err.message || 'Failed to synchronize with cloud');
    }
  };

  const handleBackupToSheets = async () => {
    if (!scriptUrl) return;
    setScriptSyncStatus('syncing');
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'BACKUP',
          data: { 
            students, 
            fees, 
            expenses, 
            users, 
            attendance, 
            tests, 
            testResults, 
            materials, 
            notices 
          }
        })
      });
      setScriptSyncStatus('success');
      setTimeout(() => setScriptSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setScriptSyncStatus('error');
    }
  };

  const handleReset = () => {
    if (window.confirm('WARNING: This will permanently delete ALL data. This cannot be undone. Are you sure?')) {
      setIsResetting(true);
      setTimeout(() => {
        clearAllData();
        setIsResetting(false);
        window.location.reload(); // Refresh to ensure clean state
      }, 1000);
    }
  };

  const totalStudents = students.filter(s => s.status === 'approved').length;
  const pendingAdmissions = students.filter(s => s.status === 'pending').length;
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalFees - totalExpenses;

  const today = new Date().toISOString().split('T')[0];
  const attendanceToday = attendance.filter(a => a.date === today);
  const attendancePercent = attendanceToday.length > 0 
    ? Math.round((attendanceToday.filter(a => a.status === 'present').length / attendanceToday.length) * 100)
    : 0;

  const data = [
    { name: 'Income', amount: totalFees, color: '#10B981' },
    { name: 'Expenses', amount: totalExpenses, color: '#EF4444' },
    { name: 'Balance', amount: netBalance, color: '#6366F1' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Operations <span className="text-indigo-500">Center</span></h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={scriptSyncStatus === 'syncing'}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] glass-button text-indigo-400 hover:text-white transition-all"
          >
            {scriptSyncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>{scriptSyncStatus === 'syncing' ? 'Syncing...' : 'Refresh Cloud Data'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 scale-110 pointer-events-none group-hover:rotate-0 transition-all duration-1000">
               <Cloud size={140} className={scriptUrl ? "text-indigo-500" : "text-slate-500"} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className={`p-3 rounded-2xl ${scriptUrl ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Cloud size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Real-Time Cloud Bridge</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-all ${scriptUrl ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {scriptUrl ? 'Live Integration Active' : 'Offline Mode Only'}
                      </p>
                    </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="PASTE URL HERE..."
                     value={scriptUrl}
                     onChange={(e) => setScriptUrl(e.target.value)}
                     className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-5 px-6 text-xs font-bold text-indigo-300 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all pr-12"
                   />
                   <div className="absolute right-3 top-3 bottom-3 rounded-xl bg-slate-950 flex items-center px-4 border border-white/5">
                      <Lock size={12} className="text-slate-600" />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={handleRefresh}
                      disabled={scriptSyncStatus === 'syncing' || !scriptUrl}
                      className="py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2 border border-white/5 disabled:opacity-30"
                    >
                      {scriptSyncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      Fetch Records
                    </button>
                    <button 
                      onClick={handleBackupToSheets}
                      disabled={scriptSyncStatus === 'syncing' || !scriptUrl}
                      className="py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30 border-none text-white cursor-pointer"
                    >
                      <Share2 size={14} />
                      Test & Backup
                    </button>
                 </div>

                 {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed" title={errorMessage}>
                          Connection Error Detetcted
                        </p>
                      </div>
                    </motion.div>
                 )}
               </div>

               <p className="mt-8 text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-widest border-t border-white/5 pt-6">
                 System is currently in <span className={scriptUrl ? "text-indigo-400" : "text-rose-400"}>{scriptUrl ? "DIRECT MIRROR" : "LOCAL CACHE"}</span> mode. 
               </p>
            </div>
        </div>

        <div className="glass p-8 rounded-[40px] border border-white/5 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
               <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
                 <RefreshCw size={20} />
               </div>
               <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">System Maintenance</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Purge Local Memory</p>
               </div>
            </div>
            <div className="flex items-center justify-between gap-6">
               <p className="text-[9px] font-medium text-slate-500 leading-relaxed flex-1">
                  Permanently delete all locally cached records. Use this if you want to start with a fresh slate.
               </p>
               <button 
                  onClick={handleReset}
                  disabled={isResetting}
                  className="px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-2 whitespace-nowrap"
               >
                  {isResetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  <span>Wipe Local Data</span>
               </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Students" value={totalStudents} icon={Users} color="blue" />
        <StatCard label="Pending Admissions" value={pendingAdmissions} icon={FileCheck} color="amber" />
        <StatCard label="Fees Collected" value={`₹${totalFees}`} icon={CreditCard} color="emerald" />
        <StatCard label="Net Balance" value={`₹${netBalance}`} icon={DollarSign} color="indigo" subValue={netBalance < 0 ? 'Negative' : 'Profit'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-10 rounded-[40px]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Financial Stream</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Income</span>
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

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 scale-150 group-hover:scale-[1.7] transition-transform">
               <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-white font-black uppercase tracking-tight text-xl mb-8">Performance Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-indigo-100/60 text-xs font-bold uppercase">Profit Margin</span>
                  <span className="text-xl font-black text-white">{(netBalance / (totalFees || 1) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-100/60 text-xs font-bold uppercase">Active Tests</span>
                  <span className="text-xl font-black text-white">03</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
