// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuction, getAuctions } from '@/app/admin/auctions/actions';
import { getLot, getLots, getBensByIdsAction } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getLotPageData(currentAuctionId: string, currentLotId: string): Promise<{
  lot: Lot | null,
  auction: Auction | null,
  platformSettings: PlatformSettings,
  sellerName?: string | null, 
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number,
}> {
  console.log(`[getLotPageData] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  const [
    platformSettings,
    auctionFromDb,
    lotFromDb,
  ] = await Promise.all([
    getPlatformSettings(),
    getAuction(currentAuctionId),
    getLot(currentLotId),
  ]);
  
  if (!auctionFromDb || !lotFromDb) {
    console.warn(`[getLotPageData] Leilão ou Lote não encontrado. Auction found: ${!!auctionFromDb}, Lot found: ${!!lotFromDb}`);
    return { lot: lotFromDb, auction: auctionFromDb, platformSettings };
  }

  // Verify that the lot actually belongs to the auction requested in the URL.
  if (lotFromDb.auctionId !== auctionFromDb.id) {
    console.warn(`[getLotPageData] Mismatch: Lot '${lotFromDb.id}' belongs to auction '${lotFromDb.auctionId}', not '${auctionFromDb.id}'. Returning not found.`);
    return { lot: null, auction: auctionFromDb, platformSettings };
  }
  
  // Enrich lot with its assets
  if (lotFromDb.bemIds && lotFromDb.bemIds.length > 0) {
    lotFromDb.bens = await getBensByIdsAction(lotFromDb.bemIds);
  }


  const lotsForThisAuction = auctionFromDb.lots || [];
  const lotIndex = lotsForThisAuction.findIndex(l => l.id === lotFromDb.id || (l.publicId && l.publicId === lotFromDb.publicId));
  const totalLotsInAuction = lotsForThisAuction.length;
  
  const previousLotId = lotIndex > 0 ? (lotsForThisAuction[lotIndex - 1].publicId || lotsForThisAuction[lotIndex - 1].id) : undefined;
  const nextLotId = (lotIndex > -1 && lotIndex < totalLotsInAuction - 1) ? (lotsForThisAuction[lotIndex + 1].publicId || lotsForThisAuction[lotIndex + 1].id) : undefined;
  
  let sellerName = lotFromDb.sellerName || auctionFromDb.seller;
  const sellerIdToFetch = lotFromDb.sellerId || auctionFromDb.sellerId;
  if (!sellerName && sellerIdToFetch) {
    const seller = await getSellerBySlug(sellerIdToFetch);
    sellerName = seller?.name;
  }
  
  return { 
    lot: lotFromDb, 
    auction: auctionFromDb, 
    platformSettings, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction,
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
  } = await getLotPageData(params.auctionId, params.lotId);

  if (!lot || !auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Lote ou Leilão Não Encontrado</h1>
          <p className="text-muted-foreground">O item que você está procurando não existe ou não pôde ser carregado.</p>
          <Button asChild className="mt-4">
            <Link href={auction ? `/auctions/${auction.publicId || auction.id}` : '/'}>
              {auction ? 'Voltar para o Leilão' : 'Voltar para Home'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-8"> 
      <LotDetailClientContent
        lot={lot}
        auction={auction}
        platformSettings={platformSettings}
        sellerName={sellerName}
        lotIndex={lotIndex}
        previousLotId={previousLotId}
        nextLotId={nextLotId}
        totalLotsInAuction={totalLotsInAuction}
      />
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const lots = await getLots(); 
    // Limit to a reasonable number for build time
    const paths = lots.slice(0, 50).map(lot => ({
        auctionId: lot.auctionPublicId || lot.auctionId, // Use publicId if available
        lotId: lot.publicId || lot.id,
      }));
    return paths;
  } catch (error) {
    console.error("Error generating static params for lot detail pages:", error);
    return [];
  }
}
