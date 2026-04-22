/**
 * @fileoverview Aba de loteamento com KPIs de elegibilidade e filtros operacionais.
 * Permite selecionar apenas bens prontos para criação de lote.
 */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle2,
  Grid3x3,
  Package,
  Plus,
  Search,
  TriangleAlert,
} from 'lucide-react';
import type { AuctionPreparationAssetSummary } from '@/types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface LottingTabProps {
  auction: any;
  availableAssets: AuctionPreparationAssetSummary[];
}

type SourceFilter = 'all' | 'process' | 'consignor';
type ReadinessFilter = 'all' | 'ready' | 'pending';

export function LottingTab({ auction, availableAssets }: LottingTabProps) {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<SourceFilter>('all');
  const [filterReadiness, setFilterReadiness] = useState<ReadinessFilter>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(availableAssets.map((asset) => asset.status))).sort();
  }, [availableAssets]);

  const metrics = useMemo(() => {
    const readyAssets = availableAssets.filter((asset) => asset.lottingReadiness === 'READY');
    const pendingAssets = availableAssets.filter((asset) => asset.lottingReadiness === 'PENDING');
    const processAssets = availableAssets.filter((asset) => asset.source === 'PROCESS');
    const consignorAssets = availableAssets.filter((asset) => asset.source === 'CONSIGNOR');
    const readyTotalValue = readyAssets.reduce(
      (sum, asset) => sum + Number(asset.evaluationValue || 0),
      0,
    );

    return {
      total: availableAssets.length,
      readyCount: readyAssets.length,
      pendingCount: pendingAssets.length,
      processCount: processAssets.length,
      consignorCount: consignorAssets.length,
      readyTotalValue,
    };
  }, [availableAssets]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return availableAssets
      .filter((asset) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          asset.title.toLowerCase().includes(normalizedSearch) ||
          (asset.judicialProcessNumber?.toLowerCase().includes(normalizedSearch) ?? false) ||
          (asset.sellerName?.toLowerCase().includes(normalizedSearch) ?? false) ||
          (asset.categoryName?.toLowerCase().includes(normalizedSearch) ?? false) ||
          (asset.locationLabel?.toLowerCase().includes(normalizedSearch) ?? false);

        const matchesSource =
          filterSource === 'all' ||
          (filterSource === 'process' && asset.source === 'PROCESS') ||
          (filterSource === 'consignor' && asset.source === 'CONSIGNOR');

        const matchesReadiness =
          filterReadiness === 'all' ||
          (filterReadiness === 'ready' && asset.lottingReadiness === 'READY') ||
          (filterReadiness === 'pending' && asset.lottingReadiness === 'PENDING');

        const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;

        return matchesSearch && matchesSource && matchesReadiness && matchesStatus;
      })
      .sort((a, b) => {
        if (a.lottingReadiness !== b.lottingReadiness) {
          return a.lottingReadiness === 'READY' ? -1 : 1;
        }

        const valueA = Number(a.evaluationValue || 0);
        const valueB = Number(b.evaluationValue || 0);
        if (valueA !== valueB) {
          return valueB - valueA;
        }

        return a.title.localeCompare(b.title, 'pt-BR');
      });
  }, [availableAssets, filterReadiness, filterSource, filterStatus, searchTerm]);

  const selectableAssetIds = useMemo(() => {
    return filteredAssets
      .filter((asset) => asset.lottingReadiness === 'READY')
      .map((asset) => asset.id);
  }, [filteredAssets]);

  const selectedReadyAssetIds = useMemo(() => {
    return Array.from(selectedAssets).filter((assetId) => {
      const asset = availableAssets.find((item) => item.id === assetId);
      return asset?.lottingReadiness === 'READY';
    });
  }, [availableAssets, selectedAssets]);

  const allSelectableChecked =
    selectableAssetIds.length > 0 &&
    selectableAssetIds.every((assetId) => selectedAssets.has(assetId));

  const returnTo = auction?.publicId || auction?.id
    ? `/admin/auctions/${auction.publicId || auction.id}/auction-control-center?tab=lotting`
    : '/admin/auctions';

  const createLotHref =
    auction?.id && selectedReadyAssetIds.length > 0
      ? {
          pathname: '/admin/lots/new',
          query: {
            auctionId: auction.id,
            assetIds: selectedReadyAssetIds.join(','),
            returnTo,
          },
        }
      : null;

  const toggleAssetSelection = (assetId: string, checked: boolean) => {
    const asset = availableAssets.find((item) => item.id === assetId);
    if (!asset || asset.lottingReadiness !== 'READY') {
      return;
    }

    setSelectedAssets((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(assetId);
      } else {
        next.delete(assetId);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedAssets((previous) => {
      const next = new Set(previous);
      if (checked) {
        selectableAssetIds.forEach((id) => next.add(id));
      } else {
        selectableAssetIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const hasAssets = filteredAssets.length > 0;

  return (
    <div className="space-y-6" data-ai-id="auction-control-center-lotting-tab">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-ai-id="lotting-kpis">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bens mapeados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prontos para lotear</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{metrics.readyCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{metrics.pendingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Origem Judicial / Comitente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics.processCount}
              <span className="mx-1 text-muted-foreground">/</span>
              {metrics.consignorCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor pronto para lotear</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{currencyFormatter.format(metrics.readyTotalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Loteamento de Bens</CardTitle>
              <CardDescription>
                Selecione apenas bens elegíveis para criar lote com parâmetros pré-preenchidos.
              </CardDescription>
            </div>

            {createLotHref ? (
              <Link href={createLotHref}>
                <Button data-ai-id="lotting-create-lot-from-selection-btn">
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Criar Lote ({selectedReadyAssetIds.length})
                </Button>
              </Link>
            ) : (
              <Button disabled data-ai-id="lotting-create-lot-from-selection-btn-disabled">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Criar Lote ({selectedReadyAssetIds.length})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                data-ai-id="lotting-search-input"
                placeholder="Buscar por título, processo, categoria, vendedor ou localização"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filterSource}
              onValueChange={(value) => setFilterSource(value as SourceFilter)}
            >
              <SelectTrigger data-ai-id="lotting-source-filter-select">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                <SelectItem value="process">Processo judicial</SelectItem>
                <SelectItem value="consignor">Comitente</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterReadiness}
              onValueChange={(value) => setFilterReadiness(value as ReadinessFilter)}
            >
              <SelectTrigger data-ai-id="lotting-readiness-filter-select">
                <SelectValue placeholder="Elegibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ready">Somente prontos</SelectItem>
                <SelectItem value="pending">Somente pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-ai-id="lotting-status-filter-select">
                <SelectValue placeholder="Status do bem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Bens disponíveis para loteamento</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filteredAssets.length} item(ns) no filtro atual
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {!hasAssets ? (
            <div className="text-center py-12 space-y-3" data-ai-id="lotting-empty-state">
              <p className="text-muted-foreground">Nenhum bem encontrado com os filtros selecionados.</p>
              <Button variant="outline" data-ai-id="lotting-register-asset-btn">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Bem
              </Button>
            </div>
          ) : (
            <Table data-ai-id="lotting-assets-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelectableChecked}
                      onCheckedChange={(checked) => toggleSelectAllFiltered(Boolean(checked))}
                      aria-label="Selecionar todos os bens elegíveis"
                    />
                  </TableHead>
                  <TableHead>Bem</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Elegibilidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssets.has(asset.id);
                  const isReady = asset.lottingReadiness === 'READY';
                  const firstIssue = asset.lottingIssues[0];

                  return (
                    <TableRow
                      key={asset.id}
                      className={isReady ? 'hover:bg-muted/40' : 'bg-muted/30'}
                      data-ai-id={`lotting-asset-row-${asset.id}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          disabled={!isReady}
                          onCheckedChange={(checked) =>
                            toggleAssetSelection(asset.id, Boolean(checked))
                          }
                          aria-label={`Selecionar ${asset.title}`}
                        />
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium leading-tight">{asset.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {asset.judicialProcessNumber
                              ? `Processo ${asset.judicialProcessNumber}`
                              : asset.locationLabel || 'Sem processo judicial'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            asset.source === 'PROCESS'
                              ? 'border-blue-200 text-blue-700'
                              : 'border-emerald-200 text-emerald-700'
                          }
                        >
                          {asset.source === 'PROCESS' ? 'Processo Judicial' : 'Comitente'}
                        </Badge>
                      </TableCell>

                      <TableCell>{asset.categoryName ?? '—'}</TableCell>

                      <TableCell>
                        {currencyFormatter.format(Number(asset.evaluationValue || 0))}
                      </TableCell>

                      <TableCell>
                        <Badge variant={asset.status === 'DISPONIVEL' ? 'secondary' : 'outline'}>
                          {asset.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {isReady ? (
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Pronto</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-amber-700">
                              <TriangleAlert className="h-4 w-4" />
                              <span className="text-xs font-medium">Pendente</span>
                            </div>
                            {firstIssue && (
                              <p className="text-xs text-muted-foreground">{firstIssue}</p>
                            )}
                            {asset.blockingLotLabel && (
                              <p className="text-xs text-muted-foreground">
                                Bloqueio: {asset.blockingLotLabel}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diretrizes Operacionais</CardTitle>
          <CardDescription>
            Use os indicadores de elegibilidade para evitar vínculos inválidos antes de abrir o pregão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
            Apenas bens “Pronto” podem ser selecionados para gerar lote nesta central.
          </p>
          <p className="flex items-start gap-2">
            <Package className="h-4 w-4 mt-0.5 text-primary" />
            O botão “Criar Lote” leva para o formulário com `auctionId`, `assetIds` e retorno para esta aba.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
