// src/lib/ui-helpers.ts
import type { Lot, AuctionStatus, UserDocumentStatus, UserHabilitationStatus, PaymentStatus, LotStatus, DirectSaleOfferStatus, Auction, AuctionStage, AuctionType } from '@/types';
import { FileText, Clock, FileWarning, CheckCircle2, ShieldAlert, HelpCircle, FileUp, CheckCircle, Gavel, FileText as TomadaPrecosIcon } from 'lucide-react';
import { isPast, isFuture } from 'date-fns';
import React from 'react';

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


export const getAuctionStatusText = (status: AuctionStatus | LotStatus | UserDocumentStatus | UserHabilitationStatus | PaymentStatus | DirectSaleOfferStatus | string | undefined): string => {
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

export const getLotStatusColor = (status: LotStatus | DirectSaleOfferStatus | string): string => {
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

export const getAuctionTypeDisplayData = (type?: AuctionType) => {
  if (!type) return null;
  switch (type) {
    case 'JUDICIAL': return { label: 'Judicial', icon: Gavel };
    case 'EXTRAJUDICIAL': return { label: 'Extrajudicial', icon: Gavel };
    case 'PARTICULAR': return { label: 'Particular', icon: Gavel };
    case 'TOMADA_DE_PRECOS': return { label: 'Tomada de Preços', icon: TomadaPrecosIcon };
    default: return null;
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

export const getEffectiveLotEndDate = (lot: Lot, auction?: Auction): { effectiveLotEndDate: Date | null, effectiveLotStartDate: Date | null } => {
  if (!lot) return { effectiveLotEndDate: null, effectiveLotStartDate: null };

  const now = new Date();

  // Prioritize stage dates from the parent auction if available
  if (auction?.auctionStages && auction.auctionStages.length > 0) {
    const activeOrNextStage = auction.auctionStages
      .filter(stage => stage.endDate && !isPast(new Date(stage.endDate)))
      .sort((a, b) => new Date(a.startDate as Date).getTime() - new Date(b.startDate as Date).getTime())[0];

    if (activeOrNextStage) {
      return {
        effectiveLotEndDate: new Date(activeOrNextStage.endDate as string),
        effectiveLotStartDate: new Date(activeOrNextStage.startDate as string)
      };
    }

    // If all stages are in the past, find the most recent one
    const lastFinishedStage = auction.auctionStages
      .filter(stage => stage.endDate)
      .sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime())[0];

    if (lastFinishedStage) {
      return {
        effectiveLotEndDate: new Date(lastFinishedStage.endDate as string),
        effectiveLotStartDate: new Date(lastFinishedStage.startDate as string)
      };
    }
  }

  // Fallback to lot-specific dates
  const endDate = lot.endDate ? new Date(lot.endDate as string) : (auction?.endDate ? new Date(auction.endDate as string) : null);
  const startDate = lot.auctionDate ? new Date(lot.auctionDate as string) : (auction?.auctionDate ? new Date(auction.auctionDate as string) : null);

  return { effectiveLotEndDate: endDate, effectiveLotStartDate: startDate };
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
    return activeStages.sort((a, b) => new Date(b.startDate as Date).getTime() - new Date(a.startDate as Date).getTime())[0];
  }

  return activeStages[0] || null;
};

/**
 * Gets the applicable prices for a lot based on the active auction stage.
 * @param lot The lot object.
 * @param activeStageId The ID of the currently active auction stage.
 * @returns An object with initialBid and increment or null.
 */
export const getLotPriceForStage = (lot: Lot, activeStageId?: string): { initialBid: number | null, bidIncrement: number | null } | null => {
  if (!lot) return null;

  // If there's a specific price for the active stage, use it
  if (activeStageId && lot.stageDetails) {
    const stagePrice = lot.stageDetails.find(p => p.stageId === activeStageId);
    if (stagePrice) {
      return {
        initialBid: stagePrice.initialBid,
        bidIncrement: stagePrice.bidIncrement,
      };
    }
  }

  // Fallback to the lot's main price details
  return {
    initialBid: lot.initialPrice,
    bidIncrement: lot.bidIncrementStep,
  };
};

/**
 * Calcula o lance mínimo para um lote com base na regra de percentual da praça.
 * 
 * REGRA DE NEGÓCIO (RN-PRACA-001):
 * - Se NÃO houver lances no lote: Lance Mínimo = Valor Inicial do Lote × (Percentual da Praça / 100)
 * - Se HOUVER lances no lote: Lance Mínimo = Último Lance + Incremento do Lote
 * 
 * @param lot O objeto do lote
 * @param activeStage A praça ativa do leilão
 * @param currentBidCount Quantidade de lances no lote
 * @param lastBidValue Valor do último lance (se houver)
 * @returns O valor do lance mínimo calculado
 */
export const calculateMinimumBid = (
  lot: Lot,
  activeStage: AuctionStage | null,
  currentBidCount: number = 0,
  lastBidValue: number | null = null
): number => {
  if (!lot) return 0;

  const bidIncrement = lot.bidIncrementStep ?? 100;

  // Se houver lances, o lance mínimo é o último lance + incremento
  if (currentBidCount > 0 && lastBidValue !== null) {
    return lastBidValue + bidIncrement;
  }

  // Se não houver lances, aplica o percentual da praça ao valor inicial do lote
  const initialPrice = lot.initialPrice ?? 0;
  const discountPercent = activeStage?.discountPercent ?? 100;

  return initialPrice * (discountPercent / 100);
};

/**
 * Obtém o valor inicial efetivo do lote para a praça atual (aplicando desconto).
 * 
 * @param lot O objeto do lote
 * @param activeStage A praça ativa do leilão
 * @returns O valor inicial com desconto da praça aplicado
 */
export const getLotInitialPriceForStage = (
  lot: Lot,
  activeStage: AuctionStage | null
): number => {
  if (!lot) return 0;

  const initialPrice = lot.initialPrice ?? 0;
  const discountPercent = activeStage?.discountPercent ?? 100;

  return initialPrice * (discountPercent / 100);
};

/**
 * Determines the correct display price and label for a lot card based on auction stage and bids.
 * 
 * @param lot The lot object
 * @param auction The parent auction object (optional but recommended for stage info)
 * @returns Object containing the numeric value to display and the appropriate label
 */
export const getLotDisplayPrice = (lot: Lot, auction?: Auction): { value: number, label: string } => {
  const activeStage = getActiveStage(auction?.auctionStages);
  const hasBids = (lot.bidsCount || 0) > 0;

  // Case 1: Has existing bids - always show current price (which is technically the last bid value, stored in price)
  if (hasBids) {
    return {
      value: lot.price,
      label: 'Lance Atual'
    };
  }

  // Case 2: No bids, but we have an active stage (handling 2nd praça etc)
  if (activeStage) {
    // If it's the first stage (or only stage), usually just initial price
    // But if it's a subsequent stage, we might have a discount
    // We can reuse getLotInitialPriceForStage logic here
    const discountedInitialFn = getLotInitialPriceForStage(lot, activeStage);

    // Also check if there is a specific override in lotStagePrices/stageDetails if implemented
    // For simple rule: use the discounted calculation

    // We'll call it "Lance Mínimo" if it differentiates from the raw initial price, 
    // or effectively "Lance Inicial" is also fine, but "Lance Mínimo" aligns with "2ª Praça" context better.
    // Let's stick to "Lance Mínimo" when we are in a stage context to be safe.
    // However, user request says: "lance inicial se não houve lance ou valor atual se houve lance" for main logic
    // AND "já nas demais praças... lance mínimo".

    // Let's refine:
    // If activeStage is the FIRST stage, normally it's just "Lance Inicial".
    // If activeStage is NOT the first stage (e.g. 2nd Praça), it is "Lance Mínimo".

    const isFirstStage = auction?.auctionStages && auction.auctionStages[0]?.id === activeStage.id;

    if (!isFirstStage && auction?.auctionStages && auction.auctionStages.length > 1) {
      return {
        value: discountedInitialFn,
        label: 'Lance Mínimo'
      };
    }

    // Fallback for 1st stage active
    return {
      value: lot.initialPrice || 0,
      label: 'Lance Inicial'
    };
  }

  // Case 3: No active stage info or simple lot (e.g. Direct Sale or just Listed)
  // Default to Initial Price
  return {
    value: lot.initialPrice || lot.price || 0, // Fallback to price if initial not set
    label: 'Lance Inicial'
  };
};

export interface AuctionPregaoWindowInput {
  status?: string;
  openDate?: Date | string | null;
  actualOpenDate?: Date | string | null;
  auctionDate?: Date | string | null;
  endDate?: Date | string | null;
}

const parseOptionalDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isAuctionInPregaoWindow = (auction: AuctionPregaoWindowInput, referenceDate = new Date()): boolean => {
  if (!auction || auction.status !== 'ABERTO_PARA_LANCES') {
    return false;
  }

  const endDate = parseOptionalDate(auction.endDate);
  if (!endDate || referenceDate > endDate) {
    return false;
  }

  const startDate = parseOptionalDate(auction.actualOpenDate) || parseOptionalDate(auction.openDate) || parseOptionalDate(auction.auctionDate);
  if (startDate && referenceDate < startDate) {
    return false;
  }

  return true;
};
