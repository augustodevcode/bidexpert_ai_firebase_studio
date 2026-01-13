/**
 * @file OPS-02: DB Metrics Snapshot
 * @description Coleta métricas de saúde do banco de dados MySQL/Prisma.
 * 
 * Métricas coletadas:
 * - Contagem de registros por tabela
 * - Tamanho de tabelas
 * - Índices e sua eficiência
 * - Hot tables (mais acessadas)
 * - Métricas por tenant
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TableMetric {
  name: string;
  rowCount: number;
  dataSize?: string;
  indexSize?: string;
  avgRowLength?: number;
}

interface TenantMetric {
  tenantId: string;
  tenantName: string;
  auctions: number;
  lots: number;
  bids: number;
  users: number;
}

interface DbSnapshot {
  timestamp: string;
  database: string;
  tables: TableMetric[];
  tenantMetrics: TenantMetric[];
  alerts: Alert[];
  summary: {
    totalTables: number;
    totalRows: number;
    largestTable: string;
    avgRowsPerTable: number;
  };
}

interface Alert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  table?: string;
  recommendation: string;
}

async function getTableMetrics(): Promise<TableMetric[]> {
  const metrics: TableMetric[] = [];

  try {
    // Tentar obter métricas via raw query MySQL
    const tableInfo = await prisma.$queryRaw<Array<{
      TABLE_NAME: string;
      TABLE_ROWS: bigint;
      DATA_LENGTH: bigint;
      INDEX_LENGTH: bigint;
      AVG_ROW_LENGTH: bigint;
    }>>`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH,
        AVG_ROW_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_ROWS DESC
    `;

    for (const row of tableInfo) {
      metrics.push({
        name: row.TABLE_NAME,
        rowCount: Number(row.TABLE_ROWS),
        dataSize: formatBytes(Number(row.DATA_LENGTH)),
        indexSize: formatBytes(Number(row.INDEX_LENGTH)),
        avgRowLength: Number(row.AVG_ROW_LENGTH),
      });
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível obter métricas via information_schema, usando contagem direta');
    
    // Fallback: contar manualmente as principais tabelas
    const tables = [
      { name: 'Tenant', count: () => prisma.tenant.count() },
      { name: 'User', count: () => prisma.user.count() },
      { name: 'Auction', count: () => prisma.auction.count() },
      { name: 'Lot', count: () => prisma.lot.count() },
      { name: 'Bid', count: () => prisma.bid.count() },
      { name: 'Auctioneer', count: () => prisma.auctioneer.count() },
      { name: 'Consignor', count: () => prisma.seller.count() },
      { name: 'Document', count: () => prisma.lotDocument.count() },
      { name: 'AuditLog', count: () => prisma.auditLog.count() },
    ];

    for (const table of tables) {
      try {
        const count = await table.count();
        metrics.push({ name: table.name, rowCount: count });
      } catch (e) {
        metrics.push({ name: table.name, rowCount: -1 });
      }
    }
  }

  return metrics;
}

async function getTenantMetrics(): Promise<TenantMetric[]> {
  const metrics: TenantMetric[] = [];

  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true },
    });

    for (const tenant of tenants) {
      const [auctions, lots, bids, users] = await Promise.all([
        prisma.auction.count({ where: { tenantId: tenant.id } }),
        prisma.lot.count({ where: { tenantId: tenant.id } }),
        prisma.bid.count({ where: { tenantId: tenant.id } }),
        prisma.user.count({ where: { tenants: { some: { tenantId: tenant.id } } } }),
      ]);

      metrics.push({
        tenantId: tenant.id.toString(),
        tenantName: tenant.name,
        auctions,
        lots,
        bids,
        users,
      });
    }
  } catch (error) {
    console.warn('⚠️ Erro ao coletar métricas por tenant:', error);
  }

  return metrics;
}

function generateAlerts(tables: TableMetric[], tenantMetrics: TenantMetric[]): Alert[] {
  const alerts: Alert[] = [];

  // Verificar tabelas grandes
  for (const table of tables) {
    if (table.rowCount > 1000000) {
      alerts.push({
        type: 'warning',
        table: table.name,
        message: `Tabela ${table.name} tem mais de 1M de registros (${table.rowCount.toLocaleString()})`,
        recommendation: 'Considerar particionamento ou arquivamento de dados antigos',
      });
    }

    if (table.rowCount > 10000000) {
      alerts.push({
        type: 'critical',
        table: table.name,
        message: `Tabela ${table.name} tem mais de 10M de registros`,
        recommendation: 'Urgente: implementar estratégia de archival ou sharding',
      });
    }
  }

  // Verificar desbalanceamento entre tenants
  if (tenantMetrics.length > 1) {
    const maxLots = Math.max(...tenantMetrics.map(t => t.lots));
    const minLots = Math.min(...tenantMetrics.map(t => t.lots));
    
    if (maxLots > 0 && minLots > 0 && maxLots / minLots > 100) {
      alerts.push({
        type: 'warning',
        message: 'Grande desbalanceamento de dados entre tenants',
        recommendation: 'Verificar se tenant dominante não está impactando performance',
      });
    }
  }

  // Verificar se AuditLog está crescendo muito
  const auditLog = tables.find(t => t.name.toLowerCase() === 'auditlog');
  if (auditLog && auditLog.rowCount > 500000) {
    alerts.push({
      type: 'info',
      table: 'AuditLog',
      message: `AuditLog tem ${auditLog.rowCount.toLocaleString()} registros`,
      recommendation: 'Considerar política de retenção (ex: manter apenas 90 dias)',
    });
  }

  return alerts;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateMarkdownReport(snapshot: DbSnapshot): string {
  const lines = [
    '# OPS-02: Database Metrics Snapshot',
    '',
    `**Data:** ${snapshot.timestamp}`,
    `**Database:** ${snapshot.database}`,
    '',
    '## Resumo',
    '',
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de Tabelas | ${snapshot.summary.totalTables} |`,
    `| Total de Registros | ${snapshot.summary.totalRows.toLocaleString()} |`,
    `| Maior Tabela | ${snapshot.summary.largestTable} |`,
    `| Média por Tabela | ${snapshot.summary.avgRowsPerTable.toLocaleString()} |`,
    '',
    '## Métricas por Tabela',
    '',
    '| Tabela | Registros | Tamanho | Índices |',
    '|--------|-----------|---------|---------|',
  ];

  for (const table of snapshot.tables.slice(0, 20)) { // Top 20
    lines.push(`| ${table.name} | ${table.rowCount.toLocaleString()} | ${table.dataSize || '-'} | ${table.indexSize || '-'} |`);
  }

  if (snapshot.tenantMetrics.length > 0) {
    lines.push('', '## Métricas por Tenant', '');
    lines.push('| Tenant | Leilões | Lotes | Lances | Usuários |');
    lines.push('|--------|---------|-------|--------|----------|');
    
    for (const tenant of snapshot.tenantMetrics) {
      lines.push(`| ${tenant.tenantName} | ${tenant.auctions} | ${tenant.lots} | ${tenant.bids} | ${tenant.users} |`);
    }
  }

  if (snapshot.alerts.length > 0) {
    lines.push('', '## Alertas', '');
    for (const alert of snapshot.alerts) {
      const icon = alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';
      lines.push(`### ${icon} ${alert.message}`, '');
      if (alert.table) lines.push(`**Tabela:** ${alert.table}`);
      lines.push(`**Recomendação:** ${alert.recommendation}`, '');
    }
  }

  lines.push('---', '', '*Gerado por OPS-02: DB Metrics Snapshot*');

  return lines.join('\n');
}

async function main() {
  console.log('📊 OPS-02: DB Metrics Snapshot');
  console.log('=' .repeat(50));

  try {
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    // Coletar métricas
    console.log('📁 Coletando métricas de tabelas...');
    const tables = await getTableMetrics();

    console.log('👥 Coletando métricas por tenant...');
    const tenantMetrics = await getTenantMetrics();

    // Gerar alertas
    const alerts = generateAlerts(tables, tenantMetrics);

    // Calcular resumo
    const totalRows = tables.reduce((sum, t) => sum + Math.max(0, t.rowCount), 0);
    const largestTable = tables.length > 0 ? tables[0].name : 'N/A';

    const snapshot: DbSnapshot = {
      timestamp: new Date().toISOString(),
      database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
      tables,
      tenantMetrics,
      alerts,
      summary: {
        totalTables: tables.length,
        totalRows,
        largestTable,
        avgRowsPerTable: tables.length > 0 ? Math.round(totalRows / tables.length) : 0,
      },
    };

    console.log(`\n📊 Total de registros: ${totalRows.toLocaleString()}`);
    console.log(`📊 Alertas: ${alerts.length}`);

    // Salvar resultados
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'db-metrics.json'),
      JSON.stringify(snapshot, null, 2)
    );

    const mdReport = generateMarkdownReport(snapshot);
    fs.writeFileSync(
      path.join(outputDir, 'db-metrics.md'),
      mdReport
    );

    console.log(`\n📄 Relatórios salvos em test-results/`);
    console.log('\n✅ Snapshot concluído');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
