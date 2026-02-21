// src/components/admin/auction-preparation/tabs/lots-tab.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AuctionPreparationBid } from '@/types';
import GoToLiveAuctionButton from '@/components/auction/go-to-live-auction-button';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface LotsTabProps {
  auction: any;
  bids: AuctionPreparationBid[];
}

export function LotsTab({ auction, bids }: LotsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const lots = useMemo(() => auction?.lots ?? [], [auction?.lots]);
  const bidsByLotId = useMemo(() => {
    return bids.reduce<Record<string, AuctionPreparationBid[]>>((map, bid) => {
      if (!map[bid.lotId]) map[bid.lotId] = [];
      map[bid.lotId].push(bid);
      return map;
    }, {});
  }, [bids]);

  const statusColors: Record<string, string> = {
    RASCUNHO: 'bg-gray-500',
    EM_BREVE: 'bg-blue-500',
    ABERTO_PARA_LANCES: 'bg-green-500',
    ENCERRADO: 'bg-purple-500',
    VENDIDO: 'bg-emerald-600',
    NAO_VENDIDO: 'bg-orange-500',
    CANCELADO: 'bg-red-500',
    RELISTADO: 'bg-amber-500',
    RETIRADO: 'bg-gray-400',
  };

  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    EM_BREVE: 'Em breve',
    ABERTO_PARA_LANCES: 'Aberto',
    ENCERRADO: 'Encerrado',
    VENDIDO: 'Arrematado',
    NAO_VENDIDO: 'Não vendido',
    CANCELADO: 'Cancelado',
    RELISTADO: 'Relistado',
    RETIRADO: 'Retirado',
  };

  const filteredLots = useMemo(() => {
    return lots.filter((lot: any) =>
      lot.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lots, searchTerm]);

  const totalLots = lots.length;
  const activeLots = lots.filter((lot: any) => lot.status === 'ABERTO_PARA_LANCES').length;
  const soldLots = lots.filter((lot: any) => lot.status === 'VENDIDO').length;
  const totalValue = lots.reduce((sum: number, lot: any) => sum + (lot.initialPrice ?? lot.price ?? 0), 0);
  const averageLotValue = totalLots ? totalValue / totalLots : 0;
  const conversionRate = totalLots ? (soldLots / totalLots) * 100 : 0;
  const averageBids = totalLots
    ? Object.values(bidsByLotId).reduce((sum, lotBids) => sum + lotBids.length, 0) / totalLots
    : 0;

  const formatCurrency = (value?: number) => currencyFormatter.format(value ?? 0);

  return (
    <div className="space-y-6">
      {/* Performance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLots}</div>
            <p className="text-xs text-muted-foreground mt-1">Total disponível neste leilão</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLots}</div>
            <p className="text-xs text-muted-foreground mt-1">Disponíveis para lances</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Soma dos valores iniciais</p>
          </CardContent>
        </Card>
      </div>

      {/* Lots List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lotes do Leilão</CardTitle>
              <CardDescription>Gerencie e monitore os lotes cadastrados</CardDescription>
            </div>
            <Link href={`/admin/auctions/${auction.id}/lots/new`}>
              <Button>Adicionar Lote</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredLots.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground mb-4">Nenhum lote encontrado</p>
              <Link href={`/admin/auctions/${auction.id}/lots/new`}>
                <Button>Criar Primeiro Lote</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Lance Inicial</TableHead>
                  <TableHead>Lances</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot: any) => {
                  const lotBids = bidsByLotId[lot.id] ?? [];
                  const lastBid = lotBids[0];
                  const statusKey = lot.status as keyof typeof statusLabels;
                  return (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.number ?? '—'}</TableCell>
                      <TableCell>
                        <p className="font-medium">{lot.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lot.assets?.length ?? 0} bem(s) vinculado(s)
                        </p>
                      </TableCell>
                      <TableCell>{formatCurrency(lot.initialPrice ?? lot.price)}</TableCell>
                      <TableCell>{lotBids.length}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[statusKey] ?? 'bg-slate-500'} text-white`}>
                          {statusLabels[statusKey] ?? lot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lastBid ? (
                          <span className="text-sm font-medium">
                            Último lance {formatCurrency(lastBid.amount)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem lances</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <GoToLiveAuctionButton auction={auction} dataAiId="admin-lots-go-live-btn" />
                        <Link href={`/admin/lots/${lot.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/lots/${lot.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Indicadores de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Taxa de Conversão</span>
              <span className="font-medium">{conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Média de Lances por Lote</span>
              <span className="font-medium">{averageBids.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Valor Médio dos Lotes</span>
              <span className="font-medium">{formatCurrency(averageLotValue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
