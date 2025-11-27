// src/services/lotting.service.ts
import { prisma } from '@/lib/prisma';
import { AssetService } from './asset.service';
import type { Asset, LotStatus } from '@/types';
import type { LottingAlert, LottingFilterState, LottingKpi, LottingLotSummary, LottingSnapshot } from '@/types/lotting';

export class LottingService {
  private assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  async getSnapshot(tenantId: string, filters: LottingFilterState = {}): Promise<LottingSnapshot> {
    const [assets, lots, processDetails] = await Promise.all([
      this.assetService.getAssets(this.buildAssetFilter(tenantId, filters)),
      this.fetchLotSummaries(tenantId, filters),
      this.fetchProcessDetails(tenantId, filters.judicialProcessId)
    ]);

    const filteredAssets = this.applyClientFilters(assets, filters);
    const kpis = this.buildKpis(filteredAssets, lots);
    const alerts = this.buildAlerts(filteredAssets, lots, processDetails);

    return {
      assets: filteredAssets,
      groupedLots: lots,
      kpis,
      alerts,
    };
  }

  private buildAssetFilter(tenantId: string, filters: LottingFilterState) {
    const assetFilter: { tenantId: string; judicialProcessId?: string; status?: string } = { tenantId };
    if (filters.judicialProcessId) {
      assetFilter.judicialProcessId = filters.judicialProcessId;
    }
    if (!filters.includeGroupedAssets) {
      assetFilter.status = 'DISPONIVEL';
    }
    return assetFilter;
  }

  private applyClientFilters(assets: Asset[], filters: LottingFilterState): Asset[] {
    return assets.filter(asset => {
      if (filters.onlyHighlighted && !asset.dataAiHint) {
        return false;
      }
      if (filters.minimumValuation && (asset.evaluationValue ?? 0) < filters.minimumValuation) {
        return false;
      }
      if (!filters.includeGroupedAssets && asset.lots && asset.lots.length > 0) {
        return false;
      }
      return true;
    });
  }

  private async fetchLotSummaries(tenantId: string, filters: LottingFilterState): Promise<LottingLotSummary[]> {
    const whereClause: any = {
      tenantId: BigInt(tenantId)
    };

    if (filters.auctionId) {
      whereClause.auctionId = BigInt(filters.auctionId);
    }

    if (filters.judicialProcessId) {
      whereClause.assets = {
        some: {
          asset: {
            judicialProcessId: BigInt(filters.judicialProcessId)
          }
        }
      };
    }

    const lots = await prisma.lot.findMany({
      where: whereClause,
      include: {
        auction: { select: { id: true, title: true } },
        assets: {
          include: {
            asset: {
              select: { evaluationValue: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 12
    });

    return lots.map((lot: any) => ({
      id: lot.id.toString(),
      title: lot.title,
      status: lot.status as LotStatus,
      assetCount: lot.assets.length,
      valuation: lot.assets.reduce((acc: number, curr: any) => acc + Number(curr.asset.evaluationValue || 0), 0),
      number: lot.number,
      auctionTitle: lot.auction?.title ?? null,
      auctionId: lot.auction?.id ? lot.auction.id.toString() : null,
      updatedAt: lot.updatedAt?.toISOString(),
    }));
  }

  private async fetchProcessDetails(tenantId: string, processId?: string) {
    if (!processId) return null;
    return prisma.judicialProcess.findFirst({
      where: {
        id: BigInt(processId),
        tenantId: BigInt(tenantId)
      },
      select: {
        id: true,
        processNumber: true,
        updatedAt: true,
        lots: { select: { id: true } },
        assets: { select: { id: true, evaluationValue: true } }
      }
    });
  }

  private buildKpis(assets: Asset[], lots: LottingLotSummary[]): LottingKpi[] {
    const totalAssets = assets.length;
    const groupedAssets = assets.filter(asset => (asset.lots?.length ?? 0) > 0).length;
    const availableAssets = totalAssets - groupedAssets;
    const totalValuation = assets.reduce((sum, asset) => sum + (asset.evaluationValue ?? 0), 0);
    const highlightedAssets = assets.filter(asset => !!asset.dataAiHint).length;
    const readyLots = lots.filter(lot => ['EM_BREVE', 'RASCUNHO'].includes(lot.status)).length;

    return [
      {
        id: 'available-assets',
        label: 'Ativos disponíveis',
        value: String(Math.max(availableAssets, 0)),
        helperText: 'Prontos para loteamento'
      },
      {
        id: 'assets-grouped',
        label: 'Ativos agrupados',
        value: String(groupedAssets),
        helperText: 'Já associados a lotes'
      },
      {
        id: 'valuation',
        label: 'Valor potencial',
        value: totalValuation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        helperText: 'Soma de avaliações'
      },
      {
        id: 'ready-lots',
        label: 'Lotes em preparação',
        value: String(readyLots),
        helperText: 'Rascunho ou Em Breve'
      },
      {
        id: 'highlighted-assets',
        label: 'Ativos sinalizados',
        value: String(highlightedAssets),
        helperText: 'Sugestões da IA'
      }
    ];
  }

  private buildAlerts(assets: Asset[], lots: LottingLotSummary[], processDetails: Awaited<ReturnType<typeof this.fetchProcessDetails>>): LottingAlert[] {
    const alerts: LottingAlert[] = [];

    const assetsWithoutValuation = assets.filter(asset => !asset.evaluationValue);
    if (assetsWithoutValuation.length > 0) {
      alerts.push({
        id: 'missing-valuation',
        title: 'Ativos sem avaliação',
        description: `${assetsWithoutValuation.length} ativo(s) precisam de valor de avaliação antes do loteamento.`,
        severity: 'medium',
        relatedProcessNumber: processDetails?.processNumber ?? null,
      });
    }

    const occupiedAssets = assets.filter(asset => asset.isOccupied);
    if (occupiedAssets.length > 0) {
      alerts.push({
        id: 'occupied-assets',
        title: 'Imóveis ocupados',
        description: `${occupiedAssets.length} ativo(s) indicam ocupação e podem exigir diligência adicional.`,
        severity: 'high',
        relatedProcessNumber: processDetails?.processNumber ?? null,
      });
    }

    if (processDetails && processDetails.lots.length === 0 && assets.length > 0) {
      alerts.push({
        id: 'process-without-lots',
        title: 'Processo sem lote vinculado',
        description: 'Nenhum lote foi criado para este processo. Considere iniciar o primeiro lote.',
        severity: 'medium',
        relatedProcessNumber: processDetails.processNumber,
        dueDate: processDetails.updatedAt?.toISOString() ?? null,
      });
    }

    if (lots.length > 0 && lots.some(lot => lot.assetCount === 0)) {
      alerts.push({
        id: 'lots-without-assets',
        title: 'Lotes vazios encontrados',
        description: 'Existem lotes em rascunho sem ativos vinculados.',
        severity: 'low',
        relatedProcessNumber: processDetails?.processNumber ?? null,
      });
    }

    return alerts;
  }
}
