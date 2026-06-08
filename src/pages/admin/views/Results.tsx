import React, { useState } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Search, FileText, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResultLink } from '../../../types';

const AdminResults: React.FC = () => {
  const { resultLinks, addResultLink, updateResultLink, deleteResultLink } = useStorage();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    
    // Ensure URL has protocol
    let finalUrl = formData.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    if (editingId) {
      const original = resultLinks.find(r => r.id === editingId);
      if (original) {
        updateResultLink({
          ...original,
          title: formData.title,
          description: formData.description,
          url: finalUrl
        });
      }
    } else {
      addResultLink({
        title: formData.title,
        description: formData.description,
        url: finalUrl
      });
    }
    
    setFormData({ title: '', description: '', url: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (result: ResultLink) => {
    setFormData({
      title: result.title,
      description: result.description || '',
      url: result.url
    });
    setEditingId(result.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredResults = resultLinks.filter(r => {
    const sTitle = String(r.title || '').toLowerCase();
    const sDesc = String(r.description || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return sTitle.includes(search) || sDesc.includes(search);
  });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
             <FileText size={24} />
           </div>
           <div>
             <h3 className="font-black text-xl text-white tracking-tight">Result Management</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Post and manage result links for students</p>
           </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: '', description: '', url: '' });
            setIsAdding(true);
          }}
          className="indigo-button px-8 py-3.5 text-xs font-black uppercase tracking-widest"
        >
          Publish Result &nbsp;📊
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-[40px] border border-white/5 p-10 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {editingId ? 'Edit Result Link' : 'Add New Result Link'}
                </h3>
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Result Title</label>
                    <input
                      type="text"
                      required
                      className="input-glass w-full py-4 rounded-2xl"
                      placeholder="e.g. Annual Exams 2025"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Result URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        className="input-glass w-full py-4 pl-14 rounded-2xl"
                        placeholder="e.g. drive.google.com/..."
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    className="input-glass w-full py-4 rounded-2xl resize-none"
                    placeholder="Short description or instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="indigo-button w-full md:w-auto px-10 py-4 text-xs font-black uppercase tracking-widest"
                  >
                    {editingId ? 'Update Result' : 'Publish Result'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Search results..."
          className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 focus:border-indigo-500/50 transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-10 py-6">Result Details</th>
                <th className="px-10 py-6">URL Link</th>
                <th className="px-10 py-6">Date Published</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <motion.tr 
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/20 group-hover:scale-110 transition-transform">
                          R
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-tight leading-none mb-1.5">{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-slate-500 line-clamp-1">{result.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-[#10b981] hover:text-[#34d399] transition-colors bg-[#10b981]/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        View Result
                      </a>
                    </td>
                    <td className="px-10 py-6 text-slate-400 font-bold tracking-tighter">
                      {new Date(result.date).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(result)}
                          className="p-2.5 text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Are you sure you want to delete this result link?')) {
                              deleteResultLink(result.id);
                            }
                          }}
                          className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FileText size={48} className="mb-4 text-slate-600 animate-bounce" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No result links published yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
