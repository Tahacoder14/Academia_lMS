"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Loader2, GraduationCap, AlertCircle } from 'lucide-react';
import { getCurrentUser, getStudentAttendance } from '@/lib/api';

export default function AttendanceHub() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        setMe(user);

        if (user?.role === 'student' && user.id) {
          const attendance = await getStudentAttendance(user.id);
          setRows(attendance.slice(0, 40));
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const role = me?.role;

  // Teacher / Coordinator View
  if (role === 'teacher' || role === 'coordinator') {
    return (
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            Attendance
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Marking attendance happens in the Teacher Portal.
          </p>
        </div>

        <Link
          href="/dashboard/teacher"
          className="group flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5"
        >
          <GraduationCap size={22} />
          <span>Open Teacher Portal - Attendance</span>
        </Link>
      </div>
    );
  }

  // Student View
  if (role === 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight">
            My Attendance
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Latest attendance records from your classes
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">Date</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">Class</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">Subject</th>
                  <th className="text-left py-4 px-6 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle size={40} />
                        <p>No attendance records yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">
                        {record.attendance_date}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {record.class?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {record.subject?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-medium">
                          <CheckCircle2 size={18} />
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Default / Other Roles
  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-3xl font-light text-slate-900 dark:text-white">Attendance</h1>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
        Leadership and admin users can review attendance through the Academic module.
      </p>
      <Link
        href="/dashboard/academic"
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
      >
        <Calendar size={18} />
        Go to Academic Registry
      </Link>
    </div>
  );
}