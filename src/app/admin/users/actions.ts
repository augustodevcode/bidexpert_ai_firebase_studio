
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import admin from 'firebase-admin';
import { dbAdmin as adminFirestore, authAdmin as adminAuth, ensureAdminInitialized } from '@/lib/firebase/admin'; // SDK Admin para escritas e auth
import { 
  collection, getDocs, doc, getDoc, 
  query, orderBy, Timestamp as ClientTimestamp, where, limit, FieldValue as ClientFieldValue 
} from 'firebase/firestore'; // Funções do SDK cliente
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';
import type { UserFormValues } from './user-form-schema';

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
  const { dbAdmin, authAdmin } = await ensureAdminInitialized();
  if (!dbAdmin || !authAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore/Auth não disponível para createUser.';
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
      existingAuthUser = await authAdmin.getUserByEmail(data.email.trim().toLowerCase());
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; 
      }
    }

    if (existingAuthUser) {
      console.warn(`[createUser - Admin SDK] Usuário com email ${data.email} já existe no Firebase Auth (UID: ${existingAuthUser.uid}). Verificando Firestore...`);
      const existingFirestoreUserDoc = await dbAdmin.collection('users').doc(existingAuthUser.uid).get();
      if (existingFirestoreUserDoc.exists) {
        return { success: false, message: `Usuário com email ${data.email} já existe no sistema (Auth e Firestore).` };
      }
      return { success: false, message: `Usuário com email ${data.email} já existe no Firebase Auth, mas não no Firestore. Sincronização manual pode ser necessária.` };
    }
    
    console.log(`[createUser - Admin SDK] Usuário com email ${data.email} não encontrado no Auth. Tentando criar...`);
    const userRecord = await authAdmin.createUser({
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
      const roleDoc = await getRole(data.roleId); 
      if (roleDoc) {
        roleIdToAssign = roleDoc.id;
        roleNameToAssign = roleDoc.name;
        permissionsToAssign = roleDoc.permissions || [];
      } else {
        console.warn(`[createUser - Admin SDK] Perfil com ID ${data.roleId} não encontrado. Atribuindo perfil USER padrão.`);
        const userRole = await getRoleByName('USER'); 
        if (userRole) {
          roleIdToAssign = userRole.id;
          roleNameToAssign = userRole.name;
          permissionsToAssign = userRole.permissions || [];
        }
      }
    } else {
      const userRole = await getRoleByName('USER');
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
    await dbAdmin.collection('users').doc(userRecord.uid).set(newUserProfileData);

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
        const roleDoc = await getRole(data.roleId); 
        if (roleDoc) {
          roleName = roleDoc.name;
          if ((!fetchedPermissions || fetchedPermissions.length === 0) && roleDoc.permissions) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
          console.warn(`[getUsersWithRoles] Perfil com ID ${data.roleId} não encontrado para usuário ${docSnap.id}`);
        }
      } else if (!data.roleId && (!fetchedPermissions || fetchedPermissions.length === 0)) {
          const defaultUserRole = await getRoleByName('USER');
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
        const roleDoc = await getRole(data.roleId);
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
  const { dbAdmin } = await ensureAdminInitialized();
  if (!dbAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para updateUserRole.';
    console.error(`[updateUserRole for UID ${userId}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserRole - Admin SDK] Tentando atualizar perfil do usuário ${userId} para roleId: ${roleId}`);

  try {
    const userDocRef = dbAdmin.collection('users').doc(userId);
    const updateData: { [key: string]: any } = { 
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (roleId && roleId !== "---NONE---") {
        console.log(`[updateUserRole - Admin SDK] Tentando definir roleId: ${roleId}`);
        const roleDoc = await getRole(roleId); 
        if (roleDoc) {
            console.log(`[updateUserRole - Admin SDK] Perfil encontrado: ${roleDoc.name}`);
            updateData.roleId = roleId;
            updateData.roleName = roleDoc.name;
            updateData.permissions = roleDoc.permissions || [];
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
  const { dbAdmin, authAdmin } = await ensureAdminInitialized();
  if (!dbAdmin || !authAdmin) {
    const msg = 'Erro de Configuração: Admin SDK não inicializado para exclusão de usuário.';
    console.error(`[deleteUser - Admin SDK] ${msg}`);
    return { success: false, message: msg };
  }
  console.log(`[deleteUser - Admin SDK] Tentando excluir usuário: ${userId}`);
  try {
    try {
      await authAdmin.deleteUser(userId);
      console.log(`[deleteUser - Admin SDK] Usuário ${userId} excluído do Firebase Authentication.`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.warn(`[deleteUser - Admin SDK] Usuário ${userId} não encontrado no Firebase Authentication. Prosseguindo com exclusão do Firestore.`);
      } else {
        throw authError; 
      }
    }

    const userDocRef = dbAdmin.collection('users').doc(userId);
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
  userId: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData}> {
  if (email && email.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS) {
    console.warn(`[ensureUserRoleInFirestore - Admin SDK] BYPASS para ${email}. Retornando sucesso sem modificar Firestore.`);
    try {
      const userDocRefClient = doc(firestoreClientDB, 'users', userId); // Leitura com SDK cliente
      const userSnapClient = await getDoc(userDocRefClient);
      if (userSnapClient.exists()) {
          const userDataFromDB = userSnapClient.data() as UserProfileData;
          return { 
              success: true, 
              message: 'Usuário admin de desenvolvimento ignorado na configuração de role (BYPASS).', 
              userProfile: { 
                  ...userDataFromDB, 
                  uid: userId,
                  email: email,
                  createdAt: safeConvertToDate(userDataFromDB.createdAt),
                  updatedAt: safeConvertToDate(userDataFromDB.updatedAt),
                  dateOfBirth: safeConvertToDate(userDataFromDB.dateOfBirth),
                  rgIssueDate: safeConvertToDate(userDataFromDB.rgIssueDate),
                }
          };
      } else {
           return { success: true, message: `Usuário admin de desenvolvimento ignorado (perfil não encontrado no Firestore, mas bypass ativo).`, userProfile: undefined};
      }
    } catch (clientError: any) {
        console.error(`[ensureUserRoleInFirestore - Admin SDK] Erro ao buscar perfil (client SDK) para bypass de ${email}:`, JSON.stringify(clientError, Object.getOwnPropertyNames(clientError)));
        return { success: true, message: `Usuário admin de desenvolvimento ignorado (erro ao buscar perfil no Firestore, mas bypass ativo).`, userProfile: undefined};
    }
  }

  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized(); // Renomeado para evitar conflito de nome
  if (!currentDbAdmin) { // Usar currentDbAdmin
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para ensureUserRoleInFirestore.';
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId || !email) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK] Chamada inválida: userId ou email ausentes.`);
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

    const targetRole = await getRoleByName(targetRoleName); 
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }

    const userDocRef = currentDbAdmin.collection('users').doc(userId); 
    const userSnap = await userDocRef.get();

    if (userSnap.exists()) {
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

      if (userDataFromDB.hasOwnProperty('role')) {
          updatePayload.role = admin.firestore.FieldValue.delete();
          needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Atualizando perfil do usuário... Payload:`, JSON.stringify(updatePayload));
        await userDocRef.update(updatePayload);
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil do usuário atualizado.`);
      }
      
      const finalProfileData = await getUserProfileData(userId); 
      return { success: true, message: 'Perfil do usuário verificado/atualizado.', userProfile: finalProfileData || undefined };
    } else {
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário não encontrado. Criando...`);
      const newUserProfileForFirestore: Partial<UserProfileData> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
        uid: userId,
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
      const createdProfile = await getUserProfileData(userId); 
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'>;

