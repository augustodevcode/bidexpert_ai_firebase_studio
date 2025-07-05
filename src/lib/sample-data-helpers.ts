// src/lib/sample-data-helpers.ts
import type { Lot, LotCategory, UserDocumentStatus, UserHabilitationStatus, PaymentStatus, LotStatus, DirectSaleOfferStatus, AuctionStatus, PlatformSettings, Auction, AuctionStage } from '@/types';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';
import { isPast } from 'date-fns';

// ============================================================================
// PURE HELPER FUNCTIONS (CLIENT & SERVER SAFE)
// ============================================================================
export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '') 
    .replace(/--+/g, '-'); 
};


export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus | PaymentStatus | DirectSaleOfferStatus | string | undefined ): string => {
  if (!status) return 'Status Desconhecido';
  switch (status) {
    case 'ABERTO_PARA_LANCES': return 'Aberto para Lances';
    case 'EM_BREVE': return 'Em Breve';
    case 'ENCERRADO': return 'Encerrado';
    case 'FINALIZADO': return 'Finalizado';
    case 'ABERTO': return 'Aberto';
    case 'CANCELADO': return 'Cancelado';
    case 'SUSPENSO': return 'Suspenso';
    case 'VENDIDO': return 'Vendido';
    case 'NAO_VENDIDO': return 'Não Vendido';
    case 'NOT_SENT': return 'Não Enviado';
    case 'SUBMITTED': return 'Enviado';
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Rejeitado';
    case 'PENDING_ANALYSIS': return 'Em Análise';
    case 'PENDING_DOCUMENTS': return 'Documentação Pendente';
    case 'HABILITADO': return 'Habilitado para Dar Lances'; 
    case 'REJECTED_DOCUMENTS': return 'Documentos Rejeitados';
    case 'BLOCKED': return 'Conta Bloqueada';
    case 'ACTIVE': return 'Ativa'; 
    case 'SOLD': return 'Vendido'; 
    case 'EXPIRED': return 'Expirada'; 
    case 'PENDING_APPROVAL': return 'Pendente Aprovação';
    case 'RASCUNHO': return 'Rascunho';
    case 'EM_PREPARACAO': return 'Em Preparação';
    case 'PENDENTE': return 'Pendente';
    case 'PROCESSANDO': return 'Processando';
    case 'PAGO': return 'Pago';
    case 'FALHOU': return 'Falhou';
    case 'REEMBOLSADO': return 'Reembolsado';
    default: {
      if (typeof status === 'string') {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Status Desconhecido';
    }
  }
};

export const getLotStatusColor = (status: LotStatus | DirectSaleOfferStatus): string => {
  switch (status) {
    case 'ABERTO_PARA_LANCES':
    case 'ACTIVE': 
      return 'bg-green-600 text-white';
    case 'EM_BREVE':
    case 'PENDING_APPROVAL': 
      return 'bg-blue-500 text-white';
    case 'ENCERRADO':
    case 'VENDIDO':
    case 'NAO_VENDIDO':
    case 'SOLD': 
    case 'EXPIRED': 
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-300 text-gray-800';
  }
};

export const getAuctionStatusColor = (status: AuctionStatus | undefined): string => {
  if (!status) return 'bg-gray-400 text-gray-800';
  switch (status) {
    case 'ABERTO_PARA_LANCES':
    case 'ABERTO':
      return 'bg-green-600 text-white';
    case 'EM_BREVE':
      return 'bg-blue-500 text-white';
    case 'ENCERRADO':
    case 'FINALIZADO':
    case 'CANCELADO':
    case 'SUSPENSO':
      return 'bg-gray-500 text-white';
    case 'RASCUNHO':
    case 'EM_PREPARACAO':
      return 'bg-yellow-500 text-white';
    default:
      return 'bg-gray-300 text-gray-800';
  }
};

export const getPaymentStatusText = (status: PaymentStatus): string => getAuctionStatusText(status);

export const getUserDocumentStatusColor = (status: UserDocumentStatus): string => {
  switch (status) {
    case 'APPROVED': return 'border-green-500 text-green-700 bg-green-50';
    case 'REJECTED': return 'border-red-500 text-red-700 bg-red-50';
    case 'PENDING_ANALYSIS':
    case 'SUBMITTED':
      return 'border-yellow-500 text-yellow-700 bg-yellow-50';
    case 'NOT_SENT':
    default:
      return 'border-gray-400 text-gray-600 bg-gray-50';
  }
};

export const getUserHabilitationStatusInfo = (status: UserHabilitationStatus | undefined) => {
  if (!status) return { text: 'Pendente', color: 'bg-orange-500', icon: FileWarning, progress: 25 };
  switch (status) {
    case 'HABILITADO':
      return { text: 'Habilitado', color: 'bg-green-600', icon: CheckCircle2, progress: 100 };
    case 'PENDING_ANALYSIS':
      return { text: 'Em Análise', color: 'bg-yellow-500', icon: Clock, progress: 75 };
    case 'PENDING_DOCUMENTS':
      return { text: 'Documentos Pendentes', color: 'bg-orange-500', icon: FileWarning, progress: 25 };
    case 'REJECTED_DOCUMENTS':
      return { text: 'Documentos Rejeitados', color: 'bg-red-600', icon: FileWarning, progress: 50 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', color: 'bg-gray-700', icon: ShieldAlert, progress: 0 };
    default:
      return { text: 'Status Desconhecido', color: 'bg-gray-400', icon: HelpCircle, progress: 0 };
  }
};

export const getCategoryAssets = (categoryName: string): { bannerUrl: string, bannerAiHint: string } => {
  const assets: Record<string, { bannerUrl: string, bannerAiHint: string }> = {
      'Leilões Judiciais': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Judiciais', bannerAiHint: 'tribunal martelo' },
      'Leilões Extrajudiciais': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Extrajudiciais', bannerAiHint: 'contrato assinatura' },
      'Tomada de Preços': { bannerUrl: 'https://placehold.co/1200x250.png?text=Tomada+de+Precos', bannerAiHint: 'documentos negocios' },
      'Venda Direta': { bannerUrl: 'https://placehold.co/1200x250.png?text=Venda+Direta', bannerAiHint: 'carrinho compras' },
      'Segunda Praça': { bannerUrl: 'https://placehold.co/1200x250.png?text=Segunda+Praca', bannerAiHint: 'desconto oportunidade' },
      'Leilões Encerrados': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Encerrados', bannerAiHint: 'arquivo historico' },
      'Leilões Cancelados': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes+Cancelados', bannerAiHint: 'carimbo cancelado' },
      'Default': { bannerUrl: 'https://placehold.co/1200x250.png?text=Leiloes', bannerAiHint: 'leilao geral' }
  };
  return assets[categoryName] || assets['Default'];
};

export const getUniqueLotLocations = (lots: Lot[]): string[] => {
  if (!lots) return [];
  const locations = new Set<string>();
  lots.forEach(lot => {
    if (lot.cityName && lot.stateUf) {
      locations.add(`${lot.cityName} - ${lot.stateUf}`);
    }
  });
  return Array.from(locations).sort();
};

export function getEffectiveLotEndDate(lot: Lot, auction?: Auction): Date | null {
  if (!lot) return null;
  
  const relevantAuction = auction || { auctionStages: [], endDate: null, auctionDate: null };

  let finalEndDate: Date | null = null;
  
  if (relevantAuction.auctionStages && relevantAuction.auctionStages.length > 0) {
    const now = new Date();
    // Find the first stage that hasn't ended yet
    let relevantStage = relevantAuction.auctionStages
      .filter(stage => stage.endDate && !isPast(new Date(stage.endDate as string)))
      .sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime())[0];
    
    // If all stages are in the past, but the lot isn't marked as finished, take the last stage.
    // This ensures that even after a stage passes, we still have a reference date for "Encerrado".
    if (!relevantStage && lot.status !== 'VENDIDO' && lot.status !== 'NAO_VENDIDO') {
      relevantStage = relevantAuction.auctionStages.sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime())[0];
    }
    
    if (relevantStage && relevantStage.endDate) {
      finalEndDate = new Date(relevantStage.endDate as string);
    }
  }

  // Fallbacks if stages logic doesn't yield a date
  if (!finalEndDate && relevantAuction.endDate) finalEndDate = new Date(relevantAuction.endDate as string);
  
  // The lot's own endDate should be the ultimate fallback
  if (!finalEndDate && lot.endDate) finalEndDate = new Date(lot.endDate as string);
  
  return finalEndDate;
}
