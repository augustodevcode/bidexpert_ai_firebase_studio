// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Auction, PlatformSettings } from '@/types';
import { PlusCircle, Gavel, LayoutGrid, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import SearchResultsFrame from '@/components/search-results-frame';
import AuctionCard from '@/components/auction-card';
import AuctionListItem from '@/components/auction-list-item';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
  
  // State for SearchResultsFrame
  const [sortBy, setSortBy] = useState('auctionDate_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);


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
      if (fetchedSettings?.defaultListItemsPerPage) {
        setItemsPerPage(fetchedSettings.defaultListItemsPerPage);
      }
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
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(prev => prev + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
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
    setRefetchTrigger(prev => prev + 1);
  }, [toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);

  const auctioneerOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.auctioneerName).filter(Boolean))]
      .map(name => ({ value: name!, label: name! })),
  [auctions]);
  
  const sellerOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.sellerName).filter(Boolean))]
      .map(name => ({ value: name!, label: name! })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'auctioneerName', title: 'Leiloeiro', options: auctioneerOptions },
    { id: 'sellerName', title: 'Comitente', options: sellerOptions },
  ], [statusOptions, auctioneerOptions, sellerOptions]);
  
  // --- Props for SearchResultsFrame ---
  const renderGridItem = (item: Auction) => <AuctionCard auction={item} onUpdate={() => setRefetchTrigger(p => p + 1)} />;
  const renderListItem = (item: Auction) => <AuctionListItem auction={item} onUpdate={() => setRefetchTrigger(p => p + 1)} />;
  
  const sortOptionsAuctions = [
    { value: 'auctionDate_desc', label: 'Mais Recentes' },
    { value: 'auctionDate_asc', label: 'Mais Antigos' },
    { value: 'title_asc', label: 'Título A-Z' },
    { value: 'title_desc', label: 'Título Z-A' },
    { value: 'status_asc', label: 'Status A-Z' },
  ];

  const sortedAuctions = useMemo(() => {
    return [...auctions].sort((a, b) => {
      switch (sortBy) {
        case 'auctionDate_desc': return new Date(b.auctionDate as string).getTime() - new Date(a.auctionDate as string).getTime();
        case 'auctionDate_asc': return new Date(a.auctionDate as string).getTime() - new Date(b.auctionDate as string).getTime();
        case 'title_asc': return a.title.localeCompare(b.title);
        case 'title_desc': return b.title.localeCompare(a.title);
        case 'status_asc': return getAuctionStatusText(a.status).localeCompare(getAuctionStatusText(b.status));
        default: return 0;
      }
    });
  }, [auctions, sortBy]);

  const paginatedAuctions = useMemo(() => {
    if (!platformSettings) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAuctions.slice(startIndex, endIndex);
  }, [sortedAuctions, currentPage, itemsPerPage, platformSettings]);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleItemsPerPageChange = (newSize: number) => { setItemsPerPage(newSize); setCurrentPage(1); };

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
              Visualize, adicione, edite ou remova leilões da plataforma.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 border p-1 rounded-md bg-muted">
                <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><List className="h-4 w-4"/></Button>
                <Button variant={viewMode === 'cards' ? 'secondary': 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4"/></Button>
            </div>
            <Button asChild className="flex-grow sm:flex-grow-0">
              <Link href="/admin/auctions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {viewMode === 'grid' ? (
              <DataTable
                columns={columns}
                data={auctions}
                isLoading={isLoading}
                error={error}
                searchColumnId="title"
                searchPlaceholder="Buscar por título..."
                facetedFilterColumns={facetedFilterColumns}
                onDeleteSelected={handleDeleteSelected}
              />
           ) : platformSettings ? (
             <SearchResultsFrame
                items={paginatedAuctions}
                totalItemsCount={auctions.length}
                renderGridItem={renderGridItem}
                renderListItem={renderListItem}
                sortOptions={sortOptionsAuctions}
                initialSortBy={sortBy}
                onSortChange={setSortBy}
                platformSettings={platformSettings}
                isLoading={isLoading}
                error={error}
                searchTypeLabel="leilões"
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
             />
           ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
