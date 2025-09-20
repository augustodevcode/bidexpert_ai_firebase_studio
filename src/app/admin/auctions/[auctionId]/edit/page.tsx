// src/app/admin/auctions/[auctionId]/edit/page.tsx
/**
 * @fileoverview Página para edição e visualização de um Leilão específico.
 * Permite alternar entre o modo de visualização (exibindo dashboards de performance)
 * e o modo de edição (usando o AuctionForm). Centraliza o gerenciamento completo de um
 * leilão, incluindo seus lotes e análise de dados.
 */
'use client'; 

import AuctionForm from '../../auction-form';
import { getAuction, updateAuction, deleteAuction, type AuctionFormData } from '../../actions'; 
import { getLots, deleteLot } from '@/app/admin/lots/actions'; 
import type { Auction, Lot, PlatformSettings, LotCategory, AuctioneerProfileInfo, SellerProfileInfo, UserProfileWithPermissions, AuctionDashboardData, UserWin, StateInfo, CityInfo } from '@/types';
import { notFound, useRouter, useParams } from 'next/navigation'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, Info, Settings, BarChart2, FileText, Users, CheckCircle, XCircle, Loader2, ExternalLink, ListChecks, AlertTriangle, Package as PackageIcon, Clock as ClockIcon, LandPlot, ShoppingCart, Layers, Gavel, FileSignature, Lightbulb, TrendingUp, BarChart3 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { Separator } from '@/components/ui/separator';
import React, { useEffect, useCallback, useMemo, useState } from 'react'; 
import { useToast } from '@/hooks/use-toast';
import SearchResultsFrame from '@/components/search-results-frame';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import AISuggestionModal from '@/components/ai/ai-suggestion-modal';
import { fetchListingDetailsSuggestions } from '@/app/auctions/create/actions';
import { getAuctionDashboardDataAction } from '../../analysis/actions';
import { LineChart, BarChart as RechartsBarChart, Bar, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DataTable } from '@/components/ui/data-table';
import { createColumns as createLotColumns } from '@/app/admin/lots/columns';
import FormPageLayout from '@/components/admin/form-page-layout';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-secondary/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


