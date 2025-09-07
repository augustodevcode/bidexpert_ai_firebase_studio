// src/app/admin/states/page.tsx
import { PlusCircle, Map } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getStates, deleteState } from './actions';
import { createColumns } from './columns';
import type { StateInfo } from '@/types';

export default function AdminStatesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Map className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Estados
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova estados da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/states/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Estado
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<StateInfo>
              columns={createColumns}
              fetchAction={getStates}
              deleteAction={deleteState}
              searchColumnId="name"
              searchPlaceholder="Buscar por nome ou UF..."
              deleteConfirmation={(item) => (item.cityCount || 0) === 0}
              deleteConfirmationMessage={(item) => `Este estado possui ${item.cityCount} cidade(s) e não pode ser excluído.`}
           />
        </CardContent>
      </Card>
    </div>
  );
}
