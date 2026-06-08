import React from 'react';
import { useStorage } from '../../hooks/useStorage';
import { Student } from '../../types';
import { AlertCircle, Calendar, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDueFeesProps {
  student?: Student;
}

const StudentDueFees: React.FC<StudentDueFeesProps> = ({ student }) => {
  const { currentUser, dueFees, students } = useStorage();
  
  // Find current student context
  const activeStudent = student || students.find(s => 
    s.status === 'approved' && 
    (s.rollNumber === currentUser?.username || s.id === currentUser?.id || s.name === currentUser?.name)
  );

  const myDueFees = dueFees.filter(df => df.studentId === (activeStudent?.id || currentUser?.id));
  const totalDue = myDueFees.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-[#1a72f2]">Financial Register</p>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
          Your Due Fees <span className="text-slate-700">/</span> Statement
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 glass p-10 rounded-[50px] border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 group-hover:scale-[1.7] transition-transform pointer-events-none text-slate-500">
            <AlertCircle size={140} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tight">Ledger Warning</h4>
            <p className="text-xs font-bold text-slate-500 mt-2 max-w-lg leading-relaxed">
              Please settle outstanding dues promptly. Delays in system clearance can interrupt your student credentials and active classes access.
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-xs font-black uppercase tracking-widest text-[#1a72f2]">
            Contact Administrator: +91 96470 46334
          </div>
        </div>

        <div className={`glass p-12 rounded-[50px] relative overflow-hidden group border-rose-500/20 ${totalDue > 0 ? 'bg-gradient-to-br from-rose-500/10 via-transparent to-transparent' : 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-500/20'}`}>
          <div className="relative z-10 font-black">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              Outstanding Balance
            </p>
            <h2 className="text-4xl text-white tracking-tighter mb-8 leading-none">₹{totalDue.toLocaleString()}</h2>
            {totalDue > 0 ? (
              <div className="flex items-center gap-3 px-5 py-2 bg-rose-500/10 text-rose-400 rounded-2xl w-fit border border-rose-500/20 text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-950/20">
                <AlertCircle size={14} /> Unsettled
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-2 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-950/20">
                Clear
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {myDueFees.length > 0 ? (
          myDueFees.map((fee, index) => (
            <motion.div
              key={fee.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-[40px] border border-white/5 hover:bg-white/[0.02] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
              
              <div className="flex items-start gap-6 relative z-10 pl-4">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center border border-rose-500/20 group-hover:rotate-6 transition-transform shrink-0">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-tight group-hover:text-rose-400 transition-colors">
                    {fee.remarks}
                  </h3>
                  <div className="flex items-center mt-4 text-slate-500 text-xs font-black uppercase tracking-widest gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>
                      Posted {new Date(fee.date).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 flex flex-col items-start md:items-end flex-shrink-0 pl-10 md:pl-0">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Fee Amount</span>
                <div className="text-3xl font-black text-white tracking-tighter">
                  ₹{fee.amount.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Outstanding Dues</h3>
            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest">You have zero outstanding ledger entries. Excellent standing.</p>
          </div>
        )}
      </div>

      {myDueFees.length > 0 && (
        <div className="glass p-8 rounded-[40px] border border-white/5 flex items-start gap-6 bg-gradient-to-br from-[#1a72f2]/5 to-transparent">
          <AlertCircle className="w-8 h-8 text-indigo-400 shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Settlement Guidelines</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Please contact the UTC office directly or use verified UPI payments to clear your outstanding balance. Ensure compliance with scheduled timelines to prevent active service pauses. Always request a digital receipt for transactions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDueFees;
