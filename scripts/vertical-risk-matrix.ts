/**
 * @file STR-02: Vertical Risk Matrix
 * @description Analisa riscos por vertical de leilão (Judicial, Veículos, Imóveis, etc.)
 * 
 * Análise por vertical:
 * - Taxa de conversão
 * - Ticket médio
 * - Taxa de inadimplência
 * - Tempo médio até arrematação
 * - Lotes sem lance
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface VerticalMetrics {
  vertical: string;
  totalLots: number;
  lotsWithBids: number;
  lotsSold: number;
  conversionRate: number; // lotsSold / totalLots
  avgTicket: number;
  avgBidsPerLot: number;
  avgTimeToSale: number; // dias
  riskScore: number; // 0-100 (maior = mais risco)
  riskFactors: string[];
}

interface RiskMatrix {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  verticals: VerticalMetrics[];
  overall: {
    totalLots: number;
    totalSold: number;
    totalRevenue: number;
    avgConversion: number;
  };
  recommendations: Recommendation[];
}

interface Recommendation {
  vertical: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  action: string;
  expectedImpact: string;
}

// Mapeamento de categorias para verticais
const VERTICAL_MAP: Record<string, string> = {
  'VEICULOS': 'Veículos',
  'IMOVEIS': 'Imóveis',
  'MAQUINAS': 'Máquinas',
  'RURAL': 'Rural',
  'JUDICIAL': 'Judicial',
  'TECNOLOGIA': 'Tecnologia',
  'ARTE': 'Arte & Colecionáveis',
  'OUTROS': 'Outros',
};

async function getVerticalMetrics(daysBack: number): Promise<VerticalMetrics[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const metrics: VerticalMetrics[] = [];

  try {
    // Buscar lotes agrupados por categoria
    const lotsByCategory = await prisma.lot.groupBy({
      by: ['categoryId'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      _avg: { price: true, initialPrice: true },
    });

    for (const cat of lotsByCategory) {
      const category = cat.categoryId?.toString() || 'OUTROS';
      const vertical = VERTICAL_MAP[category] || category;

      // Buscar detalhes dos lotes desta categoria
      const lots = await prisma.lot.findMany({
        where: {
          categoryId: cat.categoryId,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          price: true,
          initialPrice: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { bids: true } },
        },
      });

      const totalLots = lots.length;
      const lotsWithBids = lots.filter(l => l._count.bids > 0).length;
      const lotsSold = lots.filter(l => l.status === 'VENDIDO').length;
      
      const totalBids = lots.reduce((sum, l) => sum + l._count.bids, 0);
      const totalRevenue = lots
        .filter(l => l.price)
        .reduce((sum, l) => sum + (l.price?.toNumber() || 0), 0);

      // Calcular tempo médio até venda
      const soldLots = lots.filter(l => l.status === 'VENDIDO');
      const avgTimeToSale = soldLots.length > 0
        ? soldLots.reduce((sum, l) => {
            const days = (l.updatedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / soldLots.length
        : 0;

      // Calcular score de risco
      const riskFactors: string[] = [];
      let riskScore = 50; // Base

      const conversionRate = totalLots > 0 ? (lotsSold / totalLots) * 100 : 0;
      
      if (conversionRate < 20) {
        riskScore += 25;
        riskFactors.push('Baixa taxa de conversão (<20%)');
      } else if (conversionRate < 40) {
        riskScore += 10;
        riskFactors.push('Taxa de conversão moderada (20-40%)');
      } else {
        riskScore -= 15;
      }

      if (lotsWithBids / totalLots < 0.3) {
        riskScore += 20;
        riskFactors.push('Muitos lotes sem lance (>70%)');
      }

      if (avgTimeToSale > 30) {
        riskScore += 15;
        riskFactors.push('Tempo médio de venda alto (>30 dias)');
      }

      riskScore = Math.max(0, Math.min(100, riskScore));

      metrics.push({
        vertical,
        totalLots,
        lotsWithBids,
        lotsSold,
        conversionRate,
        avgTicket: lotsSold > 0 ? totalRevenue / lotsSold : 0,
        avgBidsPerLot: totalLots > 0 ? totalBids / totalLots : 0,
        avgTimeToSale,
        riskScore,
        riskFactors,
      });
    }
  } catch (error) {
    console.warn('⚠️ Erro ao calcular métricas:', error);
  }

  return metrics.sort((a, b) => b.riskScore - a.riskScore);
}

function generateRecommendations(verticals: VerticalMetrics[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const v of verticals) {
    if (v.conversionRate < 20 && v.totalLots > 10) {
      recommendations.push({
        vertical: v.vertical,
        priority: 'high',
        issue: `Taxa de conversão muito baixa (${v.conversionRate.toFixed(1)}%)`,
        action: 'Revisar precificação inicial e estratégia de marketing para esta vertical',
        expectedImpact: 'Aumento de 10-20% na conversão',
      });
    }

    if (v.lotsWithBids / v.totalLots < 0.3 && v.totalLots > 10) {
      recommendations.push({
        vertical: v.vertical,
        priority: 'high',
        issue: `${((1 - v.lotsWithBids / v.totalLots) * 100).toFixed(0)}% dos lotes sem nenhum lance`,
        action: 'Melhorar descrições, fotos e visibilidade dos lotes',
        expectedImpact: 'Aumento de engajamento e lances',
      });
    }

    if (v.avgTimeToSale > 45 && v.lotsSold > 5) {
      recommendations.push({
        vertical: v.vertical,
        priority: 'medium',
        issue: `Tempo médio até venda muito alto (${v.avgTimeToSale.toFixed(0)} dias)`,
        action: 'Considerar leilões express ou redução de prazos',
        expectedImpact: 'Redução de 20-30% no ciclo de venda',
      });
    }

    if (v.avgBidsPerLot < 2 && v.totalLots > 10) {
      recommendations.push({
        vertical: v.vertical,
        priority: 'medium',
        issue: `Baixa competição (${v.avgBidsPerLot.toFixed(1)} lances/lote)`,
        action: 'Implementar notificações push e alertas de encerramento',
        expectedImpact: 'Aumento de 30-50% em lances',
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateMarkdownReport(matrix: RiskMatrix): string {
  const lines = [
    '# STR-02: Vertical Risk Matrix',
    '',
    `**Gerado em:** ${matrix.timestamp}`,
    `**Período:** ${matrix.period.start} a ${matrix.period.end}`,
    '',
    '## Resumo Geral',
    '',
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de Lotes | ${matrix.overall.totalLots.toLocaleString()} |`,
    `| Total Vendidos | ${matrix.overall.totalSold.toLocaleString()} |`,
    `| Conversão Média | ${matrix.overall.avgConversion.toFixed(1)}% |`,
    `| Receita Total | R$ ${matrix.overall.totalRevenue.toLocaleString()} |`,
    '',
    '## Matriz de Risco por Vertical',
    '',
    '| Vertical | Lotes | Vendidos | Conversão | Risco | Score |',
    '|----------|-------|----------|-----------|-------|-------|',
  ];

  for (const v of matrix.verticals) {
    const riskEmoji = v.riskScore > 70 ? '🔴' : v.riskScore > 40 ? '🟡' : '🟢';
    lines.push(
      `| ${v.vertical} | ${v.totalLots} | ${v.lotsSold} | ${v.conversionRate.toFixed(1)}% | ${riskEmoji} | ${v.riskScore}/100 |`
    );
  }

  lines.push('', '## Detalhamento por Vertical', '');

  for (const v of matrix.verticals) {
    const riskEmoji = v.riskScore > 70 ? '🔴' : v.riskScore > 40 ? '🟡' : '🟢';
    lines.push(`### ${riskEmoji} ${v.vertical}`, '');
    lines.push(`- **Total de Lotes:** ${v.totalLots}`);
    lines.push(`- **Lotes com Lances:** ${v.lotsWithBids} (${((v.lotsWithBids / v.totalLots) * 100 || 0).toFixed(1)}%)`);
    lines.push(`- **Taxa de Conversão:** ${v.conversionRate.toFixed(1)}%`);
    lines.push(`- **Ticket Médio:** R$ ${v.avgTicket.toLocaleString()}`);
    lines.push(`- **Média de Lances/Lote:** ${v.avgBidsPerLot.toFixed(1)}`);
    lines.push(`- **Tempo Médio até Venda:** ${v.avgTimeToSale.toFixed(0)} dias`);
    lines.push(`- **Score de Risco:** ${v.riskScore}/100`);
    
    if (v.riskFactors.length > 0) {
      lines.push('', '**Fatores de Risco:**');
      for (const factor of v.riskFactors) {
        lines.push(`  - ${factor}`);
      }
    }
    lines.push('');
  }

  if (matrix.recommendations.length > 0) {
    lines.push('## Recomendações Estratégicas', '');
    
    for (const rec of matrix.recommendations) {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
      lines.push(`### ${icon} [${rec.priority.toUpperCase()}] ${rec.vertical}`, '');
      lines.push(`**Problema:** ${rec.issue}`);
      lines.push(`**Ação:** ${rec.action}`);
      lines.push(`**Impacto Esperado:** ${rec.expectedImpact}`, '');
    }
  }

  lines.push('---', '', '*Gerado por STR-02: Vertical Risk Matrix*');

  return lines.join('\n');
}

async function main() {
  console.log('📊 STR-02: Vertical Risk Matrix');
  console.log('=' .repeat(50));

  const daysBack = parseInt(process.env.RISK_DAYS || '90');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  console.log(`📅 Período: últimos ${daysBack} dias`);

  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    const verticals = await getVerticalMetrics(daysBack);
    console.log(`📊 ${verticals.length} verticais analisadas`);

    const recommendations = generateRecommendations(verticals);

    // Calcular overall
    const overall = {
      totalLots: verticals.reduce((sum, v) => sum + v.totalLots, 0),
      totalSold: verticals.reduce((sum, v) => sum + v.lotsSold, 0),
      totalRevenue: verticals.reduce((sum, v) => sum + v.avgTicket * v.lotsSold, 0),
      avgConversion: 0,
    };
    overall.avgConversion = overall.totalLots > 0 
      ? (overall.totalSold / overall.totalLots) * 100 
      : 0;

    const matrix: RiskMatrix = {
      timestamp: new Date().toISOString(),
      period: {
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
      },
      verticals,
      overall,
      recommendations,
    };

    // Salvar resultados
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'risk-matrix.json'),
      JSON.stringify(matrix, null, 2)
    );

    const mdReport = generateMarkdownReport(matrix);
    fs.writeFileSync(
      path.join(outputDir, 'risk-matrix.md'),
      mdReport
    );

    console.log(`\n📄 Relatórios salvos em test-results/`);
    console.log(`📊 Verticais de alto risco: ${verticals.filter(v => v.riskScore > 70).length}`);
    console.log(`📋 Recomendações geradas: ${recommendations.length}`);

    console.log('\n✅ Análise concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
