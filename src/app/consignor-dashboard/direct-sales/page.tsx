// src/app/consignor-dashboard/direct-sales/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDirectSaleOffers, deleteDirectSaleOffer } from '@/app/admin/direct-sales/actions';
import type { DirectSaleOffer } from '@/types';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/app/admin/direct-sales/columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

/**
 * ConsignorDirectSalesPage displays a list of direct sale offers belonging to the currently
 * logged-in consignor. It fetches data and allows for management of these offers.
 */
export default function ConsignorDirectSalesPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<DirectSaleOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  /**
   * Fetches the direct sale offers for a given seller ID.
   * @param {string} sellerId The ID of the seller/consignor.
   */
  const fetchOffers = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const allOffers = await getDirectSaleOffers();
      const consignorOffers = allOffers.filter(o => o.sellerId === sellerId);
      setOffers(consignorOffers);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar suas ofertas.";
      console.error("Error fetching consignor's direct sale offers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Effect to trigger data fetching when the user profile is available.
  useEffect(() => {
    const sellerId = userProfileWithPermissions?.sellerId;
    if (!authLoading && sellerId) {
      fetchOffers(sellerId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado na sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, toast, refetchTrigger, fetchOffers]);
  
  /**
   * Handles the deletion of a direct sale offer and triggers a data refetch.
   * @param {string} id The ID of the offer to delete.
   */
  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteDirectSaleOffer(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast]
  );
  
  // Memoize columns and filter options for performance.
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(offers.map(o => o.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [offers]);

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
            <CardTitle className="text-2xl font-bold font-headline flex items-center"><ShoppingCart className="h-6 w-6 mr-2 text-primary" />Minhas Vendas Diretas</CardTitle>
            <CardDescription>Gerencie suas ofertas de venda com preço fixo ou proposta.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/consignor-dashboard/direct-sales/new"><PlusCircle className="mr-2 h-4 w-4" /> Nova Oferta</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={offers}
            isLoading={isLoading || authLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
