
'use client'; 

import AuctionForm from '../../auction-form';
import { getAuction, updateAuction, deleteAuction, type AuctionFormData } from '../../actions'; 
import { getLotCategories } from '@/app/admin/categories/actions';
import { getLots, deleteLot, finalizeLot } from '@/app/admin/lots/actions'; 
import type { Auction, Lot, PlatformSettings, LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';
import { notFound, useRouter, useParams } from 'next/navigation'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, Info, Settings, BarChart2, FileText, Users, CheckCircle, XCircle, Loader2, ExternalLink, ListChecks, AlertTriangle, Package as PackageIcon, Clock as ClockIcon, LandPlot, ShoppingCart, Layers, Gavel, FileSignature } from 'lucide-react'; // Added Gavel, FileSignature
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, slugify } from '@/lib/sample-data-helpers';
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
import { Separator } from '@/components/ui/separator';
import React, { useEffect, useCallback, useMemo, useState } from 'react'; 
import { useToast } from '@/hooks/use-toast';
import SearchResultsFrame from '@/components/search-results-frame';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { samplePlatformSettings } from '@/lib/sample-data';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';

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

function FinalizeLotButton({ lot, onFinalized }: { lot: Lot; onFinalized: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFinalize = async () => {
      setIsLoading(true);
      const result = await finalizeLot(lot.id);
      if (result.success) {
          toast({ title: "Sucesso!", description: result.message });
          onFinalized();
      } else {
          toast({ title: "Erro ao Finalizar Lote", description: result.message, variant: "destructive" });
      }
      setIsLoading(false);
  };

  const canFinalize = lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'ENCERRADO';

  return (
      <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 h-7 w-7" disabled={!canFinalize || isLoading}>
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  <span className="sr-only">Finalizar Lote</span>
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Finalização do Lote?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação irá determinar o vencedor com base no lance mais alto, atualizar o status do lote para "Vendido" (ou "Não Vendido") e notificar o vencedor. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalize} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Finalizar Agora
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
  );
}

