"use client";
import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getTeacherClasses,
  uploadResource,
  createTeacherAssessment,
  getTeachingResources
} from '@/lib/api';
import {
  BookOpen, Users2, Upload, BarChart3, Clock, CheckCircle2,
  Plus, Download, Eye, Edit2, Loader2, Calendar, AlertCircle, Search
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
      alert('Please fill all required fields');
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

      const updatedResources = await getTeachingResources();
      setResources(updatedResources);

      setFormData({ title: '', description: '', type: 'pdf', contentUrl: '', file: null });
      alert('Resource uploaded successfully! Awaiting coordinator approval.');
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
      alert('Please select a class and fill required fields');
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
      alert('Assessment created successfully!');
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert(error?.message || 'Failed to create assessment');
    }
  };

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
      <div className="border-b border-slate-200 dark:border-white/10 pb-8">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">Teacher Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage classes, resources, assessments & attendance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <StatCard icon={<BookOpen size={22} />} label="My Classes" value={classes.length} color="indigo" />
        <StatCard 
          icon={<Users2 size={22} />} 
          label="Students" 
          value={classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)} 
          color="emerald" 
        />
        <StatCard icon={<Upload size={22} />} label="Resources" value={resources.length} color="blue" />
        <StatCard icon={<Clock size={22} />} label="Pending" value="0" color="amber" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-max">
          {['classes', 'resources', 'assessments', 'attendance', 'grades', 'resources-library'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium rounded-t-2xl transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>      {/* ==================== CLASSES TAB ==================== */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length > 0 ? (
            classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                onSelect={() => setSelectedClass(classItem)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
              <BookOpen size={48} className="mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No classes assigned yet</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== RESOURCES TAB ==================== */}
      {activeTab === 'resources' && (
        <div className="space-y-8">
          {/* Upload Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10">
            <h2 className="text-xl font-medium mb-8 flex items-center gap-3">
              <Upload size={22} /> Upload New Resource
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Class</label>
                  <select
                    value={selectedClass?.id || ''}
                    onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.class?.name} — {c.subject?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Resource Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="video">Video Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Chapter 5 - Introduction to Algebra"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Content URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.contentUrl}
                  onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingFile}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-medium rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                {uploadingFile ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {uploadingFile ? 'Uploading...' : 'Upload Resource'}
              </button>
            </form>
          </div>

          {/* Recent Resources */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8">
            <h3 className="font-medium mb-6">Recent Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.slice(0, 6).map(res => (
                <ResourceItem key={res.id} resource={res} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ASSESSMENTS TAB ==================== */}
      {activeTab === 'assessments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10">
          <h2 className="text-xl font-medium mb-8 flex items-center gap-3">
            <Plus size={22} /> Create New Assessment
          </h2>
          <form onSubmit={handleAssessmentCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Class</label>
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
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
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Due Date</label>
                <input
                  type="date"
                  value={assessmentData.dueDate}
                  onChange={(e) => setAssessmentData({ ...assessmentData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Assessment Title"
              value={assessmentData.title}
              onChange={(e) => setAssessmentData({ ...assessmentData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl transition-all"
            >
              Create Assessment
            </button>
          </form>
        </div>
      )}

      {/* Placeholder for remaining tabs */}
      {(activeTab === 'attendance' || activeTab === 'grades' || activeTab === 'resources-library') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-20 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-light text-slate-600 dark:text-slate-400">This section is under development</p>
          <p className="text-sm mt-2 text-slate-500">Will be available in the next update</p>
        </div>
      )}
    </div>
  );
}

/* ===================== HELPER COMPONENTS ===================== */
function StatCard({ icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} hover:shadow-md transition-all`}>
      <div className="flex items-center gap-3 mb-4 text-slate-600 dark:text-slate-400">
        {icon}
        <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-4xl font-light text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ClassCard({ classData, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all group"
    >
      <h3 className="text-lg font-medium text-slate-900 dark:text-white">{classData.class?.name}</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1">{classData.subject?.name}</p>
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 text-xs uppercase tracking-widest text-slate-500">
        Click to manage class →
      </div>
    </div>
  );
}

function ResourceItem({ resource }) {
  return (
    <div className="p-5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-indigo-300 transition-all">
      <div className="flex justify-between items-start">
        <h4 className="font-medium line-clamp-1 pr-4">{resource.title}</h4>
        <span className="text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{resource.type}</span>
      </div>
      <p className="text-xs text-slate-500 mt-3 line-clamp-2">{resource.description}</p>
    </div>
  );
}
