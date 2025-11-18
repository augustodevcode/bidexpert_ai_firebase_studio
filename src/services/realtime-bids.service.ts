// src/services/realtime-bids.service.ts
import { EventEmitter } from 'events';
import logger from '@/lib/logger';

export interface BidEvent {
  lotId: bigint;
  amount: number;
  bidderId: bigint;
  bidderDisplay: string;
  timestamp: Date;
  tenantId: bigint;
  auctionId: bigint;
}

export interface SoftCloseEvent {
  lotId: bigint;
  auctionId: bigint;
  minutesRemaining: number;
  timestamp: Date;
}

class BidEventEmitter extends EventEmitter {
  private static instance: BidEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(1000);
  }

  static getInstance(): BidEventEmitter {
    if (!BidEventEmitter.instance) {
      BidEventEmitter.instance = new BidEventEmitter();
    }
    return BidEventEmitter.instance;
  }

  emitBid(event: BidEvent): void {
    try {
      this.emit(`bid:${event.lotId}`, event);
      this.emit(`bid:tenant:${event.tenantId}`, event);
      this.emit(`bid:auction:${event.auctionId}`, event);
      logger.info('[BidEvent]', { lotId: event.lotId.toString(), amount: event.amount });
    } catch (e) {
      logger.error('[BidEvent Error]', { error: String(e) });
    }
  }

  emitSoftClose(event: SoftCloseEvent): void {
    try {
      this.emit(`softclose:${event.lotId}`, event);
      logger.info('[SoftCloseEvent]', { lotId: event.lotId.toString(), minutesRemaining: event.minutesRemaining });
    } catch (e) {
      logger.error('[SoftCloseEvent Error]', { error: String(e) });
    }
  }

  onBid(lotId: bigint, callback: (event: BidEvent) => void): void {
    this.on(`bid:${lotId}`, callback);
  }

  onBidForTenant(tenantId: bigint, callback: (event: BidEvent) => void): void {
    this.on(`bid:tenant:${tenantId}`, callback);
  }

  onBidForAuction(auctionId: bigint, callback: (event: BidEvent) => void): void {
    this.on(`bid:auction:${auctionId}`, callback);
  }

  onSoftClose(lotId: bigint, callback: (event: SoftCloseEvent) => void): void {
    this.on(`softclose:${lotId}`, callback);
  }

  removeBidListener(lotId: bigint, callback?: (event: BidEvent) => void): void {
    if (callback) {
      this.off(`bid:${lotId}`, callback);
    } else {
      this.removeAllListeners(`bid:${lotId}`);
    }
  }

  removeSoftCloseListener(lotId: bigint, callback?: (event: SoftCloseEvent) => void): void {
    if (callback) {
      this.off(`softclose:${lotId}`, callback);
    } else {
      this.removeAllListeners(`softclose:${lotId}`);
    }
  }

  getListenerCount(eventType: 'bid' | 'softclose', id: bigint): number {
    const key = eventType === 'bid' ? `bid:${id}` : `softclose:${id}`;
    return this.listenerCount(key);
  }
}

export const bidEventEmitter = BidEventEmitter.getInstance();
