export function isStaffRole(role?: string | null): boolean {
  return role === 'admin' || role === 'manager';
}

export function getDashboardPath(role?: string | null): string {
  if (role === 'admin') return '/admin';
  if (role === 'manager') return '/management';
  return '/user';
}

export function isOnDashboardPage(
  pathname: string,
  role?: string | null,
): boolean {
  return pathname === getDashboardPath(role);
}
