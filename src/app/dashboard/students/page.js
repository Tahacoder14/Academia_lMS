"use client";
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getStudentClasses,
  getStudentResources,
  getStudentAssignments,
  getStudentProgress,
  getStudentAttendance,
  getStudentFeedback
} from '@/lib/api';
import {
  Heart, PlayCircle, Download, Calendar, BarChart3, MessageSquare,
  Loader2, ChevronRight, X, CheckCircle2, Clock, AlertCircle,
  FileText, Award, TrendingUp, Search
} from 'lucide-react';

export default function StudentHub() {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const me = await getCurrentUser();
        const userId = me?.id;

        const [
          classesData,
          resourcesData,
          assignmentsData,
          progressData,
          attendanceData,
          feedbackData
        ] = await Promise.all([
          getStudentClasses(userId),
          getStudentResources(userId),
          getStudentAssignments(userId),
          getStudentProgress(userId),
          getStudentAttendance(userId),
          getStudentFeedback(userId)
        ]);

        setProfile(me);
        setClasses(classesData);
        setResources(resourcesData);
        setAssignments(assignmentsData);
        setProgress(progressData);
        setAttendance(attendanceData);
        setFeedback(feedbackData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const attendancePercentage = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  const averageGrade = progress.length > 0
    ? (progress.reduce((sum, g) => sum + (g.marks_obtained || 0), 0) / progress.length).toFixed(1)
    : 0;

  const filteredResources = resources.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Student Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your learning dashboard • {new Date().getFullYear()}</p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <Heart size={18} className="text-emerald-500" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Attendance</p>
            <p className="text-lg font-light text-emerald-700 dark:text-emerald-300">{attendancePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={<BookOpen size={22} />} label="Enrolled Classes" value={classes.length} color="indigo" />
        <StatCard icon={<Award size={22} />} label="Avg. Grade" value={`${averageGrade}%`} color="emerald" />
        <StatCard icon={<Calendar size={22} />} label="Assignments" value={assignments.length} color="blue" />
        <StatCard icon={<TrendingUp size={22} />} label="Progress" value="92%" color="amber" />
      </div>

      {/* Main Tabs */}
      <div className="border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        <div className="flex gap-1 min-w-max pb-1">
          {['dashboard', 'resources', 'assignments', 'attendance', 'progress'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium rounded-t-2xl transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'dashboard' ? 'Overview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD / OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Lessons */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">This Week's Lessons</h3>
            <div className="space-y-4">
              {resources.slice(0, 4).map(res => (
                <LessonItem
                  key={res.id}
                  title={res.title}
                  sub={`${res.subject?.name || ''} • ${res.class?.name || ''}`}
                  type={res.type}
                  onClick={() => setSelectedLesson(res)}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Quick Services */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pl-1">Quick Access</h3>
            <div className="space-y-4">
              <ServiceCard title="Fee Challans" sub="View pending payments" icon={<Wallet size={20} />} color="indigo" />
              <ServiceCard title="Submit Assignment" sub="2 due this week" icon={<FileText size={20} />} color="rose" />
            </div>
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResources.map(res => (
              <ResourceCard key={res.id} resource={res} onClick={() => setSelectedLesson(res)} />
            ))}
          </div>
        </div>
      )}

      {/* Other tabs as placeholders */}
      {(activeTab === 'assignments' || activeTab === 'attendance' || activeTab === 'progress') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-16 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-light">This section is under development</p>
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedLesson(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-light">{selectedLesson.title}</h2>
              <button onClick={() => setSelectedLesson(null)}><X size={24} /></button>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedLesson.description}</p>
            <button className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-medium">Open Resource</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3 mb-4 text-slate-600 dark:text-slate-400">{icon}</div>
      <p className="text-4xl font-light text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function LessonItem({ title, sub, type, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl hover:shadow-xl hover:-translate-y-0.5 cursor-pointer transition-all group"
    >
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
        {type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
      </div>
      <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </div>
  );
}

function ServiceCard({ title, sub, icon, color }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl hover:shadow-md transition-all cursor-pointer">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
        {icon}
      </div>
      <h4 className="font-medium text-slate-900 dark:text-white">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function ResourceCard({ resource, onClick }) {
  return (
    <div onClick={onClick} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl hover:shadow-xl cursor-pointer transition-all">
      <h4 className="font-medium text-slate-900 dark:text-white line-clamp-2">{resource.title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{resource.subject?.name}</p>
    </div>
  );
}