// src/app/admin/direct-sales/page.tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDirectSaleOffers, deleteDirectSaleOffer } from './actions';
import type { DirectSaleOffer } from '@/types';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import ResourceDataTable from '@/components/admin/resource-data-table';

export default function AdminDirectSalesPage() {
  const columns = useMemo(() => createColumns({ handleDelete: deleteDirectSaleOffer }), []);

  const statusOptions = useMemo(() => 
    [...new Set(['ACTIVE', 'SOLD', 'EXPIRED', 'PENDING_APPROVAL', 'RASCUNHO'])]
      .map(status => ({ value: status, label: getAuctionStatusText(status as any) })),
  []);

  const offerTypeOptions = useMemo(() => [
    { value: 'BUY_NOW', label: 'Compra Imediata'},
    { value: 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas'}
  ], []);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'offerType', title: 'Tipo de Oferta', options: offerTypeOptions },
  ], [statusOptions, offerTypeOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center"><ShoppingCart className="h-6 w-6 mr-2 text-primary" />Gerenciar Venda Direta</CardTitle>
            <CardDescription>Adicione, edite ou remova ofertas de venda direta.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/direct-sales/new"><PlusCircle className="mr-2 h-4 w-4" /> Nova Oferta</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ResourceDataTable<DirectSaleOffer>
            columns={columns}
            fetchAction={getDirectSaleOffers}
            deleteAction={deleteDirectSaleOffer}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
