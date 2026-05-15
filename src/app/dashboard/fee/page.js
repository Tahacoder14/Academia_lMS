"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, CheckCircle2, Clock, AlertCircle, PlusCircle, Loader2 } from 'lucide-react';

export default function FeeChallans() {
  const [role, setRole] = useState(null);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  },[]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('users').select('id, role').eq('id', user.id).single();
      setRole(profile?.role);

      // 1. Fetch only the challans first (No Joins)
      let query = supabase.from('fee_challans').select('*').order('due_date', { ascending: false });

      if (profile?.role === 'student') {
        query = query.eq('student_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // 2. If data exists, fetch student names separately if join failed
      // This prevents the whole dashboard from crashing if the relationship is missing
      setChallans(data ||[]);
      
    } catch (error) {
      console.error("Critical Fetch Error:", error);
      alert("Failed to load fee records. Please check Supabase RLS policies.");
    } finally {
      setLoading(false);
    }
  };

  const filteredChallans = challans.filter(ch => {
    if (filter === 'pending') return !ch.paid;
    if (filter === 'paid') return ch.paid;
    return true;
  });

  const totals = challans.reduce((acc, c) => {
    const amount = Number(c.amount || 0);
    if (c.paid) acc.paid += amount;
    else acc.due += amount;
    return acc;
  }, { due: 0, paid: 0 });

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fee Challans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage institutional fee records.</p>
        </div>
        {['superadmin', 'principal', 'admin', 'finance'].includes(role) && (
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            <PlusCircle size={16} /> New Challan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Due" value={`Rs. ${totals.due.toLocaleString()}`} />
        <StatCard label="Total Paid" value={`Rs. ${totals.paid.toLocaleString()}`} color="text-emerald-600" />
        <StatCard label="Total Records" value={challans.length.toString()} />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
          {['all', 'pending', 'paid'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all ${filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {f}
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left">Student ID</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-left">Due Date</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredChallans.map((ch) => (
                <tr key={ch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{ch.student_id?.slice(0, 8)}...</td>
                  <td className="px-6 py-4 font-semibold">Rs. {Number(ch.amount).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(ch.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ch.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {ch.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase">Download</button>
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

function StatCard({ label, value, color = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}