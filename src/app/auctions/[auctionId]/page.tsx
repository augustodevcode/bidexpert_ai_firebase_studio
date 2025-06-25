// src/app/auctions/[auctionId]/page.tsx
import type { Auction, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import AuctionDetailsClient from './auction-details-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuction, getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions'; 

async function getAuctionPageData(id: string): Promise<{ 
  auction?: Auction; 
  auctioneer?: AuctioneerProfileInfo | null;
  platformSettings: PlatformSettings;
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
}> {
  console.log(`[getAuctionPageData - Adapter Mode] Buscando leilão: ${id}`);
  
  const [
      platformSettingsData, 
      auctionFromDb, 
      allCategoriesData, 
      allSellersData,
      allAuctioneersData
    ] = await Promise.all([
    getPlatformSettings(),
    getAuction(id),
    getLotCategories(),
    getSellers(),
    getAuctioneers()
  ]);
  
  if (!auctionFromDb) {
    console.warn(`[getAuctionPageData] Leilão não encontrado para o ID/PublicID: ${id}.`);
    return { platformSettings: platformSettingsData, allCategories: allCategoriesData, allSellers: allSellersData };
  }

  const lotsForAuction = await getLots(auctionFromDb.id);
  const auction = { ...auctionFromDb, lots: lotsForAuction, totalLots: lotsForAuction.length };

  let auctioneer: AuctioneerProfileInfo | null = null;
  if (auction.auctioneerId) {
      const found = allAuctioneersData.find(a => a.id === auction.auctioneerId);
      auctioneer = found || null;
  }

  console.log(`[getAuctionPageData - Adapter Mode] Leilão ID ${id} encontrado. Total de lotes: ${lotsForAuction.length}`);
  
  return { auction, auctioneer, platformSettings: platformSettingsData, allCategories: allCategoriesData, allSellers: allSellersData };
}


export default async function AuctionDetailPage({ params }: { params: { auctionId: string } }) {
  const auctionIdParam = params.auctionId; 

  if (!auctionIdParam) {
    console.error("[AuctionDetailPage] auctionId está undefined nos params.");
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Erro ao Carregar Leilão</h1>
        <p className="text-muted-foreground">Não foi possível identificar o leilão a ser exibido.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }
  
  const { auction, auctioneer, platformSettings, allCategories, allSellers } = await getAuctionPageData(auctionIdParam);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {auctionIdParam}) não existe ou não pôde ser carregado.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-8"> 
        <AuctionDetailsClient 
          auction={auction} 
          auctioneer={auctioneer}
          platformSettings={platformSettings}
          allCategories={allCategories}
          allSellers={allSellers}
        />
    </div>
  );
}

export async function generateStaticParams() {
  const auctions = await getAuctions();
  return auctions.map((auction) => ({
    auctionId: auction.publicId || auction.id,
  }));
}
