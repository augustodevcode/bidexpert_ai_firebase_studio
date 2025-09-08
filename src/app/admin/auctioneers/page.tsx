// src/app/admin/auctioneers/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctioneers, deleteAuctioneer } from './actions';
import type { AuctioneerProfileInfo } from '@bidexpert/core';
import { PlusCircle, Landmark } from 'lucide-react';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';

export default function AdminAuctioneersPage() {
  const columns = useMemo(() => createColumns({ handleDelete: deleteAuctioneer }), []);

  return (
    <div className="space-y-6" data-ai-id="admin-auctioneers-page">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Landmark className="h-6 w-6 mr-2 text-primary" />
              Listagem de Leiloeiros
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leiloeiros da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctioneers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<AuctioneerProfileInfo>
            columns={columns}
            fetchAction={getAuctioneers}
            deleteAction={deleteAuctioneer}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
