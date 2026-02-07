/**
 * @fileoverview Service de lances com validação Zod, audit trail e proteção contra
 * valores inválidos. Todo lance é validado antes da persistência e logado para auditoria.
 */
import { BidRepository } from '@/repositories/bid.repository';
import type { Prisma, Bid } from '@prisma/client';
import { bidEventEmitter } from '@/services/realtime-bids.service';
import logger from '@/lib/logger';
import { z } from 'zod';

/** GAP-FIX: Schema Zod para validação de lance antes de persistir */
const BidAmountSchema = z.object({
  amount: z.number().positive('Valor do lance deve ser positivo').max(999999999, 'Valor excede o limite máximo'),
});

/** GAP-FIX: Metadados de auditoria para cada lance */
export interface BidAuditMetadata {
  ip?: string;
  userAgent?: string;
  clientTimestamp?: number;
  sessionId?: string;
}

export class BidService {
  private repository: BidRepository;

  constructor() {
    this.repository = new BidRepository();
  }

  async createBid(data: Prisma.BidCreateInput, auditMetadata?: BidAuditMetadata): Promise<Bid> {
    // GAP-FIX: Validação Zod no service layer
    const amountValue = typeof data.amount === 'object' ? Number(data.amount) : Number(data.amount);
    const validation = BidAmountSchema.safeParse({ amount: amountValue });
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(e => e.message).join(', ');
      logger.error('[BidService] Validação de lance falhou', { errors: errorMsg, amount: amountValue });
      throw new Error(`Validação de lance falhou: ${errorMsg}`);
    }

    const bid = await this.repository.create(data);

    // GAP-FIX: Audit Trail completo com IP, user-agent, timestamp diff
    const serverTimestamp = Date.now();
    const timestampDiff = auditMetadata?.clientTimestamp 
      ? Math.abs(serverTimestamp - auditMetadata.clientTimestamp) 
      : null;

    logger.info('[BidService] Lance criado com audit trail', {
      bidId: bid.id?.toString(),
      lotId: bid.lotId?.toString(),
      amount: Number(bid.amount),
      bidderId: bid.bidderId?.toString(),
      ip: auditMetadata?.ip || 'N/A',
      userAgent: auditMetadata?.userAgent || 'N/A',
      clientTimestamp: auditMetadata?.clientTimestamp || 'N/A',
      serverTimestamp,
      timestampDiff: timestampDiff !== null ? `${timestampDiff}ms` : 'N/A',
      sessionId: auditMetadata?.sessionId || 'N/A',
    });

    if (timestampDiff !== null && timestampDiff > 100) {
      logger.warn('[BidService] Timestamp drift > 100ms detectado', { 
        diff: timestampDiff, 
        bidId: bid.id?.toString() 
      });
    }

    try {
      bidEventEmitter.emitBid({
        lotId: bid.lotId,
        amount: Number(bid.amount),
        bidderId: bid.bidderId,
        bidderDisplay: bid.bidderDisplay || 'Anônimo',
        timestamp: bid.timestamp,
        tenantId: bid.tenantId,
        auctionId: bid.auctionId,
      });
    } catch (e) {
      logger.warn('[BidService] Falha ao emitir evento realtime:', { error: String(e) });
    }
    return bid;
  }

  async deleteMany(where: Prisma.BidWhereInput): Promise<Prisma.BatchPayload> {
    return this.repository.deleteMany(where);
  }

  async countBids(): Promise<number> {
    return this.repository.count();
  }
}
