// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { User, UserProfileWithPermissions, Role } from '@/types';
import type { UserFormValues } from './user-form-schema';
import bcrypt from 'bcrypt';

export type UserCreationData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'roleId' | 'sellerId'>> & {
  email: string;
  password?: string | null;
};

/**
 * Cria um novo usuário no sistema, tanto no banco de dados quanto no provedor de autenticação.
 * Esta action é para uso administrativo.
 * @param data - Os dados do formulário do novo usuário.
 * @returns Um objeto indicando o sucesso e a mensagem da operação.
 */
export async function createUser(data: UserCreationData): Promise<{ success: boolean; message: string; userId?: string }> {
  if (!data.password) {
    return { success: false, message: "A senha é obrigatória para criar um novo usuário." };
  }

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const defaultRole = await prisma.role.findFirst({ where: { name_normalized: 'USER' } });

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        accountType: data.accountType,
        cpf: data.cpf,
        dateOfBirth: data.dateOfBirth,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        inscricaoEstadual: data.inscricaoEstadual,
        website: data.website,
        cellPhone: data.cellPhone,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        optInMarketing: data.optInMarketing,
        habilitationStatus: 'PENDENTE_DOCUMENTOS',
        roleId: defaultRole?.id, // Associa ao papel padrão 'USER'
      }
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário criado com sucesso!', userId: newUser.id };

  } catch (error: any) {
    console.error("[createUser Action] Error:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return { success: false, message: 'Este email já está em uso.' };
    }
    return { success: false, message: error.message || "Falha ao criar usuário." };
  }
}

/**
 * Busca todos os usuários do banco de dados, incluindo o nome de seu perfil (role).
 * @returns Um array de perfis de usuário.
 */
export async function getUsersWithRoles(): Promise<User[]> {
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
    uid: user.id, // uid é um alias comum para id em contextos de autenticação
    roleName: user.role?.name,
  })) as unknown as User[];
}

/**
 * Busca o perfil completo de um usuário, incluindo suas permissões.
 * @param userId - O ID do usuário a ser buscado.
 * @returns O perfil do usuário com permissões, ou null se não encontrado.
 */
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

/**
 * Atualiza o perfil (role) de um usuário.
 * @param userId - O ID do usuário a ser atualizado.
 * @param roleId - O ID do novo perfil a ser atribuído.
 * @returns Um objeto indicando o sucesso da operação.
 */
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

/**
 * Exclui um usuário do banco de dados.
 * @param userId - O ID do usuário a ser excluído.
 * @returns Um objeto indicando o sucesso da operação.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin/users');
    return { success: true, message: 'Usuário excluído com sucesso do banco de dados.' };
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    return { success: false, message: `Falha ao excluir usuário: ${error.message}` };
  }
}

/**
 * Busca um usuário pelo seu email.
 * @param email - O email do usuário.
 * @returns O perfil do usuário com permissões, ou null se não encontrado.
 */
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
