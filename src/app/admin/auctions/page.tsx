
'use client'; // Adicionado para permitir que DeleteAuctionButton seja um Client Component aqui

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteAuction, getAuctions } from './actions'; // getAuctions já estava, deleteAuction importado
import type { Auction } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlusCircle, Edit, Trash2, Gavel, AlertTriangle, ExternalLink } from 'lucide-react';
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
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useEffect, useState, useCallback } from 'react'; // Import useEffect, useState, useCallback
import { Loader2 } from 'lucide-react';


// Movido DeleteAuctionButton para ser um Client Component
function DeleteAuctionButtonClient({ auctionId, auctionTitle, onDeleteSuccess }: { auctionId: string; auctionTitle: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAuction(auctionId); // Chama a Server Action diretamente
    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
      onDeleteSuccess(); // Callback para atualizar a lista na página pai
    } else {
      toast({
        title: 'Erro ao Excluir',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Leilão" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Leilão</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o leilão "{auctionTitle}" (ID: {auctionId})? Esta ação não pode ser desfeita e pode afetar lotes associados.
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


export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAuctions = await getAuctions();
      setAuctions(fetchedAuctions);
    } catch (error) {
        console.error("Error fetching auctions:", error);
        toast({ title: "Erro", description: "Falha ao buscar leilões.", variant: "destructive"});
        setAuctions([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando leilões...</p>
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
                <Gavel className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Leilões
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova leilões da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/auctions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {auctions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum leilão encontrado.</p>
                <p className="text-sm">Comece adicionando um novo leilão.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Público</TableHead>
                      <TableHead className="min-w-[250px]">Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Leiloeiro</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auctions.map((auction) => (
                      <TableRow key={auction.id}>
                        <TableCell className="font-mono text-xs">{auction.publicId}</TableCell>
                        <TableCell className="font-medium">{auction.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${auction.status === 'ABERTO' || auction.status === 'ABERTO_PARA_LANCES' ? 'border-green-500 text-green-600' : auction.status === 'EM_BREVE' ? 'border-blue-500 text-blue-600' : 'border-gray-500 text-gray-600'}`}>
                            {getAuctionStatusText(auction.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {auction.auctionDate ? format(new Date(auction.auctionDate as string), 'dd/MM/yy HH:mm', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{auction.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{auction.auctioneer}</TableCell>
                        <TableCell className="text-right">
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700" aria-label="Ver Leilão">
                                <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                             </TooltipTrigger>
                             <TooltipContent><p>Ver Leilão</p></TooltipContent>
                           </Tooltip>
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Leilão">
                                <Link href={`/admin/auctions/${auction.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Leilão</p></TooltipContent>
                           </Tooltip>
                          <DeleteAuctionButtonClient auctionId={auction.id} auctionTitle={auction.title} onDeleteSuccess={fetchAuctions} />
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
