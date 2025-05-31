
import Image from 'next/image';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Tag, Users, MapPin, DollarSign, User, CalendarDays, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import ptBR locale
import Link from 'next/link';

// Helper function to find an auction by ID (replace with actual data fetching)
async function getAuction(id: string): Promise<Auction | undefined> {
  return sampleAuctions.find(auction => auction.id === id);
}

export default async function AuctionDetailPage({ params }: { params: { id: string } }) {
  const auction = await getAuction(params.id);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando não existe ou pode ter terminado.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Leilões</Link>
        </Button>
      </div>
    );
  }

  const timeLeft = auction.endDate
    ? format(auction.endDate, "d 'de' MMMM 'de' yyyy 'às' HH:mm'h'", { locale: ptBR })
    : "Data de encerramento não definida";

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0 relative">
          <div className="aspect-video w-full relative">
            <Image
              src={auction.imageUrl}
              alt={auction.title}
              fill
              sizes="100vw"
              className="object-cover"
              data-ai-hint={auction.dataAiHint}
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Badge variant="secondary" className="mb-2">{auction.category}</Badge>
          <CardTitle className="text-3xl font-bold mb-2 font-headline">{auction.title}</CardTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2 text-primary" /> Vendedor: <span className="font-medium text-foreground ml-1">{auction.seller}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 text-primary" /> Localização: <span className="font-medium text-foreground ml-1">{auction.location || 'N/A'}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Condição: <span className="font-medium text-foreground ml-1">{auction.condition || 'N/A'}</span>
            </div>
             <div className="flex items-center text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2 text-primary" /> Encerra: <span className="font-medium text-foreground ml-1">{timeLeft}</span>
            </div>
          </div>
          
          <CardDescription className="text-base leading-relaxed mb-6">
            {auction.description}
          </CardDescription>

          <div className="bg-secondary/50 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Lance Atual</p>
                <p className="text-4xl font-bold text-primary">R$ {auction.currentBid ? auction.currentBid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 {auction.initialOffer && ( // Corrected from auction.startingBid to auction.initialOffer based on type
                  <p className="text-xs text-muted-foreground mt-1">Lance Inicial: R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>
              <div className="text-right mt-4 md:mt-0">
                 <div className="flex items-center text-muted-foreground mb-1">
                  <Users className="h-4 w-4 mr-2" /> {auction.bidsCount || 0} lances
                </div>
                <Button size="lg" className="w-full md:w-auto">
                  <DollarSign className="mr-2 h-5 w-5" /> Dar Lance
                </Button>
              </div>
            </div>
          </div>

          {/* Placeholder for Bid History */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Histórico de Lances</h3>
            <p className="text-muted-foreground text-sm">O histórico de lances será exibido aqui.</p>
            {/* Example bid items
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between text-sm"><span>Bidder***</span><span>$7600</span><span>Just now</span></div>
            </div>
            */}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// Generate static paths for sample auctions
export async function generateStaticParams() {
  return sampleAuctions.map((auction) => ({
    id: auction.id,
  }));
}
