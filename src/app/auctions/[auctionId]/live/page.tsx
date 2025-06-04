
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import VirtualAuditoriumClient from './virtual-auditorium-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

async function getAuctionData(auctionId: string): Promise<{ auction: Auction | undefined; currentLot: Lot | undefined; upcomingLots: Lot[] }> {
  console.log(`[LiveAuctionPage] getAuctionData called for auctionId: ${auctionId}`);
  try {
    const auction = sampleAuctions.find(a => a.id === auctionId);
    if (!auction) {
      console.warn(`[LiveAuctionPage] Auction not found for ID: ${auctionId}`);
      return { auction: undefined, currentLot: undefined, upcomingLots: [] };
    }
    console.log(`[LiveAuctionPage] Found auction: ${auction.title} (ID: ${auction.id})`);

    // A propriedade auction.lots em sampleAuctions já deve estar filtrada pela definição em sample-data.ts
    const lotsArray = Array.isArray(auction.lots) ? auction.lots : [];
    console.log(`[LiveAuctionPage] auction.lots for ${auction.id} has ${lotsArray.length} items.`);
    
    if (lotsArray.length === 0) {
      console.warn(`[LiveAuctionPage] Auction ID ${auction.id} has no lots in its 'lots' property. Returning no currentLot.`);
      return { auction, currentLot: undefined, upcomingLots: [] };
    }

    let currentLot: Lot | undefined;
    let upcomingLots: Lot[] = [];

    const suitableLotIndex = lotsArray.findIndex(lot => lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE');
    console.log(`[LiveAuctionPage] suitableLotIndex for active/upcoming: ${suitableLotIndex}`);

    if (suitableLotIndex !== -1) {
      currentLot = lotsArray[suitableLotIndex];
      upcomingLots = lotsArray.slice(suitableLotIndex + 1, suitableLotIndex + 1 + 6);
      console.log(`[LiveAuctionPage] Found suitable currentLot: ${currentLot?.id}, upcomingLots count: ${upcomingLots.length}`);
    } else {
      // Fallback: se não houver lote "ao vivo" ou "em breve", tenta pegar o primeiro lote da lista.
      currentLot = lotsArray[0]; 
      if (currentLot) {
        upcomingLots = lotsArray.slice(1, 7);
        console.log(`[LiveAuctionPage] Fallback currentLot: ${currentLot?.id}, upcomingLots count: ${upcomingLots.length}`);
      } else {
        // Este caso não deveria acontecer se lotsArray.length > 0
        console.warn(`[LiveAuctionPage] Fallback failed, no lots available in lotsArray even though lotsArray.length > 0. This is unexpected.`);
      }
    }
    
    if (!currentLot) {
        console.warn(`[LiveAuctionPage] currentLot is STILL UNDEFINED before returning for auction ${auction.id}. This will lead to 'Nenhum Lote Ativo' message.`);
    } else {
        console.log(`[LiveAuctionPage] Successfully determined currentLot: ${currentLot.id} for auction ${auction.id}`);
    }

    return { auction, currentLot, upcomingLots };

  } catch (error) {
    console.error(`[LiveAuctionPage] Critical error in getAuctionData for auctionId ${auctionId}:`, error);
    return { auction: undefined, currentLot: undefined, upcomingLots: [] }; 
  }
}

export default async function LiveAuctionPage({ params }: { params: { auctionId: string } }) {
  console.log(`[LiveAuctionPage Component] Rendering for auctionId: ${params.auctionId}`);
  const { auction, currentLot, upcomingLots } = await getAuctionData(params.auctionId);

  console.log(`[LiveAuctionPage Component] Data from getAuctionData:`, {
    auctionId: auction?.id,
    currentLotId: currentLot?.id,
    upcomingLotsCount: upcomingLots.length,
  });

  if (!auction) {
    console.error(`[LiveAuctionPage Component] Auction not found (auction is ${auction}), rendering error page.`);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground mb-6">O leilão que você está procurando não existe ou não pôde ser carregado (ID: {params.auctionId}).</p>
        <Button asChild>
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  if (!currentLot) {
     console.error(`[LiveAuctionPage Component] CurrentLot not found (currentLot is ${currentLot}) for auction ${auction.id}, rendering error page.`);
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Nenhum Lote Ativo ou Programado</h1>
        <p className="text-muted-foreground mb-6">Não há lotes adequados (em breve ou abertos para lance) para este leilão (ID: {auction.id}) no momento.</p>
        <Button asChild>
          <Link href={`/auctions/${auction.id}`}>Ver Detalhes do Leilão</Link>
        </Button>
      </div>
    );
  }

  console.log(`[LiveAuctionPage Component] Rendering VirtualAuditoriumClient with currentLot: ${currentLot.id}`);
  return (
    <VirtualAuditoriumClient
      auction={auction}
      initialCurrentLot={currentLot}
      initialUpcomingLots={upcomingLots}
    />
  );
}
