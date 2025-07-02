
// src/app/admin/judicial-processes/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialProcesses, deleteJudicialProcess } from './actions';
import type { JudicialProcess } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminJudicialProcessesPage() {
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
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
        const fetchedItems = await getJudicialProcesses();
        if (isMounted) {
          setProcesses(fetchedItems);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar processos judiciais.";
        console.error("Error fetching judicial processes:", e);
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
      const result = await deleteJudicialProcess(id);
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

  const facetedFilterOptions = useMemo(() => {
    const courts = [...new Set(processes.map(p => p.courtName).filter(Boolean))] as string[];
    const branches = [...new Set(processes.map(p => p.branchName).filter(Boolean))] as string[];
    
    return [
      { id: 'courtName', title: 'Tribunal', options: courts.map(name => ({label: name, value: name})) },
      { id: 'branchName', title: 'Vara', options: branches.map(name => ({label: name, value: name})) }
    ];
  }, [processes]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Processos Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova os processos judiciais.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/judicial-processes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Processo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={processes}
            isLoading={isLoading}
            error={error}
            searchColumnId="processNumber"
            searchPlaceholder="Buscar por nº do processo..."
            facetedFilterColumns={facetedFilterOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
