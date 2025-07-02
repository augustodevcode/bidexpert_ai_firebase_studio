// src/app/admin/judicial-branches/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialBranchesAction, deleteJudicialBranchAction } from './actions';
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

  useEffect(() => {
    let isMounted = true;
    
    const fetchItems = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedItems = await getJudicialBranchesAction();
        if (isMounted) {
          setBranches(fetchedItems);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar varas judiciais.";
        console.error("Error fetching judicial branches:", e);
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
      const result = await deleteJudicialBranchAction(id);
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
            facetedFilterColumns={[
              { id: 'districtName', title: 'Comarca', options: [...new Set(branches.map(b => b.districtName))].map(name => ({label: name!, value: name!})) }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
