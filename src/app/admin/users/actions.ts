
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import admin from 'firebase-admin';
import { 
  collection, getDocs, doc, getDoc, 
  query, orderBy, Timestamp as ClientTimestamp, where, limit, FieldValue as ClientFieldValue 
} from 'firebase/firestore'; // Funções do SDK cliente
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName as getRoleByNameClient, ensureDefaultRolesExist, getRole as getRoleClient } from '@/app/admin/roles/actions'; // Renomeado para clareza
import type { UserFormValues } from './user-form-schema';
import { ensureAdminInitialized } from '@/lib/firebase/admin';

const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'augusto.devcode@gmail.com'.toLowerCase();

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
  if (timestampField instanceof admin.firestore.Timestamp) { 
    return timestampField.toDate();
  }
  if (timestampField instanceof ClientTimestamp) { 
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') { 
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`[users/actions] Could not convert timestamp to Date: ${JSON.stringify(timestampField)}. Returning null.`);
  return null;
}

export async function createUser(
  data: UserFormValues
): Promise<{ success: boolean; message: string; userId?: string }> {
  const { dbAdmin: currentDbAdmin, authAdmin: currentAuthAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin || !currentAuthAdmin) {
    const msg = `Erro de configuração: Admin SDK Firestore/Auth não disponível para createUser. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[createUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }
  console.log(`[createUser - Admin SDK] Dados recebidos:`, JSON.stringify(data));
  
  try {
    let existingAuthUser;
    try {
      existingAuthUser = await currentAuthAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; 
      }
    }

    if (existingAuthUser) {
      console.warn(`[createUser - Admin SDK] Usuário com email ${data.email} já existe no Firebase Auth (UID: ${existingAuthUser.uid}). Verificando Firestore...`);
      const existingFirestoreUserDoc = await currentDbAdmin.collection('users').doc(existingAuthUser.uid).get();
      if (existingFirestoreUserDoc.exists) {
        return { success: false, message: `Usuário com email ${data.email} já existe no sistema (Auth e Firestore).` };
      }
      return { success: false, message: `Usuário com email ${data.email} já existe no Firebase Auth, mas não no Firestore. Sincronização manual pode ser necessária.` };
    }
    
    console.log(`[createUser - Admin SDK] Usuário com email ${data.email} não encontrado no Auth. Tentando criar...`);
    const userRecord = await currentAuthAdmin.createUser({
      email: data.email.trim().toLowerCase(),
      emailVerified: false, 
      password: data.password || undefined, 
      displayName: data.fullName.trim(),
      disabled: false,
    });
    console.log(`[createUser - Admin SDK] Usuário criado no Firebase Auth com UID: ${userRecord.uid}`);

    let roleIdToAssign: string | undefined = undefined;
    let roleNameToAssign: string | undefined = 'USER';
    let permissionsToAssign: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
      const roleDoc = await getRoleClient(data.roleId); 
      if (roleDoc) {
        roleIdToAssign = roleDoc.id;
        roleNameToAssign = roleDoc.name;
        permissionsToAssign = roleDoc.permissions || [];
      } else {
        console.warn(`[createUser - Admin SDK] Perfil com ID ${data.roleId} não encontrado. Atribuindo perfil USER padrão.`);
        const userRole = await getRoleByNameClient('USER'); 
        if (userRole) {
          roleIdToAssign = userRole.id;
          roleNameToAssign = userRole.name;
          permissionsToAssign = userRole.permissions || [];
        }
      }
    } else {
      const userRole = await getRoleByNameClient('USER');
      if (userRole) {
        roleIdToAssign = userRole.id;
        roleNameToAssign = userRole.name;
        permissionsToAssign = userRole.permissions || [];
      } else {
        console.warn("[createUser - Admin SDK] Perfil 'USER' padrão não encontrado.");
      }
    }
    console.log(`[createUser - Admin SDK] Perfil a ser atribuído: ID=${roleIdToAssign}, Nome=${roleNameToAssign}`);

    const newUserProfileData: Omit<UserProfileData, 'uid'> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
      uid: userRecord.uid,
      email: userRecord.email!,
      fullName: userRecord.displayName!,
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: 'PENDENTE_DOCUMENTOS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log(`[createUser - Admin SDK] Payload para Firestore para novo usuário ${userRecord.uid}:`, JSON.stringify(newUserProfileData));
    await currentDbAdmin.collection('users').doc(userRecord.uid).set(newUserProfileData);

    console.log(`[createUser - Admin SDK] Perfil para ${data.email} criado no Firestore com UID: ${userRecord.uid}`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso no Auth e Firestore.', userId: userRecord.uid };

  } catch (error: any) {
    console.error(`[createUser - Admin SDK] ERRO ao criar usuário ${data.email}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao criar usuário: ${error.message}` };
  }
}


export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  if (!firestoreClientDB) {
      console.error("[getUsersWithRoles] Firestore (cliente) DB não inicializado. Retornando array vazio.");
      return [];
  }
  console.log("[getUsersWithRoles] Iniciando busca de usuários...");
  try {
    const usersCollection = collection(firestoreClientDB, 'users');
    const q = query(usersCollection, orderBy('fullName', 'asc'));
    const snapshot = await getDocs(q);
    console.log(`[getUsersWithRoles] Encontrados ${snapshot.docs.length} documentos de usuários.`);

    const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let roleName: string | undefined = data.roleName;
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) {
        const roleDoc = await getRoleClient(data.roleId); 
        if (roleDoc) {
          roleName = roleDoc.name;
          if ((!fetchedPermissions || fetchedPermissions.length === 0) && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
          console.warn(`[getUsersWithRoles] Perfil com ID ${data.roleId} não encontrado para usuário ${docSnap.id}`);
        }
      } else if (!data.roleId && (!fetchedPermissions || fetchedPermissions.length === 0)) {
          const defaultUserRole = await getRoleByNameClient('USER');
          if (defaultUserRole) {
            roleName = defaultUserRole.name;
            fetchedPermissions = defaultUserRole.permissions || [];
          }
      }
      return {
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        roleId: data.roleId,
        roleName: roleName || 'Não Definido',
        status: data.status || 'ATIVO',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        permissions: fetchedPermissions,
        createdAt: safeConvertToDate(data.createdAt),
      } as UserProfileData;
    }));
    console.log(`[getUsersWithRoles] Mapeados ${users.length} usuários com perfis e permissões.`);
    return users;
  } catch (error: any) {
    console.error("[getUsersWithRoles] Erro ao buscar usuários:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
   if (!firestoreClientDB) {
    console.error(`[getUserProfileData for UID ${userId}] Firestore (cliente) DB não inicializado. Retornando null.`);
    return null;
  }
  console.log(`[getUserProfileData] Buscando perfil para UID: ${userId}`);
  try {
    const userDocRef = doc(firestoreClientDB, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let roleName: string | undefined = data.roleName;
      let fetchedPermissions: string[] = data.permissions || [];

      if (data.roleId && !roleName) {
        const roleDoc = await getRoleClient(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
          if ((!fetchedPermissions || fetchedPermissions.length === 0) && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
           console.warn(`[getUserProfileData] Perfil com ID ${data.roleId} não encontrada para usuário ${userId}`);
        }
      }
      console.log(`[getUserProfileData] Perfil encontrado para UID: ${userId}, RoleName: ${roleName}`);
      return {
        uid: docSnap.id,
        ...data,
        roleName: roleName || 'Não Definido',
        permissions: fetchedPermissions,
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        dateOfBirth: safeConvertToDate(data.dateOfBirth),
        rgIssueDate: safeConvertToDate(data.rgIssueDate),
      } as UserProfileData;
    }
    console.log(`[getUserProfileData] Nenhum perfil encontrado para UID: ${userId}`);
    return null;
  } catch (error: any) {
    console.error(`[getUserProfileData] ERRO ao buscar perfil para UID ${userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    const msg = `Erro de configuração: Admin SDK Firestore não disponível para updateUserRole. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[updateUserRole for UID ${userId}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserRole - Admin SDK] Tentando atualizar perfil do usuário ${userId} para roleId: ${roleId}`);

  try {
    const userDocRef = currentDbAdmin.collection('users').doc(userId);
    const updateData: { [key: string]: any } = { 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (roleId && roleId !== "---NONE---") {
        console.log(`[updateUserRole - Admin SDK] Tentando definir roleId: ${roleId}`);
        const roleDocSnap = await currentDbAdmin.collection('roles').doc(roleId).get(); 
        if (roleDocSnap.exists) {
            const roleData = roleDocSnap.data() as Role;
            console.log(`[updateUserRole - Admin SDK] Perfil encontrado: ${roleData.name}`);
            updateData.roleId = roleId;
            updateData.roleName = roleData.name;
            updateData.permissions = roleData.permissions || [];
            updateData.role = admin.firestore.FieldValue.delete(); 
        } else {
            console.warn(`[updateUserRole - Admin SDK] Perfil com ID ${roleId} não encontrado.`);
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        console.log(`[updateUserRole - Admin SDK] Removendo roleId, roleName e permissions.`);
        updateData.roleId = admin.firestore.FieldValue.delete();
        updateData.roleName = admin.firestore.FieldValue.delete();
        updateData.permissions = admin.firestore.FieldValue.delete();
        updateData.role = admin.firestore.FieldValue.delete();
    }

    console.log(`[updateUserRole - Admin SDK] Payload para Firestore para usuário ${userId}:`, JSON.stringify(updateData));
    await userDocRef.update(updateData);
    console.log(`[updateUserRole - Admin SDK] Usuário ${userId} atualizado com sucesso.`);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[updateUserRole - Admin SDK] ERRO ao atualizar perfil do usuário:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao atualizar perfil do usuário: ${error.message}` };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, authAdmin: currentAuthAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin || !currentAuthAdmin) {
    const msg = `Erro de Configuração: Admin SDK não inicializado para exclusão de usuário. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  console.log(`[deleteUser - Admin SDK] Tentando excluir usuário: ${userId}`);
  try {
    try {
      await currentAuthAdmin.deleteUser(userId);
      console.log(`[deleteUser - Admin SDK] Usuário ${userId} excluído do Firebase Authentication.`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.warn(`[deleteUser - Admin SDK] Usuário ${userId} não encontrado no Firebase Authentication. Prosseguindo com exclusão do Firestore.`);
      } else {
        throw authError; 
      }
    }

    const userDocRef = currentDbAdmin.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        await userDocRef.delete();
        console.log(`[deleteUser - Admin SDK] Documento do usuário ${userId} excluído do Firestore.`);
    } else {
        console.warn(`[deleteUser - Admin SDK] Documento do usuário ${userId} não encontrado no Firestore, mas pode ter sido removido do Auth (se existia).`);
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'Operação de exclusão de usuário concluída.' };
  } catch (error: any) {
    console.error("[deleteUser - Admin SDK] ERRO ao excluir usuário:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}

export async function ensureUserRoleInFirestore(
  userUid: string, // Renomeado de userId para userUid
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData }> {
  console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Received userUid: ${userUid}`);

  const { dbAdmin: currentDbAdmin, authAdmin: currentAuthAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    const msg = `Erro de config: Admin SDK Firestore não disponível para ensureUserRoleInFirestore. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] ${msg}`);
    return { success: false, message: msg };
  }

  if (!userUid || !email) { // Corrigido para usar userUid
    console.error(`[ensureUserRoleInFirestore - Admin SDK] Chamada inválida: userUid ou email ausentes.`);
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    const rolesEnsured = await ensureDefaultRolesExist();
    if (!rolesEnsured.success) {
      const errorMsg = `Falha crítica ao garantir perfis padrão: ${rolesEnsured.message}`;
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] ${errorMsg}`);
      return { success: false, message: errorMsg };
    }

    const rolesRefAdmin = currentDbAdmin.collection('roles');
    const qRoleAdmin = rolesRefAdmin.where('name_normalized', '==', targetRoleName.toUpperCase()).limit(1);
    const targetRoleSnapAdmin = await qRoleAdmin.get();

    let targetRole: Role | null = null;
    if (!targetRoleSnapAdmin.empty) {
      const roleDoc = targetRoleSnapAdmin.docs[0];
        targetRole = { id: roleDoc.id, ...roleDoc.data() } as Role;
    }
    
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado usando Admin SDK.`);
      const userRoleSnapAdmin = await rolesRefAdmin.where('name_normalized', '==', 'USER').limit(1).get();
      if (!userRoleSnapAdmin.empty) {
        const userRoleDoc = userRoleSnapAdmin.docs[0];
        targetRole = { id: userRoleDoc.id, ...userRoleDoc.data() } as Role;
        console.warn(`[ensureUserRoleInFirestore - Admin SDK for ${email}] Perfil "${targetRoleName}" não encontrado, usando USER como fallback.`);
      } else {
        console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}] Perfil "USER" padrão também não encontrado. Não é possível atribuir perfil.`);
        return { success: false, message: `Perfil "${targetRoleName}" ou "USER" não pôde ser encontrado.` };
      }
    }

    const userDocRef = currentDbAdmin.collection('users').doc(userUid); 
    const userSnap = await userDocRef.get();

    let finalProfileData: UserProfileData | undefined = undefined;
    
    if (userSnap.exists) {
      const userDataFromDB = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário encontrado. RoleId: ${userDataFromDB.roleId}, RoleName: ${userDataFromDB.roleName}`);
      
      const updatePayload: { [key:string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      let needsUpdate = false;

      if (userDataFromDB.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        needsUpdate = true;
      }
      if (userDataFromDB.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        needsUpdate = true;
      }
      
      const currentPermissionsSorted = [...(userDataFromDB.permissions || [])].sort();
      const targetPermissionsSorted = [...(targetRole.permissions || [])].sort();
      if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(targetPermissionsSorted)) {
        updatePayload.permissions = targetRole.permissions || [];
        needsUpdate = true;
      }

      if (targetRoleName === 'ADMINISTRATOR' && userDataFromDB.habilitationStatus !== 'HABILITADO') {
        updatePayload.habilitationStatus = 'HABILITADO';
        needsUpdate = true;
      }
       if (userDataFromDB.email !== email) {
        updatePayload.email = email;
        needsUpdate = true;
      }
      if (fullName && fullName !== userDataFromDB.fullName) {
        updatePayload.fullName = fullName;
        needsUpdate = true;
      }

      if (userDataFromDB.hasOwnProperty('role')) {
          updatePayload.role = admin.firestore.FieldValue.delete();
          needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Atualizando perfil do usuário... Payload:`, JSON.stringify(updatePayload));
        await userDocRef.update(updatePayload);
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil do usuário atualizado.`);
      }
      const updatedSnap = await userDocRef.get(); 
      const updatedData = updatedSnap.data();
        finalProfileData = { 
          uid: updatedSnap.id, ...updatedData,
          createdAt: safeConvertToDate(updatedData?.createdAt),
          updatedAt: safeConvertToDate(updatedData?.updatedAt),
          dateOfBirth: safeConvertToDate(updatedData?.dateOfBirth),
          rgIssueDate: safeConvertToDate(updatedData?.rgIssueDate),
      } as UserProfileData;

    } else {
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário não encontrado. Criando...`);
      const newUserProfileForFirestore: Omit<UserProfileData, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
        uid: userUid,
        email: email!,
        fullName: fullName || email!.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
        permissions: targetRole.permissions || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userDocRef.set(newUserProfileForFirestore);
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil de usuário criado.`);
      const createdSnap = await userDocRef.get();
      const createdData = createdSnap.data();
        finalProfileData = { 
          uid: createdSnap.id, ...createdData,
          createdAt: safeConvertToDate(createdData?.createdAt),
          updatedAt: safeConvertToDate(createdData?.updatedAt),
        } as UserProfileData;
    }
    return { success: true, message: 'Perfil do usuário verificado/atualizado.', userProfile: finalProfileData };

  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'>;
