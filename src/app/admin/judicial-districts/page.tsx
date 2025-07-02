// src/app/admin/judicial-districts/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialDistricts, deleteJudicialDistrict } from './actions';
import type { JudicialDistrict } from '@/types';
import { PlusCircle, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminJudicialDistrictsPage() {
  const [districts, setDistricts] = useState<JudicialDistrict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchItems = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedItems = await getJudicialDistricts();
        if (isMounted) {
          setDistricts(fetchedItems);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar comarcas.";
        console.error("Error fetching judicial districts:", e);
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
    
    fetchItems();

    return () => { isMounted = false; };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteJudicialDistrict(id);
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Map className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Comarcas
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova as comarcas judiciais vinculadas aos tribunais.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/judicial-districts/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Comarca
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={districts}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome da comarca..."
          />
        </CardContent>
      </Card>
    </div>
  );
}