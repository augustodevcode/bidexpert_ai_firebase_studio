
import type { UserProfileWithPermissions } from '@/types';

/**
 * Checks if a user has a specific permission.
 *
 * @param userProfileWithPermissions The user's profile object which includes their permissions array,
 *                                   or null if the user is not logged in or profile is not loaded.
 * @param requiredPermission The permission string to check for (e.g., "auctions:create").
 * @returns True if the user has the permission or the 'manage_all' permission, false otherwise.
 */
export function hasPermission(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermission: string
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }

  // Admins with 'manage_all' have all permissions
  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return userProfileWithPermissions.permissions.includes(requiredPermission);
}

/**
 * Checks if a user has ANY of the specified permissions.
 *
 * @param userProfileWithPermissions The user's profile object with permissions.
 * @param requiredPermissions An array of permission strings.
 * @returns True if the user has at least one of the specified permissions or 'manage_all', false otherwise.
 */
export function hasAnyPermission(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermissions: string[]
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }

  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return requiredPermissions.some(permission =>
    userProfileWithPermissions.permissions.includes(permission)
  );
}

/**
 * Checks if a user has ALL of the specified permissions.
 *
 * @param userProfileWithPermissions The user's profile object with permissions.
 * @param requiredPermissions An array of permission strings.
 * @returns True if the user has all of the specified permissions (or 'manage_all'), false otherwise.
 */
export function hasAllPermissions(
  userProfileWithPermissions: UserProfileWithPermissions | null,
  requiredPermissions: string[]
): boolean {
  if (!userProfileWithPermissions || !userProfileWithPermissions.permissions) {
    return false;
  }
  
  if (userProfileWithPermissions.permissions.includes('manage_all')) {
    return true;
  }

  return requiredPermissions.every(permission =>
    userProfileWithPermissions.permissions.includes(permission)
  );
}
