import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Brain, Plus, Trash2, Clock, FileText, ChevronRight, X } from 'lucide-react';

export default function OnlineTestManagement() {
  const { tests, addTest, deleteTest } = useStorage();
  const [showAdd, setShowAdd] = useState(false);

  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    durationMinutes: 15,
    questions: [
      { id: 'q1', text: '', options: ['', '', '', ''], correctOption: 0 }
    ]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.title) return;
    addTest({...newTest, id: Math.random().toString(36).substr(2, 9)});
    setShowAdd(false);
    setNewTest({ title: '', description: '', durationMinutes: 15, questions: [{ id: 'q1', text: '', options: ['', '', '', ''], correctOption: 0 }] });
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-white/5 p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl shadow-lg border border-indigo-500/20">
             <Brain size={32} />
           </div>
           <div>
             <h3 className="font-black text-2xl text-white tracking-tight">Test Master</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Design and publish online assessments</p>
           </div>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="indigo-button px-10 py-4 text-xs font-black uppercase tracking-widest"
        >
          Create New Test
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[60] flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass rounded-[50px] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tighter uppercase">New Assessment</h2>
              <button onClick={() => setShowAdd(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-all">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Assessment Title</label>
                <input 
                  required
                  type="text" 
                  value={newTest.title}
                  onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                  className="input-glass w-full py-5 rounded-3xl text-xl font-bold"
                  placeholder="e.g. Logic & Algorithms Quiz"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration (Minutes)</label>
                  <input 
                    required
                    type="number" 
                    value={newTest.durationMinutes}
                    onChange={(e) => setNewTest({...newTest, durationMinutes: parseInt(e.target.value)})}
                    className="input-glass w-full py-5 rounded-3xl font-black text-xl"
                  />
                </div>
                <div className="flex items-end pb-2">
                   <p className="text-[10px] font-bold text-slate-500 italic">Students will have limited time to finish.</p>
                </div>
              </div>

              <div className="space-y-8 pt-6 border-t border-white/5">
                <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" /> Question Bank
                </h4>
                {newTest.questions.map((q, idx) => (
                  <div key={idx} className="p-8 bg-white/5 rounded-[32px] border border-white/5 space-y-6 relative group">
                    <span className="absolute -top-3 -left-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-xl">
                      {idx + 1}
                    </span>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question Text</label>
                      <textarea 
                        required
                        value={q.text}
                        onChange={(e) => {
                          const qs = [...newTest.questions];
                          qs[idx].text = e.target.value;
                          setNewTest({...newTest, questions: qs});
                        }}
                        className="input-glass w-full py-4 rounded-2xl min-h-[100px] resize-none"
                        placeholder="Type your question here..."
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Option {oIdx + 1}</label>
                             <input 
                                type="radio" 
                                name={`correct-${idx}`} 
                                checked={q.correctOption === oIdx}
                                onChange={() => {
                                  const qs = [...newTest.questions];
                                  qs[idx].correctOption = oIdx;
                                  setNewTest({...newTest, questions: qs});
                                }}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer"
                             />
                          </div>
                          <input 
                            required
                            type="text" 
                            value={opt}
                            onChange={(e) => {
                              const qs = [...newTest.questions];
                              qs[idx].options[oIdx] = e.target.value;
                              setNewTest({...newTest, questions: qs});
                            }}
                            className="input-glass w-full py-3 rounded-xl text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setNewTest({
                    ...newTest, 
                    questions: [...newTest.questions, { id: `q${Date.now()}`, text: '', options: ['', '', '', ''], correctOption: 0 }]
                  })}
                  className="w-full py-5 border-2 border-dashed border-white/10 rounded-3xl text-sm font-black text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all uppercase tracking-widest"
                >
                  + Append Another Question
                </button>
              </div>

              <button 
                type="submit" 
                className="w-full py-6 indigo-button text-sm font-black uppercase tracking-widest shadow-2xl"
              >
                Publish Assessment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tests.map(t => (
          <div key={t.id} className="glass p-8 rounded-[40px] group hover:bg-white/10 transition-all flex flex-col border border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 bg-indigo-600/10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center font-black border border-indigo-500/20 group-hover:rotate-12 transition-transform">
                <Brain size={24} />
              </div>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this test assessment? All results associated with it will remain but the test itself will be gone.')) {
                    deleteTest(t.id);
                  }
                }}
                className="p-3 text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-xl border border-white/5"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex-1 mb-8 relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-indigo-300 transition-colors">{t.title}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} className="text-indigo-400" /> {t.durationMinutes} Minutes • {t.questions.length} Questions
              </p>
            </div>

            <button className="w-full py-4 glass-button text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-400 flex items-center justify-center gap-2 transition-all">
              Manage Content <ChevronRight size={14} />
            </button>
          </div>
        ))}
        {tests.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
               <Brain size={40} className="text-slate-700" />
             </div>
             <h4 className="text-xl font-bold text-slate-400 mb-2">No Assessments Created</h4>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Click become master to publish your first test</p>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
