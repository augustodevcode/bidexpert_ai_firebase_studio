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
  responsibleName?: string; 
  responsibleCpf?: string;  
}

function formatUserWithPermissions(user: any): UserProfileWithPermissions | null {
    if (!user) return null;

    const roles = user.roles?.map((ur: any) => ur.role) || [];
    const permissions = roles.flatMap((r: any) => r.permissions as string[] || []);

    return {
        ...user,
        roleNames: roles.map((r: any) => r.name),
        permissions,
        roleName: roles[0]?.name,
    };
}


export async function getUsersWithRoles(): Promise<UserProfileWithPermissions[]> {
  const users = await prisma.user.findMany({
    include: {
        roles: {
            include: {
                role: true
            }
        }
    },
    orderBy: {
      fullName: 'asc'
    }
  });

  return users.map(user => formatUserWithPermissions(user)).filter(u => u !== null) as UserProfileWithPermissions[];
}

export async function getUserProfileData(userId: string): Promise<UserProfileWithPermissions | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
    return formatUserWithPermissions(user);
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
    }
  });

  // Assign the default USER role
  await prisma.usersOnRoles.create({
      data: {
          userId: newUser.id,
          roleId: userRole.id,
          assignedBy: 'system-registration'
      }
  });


  revalidatePath('/admin/users');
  return { success: true, message: 'Usuário criado com sucesso!', userId: newUser.id };
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<{success: boolean; message: string}> {
  try {
    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // 1. Remove all existing roles for the user
        await tx.usersOnRoles.deleteMany({
            where: { userId: userId },
        });

        // 2. Add the new roles
        if (roleIds && roleIds.length > 0) {
            await tx.usersOnRoles.createMany({
                data: roleIds.map(roleId => ({
                    userId: userId,
                    roleId: roleId,
                    assignedBy: 'admin-panel' // Or get current admin user ID
                })),
            });
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
     // Prisma will cascade delete from UsersOnRoles due to the schema's onDelete: Cascade
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
