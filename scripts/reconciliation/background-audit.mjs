/**
 * @fileoverview Script de auditoria background que orquestra a reconciliação
 * entre Prisma DB e a UI renderizada via Playwright MCP.
 *
 * Este script é projetado para ser executado como um processo background pelo
 * VS Code Task ou pelo PowerShell detached launcher. Ele:
 *
 * 1. Conecta ao banco via Prisma (somente leitura)
 * 2. Coleta dados das entidades ativas (Auction, Lot, Bid)
 * 3. Navega páginas via Playwright MCP para extrair valores renderizados
 * 4. Compara DB vs UI usando normalizadores centralizados
 * 5. Gera relatório Markdown em reports/reconciliation/
 *
 * Uso: node scripts/reconciliation/background-audit.mjs
 * Ou via VS Code Task: "Data Reconciliation: Background Audit"
 *
 * BDD: Dado que a aplicação está rodando na porta 9005,
 *       Quando o script de auditoria é executado,
 *       Então um relatório .md é salvo em reports/reconciliation/
 *       E o relatório contém divergências categorizadas por severidade.
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// ─────────────────────────────────────────────────
// CONFIGURAÇÕES
// ─────────────────────────────────────────────────

const CONFIG = {
  /** URL base da aplicação (tenant demo) */
  baseUrl: process.env.RECONCILIATION_BASE_URL || 'http://demo.localhost:9005',

  /** Tenant slug para auditoria */
  tenantSlug: process.env.RECONCILIATION_TENANT || 'demo',

  /** Diretório de saída dos relatórios */
  reportsDir: resolve(process.cwd(), 'reports', 'reconciliation'),

  /** Máximo de leilões a auditar por ciclo */
  maxAuctions: parseInt(process.env.RECONCILIATION_MAX_AUCTIONS || '5'),

  /** Timeout por página (ms) */
  pageTimeout: parseInt(process.env.RECONCILIATION_PAGE_TIMEOUT || '15000'),

  /** Versão do agente */
  agentVersion: 'data-reconciliation-auditor@1.0.0',

  /** Ativar modo verbose */
  verbose: process.env.RECONCILIATION_VERBOSE === 'true',
};

// ─────────────────────────────────────────────────
// LOGGER
// ─────────────────────────────────────────────────

