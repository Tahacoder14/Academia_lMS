"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, XCircle, TrendingUp, PlusCircle, BookOpen, 
  Search, Eye as EyeIcon, Send, BarChart3, X as XIcon,
  Edit2, Trash2, Download
} from 'lucide-react';

// --- MAIN GATEKEEPER COMPONENT ---
export default function AcademicRegistry() {
  const [role, setRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAcademicSystem = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: p } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        setUserData(p);
        setRole(p?.role || 'student');
      } catch (e) {
        console.error("Critical Sync Error:", e);
      } finally {
        setLoading(false);
      }
    };
    initializeAcademicSystem();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.5em] font-medium text-slate-500 dark:text-slate-400">
          Connecting to Academic Core
        </p>
      </div>
    );
  }

  if (role === 'principal' || role === 'superadmin') return <PrincipalHub userData={userData} />;
  if (role === 'coordinator') return <CoordinatorHub userData={userData} />;
  if (role === 'teacher') return <TeacherHub userData={userData} />;
  
  return <StudentDashboard data={userData} />;
}

/* ===================== PRINCIPAL HUB ===================== */
function PrincipalHub({ userData }) {
  const [submissions, setSubmissions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPrincipalData();
  }, []);

  const fetchPrincipalData = async () => {
    try {
      const { data: subs } = await supabase
        .from('worksheets')
        .select('*')
        .order('created_at', { ascending: false });
      
      setSubmissions(subs || []);

      const { data: teacherList } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher');
      
      setTeachers(teacherList || []);
    } catch (e) {
      console.error("Error fetching principal data:", e);
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Principal Control</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Academic Oversight</h1>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all">
          <TrendingUp size={18} /> Full Analytics
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox title="Total Submissions" value={stats.total} trend="This Month" color="indigo" />
        <MetricBox title="Pending Review" value={stats.pending} trend="Urgent" color="rose" />
        <MetricBox title="Approved" value={stats.approved} trend="Verified" color="emerald" />
        <MetricBox title="Rejected" value={stats.rejected} trend="Needs Work" color="amber" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${
              filter === f 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-indigo-200'
            }`}
          >
            {f === 'all' ? 'All Submissions' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Worksheet</th>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Teacher</th>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Class</th>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Subject</th>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Status</th>
                <th className="text-left px-6 py-5 font-medium text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 font-medium">{sub.title || 'Untitled'}</td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300">{sub.teacher?.name || 'Unknown'}</td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300">{sub.teacher?.class || 'N/A'}</td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300">{sub.subject || 'N/A'}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
                        sub.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-sm">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400">No submissions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8">
        <h3 className="text-xl font-light mb-6">Teachers Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.map(teacher => {
            const teacherSubs = submissions.filter(s => s.teacher_id === teacher.id);
            return (
              <div key={teacher.id} className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{teacher.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-light">{teacherSubs.length}</p>
                    <p className="text-xs text-slate-500">submissions</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, trend, color }) {
  const colors = {
    indigo: "border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800",
    rose: "border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800",
    emerald: "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800",
    amber: "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} hover:shadow-lg transition-all`}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className="text-4xl font-light tracking-tighter mt-3">{value}</h2>
      <p className="text-xs mt-4 text-slate-500 dark:text-slate-400">{trend}</p>
    </div>
  );
}
/* ===================== COORDINATOR HUB ===================== */
function CoordinatorHub({ userData }) {
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('worksheets')
        .select('*, teacher:teacher_id(name, email, class)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setSubmissions(data || []);
    } catch (e) {
      console.error("Error fetching submissions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId) => {
    try {
      await supabase.from('worksheets').update({ status: 'approved', approved_at: new Date() }).eq('id', submissionId);
      setActionStatus('✅ Approved Successfully');
      setTimeout(() => setActionStatus(null), 2000);
      fetchSubmissions();
    } catch (e) {
      console.error("Error approving:", e);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      await supabase.from('worksheets').update({ status: 'rejected', rejection_reason: "Review guidelines not met" }).eq('id', submissionId);
      setActionStatus('❌ Rejected');
      setTimeout(() => setActionStatus(null), 2000);
      fetchSubmissions();
    } catch (e) {
      console.error("Error rejecting:", e);
    }
  };

  const classes = [...new Set(submissions.map(s => s.teacher?.class))].filter(Boolean);
  const filteredSubmissions = submissions.filter(s => {
    const matchesClass = selectedClass === 'all' || s.teacher?.class === selectedClass;
    const matchesSearch = s.title?.toLowerCase().includes(search.toLowerCase()) || 
                          s.teacher?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-8">
      <header className="border-b border-slate-200 dark:border-white/10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Coordinator Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Submission Review Queue</h1>
          </div>
          <div className="text-right">
            <p className="text-4xl font-light text-indigo-600">{filteredSubmissions.length}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Pending Approvals</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:border-indigo-500 outline-none transition-all"
            placeholder="Search by title or teacher..."
          />
        </div>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full sm:w-56 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
        </select>
      </div>

      {actionStatus && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 font-medium">
          {actionStatus}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading submissions...</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-light">All Caught Up!</h2>
          <p className="text-slate-500 mt-2">No pending submissions</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSubmissions.map(sub => (
            <SubmissionCard 
              key={sub.id}
              submission={sub}
              onApprove={() => handleApprove(sub.id)}
              onReject={() => handleReject(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission, onApprove, onReject }) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-medium text-slate-900 dark:text-white">{submission.title || 'Untitled Worksheet'}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 mt-6 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Teacher</p>
              <p className="font-medium">{submission.teacher?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Class</p>
              <p className="font-medium">{submission.teacher?.class}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Subject</p>
              <p className="font-medium">{submission.subject || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Submitted</p>
              <p className="font-medium">{new Date(submission.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
        <button 
          onClick={onApprove}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} /> Approve
        </button>
        <button 
          onClick={() => setShowRejectReason(!showRejectReason)}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <XCircle size={18} /> Reject
        </button>
        <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-2">
          <EyeIcon size={18} /> Preview
        </button>
      </div>

      {showRejectReason && (
        <div className="mt-6 p-5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl">
          <textarea 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full h-24 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 rounded-xl p-4 outline-none"
          />
          <button 
            onClick={() => { onReject(); setShowRejectReason(false); setRejectReason(""); }}
            className="mt-4 w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-medium"
          >
            Confirm Rejection
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== TEACHER HUB ===================== */
function TeacherHub({ userData }) {
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class: userData?.class || '',
    difficultyLevel: 'intermediate',
    description: '',
  });

  useEffect(() => {
    fetchTeacherWorksheets();
  }, []);

  const fetchTeacherWorksheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('worksheets')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });
      
      setWorksheets(data || []);
    } catch (e) {
      console.error("Error fetching worksheets:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('worksheets')
        .insert([{
          title: formData.title,
          subject: formData.subject,
          class: formData.class,
          difficulty_level: formData.difficultyLevel,
          description: formData.description,
          teacher_id: user?.id,
          status: 'pending'
        }]);

      if (error) throw error;

      setFormData({
        title: '',
        subject: '',
        class: userData?.class || '',
        difficultyLevel: 'intermediate',
        description: '',
      });
      setIsFormOpen(false);
      fetchTeacherWorksheets();
    } catch (e) {
      console.error("Error submitting worksheet:", e);
    }
  };

  const stats = {
    total: worksheets.length,
    pending: worksheets.filter(w => w.status === 'pending').length,
    approved: worksheets.filter(w => w.status === 'approved').length,
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">My Academic Portal</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Worksheet Dashboard</h1>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
        >
          <PlusCircle size={20} /> Create New Worksheet
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Created" value={stats.total} color="indigo" />
        <StatCard label="Pending Review" value={stats.pending} color="amber" />
        <StatCard label="Approved" value={stats.approved} color="emerald" />
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading worksheets...</div>
      ) : worksheets.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center">
          <BookOpen size={56} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-2xl font-light">No Worksheets Yet</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worksheets.map(ws => (
            <WorksheetCard key={ws.id} worksheet={ws} />
          ))}
        </div>
      )}

      {isFormOpen && (
        <CreateWorksheetModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

/* ===================== STUDENT DASHBOARD ===================== */
function StudentDashboard({ data }) {
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApprovedWorksheets();
  }, []);

  const fetchApprovedWorksheets = async () => {
    try {
      const { data: approved } = await supabase
        .from('worksheets')
        .select('*, teacher:teacher_id(name)')
        .eq('status', 'approved')
        .eq('class', data?.class)
        .order('created_at', { ascending: false });
      
      setWorksheets(approved || []);
    } catch (e) {
      console.error("Error fetching worksheets:", e);
    } finally {
      setLoading(false);
    }
  };

  const subjects = [...new Set(worksheets.map(w => w.subject))].filter(Boolean);
  const filteredWorksheets = filter === 'all' 
    ? worksheets 
    : worksheets.filter(w => w.subject === filter);

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Learning Center</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Study Materials</h1>
        </div>
        <div className="text-right mt-3 sm:mt-0">
          <p className="text-4xl font-light text-indigo-600">{filteredWorksheets.length}</p>
          <p className="text-xs uppercase tracking-widest text-slate-500">Available</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10'}`}>
          All Subjects
        </button>
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setFilter(subject)}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${filter === subject ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10'}`}
          >
            {subject}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">Loading materials...</div>
      ) : filteredWorksheets.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center">
          <BookOpen size={56} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-2xl font-light">No Materials Yet</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorksheets.map(ws => (
            <div key={ws.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 hover:shadow-xl transition-all group">
              <div className="inline-block px-4 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium mb-4">
                ✓ Approved
              </div>
              <h3 className="text-lg font-medium line-clamp-2 mb-4">{ws.title}</h3>
              
              <div className="space-y-2 text-sm mb-6 text-slate-600 dark:text-slate-400">
                <p><span className="font-medium text-slate-700 dark:text-slate-300">Teacher:</span> {ws.teacher?.name}</p>
                <p><span className="font-medium text-slate-700 dark:text-slate-300">Subject:</span> {ws.subject}</p>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all">
                <Download size={18} /> Download Material
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100'
  };

  return (
    <div className={`${colors[color]} p-6 rounded-3xl border text-center hover:shadow-md transition-all`}>
      <p className="text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-4xl font-light">{value}</p>
    </div>
  );
}

function CreateWorksheetModal({ isOpen, onClose, formData, setFormData, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <XIcon size={28} />
            </button>
            <h2 className="text-2xl font-light tracking-tight">New Worksheet</h2>
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-2xl" />
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Worksheet Title</label>
              <input 
                type="text" value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border-b border-slate-300 dark:border-slate-700 pb-3 text-lg outline-none focus:border-indigo-500"
                placeholder="Mid-Term Mathematics Paper"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Subject</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full border-b border-slate-300 dark:border-slate-700 pb-3 outline-none focus:border-indigo-500"
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Difficulty Level</label>
              <select 
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({...formData, difficultyLevel: e.target.value})}
                className="w-full border-b border-slate-300 dark:border-slate-700 pb-3 outline-none focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Description / Instructions</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="5"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500"
                placeholder="Add any special instructions..."
              />
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <button 
              onClick={onSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2"
            >
              Submit for Approval <Send size={18} />
            </button>
            <button onClick={onClose} className="w-full py-3 text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorksheetCard({ worksheet }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <h3 className="text-lg font-medium line-clamp-2">{worksheet.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{worksheet.subject} • {worksheet.class}</p>
        </div>
        <span className={`px-4 py-1 rounded-full text-xs font-medium uppercase ${statusColors[worksheet.status] || 'bg-slate-100'}`}>
          {worksheet.status}
        </span>
      </div>

      {worksheet.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6">{worksheet.description}</p>
      )}

      <div className="flex gap-3">
        <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl text-sm font-medium">Edit</button>
        <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-2xl text-sm font-medium">View</button>
      </div>
    </div>
  );
}