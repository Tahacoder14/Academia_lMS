"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'student', status: 'active', rollNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (!['principal', 'superadmin', 'admin'].includes(user?.role)) {
          setLoading(false);
          return;
        }

        const { data: allUsers } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        setUsers(allUsers || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setMessage({ type: 'error', text: 'All fields required' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email.trim(),
        password: Math.random().toString(36).slice(-12),
        user_metadata: { full_name: formData.fullName, role: formData.role }
      });

      if (authError) {
        setMessage({ type: 'error', text: authError.message });
        return;
      }

      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email.trim(),
        full_name: formData.fullName,
        role: formData.role,
        status: formData.status,
        roll_number: formData.role === 'student' ? (formData.rollNumber || null) : null
      });

      if (profileError) {
        setMessage({ type: 'error', text: 'Failed to create user' });
        return;
      }

      const { data: allUsers } = await supabase.from('users').select('*');
      setUsers(allUsers || []);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', role: 'student', status: 'active', rollNumber: '' });
      setMessage({ type: 'success', text: 'User created!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: formData.role,
          status: formData.status,
          roll_number: formData.role === 'student' ? (formData.rollNumber || null) : null
        })
        .eq('id', selectedUser.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: formData.role, status: formData.status, roll_number: formData.rollNumber || null } : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      setMessage({ type: 'success', text: 'User updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!['principal', 'superadmin', 'admin'].includes(currentUser?.role)) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl text-center">
        <AlertCircle className="mx-auto mb-4 text-rose-600 dark:text-rose-400" size={32} />
        <h2 className="text-xl font-semibold text-rose-900 dark:text-rose-200">Access Denied</h2>
        <p className="text-rose-700 dark:text-rose-300 mt-2">Only principals, administrators, or superadmins can manage users.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
      principal: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
      finance: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
      admin: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      coordinator: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      teacher: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
      student: 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300'
    };
    return colors[role] || colors.student;
  };

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in">
      
      <div className="border-b border-slate-100 dark:border-white/5 pb-12">
        <h1 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          User Management
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-4">
          Leadership Access • Add, Edit & Manage Users
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success'
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-rose-700 dark:text-rose-300'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setFormData({ fullName: '', email: '', role: 'student', status: 'active', rollNumber: '' });
            setShowAddModal(true);
          }}
          className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-100 dark:border-white/10">
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="text-left py-4 px-6">Name</th>
              <th className="text-left py-4 px-6">Email</th>
              <th className="text-left py-4 px-6">Role</th>
              <th className="text-left py-4 px-6">Roll No</th>
              <th className="text-left py-4 px-6">Status</th>
              <th className="text-left py-4 px-6">Joined</th>
              <th className="text-center py-4 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr
                key={user.id}
                className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                  {user.full_name}
                </td>
                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                  {user.email}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                  {user.role === 'student' ? (user.roll_number || '-') : '-'}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                    user.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({ role: user.role, status: user.status, fullName: user.full_name, email: user.email, rollNumber: user.roll_number || '' });
                        setShowEditModal(true);
                      }}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>No users found</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h2 className="text-2xl font-light text-slate-950 dark:text-white">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="finance">Finance Staff</option>
                  <option value="admin">School Administration</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
              {formData.role === 'student' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber || ''}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 2026-10A-015"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" />Creating...</> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <h2 className="text-2xl font-light text-slate-950 dark:text-white">Update User</h2>
            <form onSubmit={handleUpdateRole} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">New Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="finance">Finance Staff</option>
                  <option value="admin">School Administration</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
              {formData.role === 'student' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber || ''}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 2026-10A-015"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" />Updating...</> : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
