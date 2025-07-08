// src/app/consignor-dashboard/overview/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, TrendingUp, ListChecks, BarChart3, DollarSign, Edit, Eye, ExternalLink, PlusCircle, ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSellerBySlug } from '@/app/admin/sellers/actions'; 
import { getAuctionsBySellerSlug } from '@/app/admin/auctions/actions'; 
import type { Auction, Lot, SellerProfileInfo } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export default function ConsignorOverviewPage() {
  const { user, userProfileWithPermissions, loading: authLoading } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [sellerAuctions, setSellerAuctions] = useState<Auction[]>([]);
  const [upcomingAuctionsWithLots, setUpcomingAuctionsWithLots] = useState<{ auction: Auction; lots: Lot[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsignorData = useCallback(async (targetSellerIdOrSlug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [profile, auctions] = await Promise.all([
        getSellerBySlug(targetSellerIdOrSlug),
        getAuctionsBySellerSlug(targetSellerIdOrSlug)
      ]);
      
      if (!profile) {
        setError(`Perfil de comitente com ID/slug "${targetSellerIdOrSlug}" não encontrado.`);
        setIsLoading(false);
        return;
      }

      setSellerProfile(profile);
      setSellerAuctions(auctions);
      
      const upcoming = auctions
        .filter(auc => auc.status === 'EM_BREVE' || auc.status === 'ABERTO_PARA_LANCES' || auc.status === 'ABERTO')
        .sort((a, b) => new Date(a.auctionDate as string).getTime() - new Date(b.auctionDate as string).getTime())
        .map(auc => ({ auction: auc, lots: (auc.lots || []).filter(lot => lot.sellerId === profile.id || lot.sellerName === profile.name) }))
        .filter(item => item.lots.length > 0)
        .slice(0, 3);
      setUpcomingAuctionsWithLots(upcoming);

    } catch (e: any) {
      console.error("[ConsignorOverview] Error fetching consignor data:", e);
      setError("Erro ao carregar dados do comitente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && userProfileWithPermissions?.sellerProfileId) {
      fetchConsignorData(userProfileWithPermissions.sellerProfileId);
    } else if (!authLoading) {
      setError("Seu perfil de usuário não está vinculado a um perfil de comitente.");
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, authLoading, fetchConsignorData]);
  
  const totalLotsConsigned = sellerAuctions.reduce((sum, auc) => sum + (auc.totalLots || 0), 0);
  const totalValueSold = sellerAuctions.reduce((sum, auc) => sum + (auc.achievedRevenue || 0), 0);
  
  const soldLotsCount = useMemo(() => {
    return sellerAuctions.flatMap(auc => auc.lots || []).filter(lot => lot.status === 'VENDIDO').length;
  }, [sellerAuctions]);

  const salesRate = useMemo(() => {
    const totalFinishedLots = sellerAuctions.flatMap(auc => auc.lots || []).filter(lot => ['VENDIDO', 'NAO_VENDIDO'].includes(lot.status)).length;
    return totalFinishedLots > 0 ? (soldLotsCount / totalFinishedLots) * 100 : 0;
  }, [soldLotsCount, sellerAuctions]);


  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dados do comitente...</p>
      </div>
    );
  }

  if (error || !sellerProfile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error || "Perfil do comitente não carregado."}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Lotes Consignados</CardTitle><ListChecks className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{totalLotsConsigned}</div><p className="text-xs text-muted-foreground mt-1">Lotes ativos e passados.</p></CardContent></Card>
            <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Venda</CardTitle><TrendingUp className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{salesRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground mt-1">Percentual de lotes vendidos.</p></CardContent></Card>
            <Card className="bg-secondary/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valor Total Arrematado</CardTitle><DollarSign className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">R$ {totalValueSold.toLocaleString('pt-BR')}</div><p className="text-xs text-muted-foreground mt-1">Soma dos valores de venda.</p></CardContent></Card>
            <Card className="bg-primary/10 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-primary">Próximos Leilões</CardTitle><Eye className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{upcomingAuctionsWithLots.length}</div><p className="text-xs text-primary/80 mt-1">Leilões com seus lotes em breve.</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-xl font-semibold">Performance de Vendas (Placeholder)</CardTitle></CardHeader>
            <CardContent className="h-72 flex items-center justify-center bg-muted/50 rounded-md"><BarChart3 className="h-16 w-16 text-muted-foreground" /><p className="ml-4 text-muted-foreground">Gráficos de Vendas por Período e Categoria aparecerão aqui.</p></CardContent>
          </Card>
          {upcomingAuctionsWithLots.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Seus Lotes em Próximos Leilões</h3>
              <div className="space-y-4">
                {upcomingAuctionsWithLots.map(({ auction, lots }) => (
                  <Card key={auction.id} className="shadow-md"><CardHeader className="flex flex-row justify-between items-start"><di v><CardTitle className="text-lg">{auction.title}</CardTitle><CardDescription>Data: {format(new Date(auction.auctionDate as string), "dd/MM/yyyy HH:mm", { locale: ptBR })} | Status: {getAuctionStatusText(auction.status)}</CardDescription></div><Button variant="outline" size="sm" asChild><Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">Ver Leilão <ExternalLink className="ml-2 h-3 w-3"/></Link></Button></CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-2">Seus Lotes neste Leilão ({lots.length}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {lots.map(lot => (
                          <Link key={lot.id} href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank"><Card className="hover:shadow-lg transition-shadow"><div className="relative aspect-video bg-muted rounded-t-md overflow-hidden"><Image src={lot.imageUrl || 'https://placehold.co/400x300.png'} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem lote consignado'} /></div><div className="p-3"><p className="text-xs font-semibold truncate">{lot.title}</p><p className="text-xs text-muted-foreground">Lance Inicial: R$ {(lot.initialPrice || lot.price).toLocaleString('pt-br')}</p></div></Card></Link>
                        ))}
                      </div>
                       {lots.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lote seu encontrado neste leilão específico (verifique os dados de exemplo ou filtros internos).</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
           {upcomingAuctionsWithLots.length === 0 && !isLoading && (<p className="text-muted-foreground text-center mt-6">Nenhum leilão futuro com seus lotes encontrado.</p>)}
        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button variant="ghost" asChild><Link href="/consignor-dashboard/lots"><ListChecks className="mr-2 h-4"/>Ver Todos os Meus Lotes</Link></Button>
         </CardFooter>
      </Card>
    </div>
  );
}
