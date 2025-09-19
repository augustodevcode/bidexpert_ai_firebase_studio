// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { UserProfileWithPermissions, Role, UserCreationData, EditableUserProfileData, UserFormData } from '@/types';
import { UserService } from '@/services/user.service';

const userService = new UserService();

export async function getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
  return userService.getUsers();
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    return userService.getUserById(userId);
}

// Nova função para buscar o admin em ambiente de desenvolvimento
export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return userService.findUserByEmail('admin@bidexpert.com.br');
}


export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  const result = await userService.createUser(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/users');
  }
  return result;
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

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
  const result = await userService.deleteUser(id);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/users');
    }
  return result;
}
