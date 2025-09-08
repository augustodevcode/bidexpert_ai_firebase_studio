// src/app/admin/sellers/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSellers, deleteSeller } from './actions';
import type { SellerProfileInfo } from '@bidexpert/core';
import { PlusCircle, Users } from 'lucide-react';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';

export default function AdminSellersPage() {
  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-6" data-ai-id="admin-sellers-page-container">
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
            columns={columns}
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
