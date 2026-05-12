"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Camera, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [saving, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      setProfile(data);
    };
    fetch();
  }, []);

  if (!profile) return <div className="text-[10px] uppercase tracking-[0.4em] text-slate-200 mt-20 text-center animate-pulse">Synchronizing Identity...</div>;

  return (
    <div className="max-w-4xl space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* SECTION HEADER */}
      <section className="space-y-2">
        <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">Identity Settings</h1>
        <p className="text-[11px] font-normal uppercase tracking-[0.4em] text-slate-400">Configure your professional profile</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
        {/* AVATAR COLUMN */}
        <div className="space-y-6">
          <div className="relative w-40 h-40 group">
             <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-100">
               {profile.avatar_url ? (
                 <img src={profile.avatar_url} className="object-cover w-full h-full" alt="avatar" />
               ) : (
                 <User size={48} strokeWidth={0.5} className="text-slate-200" />
               )}
             </div>
             <label className="absolute bottom-2 right-2 p-3 bg-white dark:bg-slate-800 shadow-xl rounded-full text-slate-400 hover:text-indigo-600 cursor-pointer border border-slate-100 dark:border-slate-700 transition-all active:scale-90">
               <Camera size={16} strokeWidth={1.5}/>
               <input type="file" className="hidden" />
             </label>
          </div>
          <p className="text-[10px] text-slate-300 uppercase tracking-widest leading-loose">
            Security status: <span className="text-emerald-400">Active</span> <br/>
            Member since {new Date(profile.created_at).getFullYear()}
          </p>
        </div>

        {/* DATA COLUMN */}
        <div className="md:col-span-2 space-y-12">
          {/* FIX: Using defaultValue instead of value to avoid the React error */}
          <ThinInput label="Full Name" defaultValue={profile.full_name} placeholder="Name" />
          <ThinInput label="Primary Email" defaultValue={profile.email} readOnly />
          
          <div className="pt-10">
             <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white text-[11px] uppercase tracking-[0.3em] rounded-full hover:opacity-80 transition-all active:scale-95 shadow-2xl shadow-indigo-100 dark:shadow-none">
                {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} 
                Commit Changes
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThinInput({ label, ...props }) {
  return (
    <div className="group space-y-4">
      <label className="text-[10px] font-medium text-slate-300 uppercase tracking-[0.3em] group-focus-within:text-indigo-500 transition-colors">
        {label}
      </label>
      <input 
        {...props}
        className="w-full bg-transparent border-b border-slate-100 dark:border-slate-800 pb-4 text-sm font-light text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400 transition-all placeholder:text-slate-100"
      />
    </div>
  );
}