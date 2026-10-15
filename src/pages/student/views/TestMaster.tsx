import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Student, ExternalTest } from '../../../types';
import { formatIST } from '../../../lib/dateUtils';
import { 
  ExternalLink, Calendar, ClipboardList, Lock, GraduationCap, 
  Search, BookOpen, Layers, CheckCircle2, ShieldCheck, Filter, X 
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentTestMasterProps {
  student?: Student;
}

const StudentTestMaster: React.FC<StudentTestMasterProps> = ({ student: propStudent }) => {
  const { externalTests, currentUser, students } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Identify current logged-in student securely
  const currentStudent = useMemo(() => {
    if (propStudent) return propStudent;
    if (currentUser?.studentProfile) return currentUser.studentProfile;
    if (currentUser?.email) {
      const found = students.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
      if (found) return found;
    }
    if (currentUser?.username) {
      const found = students.find(s => s.rollNumber?.toLowerCase() === currentUser.username?.toLowerCase());
      if (found) return found;
    }
    return undefined;
  }, [propStudent, currentUser, students]);

  // Normalize student's enrolled semester and class
  const studentSemester = (currentStudent?.semester || 'Semester-I').trim();
  const studentClassRaw = (currentStudent?.class || 'Class-XI').trim();
  const studentClassClean = studentClassRaw.replace('Class-', '').trim();

  // Strict filtering: Students can ONLY see exams matching their enrolled semester and class
  const mySemesterTests = useMemo(() => {
    return externalTests.filter(test => {
      // Semester match: test semester must match student's enrolled semester, or be marked 'All'
      const testSem = (test.semester || '').trim();
      const isSemMatch = !testSem || testSem === 'All' || testSem.toLowerCase() === 'all' || 
                         testSem.toLowerCase() === studentSemester.toLowerCase();
      if (!isSemMatch) return false;

      // Class match: test class must match student's enrolled class, or be marked 'All'
      if (test.class && test.class !== 'All' && test.class.toLowerCase() !== 'all') {
        const testClassClean = String(test.class).replace('Class-', '').trim();
        if (testClassClean.toLowerCase() !== studentClassClean.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [externalTests, studentSemester, studentClassClean]);

  // Subject and search filters
  const filteredTests = useMemo(() => {
    return mySemesterTests.filter(test => {
      const title = String(test.title || '').toLowerCase();
      const desc = String(test.description || '').toLowerCase();
      const subj = String(test.subject || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = !search || title.includes(search) || desc.includes(search) || subj.includes(search);
      const matchesSubj = selectedSubject === 'All' || !test.subject || 
                          test.subject.toLowerCase() === selectedSubject.toLowerCase() ||
                          test.subject === 'All Subjects';

      return matchesSearch && matchesSubj;
    });
  }, [mySemesterTests, searchTerm, selectedSubject]);

  // Unique subjects available for this student's semester exams
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    mySemesterTests.forEach(t => {
      if (t.subject && t.subject !== 'All Subjects') {
        subs.add(t.subject);
      }
    });
    return ['All', ...Array.from(subs)];
  }, [mySemesterTests]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Locked Semester Banner - Strict Access Indicator */}
      <div className="relative overflow-hidden glass rounded-[36px] border border-purple-500/20 p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-950/80 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 pointer-events-none text-purple-400">
          <ClipboardList size={160} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Lock size={12} className="text-purple-400" />
              Locked to Enrolled Semester: {studentSemester}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Online Exam Portal <span className="text-purple-400">/</span> {studentSemester}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              External test portals, weekly quizes, and mock assessments strictly assigned to your current semester (<span className="text-white font-bold">{studentSemester}</span>) and class (<span className="text-white font-bold">{studentClassRaw}</span>).
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              {currentStudent?.name && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="font-bold text-white">{currentStudent.name}</span>
                  {currentStudent.rollNumber && <span className="text-purple-400">({currentStudent.rollNumber})</span>}
                </div>
              )}
              {currentStudent?.stream && (
                <div className="text-slate-400">
                  Stream: <span className="text-slate-200 font-medium">{currentStudent.stream}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-center">
              <div className="text-2xl font-black text-white">{mySemesterTests.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Semester Exams
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
              <ShieldCheck size={12} /> Semester-Protected
            </div>
          </div>
        </div>
      </div>

      {/* Search and Subject Filters */}
      <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${studentSemester} exams...`}
              className="input-glass w-full py-3 pl-11 pr-4 rounded-2xl border-white/5 focus:border-purple-500/50 text-xs font-medium text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          {availableSubjects.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={11} /> Subject:
              </span>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 bg-white/[0.02]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Feedback */}
        {(searchTerm || selectedSubject !== 'All') && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>
              Found <strong className="text-white">{filteredTests.length}</strong> matching exam(s) in {studentSemester}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('All');
              }}
              className="text-purple-400 hover:text-purple-300 text-[11px] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Tests List */}
      <div className="grid gap-5">
        {filteredTests.length > 0 ? (
          filteredTests.map((test, index) => {
            const testClass = test.class || 'All';
            const testSem = test.semester || studentSemester;
            const testSub = test.subject || 'Computer Applications';

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-6 sm:p-8 rounded-[36px] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.02] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 group-hover:scale-[1.7] transition-transform pointer-events-none text-purple-400">
                  <ClipboardList size={120} />
                </div>

                <div className="flex items-start gap-5 relative z-10 min-w-0">
                  <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:rotate-6 transition-transform shrink-0 shadow-lg shadow-purple-500/10">
                    <ClipboardList className="w-7 h-7" />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        {testSub}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        {testSem}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-500/15 text-slate-300 border border-slate-500/25">
                        {testClass === 'All' ? 'All Classes' : `Class-${testClass.replace('Class-', '')}`}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tight uppercase leading-tight group-hover:text-purple-300 transition-colors">
                      {test.title}
                    </h3>

                    {test.description && (
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                        {test.description}
                      </p>
                    )}

                    <div className="flex items-center text-slate-400 text-xs font-bold gap-2 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Posted on {formatIST(test.date, 'dd MMMM yyyy')}</span>
                      {test.session && (
                        <span className="text-slate-500">• Session {test.session}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 flex-shrink-0 flex items-center md:self-center">
                  <a
                    href={test.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto px-7 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all"
                  >
                    <span>Start Test</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-24 text-center glass rounded-[40px] border-2 border-dashed border-white/5 space-y-4">
            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
              <ClipboardList size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                No Exams Available for {studentSemester}
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                {searchTerm || selectedSubject !== 'All' 
                  ? 'No examinations matched your filter criteria. Try clearing search or subject filter.'
                  : `There are currently no active exam links published for your enrolled semester (${studentSemester}, ${studentClassRaw}). New test links will appear here once posted by faculty.`
                }
              </p>
            </div>
            {(searchTerm || selectedSubject !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubject('All');
                }}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-purple-500 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTestMaster;
