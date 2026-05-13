"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle2, XCircle, TrendingUp, PlusCircle, BookOpen, 
  Search, Eye as EyeIcon, UploadCloud, Send ,BarChart3 , AlertCircle, X as XIcon
  , CheckCircle as CheckCircleIcon
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

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 opacity-40">
       <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[10px] uppercase tracking-[0.5em] font-medium text-slate-500 dark:text-slate-400">Connecting to Academic Core</p>
    </div>
  );

  if (role === 'principal' || role === 'superadmin') return <PrincipalHub userData={userData} />;
  if (role === 'coordinator') return <CoordinatorHub userData={userData} />;
  if (role === 'teacher') return <TeacherHub userData={userData} />;
  
  return <StudentDashboard data={userData} />;
}

// ==========================================
// 1. PRINCIPAL VIEW
// ==========================================
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
        .select('*, teacher:teacher_id(name, email, class)')
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
    <div className="space-y-10 animate-fade-in font-sans font-light">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="space-y-2 max-w-full">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400">Principal Control</p>
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white tracking-tight uppercase">Academic Oversight</h1>
        </div>
        <button className="px-5 py-2 bg-[#001026] hover:bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all whitespace-nowrap">
           <TrendingUp size={16} className="inline mr-2"/> Full Analytics
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricBox title="Total Submissions" value={stats.total} trend="This Month" color="indigo" />
        <MetricBox title="Pending Review" value={stats.pending} trend="Urgent" color="rose" />
        <MetricBox title="Approved" value={stats.approved} trend="✓ Verified" color="emerald" />
        <MetricBox title="Rejected" value={stats.rejected} trend="Needs Work" color="amber" />
      </div>

      <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800 pb-6">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
              filter === f 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'approved' ? '✓ Approved' : '✗ Rejected'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-[12px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Worksheet Title</th>
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Teacher</th>
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Class</th>
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Subject</th>
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-4 py-4 sm:px-6 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-4 sm:px-6 font-medium text-slate-800 dark:text-slate-100">{sub.title || 'Untitled'}</td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-300">{sub.teacher?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-300">{sub.teacher?.class || 'N/A'}</td>
                    <td className="px-4 py-4 sm:px-6 text-slate-600 dark:text-slate-300">{sub.subject || 'N/A'}</td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${
                        sub.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
                        sub.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' :
                        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-slate-500 dark:text-slate-400">{new Date(sub.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-12 sm:px-6 text-center text-slate-400 dark:text-slate-500">No submissions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-6 uppercase tracking-wide">Teachers Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.map(teacher => {
            const teacherSubs = submissions.filter(s => s.teacher_id === teacher.id);
            return (
              <div key={teacher.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-all">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{teacher.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{teacher.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{teacherSubs.length}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">Submissions</p>
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

// MetricBox Component
function MetricBox({ title, value, trend, color }) {
  const bgColors = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
  };

  return (
    <div className={`p-8 sm:p-10 ${bgColors[color]} border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1`}>
      <div className="flex flex-col gap-4 justify-between items-start mb-8 sm:flex-row sm:items-center">
        <div className={`p-3 rounded-2xl ${bgColors[color]}`}><BarChart3 size={18}/></div>
        <span className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-md ${bgColors[color]}`}>{trend}</span>
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h2 className="text-4xl font-light text-slate-900 dark:text-white tracking-tighter mt-1">{value}</h2>
    </div>
  );
}
// ==========================================
// 2. COORDINATOR VIEW
// ==========================================
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
      setActionStatus('Approved Successfully ✓');
      setTimeout(() => setActionStatus(null), 2000);
      fetchSubmissions();
    } catch (e) {
      console.error("Error approving:", e);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      await supabase.from('worksheets').update({ status: 'rejected', rejection_reason: "Review guidelines not met" }).eq('id', submissionId);
      setActionStatus('Rejected');
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
    <div className="space-y-12 animate-fade-in font-sans font-light">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-slate-400">Coordinator Dashboard</p>
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tighter uppercase">Submission Review Queue</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">{filteredSubmissions.length}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pending Approvals</p>
          </div>
        </div>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold uppercase tracking-widest outline-none focus:border-indigo-400 transition-all" 
            placeholder="Search by title or teacher..."
          />
        </div>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold uppercase tracking-widest outline-none focus:border-indigo-400 transition-all cursor-pointer"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
        </select>
      </div>

      {actionStatus && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          {actionStatus}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading submissions...</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[4rem] text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" strokeWidth={0.5}/>
          <h2 className="text-xl tracking-widest uppercase font-light text-slate-900 dark:text-white">All Caught Up!</h2>
        </div>
      ) : (
        <div className="space-y-4">
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">{submission.title || 'Untitled Worksheet'}</h3>
          <div className="flex gap-8 mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            <div><p className="uppercase tracking-widest font-bold text-slate-400">Teacher</p><p className="text-slate-800 dark:text-slate-100">{submission.teacher?.name}</p></div>
            <div><p className="uppercase tracking-widest font-bold text-slate-400">Class</p><p className="text-slate-800 dark:text-slate-100">{submission.teacher?.class}</p></div>
            <div><p className="uppercase tracking-widest font-bold text-slate-400">Subject</p><p className="text-slate-800 dark:text-slate-100">{submission.subject || 'N/A'}</p></div>
            <div><p className="uppercase tracking-widest font-bold text-slate-400">Submitted</p><p className="text-slate-800 dark:text-slate-100">{new Date(submission.created_at).toLocaleDateString()}</p></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button onClick={onApprove} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
          <CheckCircle2 size={14} className="inline mr-2"/> Approve
        </button>
        <button onClick={() => setShowRejectReason(!showRejectReason)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
          <XCircle size={14} className="inline mr-2"/> Reject
        </button>
        <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
          <EyeIcon size={14} className="inline mr-2"/> Preview
        </button>
      </div>

      {showRejectReason && (
        <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-xl">
          <textarea 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 rounded-lg p-3 text-sm outline-none"
            rows="3"
          />
          <button 
            onClick={() => { onReject(); setShowRejectReason(false); setRejectReason(""); }}
            className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-bold uppercase transition-all"
          >
            Confirm Rejection
          </button>
        </div>
      )}
    </div>
  );
}
// ==========================================
// 3. TEACHER VIEW: WORKSHEET MANAGEMENT (FULL FIXED)
// ==========================================
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
    <div className="space-y-12 animate-fade-in font-sans font-light">
      {/* HEADER */}
      <header className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-10">
        <div>
          <p className="text-[9px] uppercase tracking-[0.5em] text-slate-400 font-bold italic">My Academic Portal</p>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tighter uppercase">Worksheet Dashboard</h1>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-2xl transition-all active:scale-95"
        >
          <PlusCircle size={16} className="inline mr-2"/> Create Worksheet
        </button>
      </header>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Created" value={stats.total} color="indigo" />
        <StatCard label="Pending Review" value={stats.pending} color="amber" />
        <StatCard label="Approved" value={stats.approved} color="emerald" />
      </div>

      {/* WORKSHEETS LIST */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading worksheets...</div>
      ) : worksheets.length === 0 ? (
        <div className="py-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[4rem] text-center">
           <BookOpen size={48} className="mx-auto text-indigo-500 mb-4" strokeWidth={0.5}/>
           <h2 className="text-xl tracking-widest uppercase font-light text-slate-900 dark:text-white">No Worksheets Yet</h2>
           <p className="text-xs italic mt-2 text-slate-500 dark:text-slate-400">Start creating by clicking the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {worksheets.map(ws => (
            <WorksheetCard key={ws.id} worksheet={ws} />
          ))}
        </div>
      )}

      {/* CREATE WORKSHEET MODAL */}
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

// Worksheet Card
function WorksheetCard({ worksheet }) {
  const statusColors = {
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    pending: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">{worksheet.title}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest font-medium">
            {worksheet.subject} • {worksheet.class}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase ${statusColors[worksheet.status]}`}>
          {worksheet.status}
        </span>
      </div>

      {worksheet.description && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2">{worksheet.description}</p>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all">
          <Edit2 size={12} className="inline mr-1"/> Edit
        </button>
        <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all">
          <EyeIcon size={12} className="inline mr-1"/> View
        </button>
        <button className="flex-1 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all">
          <Trash2 size={12} className="inline mr-1"/>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// CREATE WORKSHEET MODAL (Fully Fixed)
// ==========================================
function CreateWorksheetModal({ isOpen, onClose, formData, setFormData, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 max-h-[95vh] shadow-2xl p-6 sm:p-8 overflow-y-auto rounded-[2rem]">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={26} />
          </button>
          <h2 className="text-xl font-light text-slate-900 dark:text-white tracking-tighter uppercase">Upload Worksheet</h2>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900"></div>
        </div>

        <div className="space-y-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tighter">New Worksheet</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fill the details below</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 block mb-2">Worksheet Title</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-3 text-lg font-light text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                placeholder="Mid-Term Mathematics Paper"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 block mb-2">Subject</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
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
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 block mb-2">Difficulty Level</label>
              <select 
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({...formData, difficultyLevel: e.target.value})}
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 block mb-3">Description / Instructions</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="4"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                placeholder="Add any special instructions..."
              />
            </div>
          </div>

          <div className="pt-8 flex flex-col gap-4">
            <button 
              onClick={onSubmit}
              className="w-full bg-[#001026] hover:bg-black py-5 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.985]"
            >
              Submit for Approval <Send size={16} className="inline ml-2"/>
            </button>
            <button 
              onClick={onClose}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
  };

  return (
    <div className={`${colors[color]} p-6 rounded-2xl text-center border border-slate-100 dark:border-slate-700`}>
      <p className="text-[9px] font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
// ==========================================
// 4. STUDENT VIEW: VIEW APPROVED WORKSHEETS (FULL FIXED)
// ==========================================
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
    <div className="space-y-12 animate-fade-in font-sans font-light">
      <header className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-10">
        <div>
          <p className="text-[9px] uppercase tracking-[0.5em] text-slate-400 font-bold italic">Learning Center</p>
          <h1 className="text-3xl font-light text-slate-900 dark:text-white tracking-tighter uppercase">Study Materials</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{filteredWorksheets.length}</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Available</p>
        </div>
      </header>

      {/* SUBJECT FILTERS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-all ${
            filter === 'all' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Subjects
        </button>
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setFilter(subject)}
            className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-all ${
              filter === subject 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* WORKSHEETS GRID */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading materials...</div>
      ) : filteredWorksheets.length === 0 ? (
        <div className="py-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[4rem] text-center">
          <BookOpen size={48} className="mx-auto text-indigo-500 mb-4" strokeWidth={0.5}/>
          <h2 className="text-xl tracking-widest uppercase font-light text-slate-900 dark:text-white">No Materials Yet</h2>
          <p className="text-xs italic mt-2 text-slate-500 dark:text-slate-400">Check back soon for approved study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorksheets.map(ws => (
            <div 
              key={ws.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group"
            >
              <div className="mb-4">
                <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase mb-3">
                  ✓ Approved
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white line-clamp-2">{ws.title}</h3>
              </div>

              <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400 mb-6">
                <p><span className="font-bold text-slate-600 dark:text-slate-300">Teacher:</span> {ws.teacher?.name}</p>
                <p><span className="font-bold text-slate-600 dark:text-slate-300">Subject:</span> {ws.subject}</p>
                <p><span className="font-bold text-slate-600 dark:text-slate-300">Level:</span> {ws.difficulty_level}</p>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                <Download size={14} /> Download Material
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}