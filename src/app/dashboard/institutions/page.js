"use client";
import React, { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, Phone, Lock, Save, Edit3, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getInstitutionById, createInstitution, updateInstitution, setUserInstitution } from '@/lib/api';

export default function Institutions() {
  const [profile, setProfile] = useState(null);
  const [inst, setInst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    logo_url: '',
  });

  const role = profile?.role;
  const isSuperadmin = role === 'superadmin';
  const isPrincipal = role === 'principal';
  const locked = Boolean(inst?.profile_locked) && !isSuperadmin;
  const canEdit = isSuperadmin || (isPrincipal && !locked);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUser();
        if (cancelled || !me) return;
        setProfile(me);
        if (!['principal', 'superadmin'].includes(me.role)) {
          setLoading(false);
          return;
        }
        let row = me.institution_id ? await getInstitutionById(me.institution_id) : null;
        if (cancelled) return;
        setInst(row);
        if (row) {
          setForm({
            name: row.name || '',
            code: row.code || '',
            address: row.address || '',
            phone: row.phone || '',
            website: row.website || '',
            email: row.email || '',
            logo_url: row.logo_url || '',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (lockAfterSave) => {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        logo_url: form.logo_url.trim() || null,
      };
      if (isPrincipal && lockAfterSave) {
        payload.profile_locked = true;
        payload.locked_at = new Date().toISOString();
      }

      let row = inst;
      if (!row) {
        const created = await createInstitution(payload);
        await setUserInstitution(profile.id, created.id);
        row = created;
        setInst(created);
        setProfile((p) => ({ ...p, institution_id: created.id }));
      } else {
        const updated = await updateInstitution(inst.id, payload);
        row = updated;
        setInst(updated);
      }
      setMessage({
        type: 'success',
        text: lockAfterSave && isPrincipal
          ? 'Institution profile saved and locked. Contact superadmin to change core fields.'
          : 'Institution profile saved.',
      });
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Save failed. Run SQL.md migrations if tables are missing.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  if (!['principal', 'superadmin'].includes(role)) {
    return (
      <div className="p-8 rounded-3xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 text-sm">
        Institution settings are managed by the principal or superadmin.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto px-2 sm:px-0 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200/50 dark:shadow-none shrink-0">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Institution profile</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {locked
                ? 'Locked — visible across the LMS. Superadmin can unlock and edit.'
                : 'Complete once, then lock so branding stays consistent school-wide.'}
            </p>
          </div>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
            <Lock size={14} /> Locked
          </span>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="text-emerald-600 shrink-0" /> : <AlertCircle className="text-rose-600 shrink-0" />}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Institution name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                disabled={!canEdit}
                icon={<Building2 size={14} />}
              />
              <Field
                label="Short code"
                value={form.code}
                onChange={(v) => setForm({ ...form, code: v })}
                disabled={!canEdit}
                icon={<Lock size={14} />}
              />
              <Field
                label="Official website"
                value={form.website}
                onChange={(v) => setForm({ ...form, website: v })}
                disabled={!canEdit}
                icon={<Globe size={14} />}
              />
              <Field
                label="Contact phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                disabled={!canEdit}
                icon={<Phone size={14} />}
              />
              <Field
                label="Official email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                disabled={!canEdit}
              />
              <Field
                label="Logo URL (HTTPS image)"
                value={form.logo_url}
                onChange={(v) => setForm({ ...form, logo_url: v })}
                disabled={!canEdit}
                placeholder="https://…"
              />
              <div className="md:col-span-2">
                <Field
                  label="Registered address"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  disabled={!canEdit}
                  icon={<MapPin size={14} />}
                  multiline
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(false)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                  >
                    <Save size={16} /> {inst ? 'Save changes' : 'Create institution'}
                  </button>
                  {isPrincipal && !locked && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave(true)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
                    >
                      <Lock size={16} /> Save & lock profile
                    </button>
                  )}
                  {isSuperadmin && locked && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const updated = await updateInstitution(inst.id, {
                            profile_locked: false,
                            locked_at: null,
                          });
                          setInst(updated);
                          setMessage({ type: 'success', text: 'Institution unlocked for editing.' });
                        } catch (e) {
                          setMessage({ type: 'error', text: e?.message || 'Unlock failed' });
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amber-300 text-amber-900 dark:text-amber-200 text-[11px] font-bold uppercase tracking-widest hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      <Edit3 size={16} /> Unlock (superadmin)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-lg">How locking works</h3>
          <ul className="text-sm text-indigo-100 space-y-2 list-disc list-inside leading-relaxed">
            <li>Principal completes official name, logo URL, and contacts.</li>
            <li>Use <strong>Save &amp; lock</strong> when the profile is final.</li>
            <li>After lock, the form is read-only for the principal.</li>
            <li>Superadmin can always edit or unlock.</li>
            <li>ID cards and fee challans use this branding when tables exist.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, icon, placeholder, multiline }) {
  const base =
    'w-full pl-4 pr-4 py-3 rounded-2xl border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-indigo-500/30 ' +
    (disabled
      ? 'bg-slate-50 dark:bg-slate-800/60 border-transparent text-slate-500 cursor-not-allowed'
      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white');

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
