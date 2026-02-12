/**
 * @fileoverview Serviço centralizado da Máquina de Estado de Lotes.
 * Implementa transições de estado dos lotes com validações, auditoria,
 * e sincronização automática com o estado do leilão pai.
 *
 * REGRAS INVIOLÁVEIS:
 * 1. Toda mudança de status do lote DEVE usar este serviço
 * 2. Toda transição DEVE ser validada contra a matriz LOT_TRANSITIONS
 * 3. Toda transição DEVE criar audit log
 * 4. Após transição de lote, verificar se o leilão pai precisa sincronizar
 */

import { prisma } from '@/lib/prisma';
import type { Lot as PrismaLot } from '@prisma/client';
import logger from '@/lib/logger';

import {
  LotStatus,
  BidStatus,
  isValidLotTransition,
  isTerminalLotStatus,
  type LotStatusType,
} from './constants';

import { AuctionErrorMessages } from './error-messages';

import {
  StartLotAuctionSchema,
  ConfirmLotSaleSchema,
  MarkLotUnsoldSchema,
  CloseLotSchema,
  type StartLotAuctionInput,
  type ConfirmLotSaleInput,
  type MarkLotUnsoldInput,
  type CloseLotInput,
} from './schemas';

import { createStateAuditLog } from './audit-log.service';
import { auctionStateMachine } from './auction-state.service';

// ============================================================================
// TIPOS
// ============================================================================

export interface LotTransitionResult {
  success: boolean;
  error?: string;
  data?: PrismaLot;
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

export class LotStateMachineService {

