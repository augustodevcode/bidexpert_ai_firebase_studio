

// src/app/admin/users/actions.ts
'use server';

import type { UserProfileWithPermissions, Role, AccountType, UserProfileData, UserHabilitationStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
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
  const users = await prisma.user.findMany({
    include: {
      roles: true, 
    },
    orderBy: {
      fullName: 'asc'
    }
  });

  return users.map(user => ({
    ...user,
    roleName: user.roles[0]?.name,
    roleNames: user.roles.map(r => r.name),
    permissions: user.roles.flatMap(r => r.permissions as string[]),
  }));
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true }
    });
    if (!user) return null;

    return {
        ...user,
        roleName: user.roles[0]?.name,
        roleNames: user.roles.map(r => r.name),
        permissions: user.roles.flatMap(r => r.permissions as string[]),
    };
}


export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string; }> {
  if (!data.email || !data.password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }
  
  const existingUser = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() }});

  if (existingUser) {
    return { success: false, message: "Este email já está em uso." };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });

  if (!userRole) {
    throw new Error("O perfil de usuário padrão (USER) não foi encontrado no banco de dados.");
  }
  
  const habilitationStatus: UserHabilitationStatus = 'PENDING_DOCUMENTS';

  const newUser = await prisma.user.create({
    data: {
      email: data.email.trim(),
      fullName: data.accountType === 'PHYSICAL' ? data.fullName?.trim() : data.razaoSocial?.trim(),
      password: hashedPassword,
      accountType: data.accountType,
      cpf: data.accountType === 'PHYSICAL' ? data.cpf?.trim() : data.responsibleCpf?.trim(),
      dateOfBirth: data.accountType === 'PHYSICAL' ? data.dateOfBirth : undefined,
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
      roles: { connect: [{ id: userRole.id }] }
    }
  });

  revalidatePath('/admin/users');
  return { success: true, message: 'Usuário criado com sucesso!', userId: newUser.id };
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  try {
    // Get the current roles to disconnect them
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: { select: { id: true } } }
    });

    const rolesToDisconnect = user?.roles.map(r => ({ id: r.id })) || [];
    const rolesToConnect = roleIds.map(id => ({ id }));
    
    await prisma.user.update({
        where: { id: userId },
        data: {
            roles: {
                disconnect: rolesToDisconnect,
                connect: rolesToConnect
            }
        }
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, message: "Perfis do usuário atualizados." };
  } catch(error: any) {
    console.error("Failed to update user roles:", error);
    return { success: false, message: `Falha ao atualizar perfis: ${error.message}`};
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; message: string; }> {
  try {
     await prisma.user.delete({ where: { id }});
     revalidatePath('/admin/users');
     return { success: true, message: "Usuário excluído com sucesso." };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Falha ao excluir usuário. Verifique se há dados relacionados."};
  }
}

export async function getRoles(): Promise<Role[]> {
    return prisma.role.findMany();
}
