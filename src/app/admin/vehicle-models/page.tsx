// src/app/admin/vehicle-models/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleModels, deleteVehicleModel } from './actions';
import type { VehicleModel } from '@/types';
import { PlusCircle, Car } from 'lucide-react';
import { createColumns } from './columns';
import ResourceDataTable from '@/components/admin/resource-data-table';

export default function AdminVehicleModelsPage() {
  const columns = useMemo(() => createColumns({ handleDelete: deleteVehicleModel }), []);

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
           <ResourceDataTable<VehicleModel>
            columns={columns}
            fetchAction={getVehicleModels}
            deleteAction={deleteVehicleModel}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do modelo..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
