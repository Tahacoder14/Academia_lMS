"use client";
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getResourcesPendingApproval,
  approveResource,
  rejectResource,
  getTeacherAssignments,
  assignTeacherToClass,
  assignStudentToClass,
  getAllClasses,
  getSubjectsCatalog,
  getUsersByRole,
  createClassWithTeacher,
  assignClassTeacher,
  setStudentRollNumber,
  getClassFixtures,
  createClassFixture,
  getCurriculumProgress
} from '@/lib/api';
import {
  CheckCircle2, XCircle, Clock, BookOpen, Users2, Grid3x3,
  Plus, Edit2, Trash2, Eye, Download, Loader2, AlertCircle,
  Calendar, User, Zap, Filter
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [classForm, setClassForm] = useState({ name: '', grade_level: '', section: '', capacity: 40, class_teacher_id: '' });
  const [assignForm, setAssignForm] = useState({ classId: '', teacherId: '', subjectId: '' });
  const [enrollForm, setEnrollForm] = useState({ classId: '', studentId: '', rollNumber: '' });
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => {
    const fetchCoordinatorData = async () => {
      try {
        const [resData, teachData, currData] = await Promise.all([
          getResourcesPendingApproval(),
          getTeacherAssignments(),
          getCurriculumProgress()
        ]);

        const [me, allClasses, teacherUsers, studentUsers, allSubjects] = await Promise.all([
          getCurrentUser(),
          getAllClasses(),
          getUsersByRole('teacher'),
          getUsersByRole('student'),
          getSubjectsCatalog()
        ]);

        setCurrentUser(me);
        setResources(resData);
        setTeachers(teachData);
        setCurriculum(currData);
        setClassesList(allClasses);
        setAllTeachers(teacherUsers);
        setStudents(studentUsers);
        setSubjects(allSubjects);
      } catch (error) {
        console.error('Error fetching coordinator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatorData();
  }, []);

  const handleApprove = async (resourceId) => {
    try {
      await approveResource(resourceId, null);
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (error) {
      console.error('Error approving resource:', error);
    }
  };

  const handleReject = async (resourceId) => {
    if (!rejectReason) return;
    try {
      await rejectResource(resourceId, rejectReason);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      setRejectingId(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting resource:', error);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSaveBusy(true);
    try {
      const created = await createClassWithTeacher({
        name: classForm.name,
        grade_level: classForm.grade_level,
        section: classForm.section || null,
        capacity: parseInt(classForm.capacity, 10) || 40,
        class_teacher_id: classForm.class_teacher_id || null,
        institution_id: currentUser?.institution_id || null
      });
      setClassesList((prev) => [created, ...prev]);
      setClassForm({ name: '', grade_level: '', section: '', capacity: 40, class_teacher_id: '' });
      alert('Class created successfully.');
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error?.message || 'Failed to create class');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleAssignTeacherSubject = async () => {
    if (!assignForm.classId || !assignForm.teacherId || !assignForm.subjectId) {
      alert('Select class, teacher and subject.');
      return;
    }
    setSaveBusy(true);
    try {
      await assignTeacherToClass(assignForm.classId, assignForm.teacherId, assignForm.subjectId);
      await assignClassTeacher(assignForm.classId, assignForm.teacherId);
      const teachData = await getTeacherAssignments();
      setTeachers(teachData);
      setAssignForm({ classId: '', teacherId: '', subjectId: '' });
      alert('Teacher assigned successfully.');
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert(error?.message || 'Failed to assign teacher');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollForm.classId || !enrollForm.studentId || !enrollForm.rollNumber) {
      alert('Select class, student and roll number.');
      return;
    }
    setSaveBusy(true);
    try {
      await setStudentRollNumber(enrollForm.studentId, enrollForm.rollNumber);
      await assignStudentToClass(enrollForm.studentId, enrollForm.classId);
      setEnrollForm({ classId: '', studentId: '', rollNumber: '' });
      alert('Student enrolled and roll number saved.');
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert(error?.message || 'Failed to enroll student');
    } finally {
      setSaveBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const filteredResources = filterStatus === 'all'
    ? resources
    : resources.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in">
      
      {/* ============ HEADER ============ */}
      <div className="border-b border-slate-100 dark:border-white/5 pb-12">
        <h1 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          Academic Coordinator
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-4">
          Curriculum Management & Resource Approval
        </p>
      </div>

      {/* ============ QUICK STATS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <QuickStat
          icon={<Clock size={20} />}
          label="Pending Review"
          value={resources.filter(r => r.status === 'submitted').length}
          color="amber"
        />
        <QuickStat
          icon={<CheckCircle2 size={20} />}
          label="Approved Resources"
          value={resources.filter(r => r.status === 'approved').length}
          color="emerald"
        />
        <QuickStat
          icon={<Users2 size={20} />}
          label="Teachers Assigned"
          value={teachers.length}
          color="blue"
        />
        <QuickStat
          icon={<BookOpen size={20} />}
          label="Curriculum Tracking"
          value={curriculum.length}
          color="purple"
        />
      </div>

      {/* ============ TAB NAVIGATION ============ */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
        {['resources', 'teachers', 'assignments', 'timetable', 'curriculum'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-6 py-4 text-[11px] font-bold uppercase tracking-[0.3em] transition-colors border-b-2 whitespace-nowrap sm:whitespace-normal ${
              activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ============ RESOURCES TAB ============ */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Filter Bar */}
          <div className="flex gap-4 items-center">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-xl text-sm focus:outline-none"
            >
              <option value="all">All Resources</option>
              <option value="draft">Draft</option>
              <option value="submitted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Resource Cards */}
          <div className="space-y-4">
            {filteredResources.length > 0 ? (
              filteredResources.map(resource => (
                <ResourceReviewCard
                  key={resource.id}
                  resource={resource}
                  onApprove={() => handleApprove(resource.id)}
                  onReject={() => setRejectingId(resource.id)}
                  isRejecting={rejectingId === resource.id}
                  onRejectSubmit={() => handleReject(resource.id)}
                  rejectReason={rejectReason}
                  setRejectReason={setRejectReason}
                  onCancelReject={() => setRejectingId(null)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BookOpen size={32} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">No resources pending review</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TEACHERS TAB ============ */}
      {activeTab === 'teachers' && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-100 dark:border-white/10">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="text-left py-4 px-6">Teacher Name</th>
                <th className="text-left py-4 px-6">Email</th>
                <th className="text-left py-4 px-6">Department</th>
                <th className="text-left py-4 px-6">Classes Assigned</th>
                <th className="text-left py-4 px-6">Experience</th>
                <th className="text-left py-4 px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr
                  key={teacher.id}
                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">
                    {teacher.teacher?.full_name || 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {teacher.teacher?.email || 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {teacher.teacher?.teacher_department || '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {teacher.class?.name || '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    {teacher.teacher?.teacher_experience_years || 0} years
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ ASSIGNMENTS TAB ============ */}
      {activeTab === 'assignments' && (
        <div className="space-y-8">
          <form onSubmit={handleCreateClass} className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">Create Class</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class name (e.g. Grade 6-A)" className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm" required />
              <input value={classForm.grade_level} onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value })} placeholder="Grade level" className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm" required />
              <input value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} placeholder="Section" className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm" />
              <input type="number" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })} placeholder="Capacity" className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm" />
              <select value={classForm.class_teacher_id} onChange={(e) => setClassForm({ ...classForm, class_teacher_id: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Class teacher (optional)</option>
                {allTeachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <button disabled={saveBusy} className="mt-5 px-8 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">Create Class</button>
          </form>

          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">Assign Teacher to Class Subject</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Select class</option>
                {classesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Select teacher</option>
                {allTeachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
              <select value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" disabled={saveBusy} onClick={handleAssignTeacherSubject} className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">Assign</button>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">Enroll Student + Roll Number</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={enrollForm.classId} onChange={(e) => setEnrollForm({ ...enrollForm, classId: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Select class</option>
                {classesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={enrollForm.studentId} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })} className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option value="">Select student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <input value={enrollForm.rollNumber} onChange={(e) => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })} placeholder="Roll Number" className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm" />
              <button type="button" disabled={saveBusy} onClick={handleEnrollStudent} className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">Enroll</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TIMETABLE TAB ============ */}
      {activeTab === 'timetable' && (
        <div className="space-y-8">
          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Grid3x3 size={16} />
              Class Fixtures & Timetable
            </h2>
            <div className="flex gap-4 mb-6">
              <select className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm">
                <option>Select Class</option>
              </select>
              <button className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-700 transition-colors">
                Add Fixture
              </button>
            </div>
            <div className="text-center py-12 text-slate-400">
              <Calendar size={32} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a class to manage timetable</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ CURRICULUM TAB ============ */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {curriculum.map((item) => (
            <CurriculumCard key={item.id} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ COMPONENTS ============

function QuickStat({ icon, label, value, color }) {
  const colors = {
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`p-8 rounded-2xl border border-slate-100 dark:border-white/5 ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
      <h3 className="text-3xl font-light tracking-tight">
        {value}
      </h3>
    </div>
  );
}

function ResourceReviewCard({ resource, onApprove, onReject, isRejecting, onRejectSubmit, rejectReason, setRejectReason, onCancelReject }) {
  return (
    <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {resource.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {resource.description}
          </p>
          <div className="flex gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <span>By: {resource.teacher?.full_name}</span>
            <span>Class: {resource.class?.name}</span>
            <span>Subject: {resource.subject?.name}</span>
            <span>Type: {resource.type}</span>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
          resource.status === 'submitted'
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'
        }`}>
          {resource.status}
        </span>
      </div>

      {isRejecting && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide rejection reason..."
            className="w-full p-3 bg-white dark:bg-[#0A0C14] border border-rose-200 dark:border-rose-500/20 rounded-lg text-sm focus:outline-none focus:border-rose-500"
            rows={3}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={onRejectSubmit}
              className="px-6 py-2 bg-rose-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-rose-700 transition-colors"
            >
              Confirm Rejection
            </button>
            <button
              onClick={onCancelReject}
              className="px-6 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onApprove}
          className="flex-1 px-6 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={14} />
          Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-6 py-3 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <XCircle size={14} />
          Reject
        </button>
      </div>
    </div>
  );
}

function CurriculumCard({ data }) {
  const percentage = data.completion_percentage || 0;
  return (
    <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {data.classes?.name} - {data.subjects?.name}
          </h3>
          <p className="text-sm text-slate-500">Coordinator: {data.coordinator?.full_name}</p>
        </div>
        <span className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
          data.status === 'on_track'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : data.status === 'behind'
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
        }`}>
          {data.status?.replace('_', ' ')}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="font-medium text-slate-900 dark:text-white">{percentage}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
