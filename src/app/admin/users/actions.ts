
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized, AdminFieldValue } from '@/lib/firebase/admin'; 
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import type { UserFormValues } from './user-form-schema'; 
// Importar a Server Action getRoleByName de roles/actions.ts
import { getRoleByName as getRoleByNameAction, ensureDefaultRolesExist as ensureDefaultRolesExistAction } from '@/app/admin/roles/actions'; 

export interface UserCreationData {
  fullName: string;
  email: string;
  password?: string; 
  roleId?: string | null; 
  cpf?: string;
  cellPhone?: string;
  dateOfBirth?: Date | null;
}


export async function createUser(
  data: UserCreationData
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
      if (existingDbUser) {
        return { success: false, message: `Usuário com email ${data.email} já existe no Auth e no DB.` };
      }
      return { success: false, message: `Usuário com email ${data.email} já existe no sistema de autenticação. Considere editar o perfil existente se ele não estiver no banco de dados.` };
    }
    
    const userRecord = await authAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, 
      password: data.password || undefined, 
      displayName: data.fullName.trim(),
      disabled: false,
    });

    let targetRoleNameForDbSync: string = 'USER'; 
    if (data.roleId && data.roleId !== "---NONE---") {
        // Usar a Server Action getRole para buscar o perfil por ID
        const roleDoc = await getRole(data.roleId); // getRole é a Server Action importada
        if (roleDoc) {
            targetRoleNameForDbSync = roleDoc.name;
        } else {
            console.warn(`[createUser] Perfil com ID ${data.roleId} não encontrado usando Server Action. Usando '${targetRoleNameForDbSync}' como padrão.`);
        }
    }
    
    const profileResult = await db.ensureUserRole(
        userRecord.uid, 
        userRecord.email!, 
        userRecord.displayName!,
        targetRoleNameForDbSync,
        { 
            cpf: data.cpf,
            cellPhone: data.cellPhone,
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth : undefined,
        }
    );

    if (!profileResult.success) {
        try { await authAdmin.deleteUser(userRecord.uid); } 
        catch (delErr) { console.error(`[createUser] Falha ao reverter usuário Auth ${userRecord.uid} após erro no DB.`, delErr); }
        return { success: false, message: `Falha ao criar perfil no banco de dados: ${profileResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser] ERRO:`, error);
    let friendlyMessage = `Falha ao criar usuário: ${error.message || 'Erro desconhecido'}`;
    if (error.code === 'auth/email-already-exists') {
        friendlyMessage = 'Este email já está em uso por outra conta.';
    } else if (error.code === 'auth/invalid-password') {
        friendlyMessage = 'A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.';
    }
    return { success: false, message: friendlyMessage };
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  try {
    const db = getDatabaseAdapter();
    return db.getUsersWithRoles();
  } catch (error) {
    console.error("[Action - getUsersWithRoles] Falha ao buscar usuários com perfis:", error);
    return []; 
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  try {
    const db = getDatabaseAdapter();
    return db.getUserProfileData(userId);
  } catch (error: any) {
    console.error(`[Action - getUserProfileData for ID ${userId}] Falha:`, error);
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabaseAdapter();
    const result = await db.updateUserRole(userId, roleId);
    if (result.success) {
      revalidatePath('/admin/users');
      revalidatePath(`/admin/users/${userId}/edit`);
    }
    return result;
  } catch (error: any) {
    console.error(`[Action - updateUserRole for user ${userId}] Falha:`, error);
    return { success: false, message: `Erro ao atualizar perfil: ${error.message}` };
  }
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
    await authAdmin.deleteUser(userId).catch(e => { 
      if (e.code !== 'auth/user-not-found') {
        console.warn(`[deleteUser] Erro ao excluir do Firebase Auth (pode já ter sido excluído ou não existir): ${e.message}`);
      }
    });
    
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

export async function ensureUserRole( 
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string,
  additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth'>>
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  try {
    const db = getDatabaseAdapter();
    // A ensureUserRole do adaptador já chama ensureDefaultRolesExist
    return db.ensureUserRole(userUid, email || '', fullName, targetRoleName, additionalProfileData);
  } catch (error: any) {
    console.error(`[Action - ensureUserRole for user ${userUid}] Falha:`, error);
    return { success: false, message: `Erro ao garantir perfil do usuário: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
