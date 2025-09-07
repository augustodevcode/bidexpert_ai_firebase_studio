// src/app/admin/judicial-districts/page.tsx
import { PlusCircle, Map } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getJudicialDistricts, deleteJudicialDistrict } from './actions';
import { createColumns } from './columns';
import type { JudicialDistrict } from '@/types';

export default function AdminJudicialDistrictsPage() {
  return (
    <div className="space-y-6">
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
          <Button asChild>
            <Link href="/admin/judicial-districts/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Comarca
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<JudicialDistrict>
            columns={createColumns}
            fetchAction={getJudicialDistricts}
            deleteAction={deleteJudicialDistrict}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome da comarca..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
