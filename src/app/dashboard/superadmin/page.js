"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getFinanceSummary } from '@/lib/api';
import {
  Building2,
  Users2,
  GraduationCap,
  Wallet,
  BarChart3,
  Shield,
  Loader2,
  ArrowRight,
  School,
  MessageSquare,
  Clock3,
} from 'lucide-react';

export default function SuperadminDashboard() {
  const [role, setRole] = useState(null);
  const [counts, setCounts] = useState({ users: 0, institutions: 0, classes: 0 });
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoRequests, setDemoRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: p } = await supabase.from('users').select('role').eq('id', user?.id).maybeSingle();
        setRole(p?.role || null);
        if (p?.role !== 'superadmin') {
          setLoading(false);
          return;
        }
        const month = new Date().toISOString().slice(0, 7);
        const [u, i, c, fin] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('institutions').select('*', { count: 'exact', head: true }),
          supabase.from('classes').select('*', { count: 'exact', head: true }),
          getFinanceSummary(month),
        ]);
        setCounts({ users: u.count || 0, institutions: i.count || 0, classes: c.count || 0 });
        setFinance(fin);

        if (typeof window !== 'undefined') {
          const saved = JSON.parse(window.localStorage.getItem('academy_demo_requests') || '[]');
          setDemoRequests(saved.slice(0, 8));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (role !== 'superadmin') {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-center">
        This console is restricted to superadmin accounts only.
      </div>
    );
  }

  const tiles = [
    { href: '/dashboard/users', label: 'Global Users', value: counts.users, icon: Users2, sub: 'All roles' },
    { href: '/dashboard/institutions', label: 'Institutions', value: counts.institutions, icon: School, sub: 'Schools & Tenants' },
    { href: '/dashboard/principal', label: 'Leadership View', value: counts.classes, icon: Building2, sub: 'All Classes' },
    { href: '/dashboard/financials', label: 'Finance Pulse', value: finance ? `Rs. ${Math.round(finance.totalIncome || 0)}` : '—', icon: Wallet, sub: 'This Month Income' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 pb-12 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative z-10 max-w-2xl space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-indigo-200">SUPERADMIN CONTROL PLANE</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tighter leading-tight">
            Operate Every School from One Place
          </h1>
          <p className="text-indigo-100/90 text-[15px] leading-relaxed">
            Manage institutions, audit users, monitor finance, and control platform-wide settings.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-all"
            >
              <BarChart3 size={18} /> View Reports
            </Link>
            <Link
              href="/dashboard/institutions"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-white/30 text-sm font-medium hover:bg-white/10 transition-all"
            >
              <Shield size={18} /> Manage Institutions
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  <Icon size={24} />
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.label}</p>
              <p className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white mt-2">{t.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 tracking-wide">{t.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment Checklist */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <GraduationCap size={22} className="text-indigo-500" />
            Deployment Checklist
          </h2>
          <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              Set <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and Anon Key
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              Run all setup SQL scripts in Supabase
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              Never expose service role keys on client side
            </li>
          </ul>
        </div>

        {/* Menu & Quick Links */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-3">Dynamic Menu System</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Sidebar navigation is powered by the <strong>menus</strong> table. 
            Add, edit or reorder items without redeploying the application.
          </p>
          <Link href="/dashboard/users" className="inline-flex mt-6 text-indigo-600 dark:text-indigo-400 font-medium items-center gap-2 hover:underline">
            Manage Users →
          </Link>
        </div>
      </div>

      {/* Demo Requests + Signals */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Demo Requests */}
        <div className="xl:col-span-1 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare size={22} className="text-indigo-500" />
            <h3 className="font-semibold">Demo Requests</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Recent requests from homepage</p>

          {demoRequests.length > 0 ? (
            <div className="space-y-4">
              {demoRequests.map((req, i) => (
                <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{req.name}</p>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{req.role}</span>
                  </div>
                  <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">{req.organization}</p>
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">{req.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 border border-dashed rounded-3xl">
              No demo requests yet
            </div>
          )}
        </div>

        {/* Leadership Signals */}
        <div className="xl:col-span-2 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock3 size={22} className="text-indigo-500" />
              <div>
                <h3 className="font-semibold">Leadership Signals</h3>
                <p className="text-sm text-slate-500">Platform-wide overview</p>
              </div>
            </div>
            <Link href="/dashboard/reports" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
              Detailed Reports →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <p className="uppercase text-xs tracking-widest text-slate-500">Total Users</p>
              <p className="text-5xl font-light mt-3">{counts.users}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <p className="uppercase text-xs tracking-widest text-slate-500">Institutions</p>
              <p className="text-5xl font-light mt-3">{counts.institutions}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}