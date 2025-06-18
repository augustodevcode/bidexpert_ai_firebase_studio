
// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction, PlatformSettings } from '@/types';
import { sampleAuctions, sampleLots, getCategoryNameFromSlug as getCategoryNameFromSampleDataSlug, slugify, samplePlatformSettings } from '@/lib/sample-data'; 
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// Removido: import Breadcrumbs, { type BreadcrumbItem } from '@/components/ui/breadcrumbs';

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
  console.log(`[getLotPageData - SampleData Mode] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  // Em uma aplicação real, platformSettings viria do DB ou de uma action
  const platformSettingsData: PlatformSettings = samplePlatformSettings;

  const auctionFromSample = sampleAuctions.find(a => a.id === currentAuctionId || a.publicId === currentAuctionId);
  const lot = sampleLots.find(l => (l.id === currentLotId || l.publicId === currentLotId) && (l.auctionId === auctionFromSample?.id || l.auctionId === auctionFromSample?.publicId));

  let auctionToReturn: Auction | undefined = undefined;

  if (auctionFromSample) {
    const lotsForThisAuction = sampleLots.filter(l => l.auctionId === auctionFromSample.id || l.auctionId === auctionFromSample.publicId);
    auctionToReturn = { ...auctionFromSample, lots: lotsForThisAuction, totalLots: lotsForThisAuction.length };
    console.log(`[getLotPageData - SampleData Mode] Leilão ${auctionToReturn.id} encontrado. Lotes associados: ${lotsForThisAuction.length}`);
    
    if (!lot) {
      console.warn(`[getLotPageData - SampleData Mode] Lote ${currentLotId} não encontrado no leilão ${currentAuctionId} em sampleData.`);
      return { lot: undefined, auction: auctionToReturn, platformSettings: platformSettingsData };
    }

    const lotIndex = auctionToReturn.lots?.findIndex(l => l.id === currentLotId || l.publicId === currentLotId) ?? -1;
    const totalLotsInAuction = auctionToReturn.lots?.length ?? 0;
    const previousLotId = (auctionToReturn.lots && lotIndex > 0) ? (auctionToReturn.lots[lotIndex - 1].publicId || auctionToReturn.lots[lotIndex - 1].id) : undefined;
    const nextLotId = (auctionToReturn.lots && lotIndex < totalLotsInAuction - 1) ? (auctionToReturn.lots[lotIndex + 1].publicId || auctionToReturn.lots[lotIndex + 1].id) : undefined;
    
    let sellerName = lot.sellerName || auctionToReturn.seller;

    return { lot, auction: auctionToReturn, platformSettings: platformSettingsData, sellerName, lotIndex, previousLotId, nextLotId, totalLotsInAuction };

  } else {
    console.warn(`[getLotPageData - SampleData Mode] Leilão ${currentAuctionId} não encontrado em sampleData.`);
    return { lot: undefined, auction: undefined, platformSettings: platformSettingsData };
  }
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
          <h1 className="text-2xl font-bold">Lote ou Leilão Não Encontrado (Sample Data)</h1>
          <p className="text-muted-foreground">O item que você está procurando não existe ou não pôde ser carregado dos dados de exemplo.</p>
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
  const paths = sampleAuctions.flatMap(auction =>
    (auction.lots || []).map(lot => ({
      auctionId: auction.publicId || auction.id,
      lotId: lot.publicId || lot.id,
    }))
  );
  return paths;
}
    