
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; 
import admin from 'firebase-admin'; 
import { 
  collection, getDocs, doc, getDoc, 
  serverTimestamp as clientServerTimestamp, // Alias for client SDK
  query, orderBy, Timestamp as ClientTimestamp, where, limit, FieldValue as ClientFieldValue, 
  setDoc as clientSetDoc, updateDoc as clientUpdateDoc, deleteDoc as clientDeleteDoc
} from 'firebase/firestore';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';
import type { UserFormValues } from './user-form-schema';

let dbAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;
let adminInitialized = false;

function initializeAdminSDK() {
  if (adminInitialized && dbAdmin && authAdmin) {
    return;
  }
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp();
      adminInitialized = true;
    } catch (error: any) {
      const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
      if (serviceAccountPath) {
        try {
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          adminInitialized = true;
        } catch (e: any) {
          console.error("[users/actions] Falha ao init Admin SDK com path:", (e as Error).message);
        }
      } else if (error.code !== 'app/app-already-exists') {
         console.error("[users/actions] Falha ao init Admin SDK (default):", error);
      } else {
         adminInitialized = true; 
      }
    }
  } else {
    adminInitialized = true;
  }
  if (adminInitialized) {
    try {
        dbAdmin = admin.firestore();
        authAdmin = admin.auth();
    } catch (e: any) {
        console.error("[users/actions] Falha ao obter Firestore/Auth Admin DB instance:", e.message);
        adminInitialized = false;
    }
  }
  if (!adminInitialized || !dbAdmin || !authAdmin) {
    console.error("[users/actions] ALERTA: Firebase Admin SDK, Firestore Admin DB ou Auth Admin não pôde ser inicializado.");
  }
}
initializeAdminSDK();

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    // This handles both client and admin Timestamp-like objects
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
  if (!adminInitialized || !dbAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para createUser.';
    console.error(`[createUser] ${msg}`);
    return { success: false, message: msg };
  }

  if (!data.email || data.email.trim() === '') {
    return { success: false, message: 'O email do usuário é obrigatório.' };
  }
  if (!data.fullName || data.fullName.trim() === '') {
    return { success: false, message: 'O nome completo do usuário é obrigatório.' };
  }

  console.log(`[createUser - Admin SDK] Tentando criar perfil no Firestore para: ${data.email}. Dados recebidos:`, JSON.stringify(data));
  
  try {
    const usersRef = dbAdmin.collection('users');
    const q = usersRef.where('email', '==', data.email.trim().toLowerCase()).limit(1);
    const existingUserSnap = await q.get();
    if (!existingUserSnap.empty) {
      console.warn(`[createUser - Admin SDK] Usuário com email ${data.email} já existe no Firestore.`);
      return { success: false, message: `Usuário com email ${data.email} já existe.` };
    }

    let roleIdToAssign: string | undefined = undefined;
    let roleNameToAssign: string | undefined = 'USER';
    let permissionsToAssign: string[] = [];

    if (data.roleId && data.roleId !== "---NONE---") {
      const roleDoc = await getRole(data.roleId); // getRole uses client SDK, which is fine for reads
      if (roleDoc) {
        roleIdToAssign = roleDoc.id;
        roleNameToAssign = roleDoc.name;
        permissionsToAssign = roleDoc.permissions || [];
      } else {
        console.warn(`[createUser - Admin SDK] Perfil com ID ${data.roleId} não encontrado. Atribuindo perfil USER padrão.`);
        const userRole = await getRoleByName('USER'); // getRoleByName uses client SDK
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

    // Simulando a criação de um UID aqui, já que não estamos criando no Auth SDK via admin.
    // Em um cenário real onde o admin cria o usuário no Auth primeiro, usaríamos userRecord.uid.
    const newUserId = `firestore_user_${Date.now()}`; 

    const newUserProfileData: Omit<UserProfileData, 'uid'> & { uid: string, createdAt: admin.firestore.FieldValue, updatedAt: admin.firestore.FieldValue } = {
      uid: newUserId,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      roleId: roleIdToAssign,
      roleName: roleNameToAssign,
      permissions: permissionsToAssign,
      status: 'ATIVO',
      habilitationStatus: 'PENDENTE_DOCUMENTOS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log(`[createUser - Admin SDK] Payload para Firestore para novo usuário ${newUserId}:`, JSON.stringify(newUserProfileData));
    await usersRef.doc(newUserId).set(newUserProfileData);

    console.log(`[createUser - Admin SDK] Perfil para ${data.email} criado no Firestore com ID: ${newUserId}`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Perfil de usuário criado no Firestore com sucesso.', userId: newUserId };

  } catch (error: any) {
    console.error(`[createUser - Admin SDK] ERRO ao criar perfil para ${data.email} no Firestore:`, error);
    return { success: false, message: `Falha ao criar perfil de usuário no Firestore: ${error.message}` };
  }
}

// getUsersWithRoles and getUserProfileData can remain using firestoreClientDB as they are read operations
// and should be subject to Firestore rules if an admin is viewing them, or user their own.
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
        console.log(`[getUsersWithRoles] Usuário ${docSnap.id} tem roleId ${data.roleId}, buscando nome do perfil...`);
        const roleDoc = await getRole(data.roleId); // getRole uses client SDK for reads
        if (roleDoc) {
          roleName = roleDoc.name;
          if (fetchedPermissions.length === 0 && roleDoc.permissions && roleDoc.permissions.length > 0) {
            fetchedPermissions = roleDoc.permissions;
          }
        } else {
          console.warn(`[getUsersWithRoles] Perfil com ID ${data.roleId} não encontrado para usuário ${docSnap.id}`);
        }
      } else if (!data.roleId && fetchedPermissions.length === 0) {
        console.log(`[getUsersWithRoles] Usuário ${docSnap.id} sem roleId e sem permissões. Atribuindo perfil USER padrão...`);
        const defaultUserRole = await getRoleByName('USER'); // getRoleByName uses client SDK
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
    console.error("[getUsersWithRoles] Erro ao buscar usuários:", error.message, error.code);
    if (error.details) {
        console.error("[getUsersWithRoles] Detalhes do erro:", error.details);
    }
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
        const roleDoc = await getRole(data.roleId); // uses client SDK for read
        if (roleDoc) {
          roleName = roleDoc.name;
          if (fetchedPermissions.length === 0 && roleDoc.permissions) {
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
    console.error(`[getUserProfileData] ERRO ao buscar perfil para UID ${userId}:`, error.message, error.code);
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  if (!adminInitialized || !dbAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para updateUserRole.';
    console.error(`[updateUserRole for UID ${userId}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserRole - Admin SDK] Tentando atualizar perfil do usuário ${userId} para roleId: ${roleId}`);

  try {
    const userDocRef = dbAdmin.collection('users').doc(userId); // Use dbAdmin
    const updateData: { roleId?: string | admin.firestore.FieldValue; roleName?: string | admin.firestore.FieldValue; permissions?: string[] | admin.firestore.FieldValue; updatedAt: admin.firestore.FieldValue, role?: admin.firestore.FieldValue } = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use Admin SDK FieldValue
    };

    if (roleId) {
        console.log(`[updateUserRole - Admin SDK] Tentando definir roleId: ${roleId}`);
        const roleDoc = await getRole(roleId); // getRole uses client SDK, fine for reads
        if (roleDoc) {
            console.log(`[updateUserRole - Admin SDK] Perfil encontrado: ${roleDoc.name}`);
            updateData.roleId = roleId;
            updateData.roleName = roleDoc.name;
            updateData.permissions = roleDoc.permissions || [];
        } else {
            console.warn(`[updateUserRole - Admin SDK] Perfil com ID ${roleId} não encontrado.`);
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        console.log(`[updateUserRole - Admin SDK] Removendo roleId, roleName e permissions.`);
        updateData.roleId = admin.firestore.FieldValue.delete();
        updateData.roleName = admin.firestore.FieldValue.delete();
        updateData.permissions = admin.firestore.FieldValue.delete();
        updateData.role = admin.firestore.FieldValue.delete(); // Remove legacy field if it exists
    }

    console.log(`[updateUserRole - Admin SDK] Payload para Firestore para usuário ${userId}:`, JSON.stringify(updateData));
    await userDocRef.update(updateData);
    console.log(`[updateUserRole - Admin SDK] Usuário ${userId} atualizado com sucesso.`);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[updateUserRole - Admin SDK] ERRO ao atualizar perfil do usuário:", error);
    return { success: false, message: `Falha ao atualizar perfil do usuário: ${error.message}` };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (!adminInitialized || !dbAdmin || !authAdmin) {
    const msg = 'Erro de Configuração: Admin SDK não inicializado para exclusão de usuário.';
    console.error(`[deleteUser] ${msg}`);
    return { success: false, message: msg };
  }
  console.log(`[deleteUser - Admin SDK] Tentando excluir usuário: ${userId}`);
  try {
    await authAdmin.deleteUser(userId);
    console.log(`[deleteUser - Admin SDK] Usuário ${userId} excluído do Firebase Authentication.`);

    const userDocRef = dbAdmin.collection('users').doc(userId);
    await userDocRef.delete();
    console.log(`[deleteUser - Admin SDK] Documento do usuário ${userId} excluído do Firestore.`);

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído com sucesso do Auth e Firestore!' };
  } catch (error: any) {
    console.error("[deleteUser - Admin SDK] ERRO ao excluir usuário:", error);
    let clientMessage = 'Falha ao excluir usuário.';
    if (error.code === 'auth/user-not-found') {
        clientMessage = "Usuário não encontrado no Firebase Authentication. Verificando Firestore...";
        try {
            const userDocRef = dbAdmin.collection('users').doc(userId);
            const docSnap = await userDocRef.get();
            if (docSnap.exists()) {
                await userDocRef.delete();
                revalidatePath('/admin/users');
                return { success: true, message: "Usuário não encontrado no Auth, mas removido do Firestore." };
            } else {
                return { success: false, message: "Usuário não encontrado no Auth nem no Firestore." };
            }
        } catch (fsError: any) {
            console.error("[deleteUser - Admin SDK] ERRO ao excluir do Firestore após falha no Auth:", fsError);
            return { success: false, message: `Falha ao excluir do Firestore: ${fsError.message}` };
        }
    } else if (error.message) {
        clientMessage = error.message;
    }
    return { success: false, message: clientMessage };
  }
}

export async function ensureUserRoleInFirestore(
  userId: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData}> {
  if (!adminInitialized || !dbAdmin ) { // Check dbAdmin specifically for writes
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para ensureUserRoleInFirestore.';
    console.error(`[ensureUserRoleInFirestore for ${email}] ${msg}`);
    return { success: false, message: msg };
  }
  if (!userId || !email) {
    console.error(`[ensureUserRoleInFirestore] Chamada inválida: userId ou email ausentes.`);
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    const rolesEnsured = await ensureDefaultRolesExist(); // ensureDefaultRolesExist uses dbAdmin for writes
    if (!rolesEnsured.success) {
      const errorMsg = `Falha crítica ao garantir perfis padrão: ${rolesEnsured.message}`;
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] ${errorMsg}`);
      return { success: false, message: errorMsg };
    }

    const targetRole = await getRoleByName(targetRoleName); // getRoleByName uses client SDK for reads
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }

    const userDocRef = dbAdmin.collection('users').doc(userId); // Use dbAdmin
    const userSnap = await userDocRef.get();

    if (userSnap.exists()) {
      const userDataFromDB = userSnap.data() as UserProfileData; // Cast, assuming data structure
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário encontrado. RoleId: ${userDataFromDB.roleId}, RoleName: ${userDataFromDB.roleName}`);
      
      const updatePayload: { [key: string]: any } = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      let needsUpdate = false;

      if (userDataFromDB.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        needsUpdate = true;
      }
      if (userDataFromDB.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        needsUpdate = true;
      }
      const currentPermissionsSorted = (userDataFromDB.permissions || []).sort();
      const targetPermissionsSorted = (targetRole.permissions || []).sort();
      if (JSON.stringify(currentPermissionsSorted) !== JSON.stringify(targetPermissionsSorted)) {
        updatePayload.permissions = targetRole.permissions || [];
        needsUpdate = true;
      }
      if (userDataFromDB.hasOwnProperty('role')) { // Check if legacy 'role' field exists
          updatePayload.role = admin.firestore.FieldValue.delete();
          needsUpdate = true;
      }


      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Atualizando perfil do usuário... Payload:`, JSON.stringify(updatePayload));
        await userDocRef.update(updatePayload);
        console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Perfil do usuário atualizado.`);
      }
      
      const finalProfileData = await getUserProfileData(userId); // Fetch updated profile using client SDK for consistency in return type
      return { success: true, message: 'Perfil do usuário verificado/atualizado.', userProfile: finalProfileData || undefined };
    } else {
      console.log(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Documento do usuário não encontrado. Criando...`);
      const newUserProfileForFirestore = {
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
      const createdProfile = await getUserProfileData(userId); // Fetch created profile
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore - Admin SDK for ${email}, role ${targetRoleName}] Error:`, error);
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}

export type UserFormData = Omit<UserFormValues, 'password'>;
