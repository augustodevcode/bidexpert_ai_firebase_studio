
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase'; // Assumes db is exported from your firebase setup
import admin from 'firebase-admin'; // For user management via Admin SDK
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc as deleteFirestoreDoc, // Alias to avoid conflict with admin.auth().deleteUser
  serverTimestamp, 
  query, 
  orderBy,
  limit,
  where
} from 'firebase/firestore'; // Using client SDK for Firestore queries
import type { UserProfileData, Role } from '@/types';

// Ensure Firebase Admin SDK is initialized (idempotent)
if (admin.apps.length === 0) {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (serviceAccountPath) {
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
        const roleDocRef = doc(db, 'roles', data.roleId);
        const roleSnap = await getDoc(roleDocRef);
        if (roleSnap.exists()) {
          roleName = (roleSnap.data() as Role).name;
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
        // Add other fields as needed
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
        const roleDocRef = doc(db, 'roles', data.roleId);
        const roleSnap = await getDoc(roleDocRef);
        if (roleSnap.exists()) {
          roleName = (roleSnap.data() as Role).name;
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
  newRoleId: string | null // null to remove role
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
        const roleDocRef = doc(db, 'roles', newRoleId);
        const roleSnap = await getDoc(roleDocRef);
        if (roleSnap.exists()) {
            roleName = (roleSnap.data() as Role).name;
            updateData.roleId = newRoleId;
            updateData.roleName = roleName;
        } else {
            return { success: false, message: 'Perfil (Role) não encontrado.'};
        }
    } else {
        updateData.roleId = undefined; // Or FieldValue.delete() if you prefer to remove the field
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

// Note: Full user deletion involves Firebase Auth deletion and Firestore document deletion.
// This is a complex operation that should handle data integrity (e.g., what happens to user's auctions/lots).
// For now, this will be a placeholder or a "soft delete" by changing status.
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Placeholder: In a real app, you'd delete from Firebase Auth and then Firestore.
    // For now, just log and revalidate.
    // await admin.auth().deleteUser(userId); // Requires Firebase Admin SDK
    // await deleteFirestoreDoc(doc(db, 'users', userId)); 
    console.warn(`[Server Action - deleteUser] Placeholder: User ${userId} would be deleted. Actual deletion logic not implemented in this example.`);
    
    // Example of a soft delete (if you have a 'status' field)
    // const userDocRef = doc(db, 'users', userId);
    // await updateDoc(userDocRef, { status: 'DELETED', updatedAt: serverTimestamp() });

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário (placeholder) excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteUser] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir usuário.' };
  }
}

    