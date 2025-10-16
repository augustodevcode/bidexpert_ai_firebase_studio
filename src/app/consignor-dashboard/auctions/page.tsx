// src/app/consignor-dashboard/auctions/page.tsx
/**
 * @fileoverview Página "Meus Leilões" dentro do Painel do Comitente.
 * Este componente de cliente é responsável por buscar e exibir uma lista
 * dos leilões associados ao comitente logado. Permite que o vendedor
 * acompanhe o status e performance de seus próprios leilões. Para administradores,
 * inclui um seletor para visualizar os leilões de qualquer comitente.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctionsForConsignorAction } from './actions';
import type { Auction, SellerProfileInfo, PlatformSettings } from '@/types';
import { PlusCircle, Briefcase, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createConsignorAuctionColumns } from './columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { hasPermission } from '@/lib/permissions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConsignorAuctionsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

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

  const fetchAuctions = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const [fetchedAuctions, settings] = await Promise.all([
            getAuctionsForConsignorAction(sellerId),
            getPlatformSettings(),
        ]);
      setAuctions(fetchedAuctions);
      setPlatformSettings(settings as PlatformSettings);
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
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!authLoading && targetSellerId) {
      fetchAuctions(targetSellerId);
    } else if (!authLoading && !isUserAdmin) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    } else if (!authLoading && isUserAdmin && allSellers.length === 0) {
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchAuctions, isUserAdmin, selectedSellerId, allSellers.length]);
  
  const columns = useMemo(() => createConsignorAuctionColumns(), []);
  
  const statusOptions = useMemo(() => 
    [...new Set(auctions.map(a => a.status))]
      .map(status => ({ value: status!, label: getAuctionStatusText(status) })),
  [auctions]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: statusOptions },
  ], [statusOptions]);

  if (isLoading || authLoading || !platformSettings) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                    <Skeleton className="h-10 w-36"/>
                </CardHeader>
                <CardContent><Skeleton className="h-96 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="consignor-auctions-page-container">
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
           <BidExpertSearchResultsFrame
                items={auctions}
                totalItemsCount={auctions.length}
                dataTableColumns={columns}
                onSortChange={() => {}}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="leilões"
                searchColumnId="title"
                searchPlaceholder="Buscar por título..."
                facetedFilterColumns={facetedFilterColumns}
                sortOptions={[{ value: 'auctionDate', label: 'Data do Leilão' }]}
            />
        </CardContent>
      </Card>
    </div>
  );
}
