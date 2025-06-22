// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus, UserProfileWithPermissions } from '@/types';
import type { UserFormValues } from './user-form-schema';

export interface UserCreationData {
  fullName: string;
  email: string;
  password?: string;
  roleId?: string | null;
  cpf?: string;
  cellPhone?: string;
  dateOfBirth?: Date | null;
  accountType?: 'PHYSICAL' | 'LEGAL' | 'DIRECT_SALE_CONSIGNOR';
  razaoSocial?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  websiteComitente?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  optInMarketing?: boolean;
}


// --- Server Actions ---

export async function createUser(
  data: UserCreationData
): Promise<{ success: boolean; message: string; userId?: string }> {
  const db = await getDatabaseAdapter();
  // This is a simplified placeholder for the user creation flow.
  // In a real scenario, this would use Firebase Admin SDK to create the user in Auth,
  // then call ensureUserProfileInDb with the new UID.
  // For this prototype, we'll assume ensureUserProfileInDb handles it.
  const pseudoUid = `user-${Date.now()}`;
  
  const result = await db.ensureUserRole(
      pseudoUid,
      data.email,
      data.fullName,
      'USER', // Default role for new sign-ups
      data,
      data.roleId
  );
  
  if (result.success && result.userProfile) {
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso.', userId: result.userProfile.uid };
  } else {
    return { success: false, message: result.message || 'Falha ao criar perfil de usuário no banco de dados.' };
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  const db = await getDatabaseAdapter();
  return db.getUsersWithRoles();
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
  const db = await getDatabaseAdapter();
  const profile = await db.getUserProfileData(userId);
  // Ensure the returned profile conforms to UserProfileWithPermissions
  if (profile) {
    return {
      ...profile,
      permissions: profile.permissions || [],
    };
  }
  return null;
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateUserRole(userId, roleId);
  if (result.success) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
  }
  return result;
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const db = await getDatabaseAdapter();
    // This is a simplified deletion. In a real app, you'd use Firebase Admin SDK to delete from Auth first.
    const result = await db.deleteUserProfile(userId);
    if(result.success) {
        revalidatePath('/admin/users');
    }
    return result;
}

export async function ensureUserProfileInDb(
  userUid: string,
  email: string,
  fullName: string | null,
  targetRoleNameInput: string,
  additionalProfileData?: Partial<UserProfileData & {password?: string}>,
  roleIdToAssign?: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileWithPermissions }> {
    const db = await getDatabaseAdapter();
    console.log(`[ensureUserProfileInDb Action] Calling DB adapter of type: ${db.constructor.name}`);
    return db.ensureUserRole(userUid, email, fullName, targetRoleNameInput, additionalProfileData, roleIdToAssign);
}

export async function getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    const db = await getDatabaseAdapter();
    return db.getUserByEmail(email);
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
