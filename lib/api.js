// =====================================================
// API Layer - LMS School Management System
// Next.js + Supabase | Professional Production Ready
// =====================================================

import { supabase } from './supabase';

// ============================================
// AUTHENTICATION & USER UTILITIES
// ============================================

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function getUserRole() {
  const user = await getCurrentUser();
  return user?.role || 'student';
}

// ============================================
// PRINCIPAL DASHBOARD
// ============================================

export async function getPrincipalStats() {
  try {
    const [students, teachers, classesRes, finances] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['teacher', 'coordinator']),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('finances').select('amount, transaction_type').eq('status', 'completed')
    ]);

    const financeData = finances.data || [];
    const income = financeData.filter(f => f.transaction_type === 'income')
      .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
    const expenses = financeData.filter(f => f.transaction_type === 'expense')
      .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

    return {
      totalStudents: students.count || 0,
      totalTeachers: teachers.count || 0,
      totalClasses: classesRes.count || 0,
      grossRevenue: income,
      totalExpenses: expenses,
    };
  } catch (error) {
    console.error('Error in getPrincipalStats:', error);
    return { totalStudents: 0, totalTeachers: 0, totalClasses: 0, grossRevenue: 0, totalExpenses: 0 };
  }
}

export async function getSchoolActivities() {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  return data || [];
}

export async function getCurriculumProgress() {
  const { data } = await supabase
    .from('curriculum_alignment')
    .select(`
      *,
      classes(name),
      subjects(name),
      coordinator:users(full_name)
    `)
    .order('completion_percentage', { ascending: false });
  return data || [];
}

export async function getEmployeeRecords() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .in('role', ['teacher', 'coordinator', 'finance', 'admin'])
    .order('full_name');
  return data || [];
}

// ============================================
// FINANCE
// ============================================

export async function getFinanceTransactions(filters = {}) {
  let query = supabase.from('finances').select(`
    *,
    recorded_by:users(full_name)
  `);

  if (filters.type) query = query.eq('transaction_type', filters.type);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.startDate && filters.endDate) {
    query = query.gte('transaction_date', filters.startDate)
                 .lte('transaction_date', filters.endDate);
  }

  const { data } = await query.order('transaction_date', { ascending: false });
  let rows = data || [];
  if (filters.monthYear) {
    const prefix = filters.monthYear;
    rows = rows.filter((r) => r.transaction_date && String(r.transaction_date).slice(0, 7) === prefix);
  }
  return rows;
}

export async function getFinanceSummary(monthYear = null) {
  const { data } = await supabase
    .from('finances')
    .select('amount, transaction_type, category, transaction_date, status');

  let rows = data || [];
  if (monthYear) {
    rows = rows.filter((r) => r.transaction_date && String(r.transaction_date).slice(0, 7) === monthYear);
  }

  const summary = {
    totalIncome: 0,
    totalExpenses: 0,
    pendingIncome: 0,
    pendingExpense: 0,
    byCategoryIncome: {},
    byCategoryExpense: {},
  };

  rows.forEach((record) => {
    const amount = parseFloat(record.amount || 0);
    const pending = record.status === 'pending';
    const cat = record.category || 'Uncategorized';

    if (record.transaction_type === 'income') {
      if (pending) summary.pendingIncome += amount;
      else {
        summary.totalIncome += amount;
        summary.byCategoryIncome[cat] = (summary.byCategoryIncome[cat] || 0) + amount;
      }
    } else {
      if (pending) summary.pendingExpense += amount;
      else {
        summary.totalExpenses += amount;
        summary.byCategoryExpense[cat] = (summary.byCategoryExpense[cat] || 0) + amount;
      }
    }
  });

  summary.netPosition = summary.totalIncome - summary.totalExpenses;
  return summary;
}

export async function getEmployeeSalaries(monthYear = null) {
  let query = supabase.from('employee_salaries').select(`
    *,
    employee:users(full_name, email, role)
  `);

  if (monthYear) query = query.eq('month_year', monthYear);

  const { data } = await query.order('created_at', { ascending: false });
  return data || [];
}

// ============================================
// COORDINATOR
// ============================================

export async function getResourcesPendingApproval() {
  const { data } = await supabase
    .from('resources')
    .select(`
      *,
      teacher:users(full_name),
      class:classes(name),
      subject:subjects(name)
    `)
    .or('status.eq.draft,status.eq.submitted')
    .order('upload_date', { ascending: false });
  return data || [];
}

