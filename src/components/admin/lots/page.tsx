// src/app/admin/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLots, deleteLot } from './actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import type { Lot, Auction } from '@bidexpert/core';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@bidexpert/core';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';


export default function AdminLotsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);

  useEffect(() => {
    getAuctions().then(data => {
      setAuctions(data);
      setIsLoadingAuctions(false);
    });
  }, []);

  const lotStatusOptions = useMemo(() => 
    [...new Set(['EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO', 'RASCUNHO'])]
      .map(status => ({ value: status, label: getAuctionStatusText(status as any) })),
  []);

  const auctionOptions = useMemo(() => 
    auctions.map(auc => ({ value: auc.title, label: auc.title })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: lotStatusOptions },
    { id: 'auctionName', title: 'Leilão', options: auctionOptions },
  ], [lotStatusOptions, auctionOptions]);

  const handleDelete = useCallback(async (id: string) => {
      return deleteLot(id);
  }, []);


  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6" data-ai-id="admin-lots-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Lotes
            </CardTitle>
            <CardDescription>
              Visualize, adicione e edite todos os lotes da plataforma.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/lots/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <ResourceDataTable<Lot>
            columns={columns}
            fetchAction={getLots}
            deleteAction={handleDelete}
            searchColumnId="title"
            searchPlaceholder="Buscar por título do lote..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
