/**
 * @fileoverview Service centralizado para validar elegibilidade de lances e auto-habilitação por leilão.
 */

import { prisma } from '@/lib/prisma';
import { getEffectiveAuctionStatus, getEffectiveLotStatus } from '@/lib/auction-timing';
import { getBidEligibilityState, type BidEligibilityState } from '@/lib/bidding-eligibility';
import type { AuctionStatus, LotStatus, UserHabilitationStatus } from '@/types';

const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'admin@bidexpert.com.br';

export interface BidEligibilitySnapshot extends BidEligibilityState {
  lotId: string | null;
  auctionId: string | null;
  effectiveLotStatus?: LotStatus;
  effectiveAuctionStatus?: AuctionStatus;
  isAuctionHabilitated: boolean;
  isPrivilegedBypass: boolean;
  userHabilitationStatus: UserHabilitationStatus | null;
}

const extractPermissions = (usersOnRoles?: Array<{ Role?: { permissions?: unknown } | null }> | null): string[] => {
  if (!usersOnRoles?.length) {
    return [];
  }

  const permissions = new Set<string>();
  for (const assignment of usersOnRoles) {
    const rawPermissions = assignment.Role?.permissions;
    if (!rawPermissions) {
      continue;
    }

    const parsed = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
    if (Array.isArray(parsed)) {
      for (const permission of parsed) {
        permissions.add(String(permission));
      }
    }
  }

  return Array.from(permissions);
};

export class BiddingEligibilityService {
  private async resolveLotInternalId(idOrPublicId: string): Promise<bigint | null> {
    if (!idOrPublicId) {
      return null;
    }

    if (/^\d+$/.test(idOrPublicId)) {
      return BigInt(idOrPublicId);
    }

    const lotRecord = await prisma.lot.findUnique({
      where: { publicId: idOrPublicId },
      select: { id: true },
    });

    return lotRecord?.id ?? null;
  }

