
// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction } from '@/types';
// Corrigida a importação para usar getCategoryNameFromSlug e seu alias
import { sampleAuctions, sampleLots, getCategoryNameFromSlug as getCategoryNameFromSampleDataSlug, slugify } from '@/lib/sample-data'; 
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Breadcrumbs, { type BreadcrumbItem } from '@/components/ui/breadcrumbs';

async function getLotPageData(currentAuctionId: string, currentLotId: string): Promise<{
  lot: Lot | undefined,
  auction: Auction | undefined,
  sellerName?: string | null, 
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number,
  breadcrumbs: BreadcrumbItem[]
}> {
  console.log(`[getLotPageData - SampleData Mode] Buscando leilão: ${currentAuctionId}, lote: ${currentLotId}`);

  const auction = sampleAuctions.find(a => a.id === currentAuctionId);
  const lot = sampleLots.find(l => l.id === currentLotId && l.auctionId === currentAuctionId);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Leilões', href: '/search?type=auctions' }
  ];

  if (auction) {
    const lotsForThisAuction = sampleLots.filter(l => l.auctionId === auction.id);
    auction.lots = lotsForThisAuction;
    auction.totalLots = lotsForThisAuction.length;
    console.log(`[getLotPageData - SampleData Mode] Leilão ${auction.id} encontrado. Lotes associados: ${lotsForThisAuction.length}`);
  }

  if (!auction || !lot) {
    if (auction) {
      breadcrumbs.push({ label: auction.title || `Leilão ${auction.id}`, href: `/auctions/${auction.id}` });
    }
    breadcrumbs.push({ label: 'Lote Não Encontrado' });
    console.warn(`[getLotPageData - SampleData Mode] Lote ${currentLotId} ou leilão ${currentAuctionId} não encontrado em sampleData.`);
    return { lot: undefined, auction, breadcrumbs };
  }
  
  // Corrigido para usar a função e o alias corretos, e slugify lot.type
  const lotCategoryName = getCategoryNameFromSampleDataSlug(slugify(lot.type)); 
  
  breadcrumbs.push({ label: auction.title || `Leilão ${auction.id}`, href: `/auctions/${auction.id}` });
  if (lotCategoryName) { // Verifica se o nome da categoria foi encontrado
    breadcrumbs.push({ label: lotCategoryName, href: `/category/${slugify(lot.type)}` }); // Usa slugify(lot.type) para o link
  }
  breadcrumbs.push({ label: lot.title || `Lote ${lot.id}` });

  const lotIndex = auction.lots?.findIndex(l => l.id === currentLotId) ?? -1;
  const totalLotsInAuction = auction.lots?.length ?? 0;
  const previousLotId = (auction.lots && lotIndex > 0) ? auction.lots[lotIndex - 1].id : undefined;
  const nextLotId = (auction.lots && lotIndex < totalLotsInAuction - 1) ? auction.lots[lotIndex + 1].id : undefined;

  let sellerName = lot.sellerName || auction.seller;

  return { lot, auction, sellerName, lotIndex, previousLotId, nextLotId, totalLotsInAuction, breadcrumbs };
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  const { auctionId, lotId } = params; 
  const { lot, auction, sellerName, lotIndex, previousLotId, nextLotId, totalLotsInAuction, breadcrumbs } = await getLotPageData(auctionId, lotId);

  if (!lot || !auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Lote ou Leilão Não Encontrado (Sample Data)</h1>
          <p className="text-muted-foreground">O item que você está procurando não existe ou não pôde ser carregado dos dados de exemplo.</p>
          <Button asChild className="mt-4">
            <Link href={auction ? `/auctions/${auction.id}` : '/'}>
              {auction ? 'Voltar para o Leilão' : 'Voltar para Home'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-8"> 
      <Breadcrumbs items={breadcrumbs} className="mb-4 px-4 sm:px-0" />
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
      auctionId: auction.id,
      lotId: lot.id,
    }))
  );
  return paths;
}
