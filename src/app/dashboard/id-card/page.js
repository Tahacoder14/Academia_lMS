"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getInstitutionById } from '@/lib/api';
import { ShieldCheck, Download, Loader2, School, Printer } from 'lucide-react';

export default function IdentityModule() {
  const [data, setData] = useState(null);
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: auth } } = await supabase.auth.getUser();
        if (!auth) return;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', auth.id)
          .maybeSingle();

        setData(profile);

        if (profile?.institution_id) {
          const institution = await getInstitutionById(profile.institution_id);
          setInst(institution);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const printCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        Please log in to view your ID card.
      </div>
    );
  }

  const schoolName = inst?.name || 'EduAdmin';
  const logo = inst?.logo_url;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Digital ID Card</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Official institutional identity for {data.role}
          </p>
        </div>

        <button
          onClick={printCard}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-medium transition-all active:scale-[0.97]"
        >
          <Printer size={20} />
          Print / Save as PDF
        </button>
      </div>

      {/* ID Card */}
      <div className="flex justify-center py-8 print:py-0">
        <div
          id="id-card"
          className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-[2.75rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden print:shadow-none print:border-slate-300"
        >
          {/* Top Banner */}
          <div className="h-44 bg-gradient-to-br from-[#001026] to-slate-900 relative">
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              {logo ? (
                <img 
                  src={logo} 
                  alt="School Logo" 
                  className="h-14 w-14 object-contain bg-white/10 rounded-2xl p-1 border border-white/20" 
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <School size={28} className="text-white" />
                </div>
              )}

              <div className="text-right">
                <p className="text-white text-xs font-bold tracking-widest uppercase">{schoolName}</p>
                <p className="text-white/50 text-[10px] mt-0.5">2025 - 2026</p>
              </div>
            </div>

            {/* Profile Picture */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-3xl border-[6px] border-white dark:border-slate-900 overflow-hidden shadow-xl bg-white">
              <img
                src={data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.full_name || 'User')}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="pt-20 pb-10 px-8 text-center">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
              {data.full_name}
            </h2>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-widest text-xs mt-1">
              {data.role}
            </p>

            <div className="mt-10 space-y-5 text-left">
              <InfoLine label="ID Number" value={data.roll_number || data.id?.slice(0, 10) || '—'} />
              <InfoLine label="Email" value={data.email} />
              <InfoLine label="Institution" value={schoolName} />
              {data.class && <InfoLine label="Class" value={data.class} />}
            </div>

            <div className="mt-12 opacity-40 flex justify-center">
              <ShieldCheck size={52} strokeWidth={0.8} className="text-slate-300 dark:text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 print:hidden">
        This digital ID is for internal use only.
      </p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-white/10 pb-3">
      <span className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{value}</span>
    </div>
  );
}