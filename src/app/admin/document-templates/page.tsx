// src/app/admin/document-templates/page.tsx
import { PlusCircle, Files } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getDocumentTemplates, deleteDocumentTemplate } from './actions';
import { createColumns } from './columns';
import type { DocumentTemplate } from '@/types';

export default function AdminDocumentTemplatesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Files className="h-6 w-6 mr-2 text-primary" />
              Templates de Documentos
            </CardTitle>
            <CardDescription>
              Crie e gerencie templates para autos de arrematação, laudos e outros documentos.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/document-templates/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Template
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<DocumentTemplate>
            columns={createColumns}
            fetchAction={getDocumentTemplates}
            deleteAction={deleteDocumentTemplate}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do template..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
