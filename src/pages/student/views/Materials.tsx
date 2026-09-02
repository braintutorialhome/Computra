import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student } from '../../../types';
import { BookOpen, FileText, Video, ExternalLink, Box, Search, Filter } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';

export default function StudentMaterials({ student }: { student: Student }) {
  const { materials } = useStorage();
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');

  // Clean class name to be robust (e.g. "Class-XI" vs "XI")
  const sClassClean = String(student.class || 'XI').replace('Class-', '').trim();

  // First, restrict access strictly based on student's class
  const classAllowedMaterials = materials.filter(m => {
    const mClassClean = String(m.class || 'XI').replace('Class-', '').trim();
    return mClassClean === sClassClean;
  });

  // Apply search, subject, and semester filters
  const filteredMaterials = classAllowedMaterials.filter(m => {
    const matchesSearch = String(m.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
    const matchesSemester = filterSemester === 'all' || m.semester === filterSemester;
    return matchesSearch && matchesSubject && matchesSemester;
  });

  // Determine selectable semesters based on student's class
  const availableSemesters = sClassClean === 'XII' 
    ? ['Semester-III', 'Semester-IV'] 
    : ['Semester-I', 'Semester-II'];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Academic Vault</p>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Study Materials <span className="text-slate-700">/</span> Class-{sClassClean}</h1>
         </div>
         <div className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs rounded-2xl uppercase tracking-widest">
            Logged in: Class-{sClassClean} ({student.semester || 'Academic Stream'})
         </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search study assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm cursor-pointer text-slate-300"
          >
            <option value="all" className="bg-slate-900">All Subjects</option>
            <option value="Computer Applications" className="bg-slate-900">Computer Applications</option>
            <option value="Computer Science" className="bg-slate-900">Computer Science</option>
            <option value="Others" className="bg-slate-900">Others</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm cursor-pointer text-slate-300"
          >
            <option value="all" className="bg-slate-900">All Semesters</option>
            {availableSemesters.map(sem => (
              <option key={`mat-sem-${sem}`} value={sem} className="bg-slate-900">{sem}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredMaterials.map((m, idx) => (
          <div key={m.id ? `student-mat-${m.id}` : `mat-idx-${idx}`} className="glass p-10 rounded-[50px] border border-white/5 hover:bg-white/[0.03] transition-all group flex flex-col justify-between relative overflow-hidden">
             {/* Hover glow effect */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 opacity-0 group-hover:opacity-[0.03] rounded-full blur-3xl transition-opacity"></div>
             
             <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 ${
                    m.type === 'pdf' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    m.type === 'video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {m.type === 'pdf' ? <FileText size={32}/> : m.type === 'video' ? <Video size={32}/> : <BookOpen size={32}/>}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 border border-white/5 px-2 py-1 rounded">
                      {m.subject || 'Computer Applications'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/10 px-2 py-1 rounded">
                      {m.semester || 'Semester-I'}
                    </span>
                  </div>
                </div>

                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors mb-3">{m.title}</h3>
                   <div className="flex items-center gap-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${
                            m.type === 'pdf' ? 'bg-rose-500' : m.type === 'video' ? 'bg-blue-500' : 'bg-emerald-500'
                         }`}></div> {m.type} Archive
                      </span>
                      <span className="text-slate-800 text-xs">/</span>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                        Released {safeFormat(m.uploadDate, 'dd MMM yyyy')}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="mt-12 relative z-10">
                <a 
                  href={m.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-5 glass-button border-white/5 bg-white/5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-all group/btn"
                >
                  Open File <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </a>
             </div>
          </div>
        ))}

        {classAllowedMaterials.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
            <Box size={50} className="mx-auto mb-8 text-slate-800" />
            <p className="text-slate-600 font-bold uppercase tracking-widest text-[11px]">No encrypted study streams available for Class-{sClassClean}</p>
          </div>
        )}

        {classAllowedMaterials.length > 0 && filteredMaterials.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5 animate-in fade-in duration-300">
            <Search size={50} className="mx-auto mb-8 text-slate-800" />
            <p className="text-slate-600 font-bold uppercase tracking-widest text-[11px]">No materials found matching search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
