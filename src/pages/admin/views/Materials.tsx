import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Plus, BookOpen, Trash2, FileText, Video, ExternalLink, X, Pencil, Search, Filter } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { StudyMaterial } from '../../../types';

export default function StudyMaterialManagement() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useStorage();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Default values with Subject, Class, Semester
  const [formData, setFormData] = useState({ 
    title: '', 
    type: 'pdf', 
    url: '', 
    description: '',
    subject: 'Computer Applications',
    class: 'XI',
    semester: 'Semester-I'
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = String(m.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
    const matchesClass = filterClass === 'all' || m.class === filterClass;
    const matchesSemester = filterSemester === 'all' || m.semester === filterSemester;
    return matchesSearch && matchesSubject && matchesClass && matchesSemester;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    
    if (editingId) {
      const original = materials.find(m => m.id === editingId);
      if (original) {
        updateMaterial({
          ...original,
          ...(formData as any)
        });
      }
    } else {
      addMaterial(formData as any);
    }
    
    setShowAdd(false);
    setEditingId(null);
    setFormData({ 
      title: '', 
      type: 'pdf', 
      url: '', 
      description: '',
      subject: 'Computer Applications',
      class: 'XI',
      semester: 'Semester-I'
    });
  };

  const handleEdit = (m: StudyMaterial) => {
    setEditingId(m.id);
    setFormData({ 
      title: m.title, 
      type: m.type, 
      url: m.url, 
      description: m.description || '',
      subject: m.subject || 'Computer Applications',
      class: m.class || 'XI',
      semester: m.semester || 'Semester-I'
    });
    setShowAdd(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ 
      title: '', 
      type: 'pdf', 
      url: '', 
      description: '',
      subject: 'Computer Applications',
      class: 'XI',
      semester: 'Semester-I'
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-8 rounded-[40px] border border-white/5 gap-6">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl shadow-lg border border-emerald-500/20">
             <BookOpen size={32} />
           </div>
           <div>
             <h3 className="font-black text-2xl text-white tracking-tight">Digital Library</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage and share learning assets</p>
           </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-10 py-4 glass-button text-xs font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
        >
          Add New Asset
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[60] flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass rounded-[50px] shadow-2xl w-full max-w-xl animate-in zoom-in duration-300 my-8 overflow-hidden">
            <div className="p-10 bg-emerald-600 text-white flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{editingId ? 'Edit Asset' : 'Add Asset'}</h2>
              <button 
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                }} 
                className="p-3 hover:bg-white/20 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-glass w-full py-4 rounded-2xl font-bold"
                  placeholder="e.g. Advanced Java Reference Guide"
                />
              </div>

              {/* Subject Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="input-glass w-full py-4 px-6 rounded-2xl font-bold cursor-pointer text-white"
                >
                  <option value="Computer Applications" className="bg-slate-900">Computer Applications</option>
                  <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                  <option value="Others" className="bg-slate-900">Others</option>
                </select>
              </div>

              {/* Class & Semester Options */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Class/Level</label>
                  <select 
                    value={formData.class}
                    onChange={(e) => {
                      const selectedClass = e.target.value;
                      const defaultSem = selectedClass === 'XI' ? 'Semester-I' : 'Semester-III';
                      setFormData({...formData, class: selectedClass, semester: defaultSem});
                    }}
                    className="input-glass w-full py-4 px-6 rounded-2xl font-bold cursor-pointer text-white"
                  >
                    <option value="XI" className="bg-slate-900">Class-XI</option>
                    <option value="XII" className="bg-slate-900">Class-XII</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Semester</label>
                  <select 
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="input-glass w-full py-4 px-6 rounded-2xl font-bold cursor-pointer text-white"
                  >
                    {formData.class === 'XI' ? (
                      <>
                        <option value="Semester-I" className="bg-slate-900">Semester-I</option>
                        <option value="Semester-II" className="bg-slate-900">Semester-II</option>
                      </>
                    ) : (
                      <>
                        <option value="Semester-III" className="bg-slate-900">Semester-III</option>
                        <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resource Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="input-glass w-full py-4 px-6 rounded-2xl font-bold cursor-pointer text-white"
                  >
                    <option value="pdf" className="bg-slate-900">📄 PDF Document</option>
                    <option value="note" className="bg-slate-900">📝 Text Note</option>
                    <option value="video" className="bg-slate-900">🎥 Video URL</option>
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public URL</label>
                   <input 
                    required
                    type="url" 
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="input-glass w-full py-4 rounded-2xl text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 mt-4">
                {editingId ? 'Update Asset' : 'Confirm & Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm cursor-pointer text-slate-300"
          >
            <option value="all" className="bg-slate-900">All Subjects</option>
            <option value="Computer Applications" className="bg-slate-900">Computer Applications</option>
            <option value="Computer Science" className="bg-slate-900">Computer Science</option>
            <option value="Others" className="bg-slate-900">Others</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm cursor-pointer text-slate-300"
          >
            <option value="all" className="bg-slate-900">All Classes</option>
            <option value="XI" className="bg-slate-900">Class-XI</option>
            <option value="XII" className="bg-slate-900">Class-XII</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select 
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="input-glass w-full pl-14 py-3.5 rounded-2xl text-sm cursor-pointer text-slate-300"
          >
            <option value="all" className="bg-slate-900">All Semesters</option>
            <option value="Semester-I" className="bg-slate-900">Semester-I</option>
            <option value="Semester-II" className="bg-slate-900">Semester-II</option>
            <option value="Semester-III" className="bg-slate-900">Semester-III</option>
            <option value="Semester-IV" className="bg-slate-900">Semester-IV</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMaterials.map((m, idx) => (
          <div key={m.id ? `admin-mat-${m.id}` : `mat-idx-${idx}`} className="glass p-8 rounded-[40px] group hover:bg-white/10 transition-all border border-white/5 relative flex flex-col justify-between min-h-[280px]">
             <div>
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    m.type === 'pdf' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    m.type === 'video' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {m.type === 'pdf' ? <FileText size={28}/> : m.type === 'video' ? <Video size={28}/> : <BookOpen size={28}/>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this study material asset?')) {
                          deleteMaterial(m.id);
                        }
                      }}
                      className="p-3 text-slate-500 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {/* Subject and level badges */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                      {m.subject || 'Computer Applications'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/10">
                      Class-{m.class || 'XI'} • {m.semester || 'Semester-I'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">{m.title}</h3>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Updated {safeFormat(m.uploadDate, 'MMM dd, yyyy')}
                </p>
             </div>

             <a 
               href={m.url} 
               target="_blank" 
               rel="noreferrer"
               className="mt-8 py-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
             >
               Open File <ExternalLink size={14} />
             </a>
          </div>
        ))}

        {materials.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
               <BookOpen size={40} />
             </div>
             <p className="text-slate-500 font-bold">No assets found in digital vault.</p>
          </div>
        )}

        {materials.length > 0 && filteredMaterials.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[60px] border-2 border-dashed border-white/5 animate-in fade-in duration-300">
             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
               <Search size={40} />
             </div>
             <p className="text-slate-500 font-bold">No study materials match your active filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
