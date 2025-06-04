
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuctionDetailsClient from './auction-details-client'; // Corrected import path
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getAuctionData(auctionId: string): Promise<Auction | undefined> {
  const auction = sampleAuctions.find(auction => auction.id === auctionId);
  return auction;
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul', 
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro', 
  'Santa Catarina', 'São Paulo', 'Tocantins'
];
export default async function AuctionLotsPage({ params }: { params: { auctionId: string } }) {
  const auction = await getAuctionData(params.auctionId);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando não existe.</p>
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
    auctionId: auction.id, // Ensure this matches the folder name [auctionId]
  }));
}
