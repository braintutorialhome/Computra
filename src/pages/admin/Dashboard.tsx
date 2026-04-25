import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart2, Users, FileCheck, CreditCard, Wallet, Calendar, Brain, BookMarked, Bell, LogOut, Menu, X, Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import AdminHome from './views/Home';
import StudentManagement from './views/Students';
import AdmissionManagement from './views/Admissions';
import FeeManagement from './views/Fees';
import ExpenseManagement from './views/Expenses';
import AccountManagement from './views/Accounts';
import AttendanceManagement from './views/Attendance';
import OnlineTestManagement from './views/Tests';
import StudyMaterialManagement from './views/Materials';
import NoticeManagement from './views/Notices';

const NavItem = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-tight ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/20' 
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
    }`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </Link>
);

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useStorage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const navItems = [
    { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/admin/admissions', icon: FileCheck, label: 'Admissions' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/fees', icon: CreditCard, label: 'Fees' },
    { to: '/admin/expenses', icon: Wallet, label: 'Expenses' },
    { to: '/admin/accounts', icon: DollarSign, label: 'Accounts' },
    { to: '/admin/attendance', icon: Calendar, label: 'Attendance' },
    { to: '/admin/tests', icon: Brain, label: 'Online Tests' },
    { to: '/admin/materials', icon: BookMarked, label: 'Materials' },
    { to: '/admin/notices', icon: Bell, label: 'Notices' },
  ];

  const viewNames: Record<string, string> = {
    '/admin/dashboard': 'System Dashboard',
    '/admin/admissions': 'Admission Panel',
    '/admin/students': 'Student Records',
    '/admin/fees': 'Fees & Collections',
    '/admin/expenses': 'Expense Tracker',
    '/admin/accounts': 'Institutional Accounts',
    '/admin/attendance': 'Attendance System',
    '/admin/tests': 'Test Creation',
    '/admin/materials': 'Study Materials',
    '/admin/notices': 'Notice Board',
  };

  return (
    <div className="min-h-screen bg-transparent flex font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 h-full bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col p-6 transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/30">
              <span className="text-white tracking-tighter">UC</span>
            </div>
            <div>
              <h1 className="text-lg font-black leading-tight uppercase tracking-widest text-white">UTC Computra</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Admin Portal</p>
            </div>
            <button className="ml-auto lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {navItems.map(item => (
              <NavItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 mb-4">
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Support</p>
                <p className="text-xs text-slate-400 font-medium">+91 9647046334</p>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm text-rose-400 hover:bg-rose-400/10 hover:text-rose-300"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
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
               <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                 {viewNames[location.pathname] || 'Admin Panel'}
               </h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                 UTC Computra • {kolkataTime}
               </p>
             </div>
           </div>
           
           <div className="hidden sm:flex gap-4">
              <Link to="/admin/attendance" className="glass-button px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300">
                Attendance
              </Link>
              <Link to="/admin/expenses" className="indigo-button px-6 py-2.5 text-xs font-black uppercase tracking-widest">
                Add Expense 💸
              </Link>
           </div>
        </header>

        {/* Scrollable content */}
        <div className="p-8 flex-1 overflow-auto custom-scrollbar">
          <Routes>
            <Route path="dashboard" element={<AdminHome />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="admissions" element={<AdmissionManagement />} />
            <Route path="fees" element={<FeeManagement />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="tests" element={<OnlineTestManagement />} />
            <Route path="materials" element={<StudyMaterialManagement />} />
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