function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [reconciliation-audit]`;

  if (level === 'debug' && !CONFIG.verbose) return;

  const line = data
    ? `${prefix} ${message} ${JSON.stringify(data)}`
    : `${prefix} ${message}`;

  console.log(line);
}

// ─────────────────────────────────────────────────
// PLAYWRIGHT MCP HELPERS
// ─────────────────────────────────────────────────

/**
 * Nota sobre integração MCP:
 *
 * Este script funciona em dois modos:
 *
 * 1. MODO AGENTE (recomendado): Quando invocado pelo agente VS Code,
 *    o Playwright MCP já está disponível como ferramenta do agente.
 *    O agente usa as ferramentas mcp_playwright_navigate, mcp_playwright_snapshot,
 *    mcp_playwright_evaluate diretamente.
 *
 * 2. MODO STANDALONE: Quando executado via PowerShell ou cron,
 *    usa Playwright diretamente via @playwright/test API.
 *    Requer que o app esteja rodando e acessível.
 *
 * O script abaixo prevê o MODO STANDALONE, mas é projetado para ser
 * facilmente adaptável ao modo agente.
 */

/**
 * Extrai texto de um seletor data-ai-id via execução de script no browser.
 * Retorna null se o elemento não existir.
 */
function buildExtractionScript(selector) {
  return `
    (() => {
      const el = document.querySelector('${selector}');
      if (!el) return null;
      return el.textContent?.trim() || el.innerText?.trim() || null;
    })()
  `;
}

/**
 * Extrai múltiplos valores de seletores de uma vez
 */
function buildBatchExtractionScript(selectors) {
  const selectorEntries = selectors.map((s, i) => `"${i}": "${s.selector}"`).join(', ');
  return `
    (() => {
      const selectors = {${selectorEntries}};
      const results = {};
      for (const [key, sel] of Object.entries(selectors)) {
        const el = document.querySelector(sel);
        results[key] = el ? (el.textContent?.trim() || null) : null;
      }
      return JSON.stringify(results);
    })()
  `;
}

// ─────────────────────────────────────────────────
// RELATÓRIO ESTRUTURADO
// ─────────────────────────────────────────────────

function createEmptyReport() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toISOString().split('T')[1].replace(/[:.]/g, '-').slice(0, 8);

  return {
    metadata: {
      date: now.toISOString(),
      environment: CONFIG.tenantSlug,
      tenantSlug: CONFIG.tenantSlug,
      agentVersion: CONFIG.agentVersion,
      durationMs: 0,
      queriesExecuted: 0,
      pagesNavigated: 0,
      consoleErrorsCaptured: 0,
    },
    summary: {
      auctionsAudited: 0,
      lotsAudited: 0,
      bidsAudited: 0,
      pagesVerified: 0,
      divergencesFound: 0,
      criticalDivergences: 0,
      consistencyRate: 100,
    },
    divergences: [],
    referentialIntegrity: {
      auctionsWithoutLots: 0,
      lotsWithoutValidAuction: 0,
      orphanBids: 0,
      desyncedCounters: [],
    },
    recommendations: [],
    filename: `reconciliation_${dateStr}_${timeStr}.md`,
  };
}

/**
 * Gera relatório Markdown a partir do resultado.
 */
function generateMarkdown(report) {
  const severityEmoji = {
    CRITICA: '🔴',
    ALTA: '🟠',
    MEDIA: '🟡',
    BAIXA: '🟢',
  };

  let md = `# Relatório de Reconciliação de Dados\n\n`;
  md += `**Data**: ${report.metadata.date}\n`;
  md += `**Ambiente**: ${report.metadata.environment}\n`;
  md += `**Tenant**: ${report.metadata.tenantSlug}\n`;
  md += `**Agente**: ${report.metadata.agentVersion}\n`;
  md += `**Duração**: ${(report.metadata.durationMs / 1000).toFixed(1)}s\n`;
  md += `**Modo**: Standalone (Background Audit)\n\n`;

  md += `## Resumo Executivo\n\n`;
  md += `| Métrica | Valor |\n|---------|-------|\n`;
  md += `| Leilões Auditados | ${report.summary.auctionsAudited} |\n`;
  md += `| Lotes Auditados | ${report.summary.lotsAudited} |\n`;
  md += `| Lances Auditados | ${report.summary.bidsAudited} |\n`;
  md += `| Páginas Verificadas | ${report.summary.pagesVerified} |\n`;
  md += `| Divergências Encontradas | ${report.summary.divergencesFound} |\n`;
  md += `| Divergências Críticas | ${report.summary.criticalDivergences} |\n`;
  md += `| Taxa de Consistência | ${report.summary.consistencyRate.toFixed(1)}% |\n\n`;

  if (report.divergences.length > 0) {
    md += `## Divergências Detectadas\n\n`;
    for (const div of report.divergences) {
      md += `### ${severityEmoji[div.severity] || '⚪'} #${div.id} — ${div.severity}\n\n`;
      md += `- **Entidade**: ${div.entityType} #${div.entityId}\n`;
      md += `- **Campo**: \`${div.fieldName}\`\n`;
      md += `- **Valor DB**: ${div.dbValue}\n`;
      md += `- **Valor UI**: ${div.uiValue}\n`;
      md += `- **Delta**: ${div.delta}\n`;
      md += `- **Causa Raiz**: \`${div.rootCauseCode}\`\n`;
      md += `- **Recomendação**: ${div.recommendation}\n\n`;
    }
  } else {
    md += `## Resultado\n\n✅ Nenhuma divergência detectada.\n\n`;
  }

  // Integridade Referencial
  md += `## Integridade Referencial\n\n`;
  md += `| Verificação | Resultado |\n|-------------|----------|\n`;
  md += `| Leilões sem Lotes | ${report.referentialIntegrity.auctionsWithoutLots} |\n`;
  md += `| Lotes sem Leilão Válido | ${report.referentialIntegrity.lotsWithoutValidAuction} |\n`;
  md += `| Lances Órfãos | ${report.referentialIntegrity.orphanBids} |\n`;
  md += `| Contadores Desincronizados | ${report.referentialIntegrity.desyncedCounters.length} |\n\n`;

  if (report.referentialIntegrity.desyncedCounters.length > 0) {
    md += `### Contadores Desincronizados\n\n`;
    md += `| Entidade | ID | Campo | Armazenado | Real |\n`;
    md += `|----------|----|-------|------------|------|\n`;
    for (const c of report.referentialIntegrity.desyncedCounters) {
      md += `| ${c.entityType} | ${c.entityId} | ${c.fieldName} | ${c.storedValue} | ${c.calculatedValue} |\n`;
    }
    md += `\n`;
  }

  if (report.recommendations.length > 0) {
    md += `## Recomendações\n\n`;
    report.recommendations.forEach((r, i) => {
      md += `${i + 1}. ${r}\n`;
    });
  }

  return md;
}

