// apps/microservice/src/repositories/user-win.repository.ts
import { prisma } from '@bidexpert/core/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { UserWin } from '@bidexpert/core';

export class UserWinRepository {
  async findByIdSimple(id: string): Promise<UserWin | null> {
    return prisma.userWin.findUnique({ where: { id } });
  }
  
  async update(id: string, data: Prisma.UserWinUpdateInput): Promise<UserWin> {
    return prisma.userWin.update({
      where: { id },
      data,
    });
  }
}
