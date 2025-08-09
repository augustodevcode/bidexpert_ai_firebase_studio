// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction } from '@/types';
import { PlusCircle, Gavel, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionCard from '@/components/auction-card';

const ViewModeSwitcher = ({ viewMode, setViewMode }: { viewMode: 'table' | 'cards', setViewMode: (mode: 'table' | 'cards') => void }) => (
    <div className="flex items-center gap-1 rounded-md border bg-secondary p-0.5">
        <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('table')}
        >
            <List className="h-4 w-4" />
        </Button>
        <Button
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('cards')}
        >
            <LayoutGrid className="h-4 w-4" />
        </Button>
    </div>
);


export default function AdminAuctionsPage() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAuctions = await getAuctions();
      setAllAuctions(fetchedAuctions);
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
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast, setRefetchTrigger]);

  const handleDeleteSelected = useCallback(async (selectedItems: Auction[]) => {
      if (selectedItems.length === 0) return;
      let successCount = 0;
      let errorCount = 0;

      for (const item of selectedItems) {
        const result = await deleteAuction(item.id);
        if (result.success) successCount++;
        else {
          errorCount++;
          toast({ title: `Erro ao excluir ${item.title}`, description: result.message, variant: "destructive", duration: 5000 });
        }
      }

      if (successCount > 0) {
        toast({ title: "Exclusão em Massa Concluída", description: `${successCount} leilão(ões) excluído(s) com sucesso.` });
      }
      setRefetchTrigger(c => c + 1);
  }, [toast, setRefetchTrigger]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const renderContentForTab = (auctions: Auction[]) => {
    const statusOptions = [...new Set(auctions.map(a => a.status))].map(status => ({ value: status, label: getAuctionStatusText(status) }));
    const facetedFilterColumns = [{ id: 'status', title: 'Status', options: statusOptions }];

    if (viewMode === 'table') {
        return (
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
        );
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} onUpdate={() => setRefetchTrigger(p => p+1)} />
            ))}
        </div>
    );
  };
  
  const openAuctions = useMemo(() => allAuctions.filter(a => a.status === 'ABERTO_PARA_LANCES' || a.status === 'ABERTO'), [allAuctions]);
  const upcomingAuctions = useMemo(() => allAuctions.filter(a => a.status === 'EM_BREVE'), [allAuctions]);
  const closedAuctions = useMemo(() => allAuctions.filter(a => a.status === 'ENCERRADO' || a.status === 'FINALIZADO'), [allAuctions]);
  const draftAuctions = useMemo(() => allAuctions.filter(a => a.status === 'RASCUNHO' || a.status === 'EM_PREPARACAO'), [allAuctions]);
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
              Visualize, adicione e edite os leilões da plataforma.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeSwitcher viewMode={viewMode} setViewMode={setViewMode} />
            <Button asChild>
                <Link href="/admin/auctions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="open">Abertos ({openAuctions.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Em Breve ({upcomingAuctions.length})</TabsTrigger>
              <TabsTrigger value="closed">Encerrados ({closedAuctions.length})</TabsTrigger>
              <TabsTrigger value="drafts">Rascunhos ({draftAuctions.length})</TabsTrigger>
              <TabsTrigger value="canceled">Cancelados ({canceledAuctions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="mt-4">{renderContentForTab(openAuctions)}</TabsContent>
            <TabsContent value="upcoming" className="mt-4">{renderContentForTab(upcomingAuctions)}</TabsContent>
            <TabsContent value="closed" className="mt-4">{renderContentForTab(closedAuctions)}</TabsContent>
            <TabsContent value="drafts" className="mt-4">{renderContentForTab(draftAuctions)}</TabsContent>
            <TabsContent value="canceled" className="mt-4">{renderContentForTab(canceledAuctions)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
