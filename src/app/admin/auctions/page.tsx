// src/app/admin/auctions/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Leilões.
 * Utiliza o componente SearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por status e visualização em grade ou lista.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getAuctions as getAuctionsAction, deleteAuction } from './actions';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, PlatformSettings } from '@/types';
import { PlusCircle, Gavel, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { getSellers } from '../sellers/actions';
import { getAuctioneers } from '../auctioneers/actions';
import SearchResultsFrame from '@/components/search-results-frame';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';

const sortOptions = [
  { value: 'auctionDate_desc', label: 'Data: Mais Recentes' },
  { value: 'auctionDate_asc', label: 'Data: Mais Antigos' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'title_desc', label: 'Título Z-A' },
  { value: 'visits_desc', label: 'Mais Visitados' },
];

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [allAuctioneers, setAllAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, settings, sellers, auctioneers] = await Promise.all([
        getAuctionsAction(false), // Fetch all for admin
        getPlatformSettings(),
        getSellers(),
        getAuctioneers(),
      ]);
      setAuctions(fetchedAuctions);
      setPlatformSettings(settings as PlatformSettings);
      setAllSellers(sellers);
      setAllAuctioneers(auctioneers);
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
  
  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteAuction(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        setRefetchTrigger((c) => c + 1);
      } else {
        toast({
          title: "Erro ao Excluir",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const renderGridItem = (item: Auction) => <UniversalCard item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Auction) => <UniversalListItem item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const facetedFilterOptions = useMemo(() => {
      const statusOptions = [...new Set(auctions.map(a => a.status))].map(status => ({ value: status!, label: getAuctionStatusText(status) }));
      const sellerOptions = allSellers.map(s => ({ value: s.name, label: s.name }));
      const auctioneerOptions = allAuctioneers.map(a => ({ value: a.name, label: a.name }));
      return [
          { id: 'status', title: 'Status', options: statusOptions },
          { id: 'sellerName', title: 'Comitente', options: sellerOptions },
          { id: 'auctioneerName', title: 'Leiloeiro', options: auctioneerOptions },
      ];
  }, [auctions, allSellers, allAuctioneers]);
  
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
    <div className="space-y-6" data-ai-id="admin-auctions-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leilões
            </CardTitle>
            <CardDescription>
              Visualize, adicione e edite os leilões da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <SearchResultsFrame
        items={auctions}
        totalItemsCount={auctions.length}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        dataTableColumns={columns}
        sortOptions={sortOptions}
        initialSortBy="auctionDate_desc"
        onSortChange={() => {}}
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="leilões"
        emptyStateMessage="Nenhum leilão encontrado."
        facetedFilterColumns={facetedFilterOptions}
      />
    </div>
  );
}