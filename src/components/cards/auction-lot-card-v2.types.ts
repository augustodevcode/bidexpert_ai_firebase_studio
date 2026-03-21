/**
 * Types for the V2 Auction Lot Card component.
 * Maps Prisma models (Lot, Auction, AuctionStage, Seller, LotCategory)
 * into a display-ready shape consumed by AuctionLotCardV2.
 */

export type AuctionCategory =
  | 'Judicial'
  | 'Extrajudicial'
  | 'Venda Direta'
  | 'Tomada de Preços';

export type StageStatus = 'Em Andamento' | 'Encerrada' | 'Aguardando';

export interface StageInfo {
  name: string;
  status: StageStatus;
  date: string;
}

export interface AuctionItemStats {
  visits: number;
  qualified: number;
  clicks: number;
}

export interface AuctionItemPricing {
  minimumBid: number;
  evaluation: number;
  discountPercentage?: number;
  increment?: number;
}

export interface AuctionItemTimeline {
  stage1: StageInfo;
  stage2?: StageInfo;
  timeRemaining: string;
}

export interface Comitente {
  name: string;
  logo: string;
  url: string;
}

export interface AuctionItem {
  id: string;
  category: AuctionCategory;
  type: string;
  location: string;
  title: string;
  specs: string[];
  processNumber?: string;
  stats: AuctionItemStats;
  pricing: AuctionItemPricing;
  timeline: AuctionItemTimeline;
  images: string[];
  isLive: boolean;
  isOpen: boolean;
  comitente?: Comitente;
}
