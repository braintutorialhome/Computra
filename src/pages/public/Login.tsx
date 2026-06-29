import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Lock, ArrowLeft, KeyRound, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, isInitialSyncing, syncError } = useStorage();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(username, password, role);
        if (success) {
          navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        } else {
          setError('Invalid credentials or unauthorized access');
        }
      } else {
        await signup({
          username,
          password,
          name,
          role
        });
        setIsLogin(true);
        setError('Account created successfully. Please log in.');
      }
    } catch (err: any) {
      setError(err.message || 'System communication failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Styled Top Bar Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 px-2">
        <Link 
          to="/" 
          id="btn-login-abort"
          className="px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all group font-bold text-xs uppercase tracking-wider border bg-[#090d16]/80 border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/20 shadow-lg"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>Return</span>
        </Link>
        <span className="text-xs font-black uppercase text-slate-600 tracking-widest">Portal Login</span>
      </div>

      {/* Clean Glassmorphic Main Container */}
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass p-8 sm:p-10 rounded-[40px] border border-white/5 shadow-2xl bg-white/[0.02]"
        >
          {/* Form Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-widest text-indigo-400">
              {isLogin ? 'Sign In' : 'Register'}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              {isLogin ? 'Access your automated learning account' : 'Setup administrative permissions'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Tab Selector */}
            <div className="p-1 rounded-2xl flex bg-[#0a0f1c] border border-white/5">
              <button 
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  role === 'student'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                Student
              </button>
              <button 
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  role === 'admin'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                Root/Admin
              </button>
            </div>

            {/* Inputs Container */}
            <div className="space-y-4">
              
              {/* Full Name (Sign Up only) */}
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Full Name</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-glass w-full px-6 py-4 rounded-2xl text-sm"
                        placeholder="e.g. Rahul Sen"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Username</label>
                <div className="relative">
                  <input 
                    required
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-glass w-full px-6 py-4 rounded-2xl text-sm"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Password</label>
                <div className="relative">
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-glass w-full px-6 py-4 rounded-2xl text-sm"
                    placeholder=""
                  />
                </div>
              </div>

            </div>

            {/* Error logs */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center">
                <p className="text-rose-400 text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {/* Syncing loader indicator */}
            {isInitialSyncing && (
              <div className="flex items-center justify-center gap-2 text-slate-500 py-1">
                <Loader2 className="animate-spin text-indigo-400 animate-infinite" size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Initial Sync Ongoing...</span>
              </div>
            )}

            {/* Submit Control Button */}
            <button 
              type="submit" 
              disabled={loading || isInitialSyncing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-98"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : isLogin ? <LogIn size={14} /> : <UserPlus size={14} />}
              <span>{isInitialSyncing ? 'Synchronizing...' : isLogin ? 'Sign In' : 'Sign Up'}</span>
            </button>

          </form>
        </motion.div>

        {/* Sync Error Log */}
        {syncError && !isInitialSyncing && (
          <div className="mt-6 p-4 rounded-[24px] bg-amber-500/5 border border-amber-500/10 text-center">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">Central Sync Log</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wide leading-relaxed">{syncError}</p>
          </div>
        )}

        {/* Mode Switch Button */}
        <div className="text-center mt-8">
          <button 
            type="button"
            id="btn-mode-toggle"
            onClick={() => {
              navigate('/admission');
            }}
            className="text-xs font-black uppercase tracking-widest transition-all text-slate-500 hover:text-white underline decoration-white/0 hover:decoration-white/20 underline-offset-8"
          >
            Create Student Account
          </button>
        </div>
      </div>
    </div>
  );
}
