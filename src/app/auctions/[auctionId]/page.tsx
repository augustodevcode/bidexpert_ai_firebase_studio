

import Image from 'next/image';
import Link from 'next/link';
import type { Auction, PlatformSettings } from '@/types';
import { Button } from '@/components/ui/button';
import AuctionDetailsClient from './auction-details-client';
import { getAuction, getAuctions } from '@/app/admin/auctions/actions'; // Import getAuction
import { getLots } from '@/app/admin/lots/actions'; // Import getLots
import { getPlatformSettings } from '@/app/admin/settings/actions'; // Import getPlatformSettings

async function getAuctionData(id: string): Promise<{ auction?: Auction; platformSettings: PlatformSettings }> {
  console.log(`[getAuctionData - Adapter Mode] Chamada com ID: ${id}`);
  
  const [platformSettingsData, auctionFromDb] = await Promise.all([
    getPlatformSettings(),
    getAuction(id)
  ]);
  
  if (!auctionFromDb) {
    console.warn(`[getAuctionData - Adapter Mode] Nenhum leilão encontrado para o ID/PublicID: ${id}.`);
    return { auction: undefined, platformSettings: platformSettingsData };
  }

  const lotsForAuction = await getLots(auctionFromDb.id);
  const auction = { ...auctionFromDb, lots: lotsForAuction, totalLots: lotsForAuction.length };

  console.log(`[getAuctionData - Adapter Mode] Leilão ID ${id} encontrado. Total de lotes: ${lotsForAuction.length}`);
  
  return { auction, platformSettings: platformSettingsData };
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
  
  const { auction, platformSettings } = await getAuctionData(auctionIdParam);

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
        <AuctionDetailsClient auction={auction} platformSettings={platformSettings} />
    </div>
  );
}

export async function generateStaticParams() {
  const auctions = await getAuctions();
  return auctions.map((auction) => ({
    auctionId: auction.publicId || auction.id,
  }));
}
