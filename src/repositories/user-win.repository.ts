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

  async findByUserId(userId: string): Promise<UserWin[]> {
     const wins = await this.prisma.userWin.findMany({
        where: { userId },
        include: {
            lot: {
                include: {
                    auction: {
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
              ...win.lot,
              auctionName: win.lot.auction.title
          }
      })) as unknown as UserWin[];
  }
}
