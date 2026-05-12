"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, Loader2, GraduationCap } from 'lucide-react';
import { getCurrentUser, getStudentAttendance } from '@/lib/api';

export default function AttendanceHub() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setMe(user);
        if (user?.role === 'student' && user.id) {
          const att = await getStudentAttendance(user.id);
          setRows(att.slice(0, 40));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const role = me?.role;

  if (role === 'teacher' || role === 'coordinator') {
    return (
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Marking happens per class and date inside the teaching workspace.
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700"
        >
          <GraduationCap size={18} /> Open teacher portal → Attendance tab
        </Link>
      </div>
    );
  }

  if (role === 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight">My attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Latest records synced from your classes.</p>
        </div>
        <div className="rounded-3xl border border-slate-100 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Class</th>
                <th className="text-left p-4">Subject</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400">
                    No attendance rows yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-50 dark:border-white/5">
                    <td className="p-4 font-mono text-xs">{r.attendance_date}</td>
                    <td className="p-4">{r.class?.name || '—'}</td>
                    <td className="p-4">{r.subject?.name || '—'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase">
                        <CheckCircle2 size={14} /> {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight">Attendance</h1>
      <p className="text-slate-500 text-sm">
        Leadership teams review attendance inside Academic or Results modules. Teachers should use the Teacher portal.
      </p>
      <Link href="/dashboard/academic" className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm">
        <Calendar size={16} /> Go to academic registry
      </Link>
    </div>
  );
}
