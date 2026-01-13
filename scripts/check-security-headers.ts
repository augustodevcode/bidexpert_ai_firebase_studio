/**
 * @file DEV-04: Security Headers Checker
 * @description Valida headers de segurança HTTP na aplicação Next.js.
 * 
 * Headers verificados:
 * - Content-Security-Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

import * as fs from 'fs';
import * as path from 'path';

interface HeaderCheck {
  name: string;
  required: boolean;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  recommendation: string;
  found: boolean;
  value?: string;
}

interface SecurityResult {
  timestamp: string;
  configFile: string;
  headers: HeaderCheck[];
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  passed: boolean;
}

const REQUIRED_HEADERS: Omit<HeaderCheck, 'found' | 'value'>[] = [
  {
    name: 'X-Frame-Options',
    required: true,
    severity: 'critical',
    description: 'Previne clickjacking',
    recommendation: "DENY ou SAMEORIGIN",
  },
  {
    name: 'X-Content-Type-Options',
    required: true,
    severity: 'critical',
    description: 'Previne MIME sniffing',
    recommendation: "nosniff",
  },
  {
    name: 'Strict-Transport-Security',
    required: true,
    severity: 'critical',
    description: 'Força HTTPS',
    recommendation: "max-age=31536000; includeSubDomains",
  },
  {
    name: 'X-XSS-Protection',
    required: false,
    severity: 'warning',
    description: 'Proteção XSS (legado)',
    recommendation: "1; mode=block",
  },
  {
    name: 'Referrer-Policy',
    required: true,
    severity: 'warning',
    description: 'Controla envio de referrer',
    recommendation: "strict-origin-when-cross-origin",
  },
  {
    name: 'Content-Security-Policy',
    required: false,
    severity: 'warning',
    description: 'Política de conteúdo',
    recommendation: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  },
  {
    name: 'Permissions-Policy',
    required: false,
    severity: 'info',
    description: 'Controla features do browser',
    recommendation: "camera=(), microphone=(), geolocation=(self)",
  },
];

function parseNextConfig(configPath: string): Map<string, string> {
  const headers = new Map<string, string>();
  
  if (!fs.existsSync(configPath)) {
    return headers;
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Buscar padrão headers() em next.config
  const headersMatch = content.match(/headers\s*:\s*async\s*\(\)\s*=>\s*\[([\s\S]*?)\]/);
  if (headersMatch) {
    // Extrair key/value de headers
    const headerDefs = headersMatch[1].matchAll(/key\s*:\s*['"]([^'"]+)['"]\s*,\s*value\s*:\s*['"]([^'"]+)['"]/g);
    for (const match of headerDefs) {
      headers.set(match[1], match[2]);
    }
  }

  return headers;
}

function parseMiddleware(middlewarePath: string): Map<string, string> {
  const headers = new Map<string, string>();

  if (!fs.existsSync(middlewarePath)) {
    return headers;
  }

  const content = fs.readFileSync(middlewarePath, 'utf-8');

  // Buscar response.headers.set
  const setMatches = content.matchAll(/response\.headers\.set\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of setMatches) {
    headers.set(match[1], match[2]);
  }

  // Buscar headers em NextResponse
  const nextResponseMatches = content.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g);
  for (const match of nextResponseMatches) {
    if (REQUIRED_HEADERS.some(h => h.name.toLowerCase() === match[1].toLowerCase())) {
      headers.set(match[1], match[2]);
    }
  }

  return headers;
}

function calculateScore(checks: HeaderCheck[]): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } {
  let score = 100;

  for (const check of checks) {
    if (!check.found) {
      if (check.severity === 'critical') score -= 25;
      else if (check.severity === 'warning') score -= 10;
      else score -= 5;
    }
  }

  score = Math.max(0, score);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

function generateMarkdownReport(result: SecurityResult): string {
  const lines = [
    '# DEV-04: Relatório de Security Headers',
    '',
    `**Data:** ${result.timestamp}`,
    `**Score:** ${result.score}/100 (${result.grade})`,
    `**Status:** ${result.passed ? '✅ APROVADO' : '❌ REPROVADO'}`,
    '',
    '## Headers Verificados',
    '',
    '| Header | Status | Severidade | Valor |',
    '|--------|--------|------------|-------|',
  ];

  for (const header of result.headers) {
    const status = header.found ? '✅' : '❌';
    const value = header.found ? (header.value?.substring(0, 30) + (header.value && header.value.length > 30 ? '...' : '')) : 'Não configurado';
    lines.push(`| ${header.name} | ${status} | ${header.severity} | ${value} |`);
  }

  lines.push('');

  // Recomendações
  const missing = result.headers.filter(h => !h.found);
  if (missing.length > 0) {
    lines.push('## Recomendações', '');
    for (const header of missing) {
      const icon = header.severity === 'critical' ? '🔴' : header.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`### ${icon} ${header.name}`, '');
      lines.push(`**Descrição:** ${header.description}`, '');
      lines.push('**Configuração recomendada:**');
      lines.push('```javascript');
      lines.push(`// Em next.config.mjs ou middleware.ts`);
      lines.push(`headers: [{ key: '${header.name}', value: '${header.recommendation}' }]`);
      lines.push('```', '');
    }
  }

  lines.push('---', '', '*Gerado por DEV-04: Security Headers Checker*');

  return lines.join('\n');
}

async function main() {
  console.log('🔐 DEV-04: Security Headers Checker');
  console.log('=' .repeat(50));

  const configPath = path.join(process.cwd(), 'next.config.mjs');
  const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');

  // Coletar headers de ambas as fontes
  const configHeaders = parseNextConfig(configPath);
  const middlewareHeaders = parseMiddleware(middlewarePath);
  const allHeaders = new Map([...configHeaders, ...middlewareHeaders]);

  console.log(`📁 Headers encontrados no config: ${configHeaders.size}`);
  console.log(`📁 Headers encontrados no middleware: ${middlewareHeaders.size}`);

  // Verificar cada header requerido
  const checks: HeaderCheck[] = REQUIRED_HEADERS.map(req => {
    const foundKey = Array.from(allHeaders.keys()).find(
      k => k.toLowerCase() === req.name.toLowerCase()
    );
    return {
      ...req,
      found: !!foundKey,
      value: foundKey ? allHeaders.get(foundKey) : undefined,
    };
  });

  const { score, grade } = calculateScore(checks);
  const criticalMissing = checks.filter(c => !c.found && c.severity === 'critical').length;

  const result: SecurityResult = {
    timestamp: new Date().toISOString(),
    configFile: 'next.config.mjs + middleware.ts',
    headers: checks,
    score,
    grade,
    passed: criticalMissing === 0,
  };

  console.log(`\n📊 Score: ${score}/100 (${grade})`);
  console.log(`📊 Headers OK: ${checks.filter(c => c.found).length}/${checks.length}`);

  // Salvar resultados
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'security-headers.json'),
    JSON.stringify(result, null, 2)
  );

  const mdReport = generateMarkdownReport(result);
  fs.writeFileSync(
    path.join(outputDir, 'security-headers.md'),
    mdReport
  );

  console.log(`\n📄 Relatórios salvos em test-results/`);

  if (!result.passed) {
    console.log('\n❌ Verificação FALHOU - headers críticos ausentes');
    process.exit(1);
  }

  console.log('\n✅ Verificação APROVADA');
  process.exit(0);
}

main();
