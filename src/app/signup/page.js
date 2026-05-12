"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MinimalInput, Stat } from '@/components/AuthComponents';
import { GraduationCap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const[formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    if (formData.role === 'superadmin') {
      setError('Superadmin accounts can only be created by administrators.');
      return;
    }

    setLoading(true);

    try {
      // Create user. The SQL Trigger we just ran will handle adding them to public.users!
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
          <h2 className="text-2xl font-light text-slate-900">Account created successfully!</h2>
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans selection:bg-indigo-100 antialiased">
      <div className="hidden md:flex flex-col justify-between p-24 bg-[#001026] text-white">
        <div className="animate-in fade-in slide-in-from-left duration-1000">
           <div className="flex items-center gap-3 tracking-[0.4em] mb-20 opacity-90 uppercase text-xs font-medium">
              <GraduationCap size={22} strokeWidth={1.5} /> Academia LMS
           </div>
           <h2 className="text-6xl font-light leading-[1.05] tracking-tighter mb-8">
             Unlock your potential with institutional <span className="italic text-indigo-400 font-normal">excellence</span>.
           </h2>
           <p className="text-slate-400 text-lg max-w-sm font-light leading-relaxed">
             Join a community of scholars and professionals dedicated to high-clarity learning and structured academic growth.
           </p>
        </div>
        
        <div className="flex gap-20 border-t border-white/5 pt-12 animate-in fade-in slide-in-from-bottom duration-1000">
           <Stat block="12k+" label="Active Students" />
           <Stat block="450+" label="Expert Faculty" />
        </div>
      </div>

      <div className="bg-white p-12 md:p-24 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-3">
            <h3 className="text-4xl font-light text-[#001026] tracking-tight">Create your account</h3>
            <p className="text-slate-400 text-sm font-normal">Join our learning management system today.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
             <MinimalInput
               label="Full Name"
               placeholder="John Doe"
               value={formData.fullName}
               onChange={(v) => setFormData({...formData, fullName: v})}
               error={errors.fullName}
               required
             />
             
             <MinimalInput
               label="Email Address"
               placeholder="john@university.edu"
               type="email"
               value={formData.email}
               onChange={(v) => setFormData({...formData, email: v})}
               error={errors.email}
               required
             />

             <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold ml-1 block">
                  Your Role
                </label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl appearance-none text-[11px] font-bold uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer transition-all"
                >
                   <option value="student">Student</option>
                   <option value="teacher">Teacher</option>
                   <option value="coordinator">Coordinator</option>
                   <option value="principal">Principal</option>
                   <option value="finance">Finance Staff</option>
                   <option value="admin">School Administration</option>
                </select>
             </div>

             <MinimalInput
               label="Password"
               placeholder="••••••••"
               type="password"
               value={formData.password}
               onChange={(v) => setFormData({...formData, password: v})}
               error={errors.password}
               required
             />

             <MinimalInput
               label="Confirm Password"
               placeholder="••••••••"
               type="password"
               value={formData.confirmPassword}
               onChange={(v) => setFormData({...formData, confirmPassword: v})}
               error={errors.confirmPassword}
               required
             />

             <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400 font-medium leading-tight">
               <input type="checkbox" className="w-4 h-4 rounded border-slate-200 accent-[#001026]" required />
               <span>I agree to the <span className="text-indigo-600 font-bold">Terms of Service</span> and <span className="text-indigo-600 font-bold">Privacy Policy</span>.</span>
             </div>

             <button
               disabled={loading}
               className="w-full bg-[#001026] py-5 text-white text-[11px] uppercase tracking-[0.5em] font-normal rounded-xl hover:bg-slate-800 disabled:opacity-50 shadow-2xl shadow-indigo-100/50 transition-all flex justify-center items-center gap-2"
             >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
             </button>
          </form>

          <div className="pt-8 text-center border-t border-slate-50">
             <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">
               Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}