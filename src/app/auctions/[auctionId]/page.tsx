
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions, sampleLots } from '@/lib/sample-data'; // Usar sampleData
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuctionDetailsClient from './auction-details-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getAuctionData(id: string): Promise<Auction | undefined> {
  console.log(`[getAuctionData - SampleData Mode] Chamada com ID: ${id}`);
  if (!id) {
    console.warn('[getAuctionData - SampleData Mode] ID do leilão não fornecido ou undefined.');
    return undefined;
  }
  
  const auctionFromSample = sampleAuctions.find(a => a.id === id);
  if (!auctionFromSample) {
    console.warn(`[getAuctionData - SampleData Mode] Nenhum leilão encontrado para o ID: ${id} em sampleAuctions.`);
    return undefined;
  }

  // Criar uma cópia para evitar mutação direta dos dados de exemplo
  const auction = { ...auctionFromSample };

  // Popular os lotes do leilão a partir de sampleLots
  const lotsForAuction = sampleLots.filter(lot => lot.auctionId === auction.id);
  auction.lots = lotsForAuction; 
  auction.totalLots = lotsForAuction.length; 

  console.log(`[getAuctionData - SampleData Mode] Leilão ID ${id} encontrado em sampleAuctions. Total de lotes: ${lotsForAuction.length}`);
  
  return auction; 
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro',
  'Santa Catarina', 'São Paulo', 'Tocantins'
];

export default async function AuctionLotsPage({ params }: { params: { auctionId: string } }) {
  const auctionIdParam = params.auctionId; 

  if (!auctionIdParam) {
    console.error("[AuctionLotsPage] auctionId está undefined nos params.");
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
  
  const auction = await getAuctionData(auctionIdParam);

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
    <AuctionDetailsClient auction={auction} />
  );
}

export async function generateStaticParams() {
  return sampleAuctions.map((auction) => ({
    auctionId: auction.id,
  }));
}

