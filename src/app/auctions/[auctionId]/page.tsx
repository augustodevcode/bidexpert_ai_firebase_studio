
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuctionDetailsClient from './auction-details-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuction as getAuctionAction } from '@/app/admin/auctions/actions'; 
import { getLots as getLotsAction } from '@/app/admin/lots/actions'; // Importar getLots

async function getAuctionData(id: string): Promise<Auction | undefined> {
  console.log(`[getAuctionData] Chamada com ID: ${id}`);
  if (!id) {
    console.warn('[getAuctionData] ID do leilão não fornecido ou undefined.');
    return undefined;
  }
  
  const auction = await getAuctionAction(id); // Busca o leilão do DB
  if (!auction) {
    console.warn(`[getAuctionData] Nenhum leilão encontrado para o ID: ${id}`);
    return undefined;
  }

  // Buscar os lotes para este leilão e atribuí-los
  const lotsForAuction = await getLotsAction(id); // Passa o ID do leilão (pode ser publicId ou numérico)
  auction.lots = lotsForAuction;
  console.log(`[getAuctionData] Leilão ID ${id} encontrado. Total de lotes buscados do DB: ${lotsForAuction.length}`);
  
  return auction; 
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro',
  'Santa Catarina', 'São Paulo', 'Tocantins'
];

export default async function AuctionLotsPage({ params: paramsProp }: { params: { auctionId: string } }) {
  const params = paramsProp; 
  const { auctionId } = params; 

  if (!auctionId) {
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
  
  const auction = await getAuctionData(auctionId);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {auctionId}) não existe ou não pôde ser carregado.</p>
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
  // return sampleAuctions.map((auction) => ({
  //   auctionId: auction.id,
  // }));
  return []; 
}

