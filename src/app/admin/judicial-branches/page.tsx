// src/app/admin/judicial-branches/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialBranches, deleteJudicialBranch } from './actions';
import type { JudicialBranch } from '@/types';
import { PlusCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminJudicialBranchesPage() {
  const [branches, setBranches] = useState<JudicialBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await getJudicialBranches();
      setBranches(fetchedItems);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar varas judiciais.";
      console.error("Error fetching judicial branches:", e);
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
    const result = await deleteJudicialBranch(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: JudicialBranch[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteJudicialBranch(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} vara(s) excluída(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const facetedFilterOptions = useMemo(() => {
    const districts = [...new Set(branches.map(b => b.districtName).filter(Boolean))] as string[];
    return [
      { id: 'districtName', title: 'Comarca', options: districts.map(name => ({label: name!, value: name!})) }
    ];
  }, [branches]);


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Varas Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova as varas judiciais vinculadas às comarcas.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/judicial-branches/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Vara
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={branches}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome da vara..."
            facetedFilterColumns={facetedFilterOptions}
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
