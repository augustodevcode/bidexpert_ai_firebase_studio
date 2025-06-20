
// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import type { UserFormValues } from './user-form-schema';
import { v4 as uuidv4 } from 'uuid';

// CORRIGIDO: Importar funções de queries para leitura e actions para escrita/lógica de mais alto nível
import {
  getRoleInternal,      // Para buscar por ID
  getRoleByNameInternal                       // Para buscar por nome
} from '../roles/queries'; // Caminho relativo corrigido
import {
  ensureDefaultRolesExist as ensureDefaultRolesExistAction
} from '../roles/actions'; // Caminho relativo corrigido

const ADMIN_SUPER_EMAIL = 'admin@bidexpert.com.br';


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
      const { auth: localAuthAdmin, error: sdkError } = adminModule.ensureAdminInitialized();

      if (sdkError || !localAuthAdmin || !adminModule.app) {
        const msg = `Erro de config: Admin SDK Auth não disponível. Detalhe: ${sdkError?.message || 'SDK/App não inicializado'}`;
        console.error(`[createUser Action - Admin SDK Check] ${msg}`);
        return { success: false, message: msg };
      }
      console.log(`[createUser Action] Admin SDK Auth inicializado para Firestore. App: ${adminModule.app.name}.`);

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
        emailVerified: false, // Can be changed based on your flow (e.g., send verification email)
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

    if (data.email.trim().toLowerCase() === ADMIN_SUPER_EMAIL.toLowerCase()) {
        targetRoleNameForDbSync = 'ADMINISTRATOR';
        console.log(`[createUser Action] Email ${ADMIN_SUPER_EMAIL} detectado. Tentando buscar perfil ADMINISTRATOR.`);
        const adminRole = await getRoleByNameInternal('ADMINISTRATOR');
        if (adminRole && adminRole.id) {
            targetRoleIdForDbSync = adminRole.id;
            console.log(`[createUser Action] Perfil ADMINISTRATOR encontrado. ID: ${targetRoleIdForDbSync}`);
        } else {
             console.warn(`[createUser Action] Perfil ADMINISTRATOR não encontrado para ${ADMIN_SUPER_EMAIL}. Tentando garantir e rebuscar...`);
             await ensureDefaultRolesExistAction();
             const adminRoleAfterEnsure = await getRoleByNameInternal('ADMINISTRATOR');
             if (adminRoleAfterEnsure && adminRoleAfterEnsure.id) {
                targetRoleIdForDbSync = adminRoleAfterEnsure.id;
                console.log(`[createUser Action] Perfil ADMINISTRATOR encontrado após ensure. ID: ${targetRoleIdForDbSync}`);
             } else {
                console.error(`[createUser Action] CRÍTICO: Perfil ADMINISTRATOR ainda não encontrado para ${ADMIN_SUPER_EMAIL}.`);
                if (activeSystem === 'FIRESTORE') {
                    const adminModule = await import('@/lib/firebase/admin');
                    const { auth: localAuthAdminForCleanup } = adminModule.ensureAdminInitialized();
                    if(localAuthAdminForCleanup) { try { await localAuthAdminForCleanup.deleteUser(userIdToUse); console.log(`[createUser Action] Usuário Auth ${userIdToUse} revertido.`); } catch (delErr) { console.error(`Falha ao reverter usuário Auth ${userIdToUse}.`, delErr);}}
                }
                return { success: false, message: "Perfil 'ADMINISTRATOR' padrão não encontrado. Contate o administrador." };
             }
        }
    } else if (data.roleId && data.roleId !== "---NONE---") {
      console.log(`[createUser Action] Tentando buscar perfil por roleId fornecido: ${data.roleId}`);
      const roleDoc = await getRoleInternal(data.roleId);
      if (roleDoc) {
        targetRoleNameForDbSync = roleDoc.name;
        targetRoleIdForDbSync = roleDoc.id;
        console.log(`[createUser Action] Perfil encontrado por ID: ${targetRoleNameForDbSync} (ID: ${targetRoleIdForDbSync})`);
      } else {
        console.warn(`[createUser Action] Perfil com ID ${data.roleId} não encontrado. Usando '${targetRoleNameForDbSync}' como padrão.`);
        const userRole = await getRoleByNameInternal('USER');
        if (userRole) targetRoleIdForDbSync = userRole.id;
      }
    } else {
      console.log(`[createUser Action] Nenhuma roleId específica fornecida, usando role padrão 'USER'.`);
      const userRole = await getRoleByNameInternal('USER');
      if (userRole && userRole.id) {
        targetRoleNameForDbSync = userRole.name;
        targetRoleIdForDbSync = userRole.id;
        console.log(`[createUser Action] Perfil USER encontrado. ID: ${targetRoleIdForDbSync}`);
      } else {
        console.warn(`[createUser Action] Perfil USER não encontrado. Tentando garantir e rebuscar...`);
        await ensureDefaultRolesExistAction();
        const userRoleAfterEnsure = await getRoleByNameInternal('USER');
        if (userRoleAfterEnsure && userRoleAfterEnsure.id) {
          targetRoleIdForDbSync = userRoleAfterEnsure.id;
          console.log(`[createUser Action] Perfil USER encontrado após ensure. ID: ${targetRoleIdForDbSync}`);
        } else {
          console.error("[createUser Action] CRITICAL: Perfil 'USER' não encontrado. Não é possível criar usuário.");
          if (activeSystem === 'FIRESTORE') {
             const adminModule = await import('@/lib/firebase/admin');
             const { auth: localAuthAdminForCleanup } = adminModule.ensureAdminInitialized();
             if(localAuthAdminForCleanup) { try { await localAuthAdminForCleanup.deleteUser(userIdToUse); console.log(`[createUser Action] Usuário Auth ${userIdToUse} revertido.`); } catch (delErr) { console.error(`Falha ao reverter usuário Auth ${userIdToUse}.`, delErr);}}
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
            password: data.password,
            accountType: data.accountType,
            razaoSocial: data.razaoSocial,
            cnpj: data.cnpj,
            inscricaoEstadual: data.inscricaoEstadual,
            websiteComitente: data.websiteComitente,
            zipCode: data.zipCode,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            optInMarketing: data.optInMarketing,
        },
        targetRoleIdForDbSync
    );

    if (!profileResult.success) {
      if (activeSystem === 'FIRESTORE') {
        const adminModule = await import('@/lib/firebase/admin');
        const { auth: localAuthAdminForCleanup } = adminModule.ensureAdminInitialized();
        if(localAuthAdminForCleanup) { try { await localAuthAdminForCleanup.deleteUser(userIdToUse); console.log(`[createUser Action] Usuário Auth ${userIdToUse} revertido após erro no DB.`); } catch (delErr) { console.error(`Falha ao reverter usuário Auth ${userIdToUse} após erro no DB.`, delErr); }}
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
  targetRoleNameInput: string,
  additionalProfileData?: Partial<Pick<UserProfileData, 'cpf' | 'cellPhone' | 'dateOfBirth' | 'password' | 'accountType' | 'razaoSocial' | 'cnpj' | 'inscricaoEstadual' | 'websiteComitente' | 'zipCode' | 'street' | 'number' | 'complement' | 'neighborhood' | 'city' | 'state' | 'optInMarketing' >>,
  roleIdToAssign?: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  console.log(`[Action - ensureUserProfileInDb] Called for ${email}. Target role name input: ${targetRoleNameInput}, Role ID to assign: ${roleIdToAssign}`);
  try {
    const db = await getDatabaseAdapter();
    let finalTargetRoleName = targetRoleNameInput;
    let finalRoleIdToAssign = roleIdToAssign;

    if (email && email.trim().toLowerCase() === ADMIN_SUPER_EMAIL.toLowerCase()) {
      console.log(`[ensureUserProfileInDb] Email ${ADMIN_SUPER_EMAIL} detectado. Forçando perfil para ADMINISTRATOR.`);
      finalTargetRoleName = 'ADMINISTRATOR';
      const adminRole = await getRoleByNameInternal('ADMINISTRATOR');
      if (adminRole && adminRole.id) {
        finalRoleIdToAssign = adminRole.id;
        console.log(`[ensureUserProfileInDb] Perfil ADMINISTRATOR encontrado com ID: ${finalRoleIdToAssign}.`);
      } else {
         console.warn(`[ensureUserProfileInDb Action] Perfil ADMINISTRATOR não encontrado para ${ADMIN_SUPER_EMAIL} durante ensure. Tentando garantir e rebuscar...`);
         await ensureDefaultRolesExistAction();
         const adminRoleAfterEnsure = await getRoleByNameInternal('ADMINISTRATOR');
         if (adminRoleAfterEnsure && adminRoleAfterEnsure.id) {
            finalRoleIdToAssign = adminRoleAfterEnsure.id;
            console.log(`[ensureUserProfileInDb] Perfil ADMINISTRATOR encontrado após ensure. ID: ${finalRoleIdToAssign}`);
         } else {
            console.error(`[ensureUserProfileInDb Action] CRÍTICO: Perfil ADMINISTRATOR ainda não encontrado para ${ADMIN_SUPER_EMAIL} no ensure.`);
            return { success: false, message: "Perfil 'ADMINISTRATOR' padrão não encontrado. Contate o administrador." };
         }
      }
    } else if (finalRoleIdToAssign && finalRoleIdToAssign !== "---NONE---") {
      console.log(`[ensureUserProfileInDb] RoleId ${finalRoleIdToAssign} foi fornecido. Tentando buscar este perfil.`);
      const roleById = await getRoleInternal(finalRoleIdToAssign);
      if (roleById) {
        finalTargetRoleName = roleById.name;
        console.log(`[ensureUserProfileInDb] Perfil encontrado por ID: ${finalTargetRoleName}`);
      } else {
        console.warn(`[ensureUserProfileInDb] Perfil com ID ${finalRoleIdToAssign} não encontrado. Tentando buscar por nome: ${finalTargetRoleName}.`);
        const roleByName = await getRoleByNameInternal(finalTargetRoleName);
        if (roleByName && roleByName.id) {
          finalRoleIdToAssign = roleByName.id;
          console.log(`[ensureUserProfileInDb] Perfil ${finalTargetRoleName} encontrado por nome. ID: ${finalRoleIdToAssign}`);
        } else {
          console.warn(`[ensureUserProfileInDb] Perfil ${finalTargetRoleName} não encontrado por nome. Usando 'USER' como fallback.`);
          finalTargetRoleName = 'USER';
          const userRole = await getRoleByNameInternal('USER');
          if (userRole && userRole.id) finalRoleIdToAssign = userRole.id;
        }
      }
    } else {
        console.log(`[ensureUserProfileInDb] Nenhuma roleId específica, usando targetRoleNameInput: ${finalTargetRoleName}.`);
        const roleByName = await getRoleByNameInternal(finalTargetRoleName);
        if(roleByName && roleByName.id) {
            finalRoleIdToAssign = roleByName.id;
            console.log(`[ensureUserProfileInDb] Perfil ${finalTargetRoleName} encontrado por nome. ID: ${finalRoleIdToAssign}`);
        } else {
            console.warn(`[ensureUserProfileInDb] Perfil ${finalTargetRoleName} não encontrado. Tentando 'USER'.`);
            finalTargetRoleName = 'USER'; // Default to USER if targetRoleName isn't found
            const userRole = await getRoleByNameInternal('USER');
             if (userRole && userRole.id) {
                finalRoleIdToAssign = userRole.id;
                console.log(`[ensureUserProfileInDb] Perfil USER encontrado como fallback. ID: ${finalRoleIdToAssign}`);
            } else {
                console.error(`[ensureUserProfileInDb] CRITICAL: Perfil 'USER' não encontrado. Não é possível prosseguir.`);
                return { success: false, message: "Perfil 'USER' padrão não encontrado." };
            }
        }
    }

    if (!finalRoleIdToAssign) {
        console.error(`[ensureUserProfileInDb] CRITICAL: finalRoleIdToAssign não pôde ser determinado para ${email}. finalTargetRoleName era ${finalTargetRoleName}`);
        return { success: false, message: `Não foi possível determinar o perfil para o usuário ${email}.` };
    }

    console.log(`[ensureUserProfileInDb] Chamando db.ensureUserRole para ${email} com RoleName: ${finalTargetRoleName}, RoleID: ${finalRoleIdToAssign}`);
    return db.ensureUserRole(userUid, email || '', fullName, finalTargetRoleName, additionalProfileData, finalRoleIdToAssign);
  } catch (error: any) {
    console.error(`[Action - ensureUserProfileInDb for user ${userUid}] Falha:`, error);
    return { success: false, message: `Erro ao garantir perfil do usuário: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
