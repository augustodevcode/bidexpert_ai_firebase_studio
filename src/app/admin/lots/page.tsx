
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import type { Lot } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns } from './columns';

export default function AdminLotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLots = await getLots();
      setLots(fetchedLots);
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
    fetchLots();
  }, [fetchLots]);

  const handleDelete = useCallback(
    async (id: string) => {
      const lotToDelete = lots.find(l => l.id === id || l.publicId === id);
      const result = await deleteLot(id, lotToDelete?.auctionId);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchLots();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [lots, fetchLots, toast]
  );
  
  const columns = createColumns({ handleDelete });

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
            entityName="Lote"
            entityNamePlural="Lotes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
