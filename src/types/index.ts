
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

export type AuctionStatus = 'EM_BREVE' | 'ABERTO_PARA_LANCES' | 'ENCERRADO' | 'FINALIZADO' | 'ABERTO'; // Adicionado 'ABERTO'
export type LotStatus = 'ABERTO_PARA_LANCES' | 'EM_BREVE' | 'ENCERRADO' | 'VENDIDO' | 'NAO_VENDIDO';


export interface Lot {
  id: string; // e.g., Lote 1, Lote 2
  auctionId: string; // ID do leilão ao qual pertence
  title: string; // e.g., "CASA COM 129,30 M² - CENTRO"
  imageUrl: string;
  dataAiHint?: string;
  status: LotStatus;
  location: string; // e.g., "TEOTÔNIO VILELA - AL"
  type: string; // e.g., "CASA", "APARTAMENTO"
  views: number;
  auctionName: string; // e.g., "Leilão Único"
  price: number;
  endDate: Date;
  bidsCount: number;
  isFavorite?: boolean;
  description?: string; // Descrição mais detalhada para um possível modal/página de detalhe do lote
}

export interface Auction {
  id: string; // ID do Leilão Principal, ex: "100625bra"
  title: string; // Título principal do leilão, ex: "Leilão 100625bra" (pode ser o ID ou um nome)
  fullTitle?: string; // Título completo do leilão, ex: "Leilão do Bradesco Imóveis Residenciais"
  auctionDate: Date; // Data e hora do leilão principal
  totalLots: number;
  status: AuctionStatus; // Status do leilão principal
  auctioneer: string; // Leiloeiro: VICENTE PAULO - JUCEMA N° 12/96
  category: string; // Categoria: Extrajudicial
  auctioneerLogoUrl?: string; // URL do logo do leiloeiro (Bradesco no exemplo)
  visits?: number;
  lots: Lot[]; // Lista de lotes pertencentes a este leilão

  // Campos antigos que podem ser reutilizados ou adaptados:
  description?: string; // Descrição geral do leilão, se houver
  imageUrl?: string; // Imagem principal do leilão (se aplicável, talvez o logo do leiloeiro)
  dataAiHint?: string; // Para imagem principal do leilão
  seller?: string; // Nome do vendedor/comitente principal
  initialOffer?: number; // Pode não ser aplicável no nível do leilão se os lotes têm seus próprios preços
  auctionStages?: AuctionStage[]; // Praças do leilão principal, se houver
  isFavorite?: boolean; // Para favoritar o leilão inteiro
  currentBid?: number;
  endDate?: Date; // Data de encerramento geral do leilão (último lote)
  bidsCount?: number; // Total de lances em todos os lotes
}
