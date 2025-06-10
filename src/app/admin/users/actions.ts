
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized } from '@/lib/firebase/admin'; // Importar a função de inicialização
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import type { UserFormValues } from './user-form-schema';
import { getRole as getRoleAction, ensureDefaultRolesExist as ensureDefaultRolesExistAction } from '@/app/admin/roles/actions';

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
  // 1. Garantir que o Admin SDK (especialmente Auth) esteja pronto
  const { authAdmin, error: sdkError } = ensureAdminInitialized();

  if (sdkError || !authAdmin) {
    const msg = `Erro de configuração: Firebase Admin SDK (Auth) não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado corretamente.'}`;
    console.error(`[createUser - Admin SDK Check] ${msg}`);
    return { success: false, message: msg };
  }

  const db = getDatabaseAdapter();

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  // Senha é opcional no formulário, mas o Firebase Auth exige uma senha para criação via Admin SDK
  // se não estivermos usando provedores de identidade. Se data.password for undefined,
  // o createUser do Firebase Auth pode falhar ou exigir configuração adicional.
  // Vamos permitir undefined por enquanto, mas isso pode precisar ser tratado.
  if (data.password && data.password.length < 6) {
    return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }


  try {
    let existingAuthUser;
    try {
      existingAuthUser = await authAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    if (existingAuthUser) {
      // Verificar se o usuário também existe no nosso banco de dados de perfis
      const existingDbUser = await db.getUserProfileData(existingAuthUser.uid);
      if (existingDbUser) {
        return { success: false, message: `Usuário com email ${data.email} já existe no sistema de autenticação e no banco de dados de perfis.` };
      }
      // Se existe no Auth mas não no DB, podemos prosseguir para criar o perfil no DB
      // No entanto, a lógica original criava um novo usuário Auth, o que daria erro.
      // Corrigindo para tratar esse caso: se existe no Auth, não tente criar no Auth de novo.
      // Em vez disso, apenas crie/atualize o perfil no DB.
      // OU, se a intenção é que o admin possa "forçar" uma nova conta Auth,
      // então o admin precisaria excluir a conta Auth existente primeiro.
      // Por simplicidade, vamos assumir que não queremos duplicar no Auth.
      return { success: false, message: `Usuário com email ${data.email} já existe no sistema de autenticação. Se o perfil não existe no banco de dados, considere uma sincronização ou edição.` };
    }
    
    // Criar usuário no Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, // Pode ser definido como true se o fluxo de verificação for externo
      password: data.password, // Será undefined se não fornecido, createUser pode exigir
      displayName: data.fullName.trim(),
      disabled: false,
    });

    let targetRoleNameForDbSync: string = 'USER'; 
    let targetRoleIdForDbSync: string | undefined = undefined;
    let targetRolePermissions: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
        const roleDoc = await getRoleAction(data.roleId); 
        if (roleDoc) {
            targetRoleNameForDbSync = roleDoc.name;
            targetRoleIdForDbSync = roleDoc.id;
            targetRolePermissions = roleDoc.permissions || [];
        } else {
            console.warn(`[createUser] Perfil com ID ${data.roleId} não encontrado. Usando '${targetRoleNameForDbSync}' como padrão.`);
            const userRole = await getRoleByNameAction('USER');
            if (userRole) {
                targetRoleIdForDbSync = userRole.id;
                targetRolePermissions = userRole.permissions || [];
            }
        }
    } else {
        const userRole = await getRoleByNameAction('USER');
        if (userRole) {
            targetRoleNameForDbSync = userRole.name; // já é 'USER'
            targetRoleIdForDbSync = userRole.id;
            targetRolePermissions = userRole.permissions || [];
        } else {
            // Tenta garantir que os perfis padrão existam se 'USER' não for encontrado
            await ensureDefaultRolesExistAction();
            const userRoleAfterEnsure = await getRoleByNameAction('USER');
            if (userRoleAfterEnsure) {
                targetRoleIdForDbSync = userRoleAfterEnsure.id;
                targetRolePermissions = userRoleAfterEnsure.permissions || [];
            } else {
                 console.error("[createUser] CRITICAL: Perfil 'USER' não encontrado mesmo após ensureDefaultRolesExist. Não é possível criar o usuário com um perfil.");
                // Rollback da criação do usuário no Firebase Auth
                try { await authAdmin.deleteUser(userRecord.uid); }
                catch (delErr) { console.error(`[createUser] Falha ao reverter usuário Auth ${userRecord.uid} após erro de perfil.`, delErr); }
                return { success: false, message: "Perfil 'USER' padrão não encontrado. Contate o administrador." };
            }
        }
    }
    
    // Preparar dados para o perfil no banco de dados (Firestore ou SQL)
    // A action ensureUserRole no adaptador é responsável por criar ou atualizar
    const profileResult = await db.ensureUserRole(
        userRecord.uid, 
        userRecord.email!, 
        userRecord.displayName!,
        targetRoleNameForDbSync, // Passar o nome do perfil para o adaptador resolver
        { // Additional profile data
            cpf: data.cpf,
            cellPhone: data.cellPhone,
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth : undefined, // Passar como Date ou undefined
        }
    );

    if (!profileResult.success) {
        // Se a criação/atualização do perfil no DB falhar, excluir o usuário recém-criado no Auth
        try { await authAdmin.deleteUser(userRecord.uid); } 
        catch (delErr) { console.error(`[createUser] Falha ao reverter usuário Auth ${userRecord.uid} após erro no DB.`, delErr); }
        return { success: false, message: `Falha ao criar perfil do usuário no banco de dados: ${profileResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser] ERRO GERAL:`, error);
    let friendlyMessage = `Falha ao criar usuário: ${error.message || 'Erro desconhecido'}`;
    if (error.code === 'auth/email-already-exists') {
        friendlyMessage = 'Este email já está em uso por outra conta.';
    } else if (error.code === 'auth/invalid-password') {
        friendlyMessage = 'A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.';
    }
    // Outros códigos de erro do Firebase Auth podem ser tratados aqui
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
  
  if (sdkError || !authAdmin) {
    const msg = `Erro de Configuração: Admin SDK Auth não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }

  const db = getDatabaseAdapter();
  try {
    // Tenta excluir do Firebase Auth primeiro. Se não existir lá, não é um erro crítico.
    await authAdmin.deleteUser(userId).catch(e => { 
      if (e.code !== 'auth/user-not-found') {
        // Se for outro erro além de 'user-not-found', registre, mas continue para excluir do DB.
        console.warn(`[deleteUser] Erro ao excluir do Firebase Auth (pode já ter sido excluído ou não existir): ${e.message}`);
      }
    });
    
    const dbResult = await db.deleteUserProfile(userId); 
    
    if (dbResult.success) {
      revalidatePath('/admin/users');
      return { success: true, message: 'Usuário excluído do Auth (se existia) e do banco de dados.' };
    } else {
      // Mesmo que a exclusão do DB falhe, o usuário pode ter sido removido do Auth.
      return { success: false, message: `Falha ao excluir perfil do DB: ${dbResult.message}. O usuário pode ter sido removido do Auth.` };
    }
  } catch (error: any) {
    console.error(`[deleteUser] Falha ao excluir usuário ${userId}:`, error);
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}


export async function ensureUserRoleInFirestore( // Manter este nome se chamado de auth-context
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
    console.error(`[Action - ensureUserRoleInFirestore for user ${userUid}] Falha:`, error);
    return { success: false, message: `Erro ao garantir perfil do usuário: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };

    
