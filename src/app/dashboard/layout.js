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

export default function UsersLayout({ children }) {
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

        // Fetch User Data
        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
        if (profile) setUserData({ ...profile, email: authUser.email });

        // Fetch Institution Name
        if (profile?.institution_id) {
          const inst = await getInstitutionById(profile.institution_id);
          if (inst?.name) setSchoolName(inst.name);
        }

        // Fetch Menu Items
        const { data: menus } = await supabase.from('menus').select('*').order('display_order', { ascending: true });
        setMenuItems([...new Map((menus || []).map(item => [item.module_name, item])).values()]);

      } catch (err) {
        console.error('Error syncing dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    syncSystem();
  }, [router]);

  if (!mounted) return null;

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased overflow-hidden">
        
        {/* SIDEBAR */}
        <aside 
          className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 fixed inset-y-0 z-50 transition-all duration-300 ease-out
            ${isCollapsed ? 'w-20' : 'w-72'} 
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:static`}
        >
          <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-white/10">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <GraduationCap size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">EduAdmin</h1>
                  {schoolName && <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1">{schoolName}</p>}
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="ml-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 lg:hidden xl:block"
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>

          <nav className="px-4 py-8 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
            {menuItems.length > 0 ? (
              menuItems.map((item) => {
                if (!canAccessMenuItem(userData.role, item) || !item.route) return null;
                
                const IconComponent = Icons[item.icon] || Circle;
                const isActive = pathname === item.route;

                return (
                  <Link 
                    key={item.id} 
                    href={item.route} 
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm transition-all group ${
                      isActive 
                        ? 'bg-indigo-600 text-white font-medium' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <SafeIcon 
                      Icon={IconComponent} 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 1.8} 
                    />
                    {!isCollapsed && <span>{item.module_name}</span>}
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">Loading menu...</div>
            )}
          </nav>
        </aside>

        {/* MOBILE OVERLAY */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          
          {/* HEADER */}
          <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md z-30 px-4 sm:px-6 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileOpen(!isMobileOpen)} 
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {isMobileOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
              </button>

              <div className="text-xs uppercase tracking-[0.5em] text-slate-500 font-medium flex items-center gap-2">
                <Calendar size={14} />
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl px-2 py-1.5 pr-4"
                >
                  <div className="w-8 h-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-medium">
                    {userData.avatar_url ? (
                      <img src={userData.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      userData.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{userData.full_name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{userData.role}</p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl py-5 z-50">
                    <div className="px-6 pb-4 border-b dark:border-white/10">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-medium truncate">{userData.email}</p>
                    </div>
                    <Link href="/dashboard/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm">
                      <User size={18} /> Profile Settings
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-6 py-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-xs uppercase tracking-widest text-slate-500">Loading workspace...</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}