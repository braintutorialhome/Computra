import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Search, User, Trash2, Edit2, Filter, Phone, MapPin } from 'lucide-react';

export default function StudentManagement() {
  const { students, deleteStudent } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const approved = students.filter(s => s.status === 'approved');
  
  const classes = ['All', ...Array.from(new Set(approved.map(s => s.class)))];

  const filtered = approved.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-10">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search roll number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl"
          />
        </div>
        <div className="md:w-64 relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl appearance-none"
          >
            {classes.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map(s => (
          <div key={s.id} className="glass rounded-[32px] overflow-hidden group hover:bg-white/10 transition-all flex flex-col">
            <div className="p-8 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  {s.name.charAt(0)}
                </div>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {s.rollNumber}
                </span>
              </div>
              
              <div>
                <h3 className="font-black text-xl tracking-tight text-white mb-1 group-hover:text-indigo-400 transition-colors">{s.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.subject} • Class {s.class}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <Phone size={14} className="text-indigo-500" /> {s.mobile}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <MapPin size={14} className="text-indigo-500" /> {s.address}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
              <button 
                onClick={() => {}}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button 
                onClick={() => deleteStudent(s.id)}
                className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[40px]">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No records found matching filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
