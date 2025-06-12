
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAuctioneers, deleteAuctioneer } from './actions';
import type { AuctioneerProfileInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Landmark, AlertTriangle, ExternalLink } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function DeleteAuctioneerButton({ auctioneerId, auctioneerName, onDelete }: { auctioneerId: string; auctioneerName: string; onDelete: () => void }) {

  const { toast } = useToast();

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Leiloeiro">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Leiloeiro</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o leiloeiro "{auctioneerName}" (ID: {auctioneerId})? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={async () => {
                const result = await deleteAuctioneer(auctioneerId);
                if (result.success) {
                  toast({ title: "Sucesso", description: "Leiloeiro excluído com sucesso.", variant: "default" });
                } else {
                  // If deletion fails, show error toast.
                  toast({ title: "Erro", description: result.error || "Falha ao excluir leiloeiro.", variant: "destructive" });
                }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminAuctioneersPage() { // Agora um Client Component
  const [auctioneers, setAuctioneers] = useState<AuctioneerProfileInfo[]>([]); // Estado para leiloeiros
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuctioneers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAuctioneers = await getAuctioneers();
      setAuctioneers(fetchedAuctioneers);
    } catch (error) {
      console.error("Error fetching auctioneers:", error);
      toast({ title: "Erro", description: "Falha ao buscar leiloeiros.", variant: "destructive" });
      setAuctioneers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAuctioneers();
  }, [fetchAuctioneers]);

  const handleDeleteAuctioneer = useCallback(async () => {
    await fetchAuctioneers(); // Refetch auctioneers after deletion
  }, [fetchAuctioneers]);

  if (isLoading) {
    // Renderiza o estado de loading enquanto busca os dados
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando leiloeiros...</p>
      </div>
    );
  }

  return (
    // Conteúdo da página renderizado após o carregamento
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Landmark className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Leiloeiros
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova leiloeiros da plataforma.
              </CardDescription>
            </div>
            <Button asChild> {/* Botão "Novo Leiloeiro" */}
              <Link href="/admin/auctioneers/new"> {/* Link para a página de criação */}
                <span> {/* Wrap icon and text in a span */}
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro {/* Ícone e texto */}
                </span>
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {auctioneers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum leiloeiro encontrado.</p>
                <p className="text-sm">Comece adicionando um novo leiloeiro.</p>
              </div>
            ) : ( // Se houver leiloeiros, renderiza a tabela
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Logo</TableHead>
                      <TableHead className="min-w-[200px]">Nome</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody> {/* Corpo da tabela com os dados dos leiloeiros */}
                    {auctioneers.map((auctioneer) => ( // Mapeia sobre a lista de leiloeiros
                      <TableRow key={auctioneer.id}>
                        <TableCell> {/* Célula para a logo */}
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/40x40.png?text=${auctioneer.name.charAt(0)}`} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
                            <AvatarFallback>{auctioneer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{auctioneer.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{auctioneer.registrationNumber || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{auctioneer.email || '-'}</TableCell> {/* Célula para o email */}
                        <TableCell className="text-xs text-muted-foreground">{auctioneer.phone || '-'}</TableCell> {/* Célula para o telefone */}
                        <TableCell className="text-right"> {/* Célula para as ações */}
                          <Tooltip> {/* Tooltip para o botão "Ver Leiloeiro" */}
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-sky-600 hover:text-sky-700" disabled aria-label="Ver Leiloeiro">
                                {/* Link para a página pública do leiloeiro (a ser criada) */}
                                {/* <Link href={`/auctioneers/${auctioneer.slug}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link> */}
                                 <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Leiloeiro (Em breve)</p></TooltipContent>
                          </Tooltip> {/* Fim do Tooltip "Ver Leiloeiro" */}
                          <Tooltip> {/* Tooltip para o botão "Editar Leiloeiro" */}
                            <TooltipTrigger asChild> {/* Trigger do tooltip */}
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Leiloeiro">
                                <Link href={`/admin/auctioneers/${auctioneer.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Leiloeiro</p></TooltipContent>
                           </Tooltip> {/* Fim do Tooltip "Editar Leiloeiro" */}
                          <DeleteAuctioneerButton auctioneerId={auctioneer.id} auctioneerName={auctioneer.name} onDelete={handleDeleteAuctioneer} />
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
