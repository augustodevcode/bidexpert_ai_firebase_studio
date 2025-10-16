// src/app/admin/vehicle-models/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleModels, deleteVehicleModel } from './actions';
import type { VehicleModel, PlatformSettings } from '@/types';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminVehicleModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings] = await Promise.all([
        getVehicleModels(),
        getPlatformSettings(),
      ]);
      setModels(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
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
    toast({ title: "Sucesso!", description: `${selectedItems.length} modelo(s) excluído(s).` });
    setRefetchTrigger(c => c + 1);
  }, [toast]);

  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

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
          <Button asChild>
            <Link href="/admin/vehicle-models/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Modelo
            </Link>
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
    </div>
  );
}
