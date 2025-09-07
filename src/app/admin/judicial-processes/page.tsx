// src/app/admin/judicial-processes/page.tsx
import { PlusCircle, Gavel } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getJudicialProcesses, deleteJudicialProcess } from './actions';
import { createColumns } from './columns';
import type { JudicialProcess } from '@/types';

export default function AdminJudicialProcessesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Processos Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova os processos judiciais.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/judicial-processes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Processo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<JudicialProcess>
            columns={createColumns}
            fetchAction={getJudicialProcesses}
            deleteAction={deleteJudicialProcess}
            searchColumnId="processNumber"
            searchPlaceholder="Buscar por nº do processo..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
