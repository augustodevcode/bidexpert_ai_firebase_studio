// src/app/consignor-dashboard/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctionsForConsignorAction } from './actions';
import type { Auction } from '@/types';
import { PlusCircle, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createConsignorAuctionColumns } from './columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function ConsignorAuctionsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuctions = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAuctions = await getAuctionsForConsignorAction(sellerId);
      setAuctions(fetchedAuctions);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar seus leilões.";
      console.error("Error fetching consignor's auctions:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const sellerId = userProfileWithPermissions?.sellerProfileId;
    if (!authLoading && sellerId) {
      fetchAuctions(sellerId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchAuctions]);

  const columns = useMemo(() => createConsignorAuctionColumns(), []);
  
  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
  ], [statusOptions]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Briefcase className="h-6 w-6 mr-2 text-primary" />
              Meus Leilões
            </CardTitle>
            <CardDescription>
              Visualize e gerencie os leilões que você criou.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={auctions}
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
