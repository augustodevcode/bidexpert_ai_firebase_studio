// src/app/dashboard/bids/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, ListFilter, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback } from 'react';
import type { UserBid } from '@/types';
import { getBidsForUser } from './actions';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import Link from 'next/link';

export default function MyBidsPage() {
  const { userProfileWithPermissions } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<UserBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBids = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userBids = await getBidsForUser(userId);
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
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando seus lances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Meu Lance (R$)</TableHead>
                  <TableHead>Lance Atual (R$)</TableHead>
                  <TableHead>Status da Disputa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <Link href={`/auctions/${bid.lot.auctionId}/lots/${bid.lot.publicId || bid.lot.id}`} className="hover:text-primary font-medium">
                        {bid.lot.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">Leilão: {bid.lot.auctionName}</p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                     <TableCell>
                      {bid.lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {getAuctionStatusText(bid.bidStatus)}
                    </TableCell>
                    <TableCell>
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/auctions/${bid.lot.auctionId}/lots/${bid.lot.publicId || bid.lot.id}`}>Ver Lote</Link>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
