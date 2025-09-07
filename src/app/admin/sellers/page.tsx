// src/app/admin/sellers/page.tsx
import { PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getSellers, deleteSeller } from './actions';
import { createColumns } from './columns';
import type { SellerProfileInfo } from '@/types';

export default function AdminSellersPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" />
              Listagem de Comitentes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova comitentes/vendedores da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/sellers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<SellerProfileInfo>
            columns={createColumns}
            fetchAction={getSellers}
            deleteAction={deleteSeller}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
