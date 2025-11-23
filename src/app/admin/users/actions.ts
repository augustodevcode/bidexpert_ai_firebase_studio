// src/app/admin/users/actions.ts
/**
 * @fileoverview Server Actions para a entidade User.
 * Este arquivo funciona como a camada de Controller para todas as operações de CRUD
 * relacionadas a usuários, garantindo a aplicação correta do contexto
 * de tenant e revalidando o cache do Next.js quando ocorrem mutações de dados.
 * Ele delega a lógica de negócio para a `UserService`.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { UserProfileWithPermissions, Role, UserCreationData, EditableUserProfileData, UserFormData } from '@/types';
import { UserService } from '@/services/user.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma'; // Import prisma directly for dev-only action

const userService = new UserService();

export async function getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
  return userService.getUsers();
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    const idAsBigInt = BigInt(userId);
    return userService.getUserById(idAsBigInt);
}

/**
 * Fetches the admin user specifically for development auto-login purposes.
 * This should only be used in non-production environments.
 * @returns {Promise<UserProfileWithPermissions | null>} The admin user profile or null.
 */
export async function getAdminUserForDev(): Promise<UserProfileWithPermissions | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  return userService.findUserByEmail('admin@bidexpert.com.br');
}


export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  // Pass tenantId as null, the service will handle the default
  const result = await userService.createUser({ ...data, tenantId: data.tenantId || null });
  if (result.success) {
    if (process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/users');
    }
    return { ...result, userId: result.userId?.toString() };
  }
  return { ...result, userId: undefined };
}


export async function updateUserProfile(userId: string, data: EditableUserProfileData): Promise<{success: boolean; message: string}> {
  const idAsBigInt = BigInt(userId);
  const result = await userService.updateUserProfile(idAsBigInt, data);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
  return result;
}


export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  console.log('[updateUserRoles] Action chamada');
  console.log('[updateUserRoles] userId:', userId);
  console.log('[updateUserRoles] roleIds recebidos:', roleIds);
  
  const idAsBigInt = BigInt(userId);
  const roleIdsAsBigInt = roleIds.map(id => BigInt(id));
  
  console.log('[updateUserRoles] roleIds convertidos para BigInt:', roleIdsAsBigInt.map(id => id.toString()));
  console.log('[updateUserRoles] Chamando userService.updateUserRoles...');
  
  const result = await userService.updateUserRoles(idAsBigInt, roleIdsAsBigInt);
  
  console.log('[updateUserRoles] Resultado do serviço:', result);
  
  if (result.success && process.env.NODE_ENV !== 'test') {
    console.log('[updateUserRoles] Revalidando paths...');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
  }
  
  console.log('[updateUserRoles] Retornando resultado');
  return result;
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
  const idAsBigInt = BigInt(id);
  const result = await userService.deleteUser(idAsBigInt);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/users');
    }
  return result;
}
