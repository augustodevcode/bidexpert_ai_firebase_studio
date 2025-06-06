
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc as deleteFirestoreDoc, 
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  where,
  limit
} from 'firebase/firestore';
import type { UserProfileData, Role, UserHabilitationStatus } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';

function safeConvertToDate(timestampField: any): Date | null {
  if (!timestampField) return null;
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

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('fullName', 'asc'));
    const snapshot = await getDocs(q);

    const users = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let roleName: string | undefined = undefined;
      if (data.roleId) {
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
        }
      }
      return {
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        roleId: data.roleId,
        roleName: roleName || 'N/A',
        status: data.status || 'ATIVO',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
      } as UserProfileData;
    }));
    return users;
  } catch (error: any) {
    console.error("[Server Action - getUsersWithRoles] Error:", error);
    return [];
  }
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let roleName: string | undefined = undefined;
      if (data.roleId) {
        const roleDoc = await getRole(data.roleId);
        if (roleDoc) {
          roleName = roleDoc.name;
        }
      }
      return {
        uid: docSnap.id,
        ...data,
        roleName: roleName || 'N/A',
        habilitationStatus: data.habilitationStatus || 'PENDENTE_DOCUMENTOS',
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        dateOfBirth: safeConvertToDate(data.dateOfBirth),
        rgIssueDate: safeConvertToDate(data.rgIssueDate),
      } as UserProfileData;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getUserProfileData] Error:", error);
    return null;
  }
}


export async function updateUserProfileAndRole(
  userId: string,
  data: { roleId?: string | null; habilitationStatus?: UserHabilitationStatus | null }
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }
  console.log(`[updateUserProfileAndRole] Attempting to update user ${userId} with data:`, data);

  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: { roleId?: string | null; roleName?: string | null; habilitationStatus?: UserHabilitationStatus | null; updatedAt: any } = {
      updatedAt: serverTimestamp(),
    };

    if (data.hasOwnProperty('roleId')) {
      if (data.roleId) {
          console.log(`[updateUserProfileAndRole] Trying to set roleId: ${data.roleId}`);
          const roleDoc = await getRole(data.roleId);
          if (roleDoc) {
              console.log(`[updateUserProfileAndRole] Role found: ${roleDoc.name}`);
              updateData.roleId = data.roleId;
              updateData.roleName = roleDoc.name;
          } else {
              console.warn(`[updateUserProfileAndRole] Role with ID ${data.roleId} not found.`);
              return { success: false, message: 'Perfil (Role) não encontrado.'};
          }
      } else { 
          console.log(`[updateUserProfileAndRole] Setting roleId and roleName to null`);
          updateData.roleId = null;
          updateData.roleName = null;
      }
    }

    if (data.hasOwnProperty('habilitationStatus')) {
        console.log(`[updateUserProfileAndRole] Setting habilitationStatus to: ${data.habilitationStatus}`);
        updateData.habilitationStatus = data.habilitationStatus || null;
    }


    await updateDoc(userDocRef, updateData);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Usuário atualizado com sucesso!' };
  } catch (error: any)    {
    console.error("[Server Action - updateUserProfileAndRole] Error:", error.message, error.code, error.details);
    return { success: false, message: `Falha ao atualizar usuário: ${error.message}` };
  }
}


export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteFirestoreDoc(userDocRef); 
    console.log(`[Server Action - deleteUser] User ${userId} deleted from Firestore.`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído do Firestore com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteUser] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir usuário.' };
  }
}

export async function ensureUserRoleInFirestore(
  userId: string,
  email: string | null,
  fullName: string | null,
  targetRoleName: string
): Promise<{ success: boolean; message: string; userProfile?: UserProfileData}> {
  if (!userId || !email) {
    return { success: false, message: 'UID do usuário e email são obrigatórios.' };
  }
  console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Iniciando...`);

  try {
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1: Garantindo perfis padrão...`);
    const rolesEnsured = await ensureDefaultRolesExist(); 
    if (!rolesEnsured.success && targetRoleName === 'ADMINISTRATOR') {
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Falha crítica ao garantir perfis padrão: ${rolesEnsured.message}`);
      return { success: false, message: `Falha ao criar perfis padrão necessários: ${rolesEnsured.message}` };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 1.1: Perfis padrão verificados/criados. Success: ${rolesEnsured.success}`);

    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2: Buscando o perfil "${targetRoleName}"...`);
    const targetRole = await getRoleByName(targetRoleName);
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil "${targetRoleName}" NÃO encontrado.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 2.1: Perfil "${targetRoleName}" encontrado com ID: ${targetRole.id}`);

    const userDocRef = doc(db, 'users', userId);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3: Buscando documento do usuário ${userId}...`);
    const userSnap = await getDoc(userDocRef);
    console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] UserSnap exists: ${userSnap.exists()}`);


    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário encontrado. RoleId atual: ${userData.roleId}, RoleName: ${userData.roleName}, Habilitation: ${userData.habilitationStatus}`);
      
      let needsUpdate = false;
      const updatePayload: Partial<UserProfileData> = { updatedAt: serverTimestamp() as Timestamp };

      if (userData.roleId !== targetRole.id) {
        updatePayload.roleId = targetRole.id;
        needsUpdate = true;
      }
      if (userData.roleName !== targetRole.name) {
        updatePayload.roleName = targetRole.name;
        needsUpdate = true;
      }
      if (targetRoleName === 'ADMINISTRATOR' && userData.habilitationStatus !== 'HABILITADO') {
        updatePayload.habilitationStatus = 'HABILITADO';
        needsUpdate = true;
      }
      // Garante que o campo 'role' legado seja removido se existir
      if (userData.hasOwnProperty('role')) {
        (updatePayload as any).role = FieldValue.delete(); // Ensure FieldValue is imported from firebase-admin/firestore
        needsUpdate = true;
      }


      if (needsUpdate) {
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4: Atualizando perfil/habilitação do usuário... Payload:`, updatePayload);
        await updateDoc(userDocRef, updatePayload);
        console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 4.1: Perfil/habilitação do usuário atualizado.`);
        const updatedProfile = await getUserProfileData(userId); 
        return { success: true, message: 'Perfil do usuário atualizado.', userProfile: updatedProfile || undefined };
      }
      
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Usuário já possui o perfil correto e está habilitado (se admin). Nenhuma alteração necessária.`);
      return { success: true, message: 'Perfil do usuário já está correto.', userProfile: userData };
    } else {
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Passo 3.1: Documento do usuário não encontrado. Criando...`);
      const newUserProfile: UserProfileData = {
        uid: userId,
        email: email!,
        fullName: fullName || email!.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        habilitationStatus: targetRoleName === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        permissions: targetRole.permissions || [],
      };
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Tentando criar documento do usuário com dados:`, newUserProfile);
      await setDoc(userDocRef, newUserProfile);
      console.log(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Perfil de usuário criado.`);
      const createdProfile = await getUserProfileData(userId);
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Error:`, error.message, error.code, error.details ? JSON.stringify(error.details) : '');
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
  // Adicionando um retorno padrão para cobrir todos os caminhos, embora não deva ser alcançado idealmente.
  console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Atingiu o final da função sem um return explícito no try. Isso não deveria acontecer.`);
  return { success: false, message: `Erro inesperado no setup do perfil para ${targetRoleName}.` };
}

    