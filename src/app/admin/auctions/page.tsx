
// src/app/admin/auctions/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions, deleteAuction } from './actions';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { getSellers } from '../sellers/actions';
import { getAuctioneers } from '../auctioneers/actions';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [allAuctioneers, setAllAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchAuctions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedAuctions, fetchedSellers, fetchedAuctioneers] = await Promise.all([
            getAuctions(),
            getSellers(),
            getAuctioneers()
        ]);
        if (!isCancelled) {
          setAuctions(fetchedAuctions);
          setAllSellers(fetchedSellers);
          setAllAuctioneers(fetchedAuctioneers);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar dados.";
        console.error("Error fetching auctions data:", e);
        if (!isCancelled) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    fetchAuctions();

    return () => {
      isCancelled = true;
    };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteAuction(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: 'Erro ao Excluir', description: result.message, variant: 'destructive' });
      }
    },
    [toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [auctions]);

  const sellerOptions = useMemo(() => 
    allSellers.map(s => ({ value: s.name, label: s.name })),
  [allSellers]);
  
  const auctioneerOptions = useMemo(() => 
    allAuctioneers.map(a => ({ value: a.name, label: a.name })),
  [allAuctioneers]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Leilões
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leilões da plataforma.
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
            isLoading={isLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título..."
            facetedFilterColumns={[
              { id: 'status', title: 'Status', options: statusOptions },
              { id: 'seller', title: 'Comitente', options: sellerOptions },
              { id: 'auctioneer', title: 'Leiloeiro', options: auctioneerOptions }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
