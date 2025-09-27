// src/app/admin/lots/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Lotes.
 * Utiliza o componente SearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação e visualização em grade ou lista.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots as getLotsAction, deleteLot } from './actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import type { Auction, Lot, PlatformSettings } from '@/types';
import { PlusCircle, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import SearchResultsFrame from '@/components/search-results-frame';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';

const sortOptions = [
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'title_asc', label: 'Título A-Z' },
];

export default function AdminLotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedLots, fetchedAuctions, settings] = await Promise.all([
        getLotsAction(),
        getAuctions(),
        getPlatformSettings(),
      ]);
      setLots(fetchedLots);
      setAuctions(fetchedAuctions);
      setPlatformSettings(settings as PlatformSettings);
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
  
  const handleDelete = useCallback(
    async (lotId: string, auctionId?: string) => {
      const result = await deleteLot(lotId, auctionId);
      if (result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setRefetchTrigger((c) => c + 1);
      } else {
        toast({
          title: 'Erro ao Excluir',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const renderGridItem = (item: Lot) => <UniversalCard item={item} type="lot" auction={auctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Lot) => <UniversalListItem item={item} type="lot" auction={auctions.find(a => a.id === item.auctionId)} platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const facetedFilterOptions = useMemo(() => {
      const statusOptions = [...new Set(lots.map(l => l.status))].map(status => ({ value: status, label: getAuctionStatusText(status) }));
      const auctionOptions = auctions.map(a => ({ value: a.title, label: a.title }));
      return [
          { id: 'status', title: 'Status', options: statusOptions },
          { id: 'auctionName', title: 'Leilão', options: auctionOptions }
      ];
  }, [lots, auctions]);
  
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
    <div className="space-y-6" data-ai-id="admin-lots-page-container">
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
      </Card>
      
       <SearchResultsFrame
        items={lots}
        totalItemsCount={lots.length}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        dataTableColumns={columns}
        sortOptions={sortOptions}
        initialSortBy="endDate_asc"
        onSortChange={() => {}}
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="lotes"
        emptyStateMessage="Nenhum lote encontrado."
        facetedFilterColumns={facetedFilterOptions}
        searchColumnId='title'
        searchPlaceholder='Buscar por título...'
      />
    </div>
  );
}
