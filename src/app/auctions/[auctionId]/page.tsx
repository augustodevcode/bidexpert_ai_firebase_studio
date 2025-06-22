
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions, sampleLots, samplePlatformSettings } from '@/lib/sample-data'; // Usar sampleData
import type { Auction, PlatformSettings } from '@/types';
import { Button } from '@/components/ui/button';
import AuctionDetailsClient from './auction-details-client';

async function getAuctionData(id: string): Promise<{ auction?: Auction; platformSettings: PlatformSettings }> {
  console.log(`[getAuctionData - SampleData Mode] Chamada com ID: ${id}`);
  
  const platformSettingsData = samplePlatformSettings;

  if (!id) {
    console.warn('[getAuctionData - SampleData Mode] ID do leilão não fornecido ou undefined.');
    return { auction: undefined, platformSettings: platformSettingsData };
  }
  
  const auctionFromSample = sampleAuctions.find(a => a.id === id || a.publicId === id);
  if (!auctionFromSample) {
    console.warn(`[getAuctionData - SampleData Mode] Nenhum leilão encontrado para o ID/PublicID: ${id} em sampleAuctions.`);
    return { auction: undefined, platformSettings: platformSettingsData };
  }

  const auction = { ...auctionFromSample };
  const lotsForAuction = sampleLots.filter(lot => lot.auctionId === auction.id || lot.auctionId === auction.publicId);
  auction.lots = lotsForAuction; 
  auction.totalLots = lotsForAuction.length; 

  console.log(`[getAuctionData - SampleData Mode] Leilão ID ${id} encontrado. Total de lotes: ${lotsForAuction.length}`);
  
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
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {auctionIdParam}) não existe ou não pôde ser carregado (usando sampleData).</p>
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
  return sampleAuctions.map((auction) => ({
    auctionId: auction.publicId || auction.id,
  }));
}
