import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student, ResultLink } from '../../../types';
import { formatIST } from '../../../lib/dateUtils';
import { 
  Calendar, FileText, Download, ExternalLink, Search, 
  GraduationCap, CheckCircle2, Award, BookOpen, Filter, Lock, ShieldCheck, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentResultsProps {
  student?: Student;
}

const StudentResults: React.FC<StudentResultsProps> = ({ student: propStudent }) => {
  const { resultLinks, testResults, tests, currentUser, students } = useStorage();

  // Resolve student from prop or currentUser securely
  const currentStudent = useMemo(() => {
    if (propStudent) return propStudent;
    if (currentUser?.role === 'student') {
      const found = students.find(s => s.id === currentUser.id || s.mobile === currentUser.username);
      if (found) return found;
    }
    return null;
  }, [propStudent, currentUser, students]);

  const studentClass = useMemo(() => {
    return currentStudent?.class ? String(currentStudent.class).replace('Class-', '').trim() : '';
  }, [currentStudent]);

  const studentSemester = useMemo(() => {
    return String(currentStudent?.semester || 'Semester-I').trim();
  }, [currentStudent]);

  // View mode: 'official-results' or 'online-tests'
  const [activeView, setActiveView] = useState<'official-results' | 'online-tests'>('official-results');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  // STRICT ACCESS CONTROL:
  // Logged-in student can ONLY see published results belonging to their own enrolled semester!
  // Results from any other semester are strictly excluded.
  const studentAccessibleResults = useMemo(() => {
    return resultLinks.filter(r => {
      // Semester restriction:
      // Result must match student's exact semester or be marked 'All'
      const rSem = (r.semester || '').trim();
      const isSemMatch = !rSem || rSem === 'All' || rSem === 'all' || rSem.toLowerCase() === studentSemester.toLowerCase();
      if (!isSemMatch) return false;

      // Class restriction: if result has a class specified, it must match student's class
      if (r.class && r.class !== 'All' && r.class !== 'all' && studentClass) {
        const rClassClean = String(r.class).replace('Class-', '').trim();
        if (rClassClean !== studentClass) return false;
      }

      return true;
    });
  }, [resultLinks, studentSemester, studentClass]);

  // Apply search & subject filter
  const filteredResults = useMemo(() => {
    return studentAccessibleResults.filter(r => {
      const titleStr = String(r.title || '').toLowerCase();
      const descStr = String(r.description || '').toLowerCase();
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || titleStr.includes(search) || descStr.includes(search);
      const matchesSubject = filterSubject === 'all' || r.subject === filterSubject;

      return matchesSearch && matchesSubject;
    });
  }, [studentAccessibleResults, searchTerm, filterSubject]);

  // Available subjects for the student's semester results
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    studentAccessibleResults.forEach(r => {
      if (r.subject) subs.add(r.subject);
    });
    return Array.from(subs);
  }, [studentAccessibleResults]);

  // Online test assessment records taken by this student
  const studentOnlineTestRecords = useMemo(() => {
    if (!currentStudent) return [];
    return testResults
      .filter(tr => tr.studentId === currentStudent.id)
      .map(tr => {
        const testObj = tests.find(t => t.id === tr.testId);
        return {
          ...tr,
          testTitle: testObj?.title || 'Academic Assessment',
          testDescription: testObj?.description || ''
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [testResults, currentStudent, tests]);

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
      {/* Top Banner & Enrolled Semester Security Badge */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/[0.02] p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Award size={18} />
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
            Exam Results • <span className="text-emerald-400">{studentSemester}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed">
            Access verified score sheets, marksheets, and official publication documents exclusively for your enrolled semester <span className="text-white font-bold">({studentSemester})</span>
            {studentClass ? <span> and <span className="text-white font-bold">Class-{studentClass}</span></span> : ''}.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-5 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Your Enrolled Semester</p>
              <p className="text-sm font-black text-white uppercase">{studentSemester}</p>
            </div>
          </div>

          {studentClass && (
            <div className="px-5 py-3.5 bg-white/5 border border-white/5 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Enrolled Class</p>
              <p className="text-sm font-black text-emerald-300">Class-{studentClass}</p>
            </div>
          )}

          <div className="px-5 py-3.5 bg-white/5 border border-white/5 rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Semester Reports</p>
            <p className="text-sm font-black text-white">{filteredResults.length} Published</p>
          </div>
        </div>
      </div>

      {/* View Switcher: Semester Exam Results vs Online Portal Assessments */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-white/5 backdrop-blur-md w-fit flex-wrap">
        <button
          onClick={() => setActiveView('official-results')}
          className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
            activeView === 'official-results'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={14} />
          <span>{studentSemester} Results ({studentAccessibleResults.length})</span>
        </button>

        {studentOnlineTestRecords.length > 0 && (
          <button
            onClick={() => setActiveView('online-tests')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'online-tests'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award size={14} />
            <span>My Portal Assessments ({studentOnlineTestRecords.length})</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeView === 'online-tests' ? (
        // ONLINE TEST ASSESSMENT SCORES
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-600/20 to-indigo-600/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border bg-purple-500/10 text-purple-300 border-purple-500/20">
                Online Portal Assessments
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">Interactive Exam Submissions &amp; Ranks</h2>
              <p className="text-xs text-slate-400">Scores and ratings from quizzes and tests completed on UTC Portal.</p>
            </div>
            <button
              onClick={() => setActiveView('official-results')}
              className="glass-button px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white shrink-0 cursor-pointer"
            >
              Back to {studentSemester} Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studentOnlineTestRecords.map((record, idx) => {
              const scorePct = record.totalQuestions > 0 ? Math.round((record.score / record.totalQuestions) * 100) : 0;
              const isPass = scorePct >= 50;
              return (
                <div key={record.id || `tr-${idx}`} className="glass p-7 rounded-[36px] border border-white/5 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white">{record.testTitle}</h3>
                      {record.testDescription && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{record.testDescription}</p>
                      )}
                      <p className="text-[11px] text-slate-500 font-bold mt-2">
                        Submitted: {formatIST(record.date, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl text-center border shrink-0 ${
                      isPass ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      <p className="text-xl font-black">{record.score} / {record.totalQuestions}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-0.5">{scorePct}% {isPass ? 'PASS' : 'RETRY'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // OFFICIAL SEMESTER RESULTS
        <div className="space-y-6">
          {/* Search and Subject Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-5 rounded-3xl border border-white/5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder={`Search within ${studentSemester} results...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-11 pr-4 py-3 rounded-xl text-xs font-bold text-white placeholder:text-slate-500"
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

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select 
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="input-glass w-full pl-11 pr-4 py-3 rounded-xl text-xs font-bold cursor-pointer text-slate-300 bg-slate-900/90"
              >
                <option value="all" className="bg-slate-900">All Subjects</option>
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900">
                    {sub}
                  </option>
                ))}
                {!availableSubjects.includes('Computer Applications') && (
                  <option value="Computer Applications" className="bg-slate-900">Computer Applications</option>
                )}
                {!availableSubjects.includes('Computer Science') && (
                  <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                )}
              </select>
            </div>
          </div>

          {/* Results List */}
          {filteredResults.length > 0 ? (
            <div className="grid gap-6">
              {filteredResults.map((res, idx) => (
                <ResultCard 
                  key={res.id || `res-${idx}`} 
                  result={res} 
                  studentSemesterBadgeStyle={getSemesterBadgeStyle(studentSemester)}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center glass rounded-[40px] border border-dashed border-white/5 p-8">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400 mb-5">
                <FileText size={36} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                No Results Published Yet for {studentSemester}
              </h3>
              <p className="text-slate-400 font-medium text-xs max-w-md mx-auto leading-relaxed">
                {searchTerm || filterSubject !== 'all'
                  ? 'No results match your specific search or filter criteria in this semester.'
                  : `Official result publications and marksheets for ${studentSemester} will be posted here once published by faculty.`}
              </p>

              {(searchTerm || filterSubject !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSubject('all');
                  }}
                  className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Result Card
const ResultCard: React.FC<{ 
  result: ResultLink;
  studentSemesterBadgeStyle: string;
}> = ({ result, studentSemesterBadgeStyle }) => {
  return (
    <div className="glass p-7 sm:p-8 rounded-[36px] border border-white/5 hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
      <div className="flex items-start gap-5 relative z-10">
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
          <FileText className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${studentSemesterBadgeStyle}`}>
              {result.semester || 'Semester-I'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Class: {result.class ? result.class.replace('Class-', '') : 'All'}
            </span>
            {result.subject && (
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-bold">
                {result.subject}
              </span>
            )}
            {result.session && result.session !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[9px] font-mono">
                Session: {result.session}
              </span>
            )}
          </div>

          <h3 className="text-xl font-black text-white tracking-tight uppercase leading-snug group-hover:text-emerald-400 transition-colors">
            {result.title}
          </h3>

          {result.description && (
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">{result.description}</p>
          )}

          <div className="flex items-center text-slate-500 text-[11px] font-bold gap-2 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>Published {formatIST(result.date, 'dd MMM yyyy')}</span>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 flex-shrink-0">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-8 py-4 bg-[#10b981] hover:bg-[#34d399] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/30 active:scale-95 group-hover:scale-102 cursor-pointer gap-2"
        >
          <span>View / Download</span>
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default StudentResults;
