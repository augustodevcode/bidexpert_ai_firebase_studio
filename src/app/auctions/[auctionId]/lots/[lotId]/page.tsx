
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

  // Acessar os IDs diretamente
  const auctionIdToFind = currentAuctionId;
  const lotIdToFind = currentLotId;

  const auctionFromSample = sampleAuctions.find(a => a.id === auctionIdToFind);
  const lot = sampleLots.find(l => l.id === lotIdToFind && l.auctionId === auctionIdToFind);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Leilões', href: '/search?type=auctions' }
  ];

  let auctionToReturn: Auction | undefined = undefined;

  if (auctionFromSample) {
    const lotsForThisAuction = sampleLots.filter(l => l.auctionId === auctionFromSample.id);
    // É importante não modificar o objeto original de sampleAuctions diretamente
    // se ele for usado em outros lugares. Criamos uma cópia superficial para adicionar/modificar 'lots'.
    auctionToReturn = { ...auctionFromSample, lots: lotsForThisAuction, totalLots: lotsForThisAuction.length };
    console.log(`[getLotPageData - SampleData Mode] Leilão ${auctionToReturn.id} encontrado. Lotes associados: ${lotsForThisAuction.length}`);
    
    if (!lot) {
      breadcrumbs.push({ label: auctionToReturn.title || `Leilão ${auctionToReturn.id}`, href: `/auctions/${auctionToReturn.id}` });
      breadcrumbs.push({ label: 'Lote Não Encontrado' });
      console.warn(`[getLotPageData - SampleData Mode] Lote ${lotIdToFind} não encontrado no leilão ${auctionIdToFind} em sampleData.`);
      return { lot: undefined, auction: auctionToReturn, breadcrumbs };
    }

    // Corrigido para usar a função e o alias corretos, e slugify lot.type
    const lotCategoryName = getCategoryNameFromSampleDataSlug(slugify(lot.type)); 
  
    breadcrumbs.push({ label: auctionToReturn.title || `Leilão ${auctionToReturn.id}`, href: `/auctions/${auctionToReturn.id}` });
    if (lotCategoryName) { // Verifica se o nome da categoria foi encontrado
      breadcrumbs.push({ label: lotCategoryName, href: `/category/${slugify(lot.type)}` }); // Usa slugify(lot.type) para o link
    }
    breadcrumbs.push({ label: lot.title || `Lote ${lot.id}` });

    const lotIndex = auctionToReturn.lots?.findIndex(l => l.id === lotIdToFind) ?? -1;
    const totalLotsInAuction = auctionToReturn.lots?.length ?? 0;
    const previousLotId = (auctionToReturn.lots && lotIndex > 0) ? auctionToReturn.lots[lotIndex - 1].id : undefined;
    const nextLotId = (auctionToReturn.lots && lotIndex < totalLotsInAuction - 1) ? auctionToReturn.lots[lotIndex + 1].id : undefined;
    
    let sellerName = lot.sellerName || auctionToReturn.seller;

    return { lot, auction: auctionToReturn, sellerName, lotIndex, previousLotId, nextLotId, totalLotsInAuction, breadcrumbs };

  } else {
    breadcrumbs.push({ label: 'Leilão Não Encontrado' });
    console.warn(`[getLotPageData - SampleData Mode] Leilão ${auctionIdToFind} não encontrado em sampleData.`);
    return { lot: undefined, auction: undefined, breadcrumbs };
  }
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  // Passar os params diretamente para a função de busca de dados
  const auctionIdParam = params.auctionId;
  const lotIdParam = params.lotId; 
  
  const { 
    lot, 
    auction, 
    sellerName, 
    lotIndex, 
    previousLotId, 
    nextLotId, 
    totalLotsInAuction, 
    breadcrumbs 
  } = await getLotPageData(auctionIdParam, lotIdParam);

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
