"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getFinanceTransactions,
  getFinanceSummary,
  getEmployeeSalaries,
  getCurrentUser,
} from '@/lib/api';
import { FINANCE_CONSOLE_ROLES } from '@/lib/rbac';
import {
  Calendar,
  Search,
  Filter,
  Loader2,
  Clock,
  MoreHorizontal,
  Landmark,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Wallet,
  Users,
} from 'lucide-react';

function formatPKR(n) {
  if (n == null || Number.isNaN(Number(n))) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function topCategories(map, limit = 3) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default function FinanceDashboard() {
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (!cancelled) setProfile(user);
      if (!FINANCE_CONSOLE_ROLES.includes(user?.role)) {
        setLoading(false);
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const [transData, summaryData, salaryData] = await Promise.all([
          getFinanceTransactions({ monthYear: monthFilter }),
          getFinanceSummary(monthFilter),
          getEmployeeSalaries(monthFilter),
        ]);
        if (!cancelled) {
          setTransactions(transData);
          setSummary(summaryData);
          setSalaries(salaryData);
        }
      } catch (error) {
        console.error('Error fetching finance data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [monthFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.transaction_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  const incomeBreakdown = useMemo(() => topCategories(summary?.byCategoryIncome, 3), [summary]);
  const expenseBreakdown = useMemo(() => topCategories(summary?.byCategoryExpense, 3), [summary]);

  const payrollNet = useMemo(
    () => salaries.reduce((sum, r) => sum + parseFloat(r.net_salary || 0), 0),
    [salaries]
  );

  const recoveryPct = useMemo(() => {
    const inc = summary?.totalIncome || 0;
    const pend = summary?.pendingIncome || 0;
    const denom = inc + pend;
    if (!denom) return null;
    return Math.min(100, Math.round((inc / denom) * 100));
  }, [summary]);

  const exportCsv = () => {
    const rows = [
      ['date', 'type', 'category', 'amount', 'status', 'description'].join(','),
      ...filteredTransactions.map((t) =>
        [
          t.transaction_date || '',
          t.transaction_type || '',
          `"${(t.category || '').replace(/"/g, '""')}"`,
          t.amount ?? '',
          t.status || '',
          `"${(t.description || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-ledger-${monthFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!FINANCE_CONSOLE_ROLES.includes(profile?.role)) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-10 rounded-[2rem] border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 text-center space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Restricted</p>
        <h2 className="text-2xl font-light text-slate-950 dark:text-white">Finance console</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your role does not include billing, payroll, or fee operations. Contact the principal or administrator.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in dark:text-slate-200 text-slate-950">
      <div className="flex flex-wrap gap-3 justify-end">
        <Link
          href="/dashboard/challans"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-white/5"
        >
          Fee challans (by class)
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 font-medium">
            Finance • Fees • Payroll
          </p>
          <h1 className="text-4xl font-light text-slate-950 dark:text-white tracking-tight mt-1">
            Financials & billing
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-light">
            Live totals from your finances and employee_salaries tables for the selected month.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 px-4 py-3 border border-slate-100 dark:border-white/10 rounded-xl text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-sm">
            <Calendar size={14} />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent outline-none font-mono text-[12px]"
            />
          </label>
          <button
            type="button"
            onClick={() => alert('Connect challan templates: create rows in a fee_challans table or PDF worker next.')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
          >
            <FileText size={14} /> Fee challan
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 px-5 py-3 border border-slate-100 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'ledger', label: 'Ledger' },
          { id: 'payroll', label: 'Payroll' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-slate-950 dark:bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Completed income ({monthFilter})
                </p>
                <div className="flex items-end gap-4 mt-2 flex-wrap">
                  <h2 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter">
                    {formatPKR(summary?.totalIncome ?? 0)}
                  </h2>
                  <span
                    className={`text-[11px] font-black flex items-center gap-1 mb-2 ${
                      (summary?.netPosition ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {(summary?.netPosition ?? 0) >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    Net {formatPKR(summary?.netPosition ?? 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                {(incomeBreakdown.length ? incomeBreakdown : [['No income rows', 0]]).map(([label, value]) => (
                  <FinanceSubStat key={label} label={label} value={formatPKR(value)} />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-950 dark:from-indigo-950 to-indigo-950 dark:to-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-900/20">
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (recoveryPct ?? 0)) / 100}
                    className="text-indigo-400 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-light">{recoveryPct != null ? `${recoveryPct}%` : '—'}</span>
                  <span className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold">
                    Income cleared
                  </span>
                </div>
              </div>
              <p className="text-slate-300 text-xs font-medium">Completed vs pending fee recognition</p>
              <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-bold">
                Pending income {formatPKR(summary?.pendingIncome ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-light text-slate-800 dark:text-white">Expense categories</h3>
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Total out {formatPKR(summary?.totalExpenses ?? 0)}
                </span>
              </div>
              <div className="space-y-6">
                {(expenseBreakdown.length ? expenseBreakdown : [['No expense rows', 0]]).map(([label, value]) => (
                  <ExpenseItem
                    key={label}
                    label={label}
                    amount={formatPKR(value)}
                    color="bg-indigo-600"
                    percent={Math.min(100, summary?.totalExpenses ? Math.round((value / summary.totalExpenses) * 100) : 0)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex justify-between items-center">
                  Payroll snapshot <MoreHorizontal size={16} className="text-slate-300 dark:text-slate-600" />
                </h3>
                <div className="flex items-center gap-4 mb-6 text-slate-600 dark:text-slate-300">
                  <Users size={22} className="text-indigo-500" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Net salaries</p>
                    <p className="text-2xl font-light text-slate-950 dark:text-white">{formatPKR(payrollNet)}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">{salaries.length} record(s) for {monthFilter}</p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[2.5rem] p-8 flex items-center gap-5">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Landmark size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-indigo-400 dark:text-indigo-300 tracking-widest flex items-center gap-2">
                    <Wallet size={12} /> Cash posture
                  </p>
                  <h4 className="text-xl font-light text-indigo-900 dark:text-indigo-100 tracking-tight">
                    {formatPKR(summary?.netPosition ?? 0)}
                  </h4>
                  <p className="text-[10px] text-indigo-400/80 mt-1">Income − expenses (completed)</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 dark:border-white/5 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
            <h3 className="text-xl font-light text-slate-800 dark:text-white">Ledger</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-3 text-slate-300 dark:text-slate-600" size={14} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-[220px] pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-[11px] font-medium outline-none focus:ring-1 ring-indigo-200 dark:ring-indigo-500/30 dark:text-slate-300"
                  placeholder="Search description or category..."
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <button
                type="button"
                className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Filters use search + type"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-full table-auto">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <th className="px-4 py-4 sm:px-6">Date</th>
                  <th className="px-4 py-4 sm:px-6">Category / description</th>
                  <th className="px-4 py-4 sm:px-6">Type</th>
                  <th className="px-4 py-4 sm:px-6">Amount</th>
                  <th className="px-4 py-4 sm:px-6">Status</th>
                  <th className="px-4 py-4 sm:px-6 text-right">Recorded by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5 text-sm">
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 sm:px-6 text-center text-slate-400 text-[13px]">
                      No finance rows for this month. Insert into `finances` in Supabase to populate.
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400">
                    <td className="px-4 py-4 sm:px-6 font-mono text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {t.transaction_date || '—'}
                    </td>
                    <td className="px-4 py-4 sm:px-6 break-words">
                      <p className="font-bold text-slate-950 dark:text-slate-200 text-xs">{t.category || 'Uncategorized'}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{t.description || '—'}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6 font-medium text-[11px] capitalize">{t.transaction_type}</td>
                    <td className="px-4 py-4 sm:px-6 font-bold text-slate-950 dark:text-slate-200">{formatPKR(t.amount)}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter ${
                          t.status === 'completed'
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        {t.status === 'completed' ? (
                          <>
                            <CheckCircle2 size={12} /> Done
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> {t.status || 'pending'}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-right text-xs text-slate-500 break-words">
                      {t.recorded_by?.full_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 dark:border-white/5 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-light text-slate-800 dark:text-white">Payroll register</h3>
              <p className="text-[11px] text-slate-400 mt-2">Mapped from `employee_salaries` for {monthFilter}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Net {formatPKR(payrollNet)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-full table-auto">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <th className="px-4 py-4 sm:px-6">Staff</th>
                  <th className="px-4 py-4 sm:px-6">Basic</th>
                  <th className="px-4 py-4 sm:px-6">Allowances</th>
                  <th className="px-4 py-4 sm:px-6">Deductions</th>
                  <th className="px-4 py-4 sm:px-6">Net</th>
                  <th className="px-4 py-4 sm:px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5 text-sm">
                {salaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 sm:px-6 text-center text-slate-400 text-[13px]">
                      No payroll rows for this month.
                    </td>
                  </tr>
                )}
                {salaries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 sm:px-6">
                      <p className="font-bold text-slate-950 dark:text-slate-200 text-xs">{row.employee?.full_name || 'Staff'}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.employee?.role || '—'}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-400">{formatPKR(row.basic_salary)}</td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-400">{formatPKR(row.allowances)}</td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-400">{formatPKR(row.deductions)}</td>
                    <td className="px-4 py-4 sm:px-6 font-bold text-slate-950 dark:text-slate-200">{formatPKR(row.net_salary)}</td>
                    <td className="px-4 py-4 sm:px-6 text-right">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">
                        {row.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceSubStat({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <h4 className="text-xl font-light text-slate-700 dark:text-slate-300">{value}</h4>
    </div>
  );
}

function ExpenseItem({ label, amount, color, percent }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end font-bold uppercase tracking-widest text-[10px]">
        <span className="text-slate-400 dark:text-slate-500">{label}</span>
        <span className="text-slate-800 dark:text-slate-200">{amount}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
        <div style={{ width: `${percent}%` }} className={`h-full ${color} rounded-full`} />
      </div>
    </div>
  );
}
