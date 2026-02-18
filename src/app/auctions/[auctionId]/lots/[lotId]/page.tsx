// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
/**
 * @fileoverview Página de servidor para renderização inicial dos detalhes de um lote.
 * Este componente Server-Side é responsável por buscar os dados essenciais para a
 * exibição de um lote (o lote em si, o leilão pai, configurações da plataforma,
 * categorias, comitentes e leiloeiros). Ele delega a renderização final e a
 * interatividade para o componente de cliente `LotDetailClientContent`,
 * garantindo um carregamento inicial rápido (SSR/SSG).
 */
import type { Lot, Auction, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import LotDetailClientContent from './lot-detail-client';
import { getAuction } from '@/app/admin/auctions/actions';
import { getLot, getLots, getAssetsByIdsAction } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { notFound } from 'next/navigation';
import { getAuctionContact, type AuctionContactInfo } from '@/services/auction-contact.service';
import prisma from '@/lib/prisma';

async function getLotPageData(currentAuctionId: string, currentLotId: string): Promise<{
  lot: Lot | null,
  auction: Auction | null,
  platformSettings: PlatformSettings,
  sellerName?: string | null, 
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number,
  allCategories: LotCategory[],
  allSellers: SellerProfileInfo[],
  auctioneer: AuctioneerProfileInfo | null,
  auctionContact: AuctionContactInfo | null
}> {
  console.log(`[getLotPageData] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  const [
      platformSettings,
      auctionFromDb,
      lotFromDb,
      allCategories,
      allSellers,
      allAuctioneers
  ] = await Promise.all([
    getPlatformSettings(),
    getAuction(currentAuctionId, true), // Public call
    getLot(currentLotId, true), // Public call
    getLotCategories(),
    getSellers(true), // Public call
    getAuctioneers(true) // Public call
  ]);
  
  if (!auctionFromDb || !lotFromDb) {
    console.warn(`[getLotPageData] Leilão ou Lote não encontrado. Auction found: ${!!auctionFromDb}, Lot found: ${!!lotFromDb}`);
    // @ts-ignore
    return { lot: lotFromDb, auction: auctionFromDb, platformSettings, allCategories, allSellers, auctioneer: null, auctionContact: null };
  }

  // Verify that the lot actually belongs to the auction requested in the URL.
  if (lotFromDb.auctionId !== auctionFromDb.id) {
    // TENTATIVA DE RECUPERAÇÃO: Se o ID do leilão no banco bater com o ID da URL (caso seja ID interno), permitir.
    if (lotFromDb.auctionId !== currentAuctionId) {
         // @ts-ignore
         return { lot: null, auction: null, platformSettings, allCategories, allSellers, auctioneer: null, auctionContact: null };
    }
  }
  
  // Enrich lot with its assets
  if (lotFromDb.assetIds && lotFromDb.assetIds.length > 0) {
    lotFromDb.assets = await getAssetsByIdsAction(lotFromDb.assetIds);
  }

  // Ensure the lots array on the auction object is populated.
  if (!auctionFromDb.lots || auctionFromDb.lots.length === 0) {
      auctionFromDb.lots = await getLots(auctionFromDb.id, true); // Public call
  }
  const lotsForThisAuction = auctionFromDb.lots || [];
  const lotIndex = lotsForThisAuction.findIndex(l => l.id === lotFromDb.id || (l.publicId && l.publicId === lotFromDb.publicId));
  const totalLotsInAuction = lotsForThisAuction.length;
  
  const previousLotId = lotIndex > 0 ? (lotsForThisAuction[lotIndex - 1].publicId || lotsForThisAuction[lotIndex - 1].id) : undefined;
  const nextLotId = (lotIndex > -1 && lotIndex < totalLotsInAuction - 1) ? (lotsForThisAuction[lotIndex + 1].publicId || lotsForThisAuction[lotIndex + 1].id) : undefined;
  
  let sellerName = lotFromDb.sellerName || auctionFromDb.seller?.name;
  const sellerIdToFetch = lotFromDb.sellerId || auctionFromDb.sellerId;
  if (!sellerName && sellerIdToFetch) {
    const seller = allSellers.find(s => s.id === sellerIdToFetch || s.publicId === sellerIdToFetch);
    sellerName = seller?.name;
  }

  const auctioneer = allAuctioneers.find(a => a.id === auctionFromDb.auctioneerId) || null;
  
  // Buscar informações de contato do leilão com herança (Auction -> Auctioneer -> PlatformSettings)
  let auctionContact: AuctionContactInfo | null = null;
  try {
    const auctionIdBigInt = typeof auctionFromDb.id === 'string' ? BigInt(auctionFromDb.id) : BigInt(auctionFromDb.id);
    const tenantIdBigInt = typeof platformSettings.tenantId === 'string' ? BigInt(platformSettings.tenantId) : BigInt(platformSettings.tenantId);
    auctionContact = await getAuctionContact(prisma, auctionIdBigInt, tenantIdBigInt);
  } catch (error) {
    console.error('[getLotPageData] Erro ao buscar contatos do leilão:', error);
    // Em caso de erro, definir fallback com contatos do PlatformSettings
    auctionContact = {
      phone: platformSettings.supportPhone || null,
      email: platformSettings.supportEmail || null,
      whatsapp: platformSettings.supportWhatsApp || null,
      source: 'platform',
    };
  }
  
  return { 
    lot: JSON.parse(JSON.stringify(lotFromDb, (key, value) => typeof value === 'bigint' ? value.toString() : value)), 
    auction: JSON.parse(JSON.stringify(auctionFromDb, (key, value) => typeof value === 'bigint' ? value.toString() : value)), 
    platformSettings: platformSettings!, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction,
    allCategories,
    allSellers,
    auctioneer,
    auctionContact,
  };
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  const { 
    lot, 
    auction, 
    platformSettings, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction,
    allCategories,
    allSellers,
    auctioneer,
    auctionContact
  } = await getLotPageData(params.auctionId, params.lotId);

  if (!lot || !auction) {
    notFound();
  }

  return (
    <div className="container-lot-detail-page" data-ai-id="lot-detail-page-container">
         <LotDetailClientContent
            lot={lot}
            auction={auction}
            platformSettings={platformSettings}
            sellerName={sellerName}
            lotIndex={lotIndex}
            previousLotId={previousLotId}
            nextLotId={nextLotId}
            totalLotsInAuction={totalLotsInAuction}
            allCategories={allCategories}
            allSellers={allSellers}
            auctioneer={auctioneer}
            auctionContact={auctionContact}
        />
    </div>
  );
}
