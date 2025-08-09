// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, PlatformSettings } from '@/types';
import { PlusCircle, Gavel, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionCard from '@/components/auction-card';
import AuctionListItem from '@/components/auction-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import { getPlatformSettings } from '../settings/actions';

const ViewModeSwitcher = ({ viewMode, setViewMode }: { viewMode: 'table' | 'cards', setViewMode: (mode: 'table' | 'cards') => void }) => (
    <div className="flex items-center gap-1 rounded-md border bg-secondary p-0.5">
        <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('table')}
        >
            <List className="h-4 w-4" />
        </Button>
        <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('cards')}
        >
            <LayoutGrid className="h-4 w-4" />
        </Button>
    </div>
);


export default function AdminAuctionsPage() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, fetchedSettings] = await Promise.all([
        getAuctions(),
        getPlatformSettings(),
      ]);
      setAllAuctions(fetchedAuctions);
      setPlatformSettings(fetchedSettings);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leilões.";
      console.error("Error fetching auctions:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);

  const sortOptions = [
    { value: 'endDate_asc', label: 'Encerramento Próximo' },
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'visits_desc', label: 'Mais Vistos' },
  ];

  const renderContentForTab = (auctions: Auction[]) => {
    if (!platformSettings) return null; // or a loading state
    
    return (
        <SearchResultsFrame
            items={auctions}
            totalItemsCount={auctions.length}
            renderGridItem={(item) => <AuctionCard auction={item} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            renderListItem={(item) => <AuctionListItem auction={item} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            sortOptions={sortOptions}
            initialSortBy="auctionDate_desc"
            onSortChange={() => {}} // Sorting is handled locally if needed, or can be passed
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="leilões"
            currentPage={1}
            itemsPerPage={100} // Show all for now in tabs
            onPageChange={() => {}}
            onItemsPerPageChange={() => {}}
            emptyStateMessage="Nenhum leilão encontrado nesta categoria."
        />
    );
  };
  
  const featuredAuctions = useMemo(() => allAuctions.filter(a => a.isFeaturedOnMarketplace), [allAuctions]);
  const openAuctions = useMemo(() => allAuctions.filter(a => (a.status === 'ABERTO_PARA_LANCES' || a.status === 'ABERTO') && !a.isFeaturedOnMarketplace), [allAuctions]);
  const upcomingAuctions = useMemo(() => allAuctions.filter(a => a.status === 'EM_BREVE'), [allAuctions]);
  const closedAuctions = useMemo(() => allAuctions.filter(a => a.status === 'ENCERRADO' || a.status === 'FINALIZADO'), [allAuctions]);
  const draftAuctions = useMemo(() => allAuctions.filter(a => a.status === 'RASCUNHO' || a.status === 'EM_PREPARACAO'), [allAuctions]);
  const canceledAuctions = useMemo(() => allAuctions.filter(a => a.status === 'CANCELADO' || a.status === 'SUSPENSO'), [allAuctions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leilões
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os leilões da plataforma.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/admin/auctions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
              <TabsTrigger value="open">Abertos ({openAuctions.length})</TabsTrigger>
              <TabsTrigger value="featured">Destaques ({featuredAuctions.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Em Breve ({upcomingAuctions.length})</TabsTrigger>
              <TabsTrigger value="closed">Encerrados ({closedAuctions.length})</TabsTrigger>
              <TabsTrigger value="drafts">Rascunhos ({draftAuctions.length})</TabsTrigger>
              <TabsTrigger value="canceled">Cancelados ({canceledAuctions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">{renderContentForTab(openAuctions)}</TabsContent>
            <TabsContent value="featured" className="mt-4">{renderContentForTab(featuredAuctions)}</TabsContent>
            <TabsContent value="upcoming" className="mt-4">{renderContentForTab(upcomingAuctions)}</TabsContent>
            <TabsContent value="closed" className="mt-4">{renderContentForTab(closedAuctions)}</TabsContent>
            <TabsContent value="drafts" className="mt-4">{renderContentForTab(draftAuctions)}</TabsContent>
            <TabsContent value="canceled" className="mt-4">{renderContentForTab(canceledAuctions)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

```
- src/app/admin/lots/page.tsx</file>
    <content><![CDATA[// src/app/admin/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultsFrame from '@/components/search-results-frame';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';

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
      setPlatformSettings(fetchedSettings);
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

  const sortOptions = [
    { value: 'endDate_asc', label: 'Encerramento Próximo' },
    { value: 'price_desc', label: 'Maior Valor' },
    { value: 'price_asc', label: 'Menor Valor' },
    { value: 'bidsCount_desc', label: 'Mais Lances' },
    { value: 'views_desc', label: 'Mais Vistos' },
  ];

  const renderLotList = (lots: Lot[]) => {
      if (!platformSettings) return null;
      return (
        <SearchResultsFrame
            items={lots}
            totalItemsCount={lots.length}
            renderGridItem={(item) => <LotCard lot={item} auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            renderListItem={(item) => <LotListItem lot={item} auction={allAuctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            sortOptions={sortOptions}
            initialSortBy="endDate_asc"
            onSortChange={() => {}} // Sorting is handled locally if needed, or can be passed
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
          <Tabs defaultValue="open">
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
