

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, TrendingUp, ListChecks, BarChart3, DollarSign, Edit, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getSellerBySlug, type SellerProfileInfo } from '@/app/admin/sellers/actions'; 
import { getAuctionsBySellerSlug, type Auction } from '@/app/admin/auctions/actions'; 
import type { Lot } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { getAuctionStatusText, slugify } from '@/lib/sample-data-helpers';

// Emails com acesso de admin/analista (idealmente de um local compartilhado)
const ALLOWED_EMAILS_FOR_ADMIN_ACCESS = ['admin@bidexpert.com', 'analyst@bidexpert.com', 'augusto.devcode@gmail.com'];
// Email do comitente de exemplo (para simular o próprio comitente acessando)
const EXAMPLE_CONSIGNOR_EMAIL = 'consignor@bidexpert.com';
// Slug do vendedor associado ao e-mail de exemplo
const EXAMPLE_CONSIGNOR_SELLER_SLUG = 'banco-bradesco-s-a'; 


export default function ConsignorOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileInfo | null>(null);
  const [sellerAuctions, setSellerAuctions] = useState<Auction[]>([]);
  const [upcomingAuctionsWithLots, setUpcomingAuctionsWithLots] = useState<
    { auction: Auction; lots: Lot[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalLotsConsigned = sellerAuctions.reduce((sum, auc) => sum + (auc.totalLots || 0), 0);
  // Para calcular lotes vendidos, precisaríamos do status real dos lotes do DB.
  // Por enquanto, vamos simular ou deixar como placeholder.
  // const soldLotsCount = sellerAuctions.flatMap(auc => auc.lots || []).filter(lot => lot.status === 'VENDIDO').length;
  // const salesRate = totalLotsConsigned > 0 ? (soldLotsCount / totalLotsConsigned) * 100 : 0;
  // const totalValueSold = sellerAuctions.flatMap(auc => auc.lots || []).filter(lot => lot.status === 'VENDIDO').reduce((sum, lot) => sum + lot.price, 0);
  const salesRate = 75.5; // Placeholder
  const totalValueSold = 125850.75; // Placeholder


  useEffect(() => {
    async function fetchConsignorData(targetSellerSlug: string) {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`[ConsignorOverview] Fetching data for slug: ${targetSellerSlug}`);
        const profile = await getSellerBySlug(targetSellerSlug);
        if (!profile) {
          setError(`Perfil de comitente com slug "${targetSellerSlug}" não encontrado.`);
          console.warn(`[ConsignorOverview] Profile not found for slug: ${targetSellerSlug}`);
          setSellerProfile(null);
          setSellerAuctions([]);
          setUpcomingAuctionsWithLots([]);
          setIsLoading(false);
          return;
        }
        setSellerProfile(profile);
        console.log(`[ConsignorOverview] Profile found:`, profile);

        // Usando o nome do perfil para filtrar, já que getAuctionsBySellerSlug pode usar slug(auction.seller)
        const auctions = await getAuctionsBySellerSlug(profile.slug); // Usar profile.slug
        setSellerAuctions(auctions);
        console.log(`[ConsignorOverview] Auctions found for ${profile.name}: ${auctions.length}`);
        
        const upcoming = auctions
          .filter(auc => auc.status === 'EM_BREVE' || auc.status === 'ABERTO' || auc.status === 'ABERTO_PARA_LANCES')
          .sort((a, b) => new Date(a.auctionDate as string).getTime() - new Date(b.auctionDate as string).getTime())
          .map(auc => ({
            auction: auc,
            lots: (auc.lots || []).filter(lot => lot.sellerName === profile.name || (auc.seller && slugify(auc.seller) === profile.slug)) 
          }))
          .filter(item => item.lots.length > 0)
          .slice(0, 3);
        setUpcomingAuctionsWithLots(upcoming);
        console.log(`[ConsignorOverview] Upcoming auctions with lots: ${upcoming.length}`);

      } catch (e: any) {
        console.error("[ConsignorOverview] Error fetching consignor data:", e);
        setError("Erro ao carregar dados do comitente.");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user) {
      const userEmailLower = user.email?.toLowerCase();
      const isAdminOrAnalyst = userEmailLower && ALLOWED_EMAILS_FOR_ADMIN_ACCESS.map(e => e.toLowerCase()).includes(userEmailLower);
      const isTheExampleConsignor = userEmailLower === EXAMPLE_CONSIGNOR_EMAIL.toLowerCase();

      let targetSlugToFetch: string | null = null;

      if (isTheExampleConsignor) {
        targetSlugToFetch = EXAMPLE_CONSIGNOR_SELLER_SLUG;
        console.log("[ConsignorOverview] User is the example consignor.");
      } else if (isAdminOrAnalyst) {
        // Admin/Analyst viewing: for now, they also see the example consignor's data.
        targetSlugToFetch = EXAMPLE_CONSIGNOR_SELLER_SLUG; 
        console.log("[ConsignorOverview] User is Admin/Analyst, showing example consignor data.");
      } else {
          console.warn("[ConsignorOverview] User is neither example consignor nor admin/analyst. No target slug to fetch.");
      }
      
      if (targetSlugToFetch) {
        fetchConsignorData(targetSlugToFetch);
      } else {
        setError("Não foi possível determinar o comitente para exibir.");
        setIsLoading(false);
      }
    } else if (!authLoading && !user) {
      // Handled by layout, but good to be safe
      setIsLoading(false); 
      console.log("[ConsignorOverview] User not authenticated.");
    }

  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dados do comitente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
      </div>
    );
  }
  
  if (!sellerProfile) {
      return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-muted-foreground">Perfil do comitente não carregado ou não encontrado.</h2>
         <p className="text-sm text-muted-foreground">Verifique se o slug '{EXAMPLE_CONSIGNOR_SELLER_SLUG}' existe na base de dados.</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Briefcase className="h-7 w-7 mr-3 text-primary" />
            Painel do Comitente: {sellerProfile.name}
          </CardTitle>
          <CardDescription>
            Acompanhe a performance dos seus lotes e leilões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Lotes Consignados</CardTitle>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalLotsConsigned}</div>
                <p className="text-xs text-muted-foreground mt-1">Lotes ativos e passados.</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Venda</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{salesRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Percentual de lotes vendidos.</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total Arrematado</CardTitle>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">R$ {totalValueSold.toLocaleString('pt-BR')}</div>
                <p className="text-xs text-muted-foreground mt-1">Soma dos valores de venda.</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Próximos Leilões</CardTitle>
                <Eye className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{upcomingAuctionsWithLots.length}</div>
                <p className="text-xs text-primary/80 mt-1">Leilões com seus lotes em breve.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Performance de Vendas (Placeholder)</CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex items-center justify-center bg-muted/50 rounded-md">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <p className="ml-4 text-muted-foreground">Gráficos de Vendas por Período, Categoria e Taxa de Sucesso aparecerão aqui.</p>
            </CardContent>
          </Card>

          {upcomingAuctionsWithLots.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Seus Lotes em Próximos Leilões</h3>
              <div className="space-y-4">
                {upcomingAuctionsWithLots.map(({ auction, lots }) => (
                  <Card key={auction.id} className="shadow-md">
                    <CardHeader className="flex flex-row justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{auction.title}</CardTitle>
                        <CardDescription>
                          Data: {format(new Date(auction.auctionDate as string), "dd/MM/yyyy HH:mm", { locale: ptBR })} | Status: {getAuctionStatusText(auction.status)}
                        </CardDescription>
                      </div>
                       <Button variant="outline" size="sm" asChild>
                        <Link href={`/auctions/${auction.id}`} target="_blank">
                            Ver Leilão <ExternalLink className="ml-2 h-3 w-3"/>
                        </Link>
                       </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-2">Seus Lotes neste Leilão ({lots.length}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {lots.map(lot => (
                          <Link key={lot.id} href={`/auctions/${lot.auctionId}/lots/${lot.id}`} target="_blank">
                            <Card className="hover:shadow-lg transition-shadow">
                              <div className="relative aspect-video bg-muted rounded-t-md overflow-hidden">
                                <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem lote consignado'} />
                              </div>
                              <div className="p-3">
                                <p className="text-xs font-semibold truncate">{lot.title}</p>
                                <p className="text-xs text-muted-foreground">Lance Inicial: R$ {(lot.initialPrice || lot.price).toLocaleString('pt-BR')}</p>
                              </div>
                            </Card>
                          </Link>
                        ))}
                      </div>
                       {lots.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lote seu encontrado neste leilão específico (verifique os dados de exemplo ou filtros internos).</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
           {upcomingAuctionsWithLots.length === 0 && !isLoading && (
             <p className="text-muted-foreground text-center mt-6">Nenhum leilão futuro com seus lotes encontrado.</p>
           )}
        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button variant="ghost" asChild>
                <Link href="/consignor-dashboard/lots"><ListChecks className="mr-2 h-4"/>Ver Todos os Meus Lotes</Link>
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
