
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDirectSaleOffers, deleteDirectSaleOffer } from './actions';
import type { DirectSaleOffer } from '@/types';
import { PlusCircle, Edit, Trash2, ShoppingCart, AlertTriangle, Loader2, Eye, ArrowUpDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

function DeleteOfferButton({ offerId, offerTitle, onDeleteSuccess }: { offerId: string; offerTitle: string; onDeleteSuccess: () => void }) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDirectSaleOffer(offerId);
    if (result.success) {
      toast({ title: "Sucesso", description: "Oferta excluída com sucesso." });
      onDeleteSuccess();
    } else {
      toast({ title: "Erro", description: result.message || "Falha ao excluir oferta.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-8 w-8" aria-label="Excluir Oferta" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Oferta</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza que deseja excluir a oferta "{offerTitle}"?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminDirectSalesPage() {
  const [offers, setOffers] = useState<DirectSaleOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    title: '',
    status: '',
    offerType: '',
    sellerName: '',
  });

  const [sorting, setSorting] = useState<{ id: keyof DirectSaleOffer | 'price'; desc: boolean }>({
    id: 'expiresAt',
    desc: false,
  });

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedOffers = await getDirectSaleOffers();
      setOffers(fetchedOffers);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao buscar ofertas de venda direta.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);
  
  const handleFilterChange = (column: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleSort = (columnId: keyof DirectSaleOffer | 'price') => {
    setSorting(prev => ({
      id: columnId,
      desc: prev.id === columnId ? !prev.desc : false,
    }));
  };

  const filteredAndSortedOffers = useMemo(() => {
    let filtered = offers.filter(offer => 
        offer.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        (filters.status === '' || offer.status.toLowerCase().includes(filters.status.toLowerCase())) &&
        (filters.offerType === '' || (offer.offerType === 'BUY_NOW' && 'comprar já'.includes(filters.offerType.toLowerCase())) || (offer.offerType === 'ACCEPTS_PROPOSALS' && 'aceita propostas'.includes(filters.offerType.toLowerCase()))) &&
        offer.sellerName.toLowerCase().includes(filters.sellerName.toLowerCase())
    );

    if (sorting.id) {
        filtered.sort((a, b) => {
            let valA, valB;
            if (sorting.id === 'price') {
                valA = a.price ?? a.minimumOfferPrice ?? 0;
                valB = b.price ?? b.minimumOfferPrice ?? 0;
            } else {
                valA = a[sorting.id as keyof DirectSaleOffer] ?? '';
                valB = b[sorting.id as keyof DirectSaleOffer] ?? '';
            }

            if (valA < valB) return sorting.desc ? 1 : -1;
            if (valA > valB) return sorting.desc ? -1 : 1;
            return 0;
        });
    }

    return filtered;
  }, [offers, filters, sorting]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando ofertas...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center"><ShoppingCart className="h-6 w-6 mr-2 text-primary" />Gerenciar Venda Direta</CardTitle>
              <CardDescription>Adicione, edite ou remova ofertas de venda direta.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/direct-sales/new"><PlusCircle className="mr-2 h-4 w-4" /> Nova Oferta</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma oferta encontrada.</p>
                <p className="text-sm">Comece adicionando uma nova oferta de venda direta.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('title')}>
                          Título <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('status')}>
                          Status <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('offerType')}>
                          Tipo <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('price')}>
                          Preço / Prop. Mín. <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('sellerName')}>
                          Vendedor <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                         <Button variant="ghost" onClick={() => handleSort('expiresAt')}>
                          Expira em <ArrowUpDown className="ml-2 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                     <TableRow className="bg-secondary/40 hover:bg-secondary/60">
                        <TableCell className="p-1"><Input placeholder="Filtrar..." value={filters.title} onChange={(e) => handleFilterChange('title', e.target.value)} className="h-8"/></TableCell>
                        <TableCell className="p-1"><Input placeholder="Filtrar..." value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="h-8"/></TableCell>
                        <TableCell className="p-1"><Input placeholder="Filtrar..." value={filters.offerType} onChange={(e) => handleFilterChange('offerType', e.target.value)} className="h-8"/></TableCell>
                        <TableCell className="p-1"></TableCell>
                        <TableCell className="p-1"><Input placeholder="Filtrar..." value={filters.sellerName} onChange={(e) => handleFilterChange('sellerName', e.target.value)} className="h-8"/></TableCell>
                        <TableCell className="p-1"></TableCell>
                        <TableCell className="p-1"></TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedOffers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.title}</TableCell>
                        <TableCell><Badge variant={offer.status === 'ACTIVE' ? 'default' : 'secondary'}>{offer.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{offer.offerType === 'BUY_NOW' ? 'Comprar Já' : 'Aceita Propostas'}</TableCell>
                        <TableCell className="font-mono text-xs">R$ {(offer.price || offer.minimumOfferPrice || 0).toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{offer.sellerName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{offer.expiresAt ? format(new Date(offer.expiresAt), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-sky-600 hover:text-sky-700 h-8 w-8" aria-label="Ver Oferta">
                                <Link href={`/direct-sales/${offer.id}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver Oferta</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 h-8 w-8" aria-label="Editar Oferta">
                                <Link href={`/admin/direct-sales/${offer.id}/edit`}><Edit className="h-4 w-4" /></Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Oferta</p></TooltipContent>
                          </Tooltip>
                          <DeleteOfferButton offerId={offer.id} offerTitle={offer.title} onDeleteSuccess={fetchOffers} />
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
