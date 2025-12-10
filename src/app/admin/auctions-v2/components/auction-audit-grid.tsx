// src/app/admin/auctions-v2/components/auction-audit-grid.tsx
/**
 * @fileoverview Componente de grid de histórico de auditoria do leilão.
 * Exibe as alterações realizadas no leilão em formato de timeline/tabela.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  History, 
  Eye, 
  RefreshCw, 
  User, 
  ArrowRight,
  FileEdit,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionAuditHistoryV2 } from '@/app/admin/auctions-v2/actions';

interface AuditEntry {
  id: string;
  action: string;
  changedBy: string;
  changedAt: Date;
  changes: Record<string, { old: unknown; new: unknown }>;
}

interface AuctionAuditGridProps {
  auctionId: string;
}

// Mapeia nomes de campos para labels amigáveis
const fieldLabels: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  status: 'Status',
  auctionType: 'Modalidade',
  auctionMethod: 'Método',
  participation: 'Participação',
  auctioneerId: 'Leiloeiro',
  sellerId: 'Comitente',
  categoryId: 'Categoria',
  imageUrl: 'Imagem',
  onlineUrl: 'URL Online',
  street: 'Rua',
  number: 'Número',
  neighborhood: 'Bairro',
  cityId: 'Cidade',
  stateId: 'Estado',
  zipCode: 'CEP',
  softCloseEnabled: 'Soft Close',
  softCloseMinutes: 'Minutos Soft Close',
  isFeaturedOnMarketplace: 'Destaque',
  allowInstallmentBids: 'Parcelamento',
  auctionStages: 'Praças',
};

// Mapeia ações para labels e cores
const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATE: { 
    label: 'Criação', 
    color: 'bg-green-500', 
    icon: <Plus className="h-4 w-4" /> 
  },
  UPDATE: { 
    label: 'Atualização', 
    color: 'bg-blue-500', 
    icon: <FileEdit className="h-4 w-4" /> 
  },
  DELETE: { 
    label: 'Exclusão', 
    color: 'bg-red-500', 
    icon: <Trash2 className="h-4 w-4" /> 
  },
};

// Formata valor para exibição
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `${value.length} item(s)`;
    return JSON.stringify(value);
  }
  return String(value);
};

export default function AuctionAuditGrid({ auctionId }: AuctionAuditGridProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSelectedEntry] = useState<AuditEntry | null>(null);

  const fetchAuditHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const entries = await getAuctionAuditHistoryV2(auctionId);
      setAuditEntries(entries);
    } catch (e) {
      setError('Falha ao carregar histórico de auditoria.');
      console.error('Error fetching audit history:', e);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAuditHistory();
  }, [fetchAuditHistory]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
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
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchAuditHistory}>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
          <CardDescription>
            {auditEntries.length} registro(s) de alteração
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAuditHistory}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {auditEntries.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma alteração registrada ainda.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead className="w-[100px] text-center">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => {
                  const config = actionConfig[entry.action] || actionConfig.UPDATE;
                  const changesCount = Object.keys(entry.changes).length;
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge className={`${config.color} text-white flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{entry.changedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(new Date(entry.changedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.changedAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {changesCount} campo(s)
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Badge className={`${config.color} text-white`}>
                                  {config.label}
                                </Badge>
                                Detalhes da Alteração
                              </DialogTitle>
                              <DialogDescription>
                                Realizada por {entry.changedBy} em{' '}
                                {format(new Date(entry.changedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[400px]">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Campo</TableHead>
                                    <TableHead>Valor Anterior</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead>Novo Valor</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(entry.changes).map(([field, change]) => (
                                    <TableRow key={field}>
                                      <TableCell className="font-medium">
                                        {fieldLabels[field] || field}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        <span className="line-through">
                                          {formatValue(change.old)}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      </TableCell>
                                      <TableCell className="text-green-600 dark:text-green-400 font-medium">
                                        {formatValue(change.new)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
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
