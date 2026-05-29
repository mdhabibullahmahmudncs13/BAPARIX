/**
 * Role-based access control permission system for VentureOS Team Workspace.
 *
 * Defines the permission matrix for each role and provides helper functions
 * to check permissions throughout the application.
 *
 * Role hierarchy:
 * - Owner / Co-founder: Full access to all features
 * - Manager: View/edit financials and blueprints, manage team
 * - Analyst: View financials and blueprints, export data
 * - Guest: View blueprints only
 */

export type MemberRole = 'owner' | 'co-founder' | 'manager' | 'analyst' | 'guest';

export type Permission =
  | 'viewFinancials'
  | 'editFinancials'
  | 'viewBlueprints'
  | 'editBlueprints'
  | 'manageTeam'
  | 'exportData';

export interface RolePermissions {
  viewFinancials: boolean;
  editFinancials: boolean;
  viewBlueprints: boolean;
  editBlueprints: boolean;
  manageTeam: boolean;
  exportData: boolean;
}

/**
 * Permission matrix defining what each role can do.
 */
export const ROLE_PERMISSIONS: Record<MemberRole, RolePermissions> = {
  owner: {
    viewFinancials: true,
    editFinancials: true,
    viewBlueprints: true,
    editBlueprints: true,
    manageTeam: true,
    exportData: true,
  },
  'co-founder': {
    viewFinancials: true,
    editFinancials: true,
    viewBlueprints: true,
    editBlueprints: true,
    manageTeam: true,
    exportData: true,
  },
  manager: {
    viewFinancials: true,
    editFinancials: true,
    viewBlueprints: true,
    editBlueprints: true,
    manageTeam: true,
    exportData: false,
  },
  analyst: {
    viewFinancials: true,
    editFinancials: false,
    viewBlueprints: true,
    editBlueprints: false,
    manageTeam: false,
    exportData: true,
  },
  guest: {
    viewFinancials: false,
    editFinancials: false,
    viewBlueprints: true,
    editBlueprints: false,
    manageTeam: false,
    exportData: false,
  },
};

/**
 * All available roles in display order (highest to lowest privilege).
 */
export const ALL_ROLES: MemberRole[] = ['owner', 'co-founder', 'manager', 'analyst', 'guest'];

/**
 * All available permissions in display order.
 */
export const ALL_PERMISSIONS: Permission[] = [
  'viewFinancials',
  'editFinancials',
  'viewBlueprints',
  'editBlueprints',
  'manageTeam',
  'exportData',
];

/**
 * Check if a role has a specific permission.
 * @param role - The member role to check
 * @param permission - The permission to verify
 * @returns Whether the role has the specified permission
 */
export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Get the full permissions object for a given role.
 * @param role - The member role
 * @returns The permissions object for that role
 */
export function getPermissionsForRole(role: MemberRole): RolePermissions {
  return { ...ROLE_PERMISSIONS[role] };
}

/**
 * Check if a role can view financial data.
 * @param role - The member role to check
 * @returns Whether the role can view financials
 */
export function canViewFinancials(role: MemberRole): boolean {
  return ROLE_PERMISSIONS[role].viewFinancials;
}

/**
 * Check if a role can edit financial data.
 * @param role - The member role to check
 * @returns Whether the role can edit financials
 */
export function canEditFinancials(role: MemberRole): boolean {
  return ROLE_PERMISSIONS[role].editFinancials;
}
