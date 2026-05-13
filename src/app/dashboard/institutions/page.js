"use client";
import React, { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, Phone, Lock, Save, Edit3, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getInstitutionById, createInstitution, updateInstitution, setUserInstitution } from '@/lib/api';

export default function InstitutionPage() {
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
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (lockAfterSave = false) => {
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
          ? 'Institution profile saved and locked successfully.'
          : 'Institution profile updated successfully.',
      });
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Failed to save institution' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!['principal', 'superadmin'].includes(role)) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 rounded-3xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-center">
        <AlertCircle className="mx-auto mb-4 text-amber-600" size={40} />
        <h2 className="text-xl font-medium">Access Restricted</h2>
        <p className="text-amber-700 dark:text-amber-300 mt-2">Only principals and superadmins can manage institution settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white">
            <Building2 size={32} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Institution Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {locked ? "Locked profile • Superadmin can unlock" : "Complete your school profile"}
            </p>
          </div>
        </div>

        {locked && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            <Lock size={16} /> Profile Locked
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-2xl flex gap-3 text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
            : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p>{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Institution Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} disabled={!canEdit} icon={<Building2 size={16} />} />
            <Field label="Short Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} disabled={!canEdit} />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} disabled={!canEdit} icon={<Globe size={16} />} />
            <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} disabled={!canEdit} icon={<Phone size={16} />} />
            <Field label="Official Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled={!canEdit} />
            <Field label="Logo URL" value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} disabled={!canEdit} placeholder="https://" />
            <div className="md:col-span-2">
              <Field label="Full Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} disabled={!canEdit} icon={<MapPin size={16} />} multiline />
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 sm:flex-none px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Save Changes
              </button>

              {isPrincipal && !locked && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-8 py-4 border border-slate-300 dark:border-white/20 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Lock size={18} /> Save & Lock Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="bg-gradient-to-br from-indigo-600 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl h-fit">
          <h3 className="font-semibold text-lg mb-4">About Locking</h3>
          <ul className="space-y-4 text-sm text-indigo-100">
            <li>• Complete the profile once the school details are finalized.</li>
            <li>• Use "Save & Lock" to prevent accidental changes.</li>
            <li>• Locked profiles appear consistently across ID cards, challans, and certificates.</li>
            <li>• Only Superadmin can unlock or modify locked fields.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, icon, placeholder, multiline = false }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-y ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}