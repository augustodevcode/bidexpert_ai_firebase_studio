
'use client';
import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Auction, Lot, PlatformSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import {
  ChevronRight, FileText, Heart, Eye, ListChecks, MapPin, Gavel, Tag, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, slugify } from '@/lib/sample-data';
import SearchResultsFrame from '@/components/search-results-frame';
import { Separator } from '@/components/ui/separator';

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'lotNumber_asc', label: 'Nº Lote: Menor ao Maior' },
  { value: 'lotNumber_desc', label: 'Nº Lote: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

interface AuctionDetailsClientProps {
  auction: Auction;
  platformSettings: PlatformSettings;
}

export default function AuctionDetailsClient({ auction, platformSettings }: AuctionDetailsClientProps) {
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItemCount, setVisibleItemCount] = useState(platformSettings.searchLoadMoreCount || 12);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedLots = useMemo(() => {
    return [...(auction.lots || [])].sort((a, b) => {
        switch (sortBy) {
            case 'lotNumber_asc':
              return (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0);
            case 'lotNumber_desc':
              return (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0);
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
  }, [auction.lots, sortBy]);
  
  const paginatedLots = useMemo(() => {
    if (platformSettings.searchPaginationType === 'numberedPages') {
      const startIndex = (currentPage - 1) * (platformSettings.searchItemsPerPage || 12);
      const endIndex = startIndex + (platformSettings.searchItemsPerPage || 12);
      return sortedLots.slice(startIndex, endIndex);
    }
    return sortedLots.slice(0, visibleItemCount);
  }, [sortedLots, currentPage, visibleItemCount, platformSettings]);

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    setVisibleItemCount(platformSettings.searchLoadMoreCount || 12);
  };
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleLoadMore = () => setVisibleItemCount(prev => Math.min(prev + (platformSettings.searchLoadMoreCount || 12), sortedLots.length));

  const renderGridItem = (lot: Lot) => <LotCard lot={lot} platformSettings={platformSettings} />;
  const renderListItem = (lot: Lot) => <LotListItem lot={lot} platformSettings={platformSettings} />;
  
  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'Nacional';

  return (
    <div className="space-y-8">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link href="/search" className="hover:text-primary">Leilões</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground truncate">{auction.title}</span>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div className="p-6">
                <Badge variant="outline" className="mb-2">{auction.auctionType || 'Leilão'}</Badge>
                <h1 className="text-3xl font-bold font-headline">{auction.title}</h1>
                <p className="text-muted-foreground mt-2">{auction.description}</p>
                <Separator className="my-4"/>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center" title="Status do Leilão">
                        <ListChecks className="h-4 w-4 mr-2 text-primary"/>
                        <span className="font-semibold">{getAuctionStatusText(auction.status)}</span>
                    </div>
                     <div className="flex items-center" title="Categoria">
                        <Tag className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{auction.category}</span>
                    </div>
                     <div className="flex items-center" title="Data de Início">
                        <CalendarDays className="h-4 w-4 mr-2 text-primary"/>
                        {format(new Date(auction.auctionDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex items-center" title="Localização Principal">
                        <MapPin className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{displayLocation}</span>
                    </div>
                     <div className="flex items-center" title="Leiloeiro Responsável">
                        <Gavel className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{auction.auctioneer}</span>
                    </div>
                     <div className="flex items-center" title="Total de Visitas">
                        <Eye className="h-4 w-4 mr-2 text-primary"/>
                        <span>{auction.visits?.toLocaleString('pt-BR') || 0} Visitas</span>
                    </div>
                </div>
            </div>
            <div className="bg-secondary/40 p-6 flex flex-col justify-between gap-4">
                {auction.auctioneerLogoUrl && (
                    <Link href={`/auctioneers/${slugify(auction.auctioneer)}`} className="block text-center">
                        <Image src={auction.auctioneerLogoUrl} alt={`Logo ${auction.auctioneer}`} width={150} height={60} className="object-contain mx-auto" data-ai-hint="logo leiloeiro" />
                    </Link>
                )}
                <div className="space-y-2 text-center md:text-right">
                    {auction.documentsUrl && (
                        <Button asChild className="w-full">
                            <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" /> Ver Edital e Documentos
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" className="w-full">
                        <Heart className="h-4 w-4 mr-2" /> Favoritar Leilão
                    </Button>
                </div>
            </div>
        </div>
      </Card>

      <div className="mt-8">
         <SearchResultsFrame
            items={paginatedLots}
            totalItemsCount={sortedLots.length}
            renderGridItem={renderGridItem}
            renderListItem={renderListItem}
            sortOptions={sortOptionsLots}
            initialSortBy={sortBy}
            onSortChange={handleSortChange}
            platformSettings={platformSettings}
            isLoading={!isClient}
            searchTypeLabel="lotes"
            emptyStateMessage={`Nenhum lote encontrado para o leilão "${auction.title}".`}
            currentPage={currentPage}
            visibleItemCount={visibleItemCount}
            onPageChange={handlePageChange}
            onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
