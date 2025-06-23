
'use client';
import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Auction, Lot, PlatformSettings, AuctionStage } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  const [lotSearchTerm, setLotSearchTerm] = useState('');
  const [lotStatusFilter, setLotStatusFilter] = useState('ALL');


  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredAndSortedLots = useMemo(() => {
    let lotsToProcess = [...(auction.lots || [])];

    // Filtering
    if (lotSearchTerm) {
      const term = lotSearchTerm.toLowerCase();
      lotsToProcess = lotsToProcess.filter(lot =>
        lot.title.toLowerCase().includes(term) ||
        (lot.description && lot.description.toLowerCase().includes(term))
      );
    }

    if (lotStatusFilter !== 'ALL') {
      lotsToProcess = lotsToProcess.filter(lot => lot.status === lotStatusFilter);
    }

    // Sorting
    return lotsToProcess.sort((a, b) => {
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
  }, [auction.lots, sortBy, lotSearchTerm, lotStatusFilter]);
  
  const paginatedLots = useMemo(() => {
    if (platformSettings.searchPaginationType === 'numberedPages') {
      const startIndex = (currentPage - 1) * (platformSettings.searchItemsPerPage || 12);
      const endIndex = startIndex + (platformSettings.searchItemsPerPage || 12);
      return filteredAndSortedLots.slice(startIndex, endIndex);
    }
    return filteredAndSortedLots.slice(0, visibleItemCount);
  }, [filteredAndSortedLots, currentPage, visibleItemCount, platformSettings]);

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    setVisibleItemCount(platformSettings.searchLoadMoreCount || 12);
  };
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleLoadMore = () => setVisibleItemCount(prev => Math.min(prev + (platformSettings.searchLoadMoreCount || 12), filteredAndSortedLots.length));

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="relative aspect-video md:aspect-auto min-h-[225px] bg-muted">
                <Image
                    src={auction.imageUrl || 'https://placehold.co/600x800.png'}
                    alt={auction.title}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={auction.dataAiHint || 'imagem leilao'}
                />
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                      <Badge variant="outline" className="bg-background/80 font-semibold">{getAuctionStatusText(auction.status)}</Badge>
                      {auction.isFeaturedOnMarketplace && <Badge className="bg-amber-400 text-amber-900">DESTAQUE</Badge>}
                  </div>
              </div>

              {/* Details Section */}
              <div className="p-6 flex flex-col">
                <Badge variant="secondary" className="mb-2 w-fit">{auction.auctionType || 'Leilão'}</Badge>
                <h1 className="text-3xl font-bold font-headline">{auction.title}</h1>
                <p className="text-muted-foreground mt-2">{auction.description}</p>
                
                <Separator className="my-4"/>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center" title="Categoria">
                        <Tag className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{auction.category}</span>
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

                <div className="mt-auto pt-6 flex flex-wrap gap-2">
                      {auction.documentsUrl && (
                        <Button asChild>
                            <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" /> Ver Edital
                            </a>
                        </Button>
                    )}
                    <Button variant="outline">
                        <Heart className="h-4 w-4 mr-2" /> Favoritar Leilão
                    </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-8">
            <Card className="shadow-sm mb-6">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <Input 
                        placeholder="Buscar lotes neste leilão..." 
                        value={lotSearchTerm} 
                        onChange={(e) => setLotSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    <Select value={lotStatusFilter} onValueChange={setLotStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos os Status</SelectItem>
                            <SelectItem value="ABERTO_PARA_LANCES">Aberto para Lances</SelectItem>
                            <SelectItem value="EM_BREVE">Em Breve</SelectItem>
                            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                            <SelectItem value="VENDIDO">Vendido</SelectItem>
                            <SelectItem value="NAO_VENDIDO">Não Vendido</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <SearchResultsFrame
                items={paginatedLots}
                totalItemsCount={filteredAndSortedLots.length}
                renderGridItem={renderGridItem}
                renderListItem={renderListItem}
                sortOptions={sortOptionsLots}
                initialSortBy={sortBy}
                onSortChange={handleSortChange}
                platformSettings={platformSettings}
                isLoading={!isClient}
                searchTypeLabel="lotes"
                emptyStateMessage={`Nenhum lote encontrado para o leilão "${auction.title}" com os filtros aplicados.`}
                currentPage={currentPage}
                visibleItemCount={visibleItemCount}
                onPageChange={handlePageChange}
                onLoadMore={handleLoadMore}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md sticky top-24">
            <CardContent className="p-6">
              <AuctionStagesTimeline 
                  auctionOverallStartDate={new Date(auction.auctionDate)}
                  stages={auction.auctionStages || []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
