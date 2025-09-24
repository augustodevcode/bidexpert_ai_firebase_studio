// src/app/admin/auctions/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Leilões.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por status e agrupamentos.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { getSellers } from '../sellers/actions';
import { getAuctioneers } from '../auctioneers/actions';


export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, fetchedSellers, fetchedAuctioneers] = await Promise.all([
        getAuctions(),
        getSellers(),
        getAuctioneers(),
      ]);
      setAuctions(fetchedAuctions);
      setSellers(fetchedSellers);
      setAuctioneers(fetchedAuctioneers);
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
      setRefetchTrigger(c => c + 1); // Trigger refetch
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
    fetchPageData();
  }, [toast, fetchPageData]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status!, label: getAuctionStatusText(status) })),
  [auctions]);

  const sellerOptions = useMemo(() =>
    sellers.map(s => ({ value: s.name, label: s.name })),
  [sellers]);
  
  const auctioneerOptions = useMemo(() =>
    auctioneers.map(a => ({ value: a.name, label: a.name })),
  [auctioneers]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'sellerName', title: 'Comitente', options: sellerOptions },
    { id: 'auctioneerName', title: 'Leiloeiro', options: auctioneerOptions },
  ], [statusOptions, sellerOptions, auctioneerOptions]);

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
        <CardContent>
           <DataTable
            columns={columns}
            data={auctions}
            isLoading={isLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título ou ID..."
            facetedFilterColumns={facetedFilterColumns}
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
