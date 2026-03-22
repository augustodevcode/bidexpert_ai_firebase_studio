// src/app/admin/lots-v2/page.tsx
/**
 * @fileoverview Página principal de listagem de Lotes V2.
 * Exibe todos os lotes com cards de estatísticas, filtros avançados,
 * busca em tempo real e DataTable com TanStack Table.
 * Suporta operações em lote (bulk delete, bulk status update).
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckSquare,
  TrendingUp,
  DollarSign,
  Gavel,
  ShoppingBag,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { createColumnsV2 } from './columns';
import { getLotsV2, deleteLotV2, deleteLotsV2Bulk, updateLotsStatusV2Bulk } from './actions';
import { LOT_STATUS_LABELS, LOT_STATUS_COLORS } from './lot-form-schema-v2';
import { lotStatusValues } from '@/lib/zod-enums';
import type { Lot } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompact } from '@/lib/format';
import type { BulkAction } from '@/components/ui/data-table-toolbar';

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  colorClass?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, colorClass = '', isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className={cn('text-2xl font-bold mt-1', colorClass)}>{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LotsPageV2() {
  const router = useRouter();
  const { toast } = useToast();

  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLotsV2();
      if (result.success && result.data) {
        setLots(result.data.lots);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('[fetchLots]', error);
      setError('Falha ao carregar lotes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // ─── Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = lots.length;
    const active = lots.filter((l) =>
      ['ABERTO_PARA_LANCES', 'EM_PREGAO'].includes(l.status ?? ''),
    ).length;
    const sold = lots.filter((l) => l.status === 'VENDIDO').length;
    const draft = lots.filter((l) => l.status === 'RASCUNHO').length;
    const totalValue = lots.reduce((sum, l) => sum + (l.price ?? 0), 0);
    return { total, active, sold, draft, totalValue };
  }, [lots]);

  // ─── Filter ─────────────────────────────────────────────────────────
  const filteredLots = useMemo(() => {
    if (statusFilter === 'all') return lots;
    return lots.filter((l) => l.status === statusFilter);
  }, [lots, statusFilter]);

  // ─── Delete ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.'))
        return;
      const result = await deleteLotV2(id);
      if (result.success) {
        toast({ title: 'Lote excluído.', description: result.message });
        setLots((prev) => prev.filter((l) => l.id !== id));
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    },
    [toast],
  );

  // ─── Columns ────────────────────────────────────────────────────────
  const columns = useMemo(() => createColumnsV2({ onDelete: handleDelete }), [handleDelete]);

  // ─── Bulk actions ────────────────────────────────────────────────────
  const bulkActions: BulkAction<Lot>[] = useMemo(
    () => [
      {
        label: 'Excluir Selecionados',
        icon: Trash2,
        variant: 'destructive' as const,
        action: async (selected) => {
          if (
            !confirm(
              `Excluir ${selected.length} lote(s) selecionado(s)? Esta ação não pode ser desfeita.`,
            )
          )
            return;
          const result = await deleteLotsV2Bulk({ ids: selected.map((l) => l.id) });
          if (result.success) {
            toast({ title: 'Lotes excluídos.', description: result.message });
            await fetchLots();
            setRowSelection({});
          } else {
            toast({ title: 'Erro', description: result.message, variant: 'destructive' });
          }
        },
      },
      {
        label: 'Marcar como Em Breve',
        icon: CheckSquare,
        action: async (selected) => {
          const result = await updateLotsStatusV2Bulk({
            ids: selected.map((l) => l.id),
            status: 'EM_BREVE',
          });
          if (result.success) {
            toast({ title: 'Status atualizado.', description: result.message });
            await fetchLots();
            setRowSelection({});
          } else {
            toast({ title: 'Erro', description: result.message, variant: 'destructive' });
          }
        },
      },
    ],
    [toast, fetchLots],
  );

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" data-ai-id="admin-lots-v2-page">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Gerenciar Lotes (V2)
            </CardTitle>
            <CardDescription>
              Nova interface com operações em lote, filtros avançados e DataTable TanStack.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchLots} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              <span className="sr-only">Recarregar</span>
            </Button>
            <Button asChild data-ai-id="btn-new-lot">
              <Link href="/admin/lots-v2/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Lote
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Lotes"
          value={stats.total}
          description="Todos os lotes cadastrados"
          icon={Package}
          isLoading={isLoading}
        />
        <StatCard
          title="Lotes Ativos"
          value={stats.active}
          description="Abertos para lances ou em pregão"
          icon={Gavel}
          colorClass="text-emerald-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Vendidos"
          value={stats.sold}
          description="Lotes arrematados com sucesso"
          icon={ShoppingBag}
          colorClass="text-indigo-600"
          isLoading={isLoading}
        />
        <StatCard
          title="Valor Total"
          value={formatCompact(stats.totalValue)}
          description="Soma dos lances mínimos"
          icon={DollarSign}
          colorClass="text-primary"
          isLoading={isLoading}
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-muted-foreground font-medium">Filtrar por status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({lots.length})</SelectItem>
                {lotStatusValues.map((s) => {
                  const count = lots.filter((l) => l.status === s).length;
                  return (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-block h-2 w-2 rounded-full',
                            LOT_STATUS_COLORS[s]?.includes('emerald')
                              ? 'bg-emerald-500'
                              : LOT_STATUS_COLORS[s]?.includes('indigo')
                                ? 'bg-indigo-500'
                                : LOT_STATUS_COLORS[s]?.includes('yellow')
                                  ? 'bg-yellow-500'
                                  : LOT_STATUS_COLORS[s]?.includes('destructive')
                                    ? 'bg-red-500'
                                    : 'bg-muted-foreground',
                          )}
                        />
                        {LOT_STATUS_LABELS[s] ?? s} ({count})
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {LOT_STATUS_LABELS[statusFilter] ?? statusFilter}
                <button
                  onClick={() => setStatusFilter('all')}
                  className="ml-1 hover:text-destructive"
                  aria-label="Remover filtro"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={filteredLots}
            isLoading={isLoading}
            error={error}
            searchColumnId="title"
            searchPlaceholder="Buscar por título, ID ou leilão..."
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            bulkActions={bulkActions}
            dataTestId="lots-v2-table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
