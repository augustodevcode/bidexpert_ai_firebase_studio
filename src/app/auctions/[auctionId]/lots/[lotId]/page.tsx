

// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction, PlatformSettings } from '@/types';
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuction, getAuctions } from '@/app/admin/auctions/actions';
import { getLot, getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { getSampleData } from '@/lib/sample-data-helpers';

async function getLotPageData(currentAuctionId: string, currentLotId: string): Promise<{
  lot: Lot | undefined,
  auction: Auction | undefined,
  platformSettings: PlatformSettings,
  sellerName?: string | null, 
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number
}> {
  console.log(`[getLotPageData] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  const { samplePlatformSettings } = getSampleData();

  const [auctionFromDb, lotFromDb] = await Promise.all([
    getAuction(currentAuctionId),
    getLot(currentLotId)
  ]);
  
  if (!auctionFromDb || !lotFromDb) {
    console.warn(`[getLotPageData] Leilão ou Lote não encontrado. Auction found: ${!!auctionFromDb}, Lot found: ${!!lotFromDb}`);
    return { lot: lotFromDb, auction: auctionFromDb, platformSettings: samplePlatformSettings };
  }

  const lotsForThisAuction = await getLots(auctionFromDb.id);
  const auctionToReturn: Auction = { ...auctionFromDb, lots: lotsForThisAuction, totalLots: lotsForThisAuction.length };

  const lotIndex = lotsForThisAuction?.findIndex(l => l.id === lotFromDb.id || l.publicId === lotFromDb.publicId) ?? -1;
  const totalLotsInAuction = lotsForThisAuction?.length ?? 0;
  const previousLotId = (lotsForThisAuction && lotIndex > 0) ? (lotsForThisAuction[lotIndex - 1].publicId || lotsForThisAuction[lotIndex - 1].id) : undefined;
  const nextLotId = (lotsForThisAuction && lotIndex > -1 && lotIndex < totalLotsInAuction - 1) ? (lotsForThisAuction[lotIndex + 1].publicId || lotsForThisAuction[lotIndex + 1].id) : undefined;
  
  let sellerName = lotFromDb.sellerName || auctionToReturn.seller;
  const sellerIdToFetch = lotFromDb.sellerId || auctionToReturn.sellerId;
  if (!sellerName && sellerIdToFetch) {
    const seller = await getSellerBySlug(sellerIdToFetch);
    sellerName = seller?.name;
  }
  
  return { 
    lot: lotFromDb, 
    auction: auctionToReturn, 
    platformSettings: samplePlatformSettings, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction 
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
    totalLotsInAuction
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
  const allLots = await getLots(); 
  const paths = allLots.map(lot => ({
      auctionId: lot.auctionId,
      lotId: lot.publicId || lot.id,
    }));
  return paths;
}
