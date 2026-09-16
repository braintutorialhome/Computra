import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart2, Users, FileCheck, CreditCard, Wallet, Calendar, BookMarked, Bell, LogOut, Menu, X, Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, Settings, AlertCircle, ExternalLink, UserCheck, GraduationCap, MessageSquareQuote, Compass, ShieldCheck, Phone, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStorage } from '../../hooks/useStorage';
import AdminHome from './views/Home';
import StudentManagement from './views/Students';
import StudentOverview from './views/StudentOverview';
import StudentRemarks from './views/StudentRemarks';
import AdmissionManagement from './views/Admissions';
import FeeManagement from './views/Fees';
import ExpenseManagement from './views/Expenses';
import AccountManagement from './views/Accounts';
import SystemSettings from './views/Settings';
import AttendanceManagement from './views/Attendance';
import AdminTestMaster from './views/TestMaster';
import AdminResults from './views/Results';
import StudyMaterialManagement from './views/Materials';
import NoticeManagement from './views/Notices';
import AdminDueFees from '../../components/admin/AdminDueFees';
import StudentFeeTracker from './views/StudentFeeTracker';

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  badge?: string | number | null;
  badgeColor?: 'indigo' | 'rose' | 'emerald' | 'amber' | 'purple' | 'slate';
  active: boolean;
  onClick: () => void;
}

const badgeClasses = {
  indigo: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  rose: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  slate: 'bg-white/10 text-slate-300 border border-white/10',
};

