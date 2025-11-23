// src/repositories/user.repository.ts
import prisma from '@/lib/prisma'; // Usa a instância base para modelos globais
import type { Prisma, User } from '@prisma/client';
import type { EditableUserProfileData } from '@/types';

export class UserRepository {

  async findAll() {
    return prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        tenants: {
            include: {
                tenant: true
            }
        }
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findById(id: bigint) {
    if (!id) return null;
    return prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        tenants: {
            include: {
                tenant: true
            }
        }
      },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return prisma.user.findUnique({
      where: {
        email,
      },
       include: {
        roles: {
          include: {
            role: true,
          },
        },
        tenants: {
            include: {
                tenant: true
            }
        }
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(userId: bigint, data: Partial<EditableUserProfileData>): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: data as Prisma.UserUpdateInput,
    });
  }

  async updateUserRoles(userId: bigint, tenantIds: bigint[], roleIds: bigint[]) {
    console.log('[UserRepository.updateUserRoles] Iniciando atualização de perfis');
    console.log('[UserRepository.updateUserRoles] userId:', userId.toString());
    console.log('[UserRepository.updateUserRoles] roleIds:', roleIds.map(id => id.toString()));
    
    if (!userId) {
      console.error('[UserRepository.updateUserRoles] userId não fornecido');
      return;
    }

    // A lógica de roles é global, não por tenant, então usamos a instância compartilhada do Prisma
    console.log('[UserRepository.updateUserRoles] Deletando perfis existentes...');
    const deleteResult = await prisma.usersOnRoles.deleteMany({ where: { userId }});
    console.log('[UserRepository.updateUserRoles] Perfis deletados:', deleteResult.count);

    if (roleIds.length > 0) {
      console.log('[UserRepository.updateUserRoles] Criando novos perfis...');
      const createResult = await prisma.usersOnRoles.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy: 'admin-panel',
        })),
      });
      console.log('[UserRepository.updateUserRoles] Perfis criados:', createResult.count);
    } else {
      console.log('[UserRepository.updateUserRoles] Nenhum perfil para criar (array vazio)');
    }
    
    console.log('[UserRepository.updateUserRoles] Atualização concluída');
  }

  async delete(id: bigint): Promise<void> {
    await prisma.user.delete({
      where: {
        id,
      },
    });
  }
}