export async function approveResource(resourceId, coordinatorId) {
  const { data } = await supabase
    .from('resources')
    .update({
      status: 'approved',
      coordinator_id: coordinatorId,
      approval_date: new Date().toISOString(),
      is_visible_to_students: true
    })
    .eq('id', resourceId)
    .select()
    .single();
  return data;
}

export async function rejectResource(resourceId, reason) {
  const { data } = await supabase
    .from('resources')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', resourceId)
    .select()
    .single();
  return data;
}

export async function getTeacherAssignments() {
  const { data } = await supabase
    .from('class_subjects')
    .select(`
      *,
      class:classes(name, grade_level),
      subject:subjects(name),
      teacher:users(full_name, email)
    `)
    .order('created_at');
  return data || [];
}

export async function assignTeacherToClass(classId, teacherId, subjectId) {
  const { data } = await supabase
    .from('class_subjects')
    .insert({ class_id: classId, teacher_id: teacherId, subject_id: subjectId })
    .select()
    .single();
  return data;
}

export async function assignStudentToClass(studentId, classId) {
  const { data } = await supabase
    .from('student_classes')
    .insert({ student_id: studentId, class_id: classId })
    .select()
    .single();
  return data;
}

export async function getAllClasses() {
  const { data } = await supabase
    .from('classes')
    .select('id, name, grade_level, section, class_teacher_id, institution_id')
    .order('grade_level', { ascending: true })
    .order('name', { ascending: true });
  return data || [];
}

export async function getUsersByRole(role) {
  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, role, institution_id, roll_number')
    .eq('role', role)
    .order('full_name', { ascending: true });
  return data || [];
}

export async function getSubjectsCatalog() {
  const { data } = await supabase
    .from('subjects')
    .select('id, name, code')
    .order('name', { ascending: true });
  return data || [];
}

