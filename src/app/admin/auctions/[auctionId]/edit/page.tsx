
'use client'; 

import AuctionForm from '../../auction-form';
import { getAuction, updateAuction, type AuctionFormData } from '../../actions'; 
import { getLotCategories } from '@/app/admin/categories/actions';
import { getLots, deleteLot } from '@/app/admin/lots/actions'; 
import type { Auction, Lot } from '@/types';
import { notFound, useRouter } from 'next/navigation'; // useRouter importado
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Eye, Info, Settings, BarChart2, FileText, Users, CheckCircle, XCircle, Loader2, ExternalLink, ListChecks, AlertTriangle, Package as PackageIcon, Clock as ClockIcon } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
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
import React, { useEffect } from 'react'; 
import { useToast } from '@/hooks/use-toast';

function DeleteLotButton({ lotId, lotTitle, auctionId, onDeleteSuccess }: { lotId: string; lotTitle: string; auctionId: string; onDeleteSuccess: () => void }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    // Directly call the imported server action
    const result = await deleteLot(lotId, auctionId); 
    if (!result.success) {
        console.error("Failed to delete lot:", result.message);
        toast({ title: "Erro ao Excluir Lote", description: result.message, variant: "destructive" });
    } else {
        toast({ title: "Sucesso", description: "Lote excluído com sucesso." });
        onDeleteSuccess(); // Callback to refresh data
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                    <p><strong>ID do Leilão:</strong> {auction.id}</p>
                    <p><strong>ID Público:</strong> {auction.publicId}</p>
                    <p><strong>Status:</strong> <Badge variant="outline" className={auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'border-green-500 text-green-600' : 'border-gray-400'}>{getAuctionStatusText(auction.status)}</Badge></p>
                    <p><strong>Data Início:</strong> {auction.auctionDate ? format(new Date(auction.auctionDate), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</p>
                    <p><strong>Data Fim (Estimada):</strong> {auction.endDate ? format(new Date(auction.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Não definida'}</p>
                    {auction.endDate && !isPast(new Date(auction.endDate)) && <p><strong>Tempo Restante:</strong> {getDaysRemaining(auction.endDate)}</p>}
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

            {auction.documentsUrl && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Documentos do Leilão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" asChild className="p-0 h-auto text-primary">
                            <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm">
                                Ver Edital/Documentos <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function EditAuctionPage({ params }: { params: { auctionId: string } }) {
  const auctionId = params.auctionId;
  const [auction, setAuction] = React.useState<Auction | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [lotsInAuction, setLotsInAuction] = React.useState<Lot[]>([]);
  const [auctioneers, setAuctioneersList] = React.useState<any[]>([]);
  const [sellers, setSellersList] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchPageData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedAuction, fetchedCategories, fetchedLots, fetchedAuctioneers, fetchedSellers] = await Promise.all([
            getAuction(auctionId),
            getLotCategories(),
            getLots(auctionId),
            getAuctioneers(),
            getSellers()
        ]);

        if (!fetchedAuction) {
            notFound();
            return;
        }
        setAuction(fetchedAuction);
        setCategories(fetchedCategories);
        setLotsInAuction(fetchedLots);
        setAuctioneersList(fetchedAuctioneers);
        setSellersList(fetchedSellers);
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


  if (isLoading || !auction) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <AuctionForm
            initialData={auction}
            categories={categories}
            auctioneers={auctioneers}
            sellers={sellers}
            onSubmitAction={async (data) => updateAuction(auctionId, data)}
            formTitle="Editar Detalhes do Leilão"
            formDescription="Modifique as informações principais, datas e configurações do leilão."
            submitButtonText="Salvar Alterações do Leilão"
          />
        </div>
        <div className="lg:col-span-1 space-y-6 sticky top-24">
            <AuctionInfoDisplay auction={auction} />
            <Card className="shadow-md">
                <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" disabled><Users className="mr-2 h-4 w-4"/> Gerenciar Habilitações (Em breve)</Button>
                    <Button variant="outline" className="w-full justify-start" disabled><BarChart2 className="mr-2 h-4 w-4"/> Ver Relatórios Detalhados (Em breve)</Button>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader><CardTitle className="text-lg flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-amber-500"/>Requer Atenção</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                   <p>Nenhum alerta crítico para este leilão no momento.</p>
                   <p className="text-xs mt-1">(Ex: Lotes sem lance inicial, datas próximas do fim, etc.)</p>
                </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader><CardTitle className="text-lg flex items-center"><ListChecks className="mr-2 h-5 w-5 text-blue-500"/>Últimos Lances Registrados</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                   <p>Funcionalidade de exibição dos últimos lances em desenvolvimento.</p>
                   <p className="text-xs mt-1">(Exibirá aqui uma lista dos lances mais recentes no leilão.)</p>
                </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader><CardTitle className="text-lg flex items-center"><PackageIcon className="mr-2 h-5 w-5 text-green-500"/>Estatísticas de Lotes</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                   <p>Total de Lotes: {auction?.totalLots || 0}</p>
                   <p>Lotes Vendidos: (Em breve)</p>
                   <p>Taxa de Venda: (Em breve)</p>
                   <p className="text-xs mt-1">(Mais estatísticas sobre o desempenho dos lotes serão exibidas aqui.)</p>
                </CardContent>
            </Card>
        </div>
      </div>

      <Separator className="my-8"/>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lotes do Leilão ({lotsInAuction.length})</CardTitle>
            <CardDescription>Lista de lotes associados a este leilão.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/admin/lots/new?auctionId=${auction.publicId || auctionId}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Lote
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lotsInAuction.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum lote encontrado para este leilão.</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID Lote</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead>Encerra em</TableHead>
                    <TableHead className="text-right w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotsInAuction.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono text-xs">{lot.publicId ? lot.publicId.substring(0,10) : lot.id.substring(0,10)}{ (lot.publicId || lot.id).length > 10 ? '...' : ''}</TableCell>
                      <TableCell className="font-medium">{lot.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getLotStatusColor(lot.status)} border-current`}>
                            {getAuctionStatusText(lot.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lot.endDate ? format(new Date(lot.endDate), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700">
                          <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700">
                          <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteLotButton lotId={lot.publicId || lot.id} lotTitle={lot.title} auctionId={auction.publicId || auctionId} onDeleteSuccess={fetchPageData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
