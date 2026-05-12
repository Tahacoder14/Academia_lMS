"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getCurrentUser,
  getTeacherClasses,
  getClassStudents,
  submitGrades,
  getStudentProgress,
  subscribeToGradesChanges
} from '@/lib/api';
import {
  BarChart3, Download, Plus, Edit2, Trash2, Eye, FileText,
  Loader2, Search, Filter, CheckCircle2, Clock, AlertCircle,
  Printer, MoreVertical, Zap
} from 'lucide-react';

export default function ResultsReporting() {
  const [activeTab, setActiveTab] = useState('entry');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (user?.role === 'teacher') {
          const classesData = await getTeacherClasses(user.id);
          setClasses(classesData);
        } else if (user?.role === 'principal') {
          // Principal sees all classes for reporting
          const { data } = await supabase.from('classes').select('*');
          setClasses(data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClass) {
        try {
          const studentsData = await getClassStudents(selectedClass.class_id || selectedClass.id);
          setStudents(studentsData);
          
          // Fetch existing grades
          const { data: gradesData } = await supabase
            .from('grades')
            .select('*')
            .eq('class_id', selectedClass.class_id || selectedClass.id);
          
          // Convert to map for easier access
          const gradesMap = {};
          gradesData?.forEach(g => {
            gradesMap[`${g.student_id}-${g.subject_id}`] = g;
          });
          setGrades(gradesMap);
        } catch (error) {
          console.error('Error fetching students:', error);
        }
      }
    };

    fetchStudents();
  }, [selectedClass]);

  const handleGradeChange = (studentId, subjectId, marks) => {
    const key = `${studentId}-${subjectId}`;
    setGrades(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        student_id: studentId,
        subject_id: subjectId,
        marks_obtained: parseInt(marks) || 0,
        class_id: selectedClass.class_id || selectedClass.id,
        teacher_id: currentUser?.id,
        recorded_date: new Date().toISOString()
      }
    }));
  };

  const handleSubmitGrades = async () => {
    if (!selectedClass) return;
    
    setSubmitting(true);
    try {
      const gradesArray = Object.values(grades).filter(g => g.marks_obtained > 0);
      
      if (gradesArray.length === 0) {
        alert('Please enter at least one grade');
        return;
      }

      await submitGrades(gradesArray);
      alert('Grades submitted successfully!');
      setGrades({});
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  const generateStudentReport = async (studentId) => {
    try {
      const { data: studentGrades } = await supabase
        .from('grades')
        .select(`
          *,
          subject:subjects(name, total_marks),
          class:classes(name)
        `)
        .eq('student_id', studentId);

      if (!studentGrades || studentGrades.length === 0) {
        alert('No grades found for this student');
        return;
      }

      // Calculate overall stats
      const totalMarks = studentGrades.reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
      const avgPercentage = (totalMarks / (studentGrades.length * 100)) * 100;

      setSelectedStudent({
        id: studentId,
        grades: studentGrades,
        totalMarks,
        avgPercentage,
        generatedAt: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const downloadReport = () => {
    if (!selectedStudent) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #001026; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #001026; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-box { padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .info-box label { font-weight: bold; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th { background: #001026; color: white; padding: 12px; text-align: left; }
            table td { padding: 10px; border-bottom: 1px solid #ddd; }
            table tr:nth-child(even) { background: #f9f9f9; }
            .summary { margin: 20px 0; padding: 15px; background: #e8f0fe; border-left: 4px solid #001026; }
            .summary h3 { margin-top: 0; color: #001026; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Result Report</h1>
            <p>Academic Excellence & Performance Documentation</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <label>Report Generated:</label>
              <p>${selectedStudent.generatedAt}</p>
            </div>
            <div class="info-box">
              <label>Student ID:</label>
              <p>${selectedStudent.id}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Marks Obtained</th>
                <th>Total Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${selectedStudent.grades.map(grade => {
                const percentage = (grade.marks_obtained / grade.subject.total_marks) * 100;
                let gradeValue = 'F';
                if (percentage >= 90) gradeValue = 'A+';
                else if (percentage >= 80) gradeValue = 'A';
                else if (percentage >= 70) gradeValue = 'B';
                else if (percentage >= 60) gradeValue = 'C';
                else if (percentage >= 50) gradeValue = 'D';
                
                return `
                  <tr>
                    <td>${grade.subject.name}</td>
                    <td>${grade.marks_obtained}</td>
                    <td>${grade.subject.total_marks}</td>
                    <td>${percentage.toFixed(2)}%</td>
                    <td><strong>${gradeValue}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Performance Summary</h3>
            <p><strong>Total Marks Obtained:</strong> ${selectedStudent.totalMarks}</p>
            <p><strong>Overall Percentage:</strong> ${selectedStudent.avgPercentage.toFixed(2)}%</p>
            <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="footer">
            <p>This is an official academic record. Please preserve this document.</p>
            <p>Generated by Academia LMS • ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Student_Report_${selectedStudent.id}_${Date.now()}.html`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  const filteredStudents = students.filter(s =>
    s.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20 font-sans font-light animate-fade-in">
      
      {/* ============ HEADER ============ */}
      <div className="border-b border-slate-100 dark:border-white/5 pb-12">
        <h1 className="text-5xl font-light text-slate-950 dark:text-white tracking-tighter uppercase">
          Results & Reporting
        </h1>
        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mt-4">
          Grade Entry & Performance Reports
        </p>
      </div>

      {/* ============ TAB NAVIGATION ============ */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-white/5">
        {['entry', 'reports', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-[0.3em] transition-colors border-b-2 ${
              activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'entry' && 'Grade Entry'}
            {tab === 'reports' && 'Student Reports'}
            {tab === 'history' && 'History'}
          </button>
        ))}
      </div>

      {/* ============ GRADE ENTRY TAB ============ */}
      {activeTab === 'entry' && (
        <div className="space-y-8">
          {/* Class Selection */}
          <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
            <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">
              Select Class
            </h2>
            <select
              value={selectedClass?.id || ''}
              onChange={(e) => {
                const selected = classes.find(c => c.id === e.target.value);
                setSelectedClass(selected);
              }}
              className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.grade_level && `- Grade ${c.grade_level}`}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Entry Table */}
          {selectedClass && students.length > 0 && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-100 dark:border-white/10">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="text-left py-4 px-6">Student Name</th>
                      <th className="text-left py-4 px-6">Roll Number</th>
                      <th className="text-center py-4 px-6">Marks (Out of 100)</th>
                      <th className="text-left py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const gradeKey = `${student.student_id}-${selectedClass.subject_id}`;
                      const gradeData = grades[gradeKey];
                      return (
                        <tr
                          key={student.id}
                          className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">
                            {student.student?.full_name}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                            {student.roll_number || '-'}
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradeData?.marks_obtained || ''}
                              onChange={(e) =>
                                handleGradeChange(
                                  student.student_id,
                                  selectedClass.subject_id,
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-20 px-3 py-2 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-center text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-4 px-6">
                            {gradeData ? (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            ) : (
                              <Clock size={16} className="text-slate-300" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSubmitGrades}
                disabled={submitting}
                className="px-8 py-4 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Zap size={16} />
                {submitting ? 'Submitting...' : 'Submit All Grades'}
              </button>
            </div>
          )}

          {selectedClass && students.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
              <p>No students enrolled in this class</p>
            </div>
          )}
        </div>
      )}

      {/* ============ STUDENT REPORTS TAB ============ */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          {selectedStudent ? (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                      Student Performance Report
                    </h2>
                    <p className="text-sm text-slate-500">
                      Generated on {selectedStudent.generatedAt}
                    </p>
                  </div>
                  <button
                    onClick={downloadReport}
                    className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                  >
                    <Download size={14} />
                    Download Report
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Total Marks
                    </p>
                    <h3 className="text-3xl font-light text-slate-900 dark:text-white">
                      {selectedStudent.totalMarks}
                    </h3>
                  </div>
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                      Average %
                    </p>
                    <h3 className="text-3xl font-light text-indigo-600 dark:text-indigo-400">
                      {selectedStudent.avgPercentage.toFixed(1)}%
                    </h3>
                  </div>
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                      Subjects
                    </p>
                    <h3 className="text-3xl font-light text-emerald-600 dark:text-emerald-400">
                      {selectedStudent.grades.length}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Grades Table */}
              <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 dark:border-white/10">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="text-left py-4 px-6">Subject</th>
                      <th className="text-right py-4 px-6">Marks</th>
                      <th className="text-right py-4 px-6">Total</th>
                      <th className="text-right py-4 px-6">%</th>
                      <th className="text-center py-4 px-6">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.grades.map(grade => {
                      const percentage = (grade.marks_obtained / grade.subject.total_marks) * 100;
                      let gradeVal = 'F';
                      if (percentage >= 90) gradeVal = 'A+';
                      else if (percentage >= 80) gradeVal = 'A';
                      else if (percentage >= 70) gradeVal = 'B';
                      else if (percentage >= 60) gradeVal = 'C';
                      else if (percentage >= 50) gradeVal = 'D';

                      return (
                        <tr key={grade.id} className="border-b border-slate-50 dark:border-white/5">
                          <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                            {grade.subject.name}
                          </td>
                          <td className="py-4 px-6 text-right text-slate-600 dark:text-slate-400">
                            {grade.marks_obtained}
                          </td>
                          <td className="py-4 px-6 text-right text-slate-600 dark:text-slate-400">
                            {grade.subject.total_marks}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-900 dark:text-white">
                            {percentage.toFixed(2)}%
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                              percentage >= 80
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : percentage >= 60
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {gradeVal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-3 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Back to Reports
              </button>
            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl">
              <h2 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-6">
                Find Student
              </h2>

              <div className="flex gap-4 mb-6">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-3">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                          {student.student?.full_name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Roll: {student.roll_number || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => generateStudentReport(student.student_id)}
                        className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <FileText size={14} />
                        View Report
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-400">
                    {searchTerm ? 'No students found' : 'Enter a student name to search'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ HISTORY TAB ============ */}
      {activeTab === 'history' && (
        <div className="p-8 bg-white dark:bg-[#0A0C14] border border-slate-100 dark:border-white/5 rounded-3xl text-center">
          <FileText size={32} className="mx-auto text-indigo-400 mb-4 opacity-50" />
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-2">
            Grade Entry History
          </h3>
          <p className="text-sm text-slate-500">
            View previously entered grades and submitted reports
          </p>
        </div>
      )}
    </div>
  );
}
