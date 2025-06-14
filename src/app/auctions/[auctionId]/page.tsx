import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuctionDetailsClient from './auction-details-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuction as getAuctionAction } from '@/app/admin/auctions/actions'; // Importar a server action

async function getAuctionData(id: string): Promise<Auction | undefined> {
  // Agora busca do banco de dados via Server Action
  const auction = await getAuctionAction(id);
  return auction || undefined; // Retorna undefined se for null
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro',
  'Santa Catarina', 'São Paulo', 'Tocantins'
];

export default async function AuctionLotsPage({ params }: { params: { auctionId: string } }) {
  const awaitedParams = await params;
  const { auctionId } = awaitedParams; // Desestruturar params aqui
  const auction = await getAuctionData(auctionId);

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
  // Se você ainda quiser usar dados de exemplo para gerar parâmetros estáticos:
  // return sampleAuctions.map((auction) => ({
  //   auctionId: auction.id,
  // }));
  // Ou, para uma abordagem mais dinâmica (mas que pode não ser ideal para SSG puro sem DB na build):
  // const auctions = await getAuctions(); // Precisa de uma action getAuctions se for usar dados reais
  // return auctions.map(auction => ({ auctionId: auction.publicId || auction.id }));
  return []; // Retornar vazio se não for usar SSG ou se os dados forem muito dinâmicos
}