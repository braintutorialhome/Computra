import React from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Calendar, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';

const StudentResults: React.FC = () => {
  const { resultLinks } = useStorage();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Academic Portal</p>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
          Exam Results <span className="text-slate-700">/</span> Reports
        </h1>
      </div>

      <div className="grid gap-6">
        {resultLinks.length > 0 ? (
          resultLinks.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-[40px] border border-white/5 hover:bg-white/[0.02] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 group-hover:scale-[1.7] transition-transform pointer-events-none text-slate-500">
                <FileText size={120} />
              </div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center border border-emerald-500/20 group-hover:rotate-6 transition-transform shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-tight group-hover:text-indigo-400 transition-colors">{result.title}</h3>
                  {result.description && (
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-2xl">{result.description}</p>
                  )}
                  <div className="flex items-center mt-4 text-slate-500 text-xs font-black uppercase tracking-widest gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>Published {new Date(result.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 flex-shrink-0">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-8 py-5 bg-[#10b981] hover:bg-[#34d399] text-white font-black text-xs uppercase tracking-widest rounded-3xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-95 group-hover:scale-105"
                >
                  View / Download
                  <Download className="w-4 h-4 ml-2" />
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No Results Found</h3>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Wait for the administration to publish result links.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResults;
