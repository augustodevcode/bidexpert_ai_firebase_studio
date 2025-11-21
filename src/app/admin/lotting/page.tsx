// src/app/admin/lotting/page.tsx
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Boxes, Box, FileText, Loader2, AlertCircle, Package, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

import { getJudicialProcesses } from '../judicial-processes/actions';
import { getAuctions } from '../auctions/actions';
import { createLot } from '../lots/actions';
import { getLottingSnapshotAction } from './actions';
import type { JudicialProcess, Asset, Auction } from '@/types';
import type { LottingFilterState, LottingSnapshot } from '@/types/lotting';
import CreateLotFromAssetsModal from '@/components/admin/lotting/create-lot-modal';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';
import { createColumns } from '@/components/admin/lotting/columns';
import EntitySelector from '@/components/ui/entity-selector';

const severityStyles = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-800',
} as const;

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function LoteamentoPage() {
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filters, setFilters] = useState<LottingFilterState>({ includeGroupedAssets: false, onlyHighlighted: false, minimumValuation: 0 });
  const [snapshot, setSnapshot] = useState<LottingSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState<Asset | null>(null);
  const { toast } = useToast();

  const selectedAuctionId = filters.auctionId ?? '';
  const selectedAuction = auctions.find(a => a.id === selectedAuctionId);
  const assets = snapshot?.assets ?? [];

  const processOptions = useMemo(() => processes.map(p => ({
    value: p.id,
    label: `${p.processNumber} · ${(p.assetCount ?? 0).toString()} bens · ${(p.lotCount ?? 0).toString()} lotes${p.courtName ? ` · ${p.courtName}` : ''}`,
  })), [processes]);

  const auctionOptions = useMemo(() => auctions.map(a => {
    const formattedDate = a.auctionDate ? new Date(a.auctionDate).toLocaleDateString('pt-BR') : 'Data não definida';
    return {
      value: a.id,
      label: `${a.title} · ${a.status ?? 'Sem status'} · ${formattedDate} · ${a.totalLots ?? 0} lotes`,
    };
  }), [auctions]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedProcesses, fetchedAuctions] = await Promise.all([
        getJudicialProcesses(),
        getAuctions()
      ]);
      setProcesses(fetchedProcesses);
      setAuctions(fetchedAuctions);
    } catch (e) {
      setError('Falha ao buscar dados iniciais.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSnapshot = useCallback(async (targetFilters: LottingFilterState) => {
    setIsSnapshotLoading(true);
    try {
      const data = await getLottingSnapshotAction(targetFilters);
      setSnapshot(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Falha ao buscar os dados de loteamento.');
    } finally {
      setIsSnapshotLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchSnapshot(filters);
  }, [filters.judicialProcessId, filters.auctionId, filters.includeGroupedAssets, filters.onlyHighlighted, filters.minimumValuation, fetchSnapshot]);

  useEffect(() => {
    setRowSelection({});
  }, [assets.length]);

  const selectedAssets = useMemo(() => {
    const selectedIndices = Object.keys(rowSelection).map(Number);
    return selectedIndices.map(index => assets[index]).filter(Boolean) as Asset[];
  }, [rowSelection, assets]);

  const handleCreateGroupedLotClick = () => {
    if (selectedAssets.length === 0 || !selectedAuctionId) {
      toast({
        title: 'Seleção incompleta',
        description: 'Selecione um leilão e ao menos um ativo.',
        variant: 'destructive',
      });
      return;
    }
    setIsLotModalOpen(true);
  };

  const handleCreateIndividualLotsClick = async () => {
    if (selectedAssets.length === 0 || !selectedAuctionId) {
      toast({ title: 'Seleção incompleta', description: 'Selecione um leilão e ativos.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const asset of selectedAssets) {
      const lotNumber = String(Math.floor(Math.random() * 900) + 100);
      const newLotData = {
        title: asset.title,
        number: lotNumber,
        price: asset.evaluationValue || 0,
        initialPrice: asset.evaluationValue || 0,
        status: 'EM_BREVE',
        auctionId: selectedAuctionId,
        sellerId: selectedAuction?.sellerId,
        categoryId: asset.categoryId,
        type: asset.categoryId,
        assetIds: [asset.id],
        imageUrl: asset.imageUrl,
        dataAiHint: asset.dataAiHint,
      };
      const result = await createLot(newLotData as any);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao criar lote para "${asset.title}"`, description: result.message, variant: 'destructive' });
      }
    }

    toast({
      title: 'Processamento concluído',
      description: `${successCount} lote(s) criado(s). ${errorCount ? `${errorCount} falharam.` : ''}`,
    });

    setRowSelection({});
    fetchSnapshot(filters);
    setIsSubmitting(false);
  };

  const handleViewAssetDetails = (asset: Asset) => {
    setSelectedAssetForModal(asset);
    setIsAssetModalOpen(true);
  };

  const handleFilterChange = (partial: Partial<LottingFilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  };

  const handleRefreshSnapshot = () => fetchSnapshot(filters);

  const columns = useMemo(() => createColumns({ onOpenDetails: handleViewAssetDetails }), [handleViewAssetDetails]);

  const renderKpis = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-ai-id="lotting-kpi-grid">
      {(snapshot?.kpis ?? []).map(kpi => (
        <Card key={kpi.id} data-ai-id={`lotting-kpi-card-${kpi.id}`}>
          <CardHeader className="pb-2">
            <CardDescription>{kpi.label}</CardDescription>
            <CardTitle className="text-2xl">{kpi.value}</CardTitle>
          </CardHeader>
          {kpi.helperText && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{kpi.helperText}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  const renderAlerts = () => (
    <Card data-ai-id="lotting-alerts-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas judiciais
          </CardTitle>
          <CardDescription>Monitoramento inteligente do processo selecionado.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefreshSnapshot} data-ai-id="lotting-alerts-refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {(snapshot?.alerts ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum alerta pendente.</p>
        )}
        {(snapshot?.alerts ?? []).map(alert => (
          <div key={alert.id} className="rounded-md border p-3 space-y-1" data-ai-id={`lotting-alert-${alert.id}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityStyles[alert.severity]}`}>
                {alert.severity === 'high' ? 'Crítico' : alert.severity === 'medium' ? 'Atenção' : 'Info'}
              </span>
              {alert.relatedProcessNumber && <span className="text-xs text-muted-foreground">Proc. {alert.relatedProcessNumber}</span>}
            </div>
            <p className="font-semibold text-sm">{alert.title}</p>
            <p className="text-xs text-muted-foreground">{alert.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderLotsSummary = () => (
    <Card data-ai-id="lotting-lots-summary">
      <CardHeader>
        <CardTitle className="text-base">Lotes recentes</CardTitle>
        <CardDescription>Visão rápida dos lotes vinculados ao filtro atual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(snapshot?.groupedLots ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum lote encontrado com os filtros atuais.</p>
        )}
        {(snapshot?.groupedLots ?? []).map(lot => (
          <div key={lot.id} className="flex items-center justify-between rounded-md border p-3" data-ai-id={`lotting-lot-${lot.id}`}>
            <div>
              <p className="font-semibold text-sm">{lot.number ? `Lote ${lot.number}` : `Lote ${lot.id.slice(-4)}`}</p>
              <p className="text-xs text-muted-foreground">{lot.title}</p>
              <p className="text-xs text-muted-foreground">{lot.assetCount} ativo(s) · {formatCurrency(lot.valuation)}</p>
            </div>
            <Badge variant="secondary">{lot.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6">
        <Card className="shadow-lg" data-ai-id="lotting-filters-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Boxes className="h-6 w-6 mr-2 text-primary" />
              Loteamento de Ativos
            </CardTitle>
            <CardDescription>
              Combine filtros judiciais, sinais de IA e KPIs para criar lotes inteligentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>1. Processo judicial</Label>
                <EntitySelector
                  value={filters.judicialProcessId ?? null}
                  onChange={(value) => handleFilterChange({ judicialProcessId: value || undefined })}
                  options={processOptions}
                  placeholder={isLoading ? 'Carregando...' : 'Selecione um processo'}
                  searchPlaceholder="Buscar processo..."
                  emptyStateMessage="Nenhum processo encontrado"
                  entityName="processo judicial"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>2. Leilão de destino</Label>
                <EntitySelector
                  value={selectedAuctionId || null}
                  onChange={(value) => handleFilterChange({ auctionId: value || undefined })}
                  options={auctionOptions}
                  placeholder={isLoading ? 'Carregando...' : 'Selecione um leilão'}
                  searchPlaceholder="Buscar leilão..."
                  emptyStateMessage="Nenhum leilão encontrado"
                  entityName="leilão"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Card data-ai-id="lotting-toggle-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Preferências inteligentes</CardTitle>
                <CardDescription>Refine os ativos sugeridos pela IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Incluir ativos já loteados</p>
                    <p className="text-xs text-muted-foreground">Mostra ativos em lotes existentes.</p>
                  </div>
                  <Switch checked={!!filters.includeGroupedAssets} onCheckedChange={(value) => handleFilterChange({ includeGroupedAssets: value })} data-ai-id="lotting-toggle-include-grouped" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Somente ativos sinalizados</p>
                    <p className="text-xs text-muted-foreground">Usa dicas de IA para priorizar ativos.</p>
                  </div>
                  <Switch checked={!!filters.onlyHighlighted} onCheckedChange={(value) => handleFilterChange({ onlyHighlighted: value })} data-ai-id="lotting-toggle-ai" />
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Valor mínimo</span>
                    <span>{formatCurrency(filters.minimumValuation ?? 0)}</span>
                  </div>
                  <Slider
                    value={[filters.minimumValuation ?? 0]}
                    max={1000000}
                    step={50000}
                    onValueChange={(value) => handleFilterChange({ minimumValuation: value[0] })}
                    data-ai-id="lotting-slider-valuation"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2" data-ai-id="lotting-assets-title"><Package className="h-4 w-4" /> Ativos compatíveis</CardTitle>
                  <CardDescription>Selecione ativos para loteamento.</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleCreateIndividualLotsClick} variant="outline" disabled={selectedAssets.length === 0 || isSubmitting} data-ai-id="lotting-action-individual">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Box className="mr-2 h-4 w-4" />}
                    Lotear individualmente
                  </Button>
                  <Button onClick={handleCreateGroupedLotClick} disabled={selectedAssets.length === 0 || isSubmitting} data-ai-id="lotting-action-grouped">
                    <Boxes className="mr-2 h-4 w-4" /> Agrupar em lote único
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isSnapshotLoading ? (
                  <div className="flex items-center justify-center h-48"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando ativos...</div>
                ) : filters.judicialProcessId && assets.length === 0 ? (
                  <div className="text-center py-10"><AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><p>Nenhum ativo disponível encontrado para este processo.</p></div>
                ) : !filters.judicialProcessId ? (
                  <div className="text-center py-10"><FileText className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><p>Selecione um processo para visualizar os ativos associados.</p></div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={assets}
                    rowSelection={rowSelection}
                    setRowSelection={setRowSelection}
                    searchColumnId="title"
                    searchPlaceholder="Buscar por título do ativo..."
                  />
                )}
                {error && <p className="text-xs text-destructive mt-3">{error}</p>}
              </CardContent>
            </Card>

            {renderKpis()}

            <div className="grid lg:grid-cols-2 gap-4">
              {renderAlerts()}
              {renderLotsSummary()}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLotModalOpen && (
        <CreateLotFromAssetsModal
          isOpen={isLotModalOpen}
          onClose={() => setIsLotModalOpen(false)}
          selectedAssets={selectedAssets}
          auctionId={selectedAuctionId}
          sellerId={selectedAuction?.sellerId}
          onLotCreated={() => fetchSnapshot(filters)}
        />
      )}
      <AssetDetailsModal
        asset={selectedAssetForModal}
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
      />
    </>
  );
}
