
export interface Bid {
  bidder: string;
  amount: number;
  timestamp: Date;
}

export interface AuctionStage {
  name: string; // ex: "1ª Praça"
  endDate: Date;
  statusText?: string; // ex: "Encerramento"
}

export type AuctionStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO';

export interface Auction {
  id: string;
  title: string; // Título principal do item, ex: "Direitos Apartamento A.T. 49,15m²..."
  fullTitle?: string; // Título completo do leilão, ex: "Leilão Tribunal de Justiça SP"
  description: string;
  imageUrl: string;
  dataAiHint?: string;
  auctioneerLogoUrl?: string; // Logo do comitente
  auctioneerName?: string; // Nome do comitente/leiloeiro, ex: "Bomvalor Judicial"
  category: string; // Categoria do item (será traduzida)
  initialOffer: number; // Oferta Inicial
  auctionStages: AuctionStage[];
  status: AuctionStatus; // Status do leilão
  seller: string; // Pode ser o comitente ou um vendedor específico
  location?: string; // Localização do item
  condition?: 'Novo' | 'Usado - Como Novo' | 'Usado - Bom' | 'Usado - Regular' | 'Apenas Peças'; // Condição (traduzida)
  isFavorite?: boolean; // Para o ícone de favoritos
  currentBid?: number; // Mantido para compatibilidade, mas o card usará initialOffer
  endDate?: Date; // Mantido para compatibilidade, fim do leilão geral (última praça)
  bidsCount?: number; // Contagem de lances
}
