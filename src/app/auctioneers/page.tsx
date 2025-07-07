// src/app/auctioneers/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Landmark, ArrowRight, CalendarDays, Star } from 'lucide-react';
import Link from 'next/link';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import type { AuctioneerProfileInfo } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getAuctioneerInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'L';
};

export default async function AuctioneersListPage() {
  let auctioneers: AuctioneerProfileInfo[] = [];
  let error: string | null = null;

  try {
    auctioneers = await getAuctioneers();
  } catch (e) {
    console.error("Error fetching auctioneers:", e);
    error = "Falha ao buscar leiloeiros.";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Landmark className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Leiloeiros</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Profissionais e empresas que conduzem os leilões em nossa plataforma.
        </p>
      </section>

      {error && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        </div>
      )}

      {!error && auctioneers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhum leiloeiro cadastrado na plataforma ainda.
          </CardContent>
        </Card>
      )}

      {!error && auctioneers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctioneers.map((auctioneer) => (
            <Card key={auctioneer.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="items-center text-center p-4">
                <Avatar className="h-24 w-24 mb-3 border-2 border-primary/30">
                  <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/100x100.png?text=${getAuctioneerInitial(auctioneer.name)}`} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
                  <AvatarFallback>{getAuctioneerInitial(auctioneer.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl font-semibold">{auctioneer.name}</CardTitle>
                <CardDescription className="text-xs text-primary">{auctioneer.registrationNumber || 'Leiloeiro Credenciado'}</CardDescription>
                {auctioneer.rating !== undefined && auctioneer.rating > 0 && (
                  <div className="flex items-center text-xs text-amber-600 mt-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-1" />
                    {auctioneer.rating.toFixed(1)}
                    <span className="text-muted-foreground ml-1">({Math.floor(Math.random() * 100 + (auctioneer.auctionsConductedCount || 0))} avaliações)</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow px-4 pb-4 space-y-1 text-sm text-muted-foreground text-center">
                {auctioneer.city && auctioneer.state && (
                  <p className="text-xs">{auctioneer.city} - {auctioneer.state}</p>
                )}
                <div className="text-xs">
                  <span className="font-medium text-foreground">{auctioneer.auctionsConductedCount || 0}+</span> leilões conduzidos
                </div>
                {auctioneer.memberSince && (
                  <div className="text-xs">
                    Membro desde: {format(new Date(auctioneer.memberSince), 'MM/yyyy', { locale: ptBR })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`}>
                    Ver Perfil e Leilões <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}