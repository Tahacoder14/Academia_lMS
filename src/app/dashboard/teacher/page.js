"use client";
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getTeacherClasses,
  uploadResource,
  createTeacherAssessment,
  getClassStudents,
  markAttendance,
  submitGrades,
  getTeachingResources
} from '@/lib/api';
import {
  BookOpen, Users2, Upload, BarChart3, Clock, CheckCircle2,
  Plus, Download, Eye, Edit2, Loader2, Calendar, AlertCircle,
  Filter, Search
} from 'lucide-react';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [resources, setResources] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf',
    contentUrl: '',
    file: null
  });
  const [assessmentData, setAssessmentData] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalMarks: 100
  });

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const [user, classesData, resourcesData] = await Promise.all([
          getCurrentUser(),
          getTeacherClasses(null),
          getTeachingResources()
        ]);

        setCurrentUser(user);
        setClasses(classesData);
        setResources(resourcesData);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title || !selectedClass) {
      alert('Please fill all fields');
      return;
    }

    setUploadingFile(true);
    try {
      await uploadResource({
        class_id: selectedClass.class_id,
        subject_id: selectedClass.subject_id,
        teacher_id: currentUser?.id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.contentUrl || null,
        status: 'submitted',
        is_visible_to_students: false
      });

      const resourcesData = await getTeachingResources();
      setResources(resourcesData);

      // Reset form
      setFormData({ title: '', description: '', type: 'pdf', contentUrl: '', file: null });
      alert('Resource submitted to coordinator for approval.');
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert(error?.message || 'Failed to upload resource');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAssessmentCreate = async (e) => {
    e.preventDefault();
    if (!selectedClass || !assessmentData.title || !assessmentData.dueDate) {
      alert('Select class and fill required assessment fields.');
      return;
    }
    try {
      await createTeacherAssessment({
        title: assessmentData.title,
        description: assessmentData.description,
        class_id: selectedClass.class_id,
        subject_id: selectedClass.subject_id,
        teacher_id: currentUser?.id,
        due_date: assessmentData.dueDate,
        total_marks: parseInt(assessmentData.totalMarks, 10) || 100
      });
      setAssessmentData({ title: '', description: '', dueDate: '', totalMarks: 100 });
      alert('Assessment created successfully.');
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert(error?.message || 'Failed to create assessment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in">
      
      {/* ============ HEADER ============ */}
      <div className="border-b border-slate-100 dark:border-white/5 pb-12">
        <h1 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          Teacher Portal
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-4">
          Classroom Management & Teaching Resources
        </p>
      </div>

      {/* ============ QUICK STATS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard
          icon={<BookOpen size={20} />}
          label="My Classes"
          value={classes.length}
          color="indigo"
        />
        <StatCard
          icon={<Users2 size={20} />}
          label="Total Students"
          value={classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
          color="emerald"
        />
        <StatCard
          icon={<Upload size={20} />}
          label="Resources Shared"
          value={resources.length}
          color="blue"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending Submissions"
          value="0"
          color="amber"
        />
      </div>

      {/* ============ TAB NAVIGATION ============ */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 overflow-x-auto">
        {['classes', 'resources', 'assessments', 'attendance', 'grades', 'resources-library'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-[0.3em] transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* ============ MY CLASSES TAB ============ */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {classes.map(classItem => (
            <ClassCard
              key={classItem.id}
              classData={classItem}
              onSelect={() => setSelectedClass(classItem)}
            />
          ))}
        </div>
      )}

      {/* ============ UPLOAD RESOURCES TAB ============ */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Upload Form */}
          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <Upload size={16} />
              Upload Teaching Resource
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                    Class
                  </label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const selected = classes.find(c => c.id === e.target.value);
                      setSelectedClass(selected);
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.class?.name} - {c.subject?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                    Resource Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="video">Video Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Resource Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chapter 5 - Algebra Introduction"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the resource..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Content URL (video/pdf link)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingFile}
                className="w-full px-6 py-4 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                {uploadingFile ? 'Uploading...' : 'Upload Resource'}
              </button>
            </form>
          </div>

          {/* Recent Uploads */}
          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">
              Your Recent Uploads
            </h3>
            <div className="space-y-4">
              {resources.slice(0, 5).map(res => (
                <ResourceItem key={res.id} resource={res} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============ ASSESSMENTS TAB ============ */}
      {activeTab === 'assessments' && (
        <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Plus size={16} />
            Create Assessment / Assignment
          </h2>
          <form onSubmit={handleAssessmentCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Class + Subject
                </label>
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => {
                    const selected = classes.find(c => c.id === e.target.value);
                    setSelectedClass(selected);
                  }}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class?.name} - {c.subject?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
                  Due Date
                </label>
                <input
                  type="date"
                  value={assessmentData.dueDate}
                  onChange={(e) => setAssessmentData({ ...assessmentData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Assessment title"
                value={assessmentData.title}
                onChange={(e) => setAssessmentData({ ...assessmentData, title: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="number"
                placeholder="Total Marks"
                value={assessmentData.totalMarks}
                onChange={(e) => setAssessmentData({ ...assessmentData, totalMarks: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                min={1}
                max={1000}
              />
            </div>
            <textarea
              placeholder="Assessment instructions..."
              value={assessmentData.description}
              onChange={(e) => setAssessmentData({ ...assessmentData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
              rows={4}
            />
            <button className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-colors">
              Create Assessment
            </button>
          </form>
        </div>
      )}

      {/* ============ ATTENDANCE TAB ============ */}
      {activeTab === 'attendance' && (
        <AttendanceSection classes={classes} />
      )}

      {/* ============ GRADES TAB ============ */}
      {activeTab === 'grades' && (
        <GradesSection classes={classes} />
      )}

      {/* ============ RESOURCES LIBRARY TAB ============ */}
      {activeTab === 'resources-library' && (
        <div className="space-y-6">
          <div className="flex gap-4 items-center mb-6">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search resources..."
              className="flex-1 px-4 py-2 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map(res => (
              <ResourceLibraryCard key={res.id} resource={res} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ COMPONENTS ============

function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
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

function ClassCard({ classData, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-lg transition-all"
    >
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
        {classData.class?.name}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {classData.subject?.name}
      </p>
      <div className="space-y-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
        <p>Periods per week: {classData.periods_per_week}</p>
        <p>Total marks: {classData.subject?.total_marks}</p>
      </div>
    </div>
  );
}

function ResourceItem({ resource }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
            {resource.title}
          </h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            {resource.class?.name} • {resource.type}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
          resource.status === 'approved'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}>
          {resource.status}
        </span>
      </div>
    </div>
  );
}

function ResourceLibraryCard({ resource }) {
  return (
    <div className="p-6 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-2xl hover:border-indigo-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white flex-1">
          {resource.title}
        </h4>
        <Eye size={16} className="text-indigo-600 cursor-pointer" />
      </div>
      <p className="text-[10px] text-slate-500 mb-4 line-clamp-2">
        {resource.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
          {resource.teacher?.full_name}
        </span>
        <Download size={14} className="text-indigo-600 cursor-pointer" />
      </div>
    </div>
  );
}

function AttendanceSection({ classes }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
      <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
        <Calendar size={16} />
        Mark Attendance
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
            Select Class
          </label>
          <select
            value={selectedClass?.id || ''}
            onChange={(e) => {
              const selected = classes.find(c => c.id === e.target.value);
              setSelectedClass(selected);
            }}
            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.class?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block mb-3">
            Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="text-center py-12 text-slate-400">
        <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Select a class and date to mark attendance</p>
      </div>
    </div>
  );
}

function GradesSection({ classes }) {
  return (
    <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
      <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
        <BarChart3 size={16} />
        Submit Grades
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <input
          type="text"
          placeholder="Student Name..."
          className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          placeholder="Marks Obtained..."
          className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
        />
        <button className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-indigo-700 transition-colors">
          Submit Grade
        </button>
      </div>

      <div className="text-center py-12 text-slate-400">
        <BarChart3 size={32} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Grade submission interface</p>
      </div>
    </div>
  );
}