  async getEligibilityForLot(lotIdOrPublicId: string, userId?: string | null): Promise<BidEligibilitySnapshot> {
    if (!userId) {
      const state = getBidEligibilityState({ isAuthenticated: false });
      return {
        ...state,
        lotId: null,
        auctionId: null,
        isAuctionHabilitated: false,
        isPrivilegedBypass: false,
        userHabilitationStatus: null,
      };
    }

    const internalLotId = await this.resolveLotInternalId(lotIdOrPublicId);
    if (!internalLotId) {
      return {
        canBid: false,
        canPlaceMaxBid: false,
        canSelfHabilitateForAuction: false,
        reason: 'LOT_NOT_OPEN',
        title: 'Lote não encontrado',
        description: 'Não foi possível localizar o lote informado.',
        lotId: null,
        auctionId: null,
        isAuctionHabilitated: false,
        isPrivilegedBypass: false,
        userHabilitationStatus: null,
      };
    }

    const [lot, user] = await Promise.all([
      prisma.lot.findUnique({
        where: { id: internalLotId },
        select: {
          id: true,
          status: true,
          endDate: true,
          auctionDate: true,
          auctionId: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          id: true,
          email: true,
          habilitationStatus: true,
          UsersOnRoles: {
            select: {
              Role: {
                select: {
                  permissions: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!lot) {
      return {
        canBid: false,
        canPlaceMaxBid: false,
        canSelfHabilitateForAuction: false,
        reason: 'LOT_NOT_OPEN',
        title: 'Lote não encontrado',
        description: 'Não foi possível localizar o lote informado.',
        lotId: null,
        auctionId: null,
        isAuctionHabilitated: false,
        isPrivilegedBypass: false,
        userHabilitationStatus: null,
      };
    }

    const auction = await prisma.auction.findUnique({
      where: { id: lot.auctionId },
      select: {
        id: true,
        status: true,
        actualOpenDate: true,
        openDate: true,
        auctionDate: true,
        endDate: true,
        AuctionStage: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            discountPercent: true,
            initialPrice: true,
          },
        },
      },
    });

    const isAuctionHabilitated = !!(await prisma.auctionHabilitation.findUnique({
      where: {
        userId_auctionId: {
          userId: BigInt(userId),
          auctionId: lot.auctionId,
        },
      },
      select: { userId: true },
    }));

    const permissions = extractPermissions(user?.UsersOnRoles);
    const isPrivilegedBypass =
      user?.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS || permissions.includes('manage_all');

    const auctionWithStages = auction
      ? {
          ...auction,
          id: auction.id.toString(),
          auctionStages: auction.AuctionStage.map((stage) => ({
            ...stage,
            id: stage.id.toString(),
            auctionId: auction.id.toString(),
          })),
        }
      : null;

    const effectiveAuctionStatus = getEffectiveAuctionStatus(auctionWithStages);
    const effectiveLotStatus = getEffectiveLotStatus(
      {
        status: lot.status as LotStatus,
        endDate: lot.endDate,
        auctionDate: lot.auctionDate,
      },
      auctionWithStages,
    );

    const state = getBidEligibilityState({
      isAuthenticated: !!user,
      lotStatus: effectiveLotStatus ?? (lot.status as LotStatus),
      auctionStatus: effectiveAuctionStatus ?? (auction?.status as AuctionStatus | undefined),
      userHabilitationStatus: (user?.habilitationStatus as UserHabilitationStatus | null | undefined) ?? null,
      isAuctionHabilitated,
      isPrivilegedBypass,
    });

    return {
      ...state,
      lotId: lot.id.toString(),
      auctionId: lot.auctionId.toString(),
      effectiveLotStatus,
      effectiveAuctionStatus,
      isAuctionHabilitated,
      isPrivilegedBypass,
      userHabilitationStatus: (user?.habilitationStatus as UserHabilitationStatus | null | undefined) ?? null,
    };
  }

  async assertCanBid(lotIdOrPublicId: string, userId?: string | null): Promise<{ success: true; snapshot: BidEligibilitySnapshot } | { success: false; snapshot: BidEligibilitySnapshot; message: string }> {
    const snapshot = await this.getEligibilityForLot(lotIdOrPublicId, userId);
    if (snapshot.canBid) {
      return { success: true, snapshot };
    }

    return { success: false, snapshot, message: snapshot.description };
  }

  async assertCanSelfHabilitateForAuction(userId: string, auctionId: string): Promise<{ success: true } | { success: false; message: string }> {
    if (!userId || !auctionId) {
      return { success: false, message: 'Usuário e leilão são obrigatórios.' };
    }

    const [user, auction, existingHabilitation] = await Promise.all([
      prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          email: true,
          habilitationStatus: true,
          UsersOnRoles: {
            select: {
              Role: {
                select: {
                  permissions: true,
                },
              },
            },
          },
        },
      }),
      prisma.auction.findUnique({
        where: { id: BigInt(auctionId) },
        select: {
          status: true,
        },
      }),
      prisma.auctionHabilitation.findUnique({
        where: {
          userId_auctionId: {
            userId: BigInt(userId),
            auctionId: BigInt(auctionId),
          },
        },
        select: { userId: true },
      }),
    ]);

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (!auction) {
      return { success: false, message: 'Leilão não encontrado.' };
    }

    if (existingHabilitation) {
      return { success: false, message: 'Você já está habilitado para este leilão.' };
    }

    const permissions = extractPermissions(user.UsersOnRoles);
    const isPrivilegedBypass =
      user.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS || permissions.includes('manage_all');

    if (!isPrivilegedBypass && user.habilitationStatus !== 'HABILITADO') {
      return { success: false, message: 'Sua documentação precisa ser aprovada antes da habilitação neste leilão.' };
    }

    if (['CANCELADO', 'ENCERRADO', 'FINALIZADO', 'SUSPENSO'].includes(auction.status)) {
      return { success: false, message: 'Este leilão não aceita novas habilitações.' };
    }

    return { success: true };
  }
}

export const biddingEligibilityService = new BiddingEligibilityService();