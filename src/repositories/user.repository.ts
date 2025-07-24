// src/repositories/user.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, User } from '@prisma/client';

export class UserRepository {
  async findAll() {
    return prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findById(id: string) {
    if (!id) return null;
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput, roleIds: string[]): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data });
      if (roleIds && roleIds.length > 0) {
        await tx.usersOnRoles.createMany({
          data: roleIds.map(roleId => ({
            userId: newUser.id,
            roleId,
            assignedBy: 'system-initial',
          })),
        });
      }
      return newUser;
    });
  }

  async updateUserRoles(userId: string, roleIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete all existing roles for the user
      await tx.usersOnRoles.deleteMany({
        where: { userId },
      });

      // 2. Add the new roles
      if (roleIds && roleIds.length > 0) {
        await tx.usersOnRoles.createMany({
          data: roleIds.map(roleId => ({
            userId,
            roleId,
            assignedBy: 'admin-panel', 
          })),
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    // The relation table (UsersOnRoles) should cascade delete,
    // as defined in the Prisma schema.
    await prisma.user.delete({ where: { id } });
  }
}
