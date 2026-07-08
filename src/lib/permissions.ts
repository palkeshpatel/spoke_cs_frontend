import type { AuthUser } from "@/services/auth";

export function getRoleData(user?: AuthUser | null) {
  return user?.role_record || user?.roleRecord;
}

export function getRoleName(user?: AuthUser | null): string {
  const roleData = getRoleData(user);
  return (roleData?.role_name || (typeof user?.role === "string" ? user.role : "staff")).toLowerCase();
}

export function isAdminUser(user?: AuthUser | null): boolean {
  return getRoleName(user) === "admin";
}

export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!permission) return true;
  if (isAdminUser(user)) return true;
  const roleData = getRoleData(user);
  return !!roleData?.permissions?.some((p) => p.permission_name === permission);
}

/**
 * Returns true if the user can view the Measurements module
 * (either view_measurements OR manage_measurements grants access to view).
 */
export function canViewMeasurements(user: AuthUser | null | undefined): boolean {
  if (isAdminUser(user)) return true;
  return hasPermission(user, "view_measurements") || hasPermission(user, "manage_measurements");
}

/**
 * Returns true if the user can create/edit/update/delete measurements.
 * Requires manage_measurements permission.
 */
export function canEditMeasurements(user: AuthUser | null | undefined): boolean {
  if (isAdminUser(user)) return true;
  return hasPermission(user, "manage_measurements");
}

type RoutePermissionRule = {
  match: RegExp;
  permission?: string;
  permissions?: string[];
};

/** First matching rule applies. Paths not listed are open to any authenticated user. */
const routePermissionRules: RoutePermissionRule[] = [
  { match: /^\/customers(\/|$)/, permission: "manage_customers" },
  { match: /^\/appointments(\/|$)/, permission: "manage_appointments" },
  { match: /^\/calendar(\/|$)?$/, permission: "manage_appointments" },
  { match: /^\/measurements(\/|$)/, permissions: ["view_measurements", "manage_measurements"] },
  { match: /^\/orders(\/|$)/, permission: "manage_orders" },
  { match: /^\/billing(\/|$)/, permission: "manage_billing" },
  { match: /^\/reports(\/|$)?$/, permission: "view_reports" },
  { match: /^\/staff-monitoring(\/|$)?$/, permission: "manage_users" },
  { match: /^\/work-reports(\/|$)?$/, permission: "view_reports" },
  { match: /^\/staff(\/|$)/, permission: "manage_users" },
  { match: /^\/settings\/roles(\/|$)/, permission: "manage_roles" },
  { match: /^\/settings\/customizations(\/|$)/, permission: "manage_roles" },
];

export function getRequiredPermissionForPath(pathname: string): string | null {
  for (const rule of routePermissionRules) {
    if (!rule.match.test(pathname)) continue;
    if (rule.permission) return rule.permission;
    if (rule.permissions?.length) return rule.permissions[0];
  }
  return null;
}

export function canAccessPath(user: AuthUser | null | undefined, pathname: string): boolean {
  for (const rule of routePermissionRules) {
    if (!rule.match.test(pathname)) continue;
    if (rule.permissions?.length) {
      return rule.permissions.some((p) => hasPermission(user, p));
    }
    if (rule.permission) {
      return hasPermission(user, rule.permission);
    }
    return true;
  }
  return true;
}

export function canViewNavItem(user: AuthUser | null | undefined, permission?: string): boolean {
  return hasPermission(user, permission ?? "");
}

