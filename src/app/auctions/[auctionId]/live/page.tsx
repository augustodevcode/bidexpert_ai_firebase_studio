
'use client'; // This page now needs client-side hooks for searchParams

import { sampleAuctions } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import VirtualAuditoriumClient from './virtual-auditorium-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getAuction, getLots } from '@/app/admin/auctions/actions'; // Updated to use correct actions
import { getLots as getLotData } from '@/app/admin/lots/actions';


async function fetchAuctionData(auctionId: string, targetLotId?: string | null): Promise<{ auction: Auction | null; currentLot: Lot | undefined; upcomingLots: Lot[] }> {
  console.log(`[LiveAuctionPage] fetchAuctionData called for auctionId: ${auctionId}, targetLotId: ${targetLotId}`);
  try {
    const auction = await getAuction(auctionId);
    if (!auction) {
      console.warn(`[LiveAuctionPage] Auction not found for ID: ${auctionId}`);
      return { auction: null, currentLot: undefined, upcomingLots: [] };
    }
    console.log(`[LiveAuctionPage] Found auction: ${auction.title} (ID: ${auction.id})`);

    const lotsArray = await getLotData(auction.id);
    console.log(`[LiveAuctionPage] auction.lots for ${auction.id} has ${lotsArray.length} items.`);
    
    if (lotsArray.length === 0) {
      console.warn(`[LiveAuctionPage] Auction ID ${auction.id} has no lots.`);
      return { auction, currentLot: undefined, upcomingLots: [] };
    }

    let currentLot: Lot | undefined;
    let upcomingLots: Lot[] = [];
    let currentLotIndex = -1;

    if (targetLotId) {
      currentLotIndex = lotsArray.findIndex(lot => lot.id === targetLotId || lot.publicId === targetLotId);
      if (currentLotIndex !== -1) {
        currentLot = lotsArray[currentLotIndex];
        console.log(`[LiveAuctionPage] Focused on targetLotId: ${currentLot?.id}`);
      } else {
        console.warn(`[LiveAuctionPage] targetLotId ${targetLotId} not found in auction ${auctionId}. Falling back.`);
      }
    }

    if (!currentLot) {
      // Fallback: find first 'ABERTO_PARA_LANCES' or 'EM_BREVE'
      currentLotIndex = lotsArray.findIndex(lot => lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE');
      if (currentLotIndex !== -1) {
        currentLot = lotsArray[currentLotIndex];
        console.log(`[LiveAuctionPage] Fallback to first active/upcoming lot: ${currentLot?.id}`);
      } else {
        // Final fallback: first lot in the array if any exist
        if (lotsArray.length > 0) {
            currentLot = lotsArray[0];
            currentLotIndex = 0;
            console.log(`[LiveAuctionPage] Final fallback to first lot in array: ${currentLot?.id}`);
        }
      }
    }
    
    if (currentLotIndex !== -1) {
        upcomingLots = lotsArray.slice(currentLotIndex + 1, currentLotIndex + 1 + 6);
    } else if (currentLot && lotsArray.length > 1) { // Case where currentLot was set by final fallback and it's the first in array
        upcomingLots = lotsArray.slice(1, 7);
    }


    if (!currentLot) {
        console.warn(`[LiveAuctionPage] currentLot is STILL UNDEFINED for auction ${auction.id}.`);
    } else {
        console.log(`[LiveAuctionPage] Successfully determined currentLot: ${currentLot.id} for auction ${auction.id}, upcoming: ${upcomingLots.length}`);
    }

    // Attach lots to auction object for client component
    auction.lots = lotsArray;
    return { auction, currentLot, upcomingLots };

  } catch (error) {
    console.error(`[LiveAuctionPage] Critical error in fetchAuctionData for auctionId ${auctionId}:`, error);
    return { auction: null, currentLot: undefined, upcomingLots: [] }; 
  }
}

export default function LiveAuctionPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const auctionId = typeof params.auctionId === 'string' ? params.auctionId : '';
  const targetLotId = searchParams.get('lotId');

  const [auctionData, setAuctionData] = useState<{ auction: Auction | null; currentLot: Lot | undefined; upcomingLots: Lot[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auctionId) {
      setIsLoading(true);
      fetchAuctionData(auctionId, targetLotId)
        .then(data => {
          setAuctionData(data);
          if (!data.auction) setError("Leilão não encontrado.");
          else if (!data.currentLot) setError("Nenhum lote adequado para exibição neste leilão.");
          else setError(null);
        })
        .catch(e => {
          console.error("Error in LiveAuctionPage useEffect:", e);
          setError("Erro ao carregar dados do auditório.");
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("ID do leilão não fornecido.");
      setIsLoading(false);
    }
  }, [auctionId, targetLotId]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Carregando Auditório...</h1>
        </div>
    );
  }

  if (error || !auctionData || !auctionData.auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">{error || "Leilão Não Encontrado"}</h1>
        <p className="text-muted-foreground mb-6">
          {error ? `Detalhes: ${error}` : `O leilão que você está procurando (ID: ${auctionId}) não existe ou não pôde ser carregado.`}
        </p>
        <Button asChild>
          <Link href="/live-dashboard">Voltar ao Painel Ao Vivo</Link>
        </Button>
      </div>
    );
  }
  
  if (!auctionData.currentLot) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Nenhum Lote Ativo ou Programado</h1>
        <p className="text-muted-foreground mb-6">Não há lotes adequados (em breve ou abertos para lance) para este leilão (ID: ${auctionData.auction.id}) no momento, ou o lote específico não foi encontrado.</p>
        <Button asChild>
          <Link href={`/auctions/${auctionData.auction.publicId || auctionData.auction.id}`}>Ver Detalhes do Leilão</Link>
        </Button>
         <Button asChild variant="secondary" className="ml-2">
          <Link href="/live-dashboard">Voltar ao Painel Ao Vivo</Link>
        </Button>
      </div>
    );
  }

  return (
    <VirtualAuditoriumClient
      auction={auctionData.auction}
      initialCurrentLot={auctionData.currentLot}
      initialUpcomingLots={auctionData.upcomingLots}
    />
  );
}
