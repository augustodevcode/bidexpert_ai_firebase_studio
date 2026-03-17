// src/app/admin/vehicle-makes/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleMakes, deleteVehicleMake, createVehicleMake, updateVehicleMake } from './actions';
import type { VehicleMake, PlatformSettings } from '@/types';
import { type VehicleMakeFormData } from './form-schema';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import VehicleMakeForm from './vehicle-make-form';

type ModalState = {
  mode: 'closed' | 'create' | 'edit';
  data?: VehicleMake;
};

export default function AdminVehicleMakesPage() {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings] = await Promise.all([
        getVehicleMakes(),
        getPlatformSettings(),
      ]);
      setMakes(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar marcas.";
      console.error("Error fetching vehicle makes:", e);
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
    const result = await deleteVehicleMake(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: VehicleMake[]) => {
    for (const item of selectedItems) {
      await deleteVehicleMake(item.id);
    }
    toast({ title: "Sucesso!", description: `${selectedItems.length} marca(s) excluída(s).` });
    setRefetchTrigger(c => c + 1);
  }, [toast]);

  const handleEdit = useCallback((make: VehicleMake) => {
    setModalState({ mode: 'edit', data: make });
  }, []);

  const handleCreateNew = () => {
    setModalState({ mode: 'create' });
  };

  const formAction = async (data: VehicleMakeFormData) => {
    if (modalState.mode === 'edit' && modalState.data) {
      return updateVehicleMake(modalState.data.id, data);
    }
    return createVehicleMake(data);
  };

  const handleFormSuccess = () => {
    setModalState({ mode: 'closed' });
    setRefetchTrigger(c => c + 1);
  };

  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEdit }), [handleDelete, handleEdit]);

  if (isLoading || !platformSettings) {
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
      <div className="space-y-6" data-ai-id="admin-vehicle-makes-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Car className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Marcas de Veículos
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova as marcas de veículos.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Marca
            </Button>
          </CardHeader>
          <CardContent>
            <BidExpertSearchResultsFrame
              items={makes}
              totalItemsCount={makes.length}
              dataTableColumns={columns}
              onSortChange={() => {}}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel="marcas"
              searchColumnId="name"
              searchPlaceholder="Buscar por nome da marca..."
              onDeleteSelected={handleDeleteSelected}
              sortOptions={[{ value: 'name', label: 'Nome' }]}
            />
          </CardContent>
        </Card>
      </div>

      <CrudFormContainer
        isOpen={modalState.mode !== 'closed'}
        onClose={() => setModalState({ mode: 'closed' })}
        title={modalState.mode === 'create' ? 'Nova Marca' : 'Editar Marca'}
        description={modalState.mode === 'create' ? 'Preencha os dados da nova marca.' : 'Atualize os dados da marca.'}
        mode={platformSettings?.crudFormMode || 'modal'}
      >
        <VehicleMakeForm
          initialData={modalState.mode === 'edit' ? modalState.data : null}
          onSubmitAction={formAction}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalState({ mode: 'closed' })}
        />
      </CrudFormContainer>
    </>
  );
}
