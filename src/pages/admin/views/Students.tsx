import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Search, User, Trash2, Edit2, Filter, Phone, MapPin, X, Save, Hash, RotateCcw, AlertTriangle, MessageSquare } from 'lucide-react';
import { Student } from '../../../types';

const compressImage = (file: File, maxWidth = 150, maxHeight = 150, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export default function StudentManagement() {
  const { students, deleteStudent, removeStudentPermanently, updateStudent } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [filterSession, setFilterSession] = useState('All');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  const approved = students.filter(s => s.status === 'approved');
  const deleted = students.filter(s => s.status === 'deleted' || s.status === 'rejected');
  
  const displayList = activeTab === 'active' ? approved : deleted;

  const classes = ['All', ...Array.from(new Set(approved.map(s => String(s.class || '').trim()).filter(Boolean)))];

  const defaultSemesters = ['Semester-I', 'Semester-II', 'Semester-III', 'Semester-IV'];
  const studentSemesters = Array.from(new Set(approved.map(s => String(s.semester || '').trim()).filter(Boolean)));
  const semesters = ['All', ...Array.from(new Set([...defaultSemesters, ...studentSemesters]))];

  const defaultSessions = ['2024-2025', '2025-2026', '2026-2027'];
  const studentSessions = Array.from(new Set(approved.map(s => String(s.session || '').trim()).filter(Boolean)));
  const sessions = ['All', ...Array.from(new Set([...defaultSessions, ...studentSessions]))];

  const filtered = displayList.filter(s => {
    const sName = String(s.name || '').toLowerCase();
    const sRoll = String(s.rollNumber || '').toLowerCase();
    const sId = String(s.id || '').toLowerCase();
    const sSession = String(s.session || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = sName.includes(search) || 
                          sRoll.includes(search) ||
                          sId.includes(search) ||
                          sSession.includes(search);
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    const matchesSemester = filterSemester === 'All' || s.semester === filterSemester;
    const matchesSession = filterSession === 'All' || s.session === filterSession;
    return matchesSearch && matchesClass && matchesSemester && matchesSession;
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent(editingStudent);
      setEditingStudent(null);
    }
  };

  const handleRestore = (id: string) => {
    const student = deleted.find(s => s.id === id);
    if (student) {
      updateStudent({ ...student, status: 'approved' });
    }
  };

  return (
    <div className="space-y-10">
      {/* Tab Switcher */}
      <div className="flex gap-4 p-2 glass rounded-3xl w-fit">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
        >
          Active Students ({approved.length})
        </button>
        <button 
          onClick={() => setActiveTab('deleted')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deleted' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-white'}`}
        >
          Deleted Records ({deleted.length})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search student id, roll number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-14 py-4 rounded-2xl"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48 relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="input-glass w-full pl-12 pr-6 py-4 rounded-2xl appearance-none"
            >
              {classes.map(c => <option key={`class-${c}`} value={c} className="bg-slate-900">{c === 'All' ? 'All Classes' : `Class ${c}`}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-48 relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="input-glass w-full pl-12 pr-6 py-4 rounded-2xl appearance-none"
            >
              {semesters.map(sem => <option key={`sem-${sem}`} value={sem} className="bg-slate-900">{sem === 'All' ? 'All Semesters' : sem}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-48 relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="input-glass w-full pl-12 pr-6 py-4 rounded-2xl appearance-none"
            >
              {sessions.map(sess => <option key={`session-${sess}`} value={sess} className="bg-slate-900">{sess === 'All' ? 'All Sessions' : `Session: ${sess}`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filtered.map((s, idx) => (
          <div key={s.id ? `student-${s.id}` : `stud-idx-${idx}`} className={`glass rounded-[32px] overflow-hidden group hover:bg-white/10 transition-all flex flex-col ${activeTab === 'deleted' ? 'opacity-80 border-rose-500/20' : ''}`}>
            <div className="p-8 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div className={`w-16 h-16 ${activeTab === 'deleted' ? 'bg-rose-600/50' : 'bg-indigo-600'} text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform overflow-hidden`}>
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'deleted' ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {s.rollNumber}
                  </span>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">ID: {s.id}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-black text-xl tracking-tight text-white mb-1 group-hover:text-indigo-400 transition-colors">
                  {s.name}
                  {activeTab === 'deleted' && <span className="ml-3 text-[8px] bg-rose-500/20 text-rose-500 px-2 py-1 rounded-lg">DELETED</span>}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {s.subject} • Class {s.class} {s.semester ? `• ${s.semester}` : ''} {s.session ? `• ${s.session}` : ''}
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <Phone size={14} className={activeTab === 'deleted' ? 'text-rose-500' : 'text-indigo-500'} /> {s.mobile}
                </div>
                {s.whatsapp && (
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <MessageSquare size={14} className={activeTab === 'deleted' ? 'text-rose-500' : 'text-emerald-500'} /> {s.whatsapp}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <MapPin size={14} className={activeTab === 'deleted' ? 'text-rose-500' : 'text-indigo-500'} /> {s.address}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-3">
              {activeTab === 'active' ? (
                <>
                  <button 
                    onClick={() => setEditingStudent(s)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  {deletingId === s.id ? (
                    <div className="flex gap-2 flex-1">
                      <button 
                        onClick={() => {
                          deleteStudent(s.id);
                          setDeletingId(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-3 rounded-xl bg-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(s.id)}
                      className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 group/btn"
                      title="Move to trash"
                    >
                      <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleRestore(s.id)}
                    className="flex-1 py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Restore Record
                  </button>
                  {deletingId === s.id ? (
                    <div className="flex gap-2 flex-1">
                      <button 
                        onClick={() => {
                          removeStudentPermanently(s.id);
                          setDeletingId(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-rose-900 border border-rose-600 text-white text-[8px] font-black uppercase tracking-widest animate-pulse"
                      >
                        ERASE!
                      </button>
                      <button 
                        onClick={() => setDeletingId(null)}
                        className="px-4 py-3 rounded-xl bg-white/10 text-white text-[8px] font-black uppercase tracking-widest"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(s.id)}
                      className="py-3 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                      title="Permanent Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[40px]">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No records found matching filters.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
          <div className="glass max-w-2xl w-full p-10 rounded-[40px] border border-white/10 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Student Profile</h3>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full flex flex-col items-center justify-center py-4 bg-white/5 rounded-3xl border border-white/5 mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-indigo-500/30 flex items-center justify-center font-black text-white text-3xl shadow-lg relative overflow-hidden group/form-avatar">
                  {editingStudent.photoUrl ? (
                    <img src={editingStudent.photoUrl} alt={editingStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    editingStudent.name ? editingStudent.name.charAt(0) : 'U'
                  )}
                  <label className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover/form-avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setEditingStudent(prev => prev ? { ...prev, photoUrl: compressed } : null);
                          } catch (err) {
                            console.error("Failed to compress image:", err);
                          }
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                </div>
                {editingStudent.photoUrl && (
                  <button 
                    type="button"
                    onClick={() => setEditingStudent({ ...editingStudent, photoUrl: undefined })}
                    className="mt-3 text-[9px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove Picture
                  </button>
                )}
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Assigned Roll Number</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text"
                    value={editingStudent.rollNumber || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, rollNumber: e.target.value})}
                    className="input-glass w-full pl-14 py-4 rounded-2xl text-indigo-400 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Full Name</label>
                <input 
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Guardian's Name</label>
                <input 
                  type="text"
                  value={editingStudent.fatherName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, fatherName: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Class</label>
                <input 
                  type="text"
                  value={editingStudent.class}
                  onChange={(e) => setEditingStudent({...editingStudent, class: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Subject / Batch</label>
                <input 
                  type="text"
                  value={editingStudent.subject}
                  onChange={(e) => setEditingStudent({...editingStudent, subject: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Mobile</label>
                <input 
                  type="text"
                  value={editingStudent.mobile}
                  onChange={(e) => setEditingStudent({...editingStudent, mobile: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">WhatsApp Number</label>
                <input 
                  type="text"
                  value={editingStudent.whatsapp || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, whatsapp: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                  placeholder="WhatsApp number"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Birth</label>
                <input 
                  type="date"
                  value={editingStudent.dob || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl text-white animate-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Gender</label>
                <select 
                  value={editingStudent.gender || 'Male'}
                  onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value})}
                  className="input-glass w-full px-6 p-4 rounded-2xl bg-slate-950 font-bold"
                >
                  <option value="Male" className="bg-slate-900">Male</option>
                  <option value="Female" className="bg-slate-900">Female</option>
                  <option value="Other" className="bg-slate-900">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Semester</label>
                <select 
                  value={editingStudent.semester || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, semester: e.target.value})}
                  className="input-glass w-full px-6 p-4 rounded-2xl bg-slate-950 font-bold"
                >
                  <option value="" className="bg-slate-900">No Semester</option>
                  <option value="Semester-I" className="bg-slate-900">Semester-I</option>
                  <option value="Semester-II" className="bg-slate-900">Semester-II</option>
                  <option value="Semester-III" className="bg-slate-900">Semester-III</option>
                  <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Session</label>
                <input 
                  type="text"
                  value={editingStudent.session || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, session: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl"
                  placeholder="e.g. 2025-2026"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Joining</label>
                <input 
                  type="date"
                  value={editingStudent.dateOfJoining || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, dateOfJoining: e.target.value})}
                  className="input-glass w-full px-6 py-4 rounded-2xl text-white animate-none"
                />
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Residential Address</label>
                <textarea 
                  rows={2}
                  value={editingStudent.address || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, address: e.target.value})}
                  className="input-glass w-full p-6 rounded-2xl resize-none"
                />
              </div>

              <div className="col-span-full">
                <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20">
                  <Save size={18} /> Update Student Profile
                </button>
              </div>
            </form>
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
