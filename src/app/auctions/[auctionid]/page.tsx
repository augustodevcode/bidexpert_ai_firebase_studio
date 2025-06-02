
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions } from '@/lib/sample-data'; // sampleLots não é usado diretamente aqui
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // CardDescription não é usado
import AuctionDetailsClient from './auction-details-client'; // Import the new client component
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getAuctionData(auctionid: string): Promise<Auction | undefined> {
  const auction = sampleAuctions.find(auction => auction.id === auctionid);
  // A associação dos lotes já é feita dentro do objeto sampleAuctions
  return auction;
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul', 
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro', 
  'Santa Catarina', 'São Paulo', 'Tocantins'
];
export default async function AuctionLotsPage({ params }: { params: { auctionid: string } }) {
  const auction = await getAuctionData(params.auctionid);

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
    <AuctionDetailsClient auction={auction} estados={estados} /> // Render the client component and pass data
  );
}

// Generate static paths for sample auctions
export async function generateStaticParams() {
  return sampleAuctions.map((auction) => ({
    auctionid: auction.id, // Alterado de id para auctionid
  }));
}
