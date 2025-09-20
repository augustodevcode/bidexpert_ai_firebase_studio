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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultsFrame from '@/components/search-results-frame';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import UniversalCard from '@/components/cards/universal-card';
import UniversalListItem from '@/components/cards/universal-list-item';

export default function AdminLotsPage() {
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

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
  
  const renderLotList = (lots: Lot[]) => {
      if (!platformSettings) return null;
      return (
        <SearchResultsFrame
            items={lots}
            totalItemsCount={lots.length}
            renderGridItem={(item) => <UniversalCard item={item} type="lot" auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            renderListItem={(item) => <UniversalListItem item={item} type="lot" auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            sortOptions={[]}
            initialSortBy="endDate_asc"
            onSortChange={() => {}}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="lotes"
            currentPage={1}
            itemsPerPage={platformSettings.defaultListItemsPerPage || 100} // Show all in tabs
            onPageChange={() => {}}
            onItemsPerPageChange={() => {}}
            emptyStateMessage="Nenhum lote encontrado nesta categoria."
        />
      );
  };
  
  const featuredLots = useMemo(() => allLots.filter(l => l.isFeatured), [allLots]);
  const draftLots = useMemo(() => allLots.filter(l => l.status === 'RASCUNHO'), [allLots]);
  const upcomingLots = useMemo(() => allLots.filter(l => l.status === 'EM_BREVE'), [allLots]);
  const openLots = useMemo(() => allLots.filter(l => l.status === 'ABERTO_PARA_LANCES' && !l.isFeatured), [allLots]);
  const soldLots = useMemo(() => allLots.filter(l => l.status === 'VENDIDO'), [allLots]);
  const notSoldLots = useMemo(() => allLots.filter(l => l.status === 'NAO_VENDIDO'), [allLots]);
  const canceledLots = useMemo(() => allLots.filter(l => l.status === 'CANCELADO'), [allLots]);

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
              Visualize, adicione e edite os lotes da plataforma, organizados por status.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/lots/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto">
              <TabsTrigger value="open">Abertos ({openLots.length})</TabsTrigger>
              <TabsTrigger value="featured">Destaques ({featuredLots.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Em Breve ({upcomingLots.length})</TabsTrigger>
              <TabsTrigger value="sold">Vendidos ({soldLots.length})</TabsTrigger>
              <TabsTrigger value="not_sold">Não Vendidos ({notSoldLots.length})</TabsTrigger>
              <TabsTrigger value="drafts">Rascunhos ({draftLots.length})</TabsTrigger>
              <TabsTrigger value="canceled">Cancelados ({canceledLots.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">{renderLotList(openLots)}</TabsContent>
            <TabsContent value="featured" className="mt-4">{renderLotList(featuredLots)}</TabsContent>
            <TabsContent value="upcoming" className="mt-4">{renderLotList(upcomingLots)}</TabsContent>
            <TabsContent value="sold" className="mt-4">{renderLotList(soldLots)}</TabsContent>
            <TabsContent value="not_sold" className="mt-4">{renderLotList(notSoldLots)}</TabsContent>
            <TabsContent value="drafts" className="mt-4">{renderLotList(draftLots)}</TabsContent>
            <TabsContent value="canceled" className="mt-4">{renderLotList(canceledLots)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
