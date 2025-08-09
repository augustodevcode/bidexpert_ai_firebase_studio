// src/app/admin/vehicle-models/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleModels, deleteVehicleModel } from './actions';
import type { VehicleModel } from '@/types';
import { PlusCircle, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminVehicleModelsPage() {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedItems = await getVehicleModels();
      setModels(fetchedItems);
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
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6">
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
           <DataTable
            columns={columns}
            data={models}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do modelo..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
