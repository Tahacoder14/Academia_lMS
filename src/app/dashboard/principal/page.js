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
  Calendar, ClipboardCheck, AlertCircle, Loader2
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-8">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Principal Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Institutional Oversight & Leadership Dashboard</p>
      </div>

      {/* Master Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={<Users2 size={24} />}
          label="Total Students"
          value={stats?.totalStudents || 0}
          trend="+12% this month"
          color="indigo"
        />
        <StatCard
          icon={<BookOpen size={24} />}
          label="Faculty"
          value={stats?.totalTeachers || 0}
          trend="+3 new"
          color="emerald"
        />
        <StatCard
          icon={<Building2 size={24} />}
          label="Active Classes"
          value={stats?.totalClasses || 0}
          trend="On Track"
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={24} />}
          label="Monthly Income"
          value={`Rs. ${(finance?.totalIncome || 0).toLocaleString('en-PK')}`}
          trend="Completed"
          color="rose"
        />
      </div>

      {/* Financial Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-medium mb-6 flex items-center gap-3">
          <DollarSign size={20} className="text-emerald-600" />
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinanceBox label="Total Income" amount={finance?.totalIncome || 0} type="income" />
          <FinanceBox label="Total Expenses" amount={finance?.totalExpenses || 0} type="expense" />
          <FinanceBox 
            label="Net Balance" 
            amount={(finance?.totalIncome || 0) - (finance?.totalExpenses || 0)} 
            type="balance" 
          />
        </div>
      </div>

      {/* Curriculum Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-medium mb-6">Curriculum Progress</h2>
        <div className="space-y-6">
          {curriculum.length > 0 ? (
            curriculum.map((item) => (
              <CurriculumProgressBar
                key={item.id}
                className={item.classes?.name}
                subject={item.subjects?.name}
                percentage={item.completion_percentage || 0}
                status={item.status}
              />
            ))
          ) : (
            <p className="text-slate-400 py-8 text-center">No curriculum progress data available</p>
          )}
        </div>
      </div>

      {/* Employee Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden">
        <h2 className="text-lg font-medium mb-6">Employee Directory</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="border-b border-slate-100 dark:border-white/10">
              <tr className="text-xs uppercase tracking-widest text-slate-500">
                <th className="text-left py-4 px-6">Name</th>
                <th className="text-left py-4 px-6">Role</th>
                <th className="text-left py-4 px-6">Department</th>
                <th className="text-left py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-medium">{emp.full_name}</td>
                  <td className="py-4 px-6">
                    <RoleBadge role={emp.role} />
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-400">{emp.teacher_department || '—'}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={emp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function StatCard({ icon, label, value, trend, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3 mb-5 text-slate-600 dark:text-slate-400">
        {icon}
        <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-4xl font-light text-slate-900 dark:text-white">{value}</p>
      {trend && <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400">{trend}</p>}
    </div>
  );
}

function FinanceBox({ label, amount, type }) {
  const styles = {
    income: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    expense: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
    balance: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
  };

  return (
    <div className={`p-6 rounded-3xl border border-slate-100 dark:border-white/10 ${styles[type]}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-light">Rs. {amount.toLocaleString('en-PK')}</p>
    </div>
  );
}

function CurriculumProgressBar({ className, subject, percentage, status }) {
  return (
    <div className="p-6 border border-slate-200 dark:border-white/10 rounded-3xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{className}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{subject}</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
          {status}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-right mt-2 text-slate-500">{percentage}% Complete</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    teacher: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    coordinator: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    finance: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase ${colors[role] || 'bg-slate-100 dark:bg-slate-700'}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  };

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium uppercase ${colors[status] || ''}`}>
      {status}
    </span>
  );
}