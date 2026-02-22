/**
 * @fileoverview Motor de Lances V2 — Idempotência, Optimistic Locking, Auto-Bid Trigger,
 * Soft-Close e suporte a Venda Direta / Lance Condicional.
 *
 * Este service substitui a lógica de `placeBid()` do LotService, adicionando:
 *  - Idempotência via SHA-256 (SERVER_HASH) ou UUID do cliente (CLIENT_UUID)
 *  - Optimistic Locking: `WHERE price = :expectedPrice` dentro da transação
 *  - Trigger automático de auto-bid (proxy bidding) após cada lance manual
 *  - Soft-close: extensão de prazo se lance chegar nos últimos N minutos
 *  - Broadcast via bidEventEmitter → Socket.io bridge
 *  - Audit trail completo (ip, userAgent, clientTimestamp, bidOrigin)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { bidEventEmitter } from '@/services/realtime-bids.service';
import { AutoBidService } from '@/services/auto-bid.service';
import logger from '@/lib/logger';
import { z } from 'zod';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const PlaceBidInputSchema = z.object({
  lotId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().positive('Valor do lance deve ser positivo').max(999_999_999, 'Valor excede o limite máximo'),
  bidderDisplay: z.string().optional(),
  /** Alias pseudônimo para exibição pública no monitor (ex: "Arrematante 7F3A") */
  bidderAlias: z.string().max(64).optional(),
  /** Se AUTO_BID, PROXY, ou API — default MANUAL */
  bidOrigin: z.enum(['MANUAL', 'AUTO_BID', 'PROXY', 'API']).default('MANUAL'),
  /** UUID v4 enviado pelo cliente (idempotencyStrategy = CLIENT_UUID) */
  clientIdempotencyKey: z.string().max(128).optional(),
  /** Timestamp ISO do cliente para drift detection */
  clientTimestamp: z.string().datetime().optional(),
});

export type PlaceBidInput = z.infer<typeof PlaceBidInputSchema>;

