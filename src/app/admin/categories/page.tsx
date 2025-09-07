// src/app/admin/categories/page.tsx
import { PlusCircle, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getLotCategories, deleteLotCategory } from './actions';
import { createColumns } from './columns';
import type { LotCategory } from '@/types';

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <ListChecks className="h-6 w-6 mr-2 text-primary" />
              Categorias de Lotes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova as categorias de lotes da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/categories/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<LotCategory>
            columns={createColumns}
            fetchAction={getLotCategories}
            deleteAction={deleteLotCategory}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
            deleteConfirmation={(item) => !item.hasSubcategories}
            deleteConfirmationMessage={(item) => `Esta categoria possui subcategorias e não pode ser excluída.`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
