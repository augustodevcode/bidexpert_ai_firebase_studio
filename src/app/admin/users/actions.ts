// src/app/admin/users/actions.ts
'use server';

import type { UserProfileWithPermissions, Role, AccountType, UserProfileData, UserHabilitationStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database/index';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

export interface UserCreationData {
  email: string;
  password?: string;
  fullName?: string;
  cpf?: string | null;
  cellPhone?: string | null;
  dateOfBirth?: Date | string | null;
  accountType?: AccountType;
  razaoSocial?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  website?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  optInMarketing?: boolean;
  responsibleName?: string; // Added to fix type error
  responsibleCpf?: string;  // Added to fix type error
  roleIds?: string[];
  uid?: string;
}

export async function getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
  const db = getDatabaseAdapter();
  const users = await db.getUsersWithRoles();
  // Casting here assumes the adapter correctly returns the enriched data.
  // The FirestoreAdapter has been updated to do so.
  return users as UserProfileWithPermissions[];
}

export async function getUserProfileData(userIdOrEmail: string): Promise<UserProfileWithPermissions | null> {
  const db = getDatabaseAdapter();
  const user = await db.getUserProfileData(userIdOrEmail);
  return user as UserProfileWithPermissions | null;
}

export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  if (!data.email || !data.password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }
  
  const { app } = ensureAdminInitialized();
  const auth = admin.auth(app);
  const db = getDatabaseAdapter();

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: data.email.trim(),
      password: data.password,
      displayName: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
      emailVerified: false, // User needs to verify their email
    });

    // 2. Prepare data for Firestore document
    const roles = await db.getRoles();
    const userRole = roles.find(r => r.nameNormalized === 'USER');

    if (!userRole) {
      throw new Error("O perfil de usuário padrão (USER) não foi encontrado no banco de dados.");
    }
    
    const habilitationStatus: UserHabilitationStatus = 'PENDING_DOCUMENTS';
    const uid = userRecord.uid;

    const firestoreData: Omit<UserProfileData, 'id' | 'createdAt' | 'updatedAt' | 'password'> = {
      uid: uid,
      email: data.email.trim(),
      fullName: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
      accountType: data.accountType as AccountType,
      cpf: data.accountType === 'PHYSICAL' ? data.cpf?.trim() : data.responsibleCpf?.trim(),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth as string) : null,
      razaoSocial: data.accountType !== 'PHYSICAL' ? data.razaoSocial?.trim() : undefined,
      cnpj: data.accountType !== 'PHYSICAL' ? data.cnpj?.trim() : undefined,
      inscricaoEstadual: data.accountType !== 'PHYSICAL' ? data.inscricaoEstadual?.trim() : undefined,
      website: data.accountType === 'DIRECT_SALE_CONSIGNOR' ? data.website?.trim() : undefined,
      cellPhone: data.cellPhone?.trim(),
      zipCode: data.zipCode?.trim(),
      street: data.street?.trim(),
      number: data.number?.trim(),
      complement: data.complement?.trim(),
      neighborhood: data.neighborhood?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      optInMarketing: data.optInMarketing,
      habilitationStatus: habilitationStatus,
      roleIds: data.roleIds || [userRole.id]
    };
    
    // 3. Create user document in Firestore
    // @ts-ignore The create_user method in the adapter will handle the rest
    const result = await db.createUser(firestoreData); 

    if (result.success) {
      revalidatePath('/admin/users');
      // Optionally send verification email
      // await auth.generateEmailVerificationLink(data.email);
    }
    
    return result;

  } catch (error: any) {
    console.error("Error creating user:", error);
    let message = 'Ocorreu um erro ao criar o usuário.';
    if (error.code === 'auth/email-already-exists') {
      message = 'Este email já está em uso por outra conta.';
    } else if (error.code === 'auth/invalid-password') {
      message = 'A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.';
    }
    return { success: false, message };
  }
}


export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  try {
    const db = getDatabaseAdapter();
    const result = await db.updateUserRoles(userId, roleIds);
    if (result.success) {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
    return result;
  } catch(error: any) {
    console.error("Failed to update user roles:", error);
    return { success: false, message: "Falha ao atualizar perfis."};
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
  try {
     const db = getDatabaseAdapter();
     // @ts-ignore
     const result = await db.deleteUser(id);
    if (result.success) {
        revalidatePath('/admin/users');
    }
    return result;
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Falha ao excluir usuário. Verifique se há dados relacionados."};
  }
}

export async function getRoles(): Promise<Role[]> {
    const db = getDatabaseAdapter();
    return await db.getRoles();
}
