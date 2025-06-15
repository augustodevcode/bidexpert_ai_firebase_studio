
// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
import type { Lot, Auction } from '@/types';
import { sampleAuctions, getLotCategoryByName } from '@/lib/sample-data'; 
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Breadcrumbs, { type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { getAuction as getAuctionAction } from '@/app/admin/auctions/actions';
import { getLot as getLotAction, getLots as getLotsAction } from '@/app/admin/lots/actions'; // Importar getLotsAction
import { getSellerBySlug as getSellerBySlugAction } from '@/app/admin/sellers/actions'; 

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
  const auction = await getAuctionAction(currentAuctionId); 
  const lot = await getLotAction(currentLotId); 

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Leilões', href: '/search?type=auctions' }
  ];

  if (auction) {
    // Popular auction.lots para navegação e contagem precisa
    const lotsForThisAuction = await getLotsAction(currentAuctionId);
    auction.lots = lotsForThisAuction;
  }


  if (!auction || !lot || lot.auctionId !== auction.id) { 
    if (auction) {
      breadcrumbs.push({ label: auction.title || `Leilão ${auction.id}`, href: `/auctions/${auction.id}` });
    }
    breadcrumbs.push({ label: 'Lote Não Encontrado' });
    return { lot: undefined, auction, breadcrumbs };
  }
  
  const lotCategory = getLotCategoryByName(lot.type); 
  
  breadcrumbs.push({ label: auction.title || `Leilão ${auction.id}`, href: `/auctions/${auction.id}` });
  if (lotCategory) {
    breadcrumbs.push({ label: lotCategory.name, href: `/category/${lotCategory.slug}` });
  }
  breadcrumbs.push({ label: lot.title || `Lote ${lot.id}` });

  // A lógica de lotIndex, previous/nextLotId e totalLotsInAuction agora usará auction.lots populado do DB.
  const lotIndex = auction.lots?.findIndex(l => l.id === currentLotId) ?? -1;
  const totalLotsInAuction = auction.lots?.length ?? 0;
  const previousLotId = (auction.lots && lotIndex > 0) ? auction.lots[lotIndex - 1].id : undefined;
  const nextLotId = (auction.lots && lotIndex < totalLotsInAuction - 1) ? auction.lots[lotIndex + 1].id : undefined;

  let sellerName = lot.sellerName; 
  if (!sellerName && lot.sellerId) { 
    const sellerProfile = await getSellerBySlugAction(lot.sellerId); 
    if (sellerProfile) {
      sellerName = sellerProfile.name;
    }
  }
  if (!sellerName && auction.seller) { 
      sellerName = auction.seller;
  }


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
          <h1 className="text-2xl font-bold">Lote ou Leilão Não Encontrado</h1>
          <p className="text-muted-foreground">O item que você está procurando não existe ou não pôde ser carregado.</p>
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
  // const paths = sampleAuctions.flatMap(auction =>
  //   (auction.lots || []).map(lot => ({
  //     auctionId: auction.id,
  //     lotId: lot.id,
  //   }))
  // );
  // return paths;
  return []; // Manter vazio para evitar build com sample data se DB for dinâmico
}


