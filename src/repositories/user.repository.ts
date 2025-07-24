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

  async create(userData: Prisma.UserCreateInput, roleIds: string[]): Promise<User> {
    const dataWithRoles: Prisma.UserCreateInput = {
      ...userData,
      roles: {
        create: roleIds.map(roleId => ({
          role: { connect: { id: roleId } },
          assignedBy: 'system-signup'
        }))
      }
    };
    return prisma.user.create({ data: dataWithRoles });
  }

  async updateUserRoles(userId: string, roleIdsToAdd: string[]) {
    if (roleIdsToAdd.length === 0) return;
    
    // This now adds roles without removing existing ones.
    // `skipDuplicates` prevents errors if the user already has one of the roles.
    await prisma.usersOnRoles.createMany({
      data: roleIdsToAdd.map(roleId => ({
        userId,
        roleId,
        assignedBy: 'system', // or another appropriate value
      })),
      skipDuplicates: true,
    });
  }

  async delete(id: string): Promise<void> {
    // The relation table (UsersOnRoles) should cascade delete,
    // as defined in the Prisma schema.
    await prisma.user.delete({ where: { id } });
  }
}
