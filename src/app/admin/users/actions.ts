// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { UserProfileWithPermissions, Role, UserCreationData, EditableUserProfileData, UserFormData } from '@/types';
import { UserService } from '@/services/user.service';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const userService = new UserService();
const userActions = createCrudActions({
    service: userService,
    entityName: 'User',
    entityNamePlural: 'Users',
    routeBase: '/admin/users'
});

export const {
    getAll: getUsersWithRoles,
    getById: getUserProfileData,
    create: createUser,
    update: updateUser,
    delete: deleteUser,
} = userActions;


// --- Ações Específicas ---

export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return userService.findUserByEmail('admin@bidexpert.com.br');
}

export async function updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{success: boolean; message: string}> {
  const result = await userService.updateUserProfile(userId, data);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
  return result;
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  const result = await userService.updateUserRoles(userId, roleIds);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
  return result;
}
