"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Monitor, GraduationCap, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { alert(error.message); setLoading(false); }
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] flex flex-col items-center justify-center p-6 antialiased">
      
      {/* BRANDING HEADER */}
      <div className="flex flex-col items-center mb-10 gap-3">
         <div className="w-12 h-12 bg-[#001026] rounded-xl flex items-center justify-center text-white shadow-lg">
            <GraduationCap size={24} strokeWidth={1.5} />
         </div>
         <h1 className="text-[13px] uppercase tracking-[0.5em] font-normal text-slate-900 ml-2">Academia</h1>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] p-14 border border-slate-100">
        <h2 className="text-[34px] font-light text-[#001026] tracking-tight text-center mb-1">Welcome back</h2>
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.25em] text-center mb-12">Enter your credentials to access your courses</p>

        <form onSubmit={handleLogin} className="space-y-7">
          
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} strokeWidth={1.5} />
              <input 
                type="email" 
                placeholder="name@institution.edu" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-1 ring-slate-200 transition-all placeholder:text-slate-300"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} strokeWidth={1.5} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-1 ring-slate-200 transition-all placeholder:text-slate-300"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-medium text-[#4F46E5] tracking-wide px-1">
             <label className="flex items-center gap-2 cursor-pointer text-slate-400">
               <input type="checkbox" className="w-4 h-4 rounded-full border-slate-200 accent-[#001026]"/> Remember me
             </label>
             <button type="button" className="hover:underline font-bold">Forgot Password?</button>
          </div>

          <button disabled={loading} className="w-full bg-[#001026] py-5 text-white text-[11px] uppercase tracking-[0.4em] font-medium rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
             {loading ? <Loader2 className="animate-spin" size={16}/> : <>Sign In <ArrowRight size={16} strokeWidth={1.5}/></>}
          </button>
        </form>

        <div className="mt-14 space-y-8">
           <div className="relative flex items-center justify-center"><hr className="w-full border-slate-50"/><span className="absolute bg-white px-6 text-[10px] uppercase text-slate-300 tracking-[0.3em] font-bold">Or continue with</span></div>
           <div className="grid grid-cols-2 gap-4">
              <SocialBtn icon={<Monitor size={14}/>} label="Google" />
              <SocialBtn icon={<Monitor size={14}/>} label="Microsoft" />
           </div>
        </div>
      </div>
      
      <p className="mt-12 text-[11px] text-slate-400 uppercase tracking-widest">
        Don't have an account? <Link href="/signup" className="text-[#4F46E5] font-bold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

function SocialBtn({ icon, label }) {
  return (
    <button className="flex items-center justify-center gap-3 py-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all text-xs font-medium text-slate-600">
      {icon} {label}
    </button>
  );
}