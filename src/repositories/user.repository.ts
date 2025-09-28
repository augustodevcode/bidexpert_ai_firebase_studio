
// src/repositories/user.repository.ts
import { prisma as basePrisma } from '@/lib/prisma'; // Usa a instância base para modelos globais
import type { Prisma, User } from '@prisma/client';
import type { EditableUserProfileData } from '@/types';

export class UserRepository {

  async findAll() {
    return basePrisma.user.findMany({
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

  async findById(id: string) {
    if (!id) return null;
    return basePrisma.user.findUnique({
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
    return basePrisma.user.findUnique({
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

  async create(userData: Prisma.UserCreateInput, roleIds: string[], tenantId: string): Promise<User> {
    const dataWithRolesAndTenant: Prisma.UserCreateInput = {
      ...userData,
      roles: {
        create: roleIds.map(roleId => ({
          role: { connect: { id: roleId } },
          assignedBy: 'system-signup'
        }))
      },
      tenants: { // Associação do usuário ao tenant atual
        create: {
          tenant: { connect: { id: tenantId } },
          assignedBy: 'system-signup',
        },
      },
    };
    return basePrisma.user.create({ data: dataWithRolesAndTenant });
  }

  async update(userId: string, data: Partial<EditableUserProfileData>): Promise<User> {
    return basePrisma.user.update({
      where: {
        id: userId,
      },
      data: data as Prisma.UserUpdateInput,
    });
  }

  async updateUserRoles(userId: string, tenantIds: string[], roleIds: string[]) {
    if (!userId) return;

    // A lógica de roles é global, não por tenant, então usamos basePrisma
    await basePrisma.usersOnRoles.deleteMany({ where: { userId }});

    if (roleIds.length > 0) {
      await basePrisma.usersOnRoles.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy: 'admin-panel',
        })),
      });
    }
  }

  async delete(id: string): Promise<void> {
    await basePrisma.user.delete({
      where: {
        id,
      },
    });
  }
}
