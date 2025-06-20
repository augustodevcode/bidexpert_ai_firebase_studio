
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { sampleAuctions, sampleLots, slugify, sampleSellers, samplePlatformSettings } from '@/lib/sample-data';
import type { Auction, Lot, SellerProfileInfo, PlatformSettings } from '@/types';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Building, CalendarDays, PackageOpen, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Removido: import Breadcrumbs from '@/components/ui/breadcrumbs';

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];


export default function SellerDetailsPage() {
  const params = useParams();
  const sellerIdSlug = typeof params.sellerId === 'string' ? params.sellerId : '';

  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<Auction[]>([]);
  const [relatedLots, setRelatedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const platformSettings = samplePlatformSettings as PlatformSettings;
  const {
    searchPaginationType = 'loadMore',
    searchItemsPerPage = 6, // Ajustado para menos itens por página na visão geral do comitente
    searchLoadMoreCount = 6
  } = platformSettings;

  const [lotSortBy, setLotSortBy] = useState<string>('endDate_asc');
  const [currentLotPage, setCurrentLotPage] = useState(1);
  const [visibleLotCount, setVisibleLotCount] = useState(searchLoadMoreCount);


  useEffect(() => {
    if (sellerIdSlug) {
      setIsLoading(true);
      setError(null);

      try {
        const allSellers = sampleSellers;
        const foundSeller = allSellers.find(s => s.slug === sellerIdSlug || s.publicId === sellerIdSlug || s.id === sellerIdSlug);

        if (!foundSeller) {
          setError(`Comitente com slug/ID "${sellerIdSlug}" não encontrado.`);
          setSellerProfile(null);
          setIsLoading(false);
          return;
        }

        setSellerProfile(foundSeller);

        const auctionsByThisSeller = sampleAuctions.filter(auction =>
          (auction.sellerId && auction.sellerId === foundSeller.id) ||
          (auction.seller && slugify(auction.seller) === sellerIdSlug)
        );
        setRelatedAuctions(auctionsByThisSeller);

        let lotsByThisSeller = sampleLots.filter(lot =>
          (lot.sellerId && lot.sellerId === foundSeller.id) ||
          (lot.sellerName && slugify(lot.sellerName) === sellerIdSlug)
        );

        auctionsByThisSeller.forEach(auction => {
          (auction.lots || []).forEach(auctionLot => {
            if (((!auctionLot.sellerName && auction.sellerId === foundSeller.id) || (auctionLot.sellerName && slugify(auctionLot.sellerName) === sellerIdSlug)) &&
                !lotsByThisSeller.find(l => l.id === auctionLot.id)) {
              lotsByThisSeller.push({...auctionLot, auctionName: auction.title}); // Adiciona auctionName
            }
          });
        });

        const uniqueLots = lotsByThisSeller.filter((lot, index, self) =>
          index === self.findIndex((l) => (l.id === lot.id))
        ).map(lot => ({ // Garante que lotes tenham auctionName
            ...lot,
            auctionName: lot.auctionName || sampleAuctions.find(a => a.id === lot.auctionId)?.title || "Leilão Desconhecido"
        }));
        setRelatedLots(uniqueLots);
        setCurrentLotPage(1);
        setVisibleLotCount(searchLoadMoreCount);

      } catch (e) {
        console.error("Error processing seller data:", e);
        setError("Erro ao processar dados do comitente.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Slug/ID do comitente não fornecido.");
      setIsLoading(false);
    }
  }, [sellerIdSlug, searchLoadMoreCount]);

  const sortedLots = useMemo(() => {
    return [...relatedLots].sort((a, b) => {
      switch (lotSortBy) {
        case 'endDate_asc':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'endDate_desc':
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'views_desc':
          return (b.views || 0) - (a.views || 0);
        case 'relevance':
        default:
          // Simple relevance: open lots first, then by end date
          if (a.status === 'ABERTO_PARA_LANCES' && b.status !== 'ABERTO_PARA_LANCES') return -1;
          if (a.status !== 'ABERTO_PARA_LANCES' && b.status === 'ABERTO_PARA_LANCES') return 1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }
    });
  }, [relatedLots, lotSortBy]);

  const paginatedLots = useMemo(() => {
    if (searchPaginationType === 'numberedPages') {
      const startIndex = (currentLotPage - 1) * searchItemsPerPage;
      const endIndex = startIndex + searchItemsPerPage;
      return sortedLots.slice(startIndex, endIndex);
    }
    return sortedLots.slice(0, visibleLotCount);
  }, [sortedLots, currentLotPage, visibleLotCount, searchPaginationType, searchItemsPerPage]);

  const handleLotSortChange = (newSortBy: string) => {
    setLotSortBy(newSortBy);
    setCurrentLotPage(1);
    setVisibleLotCount(searchLoadMoreCount);
  };

  const handleLotPageChange = (newPage: number) => {
    setCurrentLotPage(newPage);
  };

  const handleLoadMoreLots = () => {
    setVisibleLotCount(prev => Math.min(prev + searchLoadMoreCount, sortedLots.length));
  };

  const renderLotGridItemForSellerPage = (lot: Lot, index: number): React.ReactNode => (
    <LotCard key={lot.id} lot={lot} platformSettingsProp={platformSettings} />
  );

  const renderLotListItemForSellerPage = (lot: Lot, index: number): React.ReactNode => (
    <LotListItem key={lot.id} lot={lot} platformSettingsProp={platformSettings} />
  );


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  if (!sellerProfile) {
     return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Comitente não encontrado.</h2>
         <Button asChild className="mt-4">
          <Link href="/sellers">Voltar para Comitentes</Link>
        </Button>
      </div>
    );
  }

  const sellerInitial = sellerProfile.name ? sellerProfile.name.charAt(0).toUpperCase() : 'S';


  return (
    <div className="space-y-8">
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={sellerProfile.logoUrl || `https://placehold.co/80x80.png?text=${sellerInitial}`} alt={sellerProfile.name} data-ai-hint={sellerProfile.dataAiHintLogo || "logo comitente grande"} />
                <AvatarFallback>{sellerInitial}</AvatarFallback>
              </Avatar>
              <div>
                 <CardDescription className="text-sm">Comitente</CardDescription>
                <CardTitle className="text-3xl font-bold font-headline">{sellerProfile.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    <span>Conosco desde: {sellerProfile.memberSince ? format(new Date(sellerProfile.memberSince), 'MM/yyyy', { locale: ptBR }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PackageOpen className="h-4 w-4" />
                    <span>Lotes Ativos: {sellerProfile.activeLotsCount}</span>
                  </div>
                   <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span>Avaliação: {sellerProfile.rating ? sellerProfile.rating.toFixed(1) : 'N/A'} / 5.0</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/sellers">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
          </div>
           <p className="text-muted-foreground text-sm border-t pt-4">
            Explore os leilões e lotes atualmente disponíveis deste comitente.
          </p>
        </CardHeader>
      </Card>

      {relatedAuctions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Leilões de {sellerProfile.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </section>
      )}

      {relatedLots.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 mt-8 font-headline">Lotes de {sellerProfile.name}</h2>
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

      {relatedAuctions.length === 0 && relatedLots.length === 0 && !isLoading && (
        <Card>
            <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Nenhum leilão ou lote ativo encontrado para este comitente no momento.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}


    