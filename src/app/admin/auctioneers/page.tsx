// src/app/admin/auctioneers/page.tsx
import { PlusCircle, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { getAuctioneers, deleteAuctioneer } from './actions';
import { createColumns } from './columns';
import type { AuctioneerProfileInfo } from '@/types';

export default function AdminAuctioneersPage() {
  return (
    <div className="space-y-6">
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
            columns={createColumns}
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
