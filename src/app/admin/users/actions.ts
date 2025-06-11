
// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import type { UserFormValues } from './user-form-schema'; 
import { v4 as uuidv4 } from 'uuid';

// CORRIGIDO: Importar funções de queries para leitura e actions para escrita/lógica de mais alto nível
import { 
  getRoleInternal as getRoleByIdInternal,      // Para buscar por ID
  getRoleByNameInternal                       // Para buscar por nome
} from '@/app/admin/roles/queries'; 
import { 
  ensureDefaultRolesExist as ensureDefaultRolesExistAction 
} from '@/app/admin/roles/actions';


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
  console.log(`[createUser Action] Iniciada com dados:`, { email: data.email, fullName: data.fullName });
  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'MYSQL';
  console.log(`[createUser Action] ACTIVE_DATABASE_SYSTEM: ${activeSystem}`);
  
  const db = await getDatabaseAdapter();
  let userIdToUse: string;

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  
  try {
    if (activeSystem === 'FIRESTORE') {
      console.log('[createUser Action] Sistema é FIRESTORE. Tentando criar usuário no Firebase Auth.');
      const adminModule = await import('@/lib/firebase/admin');
      const sdkInitResult = adminModule.ensureAdminInitialized();

      if (sdkInitResult.error || !sdkInitResult.auth || !sdkInitResult.app) {
        const msg = `Erro de config: Admin SDK Auth não disponível. Detalhe: ${sdkInitResult.error?.message || 'SDK/App não inicializado'}`;
        console.error(`[createUser Action - Admin SDK Check] ${msg}`);
        return { success: false, message: msg };
      }
      const localAuthAdmin = sdkInitResult.auth;
      console.log(`[createUser Action] Admin SDK Auth inicializado para Firestore. App: ${sdkInitResult.app.name}.`);

      let existingAuthUser;
      try {
        existingAuthUser = await localAuthAdmin.getUserByEmail(data.email.trim().toLowerCase());
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') throw error; 
      }

      if (existingAuthUser) {
        return { success: false, message: `Usuário com email ${data.email} já existe no Firebase Auth.` };
      }
      if (!data.password || data.password.length < 6) { 
         return { success: false, message: 'A senha é obrigatória e deve ter pelo menos 6 caracteres para Firebase Auth.' };
      }

      const userRecord = await localAuthAdmin.createUser({
        email: data.email.trim().toLowerCase(),
        emailVerified: false,
        password: data.password,
        displayName: data.fullName.trim(),
        disabled: false,
      });
      userIdToUse = userRecord.uid;
      console.log(`[createUser Action] Usuário criado no Firebase Auth: ${userIdToUse}`);
    } else {
      console.log(`[createUser Action] Sistema é ${activeSystem}. Gerando UID local e pulando Firebase Auth.`);
      userIdToUse = uuidv4(); 
      if (!data.password || data.password.length < 6) { 
         return { success: false, message: 'A senha é obrigatória e deve ter pelo menos 6 caracteres.' };
      }
    }

    let targetRoleNameForDbSync: string = 'USER';
    let targetRoleIdForDbSync: string | undefined = undefined;

    if (data.roleId && data.roleId !== "---NONE---") {
      const roleDoc = await getRoleByIdInternal(data.roleId); // CORRIGIDO
      if (roleDoc) {
        targetRoleNameForDbSync = roleDoc.name;
        targetRoleIdForDbSync = roleDoc.id;
      } else {
        console.warn(`[createUser Action] Perfil com ID ${data.roleId} não encontrado. Usando '${targetRoleNameForDbSync}' como padrão.`);
        const userRole = await getRoleByNameInternal('USER'); // CORRIGIDO
        if (userRole) targetRoleIdForDbSync = userRole.id;
      }
    } else {
      const userRole = await getRoleByNameInternal('USER'); // CORRIGIDO
      if (userRole) {
        targetRoleNameForDbSync = userRole.name;
        targetRoleIdForDbSync = userRole.id;
      } else {
        await ensureDefaultRolesExistAction(); 
        const userRoleAfterEnsure = await getRoleByNameInternal('USER'); // CORRIGIDO
        if (userRoleAfterEnsure) {
          targetRoleIdForDbSync = userRoleAfterEnsure.id;
        } else {
          console.error("[createUser Action] CRITICAL: Perfil 'USER' não encontrado. Não é possível criar usuário.");
          if (activeSystem === 'FIRESTORE') {
             const adminModule = await import('@/lib/firebase/admin');
             const { auth: localAuthAdminForCleanup } = adminModule.ensureAdminInitialized();
             if(localAuthAdminForCleanup) { try { await localAuthAdminForCleanup.deleteUser(userIdToUse); } catch (delErr) { console.error(`Falha ao reverter usuário Auth ${userIdToUse}.`, delErr);}}
          }
          return { success: false, message: "Perfil 'USER' padrão não encontrado. Contate o administrador." };
        }
      }
    }
    
    const profileResult = await db.ensureUserRole(
        userIdToUse, 
        data.email.trim().toLowerCase(), 
        data.fullName.trim(),
        targetRoleNameForDbSync,
        { 
            cpf: data.cpf,
            cellPhone: data.cellPhone,
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth : undefined,
            password: data.password 
        },
        targetRoleIdForDbSync // Passando o ID do perfil explicitamente
    );

    if (!profileResult.success) {
      if (activeSystem === 'FIRESTORE') {
        const adminModule = await import('@/lib/firebase/admin');
        const { auth: localAuthAdminForCleanup } = adminModule.ensureAdminInitialized();
        if(localAuthAdminForCleanup) { try { await localAuthAdminForCleanup.deleteUser(userIdToUse); } catch (delErr) { console.error(`Falha ao reverter usuário Auth ${userIdToUse} após erro no DB.`, delErr); }}
      }
      return { success: false, message: `Falha ao criar perfil do usuário no banco de dados: ${profileResult.message}` };
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso.', userId: userIdToUse };

  } catch (error: any) {
    console.error(`[createUser Action] ERRO GERAL:`, error);
    let friendlyMessage = `Falha ao criar usuário: ${error.message || 'Erro desconhecido'}`;
    if (activeSystem === 'FIRESTORE' && error.code === 'auth/email-already-exists') {
        friendlyMessage = 'Este email já está em uso por outra conta no Firebase Auth.';
    } else if (activeSystem === 'FIRESTORE' && error.code === 'auth/invalid-password') {
        friendlyMessage = 'A senha fornecida não é válida para o Firebase Auth. Deve ter pelo menos 6 caracteres.';
    }
    return { success: false, message: friendlyMessage };
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  console.log(`[Action - getUsersWithRoles] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  try {
    const db = await getDatabaseAdapter();
    return db.getUsersWithRoles();
  } catch (error) {
    console.error("[Action - getUsersWithRoles] Falha ao buscar usuários com perfis:", error);
    return []; 
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  console.log(`[Action - getUserProfileData] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  try {
    const db = await getDatabaseAdapter();
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
  console.log(`[Action - updateUserRole] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  try {
    const db = await getDatabaseAdapter();
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
  console.log(`[Action - deleteUser] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const activeSystem = process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() || 'MYSQL';
  const db = await getDatabaseAdapter();

  try {
    if (activeSystem === 'FIRESTORE') {
      const adminModule = await import('@/lib/firebase/admin');
      const { auth: localAuthAdmin, error: sdkError } = adminModule.ensureAdminInitialized();
      if (sdkError || !localAuthAdmin) {
        console.warn(`[deleteUser - Admin SDK] Erro de Configuração: Admin SDK Auth não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}. Prosseguindo com exclusão do DB.`);
      } else {
        await localAuthAdmin.deleteUser(userId).catch(e => { 
          if (e.code !== 'auth/user-not-found') {
            console.warn(`[deleteUser] Erro ao excluir do Firebase Auth (pode já ter sido excluído ou não existir): ${e.message}`);
          }
        });
      }
    }
    
    const dbResult = await db.deleteUserProfile(userId); 
    
    if (dbResult.success) {
      revalidatePath('/admin/users');
      return { success: true, message: `Usuário excluído do banco de dados ${activeSystem}. Status da exclusão do Auth (se aplicável) verificado.` };
    } else {
      return { success: false, message: `Falha ao excluir perfil do DB (${activeSystem}): ${dbResult.message}.` };
    }
  } catch (error: any) {
    console.error(`[deleteUser] Falha ao excluir usuário ${userId} do sistema ${activeSystem}:`, error);
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}

export async function ensureUserProfileInDb( 
  userUid: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string,
  additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' >>,
  roleIdToAssign?: string // Adicionado para passar o ID do perfil se já conhecido
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  console.log(`[Action - ensureUserProfileInDb] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  try {
    const db = await getDatabaseAdapter();
    return db.ensureUserRole(userUid, email || '', fullName, targetRoleName, additionalProfileData, roleIdToAssign);
  } catch (error: any) {
    console.error(`[Action - ensureUserProfileInDb for user ${userUid}] Falha:`, error);
    return { success: false, message: `Erro ao garantir perfil do usuário: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