export interface BidAuditContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface PlaceBidResult {
  success: boolean;
  message: string;
  currentBid?: number;
  bidId?: string;
  idempotencyKey?: string;
  /** Se true, o lance foi deduplicated (já existia) */
  deduplicated?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class BidEngineV2 {
  private autoBidService: AutoBidService;

  constructor() {
    this.autoBidService = new AutoBidService();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async placeBid(
    input: PlaceBidInput,
    audit: BidAuditContext = {},
    /** Estratégia de idempotência lida da config do admin */
    idempotencyStrategy: 'SERVER_HASH' | 'CLIENT_UUID' = 'SERVER_HASH',
  ): Promise<PlaceBidResult> {
    // 1. Zod validation
    const parsed = PlaceBidInputSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join('; ');
      return { success: false, message: `Validação falhou: ${msg}` };
    }
    const data = parsed.data;

    // 2. Resolve lot internal id (supports publicId pattern)
    const internalLotId = await this.resolveLotId(data.lotId);
    if (!internalLotId) {
      return { success: false, message: 'Lote não encontrado.' };
    }

    // 3. Load lot + auction in single query
    const lot = await prisma.lot.findUnique({
      where: { id: internalLotId },
      select: {
        id: true, price: true, bidsCount: true, status: true, auctionId: true,
        bidIncrementStep: true, endDate: true, tenantId: true, saleMode: true,
        reservePrice: true,
      },
    });
    if (!lot) return { success: false, message: 'Lote não encontrado.' };
    if (lot.status !== 'ABERTO_PARA_LANCES' && lot.status !== 'EM_PREGAO') {
      return { success: false, message: 'Este lote não está aberto para lances.' };
    }

    // 4. Validate auction status
    const auction = await prisma.auction.findUnique({ where: { id: lot.auctionId } });
    const auctionOpen = auction && (auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO');
    if (!auctionOpen) return { success: false, message: 'Leilão não está ativo.' };

    // 5. Amount validation (must be > current price if bids exist)
    const hasBids = (lot.bidsCount ?? 0) > 0;
    const currentPrice = Number(lot.price);
    if (hasBids && data.amount <= currentPrice) {
      return { success: false, message: `Lance deve ser maior que ${currentPrice}.` };
    }

    // Validate increment step
    const step = Number(lot.bidIncrementStep) || 0;
    if (step > 0 && hasBids && (data.amount - currentPrice) < step) {
      return { success: false, message: `Incremento mínimo é ${step}. Lance mínimo aceitável: ${currentPrice + step}.` };
    }

    // 6. Build idempotency key
    const idempKey = this.buildIdempotencyKey(
      idempotencyStrategy,
      internalLotId.toString(),
      data.userId,
      data.amount,
      data.clientIdempotencyKey,
    );

    // 7. Dedup check
    if (idempKey) {
      const existing = await prisma.bid.findFirst({
        where: { idempotencyKey: idempKey, tenantId: lot.tenantId },
        select: { id: true, amount: true },
      });
      if (existing) {
        logger.info('[BidEngineV2] Lance deduplicado', { idempKey, bidId: existing.id.toString() });
        return {
          success: true,
          message: 'Lance já registrado (deduplicated).',
          currentBid: Number(existing.amount),
          bidId: existing.id.toString(),
          idempotencyKey: idempKey,
          deduplicated: true,
        };
      }
    }

    // 8. Optimistic locking transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Re-read lot inside transaction with row-level lock intent
        const freshLot = await tx.lot.findUnique({
          where: { id: internalLotId },
          select: { id: true, price: true, bidsCount: true, status: true },
        });
        if (!freshLot || (freshLot.status !== 'ABERTO_PARA_LANCES' && freshLot.status !== 'EM_PREGAO')) {
          throw new Error('RACE:LOT_CLOSED');
        }
        const freshPrice = Number(freshLot.price);
        if ((freshLot.bidsCount ?? 0) > 0 && data.amount <= freshPrice) {
          throw new Error(`RACE:PRICE_CHANGED:${freshPrice}`);
        }

        // Create bid
        const bid = await tx.bid.create({
          data: {
            Lot: { connect: { id: internalLotId } },
            Auction: { connect: { id: lot.auctionId } },
            User: { connect: { id: BigInt(data.userId) } },
            Tenant: { connect: { id: lot.tenantId } },
            amount: new Prisma.Decimal(data.amount),
            bidderDisplay: data.bidderDisplay || null,
            bidderAlias: data.bidderAlias || null,
            bidOrigin: data.bidOrigin as any,
            isAutoBid: data.bidOrigin === 'AUTO_BID' || data.bidOrigin === 'PROXY',
            idempotencyKey: idempKey || null,
            clientTimestamp: data.clientTimestamp ? new Date(data.clientTimestamp) : null,
            ipAddress: audit.ipAddress || null,
            userAgent: audit.userAgent?.substring(0, 512) || null,
          },
          select: { id: true, amount: true, bidderId: true, bidderDisplay: true, timestamp: true },
        });

        // Optimistic locking update: only succeed if price matches what we read
        const updated = await tx.lot.updateMany({
          where: {
            id: internalLotId,
            price: new Prisma.Decimal(freshPrice),
          },
          data: {
            price: new Prisma.Decimal(data.amount),
            bidsCount: { increment: 1 },
            winnerId: BigInt(data.userId),
            updatedAt: new Date(),
          },
        });

        if (updated.count === 0) {
          throw new Error('RACE:OPTIMISTIC_LOCK_FAILED');
        }

        // Log idempotency
        if (idempKey) {
          await tx.bidIdempotencyLog.create({
            data: {
              idempotencyKey: idempKey,
              tenantId: lot.tenantId,
              lotId: internalLotId,
              bidderId: BigInt(data.userId),
              bidId: bid.id,
              status: 'PROCESSED',
            },
          });
        }

        return bid;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      });

      // 9. Post-transaction: emit event for Socket.io bridge
      try {
        bidEventEmitter.emitBid({
          lotId: internalLotId,
          amount: data.amount,
          bidderId: BigInt(data.userId),
          bidderDisplay: data.bidderDisplay || data.bidderAlias || 'Anônimo',
          timestamp: result.timestamp,
          tenantId: lot.tenantId,
          auctionId: lot.auctionId,
        });
      } catch (e) {
        logger.warn('[BidEngineV2] Falha ao emitir evento realtime', { error: String(e) });
      }

      // 10. Trigger auto-bid (async, non-blocking)
      if (data.bidOrigin === 'MANUAL' || data.bidOrigin === 'API') {
        this.triggerAutoBid(internalLotId.toString(), data.amount, data.userId).catch(err => {
          logger.warn('[BidEngineV2] Auto-bid trigger failed', { error: String(err) });
        });
      }

      // 11. Check soft-close
      this.checkSoftClose(lot, data.amount).catch(err => {
        logger.warn('[BidEngineV2] Soft-close check failed', { error: String(err) });
      });

      // 12. Audit log
      logger.info('[BidEngineV2] Lance registrado', {
        bidId: result.id.toString(),
        lotId: internalLotId.toString(),
        amount: data.amount,
        userId: data.userId,
        origin: data.bidOrigin,
        idempKey,
        ip: audit.ipAddress,
      });

      return {
        success: true,
        message: 'Lance realizado com sucesso!',
        currentBid: data.amount,
        bidId: result.id.toString(),
        idempotencyKey: idempKey || undefined,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      if (msg.startsWith('RACE:PRICE_CHANGED:')) {
        const newPrice = msg.split(':')[2];
        return { success: false, message: `Outro lance foi registrado. Preço atual: ${newPrice}. Tente novamente.` };
      }
      if (msg === 'RACE:OPTIMISTIC_LOCK_FAILED') {
        return { success: false, message: 'Conflito de concorrência. Atualize a tela e tente novamente.' };
      }
      if (msg === 'RACE:LOT_CLOSED') {
        return { success: false, message: 'Lote foi encerrado durante sua tentativa.' };
      }

      logger.error('[BidEngineV2] Erro ao registrar lance', { error: msg, lotId: data.lotId });
      return { success: false, message: `Erro ao registrar lance: ${msg}` };
    }
  }

