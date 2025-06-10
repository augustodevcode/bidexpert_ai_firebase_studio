
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized } from '@/lib/firebase/admin'; // Importar a função de inicialização
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import type { UserFormValues } from './user-form-schema';
// Importar as Server Actions de roles/actions.ts
import { getRole, ensureDefaultRolesExist as ensureDefaultRolesExistAction, getRoleByName as getRoleByNameAction } from '@/app/admin/roles/actions'; 

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
  console.log('[createUser Action] Iniciada com dados:', { email: data.email, fullName: data.fullName });
  
  // 1. Garantir que o Admin SDK (especialmente Auth) esteja pronto
  const sdkInitResult = ensureAdminInitialized();
  
  if (sdkInitResult.error || !sdkInitResult.auth || !sdkInitResult.app) {
    const msg = `Erro de configuração: Firebase Admin SDK (Auth) não disponível. Detalhe: ${sdkInitResult.error?.message || 'SDK ou App não inicializado corretamente.'}`;
    console.error(`[createUser Action - Admin SDK Check] ${msg}`);
    return { success: false, message: msg };
  }
  const localAuthAdmin = sdkInitResult.auth; // Use a instância local
  console.log(`[createUser Action] Admin SDK inicializado. App nome: ${sdkInitResult.app.name}. Prosseguindo com a criação do usuário.`);


  const db = getDatabaseAdapter();

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  if (data.password && data.password.length < 6) {
    return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  try {
    let existingAuthUser;
    try {
      existingAuthUser = await localAuthAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    if (existingAuthUser) {
      return { success: false, message: `Usuário com email ${data.email} já existe no sistema de autenticação. Se o perfil não existe no banco de dados, considere uma sincronização ou edição.` };
    }
    
    const userRecord = await localAuthAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, 
      password: data.password, 
      displayName: data.fullName.trim(),
      disabled: false,
    });
    console.log(`[createUser Action] Usuário criado no Firebase Auth: ${userRecord.uid}`);

    let targetRoleNameForDbSync: string = 'USER'; 
    let targetRoleIdForDbSync: string | undefined = undefined;
    let targetRolePermissions: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
        // Usar a Server Action getRole
        const roleDoc = await getRole(data.roleId); 
        if (roleDoc) {
            targetRoleNameForDbSync = roleDoc.name;
            targetRoleIdForDbSync = roleDoc.id;
            targetRolePermissions = roleDoc.permissions || [];
        } else {
            console.warn(`[createUser Action] Perfil com ID ${data.roleId} não encontrado. Usando '${targetRoleNameForDbSync}' como padrão.`);
            const userRole = await getRoleByNameAction('USER');
            if (userRole) {
                targetRoleIdForDbSync = userRole.id;
                targetRolePermissions = userRole.permissions || [];
            }
        }
    } else {
        const userRole = await getRoleByNameAction('USER');
        if (userRole) {
            targetRoleNameForDbSync = userRole.name; 
            targetRoleIdForDbSync = userRole.id;
            targetRolePermissions = userRole.permissions || [];
        } else {
            await ensureDefaultRolesExistAction();
            const userRoleAfterEnsure = await getRoleByNameAction('USER');
            if (userRoleAfterEnsure) {
                targetRoleIdForDbSync = userRoleAfterEnsure.id;
                targetRolePermissions = userRoleAfterEnsure.permissions || [];
            } else {
                 console.error("[createUser Action] CRITICAL: Perfil 'USER' não encontrado mesmo após ensureDefaultRolesExist. Não é possível criar o usuário com um perfil.");
                try { await localAuthAdmin.deleteUser(userRecord.uid); }
                catch (delErr) { console.error(`[createUser Action] Falha ao reverter usuário Auth ${userRecord.uid} após erro de perfil.`, delErr); }
                return { success: false, message: "Perfil 'USER' padrão não encontrado. Contate o administrador." };
            }
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
        try { await localAuthAdmin.deleteUser(userRecord.uid); } 
        catch (delErr) { console.error(`[createUser Action] Falha ao reverter usuário Auth ${userRecord.uid} após erro no DB.`, delErr); }
        return { success: false, message: `Falha ao criar perfil do usuário no banco de dados: ${profileResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser Action] ERRO GERAL:`, error);
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
  const sdkInitResult = ensureAdminInitialized();
  
  if (sdkInitResult.error || !sdkInitResult.auth) {
    const msg = `Erro de Configuração: Admin SDK Auth não disponível. Detalhe: ${sdkInitResult.error?.message || 'SDK não inicializado'}`;
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  const localAuthAdmin = sdkInitResult.auth;

  const db = getDatabaseAdapter();
  try {
    await localAuthAdmin.deleteUser(userId).catch(e => { 
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
    return db.ensureUserRole(userUid, email || '', fullName, targetRoleName, additionalProfileData);
  } catch (error: any) {
    console.error(`[Action - ensureUserRole for user ${userUid}] Falha:`, error);
    return { success: false, message: `Erro ao garantir perfil do usuário: ${error.message}` };
  }
}

// UserFormValues é importado de user-form-schema.ts
// export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
// A action createUser espera UserCreationData, que é mais simples para o formulário de novo usuário.
// A user-form.tsx já está alinhada com UserFormValues.

