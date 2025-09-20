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
import { getAuctionStatusText } from '@/lib/ui-helpers';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { hasPermission } from '@/lib/permissions';

export default function AdminAuctionsPage() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('auctionDate_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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
      if(fetchedSettings) setItemsPerPage(fetchedSettings.defaultListItemsPerPage || 12);
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
              Visualize e gerencie os leilões da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {platformSettings && (
            <SearchResultsFrame
              items={allAuctions}
              totalItemsCount={allAuctions.length}
              renderGridItem={renderAuctionGridItem}
              renderListItem={renderAuctionListItem}
              sortOptions={sortOptions}
              initialSortBy={sortBy}
              onSortChange={setSortBy}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel="leilões"
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
