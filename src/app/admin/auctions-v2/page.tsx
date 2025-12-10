// src/app/admin/auctions-v2/page.tsx
/**
 * @fileoverview Página principal de listagem de leilões V2.
 * Exibe todos os leilões com filtros, busca e opções de visualização.
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import {
  Gavel,
  PlusCircle,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ExternalLink,
  Settings,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Auction } from '@/types';
import { getAuctionsV2, deleteAuctionV2 } from '@/app/admin/auctions-v2/actions';

// Status config
const statusConfig: Record<string, { label: string; color: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-gray-500' },
  EM_PREPARACAO: { label: 'Em Preparação', color: 'bg-yellow-500' },
  EM_BREVE: { label: 'Em Breve', color: 'bg-blue-500' },
  ABERTO: { label: 'Aberto', color: 'bg-green-500' },
  ABERTO_PARA_LANCES: { label: 'Aberto para Lances', color: 'bg-emerald-500' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-orange-500' },
  FINALIZADO: { label: 'Finalizado', color: 'bg-purple-500' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-500' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-amber-500' },
};

export default function AuctionsPageV2() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { auctions: fetchedAuctions } = await getAuctionsV2({ isPublicCall: false });
      setAuctions(fetchedAuctions);
      setFilteredAuctions(fetchedAuctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar leilões.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Filter and sort auctions
  useEffect(() => {
    let result = [...auctions];

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (auction) =>
          auction.title?.toLowerCase().includes(term) ||
          auction.publicId?.toLowerCase().includes(term) ||
          auction.categoryName?.toLowerCase().includes(term) ||
          auction.auctioneerName?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((auction) => auction.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          const dateA = a.auctionDate ? new Date(a.auctionDate).getTime() : 0;
          const dateB = b.auctionDate ? new Date(b.auctionDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAuctions(result);
  }, [auctions, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este leilão?')) return;
    
    const result = await deleteAuctionV2(id);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Leilão excluído.' });
      fetchAuctions();
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: auctions.length,
    active: auctions.filter((a) => ['ABERTO', 'ABERTO_PARA_LANCES'].includes(a.status || '')).length,
    draft: auctions.filter((a) => ['RASCUNHO', 'EM_PREPARACAO'].includes(a.status || '')).length,
    completed: auctions.filter((a) => ['ENCERRADO', 'FINALIZADO'].includes(a.status || '')).length,
  }), [auctions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Gavel className="h-6 w-6 text-primary" />
              Gerenciar Leilões (V2)
            </CardTitle>
            <CardDescription>
              Nova interface para gerenciamento de leilões com recursos avançados
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/auctions-v2/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Leilão
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total de Leilões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Rascunhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, ID ou categoria..."
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
                {Object.entries(statusConfig).map(([value, config]) => (
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
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="status">Status</SelectItem>
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
            <Button variant="outline" size="icon" onClick={fetchAuctions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {auctions.length === 0
                  ? 'Nenhum leilão cadastrado ainda.'
                  : 'Nenhum leilão encontrado com os filtros aplicados.'}
              </p>
              {auctions.length === 0 && (
                <Button asChild>
                  <Link href="/admin/auctions-v2/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Criar Primeiro Leilão
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuctions.map((auction) => {
                  const status = statusConfig[auction.status || 'RASCUNHO'] || statusConfig.RASCUNHO;
                  
                  return (
                    <TableRow 
                      key={auction.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/admin/auctions-v2/${auction.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-14 h-14 bg-muted rounded overflow-hidden">
                          {auction.imageMediaId ? (
                            <div className="flex items-center justify-center h-full bg-primary/10">
                              <Gavel className="h-6 w-6 text-primary" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Gavel className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{auction.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {auction.publicId || auction.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {auction.categoryName || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {auction.auctionDate ? (
                          <span className="text-sm">
                            {format(new Date(auction.auctionDate), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {auction.totalLots || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-white', status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/auctions-v2/${auction.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/auctions-v2/${auction.id}?tab=analytics`)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/auctions/${auction.id}/auction-control-center`}>
                                <Settings className="h-4 w-4 mr-2" />
                                Central de Controle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Página Pública
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(auction.id)}
                            >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
