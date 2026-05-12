"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  User, Bell, Shield, Palette, Lock, HelpCircle, LogOut, 
  ChevronRight, Mail, Phone, MapPin, Globe, Loader2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    updates: true
  });
  const [theme, setTheme] = useState('dark');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('users')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;
      
      setMessage('✓ Changes saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('✗ Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="space-y-8 pb-20 font-sans font-light animate-fade-in">
      
      {/* HEADER */}
      <div className="border-b border-slate-100 dark:border-white/5 pb-8">
        <h1 className="text-4xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          Settings
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-3">
          Account & Preferences Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS */}
        <div className="flex md:flex-col gap-2 md:gap-0 overflow-x-auto md:overflow-x-visible">
          {settingsTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all whitespace-nowrap md:whitespace-normal text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN CONTENT */}
        <div className="md:col-span-3 space-y-8">
          
          {/* SUCCESS MESSAGE */}
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${
              message.includes('✓')
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {message}
            </div>
          )}

          {/* PROFILE SETTINGS */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingInput
                  label="Full Name"
                  value={profile.full_name || ''}
                  onChange={(v) => setProfile({...profile, full_name: v})}
                />
                <SettingInput
                  label="Email"
                  value={profile.email || ''}
                  readOnly
                />
                <SettingInput
                  label="Phone"
                  value={profile.phone || ''}
                  onChange={(v) => setProfile({...profile, phone: v})}
                />
                <SettingInput
                  label="Role"
                  value={profile.role || ''}
                  readOnly
                />
                <SettingInput
                  label="Department"
                  value={profile.department || ''}
                  onChange={(v) => setProfile({...profile, department: v})}
                />
                <SettingInput
                  label="Location"
                  value={profile.location || ''}
                  onChange={(v) => setProfile({...profile, location: v})}
                />
              </div>

              <textarea
                placeholder="Bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 ring-indigo-500 resize-none"
                rows="4"
              />

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                Save Changes
              </button>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Notification Preferences</h3>
              
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'sms', label: 'SMS Alerts', desc: 'Get urgent notifications via SMS' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'updates', label: 'System Updates', desc: 'Important system announcements' }
              ].map(notif => (
                <label key={notif.key} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications[notif.key]}
                    onChange={(e) => setNotifications({...notifications, [notif.key]: e.target.checked})}
                    className="w-5 h-5 rounded-lg accent-indigo-600"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{notif.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{notif.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Security Settings</h3>
              
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white mb-2">Change Password</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Update your password regularly for security</p>
                <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                  Change Password
                </button>
              </div>

              <div className="p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <p className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">✓ Two-Factor Authentication</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">Your account is secured with 2FA</p>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white mb-2">Active Sessions</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">1 session active on this device</p>
              </div>
            </div>
          )}

          {/* APPEARANCE SETTINGS */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Appearance</h3>
              
              <div className="space-y-3">
                {['light', 'dark', 'system'].map(t => (
                  <label key={t} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value={t}
                      checked={theme === t}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-5 h-5 accent-indigo-600"
                    />
                    <span className="capitalize font-medium text-slate-900 dark:text-white">{t} Mode</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Help & Support</h3>
              
              <div className="space-y-4">
                <HelpItem title="Getting Started" desc="Learn how to use the LMS" />
                <HelpItem title="Documentation" desc="Complete user guide and tutorials" />
                <HelpItem title="Contact Support" desc="Reach out to our support team" />
                <HelpItem title="Report Bug" desc="Help us improve by reporting issues" />
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-lg font-medium hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, readOnly, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        {...props}
        readOnly={readOnly}
        className={`w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 ring-indigo-500 transition-all ${
          readOnly ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

function HelpItem({ title, desc }) {
  return (
    <button className="w-full text-left flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-slate-400" />
    </button>
  );
}
