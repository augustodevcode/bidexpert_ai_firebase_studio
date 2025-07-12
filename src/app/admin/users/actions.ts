// src/app/admin/users/actions.ts
'use server';

import { prisma } from '@/lib/database';
import type { UserProfileWithPermissions, Role, AccountType } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

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
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(user => ({
    ...user,
    permissions: user.role?.permissions as string[] || [],
  }));
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  if (!user) return null;
  return { ...user, permissions: user.role?.permissions as string[] || [] };
}

export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  if (!data.email || !data.password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { success: false, message: "Este email já está em uso." };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const userRole = await prisma.role.findFirst({ where: { name_normalized: 'USER' } });
  if (!userRole) {
    throw new Error("O perfil de usuário padrão (USER) não foi encontrado no banco de dados.");
  }
  
  const newUser = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      roleId: userRole.id,
      habilitationStatus: 'PENDING_DOCUMENTS',
    }
  });

  revalidatePath('/admin/users');
  return { success: true, message: "Usuário criado com sucesso.", userId: newUser.id };
}

export async function updateUserRole(userId: string, roleId: string | null): Promise<{success: boolean; message: string}> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { roleId: roleId }
    });
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: "Perfil do usuário atualizado." };
  } catch(error: any) {
    console.error("Failed to update user role:", error);
    return { success: false, message: "Falha ao atualizar perfil."};
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
    return { success: true, message: "Usuário excluído com sucesso." };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Falha ao excluir usuário. Verifique se há dados relacionados."};
  }
}

export async function getRoles(): Promise<Role[]> {
    return prisma.role.findMany({ orderBy: { name: 'asc' }});
}
