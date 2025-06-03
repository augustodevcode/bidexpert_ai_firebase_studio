
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getAuctioneers } from '@/app/admin/auctioneers/actions'; 
import { sampleAuctions, slugify } from '@/lib/sample-data'; 
import type { Auction, AuctioneerProfileInfo } from '@/types';
import AuctionCard from '@/components/auction-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Building, CalendarDays, PackageOpen, Star, Loader2, Mail, Phone, Globe, Landmark, ExternalLink, Briefcase, Users, BarChartHorizontalBig, TrendingUp, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'


export default function AuctioneerDetailsPage() {
  const params = useParams();
  const auctioneerSlug = typeof params.auctioneerSlug === 'string' ? params.auctioneerSlug : '';

  const [auctioneerProfile, setAuctioneerProfile] = useState<AuctioneerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 }, [Autoplay({delay: 5000})])

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()


  useEffect(() => {
    async function fetchAuctioneerDetails() {
      if (auctioneerSlug) {
        setIsLoading(true);
        setError(null);

        try {
          const allAuctioneers = await getAuctioneers(); 
          const foundAuctioneer = allAuctioneers.find(s => s.slug === auctioneerSlug);

          if (!foundAuctioneer) {
            setError(`Leiloeiro com slug "${auctioneerSlug}" não encontrado.`);
            setAuctioneerProfile(null);
            setIsLoading(false);
            return;
          }
          
          setAuctioneerProfile(foundAuctioneer);

          // Filter sampleAuctions by matching the auctioneer's name
          const auctions = sampleAuctions.filter(auction => 
            auction.auctioneer && slugify(auction.auctioneer) === auctioneerSlug
          );
          setRelatedAuctions(auctions);
          
        } catch (e) {
          console.error("Error fetching auctioneer data:", e);
          setError("Erro ao carregar dados do leiloeiro.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Slug do leiloeiro não fornecido.");
        setIsLoading(false);
      }
    }
    fetchAuctioneerDetails();
  }, [auctioneerSlug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do leiloeiro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/auctioneers">Voltar para Leiloeiros</Link>
        </Button>
      </div>
    );
  }

  if (!auctioneerProfile) {
     return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-muted-foreground">Leiloeiro não encontrado.</h2>
         <Button asChild className="mt-4">
          <Link href="/auctioneers">Voltar para Leiloeiros</Link>
        </Button>
      </div>
    );
  }
  
  const auctioneerInitial = auctioneerProfile.name ? auctioneerProfile.name.charAt(0).toUpperCase() : 'A';
  const recentAuctionsForCarousel = relatedAuctions.slice(0, 5); // Take first 5 for carousel

  return (
    <div className="space-y-10 py-6">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link href="/auctioneers">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Leiloeiros
        </Link>
      </Button>

      {/* Top Section: Auctioneer Info & Recent Auctions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Auctioneer Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="pt-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-primary/30 shadow-md">
                <AvatarImage src={auctioneerProfile.logoUrl || `https://placehold.co/128x128.png?text=${auctioneerInitial}`} alt={auctioneerProfile.name} data-ai-hint={auctioneerProfile.dataAiHintLogo || "logo leiloeiro grande"} />
                <AvatarFallback className="text-4xl">{auctioneerInitial}</AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold font-headline">{auctioneerProfile.name}</h1>
              <p className="text-sm text-muted-foreground">{auctioneerProfile.registrationNumber || 'Leiloeiro Credenciado'}</p>
              {auctioneerProfile.city && auctioneerProfile.state && (
                <p className="text-xs text-muted-foreground mt-0.5">{auctioneerProfile.city} - {auctioneerProfile.state}</p>
              )}
              {auctioneerProfile.rating !== undefined && auctioneerProfile.rating > 0 && (
                <div className="flex items-center justify-center text-sm text-amber-600 mt-2">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
                  {auctioneerProfile.rating.toFixed(1)} 
                  <span className="text-muted-foreground ml-1 text-xs">({Math.floor(Math.random() * 100 + (auctioneerProfile.auctionsConductedCount || 0))} avaliações)</span>
                </div>
              )}
            </CardContent>
          </Card>

           {/* Stats Section - Placeholder */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <p className="text-2xl font-bold text-primary">{auctioneerProfile.auctionsConductedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Leilões Realizados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">R$ {(auctioneerProfile.totalValueSold || 0).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Valor Total Vendido</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">N/A</p>
                <p className="text-xs text-muted-foreground">Faixa de Preço (Leilões)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">N/A</p>
                <p className="text-xs text-muted-foreground">Preço Médio (Leilões)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Auctions Carousel */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" /> Leilões Recentes / Ativos
          </h2>
          {recentAuctionsForCarousel.length > 0 ? (
            <div className="overflow-hidden relative" ref={emblaRef}>
              <div className="flex">
                {recentAuctionsForCarousel.map((auction, index) => (
                  <div key={auction.id || index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_calc(100%/2.2)] xl:flex-[0_0_calc(100%/2.5)] min-w-0 pl-4">
                    <AuctionCard auction={auction} />
                  </div>
                ))}
              </div>
              {recentAuctionsForCarousel.length > 1 && (
                <>
                  <Button variant="outline" size="icon" onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ) : (
             <Card className="shadow-sm">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhum leilão recente para exibir no momento.
                </CardContent>
              </Card>
          )}
        </div>
      </div>

      <Separator />

      {/* Middle Section: About & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-primary" /> Sobre {auctioneerProfile.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auctioneerProfile.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{auctioneerProfile.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma descrição adicional fornecida por este leiloeiro.</p>
              )}
               {auctioneerProfile.memberSince && (
                 <p className="text-xs text-muted-foreground mt-3">
                   <CalendarDays className="inline h-3.5 w-3.5 mr-1" /> Membro desde: {format(new Date(auctioneerProfile.memberSince), 'MMMM yyyy', { locale: ptBR })}
                 </p>
               )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" /> Contatar {auctioneerProfile.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {auctioneerProfile.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${auctioneerProfile.phone}`} className="hover:text-primary">{auctioneerProfile.phone}</a>
                </div>
              )}
              {auctioneerProfile.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${auctioneerProfile.email}`} className="hover:text-primary">{auctioneerProfile.email}</a>
                </div>
              )}
              {auctioneerProfile.address && (
                 <div className="flex items-start">
                  <Landmark className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p>{auctioneerProfile.address}{auctioneerProfile.city && `, ${auctioneerProfile.city}`}{auctioneerProfile.state && ` - ${auctioneerProfile.state}`}{auctioneerProfile.zipCode && `, CEP ${auctioneerProfile.zipCode}`}</p>
                </div>
              )}
              {auctioneerProfile.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a href={auctioneerProfile.website.startsWith('http') ? auctioneerProfile.website : `https://${auctioneerProfile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                    {auctioneerProfile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <Button className="w-full mt-3" disabled>Enviar Mensagem (Formulário em breve)</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Bottom Section: All Auctions by this Auctioneer */}
      {relatedAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 font-headline flex items-center">
            <BarChartHorizontalBig className="h-6 w-6 mr-2 text-primary" /> Todos os Leilões de {auctioneerProfile.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedAuctions.length === 0 && !isLoading && (
        <Card className="shadow-sm">
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Nenhum leilão ativo encontrado para este leiloeiro no momento (usando dados de exemplo).</p>
            <p className="text-xs text-muted-foreground mt-1">Em uma aplicação real, os leilões seriam buscados do banco de dados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
