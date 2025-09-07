// src/app/admin/judicial-branches/page.tsx
import { PlusCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getJudicialBranches, deleteJudicialBranch } from './actions';
import { createColumns } from './columns';
import type { JudicialBranch } from '@/types';

export default function AdminJudicialBranchesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Varas Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova as varas judiciais vinculadas às comarcas.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/judicial-branches/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Vara
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<JudicialBranch>
            columns={createColumns}
            fetchAction={getJudicialBranches}
            deleteAction={deleteJudicialBranch}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome da vara..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
