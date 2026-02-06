// src/repositories/user-win.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, UserWin } from '@prisma/client';

export class UserWinRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: Prisma.UserWinCreateInput) {
    return this.prisma.userWin.create({ data });
  }

  async findFirst(args: Prisma.UserWinFindFirstArgs) {
    return this.prisma.userWin.findFirst(args);
  }

  async findByIdWithDetails(winId: string): Promise<any | null> {
    return this.prisma.userWin.findUnique({
      where: { id: winId },
      include: {
        Lot: {
          include: {
            Auction: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<UserWin[]> {
     const wins = await this.prisma.userWin.findMany({
        where: { userId },
        include: {
            Lot: {
                include: {
                    Auction: {
                        select: {
                            title: true,
                        }
                    }
                }
            }
        },
        orderBy: {
            winDate: 'desc'
        }
      });
      
      // Mapeamento para garantir consistência de tipo e adicionar `auctionName`
      return wins.map(win => ({
          ...win,
          lot: {
              ...(win as any).Lot,
              auctionName: (win as any).Lot?.Auction?.title
          }
      })) as unknown as UserWin[];
  }
}
