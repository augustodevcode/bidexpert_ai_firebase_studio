
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSellers, deleteSeller } from './actions';
import type { SellerProfileInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Users, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
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

// Renomeado para DeleteSellerButtonClient para clareza, já que é um Client Component
function DeleteSellerButtonClient({ sellerId, sellerName, onDeleteSuccess }: { sellerId: string; sellerName: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteSeller(sellerId); // Chama a Server Action importada
    if (result.success) {
      toast({ title: "Sucesso", description: "Comitente excluído com sucesso.", variant: "default" });
      onDeleteSuccess();
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir comitente.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label="Excluir Comitente" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Comitente</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o comitente "{sellerName}" (ID: {sellerId})? Esta ação não pode ser desfeita.
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

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSellers = await getSellers();
      setSellers(fetchedSellers);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast({ title: "Erro", description: "Falha ao buscar comitentes.", variant: "destructive" });
      setSellers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando comitentes...</p>
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
                <Users className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Comitentes
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova comitentes/vendedores da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/sellers/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {sellers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhum comitente encontrado.</p>
                <p className="text-sm">Comece adicionando um novo comitente.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Logo</TableHead>
                      <TableHead className="min-w-[200px]">Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={seller.logoUrl || `https://placehold.co/40x40.png?text=${seller.name.charAt(0)}`} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || "logo comitente"} />
                            <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{seller.email || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{seller.phone || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {seller.city && seller.state ? `${seller.city} - ${seller.state}` : seller.city || seller.state || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700" disabled aria-label="Ver Comitente">
                                {/* Link para a página pública do comitente (a ser criada) */}
                                {/* <Link href={`/sellers/${seller.slug}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link> */}
                                 <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Comitente (Em breve)</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Comitente">
                                <Link href={`/admin/sellers/${seller.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Comitente</p></TooltipContent>
                          </Tooltip>
                          <DeleteSellerButtonClient sellerId={seller.id} sellerName={seller.name} onDeleteSuccess={fetchSellers} />
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

    