export async function createClassWithTeacher(classData) {
  const { data, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignClassTeacher(classId, classTeacherId) {
  const { data, error } = await supabase
    .from('classes')
    .update({ class_teacher_id: classTeacherId })
    .eq('id', classId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setStudentRollNumber(studentId, rollNumber) {
  const { data, error } = await supabase
    .from('users')
    .update({ roll_number: rollNumber })
    .eq('id', studentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getClassFixtures(classId = null) {
  let query = supabase
    .from('class_fixtures')
    .select(`
      *,
      class:classes(id, name, grade_level, section),
      subject:subjects(id, name),
      teacher:users(id, full_name)
    `)
    .order('day_of_week', { ascending: true })
    .order('period_number', { ascending: true });

  if (classId) query = query.eq('class_id', classId);
  const { data } = await query;
  return data || [];
}

export async function createClassFixture(fixtureData) {
  const { data, error } = await supabase
    .from('class_fixtures')
    .insert(fixtureData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// TEACHER
// ============================================

export async function getTeacherClasses(teacherId = null) {
  try {
    const user = !teacherId ? await getCurrentUser() : null;
    const id = teacherId || user?.id;
    if (!id) return [];

    const { data } = await supabase
      .from('class_subjects')
      .select(`
        *,
        class:classes(id, name, grade_level, section),
        subject:subjects(name, total_marks)
      `)
      .eq('teacher_id', id)
      .order('created_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    return [];
  }
}

export async function getTeachingResources() {
  try {
    const { data } = await supabase
      .from('resources')
      .select(`
        *,
        class:classes(name),
        subject:subjects(name),
        teacher:users(full_name)
      `)
      .eq('status', 'approved')
      .order('upload_date', { ascending: false })
      .limit(30);
    return data || [];
  } catch (error) {
    console.error('Error fetching teaching resources:', error);
    return [];
  }
}

export async function uploadResource(resourceData) {
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading resource:', error);
    throw error;
  }
}

export async function createTeacherAssessment(assessmentData) {
  const { data, error } = await supabase
    .from('assignments')
    .insert(assessmentData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getClassStudents(classId) {
  try {
    const { data } = await supabase
      .from('student_classes')
      .select(`
        *,
        student:users(id, full_name, email, avatar_url)
      `)
      .eq('class_id', classId)
      .eq('status', 'active');
    return data || [];
  } catch (error) {
    console.error('Error fetching class students:', error);
    return [];
  }
}

export async function markAttendance(attendanceData) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendanceData, { onConflict: 'student_id,class_id,subject_id,attendance_date' })
      .select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
}

export async function submitGrades(gradesArray) {
  try {
    const { data, error } = await supabase
      .from('grades')
      .upsert(gradesArray, { onConflict: 'student_id,subject_id,class_id,term' })
      .select();
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error submitting grades:', error);
    throw error;
  }
}

// ============================================
// STUDENT
// ============================================

export async function getStudentClasses(studentId) {
  const { data } = await supabase
    .from('student_classes')
    .select(`
      *,
      class:classes(name, grade_level, section)
    `)
    .eq('student_id', studentId)
    .eq('status', 'active');
  return data || [];
}

export async function getStudentResources(studentId) {
  const studentClasses = await getStudentClasses(studentId);
  const classIds = studentClasses.map(sc => sc.class_id);
  if (!classIds.length) return [];

  const { data } = await supabase
    .from('resources')
    .select(`
      *,
      teacher:users(full_name),
      subject:subjects(name),
      class:classes(name)
    `)
    .in('class_id', classIds)
    .eq('status', 'approved')
    .order('upload_date', { ascending: false });
  return data || [];
}

export async function getStudentAssignments(studentId) {
  const studentClasses = await getStudentClasses(studentId);
  const classIds = studentClasses.map(sc => sc.class_id);
  if (!classIds.length) return [];

  const { data } = await supabase
    .from('assignments')
    .select(`
      *,
      teacher:users(full_name),
      subject:subjects(name),
      submissions:student_submissions(*)
    `)
    .in('class_id', classIds)
    .order('due_date');
  return data || [];
}

export async function submitAssignment(submissionData) {
  const { data } = await supabase
    .from('student_submissions')
    .upsert(submissionData, { onConflict: 'assignment_id,student_id' })
    .select()
    .single();
  return data;
}

export async function getStudentGrades(studentId) {
  try {
    const { data } = await supabase
      .from('grades')
      .select(`
        *,
        subject:subjects(name, total_marks),
        class:classes(name, grade_level)
      `)
      .eq('student_id', studentId)
      .order('recorded_date', { ascending: false });
    return data || [];
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return [];
  }
}

/** Lightweight progress rows derived from grades for the student hub */
export async function getStudentProgress(studentId) {
  if (!studentId) return [];
  const grades = await getStudentGrades(studentId);
  return grades.map((g) => ({
    id: g.id,
    subject: g.subject?.name,
    marks_obtained: g.marks_obtained,
    total_marks: g.total_marks,
    term: g.term,
    class_name: g.class?.name,
  }));
}

export async function getStudentFeedback(studentId) {
  if (!studentId) return [];
  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('to_user_id', studentId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getStudentAttendance(studentId) {
  const { data } = await supabase
    .from('attendance')
    .select(`
      *,
      class:classes(name),
      subject:subjects(name)
    `)
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false });
  return data || [];
}

// ============================================
// INSTITUTIONS (branding + lock after principal saves)
// ============================================

export async function getInstitutionById(institutionId) {
  if (!institutionId) return null;
  const { data, error } = await supabase.from('institutions').select('*').eq('id', institutionId).maybeSingle();
  if (error) {
    console.error('getInstitutionById', error);
    return null;
  }
  return data;
}

export async function createInstitution(payload) {
  const { data, error } = await supabase.from('institutions').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateInstitution(institutionId, payload) {
  const { data, error } = await supabase.from('institutions').update(payload).eq('id', institutionId).select().single();
  if (error) throw error;
  return data;
}

export async function setUserInstitution(userId, institutionId) {
  const { error } = await supabase.from('users').update({ institution_id: institutionId }).eq('id', userId);
  if (error) throw error;
}

// ============================================
// FEE CHALLANS
// ============================================

export async function getFeeChallansForStudent(studentId) {
  if (!studentId) return [];
  const { data } = await supabase
    .from('fee_challans')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createFeeChallan(row) {
  const { data, error } = await supabase.from('fee_challans').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function getStudentsInClass(classId) {
  if (!classId) return [];
  const { data } = await supabase
    .from('student_classes')
    .select(`
      student_id,
      student:users(id, full_name, email, roll_number)
    `)
    .eq('class_id', classId)
    .eq('status', 'active');
  return data || [];
}

// ============================================
// COMMON UTILITIES
// ============================================

export async function createNotification(notificationData) {
  const { data } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();
  return data;
}

export async function getUserNotifications(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();
  return data;
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToResourceChanges(classId, callback) {
  return supabase.channel(`resources-${classId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'resources',
      filter: `class_id=eq.${classId}`
    }, callback)
    .subscribe();
}

export function subscribeToAttendanceChanges(classId, callback) {
  return supabase.channel(`attendance-${classId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'attendance',
      filter: `class_id=eq.${classId}`
    }, callback)
    .subscribe();
}

export function subscribeToGradesChanges(studentId, callback) {
  return supabase.channel(`grades-${studentId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'grades',
      filter: `student_id=eq.${studentId}`
    }, callback)
    .subscribe();
}

// ============================================
// ERROR HANDLING & VALIDATION UTILITIES
// ============================================

export class APIError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleError(error) {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return { error: error.message, code: error.code };
  }
  
  if (error?.message?.includes('UNIQUE')) {
    return { error: 'This record already exists', code: 'DUPLICATE_ENTRY' };
  }
  
  if (error?.message?.includes('permission')) {
    return { error: 'You do not have permission to perform this action', code: 'PERMISSION_DENIED' };
  }
  
  return { 
    error: error?.message || 'An unexpected error occurred', 
    code: 'UNKNOWN_ERROR' 
  };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 8;
}

export function validatePhoneNumber(phone) {
  const phoneRegex = /^[0-9\-\+\s\(\)]{7,}$/;
  return phoneRegex.test(phone || '');
}

export function validateFormData(data, required = []) {
  const errors = {};
  
  required.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });
  
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (data.phone && data.phone && !validatePhoneNumber(data.phone)) {
    errors.phone = 'Invalid phone number';
  }
  
  return errors;
}

// ============================================
// ADVANCED QUERIES FOR ANALYTICS
// ============================================

export async function getClassPerformanceStats(classId) {
  try {
    const { data } = await supabase
      .from('grades')
      .select('marks_obtained, total_marks')
      .eq('class_id', classId);
    
    if (!data || data.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: 0 };
    }
    
    const marks = data.map(g => g.marks_obtained || 0);
    const average = (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1);
    
    return {
      average: parseFloat(average),
      highest: Math.max(...marks),
      lowest: Math.min(...marks),
      count: marks.length
    };
  } catch (error) {
    console.error('Error fetching class performance stats:', error);
    return { average: 0, highest: 0, lowest: 0, count: 0 };
  }
}

export async function getFinancialReport(startDate, endDate) {
  try {
    const { data } = await supabase
      .from('finances')
      .select('*')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed');
    
    if (!data) return null;
    
    const income = data
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const expense = data
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netPosition: income - expense,
      transactionCount: data.length,
      byCategory: groupByCategory(data)
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    return null;
  }
}

function groupByCategory(transactions) {
  return transactions.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { income: 0, expense: 0 };
    if (t.transaction_type === 'income') {
      acc[cat].income += parseFloat(t.amount || 0);
    } else {
      acc[cat].expense += parseFloat(t.amount || 0);
    }
    return acc;
  }, {});
}

export async function getUserActivityLog(userId, limit = 50) {
  try {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return [];
  }
}

export async function createActivityLog(userId, action, details) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      details: JSON.stringify(details),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

export async function batchCreateResources(resourcesArray) {
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert(resourcesArray)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error batch creating resources:', error);
    throw handleError(error);
  }
}

export async function batchUpdateGrades(gradesArray) {
  try {
    const { data, error } = await supabase
      .from('grades')
      .upsert(gradesArray, { onConflict: 'student_id,subject_id,class_id,term' })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error batch updating grades:', error);
    throw handleError(error);
  }
}

export async function batchEnrollStudents(enrollmentArray) {
  try {
    const { data, error } = await supabase
      .from('student_classes')
      .insert(enrollmentArray)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error batch enrolling students:', error);
    throw handleError(error);
  }
}

// ============================================
// DATA EXPORT & IMPORT
// ============================================

export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function formatCurrency(value, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatDate(date, format = 'short') {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-PK');
  if (format === 'long') return d.toLocaleDateString('en-PK', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  return d.toISOString();
}

export function getAttendancePercentage(presentDays, totalDays) {
  if (totalDays === 0) return 0;
  return ((presentDays / totalDays) * 100).toFixed(1);
}

export function getGradePercentage(marksObtained, totalMarks) {
  if (totalMarks === 0) return 0;
  return ((marksObtained / totalMarks) * 100).toFixed(1);
}

export function getGradeLetters(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}