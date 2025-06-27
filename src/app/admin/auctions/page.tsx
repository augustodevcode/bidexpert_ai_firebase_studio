
// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAuctions = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedAuctions = await getAuctions();
        if (isMounted) {
          setAuctions(fetchedAuctions);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leilões.";
        console.error("Error fetching auctions:", e);
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
    
    fetchAuctions();

    return () => {
      isMounted = false;
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
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);


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
            facetedFilterColumns={[
              {
                id: 'status',
                title: 'Status',
                options: statusOptions
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
