import { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  assistant_supervisor: 'Assistant Supervisor',
  project_manager: 'Project Manager',
  client: 'Client / Ministry',
};

export function canAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
