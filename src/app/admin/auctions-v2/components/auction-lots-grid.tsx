// src/app/admin/auctions-v2/components/auction-lots-grid.tsx
/**
 * @fileoverview Componente de grid de lotes do leilão.
 * Exibe os lotes cadastrados em formato de tabela/cards com filtros e ações.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Search,
  RefreshCw,
  PlusCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Star,
  StarOff,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
// Helper function para formatação de moeda
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import type { Lot } from '@/types';
import { getAuctionLotsV2 } from '@/app/admin/auctions-v2/actions';

interface AuctionLotsGridProps {
  auctionId: string;
  onAddLot?: () => void;
}

// Status dos lotes com cores - usando valores do enum LotStatus do Prisma
const lotStatusConfig: Record<string, { label: string; color: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-gray-500' },
  EM_BREVE: { label: 'Em Breve', color: 'bg-yellow-500' },
  ABERTO_PARA_LANCES: { label: 'Aberto para Lances', color: 'bg-blue-500' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-slate-500' },
  VENDIDO: { label: 'Vendido', color: 'bg-purple-500' },
  NAO_VENDIDO: { label: 'Não Vendido', color: 'bg-orange-500' },
  RELISTADO: { label: 'Relistado', color: 'bg-cyan-500' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-500' },
  RETIRADO: { label: 'Retirado', color: 'bg-red-500' },
};

export default function AuctionLotsGrid({ auctionId, onAddLot }: AuctionLotsGridProps) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'price' | 'title'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLots = await getAuctionLotsV2(auctionId);
      setLots(fetchedLots);
      setFilteredLots(fetchedLots);
    } catch (e) {
      setError('Falha ao carregar lotes.');
      console.error('Error fetching lots:', e);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // Filtrar e ordenar lotes
  useEffect(() => {
    let result = [...lots];

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.title?.toLowerCase().includes(term) ||
          lot.number?.toString().includes(term) ||
          lot.categoryName?.toLowerCase().includes(term)
      );
    }

    // Filtrar por status
    if (statusFilter !== 'all') {
      result = result.filter((lot) => lot.status === statusFilter);
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'number':
          comparison = Number(a.number || 0) - Number(b.number || 0);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredLots(result);
  }, [lots, searchTerm, statusFilter, sortBy, sortOrder]);

  // Estatísticas dos lotes - usando valores corretos do enum LotStatus
  const stats = {
    total: lots.length,
    available: lots.filter((l) => l.status === 'ABERTO_PARA_LANCES' || l.status === 'EM_BREVE').length,
    sold: lots.filter((l) => l.status === 'VENDIDO').length,
    totalValue: lots.reduce((sum, l) => sum + (l.price || 0), 0),
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lotes do Leilão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lotes do Leilão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchLots}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lotes do Leilão
            </CardTitle>
            <CardDescription>
              {stats.total} lote(s) • {stats.available} disponível(is) • {stats.sold} arrematado(s)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLots}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            {onAddLot && (
              <Button size="sm" onClick={onAddLot}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Lote
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total de Lotes</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.sold}</div>
            <div className="text-xs text-muted-foreground">Arrematados</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-muted-foreground">Valor Total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, número ou categoria..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(lotStatusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="price">Preço</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Lots Table */}
        {filteredLots.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {lots.length === 0
                ? 'Nenhum lote cadastrado ainda.'
                : 'Nenhum lote encontrado com os filtros aplicados.'}
            </p>
            {lots.length === 0 && onAddLot && (
              <Button className="mt-4" onClick={onAddLot}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Lote
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => {
                  const statusConfig = lotStatusConfig[lot.status || 'DISPONIVEL'] || lotStatusConfig.DISPONIVEL;
                  
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {lot.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {lot.number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative w-14 h-14 bg-muted rounded overflow-hidden">
                          {lot.imageUrl ? (
                            <Image
                              src={lot.imageUrl}
                              alt={lot.title || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">{lot.title || 'Sem título'}</p>
                          {lot.publicId && (
                            <p className="text-xs text-muted-foreground">{lot.publicId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {lot.categoryName || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(lot.price || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-white', statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/lots/${lot.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/lots/${lot.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              {lot.isFeatured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remover Destaque
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Marcar como Destaque
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/auctions/${auctionId}/lots/${lot.publicId || lot.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Página Pública
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
