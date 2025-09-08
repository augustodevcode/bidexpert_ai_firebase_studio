// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@bidexpert/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bidexpert/ui';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, PlatformSettings } from '@bidexpert/core';
import { PlusCircle, Gavel } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bidexpert/ui";
import SearchResultsFrame from '@/components/search-results-frame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getAuctionStatusText } from '@bidexpert/core';
import { AuctionCard, AuctionListItem } from '@bidexpert/ui';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';

export default function AdminAuctionsPage() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, fetchedSettings] = await Promise.all([
        getAuctions(),
        getPlatformSettings(),
      ]);
      setAllAuctions(fetchedAuctions);
      setPlatformSettings(fetchedSettings as PlatformSettings);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leilões.";
      console.error("Error fetching auctions:", e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);
  
  const renderAuctionGridItem = (auction: Auction) => <AuctionCard auction={auction} onUpdate={() => setRefetchTrigger(p => p+1)} />;
  const renderAuctionListItem = (auction: Auction) => <AuctionListItem auction={auction} onUpdate={() => setRefetchTrigger(p => p+1)} />;

  const sortOptions = [
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'endDate_asc', label: 'Encerramento Próximo' },
    { value: 'visits_desc', label: 'Mais Visitados' },
  ];

  const statusOptions = useMemo(() => 
    [...new Set(allAuctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [allAuctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    // Adicionar filtro por leiloeiro e comitente se necessário no futuro
  ], [statusOptions]);

  return (
    <div className="space-y-6" data-ai-id="admin-auctions-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leilões
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os leilões da plataforma em diferentes formatos.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cards" className="w-full">
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="cards" className="mt-4">
              {platformSettings && (
                 <SearchResultsFrame
                    items={allAuctions}
                    renderGridItem={renderAuctionGridItem}
                    renderListItem={renderAuctionListItem}
                    sortOptions={sortOptions}
                    initialSortBy="auctionDate_desc"
                    onSortChange={() => {}} // Sorting is handled inside
                    platformSettings={platformSettings}
                    isLoading={isLoading}
                    searchTypeLabel="leilões"
                    facetedFilterColumns={facetedFilterColumns}
                  />
              )}
            </TabsContent>
            <TabsContent value="list" className="mt-4">
               {platformSettings && (
                 <SearchResultsFrame
                    items={allAuctions}
                    renderGridItem={renderAuctionGridItem}
                    renderListItem={renderAuctionListItem}
                    sortOptions={sortOptions}
                    initialSortBy="auctionDate_desc"
                    onSortChange={() => {}}
                    platformSettings={platformSettings}
                    isLoading={isLoading}
                    searchTypeLabel="leilões"
                    facetedFilterColumns={facetedFilterColumns}
                  />
              )}
            </TabsContent>
            <TabsContent value="table" className="mt-4">
               <ResourceDataTable<Auction>
                columns={createColumns}
                fetchAction={getAuctions}
                deleteAction={deleteAuction}
                searchColumnId="title"
                searchPlaceholder="Buscar por título..."
                facetedFilterColumns={facetedFilterColumns}
                deleteConfirmation={(item) => (item.totalLots || 0) === 0}
                deleteConfirmationMessage={(item) => `Este leilão não pode ser excluído pois tem ${item.totalLots} lote(s) associado(s).`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
