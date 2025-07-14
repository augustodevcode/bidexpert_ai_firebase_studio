// src/app/admin/users/actions.ts
'use server';

import type { UserProfileWithPermissions, Role, AccountType, UserProfileData, UserHabilitationStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { getDatabaseAdapter } from '@/lib/database/index';
import { v4 as uuidv4 } from 'uuid';

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
}

export async function getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
  const db = getDatabaseAdapter();
  const users = await db.getUsersWithRoles();
  return users as UserProfileWithPermissions[];
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
  const db = getDatabaseAdapter();
  const user = await db.getUserProfileData(userId);
  return user as UserProfileWithPermissions | null;
}

export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  if (!data.email || !data.password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }
  
  const db = getDatabaseAdapter();
  const allUsers = await db.getUsersWithRoles();
  const existingUser = allUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());

  if (existingUser) {
    return { success: false, message: "Este email já está em uso." };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const roles = await db.getRoles();
  console.log('[createUser Action] Roles fetched for new user:', JSON.stringify(roles, null, 2));

  if (!roles || roles.length === 0) {
    throw new Error("Nenhum perfil (role) foi encontrado no banco de dados. Execute o script de inicialização.");
  }

  const userRole = roles.find(r => r.name_normalized.trim().toUpperCase() === 'USER');

  if (!userRole) {
    console.log('[createUser Action] Erro: O perfil de usuário padrão (USER) não foi encontrado nos dados buscados:', roles);
    throw new Error("O perfil de usuário padrão (USER) não foi encontrado no banco de dados.");
  }
  
  const habilitationStatus: UserHabilitationStatus = 'PENDING_DOCUMENTS';

  const creationData = {
    email: data.email.trim(),
    fullName: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
    password: hashedPassword,
    accountType: data.accountType,
    cpf: data.accountType === 'PHYSICAL' ? data.cpf?.trim() : data.responsibleCpf?.trim(),
    dateOfBirth: data.accountType === 'PHYSICAL' ? data.dateOfBirth : null,
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
    uid: uuidv4()
  };

  // @ts-ignore
  const newUserPayload: Partial<UserProfileData> = { ...creationData, roleId: userRole.id };
  
  // @ts-ignore
  const result = await db.createUser(newUserPayload); 

  if (result.success) {
    revalidatePath('/admin/users');
  }
  
  return result;
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