function AuctionDashboardSection({ auctionId }: { auctionId: string }) {
    const [dashboardData, setDashboardData] = useState<AuctionDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const data = await getAuctionDashboardDataAction(auctionId);
                setDashboardData(data);
            } catch (e) {
                console.error("Failed to fetch auction dashboard data:", e);
                setDashboardData(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [auctionId]);

    if (isLoading) {
        return <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>;
    }
    
    if (!dashboardData) {
        return <p>Não foi possível carregar os dados de performance para este leilão.</p>;
    }
    
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Faturamento Bruto" value={dashboardData.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={Gavel} />
                <StatCard title="Taxa de Venda" value={`${dashboardData.salesRate.toFixed(1)}%`} icon={TrendingUp} />
                <StatCard title="Total de Lances" value={dashboardData.totalBids} icon={ListChecks} />
                <StatCard title="Licitantes Únicos" value={dashboardData.uniqueBidders} icon={Users} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Faturamento por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {dashboardData.revenueByCategory && dashboardData.revenueByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                                data={dashboardData.revenueByCategory}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" stroke="#888888" fontSize={10} tickFormatter={(value) => `R$${Number(value)/1000}k`} />
                                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={10} width={80} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                                <Legend />
                                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </RechartsBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado de faturamento por categoria.</div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Atividade de Lances</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.bidsOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                                <YAxis stroke="#888888" fontSize={10} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Lances" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function EditAuctionPage() {
  const params = useParams(); 
  const auctionId = params.auctionId as string; 
  const [auction, setAuction] = React.useState<Auction | null>(null);
  const [categories, setCategories] = React.useState<LotCategory[]>([]);
  const [lotsInAuction, setLotsInAuction] = React.useState<Lot[]>([]);
  const [auctioneers, setAuctioneersList] = React.useState<AuctioneerProfileInfo[]>([]);
  const [sellers, setSellersList] = React.useState<SellerProfileInfo[]>([]);
  const [states, setStates] = React.useState<StateInfo[]>([]);
  const [allCities, setAllCities] = React.useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const formRef = React.useRef<any>(null);

  const fetchPageData = useCallback(async () => {
    if (!auctionId) return;
    setIsLoading(true);
    try {
        const [fetchedAuction, fetchedCategories, fetchedLots, fetchedAuctioneers, fetchedSellers, settings, fetchedStates, fetchedCities] = await Promise.all([
            getAuction(auctionId),
            getLotCategories(),
            getLots(auctionId),
            getAuctioneers(),
            getSellers(),
            getPlatformSettings(),
            getStates(),
            getCities(),
        ]);

        if (!fetchedAuction) {
            notFound();
            return;
        }
        setPlatformSettings(settings as PlatformSettings);
        setAuction(fetchedAuction);
        setCategories(fetchedCategories);
        setLotsInAuction(fetchedLots);
        setAuctioneersList(fetchedAuctioneers);
        setSellersList(fetchedSellers);
        setStates(fetchedStates);
        setAllCities(fetchedCities);
    } catch (error) {
        console.error("Error fetching data for edit auction page:", error);
        toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar os dados do leilão.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [auctionId, toast]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleUpdateAuction = async (data: Partial<AuctionFormData>) => {
    setIsSubmitting(true);
    const result = await updateAuction(auctionId, data);
    if(result.success) {
      toast({ title: 'Sucesso!', description: result.message});
      fetchPageData();
      setIsViewMode(true);
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
  }

  const handleDelete = async () => {
    if(!auction) return;
    const result = await deleteAuction(auction.id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/auctions');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
      formRef.current?.requestSubmit();
  };
  
  const handleDeleteLot = useCallback(
    async (lotId: string) => {
      const auctionId = auction?.id;
      const result = await deleteLot(lotId, auctionId);
      if (result.success) {
        toast({ title: 'Sucesso', description: 'Lote excluído com sucesso.' });
        fetchPageData();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    },
    [auction?.id, fetchPageData, toast]
  );
  
  const lotColumns = useMemo(() => createLotColumns({ handleDelete: handleDeleteLot }), [handleDeleteLot]);

  if (isLoading || !auction || !platformSettings) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="space-y-8">
        <FormPageLayout
          formTitle={isViewMode ? `Visualizar Leilão` : `Editar Leilão`}
          formDescription={auction?.title || 'Carregando...'}
          icon={Gavel}
          isViewMode={isViewMode}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onEnterEditMode={() => setIsViewMode(false)}
          onCancel={() => setIsViewMode(true)}
          onSave={handleSave}
          onDelete={handleDelete}
        >
          <AuctionForm
            formRef={formRef}
            initialData={auction}
            categories={categories}
            auctioneers={auctioneers}
            sellers={sellers}
            states={states}
            allCities={allCities}
            onSubmitAction={handleUpdateAuction}
            formTitle=""
            formDescription=""
            submitButtonText="Salvar Alterações"
          />
        </FormPageLayout>

        <Separator className="my-8"/>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-semibold flex items-center">
                            <Layers className="mr-2 h-5 w-5 text-primary"/> Lotes do Leilão
                        </CardTitle>
                        <CardDescription>
                            Gerencie os lotes vinculados a este leilão.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href={`/admin/lots/new?auctionId=${auction.id}`}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lote
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DataTable 
                    columns={lotColumns}
                    data={lotsInAuction}
                />
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary"/> Análise de Performance do Leilão
              </CardTitle>
              <CardDescription>
                  KPIs e métricas de desempenho para este leilão específico.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <AuctionDashboardSection auctionId={auctionId} />
          </CardContent>
        </Card>
      </div>
       <AISuggestionModal
        isOpen={isAISuggestionModalOpen}
        onClose={() => setIsAISuggestionModalOpen(false)}
        fetchSuggestionsAction={() => fetchListingDetailsSuggestions({
            auctionTitle: auction.title,
            auctionDescription: auction.description || '',
            auctionCategory: auction.category?.name || '',
            auctionKeywords: '', // Keywords are not part of the auction model yet
        })}
        onApplySuggestions={(suggestions) => {
            if (formRef.current) {
                formRef.current.setValue('title', suggestions.suggestedTitle, { shouldDirty: true });
                formRef.current.setValue('description', suggestions.suggestedDescription, { shouldDirty: true });
                toast({ title: 'Sugestões aplicadas!', description: 'O título e a descrição foram atualizados.' });
            }
        }}
      />
    </>
  );
}
