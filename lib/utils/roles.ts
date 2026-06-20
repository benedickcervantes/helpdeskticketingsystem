export function isStaffRole(role?: string | null): boolean {
  return role === 'admin' || role === 'manager';
}
