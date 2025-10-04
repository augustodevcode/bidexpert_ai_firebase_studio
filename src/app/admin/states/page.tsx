// src/app/admin/states/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Estados.
 * Utiliza o componente DataTable para exibir os estados de forma interativa,
 * permitindo busca, ordenação e ações como edição e exclusão.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStates, deleteState } from './actions';
import type { StateInfo } from '@/types';
import { PlusCircle, Map, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { useRouter } from 'next/navigation';

export default function AdminStatesPage() {
  const [states, setStates] = useState<StateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedStates = await getStates();
        setStates(fetchedStates);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar estados.";
        console.error("Error fetching states:", e);
        setError(errorMessage);
        toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteState(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: StateInfo[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteState(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} estado(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6" data-ai-id="admin-states-page-container">
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
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/admin/states/analysis">
                    <BarChart3 className="mr-2 h-4 w-4" /> Ver Análise
                </Link>
            </Button>
            <Button asChild>
                <Link href="/admin/states/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Estado
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={states}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome ou UF..."
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
