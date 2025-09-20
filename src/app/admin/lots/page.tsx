// src/app/admin/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '../settings/actions';
import type { Auction, Lot, PlatformSettings } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SearchResultsFrame from '@/components/search-results-frame';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';

export default function AdminLotsPage() {
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('endDate_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);


  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedLots, fetchedAuctions, fetchedSettings] = await Promise.all([
        getLots(),
        getAuctions(),
        getPlatformSettings(),
      ]);
      setAllLots(fetchedLots);
      setAllAuctions(fetchedAuctions);
      setPlatformSettings(fetchedSettings as PlatformSettings);
       if(fetchedSettings) setItemsPerPage(fetchedSettings.defaultListItemsPerPage || 12);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar lotes.";
      console.error("Error fetching lots:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);
  
  const renderGridItem = (lot: Lot) => <UniversalCard item={lot} type="lot" auction={allAuctions.find(a => a.id === lot.auctionId)} platformSettings={platformSettings!} onUpdate={() => setRefetchTrigger(p => p+1)} />;
  const renderListItem = (lot: Lot) => <UniversalListItem item={lot} type="lot" auction={allAuctions.find(a => a.id === lot.auctionId)} platformSettings={platformSettings!} onUpdate={() => setRefetchTrigger(p => p+1)} />;
  
  const sortOptions = [
    { value: 'endDate_asc', label: 'Encerramento Próximo' },
    { value: 'price_desc', label: 'Maior Preço' },
    { value: 'price_asc', label: 'Menor Preço' },
    { value: 'views_desc', label: 'Mais Visitados' },
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Lotes
            </CardTitle>
            <CardDescription>
              Visualize, adicione e edite os lotes da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/lots/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           {platformSettings && (
                 <SearchResultsFrame
                    items={allLots}
                    totalItemsCount={allLots.length}
                    renderGridItem={renderGridItem}
                    renderListItem={renderListItem}
                    sortOptions={sortOptions}
                    initialSortBy={sortBy}
                    onSortChange={setSortBy}
                    platformSettings={platformSettings}
                    isLoading={isLoading}
                    searchTypeLabel="lotes"
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
              )}
        </CardContent>
      </Card>
    </div>
  );
}
