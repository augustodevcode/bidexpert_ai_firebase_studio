// src/app/dashboard/bids/page.tsx
/**
 * @fileoverview Página "Meus Lances" do Painel do Usuário.
 * Este componente de cliente busca e exibe uma lista de todos os lances
 * que o usuário logado já fez, mostrando o status atual de cada um
 * (ex: ganhando, superado, arrematado). Permite ao usuário acompanhar
 * rapidamente suas disputas ativas e seu histórico de lances.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, ListFilter, Loader2, AlertCircle, ShoppingBag, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback } from 'react';
import type { UserBid } from '@/types';
import { getBidsForUserAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ClientOnlyDate } from '@/components/ui/data-table-column-header';

const getBidStatusInfo = (bidStatus: UserBid['bidStatus']) => {
    switch(bidStatus) {
        case 'GANHANDO':
            return { text: 'Ganhando', icon: CheckCircle, color: 'text-green-600' };
        case 'PERDENDO':
            return { text: 'Superado', icon: AlertCircle, color: 'text-yellow-600' };
        case 'ARREMATADO':
            return { text: 'Arrematado', icon: Gavel, color: 'text-blue-600' };
        case 'NAO_ARREMATADO':
            return { text: 'Não Arrematado', icon: XCircle, color: 'text-muted-foreground' };
        case 'ENCERRADO':
            return { text: 'Encerrado', icon: Clock, color: 'text-muted-foreground' };
        case 'CANCELADO':
            return { text: 'Cancelado', icon: XCircle, color: 'text-destructive' };
        default:
            return { text: 'Indefinido', icon: AlertCircle, color: 'text-muted-foreground' };
    }
}


export default function MyBidsPage() {
  const { userProfileWithPermissions } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<UserBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBids = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userBids = await getBidsForUserAction(userId);
      setBids(userBids);
    } catch (error) {
      console.error("Error fetching user bids:", error);
      toast({
        title: "Erro ao buscar lances",
        description: "Não foi possível carregar seu histórico de lances.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userProfileWithPermissions?.uid) {
      fetchBids(userProfileWithPermissions.uid);
    } else {
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, fetchBids]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]" data-ai-id="my-bids-loading-spinner">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando seus lances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-ai-id="my-bids-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Gavel className="h-7 w-7 mr-3 text-primary" />
            Meus Lances
          </CardTitle>
          <CardDescription>
            Acompanhe todos os seus lances, ativos e passados. Gerencie suas disputas e veja o histórico de suas ofertas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg" data-ai-id="my-bids-empty-state">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lance Registrado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Quando você fizer lances em itens, eles aparecerão aqui.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/search">Buscar Leilões</Link>
              </Button>
            </div>
          ) : (
            <div data-ai-id="my-bids-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Data do Lance</TableHead>
                    <TableHead className="text-right">Meu Lance</TableHead>
                    <TableHead className="text-right">Lance Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => {
                    const statusInfo = getBidStatusInfo(bid.bidStatus);
                    return (
                        <TableRow key={bid.id}>
                          <TableCell>
                            <Link href={`/auctions/${bid.lot.auctionId}/lots/${bid.lot.publicId || bid.lot.id}`} className="hover:text-primary font-medium">
                              {bid.lot.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">Leilão: {bid.lot.auctionName}</p>
                          </TableCell>
                           <TableCell className="text-sm">
                                <ClientOnlyDate date={bid.date} format="dd/MM/yyyy HH:mm"/>
                           </TableCell>
                          <TableCell className="text-right font-semibold">
                            {bid.userBidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell className="text-right">
                            {bid.lot.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                              <Badge variant="outline" className={statusInfo.color}>
                                  <statusInfo.icon className="h-3.5 w-3.5 mr-1.5"/>
                                  {statusInfo.text}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/auctions/${bid.lot.auctionId}/lots/${bid.lot.publicId || bid.lot.id}`}>Ver Lote</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
