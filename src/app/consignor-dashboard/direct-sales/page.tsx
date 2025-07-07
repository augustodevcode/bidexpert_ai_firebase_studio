// src/app/consignor-dashboard/direct-sales/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDirectSaleOffersForSeller, deleteDirectSaleOffer } from '@/app/admin/direct-sales/actions';
import type { DirectSaleOffer } from '@/types';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from '@/app/admin/direct-sales/columns';
import { useAuth } from '@/contexts/auth-context';

export default function ConsignorDirectSalesPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<DirectSaleOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchOffers = async (sellerId: string) => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedOffers = await getDirectSaleOffersForSeller(sellerId);
        if (isMounted) {
          setOffers(fetchedOffers);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar suas ofertas.";
        console.error("Error fetching consignor's direct sale offers:", e);
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (!authLoading && userProfileWithPermissions?.sellerProfileId) {
      fetchOffers(userProfileWithPermissions.sellerProfileId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado na sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, toast, refetchTrigger]);
  
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
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-primary" />Minhas Vendas Diretas
            </CardTitle>
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
