import React from 'react';
import { useStorage } from '../../../hooks/useStorage';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Download, FileSpreadsheet } from 'lucide-react';
import { safeFormat } from '../../../lib/utils';

export default function AccountManagement() {
  const { fees, expenses, students } = useStorage();

  const totalIncome = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const handleExportCSV = () => {
    // Combine fees (Income) and expenses (Expense) into a unified ledger sorted chronologically
    const incomeRecords = fees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      return {
        date: f.date || '',
        type: 'CREDIT (INCOME)',
        particulars: `Fee Collection - ${student?.name || 'Student'} (${f.month || ''})`,
        partyOrCategory: student?.name ? `${student.name} (${student.rollNumber || 'ID'})` : 'Student Fee',
        income: f.amount || 0,
        expense: 0
      };
    });

    const expenseRecords = expenses.map(e => ({
      date: e.date || '',
      type: 'DEBIT (EXPENSE)',
      particulars: e.description ? `${e.title || 'Expense'} - ${e.description}` : (e.title || 'Expense'),
      partyOrCategory: e.category || 'Others',
      income: 0,
      expense: e.amount || 0
    }));

    const allTransactions = [...incomeRecords, ...expenseRecords].sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateA - dateB;
    });

    let running = 0;
    const rowsWithBalance = allTransactions.map(t => {
      running += (t.income - t.expense);
      return [
        safeFormat(t.date, 'yyyy-MM-dd') || t.date,
        t.type,
        t.particulars,
        t.partyOrCategory,
        t.income > 0 ? t.income : 0,
        t.expense > 0 ? t.expense : 0,
        running
      ];
    });

    const headers = [
      'Date',
      'Transaction Type',
      'Particulars / Description',
      'Student / Category',
      'Credit / Income (INR)',
      'Debit / Expense (INR)',
      'Running Balance (INR)'
    ];

    const escapeCell = (cell: string | number | undefined | null) => {
      if (cell === undefined || cell === null) return '""';
      const str = String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const summaryHeader = [
      ['UTC Computra - Account Statement & Financial Ledger'],
      [`Statement Generated: ${safeFormat(new Date(), 'dd MMMM yyyy HH:mm')}`],
      [`Total Collections (INR): ${totalIncome}`, `Total Expenses (INR): ${totalExpenses}`, `Net Cash Balance (INR): ${balance}`],
      []
    ];

    const csvContent = '\uFEFF' + [
      ...summaryHeader.map(r => r.map(escapeCell).join(',')),
      headers.map(escapeCell).join(','),
      ...rowsWithBalance.map(row => row.map(escapeCell).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `utc_account_statement_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-black text-xl text-white tracking-tight">Account Statement</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Comprehensive institutional ledger & cash flow</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={fees.length === 0 && expenses.length === 0}
            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            title="Export complete account statement and transaction ledger to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass p-10 rounded-[40px] bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20">
            <TrendingUp size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total Collections</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">₹{totalIncome}</h3>
        </div>

        <div className="glass p-10 rounded-[40px] bg-gradient-to-br from-rose-500/10 to-transparent">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20">
            <TrendingDown size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total Expenses</p>
          <h3 className="text-4xl font-black text-rose-400 tracking-tighter">₹{totalExpenses}</h3>
        </div>

        <div className={`glass p-10 rounded-[40px] bg-gradient-to-br ${balance >= 0 ? 'from-indigo-500/20' : 'from-rose-500/20'} to-transparent relative overflow-hidden`}>
          <div className={`w-14 h-14 ${balance >= 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} rounded-3xl flex items-center justify-center mb-6 border`}>
            <DollarSign size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Net Cash Balance</p>
          <h3 className="text-4xl font-black text-white tracking-tighter">₹{balance}</h3>
          <div className="absolute top-0 right-0 p-4">
             <div className={`w-2 h-2 rounded-full ${balance >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-bounce'}`}></div>
          </div>
        </div>
      </div>

      {/* Finance Logs */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[40px]">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-400" /> Revenue Stream
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {fees.slice().reverse().map((f, i) => (
              <div key={`${f.id}-${i}`} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                <div>
                  <p className="text-xs font-black text-white">{f.month}</p>
                  <p className="text-[9px] font-bold text-slate-500">Recieved on {safeFormat(f.date, 'dd MMM yyyy')}</p>
                </div>
                <p className="text-lg font-black text-emerald-400">+₹{f.amount}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[40px]">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
            <Wallet size={16} className="text-rose-400" /> Spending Logs
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {expenses.slice().reverse().map((e, i) => (
              <div key={`${e.id}-${i}`} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                <div>
                  <p className="text-xs font-black text-white">{e.title}</p>
                  <p className="text-[9px] font-bold text-slate-500">{e.category} • {safeFormat(e.date, 'dd MMM yyyy')}</p>
                </div>
                <p className="text-lg font-black text-rose-400">-₹{e.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        .custom-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}


