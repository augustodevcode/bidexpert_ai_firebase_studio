// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, PlatformSettings } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultsFrame from '@/components/search-results-frame';
import { getPlatformSettings } from '../settings/actions';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';

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
        getPlatformSettings(),
      ]);
      setAllAuctions(fetchedAuctions);
      setPlatformSettings(fetchedSettings as PlatformSettings);
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

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteAuction(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(prev => prev + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: Auction[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteAuction(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.title}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} leilão(ões) excluído(s) com sucesso.` });
    }
    fetchPageData(); // Re-fetch data after operation
  }, [toast, fetchPageData]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const statusOptions = useMemo(() => 
    [...new Set(allAuctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [allAuctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
  ], [statusOptions]);
  
  const renderAuctionGridItem = (auction: Auction) => <UniversalCard item={auction} type="auction" platformSettings={platformSettings!} onUpdate={() => setRefetchTrigger(p => p+1)} />;
  const renderAuctionListItem = (auction: Auction) => <UniversalListItem item={auction} type="auction" platformSettings={platformSettings!} onUpdate={() => setRefetchTrigger(p => p+1)} />;
  const sortOptions = [
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'endDate_asc', label: 'Encerramento Próximo' },
    { value: 'visits_desc', label: 'Mais Visitados' },
  ];

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
                    totalItemsCount={allAuctions.length}
                    renderGridItem={renderAuctionGridItem}
                    renderListItem={renderAuctionListItem}
                    sortOptions={sortOptions}
                    initialSortBy="auctionDate_desc"
                    onSortChange={() => {}} // Sorting is now handled inside SearchResultsFrame
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
                    totalItemsCount={allAuctions.length}
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
               <DataTable
                columns={columns}
                data={allAuctions}
                isLoading={isLoading}
                error={error}
                searchColumnId="title"
                searchPlaceholder="Buscar por título..."
                facetedFilterColumns={facetedFilterColumns}
                onDeleteSelected={handleDeleteSelected}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
