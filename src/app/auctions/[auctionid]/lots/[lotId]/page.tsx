
// src/app/auctions/[auctionid]/lots/[lotId]/page.tsx
// Este é um Server Component, NÃO use 'use client' aqui.

import type { Lot, Auction } from '@/types';
import { sampleAuctions } from '@/lib/sample-data';
import LotDetailClientContent from './lot-detail-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import { notFound } from 'next/navigation'; // Descomente se quiser usar a função notFound() do Next.js

// Função para buscar dados do lote e do leilão.
// Esta função é executada no servidor.
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
    // Lote não encontrado especificamente neste leilão, mas o leilão existe.
    return { lot: undefined, auction, lotIndex: -1, totalLotsInAuction: auction.lots.length };
  }
  
  const lot = auction.lots[lotIndex];
  const totalLotsInAuction = auction.lots.length;
  const previousLotId = lotIndex > 0 ? auction.lots[lotIndex - 1].id : undefined;
  const nextLotId = lotIndex < totalLotsInAuction - 1 ? auction.lots[lotIndex + 1].id : undefined;
  
  return { lot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction };
}

export default async function LotDetailPage({ params }: { params: { auctionid: string, lotId: string } }) {
  const { lot, auction, lotIndex, previousLotId, nextLotId, totalLotsInAuction } = await getLotData(params.auctionid, params.lotId);

  if (!lot || !auction || lotIndex === -1) {
    // Opção 1: Usar notFound() para renderizar a página de erro 404 mais próxima (e.g., /app/not-found.tsx)
    // notFound(); 
    // return null; // notFound() já interrompe a renderização

    // Opção 2: Renderizar uma mensagem customizada de "Não Encontrado" diretamente.
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

  // Passa os dados para o componente cliente que cuidará da renderização e interações do lado do cliente.
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

// generateStaticParams permanece aqui, pois é uma função do lado do servidor para build-time.
export async function generateStaticParams() {
  const paths = sampleAuctions.flatMap(auction => 
    auction.lots.map(lot => ({
      auctionid: auction.id, 
      lotId: lot.id,
    }))
  );
  return paths;
}

