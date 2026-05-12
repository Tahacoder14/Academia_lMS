/**
 * Role-based access for LMS menus and landing routes.
 * Menu rows use `role_required` from Supabase; this layer maps school hierarchy
 * (principal oversight, admin/finance office, coordinators, teachers, students).
 */

/** Roles that can open the staff user matrix */
export const USER_MATRIX_ROLES = ['superadmin', 'principal', 'admin'];

/**
 * module_name → roles allowed (overrides role_required when present).
 * Keeps DB menus simple while letting principals/admins see finance & reports.
 */
export const MENU_MODULE_ACCESS = {
  reports: ['principal', 'admin', 'superadmin', 'coordinator'],
  results: ['principal', 'admin', 'superadmin', 'teacher', 'coordinator'],
  financials: ['finance', 'admin', 'principal', 'superadmin'],
  academic: ['principal', 'coordinator', 'teacher', 'superadmin', 'admin'],
  institutions: ['principal', 'superadmin'],
  challans: ['student', 'finance', 'admin', 'principal', 'superadmin'],
  users: ['principal', 'superadmin', 'admin'],
  superadmin: ['superadmin'],
};

/**
 * role_required value → roles that may open that item (when no module override).
 */
export const ROLE_REQUIRED_ACCESS = {
  principal: ['principal', 'superadmin'],
  finance: ['finance', 'admin', 'principal', 'superadmin'],
  coordinator: ['coordinator', 'principal', 'superadmin'],
  teacher: ['teacher'],
  student: ['student'],
};

export function canAccessMenuItem(userRole, item) {
  if (!userRole || !item) return false;
  if (userRole === 'superadmin') return true;
  if (item.role_required == null || item.role_required === '') return true;

  const moduleKey = item.module_name;
  if (moduleKey && MENU_MODULE_ACCESS[moduleKey]) {
    return MENU_MODULE_ACCESS[moduleKey].includes(userRole);
  }

  const allowed = ROLE_REQUIRED_ACCESS[item.role_required] || [item.role_required];
  return allowed.includes(userRole);
}

/** Default route after /dashboard for each role */
export function defaultDashboardRoute(role) {
  const routes = {
    superadmin: '/dashboard/superadmin',
    principal: '/dashboard/principal',
    finance: '/dashboard/financials',
    admin: '/dashboard/financials',
    coordinator: '/dashboard/coordinator',
    teacher: '/dashboard/teacher',
    student: '/dashboard/students',
  };
  return routes[role] || '/dashboard/students';
}

/** Roles allowed to use the finance console */
export const FINANCE_CONSOLE_ROLES = ['finance', 'admin', 'principal', 'superadmin'];