  // -----------------------------------------------------------------------
  // Idempotency
  // -----------------------------------------------------------------------

  private buildIdempotencyKey(
    strategy: 'SERVER_HASH' | 'CLIENT_UUID',
    lotId: string,
    userId: string,
    amount: number,
    clientKey?: string,
  ): string | null {
    if (strategy === 'CLIENT_UUID' && clientKey) {
      return clientKey;
    }
    // SERVER_HASH: SHA-256(lotId + userId + amount + timestamp_window_10s)
    const timeWindow = Math.floor(Date.now() / 10_000); // 10-second window
    const payload = `${lotId}:${userId}:${amount}:${timeWindow}`;
    return createHash('sha256').update(payload).digest('hex').substring(0, 64);
  }

  // -----------------------------------------------------------------------
  // Auto-bid trigger
  // -----------------------------------------------------------------------

  private async triggerAutoBid(lotId: string, currentAmount: number, currentBidderId: string): Promise<void> {
    try {
      const triggered = await this.autoBidService.checkAndPlaceAutoBids(lotId, currentAmount, currentBidderId);
      if (triggered) {
        logger.info('[BidEngineV2] Auto-bid triggered', { lotId, afterAmount: currentAmount });
      }
    } catch (e) {
      logger.error('[BidEngineV2] Auto-bid error', { error: String(e) });
    }
  }

  // -----------------------------------------------------------------------
  // Soft-close
  // -----------------------------------------------------------------------

  private async checkSoftClose(
    lot: { id: bigint; endDate: Date | null; auctionId: bigint; tenantId: bigint },
    bidAmount: number,
  ): Promise<void> {
    if (!lot.endDate) return;

    // Load platform settings for soft close config
    const settings = await prisma.platformSettings.findFirst({
      where: { tenantId: lot.tenantId },
      select: {
        RealtimeSettings: { select: { softCloseEnabled: true, softCloseMinutes: true } },
        BiddingSettings: { select: { softCloseTriggerMinutes: true } },
      },
    });

    const softCloseEnabled = settings?.RealtimeSettings?.softCloseEnabled ?? false;
    if (!softCloseEnabled) return;

    const triggerMinutes = settings?.BiddingSettings?.softCloseTriggerMinutes ?? 3;
    const extensionMinutes = settings?.RealtimeSettings?.softCloseMinutes ?? 5;

    const now = new Date();
    const timeUntilEnd = lot.endDate.getTime() - now.getTime();
    const triggerMs = triggerMinutes * 60 * 1000;

    if (timeUntilEnd > 0 && timeUntilEnd <= triggerMs) {
      const newEndDate = new Date(lot.endDate.getTime() + extensionMinutes * 60 * 1000);
      await prisma.lot.update({
        where: { id: lot.id },
        data: { endDate: newEndDate, updatedAt: new Date() },
      });

      logger.info('[BidEngineV2] Soft-close extended', {
        lotId: lot.id.toString(),
        newEndDate: newEndDate.toISOString(),
        extensionMinutes,
      });

      // Emit soft-close event for UI
      bidEventEmitter.emitSoftClose({
        lotId: lot.id,
        auctionId: lot.auctionId,
        minutesRemaining: extensionMinutes,
        timestamp: now,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private async resolveLotId(lotIdOrPublicId: string): Promise<bigint | null> {
    // Try as BigInt first
    try {
      const id = BigInt(lotIdOrPublicId);
      const exists = await prisma.lot.findUnique({ where: { id }, select: { id: true } });
      if (exists) return id;
    } catch {
      // Not a number, try publicId
    }
    const lot = await prisma.lot.findUnique({
      where: { publicId: lotIdOrPublicId },
      select: { id: true },
    });
    return lot?.id ?? null;
  }
}

// Singleton
export const bidEngineV2 = new BidEngineV2();
