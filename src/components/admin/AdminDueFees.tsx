import React, { useState, useMemo } from 'react';
import { useStorage } from '../../hooks/useStorage';
import { Search, Plus, Trash2, Edit2, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SearchableSelect from '../ui/SearchableSelect';

const AdminDueFees: React.FC = () => {
  const { students, dueFees, addDueFee, updateDueFee, deleteDueFee } = useStorage();
  const [listSearch, setListSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const subjects = useMemo(() => Array.from(new Set(students.map(s => String(s.subject || '').trim()).filter(Boolean))), [students]);

  const approvedOptions = useMemo(() => 
    students
      .filter(s => s.status === 'approved')
      .map(s => ({
        id: s.id,
        label: s.name,
        subLabel: s.rollNumber || 'No ID'
      })),
    [students]
  );

  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    remarks: ''
  });

  const filteredDueFees = dueFees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    const sName = String(student?.name || '').toLowerCase();
    const sRoll = String(student?.rollNumber || '').toLowerCase();
    const sRemarks = String(fee.remarks || '').toLowerCase();
    const search = listSearch.toLowerCase();

    const matchesSearch = 
      sName.includes(search) ||
      sRoll.includes(search) ||
      sRemarks.includes(search);
    
    const matchesSubject = subjectFilter === '' || student?.subject === subjectFilter;
    
    return matchesSearch && matchesSubject;
  });

  const handleExportCSV = () => {
    if (filteredDueFees.length === 0) return;

    const headers = [
      'Student Name',
      'Roll Number / ID',
      'Subject / Course',
      'Class',
      'Assessed Due Amount (INR)',
      'Purpose / Remarks',
      'Assessed Date'
    ];

    const rows = filteredDueFees.map(fee => {
      const student = students.find(s => s.id === fee.studentId);
      const d = fee.date ? new Date(fee.date) : new Date();
      const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(fee.date || '');
      return [
        student?.name || 'Unknown Student',
        student?.rollNumber || 'N/A',
        student?.subject || 'N/A',
        student?.class || 'N/A',
        fee.amount || 0,
        fee.remarks || '',
        dateStr
      ];
    });

    const escapeCell = (cell: string | number | undefined | null) => {
      if (cell === undefined || cell === null) return '""';
      const str = String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows.map(row => row.map(escapeCell).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `utc_due_fees_report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount) return;

    if (editingId) {
      updateDueFee({
        id: editingId,
        studentId: formData.studentId,
        amount: Number(formData.amount),
        remarks: formData.remarks,
        date: new Date().toISOString()
      });
      setEditingId(null);
    } else {
      addDueFee({
        studentId: formData.studentId,
        amount: Number(formData.amount),
        remarks: formData.remarks
      });
    }

    setFormData({ studentId: '', amount: '', remarks: '' });
    setIsAdding(false);
  };

  const handleEdit = (fee: any) => {
    setFormData({
      studentId: fee.studentId,
      amount: fee.amount.toString(),
      remarks: fee.remarks
    });
    setEditingId(fee.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-red-400/20 text-red-400 rounded-xl">
             <AlertCircle size={24} />
           </div>
           <div>
             <h3 className="font-black text-xl text-white tracking-tight">Due Fees Management</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Track and manage student pending payments</p>
           </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleExportCSV}
            disabled={filteredDueFees.length === 0}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            title="Export filtered due fees to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="indigo-button px-8 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
            >
              <Plus size={15} /> Add New Due
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-[40px] border border-white/5 p-10 mb-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {editingId ? 'Edit Due Record' : 'Record New Due'}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ studentId: '', amount: '', remarks: '' });
                }}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SearchableSelect 
                  options={approvedOptions}
                  value={formData.studentId}
                  onChange={(val) => setFormData({...formData, studentId: val})}
                  label="Select Student"
                  placeholder="Search approved student..."
                />

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    className="input-glass w-full py-4 rounded-2xl"
                    placeholder="e.g. 1500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Remarks / Purpose</label>
                <textarea
                  required
                  rows={2}
                  className="input-glass w-full py-4 rounded-2xl resize-none"
                  placeholder="e.g. Monthly fee for May"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!formData.studentId}
                  className="indigo-button w-full md:w-auto px-10 py-4 text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingId ? 'Update Due Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or remarks..."
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 focus:border-indigo-500/50 transition-all text-sm"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-glass w-full py-4 px-6 rounded-2xl border-white/5 appearance-none text-sm"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="" className="bg-slate-900 text-slate-300">All Subjects / Courses</option>
            {subjects.map(subject => (
              <option key={`due-subj-${subject}`} value={subject} className="bg-slate-900 text-slate-300">{subject}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-10 py-6">Student</th>
                <th className="px-10 py-6">Amount</th>
                <th className="px-10 py-6">Purpose</th>
                <th className="px-10 py-6">Date</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {filteredDueFees.length > 0 ? (
                filteredDueFees.map((fee, idx) => {
                  const student = students.find(s => s.id === fee.studentId);
                  return (
                    <motion.tr 
                      key={fee.id ? `due-fee-${fee.id}` : `due-fee-idx-${idx}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black text-sm border border-orange-500/20 group-hover:scale-110 transition-transform">
                            {student?.name.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight leading-none mb-1.5">{student?.name || 'Unknown Student'}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{student?.rollNumber || 'N/A'}</span>
                               {student?.subject && (
                                 <span className="text-[8px] font-black bg-white/5 text-slate-400 px-1 py-0.5 rounded uppercase tracking-tighter">{student.subject}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-black text-rose-400 text-lg">
                         ₹{fee.amount.toLocaleString()}
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-slate-300 font-bold">{fee.remarks}</span>
                      </td>
                      <td className="px-10 py-6 text-slate-400 font-bold tracking-tighter">
                        {new Date(fee.date).toLocaleDateString()}
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-end space-x-3">
                          {confirmDeleteId === fee.id ? (
                            <div className="flex items-center bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/20 animate-pulse">
                              <button 
                                onClick={() => {
                                  deleteDueFee(fee.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[9px] font-black bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[9px] font-black text-slate-400 px-3 py-1.5 hover:text-white uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEdit(fee)}
                                className="p-2.5 text-indigo-400 hover:bg-white/5 rounded-xl transition-all"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4.5 h-4.5" />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setConfirmDeleteId(fee.id);
                                }}
                                className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-white/5 rounded-xl transition-all"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center">
                      {dueFees.length === 0 ? (
                        <>
                          <CheckCircle className="w-12 h-12 text-emerald-500/20 mb-4 animate-bounce" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">No pending due fees found</p>
                          <p className="text-xs text-slate-600">All students are up to date with their payments</p>
                        </>
                      ) : (
                        <>
                          <Search className="w-12 h-12 text-slate-500/20 mb-4" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">No matching records</p>
                          <p className="text-xs text-slate-600">Try adjusting your filters or search query</p>
                        </>
                      )}
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

export default AdminDueFees;
