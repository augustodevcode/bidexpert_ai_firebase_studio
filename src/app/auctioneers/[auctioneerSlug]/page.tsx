
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { sampleAuctions, slugify, getUniqueAuctioneers } from '@/lib/sample-data';
import type { Auction, AuctioneerProfileInfo } from '@/types';
import AuctionCard from '@/components/auction-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Building, CalendarDays, PackageOpen, Star, Loader2, Mail, Phone, Globe, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuctioneerDetailsPage() {
  const params = useParams();
  const auctioneerSlug = typeof params.auctioneerSlug === 'string' ? params.auctioneerSlug : '';

  const [auctioneerProfile, setAuctioneerProfile] = useState<AuctioneerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auctioneerSlug) {
      setIsLoading(true);
      setError(null);

      try {
        const allAuctioneers = getUniqueAuctioneers(); // This now returns AuctioneerProfileInfo[]
        const foundAuctioneer = allAuctioneers.find(s => s.slug === auctioneerSlug);

        if (!foundAuctioneer) {
          setError(`Leiloeiro com slug "${auctioneerSlug}" não encontrado.`);
          setAuctioneerProfile(null);
          setIsLoading(false);
          return;
        }
        
        setAuctioneerProfile(foundAuctioneer);

        // Filter auctions by matching the auctioneer's name (as slugs might not be in sampleAuctions directly)
        const auctions = sampleAuctions.filter(auction => 
          auction.auctioneer && slugify(auction.auctioneer) === auctioneerSlug
        );
        setRelatedAuctions(auctions);
        
      } catch (e) {
        console.error("Error processing auctioneer data:", e);
        setError("Erro ao processar dados do leiloeiro.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Slug do leiloeiro não fornecido.");
      setIsLoading(false);
    }
  }, [auctioneerSlug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do leiloeiro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/auctioneers">Voltar para Leiloeiros</Link>
        </Button>
      </div>
    );
  }

  if (!auctioneerProfile) {
     return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Leiloeiro não encontrado.</h2>
         <Button asChild className="mt-4">
          <Link href="/auctioneers">Voltar para Leiloeiros</Link>
        </Button>
      </div>
    );
  }
  
  const auctioneerInitial = auctioneerProfile.name ? auctioneerProfile.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="space-y-8">
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            <div className="flex items-start gap-4 md:gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-primary/30 shadow-md">
                <AvatarImage src={auctioneerProfile.logoUrl} alt={auctioneerProfile.name} data-ai-hint={auctioneerProfile.dataAiHintLogo} />
                <AvatarFallback className="text-3xl md:text-4xl">{auctioneerInitial}</AvatarFallback>
              </Avatar>
              <div className="mt-2 md:mt-0">
                <CardDescription className="text-sm flex items-center gap-1.5 text-primary">
                    <Landmark className="h-4 w-4" /> Leiloeiro Oficial
                </CardDescription>
                <CardTitle className="text-2xl md:text-4xl font-bold font-headline">{auctioneerProfile.name}</CardTitle>
                {auctioneerProfile.registrationNumber && (
                    <p className="text-xs text-muted-foreground">{auctioneerProfile.registrationNumber}</p>
                )}
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  {auctioneerProfile.memberSince && (
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        <span>Membro desde: {format(new Date(auctioneerProfile.memberSince), 'MMMM yyyy', { locale: ptBR })}</span>
                    </div>
                  )}
                  {auctioneerProfile.rating !== undefined && (
                    <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span>Avaliação: {auctioneerProfile.rating.toFixed(1)} / 5.0 ({Math.floor(Math.random() * 50 + 10)} avaliações)</span>
                    </div>
                  )}
                  {auctioneerProfile.auctionsConductedCount !== undefined && (
                    <div className="flex items-center gap-1.5">
                        <PackageOpen className="h-4 w-4" />
                        <span>Leilões Conduzidos: {auctioneerProfile.auctionsConductedCount}+</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" asChild className="w-full md:w-auto self-start md:self-center">
              <Link href="/auctioneers">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Leiloeiros
              </Link>
            </Button>
          </div>
            {auctioneerProfile.description && (
                 <p className="text-muted-foreground text-sm border-t pt-4">{auctioneerProfile.description}</p>
            )}
             <div className="border-t pt-4 mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                {auctioneerProfile.city && auctioneerProfile.state && (
                    <div className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5"/>{auctioneerProfile.city} - {auctioneerProfile.state}</div>
                )}
                {auctioneerProfile.phone && (
                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/>{auctioneerProfile.phone}</div>
                )}
                {auctioneerProfile.email && (
                    <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5"/>{auctioneerProfile.email}</div>
                )}
                {auctioneerProfile.website && (
                    <a href={auctioneerProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                        <Globe className="h-3.5 w-3.5"/>{auctioneerProfile.website.replace(/^https?:\/\//, '')}
                    </a>
                )}
            </div>
        </CardHeader>
      </Card>

      {relatedAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Leilões Ativos de {auctioneerProfile.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedAuctions.length === 0 && !isLoading && (
        <Card>
            <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Nenhum leilão ativo encontrado para este leiloeiro no momento.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
