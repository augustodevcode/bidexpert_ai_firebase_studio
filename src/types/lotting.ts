// src/types/lotting.ts
import type { Asset, LotStatus } from '@/types';

export type LottingFilterState = {
  judicialProcessId?: string;
  auctionId?: string;
  includeGroupedAssets?: boolean;
  onlyHighlighted?: boolean;
  minimumValuation?: number;
};

export type LottingKpi = {
  id: string;
  label: string;
  value: string;
  helperText?: string;
  trend?: number;
};

export type LottingLotSummary = {
  id: string;
  title: string;
  status: LotStatus;
  assetCount: number;
  valuation: number;
  number?: string | null;
  auctionTitle?: string | null;
  auctionId?: string | null;
  updatedAt?: string;
};

export type LottingAlertSeverity = 'low' | 'medium' | 'high';

export type LottingAlert = {
  id: string;
  title: string;
  description: string;
  severity: LottingAlertSeverity;
  relatedProcessNumber?: string | null;
  dueDate?: string | null;
};

export type LottingSnapshot = {
  assets: Asset[];
  groupedLots: LottingLotSummary[];
  kpis: LottingKpi[];
  alerts: LottingAlert[];
};