function AuctionActionsDisplay({ auction, userProfile }: { auction: Auction; userProfile: any }) {
    const hasGenerateReportPerm = hasAnyPermission(userProfile, ['manage_all', 'documents:generate_report']);
    const hasGenerateCertificatePerm = hasAnyPermission(userProfile, ['manage_all', 'documents:generate_certificate']);
    
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
                                <Button className="w-full justify-start" disabled={!hasGenerateReportPerm}>
                                    <FileText className="mr-2 h-4 w-4"/> Gerar Laudo de Avaliação (PDF)
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!hasGenerateReportPerm && <TooltipContent><p>Você não tem permissão para gerar laudos.</p></TooltipContent>}
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button className="w-full justify-start" disabled={!hasGenerateCertificatePerm}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Gerar Relatório de Arremates (PDF)
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!hasGenerateCertificatePerm && <TooltipContent><p>Você não tem permissão para gerar certificados.</p></TooltipContent>}
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
                    <p><strong>Categoria:</strong> {auction.category}</p>
                    <p><strong>Leiloeiro:</strong> {auction.auctioneer}</p>
                    <p><strong>Comitente:</strong> {auction.seller || 'N/A'}</p>
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isViewMode, setIsViewMode] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(samplePlatformSettings as PlatformSettings);
  const [lotSortBy, setLotSortBy] = useState<string>('number_asc');
  const [lotCurrentPage, setLotCurrentPage] = useState(1);
  const [lotItemsPerPage, setLotItemsPerPage] = useState(platformSettings.searchItemsPerPage || 12);
  

  const fetchPageData = useCallback(async () => {
    if (!auctionId) return;
    setIsLoading(true);
    try {
        const [fetchedAuction, fetchedCategories, fetchedLots, fetchedAuctioneers, fetchedSellers, settings] = await Promise.all([
            getAuction(auctionId),
            getLotCategories(),
            getLots(auctionId),
            getAuctioneers(),
            getSellers(),
            getPlatformSettings(),
        ]);

        if (!fetchedAuction) {
            notFound();
            return;
        }
        setPlatformSettings(settings);
        setLotItemsPerPage(settings.searchItemsPerPage || 12);
        setAuction(fetchedAuction);
        setCategories(fetchedCategories);
        setLotsInAuction(fetchedLots);
        setAuctioneersList(fetchedAuctioneers);
        setSellersList(fetchedSellers);
        setLotCurrentPage(1); 
    } catch (error) {
        console.error("Error fetching data for edit auction page:", error);
        toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar os dados do leilão.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, toast]);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  async function handleUpdateAuction(data: Partial<AuctionFormData>) {
    return updateAuction(auctionId, data);
  }

  const lotSortOptions = [
    { value: 'number_asc', label: 'Nº Lote Crescente' },
    { value: 'number_desc', label: 'Nº Lote Decrescente' },
    { value: 'title_asc', label: 'Título A-Z' },
    { value: 'title_desc', label: 'Título Z-A' },
    { value: 'status_asc', label: 'Status A-Z' },
    { value: 'price_asc', label: 'Preço Crescente' },
    { value: 'price_desc', label: 'Preço Decrescente' },
  ];

  const sortedLots = useMemo(() => {
    return [...lotsInAuction].sort((a, b) => {
      switch (lotSortBy) {
        case 'number_asc':
          return (parseInt(a.number || '0') || 0) - (parseInt(b.number || '0') || 0);
        case 'number_desc':
          return (parseInt(b.number || '0') || 0) - (parseInt(a.number || '0') || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'status_asc':
          return getAuctionStatusText(a.status).localeCompare(getAuctionStatusText(b.status));
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [lotsInAuction, lotSortBy]);
  
  const paginatedLots = useMemo(() => {
    const startIndex = (lotCurrentPage - 1) * lotItemsPerPage;
    const endIndex = startIndex + lotItemsPerPage;
    return sortedLots.slice(startIndex, endIndex);
  }, [sortedLots, lotCurrentPage, lotItemsPerPage]);

  const handleLotSortChange = (newSortBy: string) => {
    setLotSortBy(newSortBy);
    setLotCurrentPage(1);
  };

  const handleLotPageChange = (newPage: number) => {
    setLotCurrentPage(newPage);
  };
  
  const handleLotItemsPerPageChange = (newSize: number) => {
      setLotItemsPerPage(newSize);
      setLotCurrentPage(1); // Reset to first page
  }

  const renderLotListItemForAdmin = (lot: Lot) => (
    <Card key={lot.id} className="mb-2 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="flex-grow">
            <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`} className="hover:text-primary">
              <h4 className="font-semibold text-sm">{lot.number ? `Lote ${lot.number}: ` : ''}{lot.title}</h4>
            </Link>
            <p className="text-xs text-muted-foreground">ID: {lot.publicId || lot.id}</p>
            {lot.type && (
             <p className="text-xs text-muted-foreground">
               Cat: {lot.type}
               {lot.subcategoryName && ` / ${lot.subcategoryName}`}
             </p>
           )}
            <Badge variant="outline" className={`text-xs mt-1 border-current`}>
                {getAuctionStatusText(lot.status)}
            </Badge>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-semibold">R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              <Gavel className="h-3 w-3"/> {lot.bidsCount || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {lot.endDate ? format(new Date(lot.endDate as string), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 border-t flex justify-end items-center gap-1">
        <FinalizeLotButton lot={lot} onFinalized={fetchPageData} />
        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700 h-7 w-7">
          <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank" title="Ver Lote (Público)">
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 h-7 w-7">
          <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`} title="Editar Lote">
            <Edit className="h-3.5 w-3.5" />
          </Link>
        </Button>
        {auction && <DeleteLotButton lotId={lot.publicId || lot.id} lotTitle={lot.title} auctionId={auction.publicId || auctionId} onDeleteSuccess={fetchPageData} />}
      </CardFooter>
    </Card>
  );

  const renderLotGridItemForAdmin = (lot: Lot) => (
    <Card key={lot.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-3">
            <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`} className="hover:text-primary">
                <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight h-8">
                    {lot.number ? `Lote ${lot.number}: ` : ''}{lot.title}
                </CardTitle>
            </Link>
            <CardDescription className="text-xs">ID: {lot.publicId || lot.id}</CardDescription>
            {lot.type && (
             <CardDescription className="text-xs mt-0.5">
               {lot.type}
               {lot.subcategoryName && ` / ${lot.subcategoryName}`}
             </CardDescription>
           )}
        </CardHeader>
        <CardContent className="p-3 flex-grow space-y-1 text-xs">
            <Badge variant="outline" className={`border-current`}>
                {getAuctionStatusText(lot.status)}
            </Badge>
            <p className="font-medium">R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-muted-foreground flex items-center gap-1"><Gavel className="h-3 w-3"/> {lot.bidsCount || 0} lances</p>
            <p className="text-muted-foreground">
              Fim: {lot.endDate ? format(new Date(lot.endDate as string), 'dd/MM HH:mm', { locale: ptBR }) : 'N/A'}
            </p>
        </CardContent>
      <CardFooter className="p-2 border-t flex justify-end items-center gap-1">
        <FinalizeLotButton lot={lot} onFinalized={fetchPageData} />
        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700 h-7 w-7">
          <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank" title="Ver Lote (Público)">
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 h-7 w-7">
          <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`} title="Editar Lote">
            <Edit className="h-3.5 w-3.5" />
          </Link>
        </Button>
        {auction && <DeleteLotButton lotId={lot.publicId || lot.id} lotTitle={lot.title} auctionId={auction.publicId || auctionId} onDeleteSuccess={fetchPageData} />}
      </CardFooter>
    </Card>
  );

  if (isLoading || !auction) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
       <div className="flex justify-end gap-2">
           {isViewMode ? (
            <Button onClick={() => setIsViewMode(false)}>
              <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
            </Button>
           ) : null}
            <DeleteAuctionButton auction={auction} onAction={fetchPageData} />
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <AuctionForm
            initialData={auction}
            categories={categories}
            auctioneers={auctioneers}
            sellers={sellers}
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

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lotes do Leilão</CardTitle>
            <CardDescription>Lista de lotes associados a este leilão ({lotsInAuction.length} no total).</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/admin/lots/new?auctionId=${auction.id}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <SearchResultsFrame
            items={paginatedLots}
            totalItemsCount={lotsInAuction.length}
            renderGridItem={renderLotGridItemForAdmin}
            renderListItem={renderLotListItemForAdmin}
            sortOptions={lotSortOptions}
            initialSortBy={lotSortBy}
            onSortChange={handleLotSortChange}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="lotes"
            currentPage={lotCurrentPage}
            itemsPerPage={lotItemsPerPage}
            onPageChange={handleLotPageChange}
            onItemsPerPageChange={handleLotItemsPerPageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
