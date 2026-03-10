// src/app/admin/lots-v2/[lotId]/page.tsx
/**
 * @fileoverview Página de visualização e edição de um Lote V2.
 * Carrega o lote existente, exibe status atual, histórico e formulário de edição.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  ArrowLeft,
  MoreVertical,
  Trash2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Auction, LotCategory, StateInfo, CityInfo, Lot } from '@/types';
import { getLotV2, updateLotV2, deleteLotV2 } from '../actions';
import { LOT_STATUS_LABELS, LOT_STATUS_COLORS, type LotFormValuesV2 } from '../lot-form-schema-v2';
import LotFormV2 from '../components/lot-form-v2';
import { formatCurrency } from '@/lib/format';

import { getAuctions } from '@/app/admin/auctions/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

interface PageDependencies {
  auctions: Auction[];
  categories: LotCategory[];
  states: StateInfo[];
  allCities: CityInfo[];
}

export default function LotDetailPageV2() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const lotId = useMemo(() => (params?.lotId as string) || '', [params]);

  const [lot, setLot] = useState<Lot | null>(null);
  const [deps, setDeps] = useState<PageDependencies | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Load data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!lotId) return;
    setIsLoading(true);
    try {
      const [lotResult, auctions, categories, states, cities] = await Promise.all([
        getLotV2(lotId),
        getAuctions(),
        getLotCategories(),
        getStates(),
        getCities(),
      ]);

      if (!lotResult.success || !lotResult.data) {
        toast({ title: 'Erro', description: 'Lote não encontrado.', variant: 'destructive' });
        router.push('/admin/lots-v2');
        return;
      }

      setLot(lotResult.data);
      setDeps({ auctions, categories, states, allCities: cities });
    } catch (error) {
      console.error('[loadData lots-v2]', error);
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [lotId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Submit update ─────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (data: LotFormValuesV2) => {
      const result = await updateLotV2(lotId, data);
      if (result.success) {
        await loadData();
      }
      return { success: result.success, message: result.message };
    },
    [lotId, loadData],
  );

  // ─── Delete ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!confirm('Excluir este lote permanentemente? Esta ação não pode ser desfeita.')) return;
    const result = await deleteLotV2(lotId);
    if (result.success) {
      toast({ title: 'Lote excluído.', description: result.message });
      router.push('/admin/lots-v2');
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  }, [lotId, router, toast]);

  // ─── Loading state ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-24" />
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lot || !deps) return null;

  const statusColor = LOT_STATUS_COLORS[lot.status ?? 'RASCUNHO'] ?? 'bg-muted text-muted-foreground';
  const statusLabel = LOT_STATUS_LABELS[lot.status ?? 'RASCUNHO'] ?? lot.status;

  return (
    <div className="space-y-6" data-ai-id="admin-lots-v2-detail-page">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn('text-xs', statusColor)} variant="outline">
                {statusLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ID: {lot.publicId || lot.id}
              </span>
            </div>
            <CardTitle className="text-xl font-bold truncate flex items-center gap-2">
              <Package className="h-5 w-5 text-primary flex-shrink-0" />
              {lot.number ? `Lote ${lot.number}: ` : ''}{lot.title}
            </CardTitle>
            {lot.auctionName && (
              <CardDescription className="mt-1">
                Leilão:{' '}
                <Link
                  href={`/admin/auctions-v2/${lot.auctionId}`}
                  className="hover:text-primary font-medium"
                >
                  {lot.auctionName}
                </Link>
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/lots-v2">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Listagem
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Mais opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/lots/${lot.publicId || lot.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver página pública
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Lote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Summary panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Lance Mínimo</p>
            <p className="font-bold">
              {lot.price != null ? formatCurrency(lot.price) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Avaliação</p>
            <p className="font-bold">
              {lot.initialPrice != null ? formatCurrency(lot.initialPrice) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-bold capitalize">{lot.type?.toLowerCase() ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Visualizações</p>
            <p className="font-bold">{lot.views ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Edit form */}
      <LotFormV2
        initialData={lot}
        auctions={deps.auctions}
        categories={deps.categories}
        states={deps.states}
        allCities={deps.allCities}
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
