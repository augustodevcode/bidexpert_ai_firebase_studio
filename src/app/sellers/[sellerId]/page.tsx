
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getAuctionsBySellerSlug } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, Lot, PlatformSettings, SellerProfileInfo } from '@/types';
import AuctionCard from '@/components/auction-card';
import AuctionListItem from '@/components/auction-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { getLots } from '@/app/admin/lots/actions';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];


function RecentAuctionCarouselItem({ auction }: { auction: Auction }) {
  const auctionEndDate = auction.endDate || (auction.auctionStages && auction.auctionStages.length > 0 ? auction.auctionStages[auction.auctionStages.length - 1].endDate : auction.auctionDate);
  const daysAgo = differenceInDays(new Date(), new Date(auctionEndDate as string));
  const statusText = new Date(auctionEndDate as string) < new Date() ? `Encerrado ${daysAgo} dias atrás` : `Encerra em ${differenceInDays(new Date(auctionEndDate as string), new Date())} dias`;

  return (
    <Card className="overflow-hidden shadow-md h-full flex flex-col">
      <Link href={`/auctions/${auction.publicId || auction.id}`} className="block">
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
          R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {auction.totalLots || 0} lotes | {auction.category} | {auction.city}, {auction.state}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>
          {statusText}
        </p>
      </CardContent>
    </Card>
  );
}


