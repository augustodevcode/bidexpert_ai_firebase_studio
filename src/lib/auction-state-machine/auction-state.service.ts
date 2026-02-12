/**
 * @fileoverview Serviço centralizado da Máquina de Estado de Leilões.
 * Implementa TODAS as transições de estado com validações, permissões,
 * side-effects, auditoria e sincronização cascata com lotes/lances.
 *
 * REGRAS INVIOLÁVEIS:
 * 1. Toda mudança de estado DEVE passar por este serviço
 * 2. Toda transição DEVE ser validada contra a matriz de estados
 * 3. Toda transição DEVE criar audit log
 * 4. Toda transição DEVE usar prisma.$transaction
 * 5. Nunca atribuição direta de status sem validação
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, Auction as PrismaAuction } from '@prisma/client';
import logger from '@/lib/logger';

import {
  AuctionStatus,
  LotStatus,
  BidStatus,
  UserPermissionFlag,
  isValidAuctionTransition,
  isTerminalAuctionStatus,
  AUCTION_STATUS_LABELS,
  type AuctionStatusType,
  type LotStatusType,
  type UserPermissionFlagType,
} from './constants';

import { AuctionErrorMessages } from './error-messages';

import {
  SubmitForValidationSchema,
  AuctionSubmissionDataSchema,
  ApproveAuctionSchema,
  RejectAuctionSchema,
  ReturnToDraftSchema,
  OpenAuctionSchema,
  ReturnToValidationSchema,
  CancelAuctionSchema,
  ForceCloseAuctionSchema,
  type SubmitForValidationInput,
  type ApproveAuctionInput,
  type RejectAuctionInput,
  type ReturnToDraftInput,
  type OpenAuctionInput,
  type ReturnToValidationInput,
  type CancelAuctionInput,
  type ForceCloseAuctionInput,
} from './schemas';

import { createStateAuditLog } from './audit-log.service';

// ============================================================================
// TIPOS
// ============================================================================

export interface TransitionResult {
  success: boolean;
  error?: string;
  data?: PrismaAuction;
}

interface UserWithPermissions {
  id: bigint;
  permissions?: string[];
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

export class AuctionStateMachineService {

  // ──────────────────────────────────────────────────────────────────────
  // DRAFT → PENDING_VALIDATION (Submeter para validação)
  // ──────────────────────────────────────────────────────────────────────
  async submitForValidation(input: SubmitForValidationInput): Promise<TransitionResult> {
    const parsed = SubmitForValidationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
        include: { Lot: { select: { id: true } } },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      // Verificar que é o criador
      if (auction.createdByUserId && auction.createdByUserId !== userId) {
        return { success: false, error: AuctionErrorMessages.NOT_CREATOR };
      }

      // Verificar transição válida
      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.PENDING_VALIDATION)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.PENDING_VALIDATION) };
      }

      // Validar dados mínimos do leilão
      const dataValidation = AuctionSubmissionDataSchema.safeParse({
        title: auction.title,
        description: auction.description,
        lotsCount: auction.Lot?.length ?? 0,
      });

      if (!dataValidation.success) {
        return { success: false, error: dataValidation.error.errors.map(e => e.message).join(', ') };
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.PENDING_VALIDATION,
          submittedAt: new Date(),
          validationNotes: null,
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_SUBMITTED',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: { transition: 'DRAFT → PENDING_VALIDATION' },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} submetido para validação por usuário #${userId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // PENDING_VALIDATION → SCHEDULED (Aprovar)
  // ──────────────────────────────────────────────────────────────────────
  async approveAuction(input: ApproveAuctionInput, user: UserWithPermissions): Promise<TransitionResult> {
    const parsed = ApproveAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const validatorUserId = toBigInt(parsed.data.validatorUserId);
    const tenantId = toBigInt(parsed.data.tenantId);

    // Verificar permissão CAN_VALIDATE_AUCTION
    if (!hasPermission(user, UserPermissionFlag.CAN_VALIDATE_AUCTION)) {
      return { success: false, error: AuctionErrorMessages.INSUFFICIENT_PERMISSIONS };
    }

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      // Verificar transição válida
      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.SCHEDULED)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.SCHEDULED) };
      }

      // Verificar se não é o criador validando próprio leilão
      if (auction.createdByUserId && auction.createdByUserId === validatorUserId) {
        if (!hasPermission(user, UserPermissionFlag.CAN_VALIDATE_OWN_AUCTION)) {
          return { success: false, error: AuctionErrorMessages.CANNOT_VALIDATE_OWN };
        }
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.SCHEDULED,
          validatedAt: new Date(),
          validatedBy: validatorUserId,
          openDate: parsed.data.openDate,
          validationNotes: null,
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_APPROVED',
        userId: validatorUserId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: {
          transition: 'PENDING_VALIDATION → SCHEDULED',
          openDate: parsed.data.openDate.toISOString(),
        },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} aprovado por validador #${validatorUserId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // PENDING_VALIDATION → IN_REVIEW (Reprovar)
  // ──────────────────────────────────────────────────────────────────────
  async rejectAuction(input: RejectAuctionInput, user: UserWithPermissions): Promise<TransitionResult> {
    const parsed = RejectAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const validatorUserId = toBigInt(parsed.data.validatorUserId);
    const tenantId = toBigInt(parsed.data.tenantId);

    if (!hasPermission(user, UserPermissionFlag.CAN_VALIDATE_AUCTION)) {
      return { success: false, error: AuctionErrorMessages.INSUFFICIENT_PERMISSIONS };
    }

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.IN_REVIEW)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.IN_REVIEW) };
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.IN_REVIEW,
          validationNotes: parsed.data.validationNotes,
          openDate: null, // Remover data se existir
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_REJECTED',
        userId: validatorUserId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: {
          transition: 'PENDING_VALIDATION → IN_REVIEW',
          validationNotes: parsed.data.validationNotes,
        },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} reprovado por validador #${validatorUserId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IN_REVIEW → DRAFT (Retorno ao criador)
  // ──────────────────────────────────────────────────────────────────────
  async returnToDraft(input: ReturnToDraftInput): Promise<TransitionResult> {
    const parsed = ReturnToDraftSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      // Verificar que é o criador
      if (auction.createdByUserId && auction.createdByUserId !== userId) {
        return { success: false, error: AuctionErrorMessages.NOT_CREATOR };
      }

      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.DRAFT)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.DRAFT) };
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.DRAFT,
          validationNotes: null,
          submittedAt: null,
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_RETURNED_TO_DRAFT',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: { transition: 'IN_REVIEW → DRAFT' },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} retornado a rascunho pelo criador #${userId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // SCHEDULED → OPEN (Abertura automática ou manual)
  // ──────────────────────────────────────────────────────────────────────
  async openAuction(input: OpenAuctionInput): Promise<TransitionResult> {
    const parsed = OpenAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const tenantId = toBigInt(parsed.data.tenantId);
    const userId = parsed.data.userId ? toBigInt(parsed.data.userId) : BigInt(0);

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
        include: { Lot: { select: { id: true, status: true } } },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.OPEN)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.OPEN) };
      }

      // Se automático, verificar que openDate <= now()
      if (parsed.data.isAutomatic && auction.openDate && auction.openDate > new Date()) {
        return { success: false, error: AuctionErrorMessages.FUTURE_DATE_REQUIRED };
      }

      const previousState = serializeAuction(auction);
      const now = new Date();

      // 1. Atualizar leilão para OPEN
      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.OPEN,
          actualOpenDate: now,
        },
      });

      // 2. SINCRONIZAÇÃO CASCATA: Todos lotes AGUARDANDO/EM_BREVE → OPEN
      const cascadeResult = await tx.lot.updateMany({
        where: {
          auctionId,
          status: { in: [LotStatus.PENDING, 'EM_BREVE'] },
        },
        data: {
          status: LotStatus.OPEN,
          openedAt: now,
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_OPENED',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: {
          transition: 'SCHEDULED → OPEN',
          isAutomatic: parsed.data.isAutomatic,
          lotsOpened: cascadeResult.count,
        },
      });

      if (cascadeResult.count > 0) {
        await createStateAuditLog(tx as any, {
          entityType: 'AUCTION',
          entityId: auctionId,
          action: 'LOTS_CASCADE_OPEN',
          userId,
          tenantId,
          metadata: { lotsOpened: cascadeResult.count },
        });
      }

      logger.info(`[StateMachine] Leilão #${auctionId} aberto. ${cascadeResult.count} lotes sincronizados.`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // SCHEDULED → PENDING_VALIDATION (Retorno à validação)
  // ──────────────────────────────────────────────────────────────────────
  async returnToValidation(input: ReturnToValidationInput, user: UserWithPermissions): Promise<TransitionResult> {
    const parsed = ReturnToValidationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    if (!hasPermission(user, UserPermissionFlag.CAN_RETURN_TO_VALIDATION)) {
      return { success: false, error: AuctionErrorMessages.MISSING_PERMISSION_FLAG(UserPermissionFlag.CAN_RETURN_TO_VALIDATION) };
    }

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.PENDING_VALIDATION)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.PENDING_VALIDATION) };
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.PENDING_VALIDATION,
          openDate: null,
          validatedAt: null,
          validatedBy: null,
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_RETURNED_TO_VALIDATION',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: { transition: 'SCHEDULED → PENDING_VALIDATION' },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} retornado para validação por #${userId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // OPEN/IN_AUCTION → CLOSED (Encerrar leilão)
  // ──────────────────────────────────────────────────────────────────────
  async closeAuction(input: ForceCloseAuctionInput, user: UserWithPermissions): Promise<TransitionResult> {
    const parsed = ForceCloseAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    if (!hasPermission(user, UserPermissionFlag.CAN_CANCEL_OR_CLOSE)) {
      return { success: false, error: AuctionErrorMessages.INSUFFICIENT_PERMISSIONS };
    }

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
        include: {
          Lot: { select: { id: true, status: true } },
        },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      if (!isValidAuctionTransition(auction.status as AuctionStatusType, AuctionStatus.CLOSED)) {
        return { success: false, error: AuctionErrorMessages.INVALID_TRANSITION(auction.status, AuctionStatus.CLOSED) };
      }

      // Verificar se todos os lotes estão em estado terminal
      const lots = auction.Lot || [];
      const terminalStatuses = [LotStatus.CLOSED, LotStatus.CANCELLED, LotStatus.SOLD, LotStatus.UNSOLD, 'ENCERRADO'];
      const nonTerminalLots = lots.filter(
        (l: { status: string }) => !terminalStatuses.includes(l.status as LotStatusType)
      );

      if (nonTerminalLots.length > 0) {
        return { success: false, error: AuctionErrorMessages.LOTS_NOT_ALL_CLOSED };
      }

      // Verificar que pelo menos um lote está CLOSED (não todos cancelados)
      const closedLots = lots.filter(
        (l: { status: string }) => l.status === LotStatus.CLOSED || l.status === LotStatus.SOLD || l.status === LotStatus.UNSOLD || l.status === 'ENCERRADO'
      );
      if (closedLots.length === 0 && lots.length > 0) {
        return { success: false, error: AuctionErrorMessages.AT_LEAST_ONE_LOT_CLOSED };
      }

      const previousState = serializeAuction(auction);

      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_CLOSED',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: {
          transition: `${auction.status} → CLOSED`,
          lotsTotal: lots.length,
          lotsClosed: closedLots.length,
        },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} encerrado por #${userId}`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // QUALQUER (não-terminal) → CANCELLED
  // ──────────────────────────────────────────────────────────────────────
  async cancelAuction(input: CancelAuctionInput, user: UserWithPermissions): Promise<TransitionResult> {
    const parsed = CancelAuctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const auctionId = toBigInt(parsed.data.auctionId);
    const userId = toBigInt(parsed.data.userId);
    const tenantId = toBigInt(parsed.data.tenantId);

    if (!hasPermission(user, UserPermissionFlag.CAN_CANCEL_OR_CLOSE)) {
      return { success: false, error: AuctionErrorMessages.INSUFFICIENT_PERMISSIONS };
    }

    return prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findFirst({
        where: { id: auctionId, tenantId },
        include: {
          Lot: {
            select: { id: true, status: true },
          },
        },
      });

      if (!auction) {
        return { success: false, error: AuctionErrorMessages.NOT_FOUND };
      }

      // Verificar que não está em estado terminal
      if (isTerminalAuctionStatus(auction.status as AuctionStatusType)) {
        return { success: false, error: AuctionErrorMessages.CANNOT_CANCEL_TERMINAL };
      }

      const previousState = serializeAuction(auction);
      const now = new Date();

      // 1. Cancelar o leilão
      const updated = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.CANCELLED,
          cancelledAt: now,
          cancelledBy: userId,
          cancellationReason: parsed.data.cancellationReason,
        },
      });

      // 2. CASCATA: Cancelar TODOS os lotes não-terminais
      const terminalLotStatuses: LotStatusType[] = [LotStatus.CLOSED, LotStatus.CANCELLED];
      const lotIds = (auction.Lot || [])
        .filter((l: { status: string }) => !terminalLotStatuses.includes(l.status as LotStatusType))
        .map((l: { id: bigint }) => l.id);

      if (lotIds.length > 0) {
        await tx.lot.updateMany({
          where: { id: { in: lotIds } },
          data: {
            status: LotStatus.CANCELLED,
            lotClosedAt: now,
          },
        });

        // 3. CASCATA: Cancelar TODOS os lances ativos nesses lotes
        await tx.bid.updateMany({
          where: {
            lotId: { in: lotIds },
            status: BidStatus.ACTIVE,
          },
          data: {
            status: BidStatus.CANCELLED,
            cancelledAt: now,
          },
        });

        await createStateAuditLog(tx as any, {
          entityType: 'AUCTION',
          entityId: auctionId,
          action: 'LOTS_CASCADE_CANCEL',
          userId,
          tenantId,
          metadata: { lotsCancelled: lotIds.length },
        });

        await createStateAuditLog(tx as any, {
          entityType: 'AUCTION',
          entityId: auctionId,
          action: 'BIDS_CASCADE_CANCEL',
          userId,
          tenantId,
          metadata: { lotsAffected: lotIds.length },
        });
      }

      await createStateAuditLog(tx as any, {
        entityType: 'AUCTION',
        entityId: auctionId,
        action: 'AUCTION_CANCELLED',
        userId,
        tenantId,
        previousState,
        currentState: serializeAuction(updated),
        metadata: {
          transition: `${auction.status} → CANCELLED`,
          cancellationReason: parsed.data.cancellationReason,
          lotsCancelled: lotIds.length,
        },
      });

      logger.info(`[StateMachine] Leilão #${auctionId} cancelado por #${userId}. ${lotIds.length} lotes afetados.`);

      return { success: true, data: updated };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // CRON JOB: Abrir leilões agendados cuja openDate chegou
  // ──────────────────────────────────────────────────────────────────────
  async processScheduledAuctions(tenantId?: bigint): Promise<{ opened: number; errors: string[] }> {
    const now = new Date();
    const errors: string[] = [];
    let opened = 0;

    const whereClause: Prisma.AuctionWhereInput = {
      status: AuctionStatus.SCHEDULED as any,
      openDate: { lte: now },
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const auctions = await prisma.auction.findMany({
      where: whereClause,
      select: { id: true, tenantId: true },
    });

    for (const auction of auctions) {
      const result = await this.openAuction({
        auctionId: auction.id.toString(),
        tenantId: auction.tenantId.toString(),
        isAutomatic: true,
      });

      if (result.success) {
        opened++;
      } else {
        errors.push(`Leilão #${auction.id}: ${result.error}`);
        logger.error(`[StateMachine:Cron] Falha ao abrir leilão #${auction.id}: ${result.error}`);
      }
    }

    logger.info(`[StateMachine:Cron] Processados ${auctions.length} leilões agendados. ${opened} abertos.`);

    return { opened, errors };
  }

  // ──────────────────────────────────────────────────────────────────────
  // AUTOMATICO: Verificar se leilão deve mudar para IN_AUCTION
  // ──────────────────────────────────────────────────────────────────────
  async syncAuctionWithLots(auctionId: bigint, tenantId: bigint, userId: bigint): Promise<void> {
    const auction = await prisma.auction.findFirst({
      where: { id: auctionId, tenantId },
      include: { Lot: { select: { id: true, status: true } } },
    });

    if (!auction) return;

    const lots = auction.Lot || [];
    const currentStatus = auction.status as AuctionStatusType;

    // Se algum lote está EM_PREGAO e leilão está OPEN → mudar para IN_AUCTION
    const lotsInAuction = lots.filter((l: { status: string }) => l.status === LotStatus.IN_AUCTION);
    if (currentStatus === AuctionStatus.OPEN && lotsInAuction.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.IN_AUCTION },
        });
        await createStateAuditLog(tx as any, {
          entityType: 'AUCTION',
          entityId: auctionId,
          action: 'AUCTION_IN_AUCTION',
          userId,
          tenantId,
          metadata: { transition: 'OPEN → IN_AUCTION', lotsInAuction: lotsInAuction.length },
        });
      });
      return;
    }

    // Se nenhum lote em EM_PREGAO e leilão está IN_AUCTION → voltar para OPEN
    if (currentStatus === AuctionStatus.IN_AUCTION && lotsInAuction.length === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.auction.update({
          where: { id: auctionId },
          data: { status: AuctionStatus.OPEN },
        });
        await createStateAuditLog(tx as any, {
          entityType: 'AUCTION',
          entityId: auctionId,
          action: 'AUCTION_OPENED',
          userId,
          tenantId,
          metadata: { transition: 'IN_AUCTION → OPEN', reason: 'Nenhum lote em pregão' },
        });
      });
    }
  }
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function toBigInt(value: string | bigint): bigint {
  return typeof value === 'string' ? BigInt(value) : value;
}

function hasPermission(user: UserWithPermissions, flag: UserPermissionFlagType): boolean {
  return user.permissions?.includes(flag) ?? false;
}

function serializeAuction(auction: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(auction, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Singleton export
export const auctionStateMachine = new AuctionStateMachineService();
