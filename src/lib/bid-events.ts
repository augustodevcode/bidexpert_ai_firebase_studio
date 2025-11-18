// (B) WEBSOCKET DE LANCES + SOFT CLOSE CONFIGURÁVEL (#11/#21)
import { EventEmitter } from 'events';

export interface BidEventData {
  auctionId: string;
  lotId: string;
  bidderId: string;
  bidAmount: number;
  bidTime: Date;
  isAutomatic: boolean;
}

export interface SoftCloseConfig {
  enabled: boolean;
  triggerThresholdMinutes: number; // Em quantos minutos antes do fim ativar soft close
  extensionMinutes: number; // Quantos minutos adicionar quando há lance nos últimos X minutos
  maxExtensions: number; // Máximo de extensões permitidas
}

export interface AuctionLot {
  lotId: string;
  auctionId: string;
  scheduledEndTime: Date;
  softCloseConfig: SoftCloseConfig;
  currentBid: number;
  currentBidder: string;
  bidsCount: number;
  extensionCount: number;
}

class BidEventBroadcaster extends EventEmitter {
  private activeAuctions: Map<string, AuctionLot> = new Map();
  private bidTimers: Map<string, NodeJS.Timeout> = new Map();

  emitNewBid(data: BidEventData): void {
    this.emit('bid:placed', data);
    this.handleSoftClose(data.lotId);
  }

  emitAuctionStart(auctionId: string, lots: AuctionLot[]): void {
    lots.forEach(lot => this.activeAuctions.set(lot.lotId, lot));
    this.emit('auction:started', { auctionId, lotCount: lots.length });
  }

  emitAuctionClose(lotId: string): void {
    this.activeAuctions.delete(lotId);
    this.clearBidTimer(lotId);
    this.emit('auction:closed', { lotId });
  }

  private handleSoftClose(lotId: string): void {
    const lot = this.activeAuctions.get(lotId);
    if (!lot || !lot.softCloseConfig.enabled) return;

    const now = new Date();
    const timeUntilEnd = lot.scheduledEndTime.getTime() - now.getTime();
    const triggerMs = lot.softCloseConfig.triggerThresholdMinutes * 60 * 1000;

    // Se há menos de X minutos para terminar
    if (timeUntilEnd <= triggerMs && timeUntilEnd > 0) {
      // Estender se não atingiu limite
      if (lot.extensionCount < lot.softCloseConfig.maxExtensions) {
        const newEndTime = new Date(lot.scheduledEndTime.getTime() + lot.softCloseConfig.extensionMinutes * 60 * 1000);
        lot.scheduledEndTime = newEndTime;
        lot.extensionCount++;
        
        this.emit('softclose:extended', {
          lotId,
          newEndTime,
          extensionCount: lot.extensionCount,
        });
      } else {
        // Encerrar leilão
        this.emitAuctionClose(lotId);
      }
    }

    // Agendar verificação próxima
    this.clearBidTimer(lotId);
    const nextCheckMs = Math.max(1000, timeUntilEnd - triggerMs);
    const timer = setTimeout(() => {
      this.handleSoftClose(lotId);
    }, nextCheckMs);
    this.bidTimers.set(lotId, timer);
  }

  private clearBidTimer(lotId: string): void {
    const timer = this.bidTimers.get(lotId);
    if (timer) {
      clearTimeout(timer);
      this.bidTimers.delete(lotId);
    }
  }

  getSoftCloseStatus(lotId: string) {
    return this.activeAuctions.get(lotId);
  }

  getActiveAuctions() {
    return Array.from(this.activeAuctions.values());
  }
}

export const bidEventEmitter = new BidEventBroadcaster();
