"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users2, LayoutGrid, Building2, Wallet, ArrowRight, FileText, School, Receipt } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Animation settings
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const card = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        setProfile(p);
      }
      setLoading(false);
    };
    init();
  },[]);

  if (loading) return <div className="h-full flex items-center justify-center animate-pulse">Loading Dashboard...</div>;

  const quickActions =[
    { label: 'Overview', icon: LayoutGrid, href: '/dashboard' },
    { label: 'Academic', icon: FileText, href: '/dashboard/academic' },
    { label: 'Financials', icon: Wallet, href: '/dashboard/financials' },
    { label: 'Challans', icon: Receipt, href: '/dashboard/challans' },
    { label: 'Institution', icon: School, href: '/dashboard/institutions' }
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-10">
      
      {/* PROFESSIONAL HEADER */}
      <motion.header variants={card} className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Good Morning, {profile?.full_name?.split(' ')[0] || 'Member'}
        </h1>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest rounded-full">
            {profile?.role || 'User'}
          </span>
          <p className="text-slate-500 font-medium">Welcome to your institutional overview.</p>
        </div>
      </motion.header>

      {/* STATS BENTO GRID */}
      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Widget title="Active Students" value="2" icon={Users2} />
        <Widget title="Faculty & Staff" value="3" icon={LayoutGrid} />
        <Widget title="Total Classes" value="3" icon={Building2} />
        
        {/* Highlighted Finance Widget */}
        <motion.div variants={card} className="relative overflow-hidden bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none flex flex-col justify-between">
           <div className="relative z-10">
             <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Monthly Income</p>
             <h2 className="text-3xl font-bold mt-2">Rs 0</h2>
           </div>
           <Link href="/dashboard/financials" className="relative z-10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-6 opacity-90 hover:opacity-100 transition-opacity">
             View Report <ArrowRight size={14} />
           </Link>
           {/* Abstract shape decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        </motion.div>
      </motion.div>

      {/* QUICK ACTIONS GRID */}
      <motion.section variants={card}>
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 transition-all text-center shadow-sm hover:shadow-md">
              <action.icon className="mx-auto text-slate-400 mb-4 group-hover:text-indigo-500 transition-colors duration-300" size={28} />
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{action.label}</p>
            </Link>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

// PREMIUM WIDGET COMPONENT
function Widget({ title, value, icon: Icon }) {
  return (
    <motion.div variants={card} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 w-fit rounded-2xl mb-6 text-indigo-600 dark:text-indigo-400">
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
    </motion.div>
  );
}