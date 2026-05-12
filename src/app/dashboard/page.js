"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Building2,
  Users2,
  BarChart3,
  LayoutGrid,
  Clock,
  CheckCircle2,
  MessageSquare,
  Signal,
  Loader2,
  FileText,
  Wallet,
  GraduationCap,
  School,
  Receipt,
} from 'lucide-react';
import { getFinanceSummary, getCurrentUser } from '@/lib/api';

function formatPKR(n) {
  if (n == null || Number.isNaN(Number(n))) return 'PKR 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const[stats, setStats] = useState({ students: 0, faculty: 0, classes: 0 });
  const[financeMonth, setFinanceMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const month = useMemo(() => new Date().toISOString().slice(0, 7),[]);

  // Move all hooks above the conditional rendering
  const role = profile?.role || 'student';
  const isFinanceView =['superadmin', 'principal', 'admin', 'finance'].includes(role);
  const greeting = profile?.full_name?.split(' ')[0] || 'Member';

  const quickLinks = useMemo(() => {
    const base =[{ href: '/dashboard', label: 'Overview', icon: LayoutGrid }];
    if (role === 'student') {
      return[
        ...base,
        { href: '/dashboard/students', label: 'My learning', icon: GraduationCap },
        { href: '/dashboard/challans', label: 'Fee challan', icon: Receipt },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
        { href: '/dashboard/settings/profile', label: 'Profile', icon: Users2 },
      ];
    }
    if (role === 'teacher') {
      return[
        ...base,
        { href: '/dashboard/teacher', label: 'Teaching', icon: GraduationCap },
        { href: '/dashboard/attendance', label: 'Attendance', icon: CheckCircle2 },
        { href: '/dashboard/results', label: 'Results', icon: BarChart3 },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
      ];
    }
    if (role === 'coordinator') {
      return[
        ...base,
        { href: '/dashboard/academic', label: 'Academic', icon: FileText },
        { href: '/dashboard/coordinator', label: 'Coordinator', icon: Users2 },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { href: '/dashboard/attendance', label: 'Attendance', icon: CheckCircle2 },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
      ];
    }
    if (['principal', 'admin'].includes(role)) {
      return[
        ...base,
        { href: '/dashboard/principal', label: 'Leadership', icon: Building2 },
        { href: '/dashboard/academic', label: 'Academic', icon: FileText },
        { href: '/dashboard/financials', label: 'Financials', icon: Wallet },
        { href: '/dashboard/challans', label: 'Challans', icon: Receipt },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { href: '/dashboard/institutions', label: 'Institution', icon: School },
        { href: '/dashboard/users', label: 'Users', icon: Users2 },
      ];
    }
    if (role === 'finance') {
      return[
        ...base,
        { href: '/dashboard/financials', label: 'Financials', icon: Wallet },
        { href: '/dashboard/challans', label: 'Challans', icon: Receipt },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
      ];
    }
    if (role === 'superadmin') {
      return[
        ...base,
        { href: '/dashboard/superadmin', label: 'Superadmin', icon: Building2 },
        { href: '/dashboard/users', label: 'Users', icon: Users2 },
        { href: '/dashboard/institutions', label: 'Institutions', icon: School },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
      ];
    }
    return base;
  }, [role]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: p } = await supabase.from('users').select('*').eq('id', user?.id).maybeSingle();
        setProfile(p);
        const userRole = p?.role;

        if (['superadmin', 'principal', 'admin', 'finance'].includes(userRole)) {
          const [s, f, c, fin] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['teacher', 'coordinator']),
            supabase.from('classes').select('*', { count: 'exact', head: true }),
            getFinanceSummary(month),
          ]);
          setStats({
            students: s.count || 0,
            faculty: f.count || 0,
            classes: c.count || 0,
          });
          setFinanceMonth(fin);
        } else if (userRole === 'teacher' || userRole === 'coordinator') {
          const me = await getCurrentUser();
          if (me?.id) {
            const { count: assignCount } = await supabase
              .from('class_subjects')
              .select('*', { count: 'exact', head: true })
              .eq('teacher_id', me.id);
            setStats((prev) => ({ ...prev, classes: assignCount || 0 }));
          }
        } else if (userRole === 'student') {
          const me = await getCurrentUser();
          if (me?.id) {
            const { count: classCount } = await supabase
              .from('student_classes')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', me.id)
              .eq('status', 'active');
            setStats((prev) => ({ ...prev, students: classCount || 0 }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [month]);

  const loadingClasses = isLoading ? 'opacity-50 pointer-events-none' : '';

  return (
    <div className={`space-y-10 sm:space-y-12 pb-20 font-sans px-1 sm:px-0 ${loadingClasses}`}>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <Loader2 size={40} className="mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-[10px] tracking-[0.5em] text-slate-400 dark:text-slate-500 uppercase font-bold">
              Establishing session…
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-8 sm:pb-12">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-[44px] font-light text-slate-950 dark:text-white tracking-tighter leading-tight uppercase">
            Hello, {greeting}
          </h1>
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.35em] flex items-center gap-3 flex-wrap">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            Institutional authorization: {role}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
        {isFinanceView ? (
          <>
            <Widget title="Active students" value={stats.students} icon={<Users2 size={18} />} sub="Enrolled profiles" />
            <Widget title="Faculty & coordinators" value={stats.faculty} icon={<LayoutGrid size={18} />} sub="Teaching staff" />
            <Widget title="Classes" value={stats.classes} icon={<Building2 size={18} />} sub="Timetable anchors" />
            <div className="p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-slate-900 to-indigo-800 dark:from-indigo-900 dark:to-slate-900 text-white shadow-xl border border-white/10">
              <Wallet size={20} className="text-indigo-200 mb-6" />
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-white/60">Completed income (this month)</p>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight mt-2">{formatPKR(financeMonth?.totalIncome)}</h2>
              <p className="text-[10px] mt-4 text-white/50 leading-relaxed">
                Pulled from your <code className="text-indigo-200">finances</code> table.
              </p>
              <Link
                href="/dashboard/financials"
                className="mt-6 inline-flex text-[10px] font-bold uppercase tracking-widest text-white/90 hover:text-white border-b border-white/30"
              >
                Open financial console →
              </Link>
            </div>
          </>
        ) : (
          <>
            <Widget title="My classes" value={stats.students || stats.classes || '—'} icon={<GraduationCap size={18} />} sub={role === 'student' ? 'Enrolled sections' : 'Assignments'} />
            <Widget title="Attendance focus" value="—" icon={<CheckCircle2 size={18} />} sub="Mark from teacher or attendance hub" />
            <Widget title="Tasks" value="—" icon={<Clock size={18} />} sub="Check coordinator notices" isAlert />
            <Widget title="Messages" value="—" icon={<MessageSquare size={18} />} sub="Notifications feed" />
          </>
        )}
      </div>

      <div>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.35em] mb-4">Shortcuts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/80 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:shadow-md transition-all min-h-[72px]"
              >
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  <Icon size={18} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="min-h-[200px] sm:min-h-[240px] bg-white dark:bg-[#0A0F1E] border border-slate-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 flex flex-col justify-center text-center">
        <Signal size={32} strokeWidth={1} className="mx-auto text-indigo-400 mb-4" />
        <p className="text-[10px] uppercase tracking-[0.45em] text-slate-600 dark:text-slate-300 font-bold opacity-80">
          Live modules load from your <span className="text-indigo-500">menus</span> table.
        </p>
      </div>
    </div>
  );
}

function Widget({ title, value, sub, icon, isAlert }) {
  return (
    <div className="p-8 sm:p-10 bg-white dark:bg-[#0A0F1E] border border-slate-100 dark:border-white/5 rounded-[2rem] sm:rounded-[3rem] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500">
      <div className={`p-3 bg-slate-50 dark:bg-white/5 w-fit rounded-2xl mb-8 ${isAlert ? 'text-rose-500' : 'text-slate-900 dark:text-slate-100'}`}>{icon}</div>
      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">{title}</p>
      <h2 className="text-3xl sm:text-4xl font-light text-slate-950 dark:text-white tracking-tighter mt-2">{value}</h2>
      <p className="text-[10px] mt-5 text-slate-400 font-bold uppercase tracking-[0.2em]">{sub}</p>
    </div>
  );
}