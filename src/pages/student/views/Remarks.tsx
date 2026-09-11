import React, { useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { 
  MessageSquareQuote, Award, ShieldCheck, Calendar, 
  Clock, CheckCircle2, UserCheck, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StudentRemarksProps {
  student?: Student;
}

type RemarkCategory = 'Academic' | 'Performance' | 'Discipline' | 'Attendance' | 'General';

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Academic: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Performance: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  Discipline: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  Attendance: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  General: { color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

export default function StudentRemarksView({ student }: StudentRemarksProps) {
  const { remarks, currentUser, students } = useStorage();

  // Active student resolution
  const activeStudent = student || students.find(s => 
    s.status === 'approved' && 
    (s.rollNumber === currentUser?.username || s.id === currentUser?.id || s.name === currentUser?.name)
  );

  // Filter remarks for this student
  const myRemarks = useMemo(() => {
    if (!activeStudent) return [];
    return remarks.filter(r => r.studentId === activeStudent.id);
  }, [remarks, activeStudent]);

  // Safe date formatter
  const safeFormatDate = (dateStr?: string, fmt = 'dd MMMM yyyy') => {
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
            Student Feedback & Conduct
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs font-bold text-slate-500">Official Dossier</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-3">
          <MessageSquareQuote className="text-indigo-500" size={32} />
          Remarks <span className="text-slate-700">/</span> Administration
        </h1>
        <p className="text-xs font-bold text-slate-500 max-w-xl leading-relaxed">
          Official academic assessments, performance evaluations, and behavioral remarks issued by UTC Computra Administration.
        </p>
      </div>

      {/* Summary Profile Card */}
      <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none text-indigo-500">
          <MessageSquareQuote size={180} />
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
                  <ShieldCheck size={12} /> Verified Record
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-400 mt-1">
                Roll No: <span className="text-indigo-400">{activeStudent?.rollNumber || 'N/A'}</span> • Class/Subject: <span className="text-white">{activeStudent?.class || activeStudent?.subject || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Remarks</p>
              <p className="text-3xl font-black text-white mt-0.5">{myRemarks.length}</p>
            </div>
            {myRemarks.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Latest Review</p>
                <p className="text-xs font-bold text-indigo-300 mt-1">
                  {safeFormatDate(myRemarks[0].date, 'dd MMM yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remarks Feed */}
      {myRemarks.length === 0 ? (
        <div className="glass p-12 rounded-[40px] border border-white/5 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">No Remarks On Record</h3>
          <p className="text-xs font-bold text-slate-400 leading-relaxed">
            There are currently no administrative or disciplinary remarks recorded on your student profile. Your academic and institutional standing is in good standing!
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 text-slate-400 text-[11px] font-bold">
              <Info size={13} />
              Feedback from instructors or management will automatically appear here.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Official Institutional Log ({myRemarks.length})
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              Read-Only Access
            </span>
          </div>

          <div className="grid gap-4">
            {myRemarks.map((rem, index) => {
              const catStyle = CATEGORY_STYLES[rem.category || 'General'] || CATEGORY_STYLES.General;

              return (
                <div 
                  key={rem.id || index}
                  className="glass p-6 md:p-8 rounded-[36px] border border-white/5 hover:border-white/10 transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${catStyle.bg} ${catStyle.color} ${catStyle.border}`}>
                        {rem.category || 'General'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {safeFormatDate(rem.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      <span>Authorized by {rem.createdBy || 'Administration'}</span>
                    </div>
                  </div>

                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5">
                    <p className="text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap">
                      "{rem.remark}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                    <span>UTC Computra Academic Affairs Cell</span>
                    <span className="font-mono text-[10px]">RECORD #{rem.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
