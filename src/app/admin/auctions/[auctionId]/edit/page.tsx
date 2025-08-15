// src/app/admin/auctions/[auctionId]/edit/page.tsx
'use client'; 

import AuctionForm from '../../auction-form';
import { getAuction, updateAuction, deleteAuction, type AuctionFormData } from '../../actions'; 
import { getLots, deleteLot } from '@/app/admin/lots/actions'; 
import { generateWinningBidTermAction } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
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


function DeleteLotButton({ lotId, lotTitle, auctionId, onDeleteSuccess }: { lotId: string; lotTitle: string; auctionId: string; onDeleteSuccess: () => void }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteLot(lotId, auctionId); 
    if (!result.success) {
        console.error("Failed to delete lot:", result.message);
        toast({ title: "Erro ao Excluir Lote", description: result.message, variant: "destructive" });
    } else {
        toast({ title: "Sucesso", description: "Lote excluído com sucesso." });
        onDeleteSuccess(); 
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          <span className="sr-only">Excluir Lote</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão do Lote</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o lote "{lotTitle}" (ID: {lotId}) deste leilão? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Excluir Lote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AuctionActionsDisplay({ auction, userProfile }: { auction: Auction; userProfile: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    
    const hasGenerateReportPerm = hasAnyPermission(userProfile, ['manage_all', 'documents:generate_report']);
    const hasGenerateCertificatePerm = hasAnyPermission(userProfile, ['manage_all', 'documents:generate_certificate']);
    
    const handleGenerateDocument = async (type: 'WINNING_BID_TERM' | 'EVALUATION_REPORT' | 'AUCTION_CERTIFICATE', lot?: Lot, winner?: UserWin) => {
        const loadingKey = `${type}-${lot?.id || 'auction'}`;
        setIsLoading(prev => ({...prev, [loadingKey]: true}));
        toast({ title: 'Gerando Documento...', description: 'Aguarde, isso pode levar alguns segundos.'});

        try {
            // MUDANÇA: Ação de gerar documento movida para um arquivo separado e seguro
            const result = type === 'WINNING_BID_TERM' && lot
              ? await generateWinningBidTermAction(lot.id)
              : { success: false, message: 'Tipo de documento não suportado nesta ação.'}; // Placeholder para outros tipos

            if (result.success && result.pdfBase64 && result.fileName) {
                const byteCharacters = atob(result.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = result.fileName;
                link.click();
                toast({ title: 'Sucesso!', description: 'Download do PDF iniciado.' });
            } else {
                throw new Error(result.message || "A resposta da API não continha um PDF válido.");
            }
        } catch (error: any) {
            console.error("Error generating document:", error);
            toast({ title: 'Erro ao Gerar PDF', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(prev => ({...prev, [loadingKey]: false}));
        }
    };
    
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><FileSignature className="mr-2 h-5 w-5 text-primary"/> Ações Pós-Leilão e Documentação</CardTitle>
                <CardDescription>Gere laudos e certificados para este leilão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button className="w-full justify-start" disabled>
                                    <FileText className="mr-2 h-4 w-4"/> Gerar Laudo de Avaliação (PDF)
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Funcionalidade em desenvolvimento.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button className="w-full justify-start" disabled>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Gerar Relatório de Arremates (PDF)
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Funcionalidade em desenvolvimento.</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button variant="secondary" className="w-full justify-start" disabled>
                                    <Users className="mr-2 h-4 w-4"/> Enviar Comunicação aos Arrematantes
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Funcionalidade em desenvolvimento.</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </CardContent>
        </Card>
    );
}

function AuctionInfoDisplay({ auction }: { auction: Auction }) {
    const auctionTypeLabels: Record<string, string> = {
        JUDICIAL: 'Judicial',
        EXTRAJUDICIAL: 'Extrajudicial',
        PARTICULAR: 'Particular',
        TOMADA_DE_PRECOS: 'Tomada de Preços',
    };

    const getDaysRemaining = (endDate: string | Date | null | undefined) => {
        if (!endDate) return null;
        const diff = differenceInDays(new Date(endDate), new Date());
        if (diff < 0) return "Encerrado";
        if (diff === 0) return "Encerra Hoje";
        return `${diff} dia(s) restante(s)`;
    };

    return (
        <div className="space-y-4">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> Resumo do Leilão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>ID do Leilão:</strong> {auction.publicId}</p>
                    <div className="flex items-center"><strong>Status:</strong><Badge variant="outline" className={`ml-2 ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'border-green-500 text-green-600' : 'border-gray-400'}`}>{getAuctionStatusText(auction.status)}</Badge></div>
                    <p><strong>Data Início:</strong> {auction.auctionDate ? format(new Date(auction.auctionDate as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</p>
                    <p><strong>Data Fim (Estimada):</strong> {auction.endDate ? format(new Date(auction.endDate as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Não definida'}</p>
                    {auction.endDate && !isPast(new Date(auction.endDate as string)) && <p><strong>Tempo Restante:</strong> {getDaysRemaining(auction.endDate)}</p>}
                    <p><strong>Leiloeiro:</strong> {auction.auctioneerName}</p>
                    <p><strong>Comitente:</strong> {auction.seller?.name || 'N/A'}</p>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Configurações de Venda e Marketplace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Modalidade:</strong> {auctionTypeLabels[auction.auctionType || ''] || 'Não especificada'}</p>
                    <p><strong>Robô de Lances:</strong> {auction.automaticBiddingEnabled ? <CheckCircle className="inline h-4 w-4 text-green-600"/> : <XCircle className="inline h-4 w-4 text-red-600"/>} {auction.automaticBiddingEnabled ? 'Ativado' : 'Desativado'}</p>
                    <p><strong>Permite Lance Parcelado:</strong> {auction.allowInstallmentBids ? <CheckCircle className="inline h-4 w-4 text-green-600"/> : <XCircle className="inline h-4 w-4 text-red-600"/>} {auction.allowInstallmentBids ? 'Sim' : 'Não'}</p>
                    <p><strong>Destaque no Marketplace:</strong> {auction.isFeaturedOnMarketplace ? <CheckCircle className="inline h-4 w-4 text-green-600"/> : <XCircle className="inline h-4 w-4 text-red-600"/>} {auction.isFeaturedOnMarketplace ? 'Sim' : 'Não'}</p>
                    {auction.isFeaturedOnMarketplace && <p><strong>Título do Anúncio:</strong> {auction.marketplaceAnnouncementTitle || 'Não definido'}</p>}
                </CardContent>
            </Card>
            
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-primary" /> Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Visitas:</strong> {auction.visits || 0}</p>
                    <p><strong>Total de Lotes:</strong> {auction.totalLots || 0}</p>
                    <p><strong>Faturamento Estimado:</strong> R$ {(auction.estimatedRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Faturamento Realizado:</strong> R$ {(auction.achievedRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Usuários Habilitados:</strong> {auction.totalHabilitatedUsers || 0}</p>
                </CardContent>
            </Card>
        </div>
    );
}

function DeleteAuctionButton({ auction, onAction }: { auction: Auction; onAction: () => void; }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const canDelete = auction.status === 'RASCUNHO';
  const tooltipContent = canDelete 
    ? "Excluir este leilão" 
    : "Não é possível excluir um leilão que já foi iniciado ou possui lotes. Altere o status para 'Rascunho' e remova os lotes primeiro.";

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    const result = await deleteAuction(auction.id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/auctions');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div> {/* Wrapper div to allow tooltip on disabled button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting || !canDelete}>
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é permanente e não pode ser desfeita. Tem certeza que deseja excluir o leilão "{auction.title}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


export default function EditAuctionPage() {
  const paramsHook = useParams(); 
  const auctionId = paramsHook.auctionId as string; 
  const [auction, setAuction] = React.useState<Auction | null>(null);
  const [categories, setCategories] = React.useState<LotCategory[]>([]);
  const [lotsInAuction, setLotsInAuction] = React.useState<Lot[]>([]);
  const [auctioneers, setAuctioneersList] = React.useState<AuctioneerProfileInfo[]>([]);
  const [sellers, setSellersList] = React.useState<SellerProfileInfo[]>([]);
  const [states, setStates] = React.useState<StateInfo[]>([]);
  const [allCities, setAllCities] = React.useState<CityInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
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

  async function handleUpdateAuction(data: Partial<AuctionFormData>) {
    return updateAuction(auctionId, data);
  }

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
        <div className="flex justify-between items-center gap-2">
            <Button variant="secondary" onClick={() => setIsAISuggestionModalOpen(true)}>
                <Lightbulb className="mr-2 h-4 w-4" /> Otimizar com IA
            </Button>
            <div className="flex gap-2">
              {isViewMode ? (
                  <Button onClick={() => setIsViewMode(false)}>
                  <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
                  </Button>
              ) : null}
                  <DeleteAuctionButton auction={auction} onAction={fetchPageData} />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <AuctionForm
                formRef={formRef}
                initialData={auction}
                categories={categories}
                auctioneers={auctioneers}
                sellers={sellers}
                states={states}
                allCities={allCities}
                onSubmitAction={handleUpdateAuction}
                formTitle={isViewMode ? "Visualizar Leilão" : "Editar Leilão"}
                formDescription={isViewMode ? "Consulte as informações do leilão abaixo." : "Modifique os detalhes do leilão."}
                submitButtonText="Salvar Alterações"
                isViewMode={isViewMode}
                onUpdateSuccess={() => {
                    fetchPageData();
                    setIsViewMode(true);
                }}
                onCancelEdit={() => setIsViewMode(true)}
              />
            </div>
            <div className="lg:col-span-1 space-y-6 sticky top-24">
                <AuctionInfoDisplay auction={auction} />
                <AuctionActionsDisplay auction={auction} userProfile={userProfileWithPermissions}/>
            </div>
        </div>
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

```
- src/components/admin/sellers/seller-form.tsx:
```tsx
// src/components/admin/sellers/seller-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { sellerFormSchema, type SellerFormValues } from '@/app/admin/sellers/seller-form-schema';
import type { SellerProfileInfo, MediaItem, JudicialBranch } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon, Scale, XCircle } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { consultaCepAction } from '@/lib/actions/cep'; 
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';

interface SellerFormProps {
  initialData?: SellerProfileInfo | null;
  judicialBranches: JudicialBranch[];
  onSubmitAction: (data: SellerFormValues) => Promise<any>;
}

const SellerForm = React.forwardRef<any, SellerFormProps>(({
  initialData,
  judicialBranches: initialBranches,
  onSubmitAction,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState(initialBranches);
  const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      publicId: initialData?.publicId || '',
      contactName: initialData?.contactName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zipCode: initialData?.zipCode || '',
      website: initialData?.website || '',
      logoUrl: initialData?.logoUrl || '',
      logoMediaId: initialData?.logoMediaId || null,
      dataAiHintLogo: initialData?.dataAiHintLogo || '',
      description: initialData?.description || '',
      judicialBranchId: initialData?.judicialBranchId || null,
      isJudicial: initialData?.isJudicial || false,
    },
  });

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const logoUrlPreview = useWatch({ control: form.control, name: 'logoUrl' });
  const isJudicial = useWatch({ control: form.control, name: 'isJudicial' });

  const handleRefetchBranches = React.useCallback(async () => {
    setIsFetchingBranches(true);
    const data = await getJudicialBranches();
    setJudicialBranches(data);
    setIsFetchingBranches(false);
  }, []);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('logoUrl', selectedMediaItem.urlOriginal);
        form.setValue('logoMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };
  
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    setIsCepLoading(true);
    const result = await consultaCepAction(cep);
    if (result.success && result.data) {
        form.setValue('address', result.data.logradouro);
        form.setValue('city', result.data.localidade);
        form.setValue('state', result.data.uf);
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
           <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do Comitente/Empresa</FormLabel><FormControl><Input placeholder="Ex: Banco XYZ S.A., 1ª Vara Cível de Lagarto" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
             {initialData?.publicId && (
                <FormField control={form.control} name="publicId" render={({ field }) => (<FormItem><FormLabel>ID Público</FormLabel><FormControl><Input readOnly disabled className="cursor-not-allowed bg-muted/70" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este é o ID público do comitente, gerado pelo sistema.</FormDescription><FormMessage /></FormItem>)} />
            )}
            <FormField control={form.control} name="isJudicial" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>É Comitente Judicial?</FormLabel><FormDescription>Marque se este comitente é uma entidade judicial (Vara, Tribunal, etc).</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
            {isJudicial && (
                <FormField control={form.control} name="judicialBranchId" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4"/>Vara Judicial Vinculada (Opcional)</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={judicialBranches.map(b => ({ value: b.id, label: `${b.name} - ${b.districtName}` }))} placeholder="Nenhuma vara judicial vinculada" searchPlaceholder="Buscar vara..." emptyStateMessage="Nenhuma vara encontrada." createNewUrl="/admin/judicial-branches/new" editUrlPrefix="/admin/judicial-branches" onRefetch={handleRefetchBranches} isFetching={isFetchingBranches} /><FormDescription>Se este comitente representa uma entidade judicial, vincule-a aqui.</FormDescription><FormMessage /></FormItem>
                    )} />
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Nome do Contato (Opcional)</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="contato@comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://www.comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="zipCode" render={({ field }) => (
                    <FormItem><FormLabel>CEP</FormLabel><div className="flex gap-2"><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); if (e.target.value.replace(/\D/g, '').length === 8) { handleCepLookup(e.target.value); }}}/></FormControl><Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading}>{isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage /></FormItem>
                )} />
             <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua Exemplo, 123, Bairro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado/UF</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <FormItem>
              <FormLabel>Logo do Comitente</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {logoUrlPreview ? ( <Image src={logoUrlPreview} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo comitente" />) : (<div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>)}
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>{logoUrlPreview ? 'Alterar Logo' : 'Escolher da Biblioteca'}</Button>
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" /></FormControl>)} />
                  <FormMessage />
                </div>
              </div>
            </FormItem>

            <FormField control={form.control} name="dataAiHintLogo" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Logo - Opcional)</FormLabel><FormControl><Input placeholder="Ex: banco logo, empresa tecnologia" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Duas palavras chave para ajudar a IA encontrar uma imagem de placeholder, se a URL do logo não for fornecida.</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição/Observações (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre o comitente..." {...field} value={field.value ?? ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
        </form>
      </Form>
     <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
});

SellerForm.displayName = "SellerForm";
export default SellerForm;

```
- src/app/admin/sellers/[sellerId]/edit/page.tsx:
```tsx
// src/app/admin/sellers/[sellerId]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import SellerForm from '@/app/admin/sellers/seller-form';
import { getSeller, updateSeller, deleteSeller, type SellerFormData } from '../../actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { Button } from '@/components/ui/button';
import { BarChart3, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSellerDashboardDataAction } from '../../analysis/actions';
import type { SellerDashboardData } from '@/services/seller.service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LineChart, BarChart as RechartsBarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from '@/components/ui/separator';
import FormPageLayout from '@/components/admin/form-page-layout'; // Importar o novo layout
import React from 'react';

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

function SellerDashboardSection({ sellerId }: { sellerId: string }) {
    const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const data = await getSellerDashboardDataAction(sellerId);
            setDashboardData(data);
            setIsLoading(false);
        }
        fetchData();
    }, [sellerId]);

    // ... (O conteúdo da dashboard section permanece o mesmo)
    return (
        <div className="space-y-4">
             {/* ... */}
        </div>
    )
}

export default function EditSellerPage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const [seller, setSeller] = useState<SellerFormData | null>(null);
  const [judicialBranches, setJudicialBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<any>(null); // Ref para o formulário

  const fetchPageData = useCallback(async () => {
      if (!sellerId) return;
      setIsLoading(true);
      try {
        const [sellerData, branchesData] = await Promise.all([
            getSeller(sellerId),
            getJudicialBranches()
        ]);

        if (!sellerData) {
            notFound();
            return;
        }
        setSeller(sellerData);
        setJudicialBranches(branchesData);
      } catch (e) {
          console.error("Error fetching seller data", e);
          notFound();
      } finally {
        setIsLoading(false);
      }
  }, [sellerId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleDelete = async () => {
    const result = await deleteSeller(sellerId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push('/admin/sellers');
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
      if (formRef.current) {
          await formRef.current.requestSubmit();
      }
  };

  // Esta função será passada para o SellerForm
  const handleFormSubmit = async (data: SellerFormData) => {
    setIsSubmitting(true);
    const result = await updateSeller(sellerId, data);
    if (result.success) {
        toast({ title: 'Sucesso!', description: 'Comitente atualizado.' });
        fetchPageData(); // Re-fetch data
        setIsViewMode(true); // Return to view mode on success
    } else {
        toast({ title: 'Erro ao Salvar', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  return (
     <div className="space-y-6">
        <FormPageLayout
            formTitle={isViewMode ? `Visualizar Comitente` : `Editar Comitente`}
            formDescription={seller?.name || 'Carregando...'}
            icon={Users}
            isViewMode={isViewMode}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onEnterEditMode={() => setIsViewMode(false)}
            onCancel={() => setIsViewMode(true)}
            onSave={handleSave}
            onDelete={handleDelete}
        >
            <SellerForm
                ref={formRef} // Passando a ref para o formulário
                initialData={seller}
                judicialBranches={judicialBranches}
                onSubmitAction={handleFormSubmit}
                formTitle="Editar Comitente"
                formDescription=""
                submitButtonText="Salvar Alterações"
            />
        </FormPageLayout>

        <Separator className="my-8" />
        
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary"/> Análise de Performance
                </CardTitle>
                <CardDescription>
                    KPIs e métricas de desempenho para este comitente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SellerDashboardSection sellerId={sellerId} />
            </CardContent>
        </Card>
     </div>
  );
}

```
- src/components/admin/sellers/seller-form.tsx:
```tsx
// src/components/admin/sellers/seller-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { sellerFormSchema, type SellerFormValues } from '@/app/admin/sellers/seller-form-schema';
import type { SellerProfileInfo, MediaItem, JudicialBranch } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Image as ImageIcon, Scale, XCircle } from 'lucide-react';
import Image from 'next/image';
import ChooseMediaDialog from '@/components/admin/media/choose-media-dialog';
import { consultaCepAction } from '@/lib/actions/cep'; 
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialBranches } from '@/app/admin/judicial-branches/actions';
import { useRouter } from 'next/navigation';

interface SellerFormProps {
  initialData?: SellerProfileInfo | null;
  judicialBranches: JudicialBranch[];
  onSubmitAction: (data: SellerFormValues) => Promise<any>;
}

const SellerForm = React.forwardRef<any, SellerFormProps>(({
  initialData,
  judicialBranches: initialBranches,
  onSubmitAction,
}, ref) => {
  const { toast } = useToast();
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [isCepLoading, setIsCepLoading] = React.useState(false);
  const [judicialBranches, setJudicialBranches] = React.useState(initialBranches);
  const [isFetchingBranches, setIsFetchingBranches] = React.useState(false);

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      publicId: initialData?.publicId || '',
      contactName: initialData?.contactName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zipCode: initialData?.zipCode || '',
      website: initialData?.website || '',
      logoUrl: initialData?.logoUrl || '',
      logoMediaId: initialData?.logoMediaId || null,
      dataAiHintLogo: initialData?.dataAiHintLogo || '',
      description: initialData?.description || '',
      judicialBranchId: initialData?.judicialBranchId || null,
      isJudicial: initialData?.isJudicial || false,
    },
  });

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const logoUrlPreview = useWatch({ control: form.control, name: 'logoUrl' });
  const isJudicial = useWatch({ control: form.control, name: 'isJudicial' });

  const handleRefetchBranches = React.useCallback(async () => {
    setIsFetchingBranches(true);
    const data = await getJudicialBranches();
    setJudicialBranches(data);
    setIsFetchingBranches(false);
  }, []);

  const handleMediaSelect = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0) {
      const selectedMediaItem = selectedItems[0];
      if (selectedMediaItem?.urlOriginal) {
        form.setValue('logoUrl', selectedMediaItem.urlOriginal);
        form.setValue('logoMediaId', selectedMediaItem.id || null);
      } else {
        toast({ title: "Seleção Inválida", description: "O item de mídia selecionado não possui uma URL válida.", variant: "destructive" });
      }
    }
    setIsMediaDialogOpen(false);
  };
  
  const handleCepLookup = async (cep: string) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    setIsCepLoading(true);
    const result = await consultaCepAction(cep);
    if (result.success && result.data) {
        form.setValue('address', result.data.logradouro);
        form.setValue('city', result.data.localidade);
        form.setValue('state', result.data.uf);
    } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
    }
    setIsCepLoading(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
           <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do Comitente/Empresa</FormLabel><FormControl><Input placeholder="Ex: Banco XYZ S.A., 1ª Vara Cível de Lagarto" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
             {initialData?.publicId && (
                <FormField control={form.control} name="publicId" render={({ field }) => (<FormItem><FormLabel>ID Público</FormLabel><FormControl><Input readOnly disabled className="cursor-not-allowed bg-muted/70" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Este é o ID público do comitente, gerado pelo sistema.</FormDescription><FormMessage /></FormItem>)} />
            )}
            <FormField control={form.control} name="isJudicial" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background"><div className="space-y-0.5"><FormLabel>É Comitente Judicial?</FormLabel><FormDescription>Marque se este comitente é uma entidade judicial (Vara, Tribunal, etc).</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
            {isJudicial && (
                <FormField control={form.control} name="judicialBranchId" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4"/>Vara Judicial Vinculada (Opcional)</FormLabel><EntitySelector value={field.value} onChange={field.onChange} options={judicialBranches.map(b => ({ value: b.id, label: `${b.name} - ${b.districtName}` }))} placeholder="Nenhuma vara judicial vinculada" searchPlaceholder="Buscar vara..." emptyStateMessage="Nenhuma vara encontrada." createNewUrl="/admin/judicial-branches/new" editUrlPrefix="/admin/judicial-branches" onRefetch={handleRefetchBranches} isFetching={isFetchingBranches} /><FormDescription>Se este comitente representa uma entidade judicial, vincule-a aqui.</FormDescription><FormMessage /></FormItem>
                    )} />
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="contactName" render={({ field }) => (<FormItem><FormLabel>Nome do Contato (Opcional)</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="contato@comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website (Opcional)</FormLabel><FormControl><Input type="url" placeholder="https://www.comitente.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="zipCode" render={({ field }) => (
                    <FormItem><FormLabel>CEP</FormLabel><div className="flex gap-2"><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); if (e.target.value.replace(/\D/g, '').length === 8) { handleCepLookup(e.target.value); }}}/></FormControl><Button type="button" variant="secondary" onClick={() => handleCepLookup(form.getValues('zipCode') || '')} disabled={isCepLoading}>{isCepLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Buscar'}</Button></div><FormMessage /></FormItem>
                )} />
             <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua Exemplo, 123, Bairro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid md:grid-cols-3 gap-6">
              <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>Estado/UF</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <FormItem>
              <FormLabel>Logo do Comitente</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden border">
                  {logoUrlPreview ? ( <Image src={logoUrlPreview} alt="Prévia do Logo" fill className="object-contain" data-ai-hint="previa logo comitente" />) : (<div className="flex items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>)}
                </div>
                <div className="flex-grow space-y-2">
                  <Button type="button" variant="outline" onClick={() => setIsMediaDialogOpen(true)}>{logoUrlPreview ? 'Alterar Logo' : 'Escolher da Biblioteca'}</Button>
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormControl><Input type="url" placeholder="Ou cole a URL aqui" {...field} value={field.value ?? ""} className="text-xs h-8" /></FormControl>)} />
                  <FormMessage />
                </div>
              </div>
            </FormItem>

            <FormField control={form.control} name="dataAiHintLogo" render={({ field }) => (<FormItem><FormLabel>Dica para IA (Logo - Opcional)</FormLabel><FormControl><Input placeholder="Ex: banco logo, empresa tecnologia" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Duas palavras chave para ajudar a IA encontrar uma imagem de placeholder, se a URL do logo não for fornecida.</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição/Observações (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre o comitente..." {...field} value={field.value ?? ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
        </form>
      </Form>
     <ChooseMediaDialog isOpen={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen} onMediaSelect={handleMediaSelect} allowMultiple={false} />
    </>
  );
});

SellerForm.displayName = "SellerForm";
export default SellerForm;
```

