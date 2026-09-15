/**
 * Role-Based Access Control (RBAC) utilities
 * Defines which menu items and features are available for each role
 */

export type UserRole = "admin" | "superadmin" | "teacher" | "student" | "accountant" | "librarian" | "receptionist" | "parent" | "driver";

interface RolePermissions {
  labels: string[];
  menuGroups: string[];
}

/**
 * Menu group access for each role
 * Returns groups that should be visible to this role
 */
export const ROLE_MENU_ACCESS: Record<UserRole, string[]> = {
  superadmin: ["Overview", "Academic", "Administration", "Finance", "Accounting", "System"],
  admin: ["Overview", "Academic", "Administration", "Finance", "Accounting", "System"],
  accountant: ["Overview", "Finance", "Accounting"],
  teacher: ["Overview", "Academic", "Messages"],
  librarian: ["Overview", "Administration"],
  receptionist: ["Overview", "Academic", "Administration", "Messages"],
  student: ["Overview", "Messages"],
  parent: ["Overview", "Messages", "Parent Portal"],
  driver: ["Overview", "Administration"],
};

/**
 * Get the dashboard title based on user role
 */
export function getDashboardTitle(role: UserRole): string {
  const titles: Record<UserRole, string> = {
    superadmin: "System Administration",
    admin: "Executive Dashboard",
    accountant: "Finance & Accounting",
    teacher: "Teaching Dashboard",
    librarian: "Library Management",
    receptionist: "Reception Desk",
    student: "Student Portal",
    parent: "Parent Portal",
    driver: "Driver Console",
  };
  return titles[role] || "Dashboard";
}

/**
 * Get dashboard subtitle based on user role
 */
export function getDashboardSubtitle(role: UserRole): string {
  const subtitles: Record<UserRole, string> = {
    superadmin: "Manage all schools and system settings.",
    admin: "Real-time synchronization with institutional database.",
    accountant: "Financial records and accounting reports.",
    teacher: "Class management, assignments, and student performance.",
    librarian: "Library resources and inventory management.",
    receptionist: "Support families, admissions, and student records.",
    student: "Track grades, attendance, and assignments.",
    parent: "View your child's academic progress and communication.",
    driver: "Manage assigned routes, trips, stops, and vehicle telemetry.",
  };
  return subtitles[role] || "Dashboard";
}

/**
 * Check if a user has permission to access a feature
 * @param role User's role
 * @param feature Feature path (e.g., "finance", "accounting", "attendance")
 */
export function hasFeatureAccess(role: UserRole, feature: string): boolean {
  const accessMap: Record<UserRole, string[]> = {
    superadmin: ["*"], // All features
    admin: ["students", "teachers", "classes", "attendance", "exams", "fees", "finance", "accounting", "library", "transport", "events", "messages"],
    accountant: ["finance", "accounting", "fees"],
    teacher: ["students", "classes", "attendance", "exams", "messages"],
    librarian: ["library", "messages"],
    receptionist: ["students", "parents", "classes", "attendance", "events", "messages"],
    student: ["messages"],
    parent: ["messages"],
    driver: ["transport"],
  };

  const allowed = accessMap[role] || [];
  return allowed.includes("*") || allowed.includes(feature);
}

/**
 * Get dashboard cards to display for a role
 * Each role gets different cards based on their responsibilities
 */
export function getDashboardCards(role: UserRole): string[] {
  const cardMap: Record<UserRole, string[]> = {
    superadmin: ["stats", "activity", "enrollment", "topPerformers", "feeDetails"],
    admin: ["stats", "activity", "enrollment", "topPerformers", "feeDetails"],
    accountant: ["feeDetails", "revenue", "invoices", "payments"],
    teacher: ["myClasses", "myStudents", "attendance", "upcomingExams"],
    librarian: ["inventory", "borrowedBooks", "returns"],
    receptionist: ["stats", "activity", "attendance", "events"],
    student: ["myGrades", "attendance", "assignments"],
    parent: ["childGrades", "attendance", "communications"],
    driver: ["transport", "trips", "stops"],
  };
  return cardMap[role] || [];
}

/**
 * Filter menu items based on user role
 * @param navItems Navigation items to filter
 * @param role User's role
 */
export function filterNavByRole(
  navItems: { group: string; items: any[] }[],
  role: UserRole
) {

  // 1. Safety check: If role is missing or invalid, return an empty menu structure
  if (!role || !ROLE_MENU_ACCESS[role]) {
    return [];
  }
  
  const allowedGroups = ROLE_MENU_ACCESS[role];
  return navItems
    .filter(group => allowedGroups.includes(group.group))
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasMenuItemAccess(role, item.to)),
    }))
    .filter(group => group.items.length > 0); // Remove empty groups
}

/**
 * Check if user can access a specific menu item (route)
 */
function hasMenuItemAccess(role: UserRole, route: string): boolean {
  // Superadmin and admin can access everything
  if (role === "superadmin" || role === "admin") return true;

  // Route-based access control
  const routeAccess: Record<string, UserRole[]> = {
    // Overview
    "/": ["superadmin", "admin", "accountant", "teacher", "librarian", "student", "parent"],
    "/analytics": ["superadmin", "admin"],

    // Academic
    "/students": ["superadmin", "admin", "teacher", "receptionist"],
    "/parents": ["superadmin", "admin", "receptionist"],
    "/teachers": ["superadmin", "admin"],
    "/classes": ["superadmin", "admin", "teacher"],
    "/timetable": ["superadmin", "admin", "teacher"],
    "/attendance": ["superadmin", "admin", "teacher"],
    "/exams": ["superadmin", "admin", "teacher"],

    // Administration
    "/fees": ["superadmin", "admin"],
    "/library": ["superadmin", "admin", "librarian"],
    "/transport": ["superadmin", "admin", "driver"],
    "/transport/driver": ["driver"],
    "/events": ["superadmin", "admin"],
    "/messages": ["superadmin", "admin", "accountant", "teacher", "librarian", "student", "parent"],

    // Finance
    "/finance/dashboard": ["superadmin", "admin", "accountant"],
    "/finance/fee-categories": ["superadmin", "admin", "accountant"],
    "/finance/fee-structures": ["superadmin", "admin", "accountant"],
    "/finance/invoices": ["superadmin", "admin", "accountant"],
    "/finance/payments": ["superadmin", "admin", "accountant"],
    "/finance/payments/collect": ["superadmin", "admin", "accountant"],
    "/finance/receipts": ["superadmin", "admin", "accountant"],

    // Accounting
    "/accounting/accounts": ["superadmin", "admin", "accountant"],
    "/accounting/journals": ["superadmin", "admin", "accountant"],
    "/accounting/reports": ["superadmin", "admin", "accountant"],
    "/accounting/reports/income-statement": ["superadmin", "admin", "accountant"],
    "/accounting/reports/balance-sheet": ["superadmin", "admin", "accountant"],
    "/accounting/reports/cash-flow": ["superadmin", "admin", "accountant"],
    "/portal/analytics": ["parent"],
    "/portal/payments": ["parent"],

    // System
    "/settings": ["superadmin", "admin"],
    "/parents/bulk-sms": ["superadmin", "admin"],
    "/parents/sms-logs": ["superadmin", "admin"],
  };

  const allowedRoles = routeAccess[route] || [];
  return allowedRoles.includes(role);
}
