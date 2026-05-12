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
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (role !== 'superadmin') {
    return (
      <div className="p-8 rounded-3xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
        This console is restricted to superadmin accounts.
      </div>
    );
  }

  const tiles = [
    { href: '/dashboard/users', label: 'Global users', value: counts.users, icon: Users2, sub: 'All roles' },
    { href: '/dashboard/institutions', label: 'Institutions', value: counts.institutions, icon: School, sub: 'Tenants / schools' },
    { href: '/dashboard/principal', label: 'Leadership view', value: counts.classes, icon: Building2, sub: 'Classes (all)' },
    { href: '/dashboard/financials', label: 'Finance pulse', value: finance ? `PKR ${Math.round(finance.totalIncome || 0)}` : '—', icon: Wallet, sub: 'This month income' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-indigo-200/60 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-slate-900 to-slate-950 text-white p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-indigo-200">Superadmin control plane</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Operate every school from one place</h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed">
            Unlock institution profiles, audit users, and validate finance signals before campuses go live. Pair this with Supabase RLS for production isolation.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-50"
            >
              <BarChart3 size={16} /> Reports
            </Link>
            <Link
              href="/dashboard/institutions"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/30 text-[11px] font-bold uppercase tracking-widest hover:bg-white/10"
            >
              <Shield size={16} /> Institutions
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group p-8 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  <Icon size={20} />
                </span>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.label}</p>
              <p className="text-3xl font-light text-slate-900 dark:text-white mt-2">{t.value}</p>
              <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-widest">{t.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-500" /> Deployment checklist
          </h2>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
            <li>Set <code className="text-indigo-600">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-indigo-600">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> on Vercel or Railway.</li>
            <li>Run <code className="text-indigo-600">SQL.md</code> in Supabase SQL editor (institutions, fee_challans, menus).</li>
            <li>Keep service role keys only on the server (Edge Functions) — never in the browser.</li>
          </ul>
        </div>
        <div className="p-8 rounded-3xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Menu expansion</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Sidebar items are read from the <strong>menus</strong> table. Add or reorder rows to give teachers, coordinators, and students more entry points without redeploying.
          </p>
          <Link href="/dashboard/users" className="inline-flex mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            Open user matrix →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="p-8 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <MessageSquare size={20} />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Demo requests</h3>
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Requests submitted from the homepage dialog appear here for superadmin review.</p>
          {demoRequests.length > 0 ? (
            <div className="mt-6 space-y-4">
              {demoRequests.map((request) => (
                <div key={request.id} className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>{request.name}</span>
                    <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">{request.role}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{request.organization}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{request.message}</p>
                  <div className="mt-3 text-xs text-slate-400 uppercase tracking-[0.18em]">{new Date(request.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200/80 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No demo requests have been received yet.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 p-8 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-indigo-500">
              <Clock3 size={20} />
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">Leadership signals</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Monitor usage, finance, and approvals from a single dashboard.</p>
              </div>
            </div>
            <Link href="/dashboard/reports" className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">View detailed reports →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pending users</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{counts.users}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Current institutions</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{counts.institutions}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
