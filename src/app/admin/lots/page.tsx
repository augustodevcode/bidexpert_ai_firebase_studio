// src/app/admin/lots/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Lotes.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros facetados e ações como exclusão.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import type { Auction, Lot } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';

export default function AdminLotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedLots, fetchedAuctions] = await Promise.all([
        getLots(),
        getAuctions(),
      ]);
      setLots(fetchedLots);
      setAuctions(fetchedAuctions);
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
  
  const handleDelete = useCallback(async (id: string, auctionId?: string) => {
    const result = await deleteLot(id, auctionId);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: Lot[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteLot(item.id, item.auctionId);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.title}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} lote(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(lots.map(l => l.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [lots]);
  
  const auctionOptions = useMemo(() =>
    auctions.map(auc => ({ value: auc.title, label: `${auc.title} (ID: ...${auc.id.slice(-6)})` })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'auctionName', title: 'Leilão', options: auctionOptions },
  ], [statusOptions, auctionOptions]);

  return (
    <div className="space-y-6">
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
        <CardContent>
           <DataTable
              columns={columns}
              data={lots}
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