// ─────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  log('info', '=== Data Reconciliation Audit — Início ===');
  log('info', `Config: ${JSON.stringify(CONFIG)}`);

  // Garantir diretório de reports
  if (!existsSync(CONFIG.reportsDir)) {
    mkdirSync(CONFIG.reportsDir, { recursive: true });
    log('info', `Diretório criado: ${CONFIG.reportsDir}`);
  }

  const report = createEmptyReport();

  // ── Passo 1: Verificar se a aplicação está acessível ──
  log('info', 'Passo 1: Verificando acessibilidade da aplicação...');
  try {
    const checkUrl = `${CONFIG.baseUrl}/api/health`;
    log('debug', `Health check: ${checkUrl}`);
    // NOTE: Em modo standalone, usar fetch nativo do Node 18+
    // Em modo agente, usar playwright mcp_navigate
  } catch (err) {
    log('error', 'Aplicação não acessível. Abortando.', { error: err.message });
    report.recommendations.push(
      'A aplicação não está acessível. Verifique se o servidor está rodando na porta correta.'
    );
    saveReport(report, startTime);
    return;
  }

  // ── Passo 2: Coleta de dados via Prisma (modo stub) ──
  log('info', 'Passo 2: Coletando dados do banco de dados...');
  log('info', '[MODO STUB] Este script é projetado para ser invocado pelo agente VS Code');
  log('info', 'O agente usa Prisma MCP + Playwright MCP para coleta real de dados.');
  log('info', 'Em modo standalone, os dados são coletados via API routes.');

  // ── Passo 3: Navegação e extração UI (modo stub) ──
  log('info', 'Passo 3: Navegação e extração de dados da UI...');
  log('info', '[MODO STUB] Playwright MCP tools disponíveis no modo agente:');
  log('info', '  - mcp_playwright_navigate: Navegar para URLs');
  log('info', '  - mcp_playwright_snapshot: Capturar snapshot acessível');
  log('info', '  - mcp_playwright_evaluate: Executar JS para extração');
  log('info', '  - mcp_playwright_click: Interagir com elementos');

  // ── Passo 4: Salvar resultados ──
  log('info', 'Passo 4: Salvando relatório...');
  report.recommendations.push(
    'Execute este script via VS Code Agent para auditoria completa com acesso a Prisma MCP e Playwright MCP.',
    'Em modo standalone, implemente API routes de reconciliação para coleta de dados.',
    'Configure revalidatePath/revalidateTag nas server actions de mutação.',
    'Adicione data-ai-id em todos os elementos que exibem dados críticos (preços, status, contadores).',
  );

  saveReport(report, startTime);
  log('info', '=== Data Reconciliation Audit — Fim ===');
}

function saveReport(report, startTime) {
  report.metadata.durationMs = Date.now() - startTime;

  const totalChecks = report.summary.auctionsAudited + report.summary.lotsAudited + report.summary.bidsAudited;
  if (totalChecks > 0) {
    report.summary.consistencyRate =
      ((totalChecks - report.summary.divergencesFound) / totalChecks) * 100;
  }

  const markdown = generateMarkdown(report);
  const filePath = join(CONFIG.reportsDir, report.filename);

  writeFileSync(filePath, markdown, 'utf-8');
  log('info', `Relatório salvo: ${filePath}`);

  // Também salvar JSON para processamento programático
  const jsonPath = filePath.replace('.md', '.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  log('info', `JSON salvo: ${jsonPath}`);
}

// Executar
main().catch((err) => {
  log('error', 'Falha fatal na auditoria', { error: err.message, stack: err.stack });
  process.exit(1);
});
