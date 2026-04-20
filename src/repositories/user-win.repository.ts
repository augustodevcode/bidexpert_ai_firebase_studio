// src/repositories/user-win.repository.ts
/**
 * @fileoverview Repositório de arremates do usuário com normalização mínima
 * das relações Prisma para o contrato consumido pela camada de serviço.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, UserWin } from '@prisma/client';

const serializeBigInt = (value: unknown) => typeof value === 'bigint' ? value.toString() : value;

const serializeDecimal = (value: unknown) => value != null ? Number(value) : value;

const normalizeAuction = (auction: any) => {
  if (!auction) {
    return null;
  }

  return {
    ...auction,
    id: serializeBigInt(auction.id),
    tenantId: serializeBigInt(auction.tenantId),
    sellerId: serializeBigInt(auction.sellerId),
    auctioneerId: serializeBigInt(auction.auctioneerId),
  };
};

const normalizeLot = (lot: any) => {
  if (!lot) {
    return null;
  }

  const { Auction, auction, ...restLot } = lot;
  const normalizedAuction = normalizeAuction(auction ?? Auction);

  return {
    ...restLot,
    id: serializeBigInt(restLot.id),
    tenantId: serializeBigInt(restLot.tenantId),
    auctionId: serializeBigInt(restLot.auctionId),
    winnerId: serializeBigInt(restLot.winnerId),
    sellerId: serializeBigInt(restLot.sellerId),
    auctioneerId: serializeBigInt(restLot.auctioneerId),
    categoryId: serializeBigInt(restLot.categoryId),
    cityId: serializeBigInt(restLot.cityId),
    stateId: serializeBigInt(restLot.stateId),
    price: serializeDecimal(restLot.price),
    initialPrice: serializeDecimal(restLot.initialPrice),
    secondInitialPrice: serializeDecimal(restLot.secondInitialPrice),
    bidIncrementStep: serializeDecimal(restLot.bidIncrementStep),
    auction: normalizedAuction,
    auctionName: normalizedAuction?.title ?? null,
  };
};

const normalizeUserWin = (win: any) => {
  const { Lot, lot, ...restWin } = win;

  return {
    ...restWin,
    id: serializeBigInt(restWin.id),
    tenantId: serializeBigInt(restWin.tenantId),
    userId: serializeBigInt(restWin.userId),
    lotId: serializeBigInt(restWin.lotId),
    winningBidAmount: serializeDecimal(restWin.winningBidAmount),
    lot: normalizeLot(lot ?? Lot),
  };
};

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
    const win = await this.prisma.userWin.findUnique({
      where: { id: BigInt(winId) },
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

    return win ? normalizeUserWin(win) : null;
  }

  async findByUserId(userId: string): Promise<UserWin[]> {
     const wins = await this.prisma.userWin.findMany({
        where: { userId: BigInt(userId) },
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

        return wins.map((win) => normalizeUserWin(win)) as unknown as UserWin[];
  }
}
