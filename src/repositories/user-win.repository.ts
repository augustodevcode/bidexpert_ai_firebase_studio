// src/repositories/user-win.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { UserWin } from '@/types';

export class UserWinRepository {
  async findById(id: string): Promise<any | null> {
    return prisma.userWin.findUnique({
      where: { id },
      include: {
        lot: {
          include: {
            auction: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async findByIdSimple(id: string): Promise<UserWin | null> {
    return prisma.userWin.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.UserWinUpdateInput): Promise<UserWin> {
    return prisma.userWin.update({
      where: { id },
      data,
    });
  }

  async createInstallments(data: Prisma.InstallmentPaymentCreateManyInput) {
    return prisma.installmentPayment.createMany({ data });
  }
}
