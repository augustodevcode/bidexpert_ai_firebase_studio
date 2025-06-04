
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import VirtualAuditoriumClient from './virtual-auditorium-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

async function getAuctionData(auctionId: string): Promise<{ auction: Auction | undefined; currentLot: Lot | undefined; upcomingLots: Lot[] }> {
  try {
    const auction = sampleAuctions.find(a => a.id === auctionId);
    if (!auction) {
      console.warn(`[LiveAuctionPage] Auction not found for ID: ${auctionId}`);
      return { auction: undefined, currentLot: undefined, upcomingLots: [] };
    }

    // Ensure auction.lots is an array before proceeding
    const lotsArray = Array.isArray(auction.lots) ? auction.lots : [];
    if (lotsArray.length === 0 && auction.id) { // Added auction.id check for more specific warning
      console.warn(`[LiveAuctionPage] Auction ID ${auction.id} has no lots defined or an empty lots array.`);
    }

    let currentLot: Lot | undefined;
    let upcomingLots: Lot[] = [];

    if (lotsArray.length > 0) {
      const suitableLotIndex = lotsArray.findIndex(lot => lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE');

      if (suitableLotIndex !== -1) {
        currentLot = lotsArray[suitableLotIndex];
        upcomingLots = lotsArray.slice(suitableLotIndex + 1, suitableLotIndex + 1 + 6);
      } else {
        // Fallback: if no "live" or "upcoming", try to get the first lot if any.
        currentLot = lotsArray[0]; // This is safe; if lotsArray is empty, lotsArray[0] is undefined.
        if (currentLot) { // Only try to slice upcoming if currentLot was found
            upcomingLots = lotsArray.slice(1, 7);
        }
      }
    }
    // If currentLot is still undefined here (e.g., auction has no lots, or no suitable lots found), 
    // the page component will handle it by showing an error message.
    
    return { auction, currentLot, upcomingLots };

  } catch (error) {
    console.error(`[LiveAuctionPage] Critical error in getAuctionData for auctionId ${auctionId}:`, error);
    // Return a state that will lead to an error page or a specific error indicator on the client
    return { auction: undefined, currentLot: undefined, upcomingLots: [] }; 
  }
}

export default async function LiveAuctionPage({ params }: { params: { auctionId: string } }) {
  const { auction, currentLot, upcomingLots } = await getAuctionData(params.auctionId);

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground mb-6">O leilão que você está procurando não existe ou não pôde ser carregado.</p>
        <Button asChild>
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  if (!currentLot) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Nenhum Lote Ativo ou Programado</h1>
        <p className="text-muted-foreground mb-6">Não há lotes adequados (em breve ou abertos para lance) para este leilão no momento.</p>
        <Button asChild>
          <Link href={`/auctions/${auction.id}`}>Ver Detalhes do Leilão</Link>
        </Button>
      </div>
    );
  }

  return (
    <VirtualAuditoriumClient
      auction={auction}
      initialCurrentLot={currentLot}
      initialUpcomingLots={upcomingLots}
    />
  );
}
