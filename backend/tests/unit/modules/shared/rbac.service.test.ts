import { RBACService, AccessLevel, ResourceType, Action } from '../../../../src/shared/services/rbac.service';

describe('RBACService', () => {
  describe('getAccessLevel', () => {
    it('should return PLATFORM for SUPER_ADMIN', () => {
      const result = RBACService.getAccessLevel('SUPER_ADMIN');
      expect(result).toBe(AccessLevel.PLATFORM);
    });

    it('should return ORGANIZATION for ADMIN', () => {
      const result = RBACService.getAccessLevel('ADMIN');
      expect(result).toBe(AccessLevel.ORGANIZATION);
    });

    it('should return TEAM for MANAGER', () => {
      const result = RBACService.getAccessLevel('MANAGER');
      expect(result).toBe(AccessLevel.TEAM);
    });

    it('should return INDIVIDUAL for USER', () => {
      const result = RBACService.getAccessLevel('USER');
      expect(result).toBe(AccessLevel.INDIVIDUAL);
    });

    it('should return INDIVIDUAL for unknown role', () => {
      const result = RBACService.getAccessLevel('UNKNOWN_ROLE');
      expect(result).toBe(AccessLevel.INDIVIDUAL);
    });
  });

  describe('canAccessResource', () => {
    it('should allow SUPER_ADMIN to access all resources', () => {
      const result = RBACService.canAccessResource('SUPER_ADMIN', ResourceType.USER, Action.CREATE);
      expect(result).toBe(true);
    });

    it('should allow ADMIN to manage users', () => {
      const result = RBACService.canAccessResource('ADMIN', ResourceType.USER, Action.CREATE);
      expect(result).toBe(true);
    });

    it('should not allow MANAGER to manage users', () => {
      const result = RBACService.canAccessResource('MANAGER', ResourceType.USER, Action.CREATE);
      expect(result).toBe(false);
    });

    it('should allow ADMIN to read organizations', () => {
      const result = RBACService.canAccessResource('ADMIN', ResourceType.ORGANIZATION, Action.READ);
      expect(result).toBe(true);
    });

    it('should not allow ADMIN to create organizations', () => {
      const result = RBACService.canAccessResource('ADMIN', ResourceType.ORGANIZATION, Action.CREATE);
      expect(result).toBe(false);
    });
  });

  describe('getDataScope', () => {
    it('should return full scope for SUPER_ADMIN', () => {
      const result = RBACService.getDataScope('SUPER_ADMIN', 'org-1');
      expect(result.canSeeAllOrganizations).toBe(true);
      expect(result.canSeeAllUsers).toBe(true);
      expect(result.canSeeRevenue).toBe(true);
    });

    it('should return limited scope for ADMIN', () => {
      const result = RBACService.getDataScope('ADMIN', 'org-1');
      expect(result.canSeeAllOrganizations).toBe(false);
      expect(result.canSeeAllUsers).toBe(false);
      expect(result.canSeeRevenue).toBe(true);
      expect(result.organizationFilter).toBe('org-1');
    });

    it('should return restricted scope for USER', () => {
      const result = RBACService.getDataScope('USER', 'org-1');
      expect(result.canSeeAllOrganizations).toBe(false);
      expect(result.canSeeAllUsers).toBe(false);
      expect(result.canSeeRevenue).toBe(false);
    });
  });

  describe('getMenuItems', () => {
    it('should return full menu for PLATFORM access', () => {
      const result = RBACService.getMenuItems(AccessLevel.PLATFORM);
      expect(result).toContain('organizations');
      expect(result).toContain('users');
      expect(result).toContain('api-keys');
    });

    it('should return limited menu for ORGANIZATION access', () => {
      const result = RBACService.getMenuItems(AccessLevel.ORGANIZATION);
      expect(result).toContain('users');
      expect(result).toContain('api-keys');
      expect(result).not.toContain('organizations');
    });

    it('should return basic menu for INDIVIDUAL access', () => {
      const result = RBACService.getMenuItems(AccessLevel.INDIVIDUAL);
      expect(result).toEqual(['main', 'metrics', 'auth']);
    });
  });

  describe('canManageOrganizations', () => {
    it('should return true for SUPER_ADMIN', () => {
      const result = RBACService.canManageOrganizations('SUPER_ADMIN');
      expect(result).toBe(true);
    });

    it('should return false for ADMIN', () => {
      const result = RBACService.canManageOrganizations('ADMIN');
      expect(result).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should return true for SUPER_ADMIN', () => {
      const result = RBACService.canManageUsers('SUPER_ADMIN');
      expect(result).toBe(true);
    });

    it('should return true for ADMIN', () => {
      const result = RBACService.canManageUsers('ADMIN');
      expect(result).toBe(true);
    });

    it('should return false for MANAGER', () => {
      const result = RBACService.canManageUsers('MANAGER');
      expect(result).toBe(false);
    });
  });

  describe('canManageAPIKeys', () => {
    it('should return true for SUPER_ADMIN', () => {
      const result = RBACService.canManageAPIKeys('SUPER_ADMIN');
      expect(result).toBe(true);
    });

    it('should return true for ADMIN', () => {
      const result = RBACService.canManageAPIKeys('ADMIN');
      expect(result).toBe(true);
    });

    it('should return true for MANAGER', () => {
      const result = RBACService.canManageAPIKeys('MANAGER');
      expect(result).toBe(true);
    });

    it('should return false for USER', () => {
      const result = RBACService.canManageAPIKeys('USER');
      expect(result).toBe(false);
    });
  });

  describe('canSeeSensitiveMetrics', () => {
    it('should return true for SUPER_ADMIN', () => {
      const result = RBACService.canSeeSensitiveMetrics('SUPER_ADMIN');
      expect(result).toBe(true);
    });

    it('should return true for ADMIN', () => {
      const result = RBACService.canSeeSensitiveMetrics('ADMIN');
      expect(result).toBe(true);
    });

    it('should return false for MANAGER', () => {
      const result = RBACService.canSeeSensitiveMetrics('MANAGER');
      expect(result).toBe(false);
    });

    it('should return false for USER', () => {
      const result = RBACService.canSeeSensitiveMetrics('USER');
      expect(result).toBe(false);
    });
  });
}); 