
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuctioneerProfileInfo } from '@/types';
import { getAuctioneers, deleteAuctioneer } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns } from './columns';

export default function AdminAuctioneersPage() {
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuctioneers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAuctioneers = await getAuctioneers();
      setAuctioneers(fetchedAuctioneers);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leiloeiros.";
      console.error("Error fetching auctioneers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAuctioneers();
  }, [fetchAuctioneers]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteAuctioneer(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchAuctioneers();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [fetchAuctioneers, toast]
  );
  
  const columns = createColumns({ handleDelete });

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Landmark className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leiloeiros
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leiloeiros da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctioneers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={auctioneers}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
            entityName="Leiloeiro"
            entityNamePlural="Leiloeiros"
          />
        </CardContent>
      </Card>
    </div>
  );
}
