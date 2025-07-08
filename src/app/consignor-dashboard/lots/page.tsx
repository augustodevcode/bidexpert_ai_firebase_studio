
// src/app/consignor-dashboard/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLotsForConsignorAction } from './actions';
import type { Lot } from '@/types';
import { PlusCircle, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createConsignorLotColumns } from './columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function ConsignorLotsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLots = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLots = await getLotsForConsignorAction(sellerId);
      setLots(fetchedLots);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar seus lotes.";
      console.error("Error fetching consignor's lots:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const sellerId = userProfileWithPermissions?.sellerProfileId;
    if (!authLoading && sellerId) {
      fetchLots(sellerId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchLots]);

  const columns = useMemo(() => createConsignorLotColumns(), []);

  const statusOptions = useMemo(() => 
    [...new Set(lots.map(lot => lot.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [lots]);
  
  const auctionOptions = useMemo(() =>
    [...new Set(lots.map(lot => lot.auctionName).filter(Boolean))]
        .map(name => ({ value: name!, label: name! })),
  [lots]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
    { id: 'auctionName', title: 'Leilão', options: auctionOptions },
  ], [statusOptions, auctionOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <ListChecks className="h-6 w-6 mr-2 text-primary" />
              Meus Lotes
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os lotes que você cadastrou para leilão.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/lots/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={lots}
            isLoading={isLoading || authLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título do lote..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
