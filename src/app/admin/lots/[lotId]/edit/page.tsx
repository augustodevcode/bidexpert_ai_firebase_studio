// src/app/admin/lots/[lotId]/edit/page.tsx
'use client'; 

import LotForm from '../../lot-form';
import { getLot, updateLot, finalizeLot, deleteLot } from '../../actions'; 
import { getBens as getBensForLotting } from '@/app/admin/bens/actions'; 
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions, getAuction } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import type { Auction, Bem, StateInfo, CityInfo, PlatformSettings, LotCategory, SellerProfileInfo, Lot, LotFormData } from '@bidexpert/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Info, Settings, BarChart3, Layers, Gavel, Lightbulb, BarChart3 as BarChartIcon, TrendingUp, ListChecks, Users, CheckCircle, Repeat } from 'lucide-react';
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
import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react'; 
import { useToast } from '@/hooks/use-toast';
import { getSellers } from '@/app/admin/sellers/actions';
import RelistLotModal from '../relist-lot-modal';
import FormPageLayout from '@/components/admin/form-page-layout';
import AISuggestionModal from '@/components/ai/ai-suggestion-modal';
import { fetchListingDetailsSuggestions } from '@/app/auctions/create/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { AuctionDashboardData } from '@/app/admin/auctions/analysis/actions';
import { getAuctionDashboardDataAction } from '@/app/admin/auctions/analysis/actions';
import { Bar, Line, ResponsiveContainer, LineChart, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

export default function EditLotPage() {
  const params = useParams();
  const lotId = params.lotId as string;
  const router = useRouter();
  const { toast } = useToast();
  const formRef = React.useRef<any>(null);

  const [lot, setLot] = useState<Lot | null>(null);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [allCities, setAllCities] = useState<CityInfo[]>([]);
  const [availableBens, setAvailableBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false); 
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const fetchPageData = useCallback(async () => {
    if (!lotId) return;
    setIsLoading(true);
    try {
      const fetchedLot = await getLot(lotId);
      if (!fetchedLot) {
        notFound();
        return;
      }
      
      const parentAuction = await getAuction(fetchedLot.auctionId);
      const filterForBens = parentAuction?.auctionType === 'JUDICIAL' && parentAuction.judicialProcessId
        ? { judicialProcessId: parentAuction.judicialProcessId }
        : (parentAuction?.sellerId ? { sellerId: parentAuction.sellerId } : {});

      const [fetchedCategories, fetchedAuctions, fetchedStates, fetchedCities, fetchedBens, fetchedSellers, settings] = await Promise.all([
        getLotCategories(),
        getAuctions(),
        getStates(),
        getCities(),
        getBensForLotting(filterForBens),
        getSellers(),
        getPlatformSettings(),
      ]);
      
      setLot(fetchedLot as Lot);
      setCategories(fetchedCategories);
      setAuctions(fetchedAuctions);
      setSellers(fetchedSellers);
      setStates(fetchedStates);
      setAllCities(fetchedCities);
      setAvailableBens(fetchedBens);
      setPlatformSettings(settings as PlatformSettings);

    } catch (error) {
      console.error("Error fetching lot data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [lotId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleSave = async () => {
    if (formRef.current) {
        await formRef.current.requestSubmit();
    }
  }

  async function handleUpdateLot(data: Partial<LotFormData>) {
    setIsSubmitting(true);
    const result = await updateLot(lotId, data);
    setIsSubmitting(false);
    if (result.success) {
        toast({ title: "Sucesso!", description: "Lote atualizado." });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }
  
  const handleDeleteLot = async () => {
    const result = await deleteLot(lotId, lot?.auctionId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push(`/admin/auctions/${lot?.auctionId}/edit`);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleFinalizeLot = async () => {
    if (!lot) return;
    setIsFinalizing(true);
    const result = await finalizeLot(lot.id);
    if (result.success) {
      toast({ title: "Lote Finalizado!", description: result.message });
      fetchPageData();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsFinalizing(false);
  };

  const handleRelistSuccess = (newLotId: string) => {
    toast({
      title: 'Lote Relistado com Sucesso!',
      description: 'O novo lote foi criado e o lote original foi atualizado.',
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/admin/lots/${newLotId}/edit`}>Ver Novo Lote</Link>
        </Button>
      )
    });
    fetchPageData();
    setIsRelistModalOpen(false);
  };

  const canFinalize = lot && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'ENCERRADO');
  const canRelist = lot && lot.status === 'NAO_VENDIDO';

  if (isLoading || !lot || !platformSettings) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="space-y-8">
        <FormPageLayout
            formTitle={isViewMode ? "Visualizar Lote" : "Editar Lote"}
            formDescription={lot.title}
            icon={Layers}
            isViewMode={isViewMode}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onEnterEditMode={() => setIsViewMode(false)}
            onCancel={() => setIsViewMode(true)}
            onSave={handleSave}
            onDelete={handleDeleteLot}
        >
            <LotForm
              ref={formRef}
              initialData={lot}
              categories={categories}
              auctions={auctions}
              sellers={sellers}
              states={states}
              allCities={allCities}
              initialAvailableBens={availableBens}
              onSubmitAction={handleUpdateLot}
              onSuccessCallback={fetchPageData}
            />
        </FormPageLayout>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canFinalize && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/> Finalização</CardTitle>
                      <CardDescription>Calcular o vencedor e encerrar o lote.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="secondary" disabled={isFinalizing}>
                            {isFinalizing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Gavel className="mr-2 h-4 w-4" />}
                            Finalizar e Declarar Vencedor
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Confirmar Finalização?</AlertDialogTitle><AlertDialogDescription>Esta ação irá determinar o vencedor, atualizar o status e notificar o arrematante. Não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleFinalizeLot} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardContent>
              </Card>
          )}

          {canRelist && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/> Relistar</CardTitle>
                      <CardDescription>Criar um novo lote a partir deste para um leilão futuro.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button variant="secondary" onClick={() => setIsRelistModalOpen(true)}>
                          <Repeat className="mr-2 h-4 w-4" /> Relistar este Lote
                      </Button>
                  </CardContent>
              </Card>
          )}

           <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> Otimização</CardTitle>
                  <CardDescription>Use a IA para otimizar o título e a descrição deste lote.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button variant="secondary" onClick={() => setIsAISuggestionModalOpen(true)}>Otimizar com IA</Button>
              </CardContent>
          </Card>
        </div>
      </div>
      
      {isRelistModalOpen && (
        <RelistLotModal isOpen={isRelistModalOpen} onClose={() => setIsRelistModalOpen(false)} originalLot={lot} auctions={auctions} onRelistSuccess={handleRelistSuccess} />
      )}
       <AISuggestionModal
        isOpen={isAISuggestionModalOpen}
        onClose={() => setIsAISuggestionModalOpen(false)}
        fetchSuggestionsAction={() => fetchListingDetailsSuggestions({
            auctionTitle: lot.title,
            auctionDescription: lot.description || '',
            auctionCategory: lot.categoryName || '',
            auctionKeywords: '',
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
