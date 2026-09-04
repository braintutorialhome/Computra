import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { CreditCard, Plus, X, Trash2, Search, Filter, Calendar, Download } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';
import { exportCsvFile } from '../../../lib/downloadHelper';
import SearchableSelect from '../../../components/ui/SearchableSelect';

export default function FeeManagement() {
  const { students, fees, addFee, deleteFee } = useStorage();
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const [newFee, setNewFee] = useState({
    studentId: '',
    amount: '',
    month: safeFormat(new Date(), 'MMMM yyyy'),
    date: new Date().toISOString().split('T')[0]
  });

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
  
  const subjects = useMemo(() => Array.from(new Set(students.map(s => String(s.subject || '').trim()).filter(Boolean))), [students]);
  
  const availableMonths = useMemo(() => {
    const months = fees.map(f => String(f.month || '').trim()).filter(Boolean);
    return Array.from(new Set(months)).sort((a, b) => {
      const monthA = String(a);
      const monthB = String(b);
      // Sort by date if possible, otherwise alphabetical
      try {
        return new Date(monthB).getTime() - new Date(monthA).getTime();
      } catch {
        return monthB.localeCompare(monthA);
      }
    });
  }, [fees]);

  const filteredFees = useMemo(() => {
    return fees.filter(f => {
      const student = students.find(s => s.id === f.studentId);
      const sName = String(student?.name || '').toLowerCase();
      const sRoll = String(student?.rollNumber || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = 
        !searchTerm || 
        sName.includes(search) || 
        sRoll.includes(search);
      
      const matchesSubject = !subjectFilter || student?.subject === subjectFilter;
      const matchesMonth = !monthFilter || f.month === monthFilter;
      
      return matchesSearch && matchesSubject && matchesMonth;
    }).slice().reverse();
  }, [fees, students, searchTerm, subjectFilter, monthFilter]);

  const handleExportCSV = () => {
    if (filteredFees.length === 0) return;

    const headers = [
      'Student Name',
      'Roll Number / ID',
      'Subject / Course',
      'Class',
      'Billing Term / Month',
      'Amount (INR)',
      'Payment Date',
      'Status'
    ];

    const rows = filteredFees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      return [
        student?.name || 'Unknown',
        student?.rollNumber || 'N/A',
        student?.subject || 'N/A',
        student?.class || 'N/A',
        f.month || '',
        f.amount || 0,
        safeFormat(f.date, 'yyyy-MM-dd') || f.date || '',
        (f.status || 'paid').toUpperCase()
      ];
    });

    const escapeCell = (cell: string | number | undefined | null) => {
      if (cell === undefined || cell === null) return '""';
      const str = String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csvContent = [headers.map(escapeCell).join(','), ...rows.map(row => row.map(escapeCell).join(','))].join('\r\n');
    exportCsvFile(csvContent, `utc_fees_collections_${safeFormat(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.studentId || !newFee.amount) return;
    
    addFee({
      studentId: newFee.studentId,
      amount: parseFloat(newFee.amount),
      month: newFee.month,
      date: newFee.date,
      status: 'paid'
    });
    
    setShowAdd(false);
    setNewFee({ studentId: '', amount: '', month: safeFormat(new Date(), 'MMMM yyyy'), date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
             <CreditCard size={24} />
           </div>
           <div>
             <h3 className="font-black text-xl text-white tracking-tight">Fee Collections</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manage and track revenues</p>
           </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleExportCSV}
            disabled={filteredFees.length === 0}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            title="Export filtered collections to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="indigo-button px-8 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
          >
            <Plus size={15} /> Collect Fee
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 focus:border-indigo-500/50 transition-all text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 appearance-none text-sm"
          >
            <option value="" className="bg-slate-900">All Subjects / Courses</option>
            {subjects.map(subject => (
              <option key={`subject-${subject}`} value={subject} className="bg-slate-900">{subject}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 appearance-none text-sm"
          >
            <option value="" className="bg-slate-900">All Billing Months</option>
            {availableMonths.map(month => (
              <option key={`month-${month}`} value={month} className="bg-slate-900">{month}</option>
            ))}
          </select>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="glass rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
              <h2 className="text-2xl font-black tracking-tight uppercase">Collect Fee</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <SearchableSelect 
                options={approvedOptions}
                value={newFee.studentId}
                onChange={(val) => setNewFee({...newFee, studentId: val})}
                label="Select Student"
                placeholder="Search approved students..."
              />
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={newFee.amount}
                    onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                    className="input-glass w-full py-4 rounded-2xl"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Payment Date</label>
                  <input 
                    required
                    type="date" 
                    value={newFee.date}
                    onChange={(e) => setNewFee({...newFee, date: e.target.value})}
                    className="input-glass w-full py-4 rounded-2xl"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Billing Month</label>
                <input 
                  required
                  type="text" 
                  value={newFee.month}
                  onChange={(e) => setNewFee({...newFee, month: e.target.value})}
                  className="input-glass w-full py-4 rounded-2xl"
                  placeholder="e.g. April 2024"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-5 indigo-button text-xs font-black uppercase tracking-widest shadow-2xl"
              >
                Confirm Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recent Collections Table */}
      <div className="glass rounded-[40px] overflow-hidden border border-white/5">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-black text-white tracking-tight uppercase">Collection Stream</h3>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-400/20">{filteredFees.length} Shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-10 py-6">Student ID / Name</th>
                <th className="px-10 py-6">Billing Term</th>
                <th className="px-10 py-6">Paid On</th>
                <th className="px-10 py-6">Value</th>
                <th className="px-10 py-6 text-right">Status</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredFees.map((f, idx) => {
                const student = students.find(s => s.id === f.studentId);
                return (
                  <tr key={f.id ? `fee-stream-${f.id}` : `fee-idx-${idx}`} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black text-sm border border-orange-500/20 group-hover:scale-110 transition-transform">
                           {student?.name.charAt(0) || '?'}
                         </div>
                         <div>
                           <p className="font-bold text-white tracking-tight">{student?.name || 'Unknown'}</p>
                           <div className="flex items-center gap-2">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{student?.rollNumber}</p>
                             {student?.subject && (
                               <span className="text-[8px] font-black bg-white/5 text-slate-400 px-1 py-0.5 rounded uppercase tracking-tighter">
                                 {student.subject}
                               </span>
                             )}
                           </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 font-bold text-slate-300 tracking-tight">{f.month}</td>
                    <td className="px-10 py-6 font-bold text-slate-400 tracking-tighter">{safeFormat(f.date, 'dd MMM yyyy')}</td>
                    <td className="px-10 py-6 font-black text-emerald-400 text-lg">₹{f.amount}</td>
                    <td className="px-10 py-6 text-right">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        {f.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this fee record?')) {
                            deleteFee(f.id);
                          }
                        }}
                        className="p-3 text-slate-700 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredFees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                      {fees.length === 0 ? "Waiting for first collection..." : "No matching collections found"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
