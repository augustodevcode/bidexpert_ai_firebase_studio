// src/app/admin/cities/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Cidades.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros facetados por UF e ações como
 * exclusão em massa e individual.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCities, deleteCity } from './actions';
import type { CityInfo } from '@/types';
import { PlusCircle, Building2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCities = await getCities();
        setCities(fetchedCities);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar cidades.";
        console.error("Error fetching cities:", e);
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
    const result = await deleteCity(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: CityInfo[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteCity(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.name}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} cidade(s) excluída(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);
  
  const stateOptions = useMemo(() => 
    [...new Set(cities.map(c => c.stateUf).filter(Boolean))]
      .map(uf => ({ value: uf!, label: uf! })),
  [cities]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'stateUf', title: 'UF', options: stateOptions },
  ], [stateOptions]);


  return (
    <div className="space-y-6" data-ai-id="admin-cities-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Cidades
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova cidades da plataforma.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/admin/cities/analysis">
                    <BarChart3 className="mr-2 h-4 w-4" /> Ver Análise
                </Link>
            </Button>
            <Button asChild>
                <Link href="/admin/cities/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Cidade
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <DataTable
            columns={columns}
            data={cities}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por cidade..."
            facetedFilterColumns={facetedFilterColumns}
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
