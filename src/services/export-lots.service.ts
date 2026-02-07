/**
 * @file export-lots.service.ts
 * @description Serviço para exportação de lotes em múltiplos formatos (CSV, Excel).
 * Permite exportar listagens filtradas de lotes para relatórios e análise externa.
 * 
 * BDD Scenarios:
 * - Dado que um admin está na página de lotes
 * - Quando ele seleciona múltiplos lotes e clica em "Exportar"
 * - Então um arquivo CSV/Excel deve ser gerado com os dados selecionados
 * - E o arquivo deve conter todas as colunas relevantes
 */
'use server';

import prisma from '@/lib/prisma';
import { getCurrentTenant } from '@/lib/tenant';
import type { Lot } from '@prisma/client';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: unknown) => string;
}

export const DEFAULT_LOT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'publicId', label: 'Código Público' },
  { key: 'title', label: 'Título' },
  { key: 'description', label: 'Descrição' },
  { key: 'status', label: 'Status' },
  { key: 'startingPrice', label: 'Preço Inicial', formatter: (v) => formatCurrency(v as number) },
  { key: 'currentPrice', label: 'Preço Atual', formatter: (v) => formatCurrency(v as number) },
  { key: 'minimumIncrement', label: 'Incremento Mínimo', formatter: (v) => formatCurrency(v as number) },
  { key: 'auctionStageId', label: 'ID Praça' },
  { key: 'endDate', label: 'Data Encerramento', formatter: (v) => formatDate(v as Date) },
  { key: 'createdAt', label: 'Criado em', formatter: (v) => formatDate(v as Date) },
  { key: 'bidsCount', label: 'Qtd. Lances' },
  { key: 'views', label: 'Visualizações' },
];

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Exporta lotes para formato CSV
 * @param lotIds - IDs específicos para exportar (vazio = todos)
 * @param columns - Colunas para incluir na exportação
 * @returns String CSV
 */
export async function exportLotsToCSV(
  lotIds?: string[],
  columns: ExportColumn[] = DEFAULT_LOT_COLUMNS
): Promise<{ success: boolean; data?: string; message?: string; filename?: string }> {
  try {
    const tenant = await getCurrentTenant();

    const where = lotIds && lotIds.length > 0 
      ? { id: { in: lotIds.map(id => BigInt(id)) } }
      : {};

    const lots = await prisma.lot.findMany({
      where,
      include: {
        LotCategory: { select: { name: true } },
        Auction: { select: { title: true } },
        AuctionStage: { select: { stageNumber: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lots.length === 0) {
      return { success: false, message: 'Nenhum lote encontrado para exportação' };
    }

    // Gerar cabeçalho CSV
    const headers = columns.map(col => `"${col.label}"`).join(',');
    
    // Gerar linhas de dados
    const rows = lots.map(lot => {
      return columns.map(col => {
        const value = getNestedValue(lot, col.key);
        const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
        // Escapar aspas duplas e envolver em aspas
        return `"${formatted.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `lotes_export_${timestamp}.csv`;

    console.log(`[ExportService] CSV gerado: ${lots.length} lotes, ${csvContent.length} bytes`);

    return { 
      success: true, 
      data: csvContent,
      filename,
      message: `${lots.length} lotes exportados com sucesso`
    };
  } catch (error) {
    console.error('[ExportService] Erro ao exportar CSV:', error);
    return { success: false, message: 'Erro ao gerar arquivo CSV' };
  }
}

/**
 * Exporta lotes para formato JSON (pode ser convertido para Excel no frontend)
 * @param lotIds - IDs específicos para exportar
 */
export async function exportLotsToJSON(
  lotIds?: string[]
): Promise<{ success: boolean; data?: unknown[]; message?: string; filename?: string }> {
  try {
    const tenant = await getCurrentTenant();

    const where = lotIds && lotIds.length > 0 
      ? { id: { in: lotIds.map(id => BigInt(id)) } }
      : {};

    const lots = await prisma.lot.findMany({
      where,
      include: {
        LotCategory: { select: { name: true } },
        Auction: { select: { title: true, publicId: true } },
        AuctionStage: { select: { stageNumber: true, description: true } },
        City: { select: { name: true } },
        State: { select: { name: true, uf: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lots.length === 0) {
      return { success: false, message: 'Nenhum lote encontrado para exportação' };
    }

    // Transformar para formato plano para Excel
    const flatData = lots.map(lot => ({
      id: lot.id.toString(),
      publicId: lot.publicId,
      title: lot.title,
      description: lot.description?.substring(0, 500) || '',
      status: lot.status,
      categoryName: lot.LotCategory?.name || '',
      auctionTitle: lot.Auction?.title || '',
      auctionPublicId: lot.Auction?.publicId || '',
      stageNumber: lot.AuctionStage?.stageNumber || '',
      stageDescription: lot.AuctionStage?.description || '',
      city: lot.City?.name || '',
      state: lot.State?.uf || '',
      startingPrice: lot.startingPrice ? Number(lot.startingPrice) : 0,
      currentPrice: lot.currentPrice ? Number(lot.currentPrice) : 0,
      minimumIncrement: lot.minimumIncrement ? Number(lot.minimumIncrement) : 0,
      appraisedValue: lot.appraisedValue ? Number(lot.appraisedValue) : 0,
      bidsCount: lot.bidsCount || 0,
      views: lot.views || 0,
      endDate: lot.endDate ? new Date(lot.endDate).toISOString() : '',
      createdAt: lot.createdAt ? new Date(lot.createdAt).toISOString() : '',
      updatedAt: lot.updatedAt ? new Date(lot.updatedAt).toISOString() : '',
    }));

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `lotes_export_${timestamp}.json`;

    console.log(`[ExportService] JSON gerado: ${lots.length} lotes`);

    return { 
      success: true, 
      data: flatData,
      filename,
      message: `${lots.length} lotes exportados com sucesso`
    };
  } catch (error) {
    console.error('[ExportService] Erro ao exportar JSON:', error);
    return { success: false, message: 'Erro ao gerar arquivo JSON' };
  }
}

/**
 * Utilitário para acessar valores aninhados
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return result;
}

/**
 * Gera estatísticas resumidas dos lotes
 */
export async function getLotsExportSummary(
  lotIds?: string[]
): Promise<{ 
  success: boolean; 
  summary?: {
    totalLots: number;
    totalValue: number;
    avgValue: number;
    statusBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
  };
  message?: string 
}> {
  try {
    const where = lotIds && lotIds.length > 0 
      ? { id: { in: lotIds.map(id => BigInt(id)) } }
      : {};

    const lots = await prisma.lot.findMany({
      where,
      select: {
        startingPrice: true,
        currentPrice: true,
        status: true,
        LotCategory: { select: { name: true } }
      }
    });

    if (lots.length === 0) {
      return { success: false, message: 'Nenhum lote encontrado' };
    }

    const totalValue = lots.reduce((sum, lot) => {
      const price = lot.currentPrice || lot.startingPrice;
      return sum + (price ? Number(price) : 0);
    }, 0);

    const statusBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    lots.forEach(lot => {
      // Status breakdown
      const status = lot.status || 'SEM_STATUS';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      // Category breakdown
      const category = lot.LotCategory?.name || 'Sem Categoria';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    return {
      success: true,
      summary: {
        totalLots: lots.length,
        totalValue,
        avgValue: totalValue / lots.length,
        statusBreakdown,
        categoryBreakdown
      }
    };
  } catch (error) {
    console.error('[ExportService] Erro ao gerar sumário:', error);
    return { success: false, message: 'Erro ao gerar sumário' };
  }
}
