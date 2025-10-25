/**
 * Permission and Role Types
 * TypeScript definitions for the RBAC system
 */

// ============================================================================
// PERMISSION NAMES (must match database)
// ============================================================================

export const PERMISSIONS = {
  // Notices
  NOTICES_CREATE: 'notices.create',
  NOTICES_READ: 'notices.read',
  NOTICES_UPDATE: 'notices.update',
  NOTICES_DELETE: 'notices.delete',
  NOTICES_PUBLISH: 'notices.publish',
  NOTICES_EXPORT: 'notices.export',

  // Representations
  REPRESENTATIONS_READ: 'representations.read',
  REPRESENTATIONS_UPDATE: 'representations.update',
  REPRESENTATIONS_EXPORT: 'representations.export',
  REPRESENTATIONS_COMMENT: 'representations.comment',

  // Team
  TEAM_READ: 'team.read',
  TEAM_INVITE: 'team.invite',
  TEAM_UPDATE: 'team.update',
  TEAM_REMOVE: 'team.remove',

  // Templates
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_READ: 'templates.read',
  TEMPLATES_UPDATE: 'templates.update',
  TEMPLATES_DELETE: 'templates.delete',

  // Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',

  // Audit
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============================================================================
// ROLE NAMES (must match database)
// ============================================================================

export const ROLES = {
  ORG_ADMIN: 'org_admin',
  DEPT_ADMIN: 'dept_admin',
  OFFICER: 'officer',
  VIEWER: 'viewer',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

// ============================================================================
// INTERFACES
// ============================================================================

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  description: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: PermissionName;
  resource: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export interface UserPermissions {
  userId: string;
  departmentId: string;
  role: Role;
  permissions: PermissionName[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has access to a specific permission
 */
export function roleHasPermission(role: RoleName, permission: PermissionName): boolean {
  const rolePermissions: Record<RoleName, PermissionName[]> = {
    [ROLES.ORG_ADMIN]: Object.values(PERMISSIONS),

    [ROLES.DEPT_ADMIN]: Object.values(PERMISSIONS),

    [ROLES.OFFICER]: [
      PERMISSIONS.NOTICES_CREATE,
      PERMISSIONS.NOTICES_READ,
      PERMISSIONS.NOTICES_UPDATE,
      PERMISSIONS.NOTICES_PUBLISH,
      PERMISSIONS.NOTICES_EXPORT,
      PERMISSIONS.REPRESENTATIONS_READ,
      PERMISSIONS.REPRESENTATIONS_UPDATE,
      PERMISSIONS.REPRESENTATIONS_COMMENT,
      PERMISSIONS.REPRESENTATIONS_EXPORT,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.TEMPLATES_READ,
      PERMISSIONS.SETTINGS_READ,
    ],

    [ROLES.VIEWER]: [
      PERMISSIONS.NOTICES_READ,
      PERMISSIONS.REPRESENTATIONS_READ,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.TEMPLATES_READ,
    ],
  };

  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: RoleName): string {
  const displayNames: Record<RoleName, string> = {
    [ROLES.ORG_ADMIN]: 'Organization Administrator',
    [ROLES.DEPT_ADMIN]: 'Department Administrator',
    [ROLES.OFFICER]: 'Licensing Officer',
    [ROLES.VIEWER]: 'Read-Only Viewer',
  };

  return displayNames[role] || role;
}

/**
 * Get description for a permission
 */
export function getPermissionDescription(permission: PermissionName): string {
  const descriptions: Partial<Record<PermissionName, string>> = {
    [PERMISSIONS.NOTICES_CREATE]: 'Create new notices',
    [PERMISSIONS.NOTICES_READ]: 'View notices',
    [PERMISSIONS.NOTICES_UPDATE]: 'Edit existing notices',
    [PERMISSIONS.NOTICES_DELETE]: 'Delete notices',
    [PERMISSIONS.NOTICES_PUBLISH]: 'Publish notices to the public',
    [PERMISSIONS.NOTICES_EXPORT]: 'Export notice data',
    [PERMISSIONS.REPRESENTATIONS_READ]: 'View representations',
    [PERMISSIONS.REPRESENTATIONS_UPDATE]: 'Edit representation status/notes',
    [PERMISSIONS.REPRESENTATIONS_EXPORT]: 'Export representations to CSV',
    [PERMISSIONS.REPRESENTATIONS_COMMENT]: 'Add internal comments',
    [PERMISSIONS.TEAM_READ]: 'View team members',
    [PERMISSIONS.TEAM_INVITE]: 'Invite new team members',
    [PERMISSIONS.TEAM_UPDATE]: 'Update team member roles',
    [PERMISSIONS.TEAM_REMOVE]: 'Remove team members',
    [PERMISSIONS.TEMPLATES_CREATE]: 'Create notice templates',
    [PERMISSIONS.TEMPLATES_READ]: 'View notice templates',
    [PERMISSIONS.TEMPLATES_UPDATE]: 'Edit notice templates',
    [PERMISSIONS.TEMPLATES_DELETE]: 'Delete notice templates',
    [PERMISSIONS.SETTINGS_READ]: 'View department settings',
    [PERMISSIONS.SETTINGS_UPDATE]: 'Update department settings',
    [PERMISSIONS.AUDIT_READ]: 'View audit logs',
  };

  return descriptions[permission] || permission;
}

/**
 * Group permissions by resource
 */
export function groupPermissionsByResource(permissions: PermissionName[]): Record<string, PermissionName[]> {
  const grouped: Record<string, PermissionName[]> = {};

  for (const permission of permissions) {
    const [resource] = permission.split('.');
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push(permission);
  }

  return grouped;
}

/**
 * Check if user has permission (client-side check)
 * Note: Always verify permissions on the backend
 */
export function userHasPermission(
  userPermissions: PermissionName[],
  requiredPermission: PermissionName
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function userHasAnyPermission(
  userPermissions: PermissionName[],
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function userHasAllPermissions(
  userPermissions: PermissionName[],
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}
