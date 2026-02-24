// src/app/auctioneers/[auctioneerSlug]/page.tsx
/**
 * @fileoverview Página de perfil público de um Leiloeiro.
 * Este componente de cliente renderiza a página de detalhes de um leiloeiro
 * específico, incluindo suas informações de perfil, leilões recentes em carrossel,
 * e uma lista paginada e filtrável de todos os seus leilões. Ele busca os dados
 * necessários através de server actions e gerencia toda a interatividade da UI.
 */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getAuctionsByAuctioneerSlug } from '@/app/admin/auctions/actions'; 
import { getAuctioneerBySlug } from '@/app/admin/auctioneers/actions'; 
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, AuctioneerProfileInfo, PlatformSettings, Lot } from '@/types';

import SearchResultsFrame from '@/components/search-results-frame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Star, Loader2, Mail, Phone, Globe, Landmark, Briefcase, Users, TrendingUp, ShieldCheck, MessageSquare, Pencil } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { isValidImageUrl } from '@/lib/ui-helpers';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { useFloatingActions } from '@/components/floating-actions/floating-actions-provider';
import PublicSectionAdminTooltip from '@/components/admin/public-section-admin-tooltip';

// Sort options for auctions (similar to search page)
const sortOptionsAuctions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'visits_desc', label: 'Mais Visitados' },
  { value: 'id_desc', label: 'Adicionados Recentemente' }
];

function RecentAuctionCarouselItem({ auction, platformSettings }: { auction: Auction, platformSettings: PlatformSettings }) {
  return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">Data: {format(new Date(auction.auctionDate as string), 'dd/MM/yyyy', { locale: ptBR })}</p>
          <p className="text-sm text-muted-foreground">Status: {auction.status}</p>
          {/* Add more relevant auction details here if needed */}
        </CardContent>
        <CardFooter className="pt-0">
            <Link href={`/auctions/${auction.id}`} className="w-full">
                <Button variant="outline" className="w-full">Ver Detalhes</Button>
            </Link>
        </CardFooter>
      </Card>
  );
}

