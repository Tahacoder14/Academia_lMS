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
  const [stats, setStats] = useState({ students: 0, faculty: 0, classes: 0 });
  const [financeMonth, setFinanceMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const role = profile?.role || 'student';
  const isFinanceView = ['superadmin', 'principal', 'admin', 'finance'].includes(role);
  const greeting = profile?.full_name?.split(' ')[0] || 'Member';

  const quickLinks = useMemo(() => {
    const base = [{ href: '/dashboard', label: 'Overview', icon: LayoutGrid }];
    if (role === 'student') {
      return [
        ...base,
        { href: '/dashboard/students', label: 'My learning', icon: GraduationCap },
        { href: '/dashboard/challans', label: 'Fee challan', icon: Receipt },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
        { href: '/dashboard/settings/profile', label: 'Profile', icon: Users2 },
      ];
    }
    if (role === 'teacher') {
      return [
        ...base,
        { href: '/dashboard/teacher', label: 'Teaching', icon: GraduationCap },
        { href: '/dashboard/attendance', label: 'Attendance', icon: CheckCircle2 },
        { href: '/dashboard/results', label: 'Results', icon: BarChart3 },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
      ];
    }
    if (role === 'coordinator') {
      return [
        ...base,
        { href: '/dashboard/academic', label: 'Academic', icon: FileText },
        { href: '/dashboard/coordinator', label: 'Coordinator', icon: Users2 },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { href: '/dashboard/attendance', label: 'Attendance', icon: CheckCircle2 },
        { href: '/dashboard/id-card', label: 'ID card', icon: School },
      ];
    }
    if (['principal', 'admin'].includes(role)) {
      return [
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
      return [
        ...base,
        { href: '/dashboard/financials', label: 'Financials', icon: Wallet },
        { href: '/dashboard/challans', label: 'Challans', icon: Receipt },
        { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
      ];
    }
    if (role === 'superadmin') {
      return [
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

  return (
    <div className="space-y-8 pb-8 min-h-screen">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <Loader2 size={48} className="mx-auto animate-spin text-indigo-600" />
            <p className="text-xs tracking-widest text-slate-400 font-medium">LOADING DASHBOARD...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tighter text-slate-900 dark:text-white">
            Hello, {greeting}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {role.toUpperCase()} • INSTITUTIONAL AUTHORIZATION
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {isFinanceView ? (
          <>
            <Widget title="Active Students" value={stats.students} icon={<Users2 size={22} />} sub="Enrolled Profiles" />
            <Widget title="Faculty & Coordinators" value={stats.faculty} icon={<LayoutGrid size={22} />} sub="Teaching Staff" />
            <Widget title="Total Classes" value={stats.classes} icon={<Building2 size={22} />} sub="Timetable Anchors" />
            
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-white/10 shadow-xl flex flex-col">
              <Wallet size={28} className="text-indigo-300 mb-4" />
              <p className="uppercase text-xs tracking-[2px] text-white/60 font-medium">Income This Month</p>
              <h2 className="text-3xl font-light mt-2 tracking-tighter">{formatPKR(financeMonth?.totalIncome)}</h2>
              <Link href="/dashboard/financials" className="mt-auto pt-6 text-xs font-medium flex items-center gap-2 hover:text-indigo-300 transition-colors">
                Open Financial Console →
              </Link>
            </div>
          </>
        ) : (
          <>
            <Widget title="My Classes" value={stats.students || stats.classes || '—'} icon={<GraduationCap size={22} />} sub={role === 'student' ? 'Enrolled Sections' : 'Assignments'} />
            <Widget title="Attendance" value="—" icon={<CheckCircle2 size={22} />} sub="Mark from Teacher Portal" />
            <Widget title="Tasks" value="—" icon={<Clock size={22} />} sub="Coordinator Notices" isAlert />
            <Widget title="Messages" value="—" icon={<MessageSquare size={22} />} sub="Notification Center" />
          </>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[2px] text-slate-500 dark:text-slate-400 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-start gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200"
              >
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center">
        <Signal size={28} className="mx-auto text-indigo-500 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-widest">
          LIVE MODULES ARE LOADED FROM YOUR MENUS TABLE
        </p>
      </div>
    </div>
  );
}

function Widget({ title, value, sub, icon, isAlert = false }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className={`w-fit p-3 rounded-2xl mb-5 ${isAlert ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-4xl font-light tracking-tighter text-slate-900 dark:text-white mt-2">{value}</h3>
      <p className="text-xs mt-4 text-slate-500 dark:text-slate-400 font-medium">{sub}</p>
    </div>
  );
}