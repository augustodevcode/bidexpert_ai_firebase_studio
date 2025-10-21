// src/app/admin/judicial-districts/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Comarcas Judiciais.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação e ações como exclusão em massa e individual.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialDistricts, deleteJudicialDistrict, createJudicialDistrict, updateJudicialDistrict } from './actions';
import type { JudicialDistrict, PlatformSettings, JudicialDistrictFormData, Court, StateInfo } from '@/types';
import { PlusCircle, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getCourts } from '../courts/actions';
import { getStates } from '../states/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import JudicialDistrictForm from './judicial-district-form';

export default function AdminJudicialDistrictsPage() {
  const [districts, setDistricts] = useState<JudicialDistrict[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<JudicialDistrict | null>(null);

  // Dependencies for the form
  const [dependencies, setDependencies] = useState<{ courts: Court[], states: StateInfo[] } | null>(null);


  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings, courts, states] = await Promise.all([
        getJudicialDistricts(),
        getPlatformSettings(),
        getCourts(),
        getStates(),
      ]);
      setDistricts(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ courts, states });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar comarcas.";
      console.error("Error fetching judicial districts:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);
  
  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const handleNewClick = () => {
    setEditingDistrict(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (district: JudicialDistrict) => {
    setEditingDistrict(district);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
      setIsFormOpen(false);
      setEditingDistrict(null);
      onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteJudicialDistrict(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: JudicialDistrict[]) => {
    if (selectedItems.length === 0) return;
    for (const item of selectedItems) {
      await deleteJudicialDistrict(item.id);
    }
    toast({ title: "Exclusão em Massa Concluída", description: `${selectedItems.length} comarca(s) excluída(s) com sucesso.` });
    onUpdate();
  }, [onUpdate, toast]);

  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);

  const formAction = async (data: JudicialDistrictFormData) => {
    if (editingDistrict) {
      return updateJudicialDistrict(editingDistrict.id, data);
    }
    return createJudicialDistrict(data);
  };

  if (isLoading || !platformSettings || !dependencies) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                    <Skeleton className="h-10 w-36"/>
                </CardHeader>
                <CardContent><Skeleton className="h-96 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
    <div className="space-y-6" data-ai-id="admin-judicial-districts-page-container">
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
          <Button onClick={handleNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Comarca
          </Button>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
                items={districts}
                dataTableColumns={columns}
                onSortChange={() => {}}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="comarcas"
                searchColumnId="name"
                searchPlaceholder="Buscar por nome da comarca..."
                onDeleteSelected={handleDeleteSelected as any}
                sortOptions={[{ value: 'name', label: 'Nome' }]}
            />
        </CardContent>
      </Card>
    </div>
     <CrudFormContainer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={platformSettings?.crudFormMode || 'modal'}
        title={editingDistrict ? 'Editar Comarca' : 'Nova Comarca'}
        description={editingDistrict ? 'Modifique os detalhes da comarca.' : 'Cadastre uma nova comarca judicial.'}
    >
        <JudicialDistrictForm
            initialData={editingDistrict}
            courts={dependencies.courts}
            states={dependencies.states}
            onSubmitAction={formAction}
            onSuccess={handleFormSuccess}
        />
    </CrudFormContainer>
    </>
  );
}