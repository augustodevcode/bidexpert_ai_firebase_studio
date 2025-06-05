
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { sampleAuctions, slugify } from '@/lib/sample-data';
import type { Auction, AuctioneerProfileInfo } from '@/types';
import AuctionCard from '@/components/auction-card'; // Keep for the main list
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Star, Loader2, Mail, Phone, Globe, Landmark, Briefcase, Users, TrendingUp, ShieldCheck, MessageSquare } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// New simplified card for the "Recent Auctions" carousel
function RecentAuctionCarouselItem({ auction }: { auction: Auction }) {
  const auctionEndDate = auction.endDate || (auction.auctionStages && auction.auctionStages.length > 0 ? auction.auctionStages[auction.auctionStages.length - 1].endDate : auction.auctionDate);
  const daysAgo = differenceInDays(new Date(), new Date(auctionEndDate));
  const statusText = new Date(auctionEndDate) < new Date() ? `Encerrado ${daysAgo} dias atrás` : `Encerra em ${differenceInDays(new Date(auctionEndDate), new Date())} dias`;

  return (
    <Card className="overflow-hidden shadow-md h-full flex flex-col">
      <Link href={`/auctions/${auction.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={auction.imageUrl || 'https://placehold.co/600x450.png'}
            alt={auction.title}
            fill
            className="object-cover"
            data-ai-hint={auction.dataAiHint || "auction item small"}
          />
        </div>
      </Link>
      <CardContent className="p-3 flex-grow">
        <p className="text-lg font-bold text-primary">
          R$ {(auction.initialOffer || auction.lots?.[0]?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {auction.lots?.length || 0} lotes | {auction.category} | {auction.city}, {auction.state}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>
          {statusText}
        </p>
      </CardContent>
    </Card>
  );
}


export default function AuctioneerDetailsPage() {
  const params = useParams();
  const auctioneerSlug = typeof params.auctioneerSlug === 'string' ? params.auctioneerSlug : '';

  const [auctioneerProfile, setAuctioneerProfile] = useState<AuctioneerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 }, [Autoplay({ delay: 5000 })]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

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
  const recentAuctionsForCarousel = relatedAuctions.slice(0, 5);

  const placeholderTeamReviews = Math.floor(Math.random() * 500 + 50);
  const placeholderAveragePrice = ((Math.random() * 500 + 100) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '');
  const placeholderPriceRange = `${((Math.random() * 50 + 10) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '')} - ${((Math.random() * 2000 + 500) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '')}`;


  return (
    <div className="space-y-10 py-6">
      <Button variant="outline" size="icon" asChild className="mb-4 print:hidden" aria-label="Voltar para Leiloeiros">
        <Link href="/auctioneers">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Top Section: Auctioneer Info & Recent Auctions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-b pb-10">
        <div className="lg:col-span-1 space-y-3 text-center lg:text-left">
          <Avatar className="h-40 w-40 mx-auto lg:mx-0 mb-4 border-4 border-primary/30 shadow-lg">
            <AvatarImage src={auctioneerProfile.logoUrl || `https://placehold.co/160x160.png?text=${auctioneerInitial}`} alt={auctioneerProfile.name} data-ai-hint={auctioneerProfile.dataAiHintLogo || "logo leiloeiro grande"} />
            <AvatarFallback className="text-5xl">{auctioneerInitial}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold font-headline">{auctioneerProfile.name}</h1>
          <p className="text-sm text-muted-foreground">{auctioneerProfile.registrationNumber || 'Empresa de Leilões Credenciada'}</p>
          <p className="text-sm text-muted-foreground -mt-1">{auctioneerProfile.city && auctioneerProfile.state ? `${auctioneerProfile.city} - ${auctioneerProfile.state}` : 'Localização não informada'}</p>
          <p className="text-sm text-muted-foreground">Líder em Leilões Transparentes (Placeholder)</p>
          {auctioneerProfile.rating !== undefined && auctioneerProfile.rating > 0 && (
            <div className="flex items-center justify-center lg:justify-start text-sm text-amber-600 mt-1">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
              {auctioneerProfile.rating.toFixed(1)}
              <Link href="#" className="text-primary hover:underline ml-1.5">
                ({placeholderTeamReviews} avaliações da equipe)
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-semibold text-primary flex items-center">
                <Users className="h-5 w-5 mr-1.5"/> LEILÕES Recentes
              </h2>
              <p className="text-xs text-muted-foreground">Estes números representam os leilões conduzidos.</p>
            </div>
            {recentAuctionsForCarousel.length > 1 && (
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" size="icon" onClick={scrollPrev} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={scrollNext} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {recentAuctionsForCarousel.length > 0 ? (
            <div className="overflow-hidden relative" ref={emblaRef}>
              <div className="flex -ml-4"> {/* Negative margin to counteract padding on items */}
                {recentAuctionsForCarousel.map((auction, index) => (
                  <div key={auction.id || index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_calc(100%/2.5_-_1rem)] min-w-0 pl-4"> {/* Padding on items, adjust flex-basis for gap */}
                    <RecentAuctionCarouselItem auction={auction} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center text-muted-foreground">
                Nenhum leilão recente para exibir no momento.
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6">
        <div>
          <p className="text-3xl font-bold text-primary">{auctioneerProfile.auctionsConductedCount || 0}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Leilões (últimos 12m)</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">R$ {(auctioneerProfile.totalValueSold || 0).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Total Vendido</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">{placeholderPriceRange}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Faixa de Preço (Leilões)</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-primary">{placeholderAveragePrice}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Preço Médio (Leilões)</p>
        </div>
      </section>

      <Separator className="print:hidden"/>

      {/* Middle Section: About & Contact Form */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
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
                  Membro desde: {format(new Date(auctioneerProfile.memberSince), 'MMMM yyyy', { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" /> Contatar {auctioneerProfile.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                <div>
                  <Label htmlFor="contact-name" className="text-xs">Nome</Label>
                  <Input id="contact-name" placeholder="Seu Nome Completo" />
                </div>
                <div>
                  <Label htmlFor="contact-phone" className="text-xs">Telefone</Label>
                  <Input id="contact-phone" type="tel" placeholder="(XX) XXXXX-XXXX" />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-xs">Email</Label>
                  <Input id="contact-email" type="email" placeholder="seu@email.com" />
                </div>
                <div>
                  <Label htmlFor="contact-message" className="text-xs">Mensagem</Label>
                  <Textarea id="contact-message" placeholder="Sua mensagem..." rows={3} />
                </div>
                <Button type="submit" className="w-full" disabled>Enviar Mensagem (Indisponível)</Button>
              </form>
              <Separator className="my-3"/>
              <div className="space-y-2 text-sm">
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
                    <p>{auctioneerProfile.address}{auctioneerProfile.city && `, ${auctioneerProfile.city}`}{auctioneerProfile.state && ` - ${auctioneerProfile.state}`}</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="print:hidden"/>

      {/* Bottom Section: All Auctions by this Auctioneer */}
      {relatedAuctions.length > 0 && (
        <section className="pt-6">
          <h2 className="text-2xl font-bold mb-6 font-headline flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-primary" /> Todos os Leilões de {auctioneerProfile.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedAuctions.length === 0 && !isLoading && (
        <Card className="shadow-sm mt-8">
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Nenhum leilão ativo encontrado para este leiloeiro no momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
