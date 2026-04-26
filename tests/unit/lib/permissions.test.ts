import { describe, expect, it } from 'vitest';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';
import type { UserProfileWithPermissions } from '@/types';

describe('Permissions module', () => {
  // Helper to create mock user profiles
  const createMockUser = (permissions?: string[]): UserProfileWithPermissions => {
    return {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      tenantId: 'tenant-123',
      permissions: permissions,
      // Mock out other required fields from UserProfileWithPermissions
      roles: [],
    } as unknown as UserProfileWithPermissions;
  };

  describe('hasAllPermissions', () => {
    it('returns false when userProfileWithPermissions is null', () => {
      expect(hasAllPermissions(null, ['auctions:create'])).toBe(false);
    });

    it('returns false when user has no permissions array', () => {
      const user = createMockUser(undefined);
      expect(hasAllPermissions(user, ['auctions:create'])).toBe(false);
    });

    it('returns true when user has all required permissions', () => {
      const user = createMockUser(['auctions:create', 'auctions:read', 'lots:read']);
      expect(hasAllPermissions(user, ['auctions:create', 'auctions:read'])).toBe(true);
    });

    it('returns false when user is missing one of the required permissions', () => {
      const user = createMockUser(['auctions:create', 'lots:read']);
      expect(hasAllPermissions(user, ['auctions:create', 'auctions:read'])).toBe(false);
    });

    it('returns false when user has none of the required permissions', () => {
      const user = createMockUser(['lots:read', 'lots:create']);
      expect(hasAllPermissions(user, ['auctions:create', 'auctions:read'])).toBe(false);
    });

    it('returns true when user has manage_all permission, even if lacking specific permissions', () => {
      const user = createMockUser(['manage_all']);
      expect(hasAllPermissions(user, ['auctions:create', 'auctions:read', 'non:existent'])).toBe(true);
    });

    it('returns true when required permissions array is empty (all 0 requirements met)', () => {
      const user = createMockUser(['auctions:create']);
      expect(hasAllPermissions(user, [])).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('returns false when userProfileWithPermissions is null', () => {
      expect(hasPermission(null, 'auctions:create')).toBe(false);
    });

    it('returns false when user has no permissions array', () => {
      const user = createMockUser(undefined);
      expect(hasPermission(user, 'auctions:create')).toBe(false);
    });

    it('returns true when user has the exact permission', () => {
      const user = createMockUser(['auctions:create', 'auctions:read']);
      expect(hasPermission(user, 'auctions:create')).toBe(true);
    });

    it('returns false when user does not have the permission', () => {
      const user = createMockUser(['auctions:read', 'lots:read']);
      expect(hasPermission(user, 'auctions:create')).toBe(false);
    });

    it('returns true when user has manage_all permission', () => {
      const user = createMockUser(['manage_all']);
      expect(hasPermission(user, 'auctions:create')).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns false when userProfileWithPermissions is null', () => {
      expect(hasAnyPermission(null, ['auctions:create', 'auctions:read'])).toBe(false);
    });

    it('returns false when user has no permissions array', () => {
      const user = createMockUser(undefined);
      expect(hasAnyPermission(user, ['auctions:create'])).toBe(false);
    });

    it('returns true when user has at least one of the required permissions', () => {
      const user = createMockUser(['auctions:read', 'lots:read']);
      expect(hasAnyPermission(user, ['auctions:create', 'auctions:read'])).toBe(true);
    });

    it('returns false when user has none of the required permissions', () => {
      const user = createMockUser(['lots:read', 'lots:create']);
      expect(hasAnyPermission(user, ['auctions:create', 'auctions:read'])).toBe(false);
    });

    it('returns true when user has manage_all permission', () => {
      const user = createMockUser(['manage_all']);
      expect(hasAnyPermission(user, ['auctions:create', 'auctions:read'])).toBe(true);
    });

    it('returns false when required permissions array is empty', () => {
      const user = createMockUser(['auctions:create']);
      expect(hasAnyPermission(user, [])).toBe(false);
    });
  });
});
