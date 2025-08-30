// src/app/consignor-dashboard/direct-sales/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDirectSaleOffers, deleteDirectSaleOffer } from '@/app/admin/direct-sales/actions';
import type { DirectSaleOffer, SellerProfileInfo } from '@/types';
import { PlusCircle, ShoppingCart, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/app/admin/direct-sales/columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { hasPermission } from '@/lib/permissions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConsignorDirectSalesPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<DirectSaleOffer[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  useEffect(() => {
    if (isUserAdmin) {
      getSellers().then(sellers => {
        setAllSellers(sellers);
        if (!selectedSellerId && sellers.length > 0) {
          setSelectedSellerId(sellers[0].id);
        }
      });
    }
  }, [isUserAdmin, selectedSellerId]);
  
  const fetchOffers = useCallback(async () => {
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!targetSellerId) {
        setOffers([]);
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const allOffers = await getDirectSaleOffers();
      const consignorOffers = allOffers.filter(o => o.sellerId === targetSellerId);
      setOffers(consignorOffers);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar suas ofertas.";
      console.error("Error fetching consignor's direct sale offers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isUserAdmin, selectedSellerId, userProfileWithPermissions?.sellerId]);

  useEffect(() => {
    if (!authLoading) {
      fetchOffers();
    }
  }, [authLoading, fetchOffers, refetchTrigger]);
  
  const handleDelete = useCallback(async (id: string) => {
      const result = await deleteDirectSaleOffer(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },[toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(offers.map(o => o.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [offers]);

  const offerTypeOptions = useMemo(() => [
    { value: 'BUY_NOW', label: 'Compra Imediata'},
    { value: 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas'}
  ], []);

  const sellerOptions = useMemo(() =>
    [...new Set(offers.map(o => o.sellerName))]
        .map(seller => ({ value: seller, label: seller })),
  [offers]);

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
          {isUserAdmin && (
             <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground">Visualizando como:</label>
               <Select value={selectedSellerId || ''} onValueChange={setSelectedSellerId}>
                  <SelectTrigger className="w-full md:w-[300px] mt-1">
                      <SelectValue placeholder="Selecione um comitente..." />
                  </SelectTrigger>
                  <SelectContent>
                      {allSellers.map(seller => (
                          <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          )}
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
