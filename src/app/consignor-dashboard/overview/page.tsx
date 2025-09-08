// src/app/consignor-dashboard/overview/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, TrendingUp, ListChecks, BarChart3, DollarSign, Edit, Eye, ExternalLink, PlusCircle, ShoppingCart, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { obterComitentePorSlug, obterComitentes } from '@/app/admin/sellers/actions'; 
import { obterLeiloesPorComitenteSlug } from '@/app/admin/auctions/actions'; 
import { getConsignorDashboardStatsAction } from '../reports/actions';
import type { Auction, Lot, SellerProfileInfo, ConsignorDashboardStats } from '@bidexpert/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@bidexpert/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hasPermission } from '@/lib/permissions';

export default function ConsignorOverviewPage() {
  const { userProfileWithPermissions, loading: authLoading } = useAuth();
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [sellerAuctions, setSellerAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<ConsignorDashboardStats | null>(null);
  const [upcomingAuctionsWithLots, setUpcomingAuctionsWithLots] = useState<{ auction: Auction; lots: Lot[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUserAdmin = hasPermission(userProfileWithPermissions, 'manage_all');

  // Fetch all sellers if the user is an admin
  useEffect(() => {
    if (isUserAdmin) {
      obterComitentes().then(sellers => {
        setAllSellers(sellers);
        if (!selectedSellerId && sellers.length > 0) {
          setSelectedSellerId(sellers[0].id);
        }
      });
    }
  }, [isUserAdmin, selectedSellerId]);

  const fetchConsignorData = useCallback(async (targetSellerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [profile, auctions, dashboardStats] = await Promise.all([
        obterComitentePorSlug(targetSellerId),
        obterLeiloesPorComitenteSlug(targetSellerId),
        getConsignorDashboardStatsAction(targetSellerId),
      ]);
      
      if (!profile) {
        throw new Error(`Perfil de comitente com ID "${targetSellerId}" não encontrado.`);
      }

      setSellerProfile(profile);
      setSellerAuctions(auctions);
      setStats(dashboardStats);
      
      const upcoming = auctions
        .filter(auc => auc.status === 'EM_BREVE' || auc.status === 'ABERTO_PARA_LANCES' || auc.status === 'ABERTO')
        .sort((a, b) => new Date(a.auctionDate as string).getTime() - new Date(b.auctionDate as string).getTime())
        .map(auc => ({ auction: auc, lots: (auc.lots || []).filter(lot => lot.sellerId === profile.id || lot.sellerName === profile.name) }))
        .filter(item => item.lots.length > 0)
        .slice(0, 3);
      setUpcomingAuctionsWithLots(upcoming);

    } catch (e: any) {
      console.error("[ConsignorOverview] Error fetching consignor data:", e);
      setError(e.message || "Erro ao carregar dados do comitente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const targetSellerId = isUserAdmin ? selectedSellerId : userProfileWithPermissions?.sellerId;

    if (!authLoading && targetSellerId) {
      fetchConsignorData(targetSellerId);
    } else if (!authLoading) {
      setError("Perfil de comitente não encontrado ou não vinculado à sua conta.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchConsignorData, isUserAdmin, selectedSellerId]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const SellerSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Users /> Selecionar Comitente</CardTitle>
        <CardDescription>Como administrador, você pode visualizar o painel de qualquer comitente.</CardDescription>
      </CardHeader>
      <CardContent>
          <Select value={selectedSellerId || ''} onValueChange={setSelectedSellerId}>
              <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Selecione um comitente..." />
              </SelectTrigger>
              <SelectContent>
                  {allSellers.map(seller => (
                      <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {isUserAdmin && <SellerSelector />}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Carregando dados do comitente...</p></div>
      ) : error || !sellerProfile ? (
        <div className="text-center py-12"><h2 className="text-xl font-semibold text-destructive">{error || "Perfil do comitente não carregado."}</h2></div>
      ) : (
        <>
          <Card className="shadow-lg">
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                  <Briefcase className="h-7 w-7 mr-3 text-primary" />
                  Painel do Comitente: {sellerProfile.name}
                </CardTitle>
                <CardDescription>
                  Acompanhe a performance dos seus lotes e leilões.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/admin/auctions/new"><PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão</Link>
                </Button>
                 <Button asChild>
                  <Link href="/consignor-dashboard/direct-sales/new"><ShoppingCart className="mr-2 h-4 w-4" /> Nova Venda Direta</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Lotes Consignados</CardTitle><ListChecks className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{stats?.totalLotsConsigned || 0}</div><p className="text-xs text-muted-foreground mt-1">Lotes ativos e passados.</p></CardContent></Card>
                <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Venda</CardTitle><TrendingUp className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{(stats?.salesRate || 0).toFixed(1)}%</div><p className="text-xs text-muted-foreground mt-1">Percentual de lotes vendidos.</p></CardContent></Card>
                <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle><DollarSign className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">R$ {(stats?.totalSalesValue || 0).toLocaleString('pt-BR')}</div><p className="text-xs text-muted-foreground mt-1">Soma dos valores de venda.</p></CardContent></Card>
                <Card className="bg-primary/10 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-primary">Próximos Leilões</CardTitle><Eye className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{upcomingAuctionsWithLots.length}</div><p className="text-xs text-primary/80 mt-1">Leilões com seus lotes em breve.</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-xl font-semibold">Performance de Vendas (Últimos Meses)</CardTitle></CardHeader>
                <CardContent className="h-72">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.salesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}/>
                        <Legend />
                        <Line type="monotone" dataKey="Faturamento" name="Vendas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                </CardContent>
              </Card>
            </CardContent>
             <CardFooter className="border-t pt-4">
                <Button variant="ghost" asChild><Link href="/consignor-dashboard/lots"><ListChecks className="mr-2 h-4"/>Ver Todos os Meus Lotes</Link></Button>
             </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
