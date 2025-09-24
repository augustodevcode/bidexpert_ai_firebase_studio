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

const sortOptions = [
  { value: 'auctionDate_desc', label: 'Data: Mais Recentes' },
  { value: 'auctionDate_asc', label: 'Data: Mais Antigos' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'title_desc', label: 'Título Z-A' },
  { value: 'visits_desc', label: 'Mais Visitados' },
];

export default function AdminAuctionsPage() {
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
      const [fetchedAuctions, settings] = await Promise.all([
        getAuctionsAction(false), // Fetch all for admin
        getPlatformSettings(),
      ]);
      setAuctions(fetchedAuctions);
      setPlatformSettings(settings as PlatformSettings);
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

  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const renderGridItem = (item: Auction) => <UniversalCard item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Auction) => <UniversalListItem item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;

  if (isLoading || !platformSettings) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2"/>
                        <Skeleton className="h-4 w-80"/>
                    </div>
                    <Skeleton className="h-10 w-36"/>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                    </div>
                </CardContent>
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
        sortOptions={sortOptions}
        initialSortBy="auctionDate_desc"
        onSortChange={() => {}} // Sorting logic is now internal to SearchResultsFrame or could be passed
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="leilões"
        emptyStateMessage="Nenhum leilão encontrado."
        itemsPerPage={platformSettings.defaultListItemsPerPage || 10}
      />
    </div>
  );
}
