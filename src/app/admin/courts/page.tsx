// src/app/admin/courts/page.tsx
import { PlusCircle, Scale } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getCourts, deleteCourt } from './actions';
import { createColumns } from './columns';
import type { Court } from '@/types';

export default function AdminCourtsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Scale className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Tribunais de Justiça
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova os tribunais de justiça.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/courts/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Tribunal
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<Court>
            columns={createColumns()}
            fetchAction={getCourts}
            deleteAction={deleteCourt}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
