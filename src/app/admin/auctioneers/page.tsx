// src/app/admin/auctioneers/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Leiloeiros.
 * Utiliza o componente SearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por faceta e visualização em grade, lista ou tabela.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctioneers as getAuctioneersAction, deleteAuctioneer } from './actions';
import type { AuctioneerProfileInfo, PlatformSettings } from '@/types';
import { PlusCircle, Landmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import SearchResultsFrame from '@/components/search-results-frame';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';

const sortOptions = [
  { value: 'name_asc', label: 'Nome A-Z' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'createdAt_desc', label: 'Mais Recentes' },
];

export default function AdminAuctioneersPage() {
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctioneers, settings] = await Promise.all([
        getAuctioneersAction(),
        getPlatformSettings(),
      ]);
      setAuctioneers(fetchedAuctioneers);
      setPlatformSettings(settings as PlatformSettings);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leiloeiros.";
      console.error("Error fetching auctioneers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);

  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteAuctioneer(id);
    if(result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);

  const handleDeleteSelected = useCallback(async (selectedItems: AuctioneerProfileInfo[]) => {
      for (const item of selectedItems) {
        await deleteAuctioneer(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} leiloeiro(s) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);

  const renderGridItem = (item: AuctioneerProfileInfo) => <UniversalCard item={item} type="auctioneer" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: AuctioneerProfileInfo) => <UniversalListItem item={item} type="auctioneer" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const facetedFilterOptions = useMemo(() => {
      const stateOptions = [...new Set(auctioneers.map(s => s.state).filter(Boolean))].map(s => ({ value: s!, label: s! }));
      return [
          { id: 'state', title: 'Estado', options: stateOptions },
      ];
  }, [auctioneers]);
  
  if (isLoading || !platformSettings) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                    <Skeleton className="h-10 w-36"/>
                </CardHeader>
                <CardContent><Skeleton className="h-96 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="admin-auctioneers-page-container">
      <Card className="shadow-lg" data-ai-id="admin-auctioneers-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Landmark className="h-6 w-6 mr-2 text-primary" />
              Listagem de Leiloeiros
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leiloeiros da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctioneers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <SearchResultsFrame
        items={auctioneers}
        totalItemsCount={auctioneers.length}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        dataTableColumns={columns}
        sortOptions={sortOptions}
        initialSortBy="name_asc"
        onSortChange={() => {}}
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="leiloeiros"
        emptyStateMessage="Nenhum leiloeiro encontrado."
        facetedFilterColumns={facetedFilterOptions}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  );
}
