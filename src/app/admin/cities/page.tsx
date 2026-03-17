// src/app/admin/cities/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Cidades.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros facetados por UF e ações como
 * exclusão em massa e individual, com CRUD inline através do CrudFormContainer.
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
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from './columns';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import CityForm from './city-form';

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // State for Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityInfo | null>(null);

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

  const handleEdit = useCallback((city: CityInfo) => {
    setEditingCity(city);
    setIsFormOpen(true);
  }, []);

  const handleCreateNew = () => {
    setEditingCity(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCity(null);
    setRefetchTrigger(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingCity(null);
  };

  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEdit }), [handleDelete, handleEdit]);
  
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
            <Button onClick={handleCreateNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Cidade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
                items={cities}
                dataTableColumns={columns}
                onSortChange={() => {}}
                platformSettings={{ searchItemsPerPage: 10 } as any}
                isLoading={isLoading}
                searchTypeLabel="cidades"
                searchColumnId="name"
                searchPlaceholder="Buscar por cidade..."
                facetedFilterColumns={facetedFilterColumns}
                onDeleteSelected={handleDeleteSelected as any}
                sortOptions={[{ value: 'name', label: 'Nome' }]}
            />
        </CardContent>
      </Card>

      <CrudFormContainer
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingCity ? "Editar Cidade" : "Nova Cidade"}
        description={editingCity ? "Faça alterações na cidade selecionada." : "Preencha os dados para cadastrar uma nova cidade."}
        mode="modal"
      >
        <CityForm 
          cityInfo={editingCity || undefined} 
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </CrudFormContainer>
    </div>
  );
}
