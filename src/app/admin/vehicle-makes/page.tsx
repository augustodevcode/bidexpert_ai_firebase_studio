// src/app/admin/vehicle-makes/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getVehicleMakes, deleteVehicleMake } from './actions';
import type { VehicleMake } from '@/types';
import { PlusCircle, Car } from 'lucide-react';
import { createColumns } from './columns';
import ResourceDataTable from '@/components/admin/resource-data-table';

export default function AdminVehicleMakesPage() {
  const columns = useMemo(() => createColumns({ handleDelete: deleteVehicleMake }), []);

  return (
    <div className="space-y-6">
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
          <Button asChild>
            <Link href="/admin/vehicle-makes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Marca
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<VehicleMake>
            columns={columns}
            fetchAction={getVehicleMakes}
            deleteAction={deleteVehicleMake}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome da marca..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
