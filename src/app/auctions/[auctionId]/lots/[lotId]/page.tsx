
// src/app/auctions/[auctionId]/lots/[lotId]/page.tsx
// Este é um Server Component, NÃO use 'use client' aqui.

import type { Lot, Auction } from '@/types';
import { sampleAuctions } from '@/lib/sample-data';
import LotDetailClientContent from './lot-detail-client'; // Corrected import path
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getLotData(auctionId: string, lotId: string): Promise<{ 
  lot: Lot | undefined, 
  auction: Auction | undefined,
  lotIndex?: number,
  previousLotId?: string,
  nextLotId?: string,
  totalLotsInAuction?: number
}> {
  const auction = sampleAuctions.find(a => a.id === auctionId);
  if (!auction) {
    return { lot: undefined, auction: undefined };
  }
  const lotIndex = auction.lots.findIndex(l => l.id === lotId);
  
  if (lotIndex === -1) {
    return { lot: undefined, auction, lotIndex: -1, totalLotsInAuction: auction.lots.length };
  }
  
  const lot = auction.lots[lotIndex];
  const totalLotsInAuction = auction.lots.length;
  const previousLotId = lotIndex > 0 ? auction.lots[lotIndex - 1].id : undefined;
  const nextLotId = lotIndex < totalLotsInAuction - 1 ? auction.lots[lotIndex + 1].id : undefined;
  
  return { lot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction };
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  const { lot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction } = await getLotData(params.auctionId, params.lotId);

  if (!lot || !auction || lotIndex === -1) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Lote Não Encontrado</h1>
        <p className="text-muted-foreground">O lote que você está procurando não existe ou não pertence a este leilão.</p>
        <Button asChild className="mt-4">
          <Link href={auction ? `/auctions/${auction.id}` : '/'}>
            {auction ? 'Voltar para o Leilão' : 'Voltar para Home'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <LotDetailClientContent 
      lot={lot} 
      auction={auction} 
      lotIndex={lotIndex}
      previousLotId={previousLotId}
      nextLotId={nextLotId}
      totalLotsInAuction={totalLotsInAuction}
    />
  );
}

export async function generateStaticParams() {
  const paths = sampleAuctions.flatMap(auction => 
    auction.lots.map(lot => ({
      auctionId: auction.id, // Ensure this matches the folder name [auctionId]
      lotId: lot.id,
    }))
  );
  return paths;
}
