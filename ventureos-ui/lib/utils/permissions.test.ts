import {
  hasPermission,
  getPermissionsForRole,
  canViewFinancials,
  canEditFinancials,
  ROLE_PERMISSIONS,
  ALL_ROLES,
  ALL_PERMISSIONS,
  type MemberRole,
  type Permission,
} from './permissions';

describe('permissions', () => {
  describe('ROLE_PERMISSIONS matrix', () => {
    it('owner has full access to all permissions', () => {
      const ownerPerms = ROLE_PERMISSIONS['owner'];
      expect(ownerPerms.viewFinancials).toBe(true);
      expect(ownerPerms.editFinancials).toBe(true);
      expect(ownerPerms.viewBlueprints).toBe(true);
      expect(ownerPerms.editBlueprints).toBe(true);
      expect(ownerPerms.manageTeam).toBe(true);
      expect(ownerPerms.exportData).toBe(true);
    });

    it('co-founder has full access to all permissions', () => {
      const cofounderPerms = ROLE_PERMISSIONS['co-founder'];
      expect(cofounderPerms.viewFinancials).toBe(true);
      expect(cofounderPerms.editFinancials).toBe(true);
      expect(cofounderPerms.viewBlueprints).toBe(true);
      expect(cofounderPerms.editBlueprints).toBe(true);
      expect(cofounderPerms.manageTeam).toBe(true);
      expect(cofounderPerms.exportData).toBe(true);
    });

    it('manager can view/edit financials and blueprints, manage team, but not export', () => {
      const managerPerms = ROLE_PERMISSIONS['manager'];
      expect(managerPerms.viewFinancials).toBe(true);
      expect(managerPerms.editFinancials).toBe(true);
      expect(managerPerms.viewBlueprints).toBe(true);
      expect(managerPerms.editBlueprints).toBe(true);
      expect(managerPerms.manageTeam).toBe(true);
      expect(managerPerms.exportData).toBe(false);
    });

    it('analyst can view financials and blueprints, export data, but not edit or manage', () => {
      const analystPerms = ROLE_PERMISSIONS['analyst'];
      expect(analystPerms.viewFinancials).toBe(true);
      expect(analystPerms.editFinancials).toBe(false);
      expect(analystPerms.viewBlueprints).toBe(true);
      expect(analystPerms.editBlueprints).toBe(false);
      expect(analystPerms.manageTeam).toBe(false);
      expect(analystPerms.exportData).toBe(true);
    });

    it('guest can only view blueprints', () => {
      const guestPerms = ROLE_PERMISSIONS['guest'];
      expect(guestPerms.viewFinancials).toBe(false);
      expect(guestPerms.editFinancials).toBe(false);
      expect(guestPerms.viewBlueprints).toBe(true);
      expect(guestPerms.editBlueprints).toBe(false);
      expect(guestPerms.manageTeam).toBe(false);
      expect(guestPerms.exportData).toBe(false);
    });
  });

  describe('ALL_ROLES', () => {
    it('contains all five roles', () => {
      expect(ALL_ROLES).toHaveLength(5);
      expect(ALL_ROLES).toContain('owner');
      expect(ALL_ROLES).toContain('co-founder');
      expect(ALL_ROLES).toContain('manager');
      expect(ALL_ROLES).toContain('analyst');
      expect(ALL_ROLES).toContain('guest');
    });
  });

  describe('ALL_PERMISSIONS', () => {
    it('contains all six permissions', () => {
      expect(ALL_PERMISSIONS).toHaveLength(6);
      expect(ALL_PERMISSIONS).toContain('viewFinancials');
      expect(ALL_PERMISSIONS).toContain('editFinancials');
      expect(ALL_PERMISSIONS).toContain('viewBlueprints');
      expect(ALL_PERMISSIONS).toContain('editBlueprints');
      expect(ALL_PERMISSIONS).toContain('manageTeam');
      expect(ALL_PERMISSIONS).toContain('exportData');
    });
  });

  describe('hasPermission', () => {
    it('returns true when role has the permission', () => {
      expect(hasPermission('owner', 'viewFinancials')).toBe(true);
      expect(hasPermission('analyst', 'exportData')).toBe(true);
      expect(hasPermission('guest', 'viewBlueprints')).toBe(true);
    });

    it('returns false when role does not have the permission', () => {
      expect(hasPermission('guest', 'viewFinancials')).toBe(false);
      expect(hasPermission('analyst', 'editFinancials')).toBe(false);
      expect(hasPermission('manager', 'exportData')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns a copy of the permissions for the given role', () => {
      const perms = getPermissionsForRole('owner');
      expect(perms).toEqual(ROLE_PERMISSIONS['owner']);
    });

    it('returns a new object (not a reference to the original)', () => {
      const perms = getPermissionsForRole('manager');
      perms.viewFinancials = false;
      // Original should be unchanged
      expect(ROLE_PERMISSIONS['manager'].viewFinancials).toBe(true);
    });

    it('returns correct permissions for each role', () => {
      ALL_ROLES.forEach((role) => {
        const perms = getPermissionsForRole(role);
        expect(perms).toEqual(ROLE_PERMISSIONS[role]);
      });
    });
  });

  describe('canViewFinancials', () => {
    it('returns true for owner, co-founder, manager, analyst', () => {
      expect(canViewFinancials('owner')).toBe(true);
      expect(canViewFinancials('co-founder')).toBe(true);
      expect(canViewFinancials('manager')).toBe(true);
      expect(canViewFinancials('analyst')).toBe(true);
    });

    it('returns false for guest', () => {
      expect(canViewFinancials('guest')).toBe(false);
    });
  });

  describe('canEditFinancials', () => {
    it('returns true for owner, co-founder, manager', () => {
      expect(canEditFinancials('owner')).toBe(true);
      expect(canEditFinancials('co-founder')).toBe(true);
      expect(canEditFinancials('manager')).toBe(true);
    });

    it('returns false for analyst and guest', () => {
      expect(canEditFinancials('analyst')).toBe(false);
      expect(canEditFinancials('guest')).toBe(false);
    });
  });
});