  // ──────────────────────────────────────────────────────────────────────
  // OPEN → IN_AUCTION (Iniciar pregão de um lote)
  // ──────────────────────────────────────────────────────────────────────
  async startLotAuction(input: StartLotAuctionInput): Promise<LotTransitionResult> {
    const parsed = StartLotAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const lotId = toBigInt(parsed.data.lotId);
    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    return prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findFirst({
        where: { id: lotId, auctionId, tenantId },
      });

      if (!lot) {
        return { success: false, error: AuctionErrorMessages.LOT_NOT_FOUND };
      }

      if (!isValidLotTransition(lot.status as LotStatusType, LotStatus.IN_AUCTION)) {
        return { success: false, error: AuctionErrorMessages.INVALID_LOT_TRANSITION(lot.status, LotStatus.IN_AUCTION) };
      }

      const previousState = serializeLot(lot);

      const updated = await tx.lot.update({
        where: { id: lotId },
        data: {
          status: LotStatus.IN_AUCTION,
          openedAt: lot.openedAt || new Date(),
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'LOT',
        entityId: lotId,
        action: 'LOT_IN_AUCTION',
        userId,
        tenantId,
        previousState,
        currentState: serializeLot(updated),
        metadata: { transition: 'OPEN → IN_AUCTION', auctionId: auctionId.toString() },
      });

      logger.info(`[StateMachine:Lot] Lote #${lotId} entrou em pregão`);

      return { success: true, data: updated };
    }).then(async (result) => {
      // Após transação, sincronizar estado do leilão pai
      if (result.success) {
        const auctionId = toBigInt(parsed.data.auctionId);
        const tenantId = toBigInt(parsed.data.tenantId);
        const userId = toBigInt(parsed.data.userId);
        await auctionStateMachine.syncAuctionWithLots(auctionId, tenantId, userId);
      }
      return result;
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IN_AUCTION → SOLD (Confirmar arrematação)
  // ──────────────────────────────────────────────────────────────────────
  async confirmSale(input: ConfirmLotSaleInput): Promise<LotTransitionResult> {
    const parsed = ConfirmLotSaleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const lotId = toBigInt(parsed.data.lotId);
    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);
    const winnerId = toBigInt(parsed.data.winnerId);

    return prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findFirst({
        where: { id: lotId, auctionId, tenantId },
      });

      if (!lot) {
        return { success: false, error: AuctionErrorMessages.LOT_NOT_FOUND };
      }

      if (!isValidLotTransition(lot.status as LotStatusType, LotStatus.SOLD)) {
        return { success: false, error: AuctionErrorMessages.INVALID_LOT_TRANSITION(lot.status, LotStatus.SOLD) };
      }

      const previousState = serializeLot(lot);
      const now = new Date();

      // 1. Atualizar lote para SOLD
      const updated = await tx.lot.update({
        where: { id: lotId },
        data: {
          status: LotStatus.SOLD,
          soldAt: now,
          soldPrice: parsed.data.soldPrice,
          winnerId,
        },
      });

      // 2. Marcar lance vencedor
      const winningBid = await tx.bid.findFirst({
        where: {
          lotId,
          bidderId: winnerId,
          status: BidStatus.ACTIVE,
        },
        orderBy: { amount: 'desc' },
      });

      if (winningBid) {
        await tx.bid.update({
          where: { id: winningBid.id },
          data: { status: BidStatus.WINNING },
        });
      }

      await createStateAuditLog(tx as any, {
        entityType: 'LOT',
        entityId: lotId,
        action: 'LOT_SOLD',
        userId,
        tenantId,
        previousState,
        currentState: serializeLot(updated),
        metadata: {
          transition: 'IN_AUCTION → SOLD',
          winnerId: winnerId.toString(),
          soldPrice: parsed.data.soldPrice,
          winningBidId: winningBid?.id.toString(),
        },
      });

      logger.info(`[StateMachine:Lot] Lote #${lotId} arrematado por #${winnerId} - R$${parsed.data.soldPrice}`);

      return { success: true, data: updated };
    }).then(async (result) => {
      if (result.success) {
        const auctionId = toBigInt(parsed.data.auctionId);
        const tenantId = toBigInt(parsed.data.tenantId);
        const userId = toBigInt(parsed.data.userId);
        await auctionStateMachine.syncAuctionWithLots(auctionId, tenantId, userId);
      }
      return result;
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IN_AUCTION → UNSOLD (Marcar como não arrematado)
  // ──────────────────────────────────────────────────────────────────────
  async markUnsold(input: MarkLotUnsoldInput): Promise<LotTransitionResult> {
    const parsed = MarkLotUnsoldSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const lotId = toBigInt(parsed.data.lotId);
    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    return prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findFirst({
        where: { id: lotId, auctionId, tenantId },
      });

      if (!lot) {
        return { success: false, error: AuctionErrorMessages.LOT_NOT_FOUND };
      }

      // Permitir transição de OPEN → UNSOLD (leilão encerra sem pregão) e IN_AUCTION → UNSOLD
      const currentStatus = lot.status as LotStatusType;
      if (!isValidLotTransition(currentStatus, LotStatus.UNSOLD)) {
        return { success: false, error: AuctionErrorMessages.INVALID_LOT_TRANSITION(currentStatus, LotStatus.UNSOLD) };
      }

      const previousState = serializeLot(lot);

      const updated = await tx.lot.update({
        where: { id: lotId },
        data: {
          status: LotStatus.UNSOLD,
          lotClosedAt: new Date(),
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'LOT',
        entityId: lotId,
        action: 'LOT_UNSOLD',
        userId,
        tenantId,
        previousState,
        currentState: serializeLot(updated),
        metadata: { transition: `${currentStatus} → UNSOLD` },
      });

      logger.info(`[StateMachine:Lot] Lote #${lotId} não arrematado`);

      return { success: true, data: updated };
    }).then(async (result) => {
      if (result.success) {
        const auctionId = toBigInt(parsed.data.auctionId);
        const tenantId = toBigInt(parsed.data.tenantId);
        const userId = toBigInt(parsed.data.userId);
        await auctionStateMachine.syncAuctionWithLots(auctionId, tenantId, userId);
      }
      return result;
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // SOLD/UNSOLD → CLOSED (Finalizar processo do lote)
  // ──────────────────────────────────────────────────────────────────────
  async closeLot(input: CloseLotInput): Promise<LotTransitionResult> {
    const parsed = CloseLotSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const lotId = toBigInt(parsed.data.lotId);
    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    return prisma.$transaction(async (tx) => {
      const lot = await tx.lot.findFirst({
        where: { id: lotId, auctionId, tenantId },
      });

      if (!lot) {
        return { success: false, error: AuctionErrorMessages.LOT_NOT_FOUND };
      }

      if (!isValidLotTransition(lot.status as LotStatusType, LotStatus.CLOSED)) {
        return { success: false, error: AuctionErrorMessages.INVALID_LOT_TRANSITION(lot.status, LotStatus.CLOSED) };
      }

      const previousState = serializeLot(lot);

      const updated = await tx.lot.update({
        where: { id: lotId },
        data: {
          status: LotStatus.CLOSED,
          lotClosedAt: lot.lotClosedAt || new Date(),
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'LOT',
        entityId: lotId,
        action: 'LOT_CLOSED',
        userId,
        tenantId,
        previousState,
        currentState: serializeLot(updated),
        metadata: { transition: `${lot.status} → CLOSED` },
      });

      logger.info(`[StateMachine:Lot] Lote #${lotId} encerrado`);

      return { success: true, data: updated };
    });
  }
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function toBigInt(value: string | bigint): bigint {
  return typeof value === 'string' ? BigInt(value) : value;
}

function serializeLot(lot: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(lot, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Singleton export
export const lotStateMachine = new LotStateMachineService();
