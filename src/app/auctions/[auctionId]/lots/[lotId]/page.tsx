
// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction } from '@/types';
import { sampleAuctions, sampleLots, getCategoryNameFromSlug as getCategoryNameFromSampleDataSlug, slugify } from '@/lib/sample-data'; 
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// Removido: import Breadcrumbs, { type BreadcrumbItem } from '@/components/ui/breadcrumbs';

async function getLotPageData(currentAuctionId: string, currentLotId: string): Promise<{
  lot: Lot | undefined,
  auction: Auction | undefined,
  sellerName?: string | null, 
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number
  // Removido: breadcrumbs: BreadcrumbItem[]
}> {
  console.log(`[getLotPageData - SampleData Mode] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  const auctionFromSample = sampleAuctions.find(a => a.id === currentAuctionId || a.publicId === currentAuctionId);
  const lot = sampleLots.find(l => (l.id === currentLotId || l.publicId === currentLotId) && (l.auctionId === auctionFromSample?.id || l.auctionId === auctionFromSample?.publicId));

  // Removido: const breadcrumbs: BreadcrumbItem[] = [ ... ];

  let auctionToReturn: Auction | undefined = undefined;

  if (auctionFromSample) {
    const lotsForThisAuction = sampleLots.filter(l => l.auctionId === auctionFromSample.id || l.auctionId === auctionFromSample.publicId);
    auctionToReturn = { ...auctionFromSample, lots: lotsForThisAuction, totalLots: lotsForThisAuction.length };
    console.log(`[getLotPageData - SampleData Mode] Leilão ${auctionToReturn.id} encontrado. Lotes associados: ${lotsForThisAuction.length}`);
    
    if (!lot) {
      // Removido: breadcrumbs.push({ label: auctionToReturn.title || `Leilão ${auctionToReturn.id}`, href: `/auctions/${auctionToReturn.publicId || auctionToReturn.id}` });
      // Removido: breadcrumbs.push({ label: 'Lote Não Encontrado' });
      console.warn(`[getLotPageData - SampleData Mode] Lote ${currentLotId} não encontrado no leilão ${currentAuctionId} em sampleData.`);
      return { lot: undefined, auction: auctionToReturn /*, breadcrumbs */ };
    }

    // Removido: const lotCategoryName = getCategoryNameFromSampleDataSlug(slugify(lot.type)); 
  
    // Removido: breadcrumbs.push({ label: auctionToReturn.title || `Leilão ${auctionToReturn.id}`, href: `/auctions/${auctionToReturn.publicId || auctionToReturn.id}` });
    // Removido: if (lotCategoryName) { breadcrumbs.push({ label: lotCategoryName, href: `/category/${slugify(lot.type)}` }); }
    // Removido: breadcrumbs.push({ label: lot.title || `Lote ${lot.id}` });

    const lotIndex = auctionToReturn.lots?.findIndex(l => l.id === currentLotId || l.publicId === currentLotId) ?? -1;
    const totalLotsInAuction = auctionToReturn.lots?.length ?? 0;
    const previousLotId = (auctionToReturn.lots && lotIndex > 0) ? (auctionToReturn.lots[lotIndex - 1].publicId || auctionToReturn.lots[lotIndex - 1].id) : undefined;
    const nextLotId = (auctionToReturn.lots && lotIndex < totalLotsInAuction - 1) ? (auctionToReturn.lots[lotIndex + 1].publicId || auctionToReturn.lots[lotIndex + 1].id) : undefined;
    
    let sellerName = lot.sellerName || auctionToReturn.seller;

    return { lot, auction: auctionToReturn, sellerName, lotIndex, previousLotId, nextLotId, totalLotsInAuction /*, breadcrumbs */ };

  } else {
    // Removido: breadcrumbs.push({ label: 'Leilão Não Encontrado' });
    console.warn(`[getLotPageData - SampleData Mode] Leilão ${currentAuctionId} não encontrado em sampleData.`);
    return { lot: undefined, auction: undefined /*, breadcrumbs */ };
  }
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  // Passando params.auctionId e params.lotId diretamente
  const { 
    lot, 
    auction, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction
    // Removido: breadcrumbs 
  } = await getLotPageData(params.auctionId, params.lotId);

  if (!lot || !auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Removido: <Breadcrumbs items={breadcrumbs} /> */}
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
      {/* Removido: <Breadcrumbs items={breadcrumbs} className="mb-4 px-4 sm:px-0" /> */}
      <LotDetailClientContent
        lot={lot}
        auction={auction}
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

    
