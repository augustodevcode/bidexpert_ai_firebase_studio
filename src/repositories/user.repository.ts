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
    if (!userId) return;

    // A lógica de roles é global, não por tenant, então usamos a instância compartilhada do Prisma
    await prisma.usersOnRoles.deleteMany({ where: { userId }});

    if (roleIds.length > 0) {
      await prisma.usersOnRoles.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy: 'admin-panel',
        })),
      });
    }
  }

  async delete(id: bigint): Promise<void> {
    await prisma.user.delete({
      where: {
        id,
      },
    });
  }
}