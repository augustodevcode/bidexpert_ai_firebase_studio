/**
 * @file OPS-03: Audit Trail Reporter
 * @description Gera relatório de trilha de auditoria para compliance e governança.
 * 
 * Funcionalidades:
 * - Listar ações por período
 * - Filtrar por usuário, tenant, tipo de ação
 * - Exportar em JSON, CSV, MD
 * - Detectar padrões suspeitos
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName?: string;
  tenantId: string;
  tenantName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

interface AuditReport {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  filters: {
    tenantId?: string;
    userId?: string;
    action?: string;
  };
  entries: AuditEntry[];
  summary: {
    totalActions: number;
    uniqueUsers: number;
    uniqueTenants: number;
    actionBreakdown: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  };
  suspiciousPatterns: SuspiciousPattern[];
}

interface SuspiciousPattern {
  type: 'high_frequency' | 'unusual_hour' | 'bulk_delete' | 'cross_tenant';
  severity: 'warning' | 'critical';
  description: string;
  entries: string[]; // IDs das entradas relacionadas
}

async function getAuditEntries(
  startDate: Date,
  endDate: Date,
  filters: { tenantId?: string; userId?: string; action?: string }
): Promise<AuditEntry[]> {
  const where: any = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filters.tenantId) where.tenantId = BigInt(filters.tenantId);
  if (filters.userId) where.userId = BigInt(filters.userId);
  if (filters.action) where.action = filters.action; // Enum match might require casting if string

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limite para evitar sobrecarga
      include: {
        user: { select: { fullName: true, email: true } },
        tenant: { select: { name: true } },
      },
    });

    return logs.map(log => ({
      id: log.id.toString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId.toString(),
      userId: log.userId.toString(),
      userName: log.user?.fullName || log.user?.email || 'Unknown',
      tenantId: log.tenantId?.toString() || '',
      tenantName: log.tenant?.name || 'Unknown',
      details: log.changes ? JSON.stringify(log.changes) : (log.metadata ? JSON.stringify(log.metadata) : undefined),
      ipAddress: log.ipAddress || undefined,
      createdAt: log.timestamp,
    }));
  } catch (error) {
    console.warn('⚠️ Erro ao buscar audit logs:', error);
    return [];
  }
}

function detectSuspiciousPatterns(entries: AuditEntry[]): SuspiciousPattern[] {
  const patterns: SuspiciousPattern[] = [];

  // 1. Detectar alta frequência de ações por usuário (mais de 100 em 1 hora)
  const userActionCounts = new Map<string, { count: number; entries: string[] }>();
  
  for (const entry of entries) {
    const hourKey = `${entry.userId}-${entry.createdAt.toISOString().slice(0, 13)}`;
    const current = userActionCounts.get(hourKey) || { count: 0, entries: [] };
    current.count++;
    current.entries.push(entry.id);
    userActionCounts.set(hourKey, current);
  }

  for (const [key, data] of userActionCounts) {
    if (data.count > 100) {
      patterns.push({
        type: 'high_frequency',
        severity: 'warning',
        description: `Usuário ${key.split('-')[0]} executou ${data.count} ações em 1 hora`,
        entries: data.entries.slice(0, 10),
      });
    }
  }

  // 2. Detectar ações em horários incomuns (madrugada)
  const nightActions = entries.filter(e => {
    const hour = e.createdAt.getHours();
    return hour >= 0 && hour < 6;
  });

  if (nightActions.length > 50) {
    patterns.push({
      type: 'unusual_hour',
      severity: 'warning',
      description: `${nightActions.length} ações executadas entre 00h e 06h`,
      entries: nightActions.slice(0, 10).map(e => e.id),
    });
  }

  // 3. Detectar bulk deletes
  const deleteActions = entries.filter(e => 
    e.action.toLowerCase().includes('delete') || 
    e.action.toLowerCase().includes('remove')
  );

  if (deleteActions.length > 20) {
    const deletesByUser = deleteActions.reduce((acc, e) => {
      acc[e.userId] = (acc[e.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [userId, count] of Object.entries(deletesByUser)) {
      if (count > 10) {
        patterns.push({
          type: 'bulk_delete',
          severity: 'critical',
          description: `Usuário ${userId} executou ${count} ações de delete`,
          entries: deleteActions.filter(e => e.userId === userId).slice(0, 10).map(e => e.id),
        });
      }
    }
  }

  return patterns;
}

function generateSummary(entries: AuditEntry[]): AuditReport['summary'] {
  const uniqueUsers = new Set(entries.map(e => e.userId));
  const uniqueTenants = new Set(entries.map(e => e.tenantId));

  // Action breakdown
  const actionBreakdown = entries.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top users
  const userCounts = entries.reduce((acc, e) => {
    if (!acc[e.userId]) {
      acc[e.userId] = { userName: e.userName || 'Unknown', count: 0 };
    }
    acc[e.userId].count++;
    return acc;
  }, {} as Record<string, { userName: string; count: number }>);

  const topUsers = Object.entries(userCounts)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalActions: entries.length,
    uniqueUsers: uniqueUsers.size,
    uniqueTenants: uniqueTenants.size,
    actionBreakdown,
    topUsers,
  };
}

function generateMarkdownReport(report: AuditReport): string {
  const lines = [
    '# OPS-03: Audit Trail Report',
    '',
    `**Gerado em:** ${report.timestamp}`,
    `**Período:** ${report.period.start} a ${report.period.end}`,
    '',
    '## Resumo',
    '',
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de Ações | ${report.summary.totalActions.toLocaleString()} |`,
    `| Usuários Únicos | ${report.summary.uniqueUsers} |`,
    `| Tenants Únicos | ${report.summary.uniqueTenants} |`,
    '',
    '## Breakdown por Ação',
    '',
    '| Ação | Quantidade |',
    '|------|------------|',
  ];

  const sortedActions = Object.entries(report.summary.actionBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  for (const [action, count] of sortedActions) {
    lines.push(`| ${action} | ${count.toLocaleString()} |`);
  }

  lines.push('', '## Top Usuários', '');
  lines.push('| Usuário | Ações |');
  lines.push('|---------|-------|');

  for (const user of report.summary.topUsers) {
    lines.push(`| ${user.userName} | ${user.count.toLocaleString()} |`);
  }

  if (report.suspiciousPatterns.length > 0) {
    lines.push('', '## ⚠️ Padrões Suspeitos Detectados', '');
    
    for (const pattern of report.suspiciousPatterns) {
      const icon = pattern.severity === 'critical' ? '🔴' : '🟡';
      lines.push(`### ${icon} ${pattern.type}`, '');
      lines.push(pattern.description, '');
      lines.push(`**Entradas relacionadas:** ${pattern.entries.length}`, '');
    }
  }

  lines.push('', '## Últimas 50 Ações', '');
  lines.push('| Data | Usuário | Ação | Entidade |');
  lines.push('|------|---------|------|----------|');

  for (const entry of report.entries.slice(0, 50)) {
    const date = entry.createdAt.toISOString().slice(0, 19).replace('T', ' ');
    lines.push(`| ${date} | ${entry.userName} | ${entry.action} | ${entry.entityType}:${entry.entityId.slice(0, 8)} |`);
  }

  lines.push('', '---', '', '*Gerado por OPS-03: Audit Trail Reporter*');

  return lines.join('\n');
}

function generateCSV(entries: AuditEntry[]): string {
  const headers = ['ID', 'Data', 'Ação', 'Entidade', 'EntidadeID', 'Usuário', 'Tenant', 'IP'];
  const rows = entries.map(e => [
    e.id,
    e.createdAt.toISOString(),
    e.action,
    e.entityType,
    e.entityId,
    e.userName || e.userId,
    e.tenantName || e.tenantId,
    e.ipAddress || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

async function main() {
  console.log('📋 OPS-03: Audit Trail Reporter');
  console.log('=' .repeat(50));

  // Parâmetros (podem vir de args ou env)
  const daysBack = parseInt(process.env.AUDIT_DAYS || '7');
  const tenantId = process.env.AUDIT_TENANT;
  const userId = process.env.AUDIT_USER;
  const action = process.env.AUDIT_ACTION;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  console.log(`📅 Período: ${startDate.toISOString().slice(0, 10)} a ${endDate.toISOString().slice(0, 10)}`);

  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    const filters = { tenantId, userId, action };
    const entries = await getAuditEntries(startDate, endDate, filters);

    console.log(`📊 ${entries.length} entradas encontradas`);

    const suspiciousPatterns = detectSuspiciousPatterns(entries);
    const summary = generateSummary(entries);

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      filters,
      entries,
      summary,
      suspiciousPatterns,
    };

    // Salvar resultados
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'audit-report.json'),
      JSON.stringify(report, null, 2)
    );

    const mdReport = generateMarkdownReport(report);
    fs.writeFileSync(
      path.join(outputDir, 'audit-report.md'),
      mdReport
    );

    const csvReport = generateCSV(entries);
    fs.writeFileSync(
      path.join(outputDir, 'audit-report.csv'),
      csvReport
    );

    console.log(`\n📄 Relatórios salvos em test-results/`);
    console.log(`   - audit-report.json`);
    console.log(`   - audit-report.md`);
    console.log(`   - audit-report.csv`);

    if (suspiciousPatterns.length > 0) {
      console.log(`\n⚠️ ${suspiciousPatterns.length} padrões suspeitos detectados!`);
    }

    console.log('\n✅ Relatório concluído');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
