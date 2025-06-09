
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized, AdminFieldValue, ServerTimestamp } from '@/lib/firebase/admin';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
// Renomeado para evitar conflito se este arquivo também exportar getRole, getRoleByName
import { getRole as getRoleAdmin, getRoleByName as getRoleByNameAdmin, ensureDefaultRolesExist as ensureDefaultRolesExistAdmin } from '@/app/admin/roles/actions'; 
import type { UserFormValues } from './user-form-schema';


export async function createUser(
  data: UserFormValues // Mantém UserFormValues que pode incluir senha opcional
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
      if (error.code !== 'auth/user-not-found') throw error; // Re-throw other auth errors
    }

    if (existingAuthUser) {
      // Check if user also exists in our DB profile collection
      const existingDbUser = await db.getUserProfileData(existingAuthUser.uid);
      if (existingDbUser) {
        return { success: false, message: `Usuário com email ${data.email} já existe no Auth e no DB.` };
      }
      // If user exists in Auth but not DB, we might want to sync/create the DB profile for them
      // For now, let's treat this as a conflict that needs manual resolution or different logic
      return { success: false, message: `Usuário com email ${data.email} já existe no sistema de autenticação, mas não possui um perfil no banco de dados. Sincronização manual pode ser necessária ou use a edição de perfil.` };
    }

    // Create user in Firebase Auth
    const userRecord = await authAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, // Or true if you have a verification flow
      password: data.password || undefined, // Password is optional for admin creation
      displayName: data.fullName.trim(),
      disabled: false,
    });

    // Now ensure/create the user profile in our database (Firestore, Postgres, or MySQL)
    // The adapter's ensureUserRole will handle creating if not exists and setting role/permissions
    let roleIdToAssign: string | undefined;
    let roleNameToAssign: string | undefined = 'USER'; // Default role
    let permissionsToAssign: string[] = [];

    // Attempt to get the specific role or default to 'USER'
    const targetRole = data.roleId && data.roleId !== "---NONE---" 
      ? await db.getRole(data.roleId) // getRole from the adapter now
      : await db.getRoleByName('USER'); // getRoleByName from the adapter
    
    if (targetRole) {
        roleIdToAssign = targetRole.id;
        roleNameToAssign = targetRole.name;
        permissionsToAssign = targetRole.permissions || [];
    } else {
        // This case should be rare if ensureDefaultRolesExist runs, but handle it.
        console.warn(`[createUser] Perfil ${data.roleId || 'USER'} não encontrado. Tentando garantir perfis padrão e atribuindo USER.`);
        await db.ensureDefaultRolesExist(); // Ensure default roles from adapter
        const userRoleFallback = await db.getRoleByName('USER');
        if (userRoleFallback) {
            roleIdToAssign = userRoleFallback.id;
            roleNameToAssign = userRoleFallback.name;
            permissionsToAssign = userRoleFallback.permissions || [];
        } else {
             console.error("[createUser] CRITICAL: Perfil USER padrão não pôde ser encontrado ou criado. Usuário será criado sem perfil definido.");
        }
    }
    
    const newUserProfileData: Omit<UserProfileData, 'createdAt' | 'updatedAt' | 'uid'> & { uid: string } = {
      uid: userRecord.uid, // This will be the document ID
      email: userRecord.email!,
      fullName: userRecord.displayName!,
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS', // Adjust as needed
      // Other fields from UserFormValues would be set here if they were part of UserProfileData
      // e.g., cpf: data.cpf, etc. For now, focusing on core auth fields.
    };

    const profileResult = await db.ensureUserRole(
        userRecord.uid, 
        newUserProfileData.email, 
        newUserProfileData.fullName,
        roleNameToAssign || 'USER' // Pass targetRoleName to ensureUserRole
    );

    if (!profileResult.success) {
        // If DB profile creation/update fails, rollback Auth user creation
        try { await authAdmin.deleteUser(userRecord.uid); } 
        catch (delErr) { console.error(`[createUser] Falha ao reverter usuário Auth ${userRecord.uid} após erro no DB.`, delErr); }
        return { success: false, message: `Falha ao criar perfil no banco de dados: ${profileResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso no Auth e perfil no DB.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser] ERRO:`, error);
    let friendlyMessage = `Falha ao criar usuário: ${error.message}`;
    if (error.code === 'auth/email-already-exists') {
        friendlyMessage = 'Este email já está em uso por outra conta.';
    } else if (error.code === 'auth/invalid-password') {
        friendlyMessage = 'A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.';
    }
    return { success: false, message: friendlyMessage };
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  const db = getDatabaseAdapter();
  // ensureAdminInitialized is called within getDatabaseAdapter if it uses FirestoreAdapter
  // or within each method of SQL adapters
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
    const msg = `Erro de Configuração: Admin SDK Auth não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  try {
    // Delete from Firebase Auth first
    await authAdmin.deleteUser(userId).catch(e => { 
      // If user not found in Auth, that's okay, they might only exist in DB or already deleted from Auth
      if (e.code !== 'auth/user-not-found') {
        console.warn(`[deleteUser] Erro ao excluir do Firebase Auth (pode já ter sido excluído ou não existir): ${e.message}`);
        // Não lançar erro aqui, permitir que a exclusão do DB prossiga
      }
    });
    
    // Delete from our database (Firestore, Postgres, or MySQL via adapter)
    const dbResult = await db.deleteUserProfile(userId); 
    
    if (dbResult.success) {
      revalidatePath('/admin/users');
      return { success: true, message: 'Usuário excluído do Auth (se existia) e do banco de dados.' };
    } else {
      return { success: false, message: `Falha ao excluir perfil do DB: ${dbResult.message}. O usuário pode ter sido removido do Auth.` };
    }
  } catch (error: any) {
    console.error(`[deleteUser] Falha ao excluir usuário ${userId}:`, error);
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}


export async function ensureUserRoleInFirestore( // Renomear para ensureUserRoleInDB se for usado de forma genérica
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  const db = getDatabaseAdapter();
  // ensureAdminInitialized is called within the adapter methods if needed
  return db.ensureUserRole(userUid, email || '', fullName, targetRoleName);
}

// Mantendo UserFormData se for diferente de UserProfileData (ex: incluindo senha)
export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };


    