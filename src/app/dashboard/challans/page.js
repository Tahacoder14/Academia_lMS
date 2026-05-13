"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, Receipt, Users } from 'lucide-react';
import {
  getCurrentUser,
  getInstitutionById,
  getFeeChallansForStudent,
  createFeeChallan,
  getAllClasses,
  getStudentsInClass,
} from '@/lib/api';
import { buildFeeChallanHtml } from '@/lib/challanHtml';
const FINANCE_ROLES = ['finance', 'admin', 'principal', 'superadmin'];

export default function ChallansPage() {
  const [me, setMe] = useState(null);
  const [inst, setInst] = useState(null);
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [amount, setAmount] = useState('5000');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setMe(user);
        if (user?.institution_id) {
          const i = await getInstitutionById(user.institution_id);
          setInst(i);
        }
        if (user?.role === 'student' && user.id) {
          const rows = await getFeeChallansForStudent(user.id);
          setList(rows);
        }
        if (FINANCE_ROLES.includes(user?.role)) {
          const cls = await getAllClasses();
          setClasses(cls);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classId || !FINANCE_ROLES.includes(me?.role)) return;
    (async () => {
      const rows = await getStudentsInClass(classId);
      setStudents(rows || []);
      setSelectedIds(new Set());
    })();
  }, [classId, me?.role]);

  const openChallan = (row, studentRow) => {
    if (!row) {
      alert('Unable to open challan. The challan record was not created successfully.');
      return;
    }

    const html = buildFeeChallanHtml({
      institution: inst,
      student: studentRow,
      amount: `PKR ${Number(row.amount || 0).toLocaleString('en-PK')}`,
      periodLabel: row.period_label || row.period || '',
      challanNo: row.challan_no || row.id,
    });

    const w = window.open('', '_blank');
    if (!w) {
      alert('Popup blocked: please allow popups to see the generated challan.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const studentSelfGenerate = async () => {
    if (!me?.id) {
      alert('Unable to generate challan: user not authenticated.');
      return;
    }
    try {
      const challanNo = `CH-${period}-${me.roll_number || me.id.slice(0, 8)}`;
      const row = await createFeeChallan({
        student_id: me.id,
        institution_id: me.institution_id,
        amount: parseFloat(amount) || 0,
        period_label: period,
        challan_no: challanNo,
        status: 'issued',
      });
      if (!row) throw new Error('No challan record was returned from the server.');
      const rows = await getFeeChallansForStudent(me.id);
      setList(rows);
      openChallan(row, me);
    } catch (e) {
      console.error('Challan create failed:', e);
      alert(e?.message || 'Create fee_challans table (see SQL.md) or check RLS policies.');
    }
  };

  const bulkGenerate = async () => {
    if (!classId || selectedIds.size === 0) {
      alert('Pick a class and at least one student.');
      return;
    }
    try {
      let n = 0;
      for (const sid of selectedIds) {
        const challanNo = `CH-${period}-${sid.slice(0, 8)}`;
        await createFeeChallan({
          student_id: sid,
          institution_id: me.institution_id,
          amount: parseFloat(amount) || 0,
          period_label: period,
          challan_no: challanNo,
          status: 'issued',
        });
        n += 1;
      }
      setSelectedIds(new Set());
      alert(`Created ${n} challan record(s). Open Reports or add a “print queue” to batch PDFs.`);
    } catch (e) {
      alert(e?.message || 'Bulk challan failed. Run SQL.md and verify RLS.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (me?.role === 'student') {
    return (
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Receipt className="text-indigo-500" /> Fee challan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Generate a printable challan for the selected month.</p>
        </div>
        <div className="p-6 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Month
              <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Amount (PKR)
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            </label>
          </div>
          <button
            type="button"
            onClick={studentSelfGenerate}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700"
          >
            Generate challan
          </button>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">History</h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {list.length === 0 ? <li className="text-slate-400">No challans yet.</li> : list.map((c) => (
              <li key={c.id} className="flex justify-between border border-slate-100 dark:border-white/10 rounded-xl px-4 py-3">
                <span>{c.challan_no}</span>
                <span>{c.period_label}</span>
                <span>PKR {c.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (FINANCE_ROLES.includes(me?.role)) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Users className="text-indigo-500" /> Fee challans (office)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Filter by class, select students, issue challans in bulk.</p>
        </div>
        <div className="p-6 rounded-3xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
              ))}
            </select>
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
          </div>
          <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5">
            {students.map((row) => {
              const s = row.student;
              const id = row.student_id;
              const checked = selectedIds.has(id);
              return (
                <label key={id} className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = new Set(selectedIds);
                      if (checked) next.delete(id);
                      else next.add(id);
                      setSelectedIds(next);
                    }}
                  />
                  <span>{s?.full_name || id}</span>
                  <span className="text-slate-400 text-xs">Roll: {s?.roll_number || '—'}</span>
                </label>
              );
            })}
            {classId && students.length === 0 && (
              <p className="p-4 text-sm text-slate-400">No active students in this class.</p>
            )}
          </div>
          <button
            type="button"
            onClick={bulkGenerate}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700"
          >
            Generate for selected
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-500 text-sm">Challans are available to students and finance office roles.</div>
  );
}
