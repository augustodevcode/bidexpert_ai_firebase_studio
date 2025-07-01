
// src/app/admin/states/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStates, deleteState } from './actions';
import type { StateInfo } from '@/types';
import { PlusCircle, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';


export default function AdminStatesPage() {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchStates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedStates = await getStates();
        if (!isCancelled) {
          setStates(fetchedStates);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar estados.";
        console.error("Error fetching states:", e);
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

    fetchStates();

    return () => {
      isCancelled = true;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteState(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
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
              Gerenciar Estados
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova estados da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/states/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Estado
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={states}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome ou UF..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
