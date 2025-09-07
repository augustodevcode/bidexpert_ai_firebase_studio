// src/app/admin/auctioneers/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctioneers, deleteAuctioneer } from './actions';
import type { AuctioneerProfileInfo } from '@bidexpert/core';
import { PlusCircle, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResourceDataTable from '@/components/admin/resource-data-table';
import { createColumns } from './columns';

export default function AdminAuctioneersPage() {
  const [data, setData] = useState<AuctioneerProfileInfo[]>([]);
  const { toast } = useToast();
  
  const fetchAction = useCallback(async () => {
    return getAuctioneers();
  }, []);

  const deleteAction = useCallback(async (id: string) => {
    const result = await deleteAuctioneer(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    return result;
  }, [toast]);

  const columns = useMemo(() => createColumns({ handleDelete: deleteAction }), [deleteAction]);

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
            columns={columns}
            fetchAction={fetchAction}
            deleteAction={deleteAction}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
