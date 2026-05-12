"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getInstitutionById } from '@/lib/api';
import { ShieldCheck, Download, Loader2, School } from 'lucide-react';

export default function IdentityModule() {
  const [data, setData] = useState(null);
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user: auth } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('users').select('*').eq('id', auth?.id).maybeSingle();
        setData(profile);
        if (profile?.institution_id) {
          const i = await getInstitutionById(profile.institution_id);
          setInst(i);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const printCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-20 text-center animate-pulse text-[10px] tracking-[0.5em] text-slate-400">
        <Loader2 className="animate-spin inline text-indigo-500 mb-4" size={24} />
        <p>Loading ID…</p>
      </div>
    );
  }

  if (!data) return null;

  const schoolName = inst?.name || 'EduAdmin';
  const logo = inst?.logo_url;

  return (
    <div className="space-y-8 sm:space-y-12 animate-fade-in font-sans font-light px-2 sm:px-0 print:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white tracking-tight uppercase tracking-wide">Institutional ID</h1>
          <p className="text-sm text-slate-500 mt-1">Official pass for {data.role} • {schoolName}</p>
        </div>
        <button
          type="button"
          onClick={printCard}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700"
        >
          <Download size={16} /> Print / Save PDF
        </button>
      </div>

      <div className="flex justify-center py-6 print:py-0">
        <div
          id="id-card"
          className="w-full max-w-[360px] sm:w-[360px] min-h-[520px] bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.12)] relative overflow-hidden print:shadow-none print:border-slate-300"
        >
          <div className="h-40 sm:h-44 bg-[#001026] dark:bg-indigo-950 p-6 sm:p-8 flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {logo ? (
                <img src={logo} alt="" className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-contain bg-white/10 border border-white/20 shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <School className="text-white" size={22} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-white font-semibold text-[11px] sm:text-[12px] uppercase tracking-[0.35em] truncate">{schoolName}</h2>
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold mt-1">Digital ID • 2026</p>
              </div>
            </div>
          </div>

          <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-white p-1 border-[8px] sm:border-[10px] border-[#FDFDFF] shadow-2xl">
            <img
              src={data.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.full_name || 'U')}`}
              alt=""
              className="w-full h-full object-cover rounded-[1.6rem]"
            />
          </div>

          <div className="mt-24 sm:mt-28 px-8 sm:px-10 text-center space-y-8 pb-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-light text-slate-800 dark:text-slate-900 tracking-tight uppercase">{data.full_name}</h2>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-2 italic">{data.role}</p>
            </div>

            <div className="space-y-3 pt-8 border-t border-slate-100 text-left">
              <Line label="Roll / system no." value={data.roll_number || data.id?.slice(0, 8) || '—'} />
              <Line label="Email" value={data.email || '—'} />
              <Line label="Institution" value={schoolName} />
            </div>

            <div className="pt-4 opacity-40 flex justify-center grayscale print:opacity-100">
              <ShieldCheck size={40} strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-slate-700 text-right truncate">{value}</span>
    </div>
  );
}
