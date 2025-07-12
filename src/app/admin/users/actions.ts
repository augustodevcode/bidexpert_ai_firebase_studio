
// src/app/admin/users/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, Role, AccountType } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

// Use a specific type for creation to avoid ambiguity
export interface UserCreationData {
  email: string;
  password?: string;
  fullName?: string;
  // Add other fields from the registration form as needed
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


export async function getUsersWithRoles(): Promise<UserProfileData[]> {
    const db = await getDatabaseAdapter();
    return db.getUsersWithRoles();
}

export async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
    const db = await getDatabaseAdapter();
    return db.getUserProfileData(userId);
}

export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
    const db = await getDatabaseAdapter();
    // In a real app, this would also create a user in Firebase Auth or another auth provider.
    // For now, we'll just create the user profile in our database.
    if (!data.email || !data.password) {
        return { success: false, message: "Email e senha são obrigatórios para criar um usuário."};
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // @ts-ignore
    if (!db.createUser) {
        return { success: false, message: "A função de criação de usuário não está implementada no adaptador de banco de dados atual." };
    }
    
    const userDataToCreate = {
        ...data,
        password: hashedPassword,
        // Set default role, habilitation status, etc.
        roleId: 'role-user', // Default role for new users
        habilitationStatus: 'PENDING_DOCUMENTS',
    };

    // @ts-ignore
    const result = await db.createUser(userDataToCreate);

    if (result.success) {
        revalidatePath('/admin/users');
    }

    return result;
}


export async function updateUserRole(userId: string, roleId: string | null): Promise<{success: boolean; message: string}> {
    const db = await getDatabaseAdapter();
    const result = await db.updateUserRole(userId, roleId);
    if(result.success) {
        revalidatePath('/admin/users');
        revalidatePath(`/admin/users/${userId}/edit`);
    }
    return result;
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.deleteUser) {
        return { success: false, message: "Exclusão de usuário não implementada."};
    }
    // @ts-ignore
    const result = await db.deleteUser(id);
    if (result.success) {
        revalidatePath('/admin/users');
    }
    return result;
}


export async function getRoles(): Promise<Role[]> {
    const db = await getDatabaseAdapter();
    return db.getRoles();
}
