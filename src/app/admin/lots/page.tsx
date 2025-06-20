
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLots, deleteLot } from './actions';
import type { Lot } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit, Trash2, Package, AlertTriangle, Eye, Loader2 } from 'lucide-react';
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
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

function DeleteLotButtonClient({ lotId, lotTitle, auctionId, onDeleteSuccess }: { lotId: string; lotTitle: string; auctionId?: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteLot(lotId, auctionId);
    if (result.success) {
      toast({ title: "Sucesso", description: "Lote excluído com sucesso.", variant: "default" });
      onDeleteSuccess();
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir lote.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Lote" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Lote</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o lote "{lotTitle}" (ID: {lotId})? Esta ação não pode ser desfeita.
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
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default function AdminLotsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLots = await getLots();
      setLots(fetchedLots);
    } catch (error) {
      console.error("Error fetching lots:", error);
      toast({ title: "Erro", description: "Falha ao buscar lotes.", variant: "destructive" });
      setLots([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando lotes...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Lotes
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova lotes para os leilões.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/lots/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Lote
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lots.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum lote encontrado.</p>
                <p className="text-sm">Comece adicionando um novo lote.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID Lote</TableHead>
                      <TableHead className="min-w-[200px]">Título</TableHead>
                      <TableHead>Leilão ID</TableHead>
                      <TableHead>Local (Cidade/UF)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Encerr. em</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.map((lot) => (
                      <TableRow key={lot.id}>
                        <TableCell className="font-mono text-xs">{lot.id.substring(0,10)}{lot.id.length > 10 ? '...' : ''}</TableCell>
                        <TableCell className="font-medium">{lot.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lot.auctionId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || '-'}
                        </TableCell>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700" aria-label="Ver Lote">
                                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Lote</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Lote">
                                <Link href={`/admin/lots/${lot.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Lote</p></TooltipContent>
                          </Tooltip>
                          <DeleteLotButtonClient lotId={lot.id} lotTitle={lot.title} auctionId={lot.auctionId} onDeleteSuccess={fetchLots} />
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
    </TooltipProvider>
  );
}
