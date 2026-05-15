"use client";
import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { GraduationCap, Menu, Sun, Moon, LogOut, Settings, User, ChevronDown, Circle, ChevronRight, X } from 'lucide-react';
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { canAccessMenuItem } from '@/lib/rbac';

export default function UsersLayout({ children }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [userData, setUserData] = useState({ full_name: 'Member', role: 'Student' });
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      setCurrentTime(now.toLocaleDateString('en-US', options) + " • " + 
                     now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (p) setUserData(p);

      const { data: menus } = await supabase.from('menus').select('*').order('display_order', { ascending: true });
      setMenuItems(menus || []);
    };
    load();
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" 
             onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="text-white" size={26} />
            </div>
            <span className="font-semibold text-2xl tracking-tight text-slate-900 dark:text-white">EduAdmin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-10 px-5 space-y-2">
          {menuItems.map((item) => {
            if (!canAccessMenuItem(userData.role, item) || !item.route) return null;
            const isActive = pathname === item.route;
            const IconComponent = Icons[item.icon] || Circle;

            return (
              <Link 
                key={item.id} 
                href={item.route} 
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[15px] font-medium transition-all duration-200
                  ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                <IconComponent size={22} className={isActive ? "text-white" : "text-slate-500"} />
                <span>{item.module_name}</span>
                {isActive && <ChevronRight size={18} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Area - FIXED FOR MOBILE */}
      <div className="flex-1 flex flex-col h-full w-full lg:ml-72 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors" 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400 font-medium">
              {currentTime}
            </div>

            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl">
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userData.full_name}</p>
                  <p className="text-xs text-slate-500">{userData.role}</p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-semibold">
                  {userData.full_name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}