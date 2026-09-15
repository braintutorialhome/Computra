import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart2, User, CreditCard, BookMarked, Bell, LogOut, Menu, X, 
  ArrowRight, Phone, MessageSquare, Compass, AlertCircle, ExternalLink, 
  FileCheck, Eye, MessageSquareQuote, CalendarCheck, ShieldCheck, Clock,
  ChevronRight, Sparkles, ChevronDown, CheckCircle2
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { motion, AnimatePresence } from 'motion/react';
import StudentHome from './views/Home';
import MyOverview from './views/MyOverview';
import StudentAttendance from './views/Attendance';
import StudentProfile from './views/Profile';
import StudentRemarksView from './views/Remarks';
import StudentFees from './views/Fees';
import StudentTestMaster from './views/TestMaster';
import StudentResults from './views/Results';
import StudentMaterials from './views/Materials';
import StudentNotices from './views/Notices';
import StudentDueFees from '../../components/student/StudentDueFees';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  badge?: string | number | null;
  badgeColor?: 'indigo' | 'rose' | 'emerald' | 'amber' | 'purple';
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ to, icon: Icon, label, badge, badgeColor = 'indigo', active, onClick }: NavItemProps) => {
  const badgeClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    rose: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black animate-pulse',
    emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  };

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all font-bold text-xs tracking-tight relative group ${
        active 
          ? 'text-white' 
          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="student-nav-active"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/30"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-white/20 text-white' : 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'}`}>
          <Icon size={16} />
        </div>
        <span className="truncate">{label}</span>
      </div>

      {badge !== undefined && badge !== null && (
        <span className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0 ${badgeClasses[badgeColor]}`}>
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { 
    students, logout, currentUser, dueFees, notices, 
    materials, externalTests, testResults, remarks 
  } = useStorage();
  
  const currentStudent = students.find(s => 
    s.status === 'approved' && 
    (s.rollNumber === currentUser?.username || s.id === currentUser?.id || s.name === currentUser?.name)
  );

  useEffect(() => {
    if (!currentUser && !currentStudent) {
      navigate('/login');
    }
  }, [currentUser, currentStudent, navigate]);

  // Live IST Clock for Header
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live badges
  const myDueFees = useMemo(() => {
    if (!currentStudent) return [];
    return dueFees.filter(df => df.studentId === currentStudent.id);
  }, [dueFees, currentStudent]);

  const totalDueAmount = useMemo(() => {
    return myDueFees.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [myDueFees]);

  const myResultsCount = useMemo(() => {
    if (!currentStudent) return 0;
    return testResults.filter(r => r.studentId === currentStudent.id).length;
  }, [testResults, currentStudent]);

  const sClassClean = String(currentStudent?.class || '').replace('Class-', '').trim();
  const myMaterialsCount = useMemo(() => {
    return materials.filter(m => {
      if (!m.class) return true;
      const mClassClean = String(m.class).replace('Class-', '').trim();
      return !sClassClean || mClassClean === sClassClean;
    }).length;
  }, [materials, sClassClean]);

  const myRemarksCount = useMemo(() => {
    if (!currentStudent) return 0;
    return remarks.filter(r => r.studentId === currentStudent.id).length;
  }, [remarks, currentStudent]);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#060c18] text-slate-300 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-[40px] flex items-center justify-center mb-8 relative group">
          <Compass className="text-indigo-500 group-hover:rotate-180 transition-transform duration-1000" size={40} />
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Admissions Pending</h1>
        <p className="max-w-md text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed mb-10">
          Your node is currently in a "Pre-Approval" state. Please wait for an administrator to authorize your registry.
        </p>
        <button 
          onClick={handleLogout}
          className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] text-white hover:bg-white/10 transition-all flex items-center gap-3"
        >
          <LogOut size={16} /> Close Connection
        </button>
      </div>
    );
  }

  // Organized Subcategories for navigation
  const navGroups = [
    {
      title: 'Core & Overview',
      items: [
        { to: '/student/dashboard', icon: BarChart2, label: 'Dashboard' },
        { to: '/student/overview', icon: Eye, label: 'My Overview' },
        { to: '/student/profile', icon: User, label: 'My Profile' },
      ]
    },
    {
      title: 'Academics & Tests',
      items: [
        { 
          to: '/student/test-master', 
          icon: ExternalLink, 
          label: 'Exam Portal',
          badge: externalTests.length > 0 ? externalTests.length : null,
          badgeColor: 'purple' as const
        },
        { 
          to: '/student/results', 
          icon: FileCheck, 
          label: 'Results & Ranks',
          badge: myResultsCount > 0 ? myResultsCount : null,
          badgeColor: 'indigo' as const
        },
        { 
          to: '/student/materials', 
          icon: BookMarked, 
          label: 'Study Materials',
          badge: myMaterialsCount > 0 ? myMaterialsCount : null,
          badgeColor: 'amber' as const
        },
        { to: '/student/attendance', icon: CalendarCheck, label: 'Attendance' },
      ]
    },
    {
      title: 'Finances & Dues',
      items: [
        { to: '/student/fees', icon: CreditCard, label: 'Fees History' },
        { 
          to: '/student/due-fees', 
          icon: AlertCircle, 
          label: 'Due Fees',
          badge: myDueFees.length > 0 ? `₹${totalDueAmount.toLocaleString('en-IN')}` : null,
          badgeColor: 'rose' as const
        },
      ]
    },
    {
      title: 'Records & Notices',
      items: [
        { 
          to: '/student/remarks', 
          icon: MessageSquareQuote, 
          label: 'Teacher Remarks',
          badge: myRemarksCount > 0 ? myRemarksCount : null,
          badgeColor: 'emerald' as const
        },
        { 
          to: '/student/notices', 
          icon: Bell, 
          label: 'Official Notices',
          badge: notices.length > 0 ? notices.length : null,
          badgeColor: 'indigo' as const
        },
      ]
    }
  ];

  // Dynamic View Titles for Header
  const viewTitles: Record<string, { title: string; category: string }> = {
    '/student/dashboard': { title: 'Student Dashboard', category: 'Overview' },
    '/student/overview': { title: 'Complete Student Dossier', category: 'Overview' },
    '/student/profile': { title: 'My Academic Profile', category: 'Overview' },
    '/student/test-master': { title: 'Online Examination Portal', category: 'Academics' },
    '/student/results': { title: 'Academic Test Results', category: 'Academics' },
    '/student/materials': { title: 'Downloadable Study Notes', category: 'Academics' },
    '/student/attendance': { title: 'Attendance Log & Summary', category: 'Academics' },
    '/student/fees': { title: 'Fee Payment Receipts', category: 'Finances' },
    '/student/due-fees': { title: 'Pending Due Clearance', category: 'Finances' },
    '/student/remarks': { title: 'Teacher Evaluations & Remarks', category: 'Records' },
    '/student/notices': { title: 'Official Notice Board', category: 'Records' },
  };

  const currentView = viewTitles[location.pathname] || { title: 'Student Portal', category: 'Student Hub' };

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-300 flex overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient radial highlights */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Advanced Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 glass border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static flex-shrink-0 flex flex-col h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex flex-col h-full overflow-hidden relative z-10">
          {/* Institution Header */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 rotate-3">
                <Compass className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black leading-tight uppercase tracking-wider text-white">UTC Computra</span>
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" /> Student Portal
                </span>
              </div>
            </div>
            <button 
              className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors" 
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Student Profile Quick Card */}
          <div className="p-3.5 mb-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 overflow-hidden relative">
              {currentStudent.photoUrl ? (
                <img src={currentStudent.photoUrl} alt={currentStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentStudent.name.charAt(0)
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#060c18] rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white text-xs truncate uppercase tracking-tight">{currentStudent.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-semibold truncate">
                <span>Roll: <strong className="text-indigo-300 font-mono">{currentStudent.rollNumber || 'N/A'}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="truncate">{currentStudent.class || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Subcategorized Navigation Groups (Scrollable) */}
          <nav className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {group.title}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.items.map(item => (
                    <NavItem 
                      key={item.to} 
                      {...item} 
                      active={location.pathname === item.to}
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* ADVANCED LEVEL: Instant Support, Instant Chat & Log Out */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5 shrink-0">
            {/* Quick Actions Header */}
            <div className="px-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Direct Assistance
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Desk
              </span>
            </div>

            {/* Instant Support & Instant Chat Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* INSTANT SUPPORT (Call Admin) */}
              <a 
                href="tel:+919647046334" 
                className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between group relative overflow-hidden"
                title="Instant Support: +91 96470 46334"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/50 group-hover:scale-105 transition-transform">
                    <Phone size={13} />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Helpline</span>
                </div>
                <div>
                  <p className="text-[11px] font-black text-white group-hover:text-indigo-200 transition-colors">Instant Support</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">+91 9647046334</p>
                </div>
              </a>

              {/* INSTANT CHAT (WhatsApp Desk) */}
              <a 
                href="https://wa.me/919647046334" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between group relative overflow-hidden"
                title="Instant Chat via WhatsApp"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/50 group-hover:scale-105 transition-transform">
                    <MessageSquare size={13} />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">WhatsApp</span>
                </div>
                <div>
                  <p className="text-[11px] font-black text-white group-hover:text-emerald-200 transition-colors">Instant Chat</p>
                  <p className="text-[10px] text-slate-400 truncate">Chat with Admin</p>
                </div>
              </a>
            </div>

            {/* ADVANCED LOG OUT */}
            <div className="relative">
              {showLogoutConfirm ? (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-2 animate-fadeIn">
                  <span className="text-[11px] font-bold text-rose-300">Confirm Sign Out?</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handleLogout} 
                      className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowLogoutConfirm(false)} 
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-[10px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-rose-500/[0.08] hover:bg-rose-600 hover:text-white border border-rose-500/20 transition-all font-black text-xs uppercase tracking-wider text-rose-400 group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-white/20 group-hover:text-white transition-colors">
                      <LogOut size={14} />
                    </div>
                    <span>Sign Out</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-200 font-normal">
                    {currentStudent.rollNumber}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Desktop & Mobile Top Header Bar */}
        <header className="glass border-b border-white/5 px-6 lg:px-10 h-20 flex items-center justify-between shrink-0 bg-[#060c18]/80 backdrop-blur-xl">
          {/* Left Side: Mobile Menu Button & Breadcrumb */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-slate-300 transition-all"
              aria-label="Open Sidebar"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                <span>{currentView.category}</span>
                <ChevronRight size={10} className="text-slate-600" />
                <span className="text-slate-400">{currentView.title}</span>
              </div>
              <h2 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase">
                {currentView.title}
              </h2>
            </div>
          </div>

          {/* Right Side: IST Live Clock, Pending Dues Quick Pill, Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live IST Time */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 font-mono">
              <Clock size={13} className="text-indigo-400" />
              <span>{timeStr || 'IST'}</span>
            </div>

            {/* Pending Dues Alert Shortcut (if applicable) */}
            {totalDueAmount > 0 && (
              <Link 
                to="/student/due-fees" 
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold transition-all animate-pulse"
              >
                <AlertCircle size={14} className="text-rose-400" />
                <span>Due: ₹{totalDueAmount.toLocaleString('en-IN')}</span>
              </Link>
            )}

            {/* Student Avatar Tag */}
            <Link 
              to="/student/profile" 
              className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs overflow-hidden">
                {currentStudent.photoUrl ? (
                  <img src={currentStudent.photoUrl} alt={currentStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentStudent.name.charAt(0)
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-white leading-tight uppercase group-hover:text-indigo-400 transition-colors">
                  {currentStudent.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {currentStudent.rollNumber}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Routes>
                <Route path="dashboard" element={<StudentHome student={currentStudent} />} />
                <Route path="overview" element={<MyOverview student={currentStudent} />} />
                <Route path="my-overview" element={<MyOverview student={currentStudent} />} />
                <Route path="attendance" element={<StudentAttendance student={currentStudent} />} />
                <Route path="profile" element={<StudentProfile student={currentStudent} />} />
                <Route path="remarks" element={<StudentRemarksView student={currentStudent} />} />
                <Route path="fees" element={<StudentFees student={currentStudent} />} />
                <Route path="due-fees" element={<StudentDueFees student={currentStudent} />} />
                <Route path="test-master" element={<StudentTestMaster />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="materials" element={<StudentMaterials student={currentStudent} />} />
                <Route path="notices" element={<StudentNotices student={currentStudent} />} />
                <Route path="/" element={<StudentHome student={currentStudent} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
      `}</style>
    </div>
  );
}
