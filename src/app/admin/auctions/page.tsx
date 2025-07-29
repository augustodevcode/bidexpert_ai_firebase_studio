// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { PlusCircle, Gavel, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { getSellers } from '../sellers/actions';
import { getAuctioneers } from '../auctioneers/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AuctionGanttChart from '@/components/admin/analysis/auction-gantt-chart';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [allAuctioneers, setAllAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchAuctions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedAuctions, fetchedSellers, fetchedAuctioneers] = await Promise.all([
            getAuctions(),
            getSellers(),
            getAuctioneers()
        ]);
        if (!isCancelled) {
          setAuctions(fetchedAuctions);
          setAllSellers(fetchedSellers);
          setAllAuctioneers(fetchedAuctioneers);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar dados.";
        console.error("Error fetching auctions data:", e);
        if (!isCancelled) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    fetchAuctions();

    return () => {
      isCancelled = true;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteAuction(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: 'Erro ao Excluir', description: result.message, variant: 'destructive' });
      }
    },
    [toast]
  );

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
    setRefetchTrigger(c => c + 1);
  }, [toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);

  const sellerOptions = useMemo(() => 
    allSellers.map(s => ({ value: s.name, label: s.name })),
  [allSellers]);
  
  const auctioneerOptions = useMemo(() => 
    allAuctioneers.map(a => ({ value: a.name, label: a.name })),
  [allAuctioneers]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'sellerName', title: 'Comitente', options: sellerOptions },
    { id: 'auctioneerName', title: 'Leiloeiro', options: auctioneerOptions }
  ], [statusOptions, sellerOptions, auctioneerOptions]);

  const renderDataTable = (tableInstance: any) => (
     <DataTable
        columns={columns}
        data={auctions}
        isLoading={isLoading}
        error={error}
        searchColumnId="title"
        searchPlaceholder="Buscar por título..."
        facetedFilterColumns={facetedFilterColumns}
        onDeleteSelected={handleDeleteSelected}
        tableInstance={tableInstance}
      />
  );


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Listagem de Leilões
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leilões da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={auctions}
            isLoading={isLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={facetedFilterColumns}
            onDeleteSelected={handleDeleteSelected}
            renderChildrenAboveTable={(table) => (
                <Accordion type="single" collapsible className="w-full mb-4">
                    <AccordionItem value="gantt-chart">
                        <AccordionTrigger>
                           <div className="flex items-center gap-2">
                               <Calendar className="h-4 w-4 text-primary" /> 
                               <span>Visualizar Cronograma (Gantt)</span>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <Card className="mt-2">
                                <CardContent className="h-[500px] w-full p-2">
                                    <AuctionGanttChart auctions={table.getFilteredRowModel().rows.map(row => row.original)} />
                                </CardContent>
                           </Card>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
