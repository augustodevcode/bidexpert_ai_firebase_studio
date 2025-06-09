
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized, AdminFieldValue, ServerTimestamp } from '@/lib/firebase/admin';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist as ensureDefaultRolesExistDb, getRole } from '@/app/admin/roles/actions'; 
import type { UserFormValues } from './user-form-schema';

// This function now primarily uses the Database Adapter
export async function createUser(
  data: UserFormValues
): Promise<{ success: boolean; message: string; userId?: string }> {
  const { authAdmin, error: authSdkError } = ensureAdminInitialized();
  const db = getDatabaseAdapter();

  if (authSdkError || !authAdmin) {
    const msg = `Erro de configuração: Admin SDK Auth não disponível. Detalhe: ${authSdkError?.message || 'SDK não inicializado'}`;
    console.error(`[createUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
   if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }

  try {
    let existingAuthUser;
    try {
      existingAuthUser = await authAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    if (existingAuthUser) {
      const existingDbUser = await db.getUserProfileData(existingAuthUser.uid);
      if (existingDbUser) return { success: false, message: `Usuário com email ${data.email} já existe.` };
      return { success: false, message: `Usuário com email ${data.email} já existe no Auth, mas não no DB. Sincronização manual pode ser necessária.` };
    }

    const userRecord = await authAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false,
      password: data.password || undefined,
      displayName: data.fullName.trim(),
      disabled: false,
    });

    let roleIdToAssign: string | undefined;
    let roleNameToAssign: string | undefined = 'USER';
    let permissionsToAssign: string[] = [];
    const targetRole = data.roleId && data.roleId !== "---NONE---" ? await db.getRole(data.roleId) : await db.getRoleByName('USER');
    
    if (targetRole) {
        roleIdToAssign = targetRole.id;
        roleNameToAssign = targetRole.name;
        permissionsToAssign = targetRole.permissions || [];
    } else {
        console.warn(`[createUser] Perfil ${data.roleId || 'USER'} não encontrado. Atribuindo permissões mínimas.`);
        const userRoleFallback = await db.getRoleByName('USER'); // Attempt to get USER role again if specific one failed
        if (userRoleFallback) {
            roleIdToAssign = userRoleFallback.id;
            roleNameToAssign = userRoleFallback.name;
            permissionsToAssign = userRoleFallback.permissions || [];
        }
    }
    
    const newUserProfileData = {
      uid: userRecord.uid, // This will be the document ID
      email: userRecord.email!,
      fullName: userRecord.displayName!,
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: 'PENDENTE_DOCUMENTOS' as UserHabilitationStatus,
      // createdAt and updatedAt will be handled by the adapter
    };

    // The adapter's ensureUserRole will create if not exists and set the role
    const ensureResult = await db.ensureUserRole(userRecord.uid, newUserProfileData.email, newUserProfileData.fullName, roleNameToAssign || 'USER');
    if (!ensureResult.success) {
        // If ensureUserRole failed, we might need to rollback Auth user creation or log a critical error
        try { await authAdmin.deleteUser(userRecord.uid); } catch (delErr) { console.error(`Failed to rollback Auth user ${userRecord.uid} after DB profile creation failure.`, delErr); }
        return { success: false, message: `Falha ao criar perfil no DB: ${ensureResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso no Auth e perfil no DB.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser] ERRO:`, error);
    return { success: false, message: `Falha ao criar usuário: ${error.message}` };
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  const db = getDatabaseAdapter();
  return db.getUsersWithRoles();
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  const db = getDatabaseAdapter();
  return db.getUserProfileData(userId);
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateUserRole(userId, roleId);
  if (result.success) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
  }
  return result;
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const { authAdmin, error: sdkError } = ensureAdminInitialized();
  const db = getDatabaseAdapter();

  if (sdkError || !authAdmin) {
    return { success: false, message: `Erro de Configuração: Admin SDK Auth não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  try {
    await authAdmin.deleteUser(userId).catch(e => { if (e.code !== 'auth/user-not-found') throw e;});
    const dbResult = await db.deleteUserProfile(userId); // This only deletes from Firestore via adapter
    if (dbResult.success) {
      revalidatePath('/admin/users');
    }
    return { success: true, message: 'Operação de exclusão de usuário (Auth e DB) concluída.' };
  } catch (error: any) {
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}


export async function ensureUserRoleInFirestore(
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  const db = getDatabaseAdapter();
  return db.ensureUserRole(userUid, email, fullName, targetRoleName);
}

export type UserFormData = Omit<UserFormValues, 'password'>;
