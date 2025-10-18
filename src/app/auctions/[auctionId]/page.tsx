// src/app/auctions/[auctionId]/page.tsx
/**
 * @fileoverview Página de servidor para renderização inicial dos detalhes de um leilão.
 * Este componente Server-Side busca os dados essenciais de um leilão específico,
 * incluindo seus lotes, e os dados de apoio para filtros (categorias, comitentes).
 * Ele delega a renderização final e toda a interatividade para o componente
 * de cliente `AuctionDetailsClient`, garantindo um carregamento inicial rápido (SSR/SSG).
 */
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

export const dynamic = 'force-dynamic';

async function getAuctionPageData(id: string): Promise<{ 
  auction?: Auction; 
  auctioneer?: AuctioneerProfileInfo | null;
  platformSettings: PlatformSettings;
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
}> {
  console.log(`[getAuctionPageData] Buscando leilão: ${id}`);

  const [
      platformSettingsData, 
      auctionFromDb, 
      allCategoriesData, 
      allSellersData,
      allAuctioneersData
    ] = await Promise.all([
    getPlatformSettings(),
    getAuction(id, true), // Public call
    getLotCategories(),
    getSellers(true), // Public call
    getAuctioneers(true) // Public call
  ]);
  
  if (!auctionFromDb) {
    console.warn(`[getAuctionPageData] Leilão não encontrado para o ID/PublicID: ${id}.`);
    // @ts-ignore
    return { platformSettings: platformSettingsData, allCategories: allCategoriesData, allSellers: allSellersData };
  }

  // A service getAuction já deve incluir os lotes E os estágios.
  const auction = { ...auctionFromDb, totalLots: auctionFromDb.lots?.length ?? 0 };
  
  let auctioneer: AuctioneerProfileInfo | null = null;
  if (auction.auctioneerId) {
      const found = allAuctioneersData.find(a => a.id === auction.auctioneerId);
      auctioneer = found || null;
  } else if (auction.auctioneer) {
      // @ts-ignore
      const found = allAuctioneersData.find(a => a.name === auction.auctioneer);
      auctioneer = found || null;
  }

  console.log(`[getAuctionPageData] Leilão ID ${id} encontrado. Total de lotes: ${auction.totalLots}, Total de estágios: ${auction.auctionStages?.length}`);
  
  return { auction, auctioneer, platformSettings: platformSettingsData!, allCategories: allCategoriesData, allSellers: allSellersData };
}


export default async function AuctionDetailPage({ params }: { params: { auctionId: string } }) {
  if (!params.auctionId) {
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
  
  const { auction, auctioneer, platformSettings, allCategories, allSellers } = await getAuctionPageData(params.auctionId);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {params.auctionId}) não existe ou não pôde ser carregado.</p>
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
          auctioneer={auctioneer || null}
          platformSettings={platformSettings!}
          allCategories={allCategories}
          allSellers={allSellers}
        />
    </div>
  );
}
