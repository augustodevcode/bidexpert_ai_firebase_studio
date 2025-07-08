// src/app/admin/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import type { Lot } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function AdminLotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLots = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedLots = await getLots();
        if (isMounted) {
          setLots(fetchedLots);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar lotes.";
        console.error("Error fetching lots:", e);
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchLots();

    return () => {
      isMounted = false;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string, auctionId?: string) => {
      const result = await deleteLot(id, auctionId);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(lots.map(lot => lot.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [lots]);

  const facetedFilterColumns = useMemo(() => [
    {
      id: 'status',
      title: 'Status',
      options: statusOptions
    }
  ], [statusOptions]);

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
              Adicione, edite ou remova lotes para os leilões.
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
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