export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 }, [Autoplay({ delay: 5000 })]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [lotSortBy, setLotSortBy] = useState<string>('endDate_asc');
  const [currentLotPage, setCurrentLotPage] = useState(1);
  const [visibleLotCount, setVisibleLotCount] = useState(6);

  useEffect(() => {
    async function fetchSellerDetails() {
      if (sellerIdSlug) {
        setIsLoading(true);
        setError(null);
        try {
          const [foundSeller, auctions, allLots, settings] = await Promise.all([
              getSellerBySlug(sellerIdSlug),
              getAuctionsBySellerSlug(sellerIdSlug),
              getLots(),
              getPlatformSettings()
          ]);
          setPlatformSettings(settings);

          if (!foundSeller) {
            setError(`Comitente com slug/publicId "${sellerIdSlug}" não encontrado.`);
            setSellerProfile(null);
            setRelatedAuctions([]);
            setRelatedLots([]);
            setIsLoading(false);
            return;
          }
          setSellerProfile(foundSeller);
          setRelatedAuctions(auctions);

          const lotsFromThisSeller = allLots.filter(lot => lot.sellerId === foundSeller.id || lot.sellerName === foundSeller.name);
          setRelatedLots(lotsFromThisSeller);

          setCurrentLotPage(1);
          setVisibleLotCount(settings?.searchLoadMoreCount || 6);
        } catch (e) {
          console.error("Error fetching seller data:", e);
          setError("Erro ao carregar dados do comitente.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Slug/PublicID do comitente não fornecido.");
        setIsLoading(false);
      }
    }
    fetchSellerDetails();
  }, [sellerIdSlug]);

  const sortedLots = useMemo(() => {
    return [...relatedLots].sort((a, b) => {
      switch (lotSortBy) {
        case 'endDate_asc':
          return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
        case 'endDate_desc':
          return new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'views_desc':
          return (b.views || 0) - (a.views || 0);
        case 'relevance':
        default:
          if (a.status === 'ABERTO_PARA_LANCES' && b.status !== 'ABERTO_PARA_LANCES') return -1;
          if (a.status !== 'ABERTO_PARA_LANCES' && b.status === 'ABERTO_PARA_LANCES') return 1;
          return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
      }
    });
  }, [relatedLots, lotSortBy]);

  const paginatedLots = useMemo(() => {
    if (platformSettings?.searchPaginationType === 'numberedPages') {
      const startIndex = (currentLotPage - 1) * (platformSettings?.searchItemsPerPage || 6);
      const endIndex = startIndex + (platformSettings?.searchItemsPerPage || 6);
      return sortedLots.slice(startIndex, endIndex);
    }
    return sortedLots.slice(0, visibleLotCount);
  }, [sortedLots, currentLotPage, visibleLotCount, platformSettings]);

  const handleLotSortChange = (newSortBy: string) => {
    setLotSortBy(newSortBy);
    setCurrentLotPage(1);
    setVisibleLotCount(platformSettings?.searchLoadMoreCount || 6);
  };

  const handleLotPageChange = (newPage: number) => {
    setCurrentLotPage(newPage);
  };

  const handleLoadMoreLots = () => {
    setVisibleLotCount(prev => Math.min(prev + (platformSettings?.searchLoadMoreCount || 6), sortedLots.length));
  };
  
  const renderLotGridItemForSellerPage = (lot: Lot) => <LotCard key={lot.id} lot={lot} platformSettings={platformSettings!} />;
  const renderLotListItemForSellerPage = (lot: Lot) => <LotListItem key={lot.id} lot={lot} platformSettings={platformSettings!} />;

  if (isLoading || !platformSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';
  const recentAuctionsForCarousel = relatedAuctions.slice(0, 5);

  const placeholderTeamReviews = Math.floor(Math.random() * 500 + 50);
  const placeholderAveragePrice = ((Math.random() * 500 + 100) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '');
  const placeholderPriceRange = `${((Math.random() * 50 + 10) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '')} - ${((Math.random() * 2000 + 500) * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\s/g, '')}`;

  return (
    <TooltipProvider>
      <div className="space-y-10 py-6">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-b pb-10">
          <div className="lg:col-span-1 space-y-3 text-center lg:text-left">
            <Avatar className="h-40 w-40 mx-auto lg:mx-0 mb-4 border-4 border-primary/30 shadow-lg">
              <AvatarImage src={sellerProfile.logoUrl || `https://placehold.co/160x160.png?text=${sellerInitial}`} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente grande"} />
              <AvatarFallback className="text-5xl">{sellerInitial}</AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold font-headline">{sellerProfile.name}</h1>
            <p className="text-sm text-muted-foreground">{sellerProfile.cnpj || 'Comitente Credenciado'}</p>
            <p className="text-sm text-muted-foreground -mt-1">{sellerProfile.city && sellerProfile.state ? `${sellerProfile.city} - ${sellerProfile.state}` : 'Localização não informada'}</p>
            {sellerProfile.rating !== undefined && sellerProfile.rating > 0 && (
              <div className="flex items-center justify-center lg:justify-start text-sm text-amber-600 mt-1">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
                {sellerProfile.rating.toFixed(1)}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-lg font-semibold text-primary flex items-center">
                  <Briefcase className="h-5 w-5 mr-1.5"/> Leilões Recentes
                </h2>
              </div>
              {recentAuctionsForCarousel.length > 1 && (
                <div className="flex gap-2 print:hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={scrollPrev} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background" aria-label="Slide Anterior">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Anterior</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={scrollNext} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background" aria-label="Próximo Slide">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Próximo</p></TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            {recentAuctionsForCarousel.length > 0 ? (
              <div className="overflow-hidden relative" ref={emblaRef}>
                <div className="flex -ml-4"> 
                  {recentAuctionsForCarousel.map((auction, index) => (
                    <div key={auction.id || index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_calc(100%/2.5_-_1rem)] min-w-0 pl-4"> 
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

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6">
          <div>
            <p className="text-3xl font-bold text-primary">{sellerProfile.auctionsFacilitatedCount || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Leilões Realizados</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{sellerProfile.activeLotsCount || 0}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Lotes Ativos</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">R$ {(sellerProfile.totalSalesValue || 0).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Total Vendido</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">{placeholderAveragePrice}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Preço Médio por Lote</p>
          </div>
        </section>

        <Separator className="print:hidden"/>

        {relatedLots.length > 0 && (
          <section className="pt-6">
            <h2 className="text-2xl font-bold mb-6 font-headline flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-primary" /> Todos os Lotes de {sellerProfile.name}
            </h2>
            <SearchResultsFrame
                items={paginatedLots}
                totalItemsCount={relatedLots.length}
                renderGridItem={renderLotGridItemForSellerPage}
                renderListItem={renderLotListItemForSellerPage}
                sortOptions={sortOptionsLots}
                initialSortBy={lotSortBy}
                onSortChange={handleLotSortChange}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="lotes"
                currentPage={currentLotPage}
                visibleItemCount={visibleLotCount}
                onPageChange={handleLotPageChange}
                onLoadMore={handleLoadMoreLots}
            />
          </section>
        )}

        {relatedLots.length === 0 && !isLoading && (
          <Card className="shadow-sm mt-8">
            <CardContent className="text-center py-10">
              <p className="text-muted-foreground">Nenhum lote encontrado para este comitente no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

