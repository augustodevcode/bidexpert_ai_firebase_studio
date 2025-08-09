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
import SearchResultsFrame from '@/components/search-results-frame';
import AuctionCard from '@/components/auction-card';
import AuctionListItem from '@/components/auction-list-item';
import { getPlatformSettings } from '@/app/admin/settings/actions';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, fetchedSettings] = await Promise.all([
        getAuctions(),
        getPlatformSettings()
      ]);
      setAuctions(fetchedAuctions);
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
  }, [fetchPageData]);
  
  const renderGridItem = (item: Auction) => <AuctionCard auction={item} onUpdate={fetchPageData} />;
  const renderListItem = (item: Auction) => <AuctionListItem auction={item} onUpdate={fetchPageData} />;
  
  const sortOptionsAuctions = [
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'auctionDate_asc', label: 'Mais Antigos' },
    { value: 'title_asc', label: 'Título A-Z' },
    { value: 'title_desc', label: 'Título Z-A' },
  ];

  const sortedAuctions = useMemo(() => {
    return [...auctions].sort((a, b) => {
        // Simple sort by date for now, can be expanded
        return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
    });
  }, [auctions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leilões
            </CardTitle>
            <CardDescription>
              Visualize, adicione, edite ou remova leilões da plataforma.
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
                items={sortedAuctions}
                totalItemsCount={sortedAuctions.length}
                renderGridItem={renderGridItem}
                renderListItem={renderListItem}
                sortOptions={sortOptionsAuctions}
                initialSortBy="auctionDate_desc"
                onSortChange={() => {}} // Placeholder for now
                platformSettings={platformSettings}
                isLoading={isLoading}
                error={error}
                searchTypeLabel="leilões"
                currentPage={1}
                itemsPerPage={50} // Show more items in admin view by default
                onPageChange={() => {}}
                onItemsPerPageChange={() => {}}
             />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
