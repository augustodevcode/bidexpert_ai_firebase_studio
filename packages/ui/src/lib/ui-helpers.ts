
// packages/ui/src/lib/ui-helpers.ts
import type { Lot, AuctionStatus, UserDocumentStatus, UserHabilitationStatus, PaymentStatus, LotStatus, DirectSaleOfferStatus, Auction, AuctionStage } from '@bidexpert/core';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle, FileUp, CheckCircle } from 'lucide-react';
import { isPast, isFuture } from 'date-fns';

// A função slugify foi movida para @bidexpert/core
export { slugify } from '@bidexpert/core';

/**
 * Validates if a given URL string is a valid, absolute URL for use in next/image.
 * @param {string | null | undefined} url The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export const isValidImageUrl = (url?: string | null): boolean => {
    if (!url) {
        return false;
    }
    // Check for local relative paths
    if (url.startsWith('/')) {
        return true;
    }
    // Check for absolute URLs using the URL constructor
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (e) {
        return false;
    }
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
    case 'PENDING_DOCUMENTS': return 'Documentos Pendentes';
    case 'HABILITADO': return 'Habilitado'; 
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
    case 'APPROVED': return 'green-500';
    case 'REJECTED': return 'red-500';
    case 'PENDING_ANALYSIS':
    case 'SUBMITTED':
      return 'yellow-500';
    case 'NOT_SENT':
    default:
      return 'gray-400';
  }
};

export const getUserDocumentStatusInfo = (status: UserDocumentStatus | undefined) => {
  switch (status) {
    case 'APPROVED':
      return { text: 'Aprovado', icon: CheckCircle, badgeVariant: 'secondary', textColor: 'text-green-700' };
    case 'REJECTED':
      return { text: 'Rejeitado', icon: FileWarning, badgeVariant: 'destructive', textColor: 'text-destructive' };
    case 'PENDING_ANALYSIS':
      return { text: 'Em Análise', icon: Clock, badgeVariant: 'outline', textColor: 'text-yellow-600' };
    case 'SUBMITTED':
      return { text: 'Enviado', icon: Clock, badgeVariant: 'outline', textColor: 'text-yellow-600' };
    case 'NOT_SENT':
    default:
      return { text: 'Não Enviado', icon: FileUp, badgeVariant: 'secondary', textColor: 'text-muted-foreground' };
  }
};

export const getUserHabilitationStatusInfo = (status: UserHabilitationStatus | undefined) => {
  switch (status) {
    case 'HABILITADO':
      return { text: 'Habilitado', description: 'Você está habilitado para dar lances!', textColor: 'text-green-600', icon: CheckCircle2, progress: 100 };
    case 'PENDING_ANALYSIS':
      return { text: 'Em Análise', description: 'Nossa equipe está analisando seus documentos.', textColor: 'text-yellow-600', icon: Clock, progress: 75 };
    case 'PENDING_DOCUMENTS':
      return { text: 'Documentos Pendentes', description: 'Envie os documentos marcados como obrigatórios (*) para prosseguir.', textColor: 'text-orange-600', icon: FileWarning, progress: 25 };
    case 'REJECTED_DOCUMENTS':
      return { text: 'Documentos Rejeitados', description: 'Um ou mais documentos foram rejeitados. Verifique abaixo.', textColor: 'text-red-600', icon: FileWarning, progress: 50 };
    case 'BLOCKED':
      return { text: 'Conta Bloqueada', description: 'Sua conta está bloqueada. Entre em contato com o suporte.', textColor: 'text-gray-700', icon: ShieldAlert, progress: 0 };
    default:
      return { text: 'Pendente', description: 'Complete seu cadastro e envie os documentos.', textColor: 'text-muted-foreground', icon: HelpCircle, progress: 10 };
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

export function getEffectiveLotEndDate(lot: Lot, auction?: Auction): { effectiveLotEndDate: Date | null, effectiveLotStartDate: Date | null } {
    if (!lot) return { effectiveLotEndDate: null, effectiveLotStartDate: null };

    // 1. Specific date on the lot always wins
    if (lot.endDate) {
        return { 
            effectiveLotEndDate: new Date(lot.endDate), 
            effectiveLotStartDate: lot.auctionDate ? new Date(lot.auctionDate) : (auction?.auctionDate ? new Date(auction.auctionDate) : null)
        };
    }

    // 2. Fallback to auction stages
    if (auction?.auctionStages && auction.auctionStages.length > 0) {
        const now = new Date();
        // Find the first stage that hasn't ended yet
        const upcomingOrActiveStage = auction.auctionStages
            .filter(stage => stage.endDate && !isPast(new Date(stage.endDate)))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
        
        if (upcomingOrActiveStage?.endDate) {
            return { 
                effectiveLotEndDate: new Date(upcomingOrActiveStage.endDate), 
                effectiveLotStartDate: new Date(upcomingOrActiveStage.startDate)
            };
        }

        // If all stages are in the past, get the end date of the last stage
        const lastStage = auction.auctionStages
            .filter(stage => stage.endDate)
            .sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime())[0];
        
        if (lastStage?.endDate) {
            return { 
                effectiveLotEndDate: new Date(lastStage.endDate),
                effectiveLotStartDate: new Date(lastStage.startDate)
             };
        }
    }

    // 3. Fallback to the main auction end date
    if (auction?.endDate) {
        return { 
            effectiveLotEndDate: new Date(auction.endDate),
            effectiveLotStartDate: new Date(auction.auctionDate)
        };
    }

    return { effectiveLotEndDate: null, effectiveLotStartDate: null };
}

/**
 * Gets the currently active stage from a list of auction stages.
 * @param stages An array of AuctionStage objects.
 * @returns The active AuctionStage, or null if no stage is currently active.
 */
export const getActiveStage = (stages?: AuctionStage[]): AuctionStage | null => {
  if (!stages || stages.length === 0) {
    return null;
  }

  const now = new Date();
  const activeStages = stages.filter(stage => {
    const startDate = new Date(stage.startDate);
    const endDate = new Date(stage.endDate);
    return !isFuture(startDate) && isFuture(endDate);
  });
  
  // If multiple stages are active, return the one that started most recently
  if (activeStages.length > 1) {
    return activeStages.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  }

  return activeStages[0] || null;
};

/**
 * Gets the applicable prices for a lot based on the active auction stage.
 * @param lot The lot object.
 * @param activeStageId The ID of the currently active auction stage.
 * @returns An object with initialBid and increment or null.
 */
export const getLotPriceForStage = (lot: Lot, activeStageId?: string): { initialBid: number | null; bidIncrement: number | null } | null => {
    if (!lot) return null;

    // If there's a specific price for the active stage, use it
    if (activeStageId && lot.stageDetails) {
        const stagePrice = lot.stageDetails.find(p => p.auctionStageId === activeStageId);
        if (stagePrice) {
            return {
                initialBid: stagePrice.initialBid,
                bidIncrement: stagePrice.increment,
            };
        }
    }
    
    // Fallback to the lot's main price details
    return {
        initialBid: lot.initialPrice,
        bidIncrement: lot.bidIncrementStep,
    };
};
