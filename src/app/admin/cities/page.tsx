// src/app/admin/cities/page.tsx
import { PlusCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getCities, deleteCity } from './actions';
import { getStates } from '@/app/admin/states/actions';
import { createColumns } from './columns';
import type { CityInfo } from '@/types';

export default async function AdminCitiesPage() {
  // Fetching states here to build the filter options, as it's a specific requirement for this page.
  const states = await getStates();
  const stateOptions = states.map(s => ({ value: s.uf, label: s.name }));

  const facetedFilterColumns = [
    { id: 'stateUf', title: 'UF', options: stateOptions },
  ];

  return (
    <div className="space-y-6">
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
          <Button asChild>
            <Link href="/admin/cities/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Cidade
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<CityInfo>
            columns={createColumns}
            fetchAction={getCities}
            deleteAction={deleteCity}
            searchColumnId="name"
            searchPlaceholder="Buscar por cidade..."
            facetedFilterColumns={facetedFilterColumns}
            deleteConfirmation={(item) => (item.lotCount || 0) === 0}
            deleteConfirmationMessage={(item) => `Esta cidade possui ${item.lotCount} lote(s) e não pode ser excluída.`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
