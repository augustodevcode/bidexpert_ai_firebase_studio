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
        installments: true, // Incluir parcelas
      },
    });
  }

  async findByIds(ids: string[]): Promise<UserWin[]> {
    return prisma.userWin.findMany({
      where: { id: { in: ids } },
    });
  }

  async findByIdSimple(id: string): Promise<UserWin | null> {
    return prisma.userWin.findUnique({ where: { id } });
  }

  async findWinsByUserId(userId: string): Promise<any[]> {
    return prisma.userWin.findMany({
      where: { userId },
      include: {
        lot: {
          include: {
            auction: { select: { title: true } },
          },
        },
         installments: true, // Incluir parcelas
      },
      orderBy: { winDate: 'desc' },
    });
  }
  
  async findWinsBySellerId(sellerId: string): Promise<any[]> {
     return prisma.userWin.findMany({
      where: {
          lot: {
              sellerId: sellerId
          }
      },
      include: {
          lot: {
            include: {
              auction: { select: { title: true } }
            }
          },
          user: { // Incluir o nome do arrematante
              select: { fullName: true }
          },
          installments: true,
      },
      orderBy: {
          winDate: 'desc'
      }
  });
  }

  async update(id: string, data: Prisma.UserWinUpdateInput): Promise<UserWin> {
    return prisma.userWin.update({
      where: { id },
      data,
    });
  }

}
