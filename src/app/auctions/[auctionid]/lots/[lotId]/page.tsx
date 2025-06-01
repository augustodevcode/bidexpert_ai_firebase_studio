
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
async function getLotData(auctionId: string, lotId: string): Promise<{ lot: Lot | undefined, auction: Auction | undefined }> {
  const auction = sampleAuctions.find(a => a.id === auctionId);
  if (!auction) {
    return { lot: undefined, auction: undefined };
  }
  // Encontra o lote dentro dos lotes do leilão encontrado
  const lot = auction.lots.find(l => l.id === lotId);
  return { lot, auction };
}

export default async function LotDetailPage({ params }: { params: { auctionid: string, lotId: string } }) {
  const { lot, auction } = await getLotData(params.auctionid, params.lotId);

  if (!lot || !auction) {
    // Opção 1: Usar notFound() para renderizar a página de erro 404 mais próxima (e.g., /app/not-found.tsx)
    // notFound(); 
    // return null; // notFound() já interrompe a renderização

    // Opção 2: Renderizar uma mensagem customizada de "Não Encontrado" diretamente.
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Lote Não Encontrado</h1>
        <p className="text-muted-foreground">O lote que você está procurando não existe ou não pertence a este leilão.</p>
        <Button asChild className="mt-4">
          <Link href={`/auctions/${params.auctionid}`}>Voltar para o Leilão</Link>
        </Button>
      </div>
    );
  }

  // Passa os dados para o componente cliente que cuidará da renderização e interações do lado do cliente.
  return <LotDetailClientContent lot={lot} auction={auction} />;
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
