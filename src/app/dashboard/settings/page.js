"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  User, Bell, Shield, Palette, Lock, HelpCircle, LogOut, 
  ChevronRight, Loader2 
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
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
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 pb-12 sm:pb-20 px-4 sm:px-6">
      {/* HEADER */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-6 sm:pb-8">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-3">
          <div className="sticky top-6 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 hide-scrollbar">
            {settingsTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 lg:flex-shrink ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Success / Error Message */}
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-medium ${
              message.includes('✓') 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
            }`}>
              {message}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && profile && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-8">
              <h3 className="text-xl font-medium">Profile Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SettingInput label="Full Name" value={profile.full_name || ''} onChange={(v) => setProfile({...profile, full_name: v})} />
                <SettingInput label="Email" value={profile.email || ''} readOnly />
                <SettingInput label="Phone" value={profile.phone || ''} onChange={(v) => setProfile({...profile, phone: v})} />
                <SettingInput label="Role" value={profile.role || ''} readOnly />
                <SettingInput label="Department" value={profile.department || ''} onChange={(v) => setProfile({...profile, department: v})} />
                <SettingInput label="Location" value={profile.location || ''} onChange={(v) => setProfile({...profile, location: v})} />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Bio</label>
                <textarea
                  placeholder="Write something about yourself..."
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full h-32 p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-2xl text-sm focus:ring-2 ring-indigo-500 outline-none resize-y"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                Save Changes
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
              <h3 className="text-xl font-medium">Notification Preferences</h3>
              
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'sms', label: 'SMS Alerts', desc: 'Get urgent notifications via SMS' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'updates', label: 'System Updates', desc: 'Important system announcements' }
              ].map(notif => (
                <label key={notif.key} className="flex items-start gap-4 p-5 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <input
                    type="checkbox"
                    checked={notifications[notif.key]}
                    onChange={(e) => setNotifications({...notifications, [notif.key]: e.target.checked})}
                    className="mt-1 w-5 h-5 accent-indigo-600"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{notif.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{notif.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
              <h3 className="text-xl font-medium">Security Settings</h3>
              
              <div className="p-6 border border-slate-200 dark:border-white/10 rounded-2xl">
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password regularly</p>
                <button className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-all">
                  Update Password
                </button>
              </div>

              <div className="p-6 border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <p className="font-medium text-emerald-700 dark:text-emerald-300">✓ Two-Factor Authentication Enabled</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Your account is protected</p>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
              <h3 className="text-xl font-medium">Appearance</h3>
              
              <div className="space-y-3">
                {['light', 'dark', 'system'].map(t => (
                  <label key={t} className="flex items-center gap-4 p-5 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <input
                      type="radio"
                      name="theme"
                      value={t}
                      checked={theme === t}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-5 h-5 accent-indigo-600"
                    />
                    <span className="capitalize font-medium">{t} Mode</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* HELP & SUPPORT TAB */}
          {activeTab === 'help' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
              <h3 className="text-xl font-medium">Help & Support</h3>
              
              <div className="space-y-3">
                <HelpItem title="Getting Started" desc="Learn how to use the LMS" />
                <HelpItem title="Documentation" desc="Complete user guide and tutorials" />
                <HelpItem title="Contact Support" desc="Reach out to our support team" />
                <HelpItem title="Report a Bug" desc="Help us improve the platform" />
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all mt-6"
              >
                <LogOut size={20} />
                Logout from Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function SettingInput({ label, readOnly, ...props }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <input
        {...props}
        readOnly={readOnly}
        className={`w-full px-4 py-3 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-2xl text-sm focus:ring-2 ring-indigo-500 outline-none transition-all ${
          readOnly ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );
}

function HelpItem({ title, desc }) {
  return (
    <button className="w-full text-left flex items-center justify-between p-5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
}