import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student, StudyMaterial } from '../../../types';
import { 
  BookOpen, FileText, Video, ExternalLink, Box, Search, 
  Filter, Lock, GraduationCap, Calendar, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface StudentMaterialsProps {
  student?: Student;
}

export default function StudentMaterials({ student: propStudent }: StudentMaterialsProps) {
  const { materials, currentUser, students } = useStorage();

  // Resolve logged-in student securely
  const currentStudent = useMemo(() => {
    if (propStudent) return propStudent;
    if (currentUser?.role === 'student') {
      const found = students.find(s => s.id === currentUser.id || s.mobile === currentUser.username);
      if (found) return found;
    }
    return null;
  }, [propStudent, currentUser, students]);

  // Clean class & enrolled semester
  const studentClass = useMemo(() => {
    return currentStudent?.class ? String(currentStudent.class).replace('Class-', '').trim() : '';
  }, [currentStudent]);

  const studentSemester = useMemo(() => {
    return String(currentStudent?.semester || 'Semester-I').trim();
  }, [currentStudent]);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // STRICT ACCESS CONTROL:
  // Logged-in student can ONLY see materials belonging to their own enrolled semester!
  // Other semesters' materials are completely excluded.
  const studentAccessibleMaterials = useMemo(() => {
    return materials.filter(m => {
      // Semester restriction:
      // Material must match student's exact semester or be marked 'All'
      const mSem = (m.semester || '').trim();
      const isSemMatch = !mSem || mSem === 'All' || mSem === 'all' || mSem.toLowerCase() === studentSemester.toLowerCase();
      if (!isSemMatch) return false;

      // Class restriction: if material has a class specified, it must match student's class
      if (m.class && m.class !== 'All' && m.class !== 'all' && studentClass) {
        const mClassClean = String(m.class).replace('Class-', '').trim();
        if (mClassClean !== studentClass) return false;
      }

      return true;
    });
  }, [materials, studentSemester, studentClass]);

  // Apply search, subject, and type filters
  const filteredMaterials = useMemo(() => {
    return studentAccessibleMaterials.filter(m => {
      const titleStr = String(m.title || '').toLowerCase();
      const descStr = String(m.description || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || titleStr.includes(search) || descStr.includes(search);
      const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
      const matchesType = filterType === 'all' || m.type === filterType;

      return matchesSearch && matchesSubject && matchesType;
    });
  }, [studentAccessibleMaterials, searchTerm, filterSubject, filterType]);

  // Available subjects for the student's semester materials
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    studentAccessibleMaterials.forEach(m => {
      if (m.subject) subs.add(m.subject);
    });
    return Array.from(subs);
  }, [studentAccessibleMaterials]);

  // Semester info helper for styling
  const getSemesterBadgeStyle = (sem: string) => {
    switch (sem) {
      case 'Semester-I':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Semester-II':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Semester-III':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Semester-IV':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header & Enrolled Semester Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.02] p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <BookOpen size={18} />
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Enrolled Semester Access</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <Lock size={12} />
              <span>Other Semesters Restricted</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">
            Study Materials • <span className="text-indigo-400">{studentSemester}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            Displaying verified learning resources, lecture slides, notes, and video masterclasses exclusively for your enrolled semester <span className="text-white font-bold">({studentSemester})</span>
            {studentClass ? <span> and <span className="text-white font-bold">Class-{studentClass}</span></span> : ''}.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-5 py-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Your Enrolled Semester</p>
              <p className="text-sm font-black text-white uppercase">{studentSemester}</p>
            </div>
          </div>

          {studentClass && (
            <div className="px-5 py-3.5 bg-white/5 border border-white/5 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enrolled Class</p>
              <p className="text-sm font-black text-indigo-300">Class-{studentClass}</p>
            </div>
          )}

          <div className="px-5 py-3.5 bg-white/5 border border-white/5 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Semester Materials</p>
            <p className="text-sm font-black text-white">{filteredMaterials.length} Available</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 glass rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search within your semester materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Resource Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-2xl border border-white/5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('pdf')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'pdf'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText size={12} />
              PDFs
            </button>
            <button
              onClick={() => setFilterType('note')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'note'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={12} />
              Notes
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                filterType === 'video'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video size={12} />
              Videos
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          {availableSubjects.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Materials List / Grid for the Student's Semester */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m, idx) => (
            <MaterialCard 
              key={m.id || `mat-${idx}`} 
              material={m} 
              studentSemesterBadgeStyle={getSemesterBadgeStyle(studentSemester)}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center glass rounded-[40px] border border-dashed border-white/5 p-8">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center text-indigo-400 mb-5">
            <Box size={36} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            No Materials Available for {studentSemester}
          </h3>
          <p className="text-slate-400 font-medium text-xs max-w-md mx-auto leading-relaxed">
            {searchTerm || filterSubject !== 'all' || filterType !== 'all'
              ? 'No study materials match your specific search or filter criteria in this semester.'
              : `Your instructors have not published study resources for ${studentSemester} yet. Please check back regularly.`}
          </p>

          {(searchTerm || filterSubject !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSubject('all');
                setFilterType('all');
              }}
              className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent: Individual Material Card
const MaterialCard: React.FC<{ 
  material: StudyMaterial; 
  studentSemesterBadgeStyle: string;
}> = ({ material, studentSemesterBadgeStyle }) => {
  return (
    <div className="glass p-7 rounded-[36px] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.03] transition-all group flex flex-col justify-between relative overflow-hidden shadow-xl">
      <div className="space-y-6 relative z-10">
        <div className="flex justify-between items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${
            material.type === 'pdf' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
            material.type === 'video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {material.type === 'pdf' ? <FileText size={26}/> : material.type === 'video' ? <Video size={26}/> : <BookOpen size={26}/>}
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Class: {material.class ? material.class.replace('Class-', '') : 'All'}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-lg ${studentSemesterBadgeStyle}`}>
                {material.semester || 'Semester-I'}
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
              {material.subject || 'Computer Applications'}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-white tracking-tight leading-snug group-hover:text-indigo-400 transition-colors mb-2 line-clamp-2">
            {material.title}
          </h3>
          {material.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {material.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="uppercase tracking-widest">
              {material.type === 'pdf' ? 'PDF Document' : material.type === 'video' ? 'Video Lesson' : 'Revision Note'}
            </span>
            <span>•</span>
            <span className="text-slate-400">
              {safeFormat(material.uploadDate, 'dd MMM yyyy')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-white/5 relative z-10">
        <a 
          href={material.url} 
          target="_blank" 
          rel="noreferrer"
          className="w-full py-3.5 glass-button border-white/10 bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all group/btn shadow-md cursor-pointer"
        >
          <span>Open Material</span>
          <ExternalLink size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
};