export default function AuctioneerDetailsPage() {
  const params = useParams();
  const auctioneerSlug = typeof params.auctioneerSlug === 'string' ? params.auctioneerSlug : '';

  const { userProfileWithPermissions } = useAuth();
  const { setPageActions } = useFloatingActions();
  const [auctioneerProfile, setAuctioneerProfile] = useState<AuctioneerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 }, [Autoplay({ delay: 5000 })]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [auctionSortBy, setAuctionSortBy] = useState<string>('endDate_asc');
  const [currentAuctionPage, setCurrentAuctionPage] = useState(1);
  const [auctionItemsPerPage, setAuctionItemsPerPage] = useState(6);

  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'auctioneers:update']),
    [userProfileWithPermissions]
  );

  useEffect(() => {
    if (!hasEditPermissions || !auctioneerProfile?.id) {
      setPageActions([]);
      return;
    }

    setPageActions([
      {
        id: 'edit-auctioneer',
        label: 'Editar Leiloeiro',
        href: `/admin/auctioneers/${auctioneerProfile.id}/edit`,
        icon: Pencil,
        dataAiId: 'floating-action-edit-auctioneer',
      },
    ]);

    return () => setPageActions([]);
  }, [auctioneerProfile?.id, hasEditPermissions, setPageActions]);

  useEffect(() => {
    async function fetchAuctioneerDetails() {
      if (auctioneerSlug) {
        setIsLoading(true);
        setError(null);
        try {
          const [foundAuctioneer, auctions, settings] = await Promise.all([
            getAuctioneerBySlug(auctioneerSlug),
            getAuctionsByAuctioneerSlug(auctioneerSlug),
            getPlatformSettings(),
          ]);

          if (settings) {
            setPlatformSettings(settings as PlatformSettings);
            setAuctionItemsPerPage((settings as PlatformSettings).searchItemsPerPage || 6);
          }


          if (!foundAuctioneer) {
            setError(`Leiloeiro com slug/publicId "${auctioneerSlug}" não encontrado.`);
            setAuctioneerProfile(null);
            setRelatedAuctions([]);
            setIsLoading(false);
            return;
          }
          setAuctioneerProfile(foundAuctioneer);
          setRelatedAuctions(auctions);

          setCurrentAuctionPage(1);

        } catch (e) {
          console.error("Error fetching auctioneer data:", e);
          setError("Erro ao carregar dados do leiloeiro.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Slug/PublicID do leiloeiro não fornecido.");
        setIsLoading(false);
      }
    }
    fetchAuctioneerDetails();
  }, [auctioneerSlug]);


  const sortedAuctions = useMemo(() => {
    let auctionsToSort = [...relatedAuctions];
    switch (auctionSortBy) {
      case 'endDate_asc':
        auctionsToSort.sort((a, b) => new Date(a.auctionDate as string).getTime() - new Date(b.auctionDate as string).getTime());
        break;
      case 'endDate_desc':
        auctionsToSort.sort((a, b) => new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime());
        break;
      case 'visits_desc':
        auctionsToSort.sort((a, b) => (b.visits || 0) - (a.visits || 0));
        break;
      case 'id_desc': // Using auctionDate as proxy for "newly listed"
        auctionsToSort.sort((a, b) => new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime());
        break;
      case 'relevance':
      default:
        break;
    }
    return auctionsToSort;
  }, [relatedAuctions, auctionSortBy]);

  const paginatedAuctions = useMemo(() => {
    if (!platformSettings) return [];
    const startIndex = (currentAuctionPage - 1) * auctionItemsPerPage;
    const endIndex = startIndex + auctionItemsPerPage;
    return sortedAuctions.slice(startIndex, endIndex);
  }, [sortedAuctions, currentAuctionPage, auctionItemsPerPage, platformSettings]);

  const handleAuctionSortChange = (newSortBy: string) => {
    setAuctionSortBy(newSortBy);
    setCurrentAuctionPage(1);
  };

  const handleAuctionPageChange = (newPage: number) => {
    setCurrentAuctionPage(newPage);
  };
  
  const handleAuctionItemsPerPageChange = (newSize: number) => {
      setAuctionItemsPerPage(newSize);
      setCurrentAuctionPage(1);
  }
  
  const renderAuctionGridItem = (auction: Auction) => (
    <BidExpertCard
      key={auction.id}
      item={auction}
      type="auction"
      platformSettings={platformSettings}
    />
  );
  const renderAuctionListItem = (auction: Auction) => (
    <BidExpertListItem
      key={auction.id}
      item={auction}
      type="auction"
      platformSettings={platformSettings}
    />
  );
  if (isLoading || !platformSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[calc(100vh-20rem)]" data-ai-id="auctioneer-details-loading-spinner">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do leiloeiro...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]" data-ai-id="auctioneer-details-error-message">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/auctioneers">Voltar para Leiloeiros</Link>
        </Button>
      </div>
    );
  }

  if (!auctioneerProfile) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-20rem)]" data-ai-id="auctioneer-details-not-found-message">
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
  const validLogoUrl = isValidImageUrl(auctioneerProfile.logoUrl) ? auctioneerProfile.logoUrl! : `https://placehold.co/160x160.png?text=${auctioneerInitial}`;
  const fullAddress = [auctioneerProfile.street, auctioneerProfile.number, auctioneerProfile.complement, auctioneerProfile.neighborhood, auctioneerProfile.city, auctioneerProfile.state, auctioneerProfile.zipCode].filter(Boolean).join(', ');


  return (
    <>
    <TooltipProvider>
      <div className="space-y-10 py-6" data-ai-id="auctioneer-details-page-container">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-b pb-10" data-ai-id="auctioneer-profile-header">
          <div className="lg:col-span-1 space-y-3 text-center lg:text-left">
            <Avatar className="h-40 w-40 mx-auto lg:mx-0 mb-4 border-4 border-primary/30 shadow-lg">
              <AvatarImage src={validLogoUrl} alt={auctioneerProfile.name} data-ai-hint={auctioneerProfile.dataAiHintLogo || "logo leiloeiro grande"} />
              <AvatarFallback className="text-5xl">{auctioneerInitial}</AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold font-headline">{auctioneerProfile.name}</h1>
            <p className="text-sm text-muted-foreground">{auctioneerProfile.registrationNumber || 'Empresa de Leilões Credenciada'}</p>
            {auctioneerProfile.rating !== undefined && auctioneerProfile.rating > 0 && (
              <div className="flex items-center justify-center lg:justify-start text-sm text-amber-600 mt-1">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500 mr-1" />
                {auctioneerProfile.rating.toFixed(1)}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <div>
                <PublicSectionAdminTooltip
                  sectionId="auctioneer-recent-auctions"
                  description="Nesta seção exibimos os 5 leilões mais recentes vinculados ao leiloeiro para navegação rápida em formato de carrossel."
                >
                  <h2 className="text-lg font-semibold text-primary flex items-center" data-ai-id="auctioneer-recent-auctions-title">
                    <Users className="h-5 w-5 mr-1.5"/> Leilões Recentes
                  </h2>
                </PublicSectionAdminTooltip>
              </div>
              {recentAuctionsForCarousel.length > 1 && (
                <div className="flex gap-2 print:hidden">
                  <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={scrollPrev} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background" aria-label="Slide Anterior"><ChevronLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Anterior</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={scrollNext} className="h-8 w-8 rounded-full bg-background/70 hover:bg-background" aria-label="Próximo Slide"><ChevronRight className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Próximo</p></TooltipContent></Tooltip>
                </div>
              )}
            </div>
            {recentAuctionsForCarousel.length > 0 ? (
              <div className="overflow-hidden relative" ref={emblaRef}>
                <div className="flex -ml-4"> 
                  {recentAuctionsForCarousel.map((auction, index) => (
                    <div key={auction.id || index} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_calc(100%/2.5_-_1rem)] min-w-0 pl-4"> 
                      <RecentAuctionCarouselItem auction={auction} platformSettings={platformSettings} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">Nenhum leilão recente para exibir no momento.</CardContent></Card>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center py-6" data-ai-id="auctioneer-stats-section">
          <div><p className="text-3xl font-bold text-primary">{auctioneerProfile.auctionsConductedCount || 0}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">Leilões Conduzidos</p></div>
          <div><p className="text-3xl font-bold text-primary">R$ {(auctioneerProfile.totalValueSold || 0).toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Total Vendido</p></div>
          <div><p className="text-3xl font-bold text-primary">{placeholderPriceRange}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">Faixa de Preço (Leilões)</p></div>
          <div><p className="text-3xl font-bold text-primary">{placeholderAveragePrice}</p><p className="text-xs text-muted-foreground uppercase tracking-wider">Preço Médio (Leilões)</p></div>
        </section>

        <Separator className="print:hidden"/>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6" data-ai-id="auctioneer-about-contact-section">
          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary" /> Sobre {auctioneerProfile.name}</CardTitle></CardHeader>
              <CardContent>
                {auctioneerProfile.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{auctioneerProfile.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma descrição adicional fornecida por este leiloeiro.</p>
                )}
                {auctioneerProfile.createdAt && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Membro desde: {format(new Date(auctioneerProfile.createdAt as string), 'MMMM yyyy', { locale: ptBR })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-md">
              <CardHeader><CardTitle className="text-xl font-semibold flex items-center"><MessageSquare className="h-5 w-5 mr-2 text-primary" /> Contatar {auctioneerProfile.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                   {auctioneerProfile.phone && (<div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-muted-foreground" /><a href={`tel:${auctioneerProfile.phone}`} className="hover:text-primary">{auctioneerProfile.phone}</a></div>)}
                  {auctioneerProfile.email && (<div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-muted-foreground" /><a href={`mailto:${auctioneerProfile.email}`} className="hover:text-primary">{auctioneerProfile.email}</a></div>)}
                   {fullAddress && (<div className="flex items-start"><Landmark className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" /><p>{fullAddress}</p></div>)}
                  {auctioneerProfile.website && (<div className="flex items-center"><Globe className="h-4 w-4 mr-2 text-muted-foreground" /><a href={auctioneerProfile.website.startsWith('http') ? auctioneerProfile.website : `https://${auctioneerProfile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{auctioneerProfile.website.replace(/^https?:\/\//, '')}</a></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="print:hidden"/>

        {relatedAuctions.length > 0 && (
          <section className="pt-6" data-ai-id="auctioneer-all-auctions-section">
            <PublicSectionAdminTooltip
              sectionId="auctioneer-all-auctions"
              description="Nesta seção exibimos todos os leilões do leiloeiro com ordenação dinâmica (relevância, data de encerramento, visitas ou mais recentes) e paginação configurável."
            >
              <h2 className="text-2xl font-bold mb-6 font-headline flex items-center" data-ai-id="auctioneer-all-auctions-title"><TrendingUp className="h-6 w-6 mr-2 text-primary" /> Todos os Leilões de {auctioneerProfile.name}</h2>
            </PublicSectionAdminTooltip>
            <SearchResultsFrame
                items={paginatedAuctions}
                totalItemsCount={relatedAuctions.length}
                renderGridItem={renderAuctionGridItem}
                renderListItem={renderAuctionListItem}
                sortOptions={sortOptionsAuctions}
                initialSortBy={auctionSortBy}
                onSortChange={handleAuctionSortChange}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="leilões"
                currentPage={currentAuctionPage}
                itemsPerPage={auctionItemsPerPage}
                onPageChange={handleAuctionPageChange}
                onItemsPerPageChange={handleAuctionItemsPerPageChange}
            />
          </section>
        )}

        {relatedAuctions.length === 0 && !isLoading && (
          <Card className="shadow-sm mt-8" data-ai-id="auctioneer-no-auctions-message"><CardContent className="text-center py-10"><p className="text-muted-foreground">Nenhum leilão ativo encontrado para este leiloeiro no momento.</p></CardContent></Card>
        )}
      </div>
    </TooltipProvider>

  </>
  );
}
