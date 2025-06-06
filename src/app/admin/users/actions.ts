
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
  deleteDoc as deleteFirestoreDoc, // Renomeado para evitar conflito com a action deleteUser
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  where,
  limit
} from 'firebase/firestore';
import type { UserProfileData, Role } from '@/types';
import { getRoleByName, ensureDefaultRolesExist, getRole } from '@/app/admin/roles/actions';

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
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
        status: data.status || 'Ativo',
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


export async function updateUserRole(
  userId: string,
  newRoleId: string | null
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'ID do usuário é obrigatório.' };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const updateData: { roleId?: string | null, roleName?: string | null, updatedAt: any } = {
      updatedAt: serverTimestamp(),
    };

    if (newRoleId) {
        const roleDoc = await getRole(newRoleId);
        if (roleDoc) {
            updateData.roleId = newRoleId;
            updateData.roleName = roleDoc.name;
        } else {
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        updateData.roleId = null;
        updateData.roleName = null;
    }

    await updateDoc(userDocRef, updateData);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateUserRole] Error:", error);
    return { success: false, message: `Falha ao atualizar perfil: ${error.message}` };
  }
}


export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Placeholder: In a real app, you'd delete from Firebase Auth first.
    // For now, we only delete from Firestore.
    const userDocRef = doc(db, 'users', userId);
    await deleteFirestoreDoc(userDocRef); // Use renamed import
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
  console.log(`[ensureUserRoleInFirestore] Iniciando para ${email}, alvo: ${targetRoleName}`);

  try {
    console.log(`[ensureUserRoleInFirestore] Passo 1: Garantindo que perfis padrão existam...`);
    await ensureDefaultRolesExist(); // This might throw if it fails to create roles
    console.log(`[ensureUserRoleInFirestore] Passo 1.1: Perfis padrão verificados/criados.`);

    console.log(`[ensureUserRoleInFirestore] Passo 2: Buscando o perfil "${targetRoleName}"...`);
    const targetRole = await getRoleByName(targetRoleName);
    if (!targetRole) {
      console.error(`[ensureUserRoleInFirestore] Perfil "${targetRoleName}" não encontrado após ensureDefaultRolesExist.`);
      return { success: false, message: `Perfil "${targetRoleName}" não pôde ser encontrado ou criado.` };
    }
    console.log(`[ensureUserRoleInFirestore] Passo 2.1: Perfil "${targetRoleName}" encontrado com ID: ${targetRole.id}`);

    const userDocRef = doc(db, 'users', userId);
    console.log(`[ensureUserRoleInFirestore] Passo 3: Buscando documento do usuário ${userId}...`);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileData;
      console.log(`[ensureUserRoleInFirestore] Passo 3.1: Documento do usuário encontrado. Perfil atual: ${userData.roleId} (${userData.roleName})`);
      if (userData.roleId !== targetRole.id || userData.roleName !== targetRole.name) {
        console.log(`[ensureUserRoleInFirestore] Passo 4: Atualizando perfil do usuário ${email} para ${targetRoleName}...`);
        await updateDoc(userDocRef, {
          roleId: targetRole.id,
          roleName: targetRole.name,
          updatedAt: serverTimestamp(),
        });
        console.log(`[ensureUserRoleInFirestore] Passo 4.1: Perfil do usuário ${email} atualizado para ${targetRoleName}.`);
        const updatedProfile = await getUserProfileData(userId); // Re-fetch to confirm
        return { success: true, message: 'Perfil do usuário atualizado.', userProfile: updatedProfile || undefined };
      }
      console.log(`[ensureUserRoleInFirestore] Usuário ${email} já possui o perfil ${targetRoleName}. Nenhuma alteração necessária.`);
      return { success: true, message: 'Perfil do usuário já está correto.', userProfile: userData };
    } else {
      console.log(`[ensureUserRoleInFirestore] Passo 3.1: Documento do usuário ${userId} não encontrado. Criando...`);
      const newUserProfile: Partial<UserProfileData> = {
        uid: userId,
        email: email,
        fullName: fullName || email.split('@')[0],
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfile);
      console.log(`[ensureUserRoleInFirestore] Perfil de usuário criado para ${email} com o perfil ${targetRoleName}.`);
      const createdProfile = await getUserProfileData(userId);
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[ensureUserRoleInFirestore for ${email}, role ${targetRoleName}] Error:`, error);
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}
