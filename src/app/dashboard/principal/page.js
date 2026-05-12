"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getPrincipalStats,
  getCurriculumProgress,
  getFinanceSummary,
  getEmployeeRecords,
  getSchoolActivities
} from '@/lib/api';
import {
  Building2, Users2, BarChart3, TrendingUp, BookOpen, DollarSign,
  Calendar, ClipboardCheck, AlertCircle, Eye, EyeOff, Loader2
} from 'lucide-react';

export default function PrincipalDashboard() {
  const [stats, setStats] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [finance, setFinance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('overview');

  useEffect(() => {
    const fetchPrincipalData = async () => {
      try {
        const [statsData, currData, finData, empData, actData] = await Promise.all([
          getPrincipalStats(),
          getCurriculumProgress(),
          getFinanceSummary(),
          getEmployeeRecords(),
          getSchoolActivities()
        ]);

        setStats(statsData);
        setCurriculum(currData);
        setFinance(finData);
        setEmployees(empData);
        setActivities(actData);
      } catch (error) {
        console.error('Error fetching principal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrincipalData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in dark:text-slate-200">
      
      {/* ============ HEADER ============ */}
      <div className="border-b border-slate-100 dark:border-white/5 pb-12">
        <h1 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          Principal Portal
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-4">
          Institutional Oversight & Analytics
        </p>
      </div>

      {/* ============ MASTER STATS GRID ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          icon={<Users2 size={20} />}
          label="Total Students"
          value={stats?.totalStudents || 0}
          trend="+12%"
          color="indigo"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Faculty Members"
          value={stats?.totalTeachers || 0}
          trend="+3%"
          color="emerald"
        />
        <StatCard
          icon={<Building2 size={20} />}
          label="Active Classes"
          value={stats?.totalClasses || 0}
          trend="Stable"
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Fee income (completed)"
          value={new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(finance?.totalIncome || 0)}
          trend="From finances table"
          color="rose"
        />
      </div>

      {/* ============ FINANCIAL OVERVIEW ============ */}
      <Section
        title="Financial Dashboard"
        isExpanded={expandedSection === 'finance'}
        onToggle={() => setExpandedSection('finance')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FinanceBox
            label="Total Income"
            amount={finance?.totalIncome || 0}
            type="income"
          />
          <FinanceBox
            label="Total Expenses"
            amount={finance?.totalExpenses || 0}
            type="expense"
          />
          <FinanceBox
            label="Net Balance"
            amount={(finance?.totalIncome || 0) - (finance?.totalExpenses || 0)}
            type="balance"
          />
        </div>

        {/* Expense Breakdown */}
        <div className="mt-8 p-8 bg-white dark:bg-[#0A0C14] rounded-3xl border border-slate-100 dark:border-white/5">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">
            Expense Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(finance?.byCategoryExpense || {}).map(([category, amount]) => (
              <ExpenseRow
                key={category}
                label={category.replace(/_/g, ' ')}
                amount={amount}
                total={finance?.totalExpenses}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ============ CURRICULUM PROGRESS ============ */}
      <Section
        title="Curriculum Progress Tracking"
        isExpanded={expandedSection === 'curriculum'}
        onToggle={() => setExpandedSection('curriculum')}
      >
        <div className="space-y-6">
          {curriculum.length > 0 ? (
            curriculum.map((item) => (
              <CurriculumProgressBar
                key={item.id}
                className={item.classes?.name}
                subject={item.subjects?.name}
                coordinator={item.coordinator?.full_name}
                percentage={item.completion_percentage || 0}
                status={item.status}
              />
            ))
          ) : (
            <p className="text-slate-400">No curriculum data available</p>
          )}
        </div>
      </Section>

      {/* ============ EMPLOYEE DIRECTORY ============ */}
      <Section
        title="Employee Directory"
        isExpanded={expandedSection === 'employees'}
        onToggle={() => setExpandedSection('employees')}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-white/10">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="text-left py-4 px-6">Name</th>
                <th className="text-left py-4 px-6">Email</th>
                <th className="text-left py-4 px-6">Role</th>
                <th className="text-left py-4 px-6">Department</th>
                <th className="text-left py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6 text-slate-900 dark:text-white font-medium">
                    {emp.full_name}
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {emp.email}
                  </td>
                  <td className="py-4 px-6">
                    <RoleBadge role={emp.role} />
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                    {emp.teacher_department || '-'}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={emp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============ RECENT ACTIVITIES ============ */}
      <Section
        title="School Activity Feed"
        isExpanded={expandedSection === 'activities'}
        onToggle={() => setExpandedSection('activities')}
      >
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <p className="text-slate-400">No recent activities</p>
          )}
        </div>
      </Section>
    </div>
  );
}

// ============ COMPONENTS ============

function StatCard({ icon, label, value, trend, color }) {
  const colorClasses = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
  };

  return (
    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl hover:shadow-lg dark:hover:shadow-none transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-light text-slate-950 dark:text-white tracking-tight">
          {value}
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          {trend}
        </span>
      </div>
    </div>
  );
}

function FinanceBox({ label, amount, type }) {
  const typeClasses = {
    income: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    expense: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    balance: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className={`p-8 rounded-3xl border border-slate-100 dark:border-white/5 ${typeClasses[type]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4">
        {label}
      </p>
      <h3 className="text-3xl font-light tracking-tight">
        ${(amount / 1000).toFixed(2)}K
      </h3>
    </div>
  );
}

function Section({ title, isExpanded, onToggle, children }) {
  return (
    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-6 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em]">
          {title}
        </h2>
        <Eye size={18} className={`transition-transform text-slate-400 dark:text-slate-600 ${isExpanded ? 'opacity-100' : 'opacity-50'}`} />
      </button>
      {isExpanded && children}
    </div>
  );
}

function ExpenseRow({ label, amount, total }) {
  const pct = total ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400 capitalize">
          {label}
        </span>
        <span className="font-medium text-slate-900 dark:text-white">
          ${(amount / 1000).toFixed(2)}K ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CurriculumProgressBar({ className, subject, coordinator, percentage, status }) {
  const statusColor = {
    'on_track': 'text-emerald-600 dark:text-emerald-400',
    'behind': 'text-rose-600 dark:text-rose-400',
    'ahead': 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
            {className} - {subject}
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">Lead: {coordinator}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor[status] || ''}`}>
          {status?.replace('_', ' ')}
        </span>
      </div>
      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-2">{percentage}% Complete</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const roleColors = {
    teacher: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    coordinator: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    finance: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    admin: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest ${roleColors[role] || ''}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusColors = {
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    inactive: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400',
    suspended: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest ${statusColors[status] || ''}`}>
      {status}
    </span>
  );
}

function ActivityItem({ activity }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
      <div className="flex items-start gap-4">
        <AlertCircle size={16} className="text-indigo-500 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-900 dark:text-white font-medium line-clamp-2">
            {activity.title}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {new Date(activity.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
