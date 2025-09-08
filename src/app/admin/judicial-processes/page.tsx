// src/app/admin/judicial-processes/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getJudicialProcesses, deleteJudicialProcess } from './actions';
import { createColumns } from './columns';
import type { JudicialProcess } from '@/types';
import { PlusCircle, Gavel, FileUp } from 'lucide-react';

export default function AdminJudicialProcessesPage() {
  const columns = useMemo(() => createColumns({ handleDelete: deleteJudicialProcess }), []);
  
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
          <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href="/admin/import/cnj">
                    <FileUp className="mr-2 h-4 w-4" /> Importar do CNJ
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/judicial-processes/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Processo
                </Link>
              </Button>
          </div>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<JudicialProcess>
            columns={columns}
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
