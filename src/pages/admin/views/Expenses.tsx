import React, { useState, useMemo } from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { Wallet, Plus, Trash2, Calendar, X, Search, Filter } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';

export default function ExpenseManagement() {
  const { expenses, addExpense, deleteExpense } = useStorage();
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Others',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = ['Electricity', 'Rent', 'Salary', 'Others'];

  const availableMonths = useMemo(() => {
    const months = expenses.map(e => {
      // Extract YYYY-MM from YYYY-MM-DD
      return e.date.substring(0, 7);
    });
    return Array.from(new Set(months)).sort((a, b) => String(b).localeCompare(String(a)));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = 
        !searchTerm || 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || e.category === categoryFilter;
      const matchesMonth = !monthFilter || e.date.startsWith(monthFilter);
      
      return matchesSearch && matchesCategory && matchesMonth;
    }).slice().reverse();
  }, [expenses, searchTerm, categoryFilter, monthFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    
    addExpense({
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category as any,
      date: newExpense.date,
      description: newExpense.description
    });
    
    setShowAdd(false);
    setNewExpense({ title: '', amount: '', category: 'Others', date: new Date().toISOString().split('T')[0], description: '' });
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteExpense(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
       <div className="flex justify-between items-center bg-white/5 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
             <Wallet size={24} />
           </div>
           <div>
             <h3 className="font-black text-xl text-white tracking-tight">Financial Outflow</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Track institutional expenses</p>
           </div>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white rounded-2xl px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
        >
          Add Expense
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 focus:border-indigo-500/50 transition-all text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-glass w-full py-4 pl-14 rounded-2xl border-white/5 appearance-none text-sm"
          >
            <option value="" className="bg-slate-900">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c} className="bg-slate-900">{c}</option>
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
            <option value="" className="bg-slate-900">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month} className="bg-slate-900">{month}</option>
            ))}
          </select>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="glass rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 bg-rose-600 text-white flex justify-between items-center shadow-lg">
              <h2 className="text-2xl font-black tracking-tight uppercase">New Expense</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Expense Title</label>
                <input 
                  required
                  type="text" 
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                  className="input-glass w-full py-4 rounded-2xl"
                  placeholder="e.g. Server Bill, Office Rent"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="input-glass w-full py-4 rounded-2xl"
                    placeholder="2500"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
                  <select 
                    required
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="input-glass w-full py-4 rounded-2xl appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Date</label>
                <input 
                  required
                  type="date" 
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="input-glass w-full py-4 rounded-2xl"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all"
              >
                Record Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History */}
      <div className="grid gap-6">
        {filteredExpenses.map(e => (
          <div key={e.id} className="glass p-8 rounded-[40px] flex items-center justify-between group hover:bg-white/10 transition-all border border-white/5">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center font-black border border-rose-500/20 group-hover:scale-110 transition-transform">
                <TrendingDown size={32} />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="font-black text-2xl tracking-tighter text-white">{e.title}</h3>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1.5 bg-white/5 text-slate-400 rounded-lg border border-white/10">
                    {e.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                  <span className="flex items-center gap-2 italic"><Calendar size={12} className="text-indigo-500" /> {safeFormat(e.date, 'dd MMMM yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-4xl font-black text-rose-400 tracking-tighter">₹{e.amount}</span>
              <button 
                onClick={() => handleDelete(e.id)}
                className={`p-4 flex items-center gap-2 rounded-2xl transition-all border ${
                  confirmDeleteId === e.id 
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 opacity-100' 
                    : 'text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 border-transparent hover:border-rose-500/20'
                }`}
              >
                <Trash2 size={24} />
                {confirmDeleteId === e.id && (
                  <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
                    Confirm?
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="py-24 text-center glass rounded-[60px] border-2 border-dashed border-white/5">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Wallet size={32} className="text-slate-700" />
             </div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
               {expenses.length === 0 ? "Expense records are currently empty." : "No matching expenses found."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

const TrendingDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 17-8.5-8.5L9 13l-7-7"/><path d="M16 17h6v-6"/></svg>
);
