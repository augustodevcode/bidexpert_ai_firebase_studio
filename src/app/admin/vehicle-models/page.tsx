// src/app/admin/vehicle-models/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleModels, deleteVehicleModel, createVehicleModel, updateVehicleModel } from './actions';
import { getVehicleMakes } from '../vehicle-makes/actions';
import type { VehicleModel, VehicleMake, PlatformSettings } from '@/types';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/ui/CrudFormContainer';
import VehicleModelForm from './vehicle-model-form';

export default function AdminVehicleModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isEditing: boolean;
    data: VehicleModel | null;
  }>({
    isOpen: false,
    isEditing: false,
    data: null,
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, fetchedSettings, fetchedMakes] = await Promise.all([
        getVehicleModels(),
        getPlatformSettings(),
        getVehicleMakes(),
      ]);
      setModels(fetchedItems);
      setPlatformSettings(fetchedSettings as PlatformSettings);
      setMakes(fetchedMakes);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar modelos.";
      console.error("Error fetching vehicle models:", e);
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
    const result = await deleteVehicleModel(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: VehicleModel[]) => {
    for (const item of selectedItems) {
      await deleteVehicleModel(item.id);
    }
    toast({ title: "Sucesso!", description: \\ modelo(s) excluído(s).\` });
    setRefetchTrigger(c => c + 1);
  }, [toast]);

  const handleEdit = useCallback((model: VehicleModel) => {
    setModalState({
      isOpen: true,
      isEditing: true,
      data: model,
    });
  }, []);

  const handleCreate = useCallback(() => {
    setModalState({
      isOpen: true,
      isEditing: false,
      data: null,
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, isEditing: false, data: null });
  }, []);

  const handleSubmitAction = async (data: any) => {
    if (modalState.isEditing && modalState.data) {
      return await updateVehicleModel(modalState.data.id, data);
    } else {
      return await createVehicleModel(data);
    }
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
    <div className="space-y-6" data-ai-id="admin-vehicle-models-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Car className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Modelos de Veículos
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova os modelos de veículos.
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Modelo
          </Button>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
            items={models}
            totalItemsCount={models.length}
            dataTableColumns={columns}
            onSortChange={() => {}}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="modelos"
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do modelo..."
            onDeleteSelected={handleDeleteSelected}
            sortOptions={[{ value: 'name', label: 'Nome' }]}
          />
        </CardContent>
      </Card>

      <CrudFormContainer
        isOpen={modalState.isOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
        title={modalState.isEditing ? 'Editar Modelo' : 'Novo Modelo'}
        description={modalState.isEditing ? 'Atualize os dados do modelo.' : 'Preencha os dados do novo modelo.'}
      >
        <VehicleModelForm
          initialData={modalState.data}
          makes={makes}
          onSubmitAction={handleSubmitAction}
          onSuccess={() => {
            handleCloseModal();
            setRefetchTrigger((c) => c + 1);
          }}
          onCancel={handleCloseModal}
        />
      </CrudFormContainer>
    </div>
  );
}
