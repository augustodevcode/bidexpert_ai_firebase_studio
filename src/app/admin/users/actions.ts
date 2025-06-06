
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase'; 
import admin from 'firebase-admin'; 
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, // Added setDoc for creating user profiles
  deleteDoc as deleteFirestoreDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  limit,
  where
} from 'firebase/firestore'; 
import type { UserProfileData, Role } from '@/types';
import { getRoleByName, ensureDefaultRolesExist } from '@/app/admin/roles/actions';

// Ensure Firebase Admin SDK is initialized (idempotent)
if (admin.apps.length === 0) {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (serviceAccountPath) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized using FIREBASE_ADMIN_SDK_PATH (users/actions).");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       admin.initializeApp();
       console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS (users/actions).");
    } else {
      console.warn("Admin SDK: GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH not set. User management features might be limited or fail.");
    }
  } catch (e: any) {
    if (e.code !== 'app/app-already-exists') {
      console.error("Error initializing Firebase Admin SDK (users/actions):", e.message);
    }
  }
}


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
        const roleDoc = await getRole(data.roleId); // Use getRole from roles/actions
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
        const roleDoc = await getRole(data.roleId); // Use getRole from roles/actions
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
    const updateData: Partial<UserProfileData> = {
      updatedAt: serverTimestamp() as any,
    };

    let roleName: string | undefined = undefined;
    if (newRoleId) {
        const roleDoc = await getRole(newRoleId); // Use getRole from roles/actions
        if (roleDoc) {
            roleName = roleDoc.name;
            updateData.roleId = newRoleId;
            updateData.roleName = roleName;
        } else {
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        updateData.roleId = undefined; 
        updateData.roleName = undefined;
    }

    await updateDoc(userDocRef, updateData);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateUserRole] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar perfil do usuário.' };
  }
}


export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Placeholder: In a real app, you'd delete from Firebase Auth and then Firestore.
    console.warn(`[Server Action - deleteUser] Placeholder: User ${userId} would be deleted. Actual deletion logic not implemented.`);
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário (placeholder) excluído com sucesso!' };
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

  try {
    await ensureDefaultRolesExist(); // Make sure default roles, including targetRoleName, exist
    
    const targetRole = await getRoleByName(targetRoleName);
    if (!targetRole) {
      return { success: false, message: `Perfil "${targetRoleName}" não encontrado no sistema.` };
    }

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfileData;
      if (userData.roleId !== targetRole.id || userData.roleName !== targetRole.name) {
        await updateDoc(userDocRef, {
          roleId: targetRole.id,
          roleName: targetRole.name,
          updatedAt: serverTimestamp(),
        });
        console.log(`[ensureUserRoleInFirestore] Perfil do usuário ${email} atualizado para ${targetRoleName}.`);
        const updatedProfile = await getUserProfileData(userId);
        return { success: true, message: 'Perfil do usuário atualizado.', userProfile: updatedProfile || undefined };
      }
      console.log(`[ensureUserRoleInFirestore] Usuário ${email} já possui o perfil ${targetRoleName}. Nenhuma alteração necessária.`);
      return { success: true, message: 'Perfil do usuário já está correto.', userProfile: userData };
    } else {
      // Usuário existe na Auth mas não no Firestore, criar documento
      const newUserProfile: Partial<UserProfileData> = {
        uid: userId,
        email: email,
        fullName: fullName || email.split('@')[0], // Fallback para nome
        roleId: targetRole.id,
        roleName: targetRole.name,
        status: 'ATIVO', // Ou outro status padrão
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfile);
      console.log(`[ensureUserRoleInFirestore] Perfil de usuário criado para ${email} com o perfil ${targetRoleName}.`);
      const createdProfile = await getUserProfileData(userId);
      return { success: true, message: 'Perfil de usuário criado e perfil atribuído.', userProfile: createdProfile || undefined };
    }
  } catch (error: any) {
    console.error(`[Server Action - ensureUserRoleInFirestore for ${email}] Error:`, error);
    return { success: false, message: `Falha ao configurar perfil para ${targetRoleName}: ${error.message}` };
  }
}