const NavItem = ({ to, icon: Icon, label, badge, badgeColor = 'indigo', active, onClick }: NavItemProps) => {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all font-bold text-xs tracking-tight relative group ${
        active 
          ? 'text-white' 
          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="admin-nav-active"
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
        <span className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0 font-mono font-bold ${badgeClasses[badgeColor] || badgeClasses.indigo}`}>
          {badge}
        </span>
      )}
    </Link>
  );
};

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    logout, currentUser, syncError, isInitialSyncing, refreshCloudData, scriptUrl,
    students, dueFees, materials, externalTests, notices, resultLinks, remarks
  } = useStorage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kolkataTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentTime);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Subcategorized Navigation Groups (mirroring student navigation structure)
  const navGroups = [
    {
      title: 'Students & Overview',
      items: [
        { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
        { to: '/admin/student-overview', icon: GraduationCap, label: 'Student Overview' },
        { to: '/admin/student-fee-tracker', icon: UserCheck, label: 'Student Fee Tracker' },
        { to: '/admin/admissions', icon: FileCheck, label: 'Admissions' },
        { 
          to: '/admin/students', 
          icon: Users, 
          label: 'Students',
          badge: students.length > 0 ? students.length : null,
          badgeColor: 'slate' as const
        },
      ]
    },
    {
      title: 'Fees & Accounts',
      items: [
        { to: '/admin/fees', icon: CreditCard, label: 'Fees & Collections' },
        { 
          to: '/admin/due-fees', 
          icon: AlertCircle, 
          label: 'Due Fees',
          badge: dueFees.length > 0 ? dueFees.length : null,
          badgeColor: 'rose' as const
        },
        { to: '/admin/expenses', icon: Wallet, label: 'Expenses' },
        { to: '/admin/accounts', icon: DollarSign, label: 'Account Statement' },
      ]
    },
    {
      title: 'Academics & Tests',
      items: [
        { to: '/admin/attendance', icon: Calendar, label: 'Attendance' },
        { 
          to: '/admin/test-master', 
          icon: ExternalLink, 
          label: 'Exam Portal',
          badge: externalTests.length > 0 ? externalTests.length : null,
          badgeColor: 'purple' as const
        },
        { 
          to: '/admin/results', 
          icon: FileCheck, 
          label: 'Results',
          badge: (resultLinks?.length || 0) > 0 ? resultLinks.length : null,
          badgeColor: 'indigo' as const
        },
        { 
          to: '/admin/materials', 
          icon: BookMarked, 
          label: 'Study Materials',
          badge: materials.length > 0 ? materials.length : null,
          badgeColor: 'amber' as const
        },
      ]
    },
    {
      title: 'Communication & System',
      items: [
        { 
          to: '/admin/student-remarks', 
          icon: MessageSquareQuote, 
          label: 'Student Remarks',
          badge: remarks.length > 0 ? remarks.length : null,
          badgeColor: 'emerald' as const
        },
        { 
          to: '/admin/notices', 
          icon: Bell, 
          label: 'Notices',
          badge: notices.length > 0 ? notices.length : null,
          badgeColor: 'indigo' as const
        },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  const viewNames: Record<string, { title: string; category: string }> = {
    '/admin/dashboard': { title: 'System Dashboard', category: 'Students & Overview' },
    '/admin/student-overview': { title: 'Student Overview', category: 'Students & Overview' },
    '/admin/student-fee-tracker': { title: 'Student Management & Fee Tracker', category: 'Students & Overview' },
    '/admin/admissions': { title: 'Admission Panel', category: 'Students & Overview' },
    '/admin/students': { title: 'Student Records', category: 'Students & Overview' },
    '/admin/fees': { title: 'Fees & Collections', category: 'Fees & Accounts' },
    '/admin/due-fees': { title: 'Due Fees Management', category: 'Fees & Accounts' },
    '/admin/expenses': { title: 'Expense Tracker', category: 'Fees & Accounts' },
    '/admin/accounts': { title: 'Account Statement', category: 'Fees & Accounts' },
    '/admin/attendance': { title: 'Attendance System', category: 'Academics & Tests' },
    '/admin/test-master': { title: 'Exam Portal (External)', category: 'Academics & Tests' },
    '/admin/results': { title: 'Result Management', category: 'Academics & Tests' },
    '/admin/materials': { title: 'Study Materials', category: 'Academics & Tests' },
    '/admin/student-remarks': { title: 'Student Remarks & Notes', category: 'Communication & System' },
    '/admin/notices': { title: 'Notice Board', category: 'Communication & System' },
    '/admin/settings': { title: 'System Settings', category: 'Communication & System' },
  };

  const currentView = viewNames[location.pathname] || { title: 'Admin Panel', category: 'Administration' };

  return (
    <div className="min-h-screen bg-transparent flex font-sans overflow-hidden">
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

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 glass border-r border-white/5 transform transition-transform duration-300 lg:translate-x-0 lg:static flex-shrink-0 flex flex-col h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex flex-col h-full overflow-hidden relative z-10">
          {/* Institution Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 rotate-3">
                <Compass className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black leading-tight uppercase tracking-wider text-white">UTC Computra</span>
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" /> Admin Portal
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

          {/* Admin Profile Quick Card */}
          <div className="p-3.5 mb-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shrink-0 relative">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#060c18] rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-white text-xs truncate uppercase tracking-tight">{currentUser?.name || 'Administrator'}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-semibold truncate">
                <span className="text-indigo-400 font-bold uppercase tracking-wider">{currentUser?.role || 'Super Admin'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
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
                  <span className="text-[9px] font-bold text-slate-400 font-mono">
                    {group.items.length}
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

          {/* Support & Logout Footer */}
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <a 
                href="tel:+919647046334" 
                className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                title="Helpline: +91 96470 46334"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/50 group-hover:scale-105 transition-transform">
                    <Phone size={12} />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Helpline</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white group-hover:text-indigo-200 transition-colors">Support Desk</p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">+91 9647046334</p>
                </div>
              </a>

              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/50">
                    <ShieldCheck size={12} />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Cloud</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white">System Status</p>
                  <p className="text-[9px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              {showLogoutConfirm ? (
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-2 animate-fadeIn">
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
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-rose-500/[0.08] hover:bg-rose-600 hover:text-white border border-rose-500/20 transition-all font-black text-xs uppercase tracking-wider text-rose-400 group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-white/20 group-hover:text-white transition-colors">
                      <LogOut size={14} />
                    </div>
                    <span>Sign Out</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-200 font-mono">
                    {currentUser?.role || 'Admin'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md">
           <div className="flex items-center gap-4">
             <button className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-white" onClick={() => setIsSidebarOpen(true)}>
               <Menu size={24} />
             </button>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                   {currentView.category}
                 </span>
               </div>
               <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                 {currentView.title}
               </h2>
               <div className="flex items-center gap-2">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                   UTC Computra • {kolkataTime} IST
                 </p>
                 {isInitialSyncing && (
                   <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                     <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                     Syncing with Cloud...
                   </span>
                 )}
               </div>
             </div>
           </div>
           
           <div className="hidden sm:flex gap-4 items-center">
              {syncError && (
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 max-w-sm animate-in slide-in-from-top duration-500">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">{syncError}</span>
                    <button onClick={() => refreshCloudData()} className="ml-2 px-2 py-1 bg-rose-500 text-white rounded text-[8px] font-black hover:bg-rose-600 transition-colors shrink-0">RETRY</button>
                  </div>
                  <div className="flex gap-4 px-2">
                    <a 
                      href={scriptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400"
                    >
                      1. Check Script URL ↗
                    </a>
                    <button 
                      onClick={() => setShowTroubleshoot(prev => !prev)}
                      className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 underline underline-offset-2"
                    >
                      2. Common Fixes {showTroubleshoot ? '▲' : '▼'}
                    </button>
                  </div>
                  {showTroubleshoot && (
                    <div className="mt-1 p-3 bg-slate-900/95 border border-white/10 rounded-xl text-[9px] text-slate-300 max-w-xs space-y-1 text-left shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
                      <p className="font-bold text-indigo-300 uppercase tracking-widest">Troubleshooting Guide:</p>
                      <p>1. Open Apps Script Editor and click <strong className="text-white">Run</strong> once to authorize permissions.</p>
                      <p>2. Deploy &gt; Manage Deployments &gt; Ensure <strong className="text-white">Who has access</strong> is set to <strong className="text-white">Anyone</strong>.</p>
                      <p>3. If logged into multiple Google accounts, test in an Incognito window.</p>
                    </div>
                  )}
                </div>
              )}
              <Link to="/admin/student-overview" className="glass-button px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white flex items-center gap-2">
                <GraduationCap size={14} className="text-indigo-400" />
                Student Overview
              </Link>
              <Link to="/admin/student-fee-tracker" className="glass-button px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white flex items-center gap-2">
                <UserCheck size={14} className="text-emerald-400" />
                Fee Tracker
              </Link>
              <Link to="/admin/attendance" className="glass-button px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300">
                Attendance
              </Link>
              <Link to="/admin/settings" className="indigo-button px-5 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} />
                Settings
              </Link>
           </div>
        </header>

        {/* Sync Error Banner for Mobile/All */}
        {syncError && (
          <div className="sm:hidden bg-rose-600 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <AlertCircle size={14} />
              <p className="text-[10px] font-black uppercase tracking-wider">Sync Error: {syncError}</p>
            </div>
            <button onClick={() => refreshCloudData()} className="px-3 py-1 bg-white text-rose-600 rounded text-[10px] font-black">RETRY</button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="p-8 flex-1 overflow-auto custom-scrollbar">
          <Routes>
            <Route path="dashboard" element={<AdminHome />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="student-remarks" element={<StudentRemarks />} />
            <Route path="student-overview" element={<StudentOverview />} />
            <Route path="student-fee-tracker" element={<StudentFeeTracker />} />
            <Route path="admissions" element={<AdmissionManagement />} />
            <Route path="fees" element={<FeeManagement />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="test-master" element={<AdminTestMaster />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="materials" element={<StudyMaterialManagement />} />
            <Route path="due-fees" element={<AdminDueFees />} />
            <Route path="notices" element={<NoticeManagement />} />
            <Route path="/" element={<AdminHome />} />
          </Routes>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .custom-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

