"use client";
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getStudentClasses,
  getStudentResources,
  getStudentAssignments,
  submitAssignment,
  getStudentProgress,
  getStudentAttendance,
  getStudentFeedback
} from '@/lib/api';
import {
  Heart, PlayCircle, Download, Calendar, BarChart3, MessageSquare,
  Loader2, ChevronRight, X, CheckCircle2, Clock, AlertCircle,
  FileText, Award, TrendingUp, Search, Filter, Wallet, CalendarCheck,
  ShieldCheck, DownloadCloud
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
  const [activeTab, setActiveTab] = useState('resources');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const me = await getCurrentUser();
        const userId = me?.id ?? null;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const attendancePercentage = attendance.length > 0
    ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(0)
    : 0;

  const averageGrade = progress.length > 0
    ? (progress.reduce((sum, g) => sum + (g.marks_obtained || 0), 0) / progress.length).toFixed(1)
    : 0;

  const filteredResources = resources.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in font-sans font-light pb-10 sm:pb-12 relative dark:text-slate-200">
      
      {/* 1. ELEGANT HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-100 dark:border-white/5 pb-6 sm:pb-8">
         <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">Student Hub</h1>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 font-bold mt-2">Active Learning Protocol — 2026</p>
         </div>
         <div className="flex items-center gap-2 sm:gap-3 bg-emerald-50 dark:bg-emerald-500/10 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
            <Heart size={13} className="text-emerald-500 animate-pulse"/>
            <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Attendance: 98%</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* 2. REFINED LESSON FEED (LEFT COLUMN) */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
           <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] ml-1 sm:ml-2">Assigned Syllabus</h3>
           <div className="space-y-3 sm:space-y-4">
              <LessonItem 
                title="Introduction to Geometry" 
                sub="Grade 10 • Mathematics" 
                type="video" 
                time="15:00 MIN"
                onClick={() => setSelectedLesson({ title: 'Introduction to Geometry', type: 'video', author: 'Ms. Mehak', desc: 'Focusing on Euclid axioms and planar geometry fundamentals.' })} 
              />
              <LessonItem 
                title="English Literature Notes" 
                sub="Grade 10 • Humanities" 
                type="pdf" 
                time="2.4 MB"
                onClick={() => setSelectedLesson({ title: 'English Literature Notes', type: 'pdf', author: 'Mr. Khan', desc: 'Comprehensive guide to Shakespearean sonnets for midterm prep.' })} 
              />
           </div>
        </div>

        {/* 3. SERVICE TILES (RIGHT COLUMN) */}
        <div className="space-y-5 sm:space-y-6">
           <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] ml-1 sm:ml-2">Administrative Services</h3>
           <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <ServiceCard title="Fee Challans" sub="1 Pending Payment" icon={<Wallet size={18}/>} color="indigo" />
              <ServiceCard title="Assignments" sub="2 Submissions Due" icon={<CalendarCheck size={18}/>} color="rose" />
           </div>
        </div>
      </div>

      {/* --- 4. THE PROFESSIONAL DIALOG BOX (MODAL) --- */}
      {selectedLesson && (
        <>
          <div className="fixed inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-md z-[100] animate-in fade-in duration-300" onClick={() => setSelectedLesson(null)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-white/5 shadow-2xl z-[101] animate-in zoom-in-95 duration-300 overflow-hidden max-h-[90vh] overflow-y-auto">
             {/* Modal Decoration */}
             <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
             
             <div className="p-6 sm:p-10 space-y-8 sm:space-y-10">
                <div className="flex justify-between items-start">
                   <div>
                      <span className="text-[9px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-[0.4em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-md">Validated Source</span>
                      <h2 className="text-3xl font-light text-slate-950 dark:text-white tracking-tight mt-4">{selectedLesson.title}</h2>
                   </div>
                   <button onClick={() => setSelectedLesson(null)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-950 dark:hover:text-white transition-all">
                      <X size={24} strokeWidth={1} />
                   </button>
                </div>

                <div className="space-y-6">
                   <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-normal">{selectedLesson.desc}</p>
                   
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Syllabus Lead</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-300">{selectedLesson.author}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Format</p>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-300 uppercase">{selectedLesson.type}</p>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95">
                      Open Module
                   </button>
                   <button className="px-8 py-4 border border-slate-100 dark:border-white/10 rounded-full text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                      Details
                   </button>
                </div>

                <div className="flex justify-center opacity-30">
                   <ShieldCheck size={42} strokeWidth={0.5} className="text-slate-400 dark:text-slate-600"/>
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
}

function LessonItem({ title, sub, type, time, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] flex items-center justify-between group cursor-pointer transition-all hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 duration-500"
    >
      <div className="flex items-center gap-8">
        <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {type === 'video' ? <PlayCircle size={22}/> : <DownloadCloud size={22}/>}
        </div>
        <div>
          <h4 className="text-[17px] font-normal text-slate-800 dark:text-white tracking-tight">{title}</h4>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-1">{sub} • <span className="text-slate-300 dark:text-slate-600 font-normal">{time}</span></p>
        </div>
      </div>
      <div className="p-3 text-slate-200 dark:text-slate-700 group-hover:text-indigo-400 dark:group-hover:text-indigo-400 transition-colors">
        <ChevronRight size={18}/>
      </div>
    </div>
  );
}

function ServiceCard({ title, sub, icon, color }) {
  const colorMap = {
    indigo: "text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 shadow-indigo-100 dark:shadow-none",
    rose: "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 shadow-rose-100 dark:shadow-none"
  }
  return (
    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] shadow-sm hover:shadow-xl dark:hover:shadow-none transition-all duration-500 hover:-translate-y-1 cursor-pointer group">
       <div className={`p-4 w-fit rounded-2xl mb-8 ${colorMap[color]}`}>{icon}</div>
       <h4 className="text-xl font-light text-slate-800 dark:text-white tracking-tight">{title}</h4>
       <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-2">{sub}</p>
    </div>
  );
}