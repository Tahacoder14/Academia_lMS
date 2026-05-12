"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { defaultDashboardRoute } from '@/lib/rbac';

/**
 * Main Dashboard Router
 * Routes users to their appropriate module based on role
 * This component should ONLY be used for the /dashboard page itself
 * NOT for /dashboard/* pages to avoid recursion
 */
export default function DashboardRouter() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRoute = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch user role from database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = userData?.role || 'student';
        setUserRole(role);

        // Route based on role - Use small delay to prevent rapid re-renders
        const targetRoute = defaultDashboardRoute(role);
        
        // Small delay to ensure state updates properly
        setTimeout(() => {
          router.push(targetRoute);
        }, 300);
      } catch (error) {
        console.error('Error routing user:', error);
        setTimeout(() => {
          router.push('/login');
        }, 300);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndRoute();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest font-bold">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
