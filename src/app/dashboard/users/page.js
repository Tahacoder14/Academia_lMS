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

      if (profileError) throw profileError;

      const { data: allUsers } = await supabase.from('users').select('*');
      setUsers(allUsers || []);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', role: 'student', status: 'active', rollNumber: '' });
      setMessage({ type: 'success', text: 'User created successfully!' });
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

      if (error) throw error;

      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: formData.role, status: formData.status, roll_number: formData.rollNumber || null } : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      setMessage({ type: 'success', text: 'User updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!['principal', 'superadmin', 'admin'].includes(currentUser?.role)) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 text-center">
        <AlertCircle className="mx-auto mb-4 text-rose-600" size={40} />
        <h2 className="text-xl font-medium">Access Denied</h2>
        <p className="text-rose-700 dark:text-rose-300 mt-2">Only admins, principals, and superadmins can manage users.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      principal: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      admin: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
      finance: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      coordinator: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      teacher: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      student: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
    };
    return colors[role] || colors.student;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/10 pb-8">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Add, edit, and manage all users across the platform</p>
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

      {/* Search + Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          onClick={() => {
            setFormData({ fullName: '', email: '', role: 'student', status: 'active', rollNumber: '' });
            setShowAddModal(true);
          }}
          className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={20} />
          Add New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
              <tr className="text-xs font-medium uppercase tracking-widest text-slate-500">
                <th className="text-left py-5 px-6">Name</th>
                <th className="text-left py-5 px-6">Email</th>
                <th className="text-left py-5 px-6">Role</th>
                <th className="text-left py-5 px-6">Roll No</th>
                <th className="text-left py-5 px-6">Status</th>
                <th className="text-left py-5 px-6">Joined</th>
                <th className="text-center py-5 px-6 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-5 px-6 font-medium text-slate-900 dark:text-white">{user.full_name}</td>
                    <td className="py-5 px-6 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                    <td className="py-5 px-6">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium uppercase ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {user.role === 'student' ? (user.roll_number || '—') : '—'}
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium uppercase ${
                        user.status === 'active' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-sm text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              fullName: user.full_name,
                              email: user.email,
                              role: user.role,
                              status: user.status,
                              rollNumber: user.roll_number || ''
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && <AddUserModal formData={formData} setFormData={setFormData} onSubmit={handleAddUser} onClose={() => setShowAddModal(false)} submitting={submitting} />}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && <EditUserModal formData={formData} setFormData={setFormData} onSubmit={handleUpdateRole} onClose={() => {setShowEditModal(false); setSelectedUser(null);}} submitting={submitting} />}
    </div>
  );
}

/* ===================== MODALS ===================== */
function AddUserModal({ formData, setFormData, onSubmit, onClose, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl">
        <h2 className="text-2xl font-light mb-8">Add New User</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-medium block mb-2">Full Name</label>
            <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-2">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-2">Role</label>
            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="coordinator">Coordinator</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
            </select>
          </div>
          {formData.role === 'student' && (
            <div>
              <label className="text-xs font-medium block mb-2">Roll Number</label>
              <input type="text" value={formData.rollNumber} onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2026-10A-015" />
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-2xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ formData, setFormData, onSubmit, onClose, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-8 shadow-2xl">
        <h2 className="text-2xl font-light mb-8">Edit User</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-medium block mb-2">Name</label>
            <input type="text" value={formData.fullName} disabled className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 opacity-60" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-2">Role</label>
            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="coordinator">Coordinator</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
            </select>
          </div>
          {formData.role === 'student' && (
            <div>
              <label className="text-xs font-medium block mb-2">Roll Number</label>
              <input type="text" value={formData.rollNumber} onChange={(e) => setFormData({...formData, rollNumber: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium block mb-2">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-2xl">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}