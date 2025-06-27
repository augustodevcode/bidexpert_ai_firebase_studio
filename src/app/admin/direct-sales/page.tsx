// src/app/admin/direct-sales/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDirectSaleOffers, deleteDirectSaleOffer } from './actions';
import type { DirectSaleOffer } from '@/types';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function AdminDirectSalesPage() {
  const [offers, setOffers] = useState<DirectSaleOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOffers = await getDirectSaleOffers();
      setOffers(fetchedOffers);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar ofertas.";
      console.error("Error fetching direct sale offers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);
  
  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteDirectSaleOffer(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        fetchOffers();
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [fetchOffers, toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(offers.map(o => o.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [offers]);

  const offerTypeOptions = useMemo(() => [
    { value: 'BUY_NOW', label: 'Compra Imediata'},
    { value: 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas'}
  ], []);


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
          <DataTable
            columns={columns}
            data={offers}
            isLoading={isLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={[
              { id: 'status', title: 'Status', options: statusOptions },
              { id: 'offerType', title: 'Tipo de Oferta', options: offerTypeOptions }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
