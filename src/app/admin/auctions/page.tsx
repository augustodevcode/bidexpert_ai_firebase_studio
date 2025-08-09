// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions } from './actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, PlatformSettings } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SearchResultsFrame from '@/components/search-results-frame';
import AuctionCard from '@/components/auction-card';
import AuctionListItem from '@/components/auction-list-item';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAuctionsPage() {
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
      const [fetchedAuctions, fetchedSettings] = await Promise.all([
        getAuctions(),
        getPlatformSettings()
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
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'auctionDate_asc', label: 'Mais Antigos' },
    { value: 'title_asc', label: 'Título A-Z' },
    { value: 'title_desc', label: 'Título Z-A' },
    { value: 'visits_desc', label: 'Mais Visitados' },
  ];

  const renderAuctionList = (auctions: Auction[]) => {
      if (!platformSettings) return null;
      return (
        <SearchResultsFrame
            items={auctions}
            totalItemsCount={auctions.length}
            renderGridItem={(item) => <AuctionCard auction={item} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            renderListItem={(item) => <AuctionListItem auction={item} onUpdate={() => setRefetchTrigger(p => p+1)}/>}
            sortOptions={sortOptions}
            initialSortBy="auctionDate_desc"
            onSortChange={() => {}} // Sorting logic is simplified per tab
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="leilões"
            // Paginação é controlada dentro do frame, pode ser ajustado se necessário
            currentPage={1}
            itemsPerPage={platformSettings.defaultListItemsPerPage || 12}
            onPageChange={() => {}}
            onItemsPerPageChange={() => {}}
            emptyStateMessage="Nenhum leilão encontrado nesta categoria."
        />
      );
  };
  
  const featuredAuctions = useMemo(() => allAuctions.filter(a => a.isFeaturedOnMarketplace), [allAuctions]);
  const draftAuctions = useMemo(() => allAuctions.filter(a => a.status === 'RASCUNHO'), [allAuctions]);
  const upcomingAuctions = useMemo(() => allAuctions.filter(a => a.status === 'EM_BREVE'), [allAuctions]);
  const openAuctions = useMemo(() => allAuctions.filter(a => a.status === 'ABERTO_PARA_LANCES' && !a.isFeaturedOnMarketplace), [allAuctions]);
  const closedAuctions = useMemo(() => allAuctions.filter(a => a.status === 'ENCERRADO' || a.status === 'FINALIZADO'), [allAuctions]);
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
              Visualize, adicione e edite os leilões da plataforma, organizados por status.
            </CardDescription>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
              <TabsTrigger value="open">Abertos ({openAuctions.length})</TabsTrigger>
              <TabsTrigger value="featured">Destaques ({featuredAuctions.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Em Breve ({upcomingAuctions.length})</TabsTrigger>
              <TabsTrigger value="drafts">Rascunhos ({draftAuctions.length})</TabsTrigger>
              <TabsTrigger value="closed">Encerrados ({closedAuctions.length})</TabsTrigger>
              <TabsTrigger value="canceled">Cancelados ({canceledAuctions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">{renderAuctionList(openAuctions)}</TabsContent>
            <TabsContent value="featured" className="mt-4">{renderAuctionList(featuredAuctions)}</TabsContent>
            <TabsContent value="upcoming" className="mt-4">{renderAuctionList(upcomingAuctions)}</TabsContent>
            <TabsContent value="drafts" className="mt-4">{renderAuctionList(draftAuctions)}</TabsContent>
            <TabsContent value="closed" className="mt-4">{renderAuctionList(closedAuctions)}</TabsContent>
            <TabsContent value="canceled" className="mt-4">{renderAuctionList(canceledAuctions)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
