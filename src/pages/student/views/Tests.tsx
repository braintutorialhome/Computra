import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { Brain, Clock, HelpCircle, Trophy, CheckCircle2, ArrowRight, Timer, FileWarning, X } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentTests({ student }: { student: Student }) {
  const { tests, testResults, submitTestResult } = useStorage();
  const [activeTest, setActiveTest] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const results = testResults.filter(r => r.studentId === student.id);

  const handleStart = (test: any) => {
    setActiveTest(test);
    setAnswers({});
    setFinished(false);
  };

  const handleFinish = () => {
    if (!activeTest) return;
    
    let score = 0;
    activeTest.questions.forEach((q: any) => {
      // Find question index by id for answer check
      const qIdx = activeTest.questions.findIndex((quest: any) => quest.id === q.id);
      if (answers[q.id] === q.correctOption) score++;
    });

    submitTestResult({
      testId: activeTest.id,
      studentId: student.id,
      score,
      totalQuestions: activeTest.questions.length,
      date: new Date().toISOString()
    });

    setFinished(true);
  };

  if (activeTest && !finished) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
        <div className="glass p-12 rounded-[50px] flex flex-col md:flex-row justify-between items-center gap-8 border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12">
             <Brain size={150} />
          </div>
          <div className="relative z-10 text-center md:text-left">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Live Assessment in Progress</p>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{activeTest.title}</h2>
            <p className="text-slate-500 text-sm font-bold mt-2 uppercase tracking-widest">{activeTest.questions.length} Modules • Restricted Core</p>
          </div>
          <div className="relative z-10 flex items-center gap-4 px-8 py-5 bg-slate-950/50 rounded-[30px] border border-white/5 shadow-2xl">
            <Timer className="text-indigo-400 animate-pulse" size={32} /> 
            <div className="flex flex-col">
               <span className="text-2xl font-black text-white tracking-widest leading-none font-mono">{activeTest.durationMinutes}:00</span>
               <span className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Remaining Time</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {activeTest.questions.map((q: any, idx: number) => (
            <div key={q.id} className="glass p-12 rounded-[50px] border-white/5 space-y-10 relative group transition-all hover:bg-white/[0.02]">
               <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-xl shadow-indigo-900/40 rotate-3">
                 {idx + 1}
               </div>
               <p className="text-2xl font-black text-white leading-tight tracking-tight">{q.text}</p>
               <div className="grid gap-4">
                 {q.options.map((opt: string, optIdx: number) => (
                    <button 
                      key={optIdx}
                      onClick={() => setAnswers({...answers, [q.id]: optIdx})}
                      className={`p-6 text-left rounded-3xl border transition-all relative overflow-hidden group/opt ${
                        answers[q.id] === optIdx 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-[1.02]' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${
                           answers[q.id] === optIdx ? 'bg-white/20' : 'bg-white/5'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="font-bold text-lg">{opt}</span>
                      </div>
                      {answers[q.id] === optIdx && (
                        <motion.div layoutId="opt-glow" className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent pointer-events-none" />
                      )}
                    </button>
                 ))}
               </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center p-8 glass rounded-[40px] border-white/5 bg-white/[0.02]">
           <button 
            onClick={handleFinish}
            className="px-20 py-6 indigo-button text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-900/40 hover:scale-105 active:scale-95 transition-all"
          >
            Terminal Submission
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in zoom-in duration-1000 space-y-10">
        <div className="w-40 h-40 bg-emerald-500/10 text-emerald-400 rounded-[50px] flex items-center justify-center relative shadow-2xl border border-emerald-500/20 animate-bounce">
           <Trophy size={80} />
           <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500 rounded-full animate-ping"></div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Assessment Cycle <br/> <span className="text-indigo-500">Terminated</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Response packets synchronized with central hub</p>
        </div>
        <button 
          onClick={() => setActiveTest(null)}
          className="px-12 py-5 glass-button text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-emerald-600 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      <div className="space-y-2">
         <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Online Test</p>
         <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Online Test <span className="text-slate-700">/</span> {student.rollNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Available Tests */}
        <div className="space-y-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                <Brain size={24} />
             </div>
             <h3 className="font-black text-xl text-white tracking-tight uppercase">Active Test</h3>
          </div>
          
          <div className="grid gap-6">
            {tests.map(t => {
              const taken = results.some(r => r.testId === t.id);
               return (
                 <div key={t.id} className="glass p-10 rounded-[40px] border border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between group hover:bg-white/10 transition-all hover:translate-x-2">
                    <div>
                      <h4 className="font-black text-2xl text-white tracking-tight group-hover:text-indigo-300 transition-colors">{t.title}</h4>
                      <div className="flex gap-4 text-xs font-black uppercase tracking-widest text-slate-500 mt-2">
                        <span className="flex items-center gap-1.5"><HelpCircle size={10} className="text-indigo-400"/> {t.questions.length} Units</span>
                        <span className="text-slate-800">|</span>
                        <span className="flex items-center gap-1.5"><Clock size={10} className="text-purple-400"/> {t.durationMinutes} Cycles</span>
                      </div>
                    </div>
                    {taken ? (
                      <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2 shadow-xl shadow-emerald-950/20">
                         <CheckCircle2 size={16} /> Locked
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleStart(t)}
                        className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center transform transition-all group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-95 shadow-xl"
                      >
                        <ArrowRight size={28} />
                      </button>
                    )}
                 </div>
               );
            })}
            {tests.length === 0 && (
              <div className="py-20 text-center glass rounded-[40px] border-2 border-dashed border-white/5">
                 <FileWarning size={40} className="mx-auto mb-6 text-slate-800" />
                 <p className="text-xs font-black text-slate-700 uppercase tracking-widest leading-relaxed">No tactical assessments <br/> deployed to your zone yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Previous Results */}
        <div className="space-y-10">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                <Trophy size={24} />
             </div>
             <h3 className="font-black text-xl text-white tracking-tight uppercase">Academic Performance</h3>
          </div>

          <div className="glass rounded-[50px] border border-white/5 overflow-hidden shadow-2xl divide-y divide-white/5">
             {results.map(r => {
               const test = tests.find(t => t.id === r.testId);
               const percent = Math.round((r.score / r.totalQuestions) * 100);
               return (
                 <div key={r.id} className="p-10 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-xl font-black text-white tracking-tighter uppercase leading-tight">{test?.title || 'System Archive'}</p>
                      <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">{safeFormat(r.date, 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={`text-4xl font-black tracking-tighter ${percent >= 40 ? 'text-emerald-400' : 'text-rose-400'}`}>{percent}%</span>
                        <span className="text-xs font-black text-slate-700">INDEX</span>
                      </div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 italic">UNITS: {r.score}/{r.totalQuestions}</p>
                    </div>
                 </div>
               );
             })}
              {results.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-700 text-xs font-black uppercase tracking-widest italic">No historical data found</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
