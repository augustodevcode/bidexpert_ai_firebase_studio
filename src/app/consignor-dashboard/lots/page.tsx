
// src/app/consignor-dashboard/lots/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLotsForConsignorAction } from './actions';
import type { Auction, SellerProfileInfo } from '@bidexpert/core';
import { PlusCircle, ListChecks, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createConsignorLotColumns } from './columns';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText } from '@bidexpert/core';
import { getAuctionsForConsignorAction } from '../auctions/actions';
import { hasPermission } from '@/lib/permissions';
import { getSellers } from '@/app/admin/sellers/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Lot } from '@bidexpert/core';

export default function ConsignorLotsPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
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
  
  const fetchConsignorData = useCallback(async (sellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedLots, fetchedAuctions] = await Promise.all([
        getLotsForConsignorAction(sellerId),
        getAuctionsForConsignorAction(sellerId),
      ]);
      setLots(fetchedLots);
      setAuctions(fetchedAuctions);
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
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;
    if (!authLoading && targetSellerId) {
      fetchConsignorData(targetSellerId);
    } else if (!authLoading && !isUserAdmin) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    } else if (!authLoading && isUserAdmin && allSellers.length === 0) {
        setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchConsignorData, isUserAdmin, selectedSellerId, allSellers.length]);
  
  const columns = useMemo(() => createConsignorLotColumns(), []);

  const statusOptions = useMemo(() => 
    [...new Set(lots.map(lot => lot.status))]
      .map(status => ({ value: status, label: getAuctionStatusText(status) })),
  [lots]);
  
  const auctionOptions = useMemo(() =>
    auctions.map(auc => ({ value: auc.title, label: auc.title })),
  [auctions]);

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
            data={lots}
            isLoading={isLoading || authLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título do lote..."
            facetedFilterColumns={facetedFilterColumns}
          />
        </CardContent>
      </Card>
    