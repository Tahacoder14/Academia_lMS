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
    return () => { cancelled = true; };
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!FINANCE_CONSOLE_ROLES.includes(profile?.role)) {
    return (
      <div className="max-w-md mx-auto mt-12 sm:mt-20 px-6 py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Access Restricted</p>
        <h2 className="text-2xl font-light mt-3">Finance Console</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4">
          Your role does not have permission to access financial tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10 pb-12 sm:pb-20">
      {/* Quick Link */}
      <div className="flex justify-end">
        <Link
          href="/dashboard/challans"
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          Fee Challans →
        </Link>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-6">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-500">Finance Console</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tighter text-slate-900 dark:text-white mt-1">
            Financials &amp; Billing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Live data for {monthFilter}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent outline-none font-mono"
            />
          </label>

          <button
            onClick={() => alert('Connect challan templates in future update')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-medium transition-all"
          >
            <FileText size={18} /> New Challan
          </button>

          <button
            onClick={exportCsv}
            className="px-5 py-3 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'ledger', label: 'Ledger' },
          { id: 'payroll', label: 'Payroll' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap rounded-t-2xl transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-white/10 -mb-px text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
            {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Income Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col">
              <div>
                <p className="uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400">Completed Income</p>
                <div className="flex items-end gap-3 mt-3 flex-wrap">
                  <h2 className="text-4xl sm:text-5xl font-light tracking-tighter text-slate-900 dark:text-white">
                    {formatPKR(summary?.totalIncome ?? 0)}
                  </h2>
                  <span className={`flex items-center gap-1 text-sm font-medium mb-1 ${
                    (summary?.netPosition ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {(summary?.netPosition ?? 0) >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {formatPKR(summary?.netPosition ?? 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                {(incomeBreakdown.length ? incomeBreakdown : [['No income data', 0]]).map(([label, value]) => (
                  <FinanceSubStat key={label} label={label} value={formatPKR(value)} />
                ))}
              </div>
            </div>

            {/* Recovery Rate Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-xl">
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-white/10" />
                  <circle
                    cx="80" cy="80" r="70"
                    stroke="currentColor"
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * (recoveryPct ?? 0)) / 100}
                    className="text-indigo-400 transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-light">{recoveryPct ?? '—'}%</span>
                  <span className="text-xs uppercase tracking-widest text-indigo-300 mt-1">Recovery Rate</span>
                </div>
              </div>
              <p className="text-sm text-white/70">Pending Income</p>
              <p className="text-xl font-light mt-1">{formatPKR(summary?.pendingIncome ?? 0)}</p>
            </div>
          </div>

          {/* Bottom Section - Expenses + Payroll */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Expense Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-medium">Expense Categories</h3>
                <span className="text-sm text-slate-500">Total Expenses: {formatPKR(summary?.totalExpenses ?? 0)}</span>
              </div>
              <div className="space-y-8">
                {(expenseBreakdown.length ? expenseBreakdown : [['No expense data', 0]]).map(([label, value]) => (
                  <ExpenseItem
                    key={label}
                    label={label}
                    amount={formatPKR(value)}
                    percent={summary?.totalExpenses ? Math.round((value / summary.totalExpenses) * 100) : 0}
                  />
                ))}
              </div>
            </div>

            {/* Payroll Snapshot */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col">
              <h3 className="uppercase text-xs tracking-widest text-slate-500 mb-6">Payroll Snapshot</h3>
              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                  <Users size={32} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-4xl font-light tracking-tight">{formatPKR(payrollNet)}</p>
                  <p className="text-sm text-slate-500">{salaries.length} employees • {monthFilter}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== LEDGER TAB ==================== */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
          {/* Filter Bar */}
          <div className="p-6 sm:p-8 border-b flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description or category..."
                className="w-full pl-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:border-indigo-500 outline-none text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-xs uppercase font-medium text-slate-500 bg-slate-50 dark:bg-slate-800 border-b">
                  <th className="px-6 py-5 text-left">Date</th>
                  <th className="px-6 py-5 text-left">Description</th>
                  <th className="px-6 py-5 text-left">Type</th>
                  <th className="px-6 py-5 text-left">Amount</th>
                  <th className="px-6 py-5 text-left">Status</th>
                  <th className="px-6 py-5 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      No transactions found for this month
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5 font-mono text-sm text-slate-500">{t.transaction_date || '—'}</td>
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-900 dark:text-white">{t.category || 'Uncategorized'}</p>
                        <p className="text-sm text-slate-500 line-clamp-1">{t.description || '—'}</p>
                      </td>
                      <td className="px-6 py-5 capitalize font-medium">{t.transaction_type}</td>
                      <td className="px-6 py-5 font-semibold">{formatPKR(t.amount)}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          t.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                        }`}>
                          {t.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          {t.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-sm text-slate-500">{t.recorded_by?.full_name || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== PAYROLL TAB ==================== */}
      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b flex justify-between items-center">
            <div>
              <h3 className="text-xl font-light">Payroll Register</h3>
              <p className="text-sm text-slate-500 mt-1">{monthFilter}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light">{formatPKR(payrollNet)}</p>
              <p className="text-xs text-slate-500">Net Payroll</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-medium text-slate-500 border-b">
                  <th className="px-6 py-5 text-left">Employee</th>
                  <th className="px-6 py-5 text-left">Basic Salary</th>
                  <th className="px-6 py-5 text-left">Allowances</th>
                  <th className="px-6 py-5 text-left">Deductions</th>
                  <th className="px-6 py-5 text-left">Net Salary</th>
                  <th className="px-6 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {salaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">No payroll data for this month</td>
                  </tr>
                ) : (
                  salaries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-medium">{row.employee?.full_name || 'Staff'}</p>
                        <p className="text-xs text-slate-500">{row.employee?.role || '—'}</p>
                      </td>
                      <td className="px-6 py-5">{formatPKR(row.basic_salary)}</td>
                      <td className="px-6 py-5">{formatPKR(row.allowances)}</td>
                      <td className="px-6 py-5">{formatPKR(row.deductions)}</td>
                      <td className="px-6 py-5 font-semibold text-lg">{formatPKR(row.net_salary)}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-xs font-medium uppercase tracking-widest text-emerald-600">{row.status || 'Processed'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function FinanceSubStat({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ExpenseItem({ label, amount, percent }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-medium">{amount}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}