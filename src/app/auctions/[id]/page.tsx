
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions, sampleLots } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LotCard from '@/components/lot-card';
import { 
  Clock, Tag, Users, MapPin, DollarSign, User, CalendarDays, ShieldCheck, 
  HomeIcon, ChevronRight, FileText, Heart, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getAuctionData(id: string): Promise<Auction | undefined> {
  // Em um app real, buscaria o leilão e depois os lotes associados.
  // Aqui, estamos pegando um leilão de exemplo e seus lotes filtrados.
  const auction = sampleAuctions.find(auction => auction.id === id);
  if (auction) {
    // Certifica-se de que os lotes estão associados corretamente (já feito no sample-data)
    // auction.lots = sampleLots.filter(lot => lot.auctionId === id);
    // auction.totalLots = auction.lots.length;
  }
  return auction;
}

const estados = [
  'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul', 
  'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro', 
  'Santa Catarina', 'São Paulo', 'Tocantins'
];

export default async function AuctionLotsPage({ params }: { params: { id: string } }) {
  const auction = await getAuctionData(params.id);

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
    <div className="space-y-8">
      {/* Breadcrumbs e Cabeçalho do Leilão */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Link href="/" className="hover:text-primary">Home</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span>Leilão {auction.id}</span>
              </div>
              <div className="mb-3 space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Data: {format(new Date(auction.auctionDate), "dd/MM/yyyy HH:mm", { locale: ptBR })} | Lotes: {auction.totalLots} | Status: <span className="font-semibold text-primary">{auction.status}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Leiloeiro: {auction.auctioneer} | Categoria: {auction.category}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-3">
              {auction.auctioneerLogoUrl && (
                <Image src={auction.auctioneerLogoUrl} alt="Logo Leiloeiro" width={120} height={40} className="object-contain" data-ai-hint="logo leiloeiro"/>
              )}
              <Button variant="default" size="sm">
                <FileText className="h-4 w-4 mr-2" /> Ver Documentos
              </Button>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-primary">
                  <Heart className="h-4 w-4 mr-1" /> Favoritar Leilão
                </Button>
                <span>#Leilão: {auction.id}</span>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>Visitas: {auction.visits?.toLocaleString('pt-BR') || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Estado */}
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg font-semibold">Selecione um estado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {estados.map(estado => (
            <Button key={estado} variant="outline" size="sm">{estado}</Button>
          ))}
        </CardContent>
      </Card>

      {/* Contagem de Lotes e Grade */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{auction.lots.length} lote(s) encontrado(s)</h2>
        {auction.lots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auction.lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-secondary/30 rounded-lg">
            <p className="text-muted-foreground">Nenhum lote encontrado para este leilão.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate static paths for sample auctions
export async function generateStaticParams() {
  return sampleAuctions.map((auction) => ({
    id: auction.id,
  }));
}
