// src/app/admin/users/actions.ts
'use server';

import type { UserProfileWithPermissions, Role, AccountType, UserProfileData } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { getDatabaseAdapter } from '@/lib/database/get-adapter';

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

  const userRole = roles.find(r => r.name_normalized?.trim().toUpperCase() === 'USER');

  if (!userRole) {
    throw new Error("O perfil de usuário padrão (USER) não foi encontrado no banco de dados.");
  }
  
  const newUserPayload: Partial<UserProfileData> = {
    email: data.email.trim(),
    name: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
    password: hashedPassword,
    roleIds: [userRole.id], 
    habilitationStatus: 'PENDING_DOCUMENTS',
    accountType: data.accountType,
    cpf: data.cpf,
    dateOfBirth: data.dateOfBirth,
    cellPhone: data.cellPhone,
    zipCode: data.zipCode,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    optInMarketing: data.optInMarketing,
    razaoSocial: data.razaoSocial,
    cnpj: data.cnpj,
    inscricaoEstadual: data.inscricaoEstadual,
    website: data.website,
  };

  // The adapter's createUser will handle this
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
    return db.getRoles();
}
