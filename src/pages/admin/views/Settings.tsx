import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Shield, User as UserIcon, Key, Lock, X, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../../../types';

export default function SystemSettings() {
  const { users, updateUser, currentUser, refreshCloudData, isInitialSyncing, syncError } = useStorage();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateAccount = () => {
    if (!editingUser) return;
    updateUser({
      ...editingUser,
      username: newUsername || editingUser.username,
      password: newPassword || editingUser.password
    });
    setEditingUser(null);
    setNewPassword('');
    setNewUsername('');
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Cloud Status Header */}
      <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${syncError ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {syncError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              Cloud System Status: {syncError ? 'Communication Issue' : 'Operational'}
            </h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">
              {syncError ? syncError : 'All data nodes are synchronized with Google Sheets'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || isInitialSyncing}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-3 border border-white/10 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing || isInitialSyncing ? 'animate-spin' : ''} />
          {isRefreshing || isInitialSyncing ? 'Synchronizing Nodes...' : 'Force Cloud Refresh'}
        </button>
      </div>

      {/* User Management Section */}
      <div className="glass p-10 rounded-[40px] border border-white/5">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-3xl border border-indigo-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">System Users</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage admin access and security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, i) => (
            <div key={`${user.id}-${i}`} className="glass p-6 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                  <UserIcon size={18} />
                </div>
                {user.id === currentUser?.id && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg">YOU</span>
                )}
              </div>
              
              <h4 className="font-black text-white mb-1 uppercase tracking-tight">{user.name}</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">@{user.username}</p>

              <button 
                onClick={() => setEditingUser(user)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <Key size={12} /> Change Password
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Password Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
          <div className="glass max-w-md w-full p-10 rounded-[40px] border border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Lock size={20} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Security</h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Update User ID (Username)</label>
                <input 
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={editingUser.username}
                  className="input-glass w-full px-6 py-5 rounded-2xl mb-4"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ENHANCE_SECURITY_LEVEL"
                  className="input-glass w-full px-6 py-5 rounded-2xl"
                />
              </div>

              <button 
                onClick={handleUpdateAccount}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
              >
                <Save size={18} /> Update Access Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
