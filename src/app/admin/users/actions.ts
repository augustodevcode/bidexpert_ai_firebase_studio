
// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { UserProfileData, UserProfileWithPermissions, Role } from '@/types';
import type { UserFormValues } from './user-form-schema';

// This function is for admin use to create a user directly
export async function createUser(data: UserFormValues): Promise<{ success: boolean; message: string; userId?: string }> {
    const { auth } = ensureAdminInitialized();
    if (!auth) {
        return { success: false, message: "Autenticação do Admin não inicializada." };
    }

    try {
        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password, // This is for admin creation
            displayName: data.fullName,
        });

        // Now create the user in our Prisma DB
        const defaultRole = await prisma.role.findUnique({ where: { name: 'USER' } });
        
        await prisma.user.create({
            data: {
                id: userRecord.uid,
                email: data.email,
                fullName: data.fullName,
                roleId: data.roleId || defaultRole?.id,
                habilitationStatus: 'PENDENTE_DOCUMENTOS',
            }
        });
        
        revalidatePath('/admin/users');
        return { success: true, message: 'Usuário criado com sucesso!', userId: userRecord.uid };

    } catch (error: any) {
        console.error("[createUser Action] Error:", error);
        return { success: false, message: error.message || "Falha ao criar usuário." };
    }
}


export async function getOrCreateUserFromFirebaseAuth(
  uid: string,
  email: string,
  fullName: string,
  avatarUrl: string | null
): Promise<UserProfileWithPermissions | null> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
      include: { role: { include: { permissions: true } } }
    });

    if (existingUser) {
      const permissions = existingUser.role?.permissions.map(p => p.name) || [];
      return {
        ...existingUser,
        uid: existingUser.id,
        permissions,
      } as UserProfileWithPermissions;
    }

    console.log(`[getOrCreateUser] No user found for UID ${uid}. Creating new user profile.`);
    
    const defaultRole = await prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!defaultRole) {
      throw new Error("Default 'USER' role not found in the database. Please seed the database.");
    }
    
    const newUser = await prisma.user.create({
      data: {
        id: uid,
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
        habilitationStatus: 'PENDENTE_DOCUMENTOS',
        roleId: defaultRole.id,
      },
      include: { role: { include: { permissions: true } } }
    });
    
    const permissions = newUser.role?.permissions.map(p => p.name) || [];
    return {
      ...newUser,
      uid: newUser.id,
      permissions,
    } as UserProfileWithPermissions;

  } catch (error) {
    console.error(`[getOrCreateUserFromFirebaseAuth] Error:`, error);
    return null;
  }
}

export async function getUsersWithRoles(): Promise<UserProfileData[]> {
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users.map(user => ({
    ...user,
    uid: user.id,
    roleName: user.role?.name,
  }));
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const permissions = user.role?.permissions.map(p => p.name) || [];

    return {
      ...user,
      uid: user.id,
      permissions: permissions,
    } as UserProfileWithPermissions;
  } catch (error) {
    console.error(`[getUserProfileData Action] Error fetching user ${userId}:`, error);
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  roleId: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: roleId },
    });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: 'Perfil do usuário atualizado com sucesso.' };
  } catch (error) {
    console.error(`Error updating user role for ${userId}:`, error);
    return { success: false, message: 'Falha ao atualizar o perfil do usuário.' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const { auth } = ensureAdminInitialized();
  if (!auth) {
      return { success: false, message: "Autenticação do Admin não inicializada." };
  }
  
  try {
    // Transaction to ensure both deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
        await tx.user.delete({ where: { id: userId } });
        await auth.deleteUser(userId);
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído com sucesso da autenticação e do banco de dados.' };
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}

export async function getUserByEmail(email: string): Promise<UserProfileWithPermissions | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } },
        });

        if (!user) return null;

        const permissions = user.role?.permissions.map(p => p.name) || [];
        return {
            ...user,
            uid: user.id,
            permissions,
        } as UserProfileWithPermissions;
    } catch (error) {
        console.error(`[getUserByEmail Action] Error fetching user ${email}:`, error);
        return null;
    }
}

export type UserFormData = Omit<UserFormValues, 'password'> & { password?: string };
