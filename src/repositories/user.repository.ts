
// src/repositories/user.repository.ts
import { prisma } from '@/lib/prisma';
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

  async update(userId: string, data: Partial<EditableUserProfileData>): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: data as Prisma.UserUpdateInput,
    });
  }

  async updateUserRoles(userId: string, roleIds: string[]) {
    if (!userId) return;
    
    // First, clear existing roles for the user
    await prisma.usersOnRoles.deleteMany({ where: { userId }});

    // Then, add the new roles
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

  async delete(id: string): Promise<void> {
    // The relation table (UsersOnRoles) should cascade delete,
    // as defined in the Prisma schema.
    await prisma.user.delete({ where: { id } });
  }
}
