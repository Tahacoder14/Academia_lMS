"use client";
import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react'; 
import { 
  GraduationCap, Moon, Sun, LogOut, 
  ChevronDown, PanelLeftClose, PanelLeftOpen, Loader2,
  Calendar, Settings, User, ShieldCheck, Circle
} from 'lucide-react';
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { canAccessMenuItem, USER_MATRIX_ROLES } from '@/lib/rbac';
import { getInstitutionById } from '@/lib/api';
import { SafeIcon } from '@/components/SafeRenderer';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardLayout({ children }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [userData, setUserData] = useState({ id: '', full_name: 'Member', role: 'Student', email: '', avatar_url: '' });
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  useEffect(() => {
    setMounted(true);
    const syncSystem = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return router.push('/login');

        // 1. Fetch User Data
        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
        if (profile) setUserData({ ...profile, email: authUser.email });

        if (profile?.institution_id) {
          const inst = await getInstitutionById(profile.institution_id);
          if (inst?.name) setSchoolName(inst.name);
        } else {
          setSchoolName('');
        }

        // 2. Fetch Menu Items (NO HARDCODING - DATA ONLY FROM DB)
        const { data: menus } = await supabase.from('menus').select('*').order('display_order', { ascending: true });
        
        // Remove duplicates if any exist in the local state during hot-reloads
        setMenuItems([...new Map((menus || []).map(item => [item.module_name, item])).values()]);

      } catch (err) {
        console.error('Error syncing dashboard:', err);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    syncSystem();
  }, [router, pathname]);

  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[#FDFDFF] dark:bg-[#020617] font-sans antialiased text-slate-800 font-light transition-colors duration-500 overflow-x-hidden">
      
      {/* 1. SIDEBAR: HIGH CONTRAST & RUNNING LINE */}
      <aside 
        className={`bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-white/5 fixed inset-y-0 z-40 transition-all duration-700 ease-in-out ${
          isCollapsed ? 'w-20 lg:w-20' : 'w-72 lg:w-72'
        } ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'} lg:static lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-8 border-b border-slate-50 dark:border-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
              <div className="min-w-0">
                <h1 className="text-slate-950 dark:text-white font-medium text-[13px] uppercase tracking-[0.5em]">EduAdmin</h1>
                {schoolName && (
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-1 tracking-wide">{schoolName}</p>
                )}
              </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all mx-auto">
            {isCollapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
          </button>
        </div>

        <nav className="flex-1 px-5 mt-10 space-y-7">
          {menuItems && menuItems.length > 0 ? (
            menuItems.map((item) => {
              if (!canAccessMenuItem(userData.role, item)) return null;
              if (!item || !item.route) return null;

              const IconComponent = Icons[item.icon] || Circle;
              const active = pathname === item.route;

              return (
                <Link 
                  key={item.id} 
                  href={item.route} 
                  onClick={() => setIsMobileOpen(false)}
                  className={`group flex items-center gap-5 px-5 py-2 text-[11px] transition-all relative ${
                    active 
                    ? "text-indigo-700 font-semibold" 
                    : "text-slate-900 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white font-medium"
                  }`}
                >
                  <SafeIcon 
                    Icon={IconComponent} 
                    size={19} 
                    strokeWidth={active ? 2.5 : 1.5} 
                    className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:translate-x-1'}`}
                  />
                  {!isCollapsed && <span className="uppercase tracking-[0.25em]">{item.module_name}</span>}
                  
                  {/* ACTIVE RUNNING LINE ANCHORED INSIDE */}
                  {active && !isCollapsed && (
                    <div className="absolute -bottom-3 left-5 right-5 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent animate-sidebar-active w-[80%] opacity-70"></div>
                  )}
                </Link>
              );
            })
          ) : (
            <div className="px-5 py-4 text-xs text-slate-400 text-center">Loading menu...</div>
          )}
        </nav>
      </aside>

      {/* Mobile overlay to hide sidebar on small screens */}
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* 2. MAIN AREA */}
      <div className={`flex flex-col flex-1 transition-all duration-700 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'} ml-0`}>        
        <header className="h-auto min-h-[60px] px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl z-30 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-wrap items-center gap-4">
             <button onClick={() => setIsMobileOpen((state) => !state)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden">
               {isMobileOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
             </button>
             <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-semibold text-slate-600 dark:text-slate-400">
                <Calendar size={12} strokeWidth={1} className="text-indigo-600" /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
             </div>
             <span className="hidden sm:block w-px h-2 bg-slate-200 dark:bg-slate-700"></span>
             <h2 className="text-slate-900 dark:text-white text-[9px] font-bold uppercase tracking-[0.3em]">
                {pathname.split('/').pop()?.replace('-', ' ') || 'Module'}
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-slate-500 hover:text-indigo-600 transition-all border border-slate-100 dark:border-white/5 rounded-full shadow-sm">
               {theme === 'dark' ? <Sun size={17} strokeWidth={1.5}/> : <Moon size={17} strokeWidth={1.5}/>}
             </button>

             {/* PROFILE DP AREA */}
             <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-4 group">
                  <div className="text-right hidden sm:block">
                     <p className="text-[12px] font-semibold text-slate-950 dark:text-white leading-none mb-1">{userData.full_name}</p>
                     <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest italic">{userData.role}</p>
                  </div>
                  
                  <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 p-0.5 transition-all group-hover:border-indigo-400 shadow-sm bg-white dark:bg-slate-800 overflow-hidden">
                    {userData.avatar_url ? (
                      <img src={userData.avatar_url} alt="Profile" className="w-full h-full rounded-[9px] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-[9px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                        {userData.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white/95 dark:bg-[#080C14] border border-slate-100 dark:border-white/5 rounded-3xl shadow-[0_40px_80px_-20px_rgba(79,70,229,0.15)] py-6 z-50 animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
                     <div className="px-8 pb-5 border-b dark:border-white/5 mb-4 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authenticated ID</p>
                        <p className="text-[13px] font-medium text-slate-950 dark:text-white truncate tracking-tight">{userData.email}</p>
                     </div>
                     <Link href="/dashboard/settings/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 px-8 py-3 text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors font-medium">
                        <User size={15} strokeWidth={1.5}/> Personal Profile
                     </Link>
                     
                     {USER_MATRIX_ROLES.includes(userData.role) && (
                       <Link href="/dashboard/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 px-8 py-3 text-[11px] uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors font-medium">
                          <ShieldCheck size={15} strokeWidth={1.5}/> Access Matrix
                       </Link>
                     )}

                     <div className="my-3 border-t dark:border-white/5"></div>
                     <button onClick={handleLogout} className="w-full text-left px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-rose-500 font-black hover:text-rose-600 transition-all flex items-center gap-3">
                       <LogOut size={15} strokeWidth={2}/> Terminate Session
                     </button>
                  </div>
                )}
             </div>
          </div>
        </header>

        <main className="flex-1 px-2 sm:px-5 lg:px-8 py-4 sm:py-5 lg:py-6 relative w-full overflow-y-auto">
           {/* DECORATIVE LIGHT GLASS BLOBS - FIXED POSITION */}
           <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[150px] -z-10 pointer-events-none opacity-100 dark:opacity-0"></div>
           
           {isLoading ? (
             <div className="h-[50vh] flex flex-col items-center justify-center gap-6">
               <Loader2 className="animate-spin text-indigo-400" size={24} strokeWidth={1.5}/>
               <p className="text-[10px] uppercase tracking-[0.6em] font-medium animate-pulse text-slate-500">Establishing Session</p>
             </div>
           ) : (
             <div className="animate-in fade-in duration-700 w-full">
                {children}
             </div>
           )}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}