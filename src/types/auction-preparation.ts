import type { Auction } from '@/types';

export type AssetSourceType = 'PROCESS' | 'CONSIGNOR';

export interface AuctionPreparationAssetSummary {
  id: string;
  title: string;
  categoryName?: string;
  evaluationValue?: number | null;
  status: string;
  sellerName?: string | null;
  judicialProcessNumber?: string | null;
  source: AssetSourceType;
  locationLabel?: string | null;
  createdAt?: string;
}

export interface AuctionPreparationHabilitation {
  userId: string;
  userName: string;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface AuctionPreparationBid {
  id: string;
  lotId: string;
  lotTitle: string;
  lotNumber?: string | null;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
}

export interface AuctionPreparationInstallment {
  id: string;
  amount: number;
  dueDate: string;
  paymentDate?: string | null;
  status: string;
}

export interface AuctionPreparationWin {
  id: string;
  lotId: string;
  lotTitle: string;
  lotNumber?: string | null;
  userId: string;
  userName: string;
  value: number;
  paymentStatus: string;
  winDate: string;
  installments: AuctionPreparationInstallment[];
}

export interface AuctionPreparationData {
  auction: Auction;
  availableAssets: AuctionPreparationAssetSummary[];
  habilitations: AuctionPreparationHabilitation[];
  bids: AuctionPreparationBid[];
  userWins: AuctionPreparationWin[];
}
