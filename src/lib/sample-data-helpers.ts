// src/lib/sample-data-helpers.ts
import type { LotCategory, UserDocumentStatus, UserHabilitationStatus, PaymentStatus, LotStatus, DirectSaleOfferStatus, AuctionStatus } from '@/types';
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


// ============================================================================
// SERVER-SIDE DATA PROCESSING
// This should only be called by a server-side data loader (like the SampleDataAdapter).
// ============================================================================

export function processSampleData(rawData: any) {
  // This function is now only responsible for processing the raw data object.
  // It does NOT read files.

  const sampleAuctioneers = (rawData.sampleAuctioneers || []).map((auc: any) => ({
    ...auc, logoUrl: rawData.sampleMediaItems.find((m: any) => m.id === auc.logoMediaId)?.urlOriginal
  }));

  const sampleSellers = (rawData.sampleSellers || []).map((seller: any) => ({
    ...seller, logoUrl: rawData.sampleMediaItems.find((m: any) => m.id === seller.logoMediaId)?.urlOriginal
  }));

  const sampleLotCategories = (rawData.sampleLotCategories || []).map((cat: any) => ({
    ...cat,
    logoUrl: rawData.sampleMediaItems.find((m: any) => m.id === cat.logoMediaId)?.urlOriginal,
    coverImageUrl: rawData.sampleMediaItems.find((m: any) => m.id === cat.coverImageMediaId)?.urlOriginal,
    megaMenuImageUrl: rawData.sampleMediaItems.find((m: any) => m.id === cat.megaMenuImageMediaId)?.urlOriginal,
    hasSubcategories: (rawData.sampleSubcategories || []).some((sub: any) => sub.parentCategoryId === cat.id)
  }));
  
  const processedAuctions = (rawData.sampleAuctions || []).map((auction: any) => {
    const categoryInfo = sampleLotCategories.find(c => c.id === auction.categoryId);
    const auctioneerInfo = sampleAuctioneers.find(auc => auc.id === auction.auctioneerId);
    const sellerInfo = sampleSellers.find(s => s.id === auction.sellerId);
    
    let effectiveEndDate: Date | null = null;
    if (auction.auctionStages && auction.auctionStages.length > 0) {
        const sortedStages = [...auction.auctionStages].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        effectiveEndDate = sortedStages.length > 0 ? new Date(sortedStages[sortedStages.length - 1].endDate) : null;
    } else if (auction.endDate) {
        effectiveEndDate = new Date(auction.endDate);
    }
    
    let derivedStatus: AuctionStatus = auction.status;
    if (effectiveEndDate && isPast(effectiveEndDate) && ['ABERTO_PARA_LANCES', 'ABERTO', 'EM_BREVE'].includes(derivedStatus)) {
        derivedStatus = 'ENCERRADO';
    }

    return {
      ...auction,
      category: categoryInfo?.name || auction.category,
      auctioneer: auctioneerInfo?.name || auction.auctioneer,
      seller: sellerInfo?.name || auction.seller,
      auctioneerLogoUrl: auctioneerInfo?.logoUrl,
      imageUrl: rawData.sampleMediaItems.find((m: any) => m.id === auction.imageMediaId)?.urlOriginal || 'https://placehold.co/600x400.png',
      endDate: effectiveEndDate,
      status: derivedStatus,
      lots: [],
    };
  });

  const processedLots = (rawData.sampleLots || []).map((lot: any) => {
    const parentAuction = processedAuctions.find(a => a.id === lot.auctionId);
    let derivedStatus = lot.status;

    if (parentAuction) {
      if (['CANCELADO', 'SUSPENSO'].includes(parentAuction.status)) {
        derivedStatus = 'ENCERRADO';
      } else if (parentAuction.endDate && isPast(new Date(parentAuction.endDate)) && lot.status === 'ABERTO_PARA_LANCES') {
        if (lot.reservePrice && lot.price < lot.reservePrice) derivedStatus = 'NAO_VENDIDO';
        else if ((lot.bidsCount || 0) > 0) derivedStatus = 'VENDIDO';
        else derivedStatus = 'NAO_VENDIDO';
      }
    }
    return { ...lot, status: derivedStatus };
  });

  processedAuctions.forEach(auction => {
    const lotsForThisAuction = processedLots.filter(l => l.auctionId === auction.id);
    auction.lots = lotsForThisAuction;
    auction.totalLots = lotsForThisAuction.length;
  });

  return { ...rawData, sampleAuctions: processedAuctions, sampleLots: processedLots, sampleLotCategories, sampleSellers, sampleAuctioneers };
}
