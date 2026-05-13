"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, CheckCircle2, Clock, AlertCircle, PlusCircle } from 'lucide-react';

export default function FeeChallans() {
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid

  useEffect(() => {
    fetchUserAndChallans();
  }, []);

  const fetchUserAndChallans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('id, full_name, role, class')
        .eq('id', user.id)
        .single();

      setUserData(profile);
      setRole(profile?.role);

      let query = supabase
        .from('fee_challans')
        .select(`
          *,
          student:student_id (
            id, 
            full_name, 
            roll_number
          )
        `)
        .order('due_date', { ascending: false });

      // Students see only their own challans
      if (profile?.role === 'student') {
        query = query.eq('student_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setChallans(data || []);
    } catch (error) {
      console.error("Error fetching challans:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallans = challans.filter(ch => {
    if (filter === 'pending') return !ch.paid;
    if (filter === 'paid') return ch.paid;
    return true;
  });

  const totalDue = challans
    .filter(c => !c.paid)
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalPaid = challans
    .filter(c => c.paid)
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500">Loading fee records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Fee Challans</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {role === 'student' 
              ? 'Your fee payments and dues' 
              : 'Manage all student fee challans'}
          </p>
        </div>

        {['superadmin', 'principal', 'admin', 'finance'].includes(role) && (
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-medium transition-all">
            <PlusCircle size={20} />
            Generate New Challan
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
          <p className="uppercase text-xs tracking-widest text-slate-500">Total Due</p>
          <p className="text-4xl font-light mt-2">Rs. {totalDue.toLocaleString('en-PK')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
          <p className="uppercase text-xs tracking-widest text-slate-500">Total Paid</p>
          <p className="text-4xl font-light mt-2 text-emerald-600">Rs. {totalPaid.toLocaleString('en-PK')}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6">
          <p className="uppercase text-xs tracking-widest text-slate-500">Total Challans</p>
          <p className="text-4xl font-light mt-2">{challans.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 pb-4 border-b border-slate-200 dark:border-white/10">
        {['all', 'pending', 'paid'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 text-sm font-medium rounded-2xl transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Paid'}
          </button>
        ))}
      </div>

      {/* Challans Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        {filteredChallans.length === 0 ? (
          <div className="py-24 text-center">
            <AlertCircle size={56} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-light">No Challans Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="text-left px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Student</th>
                  <th className="text-left px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Class</th>
                  <th className="text-left px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Amount</th>
                  <th className="text-left px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Due Date</th>
                  <th className="text-left px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Status</th>
                  <th className="text-right px-6 py-5 text-xs font-medium uppercase tracking-widest text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {filteredChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium">{ch.student?.full_name}</p>
                        <p className="text-xs text-slate-500">ID: {ch.student_id?.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-medium">
                        {ch.class} {ch.section ? `- ${ch.section}` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-semibold text-lg">
                      Rs. {Number(ch.amount).toLocaleString('en-PK')}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      {new Date(ch.due_date).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium ${
                        ch.paid 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      }`}>
                        {ch.paid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                        {ch.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 text-sm font-medium">
                        <Download size={16} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}