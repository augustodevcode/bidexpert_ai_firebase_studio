/**
 * @file DEV-02: Multi-tenant Isolation Validator
 * @description Skill que detecta acesso cruzado entre tenants e ausência de filtro tenantId.
 * Analisa código-fonte para encontrar queries Prisma sem where.tenantId.
 * 
 * Outputs:
 * - JSON: Lista de arquivos/linhas com problemas
 * - MD: Relatório formatado para PR review
 * - Exit code: 0 se OK, 1 se encontrou violações
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  code: string;
  type: 'missing_tenant_filter' | 'hardcoded_tenant' | 'cross_tenant_access';
  severity: 'critical' | 'warning' | 'info';
  suggestion: string;
}

interface ValidationResult {
  timestamp: string;
  totalFiles: number;
  filesScanned: number;
  violations: Violation[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  passed: boolean;
}

// Modelos que DEVEM ter filtro tenantId
const TENANT_SCOPED_MODELS = [
  'auction',
  'lot',
  'bid',
  'user',
  'auctioneer',
  'consignor',
  'participant',
  'document',
  'notification',
  'message',
  'favorite',
  'watchlist',
  'report',
  'transaction',
  'invoice',
  'payment',
  'commission',
  'featureFlag',
  'auditLog',
];

// Padrões que indicam operações Prisma sem filtro tenant
const DANGEROUS_PATTERNS = [
  // findMany sem where ou com where vazio
  /prisma\.\w+\.findMany\s*\(\s*\)/g,
  /prisma\.\w+\.findMany\s*\(\s*\{\s*\}\s*\)/g,
  // findFirst sem where
  /prisma\.\w+\.findFirst\s*\(\s*\)/g,
  // update/delete sem where específico
  /prisma\.\w+\.updateMany\s*\(\s*\{[^}]*where\s*:\s*\{\s*\}/g,
  /prisma\.\w+\.deleteMany\s*\(\s*\{[^}]*where\s*:\s*\{\s*\}/g,
];

// Padrões que indicam hardcoded tenantId
const HARDCODED_PATTERNS = [
  /tenantId\s*:\s*['"`]\w+['"`]/g,
  /tenantId\s*:\s*\d+/g,
  /where\s*:\s*\{[^}]*tenantId\s*:\s*['"`](?!.*session|.*context|.*user)/g,
];

// Diretórios a ignorar
const IGNORE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  '.git',
  'prisma/migrations',
  'tests',
  'scripts/seed',
  '__tests__',
  'analisar',
];

async function scanFile(filePath: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // Verificar se arquivo usa Prisma
  if (!content.includes('prisma.') && !content.includes('@prisma/client')) {
    return violations;
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Verificar padrões perigosos
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        // Verificar se é um modelo que precisa de tenant
        const modelMatch = line.match(/prisma\.(\w+)\./);
        if (modelMatch && TENANT_SCOPED_MODELS.includes(modelMatch[1].toLowerCase())) {
          violations.push({
            file: relativePath,
            line: lineNum,
            code: trimmedLine.substring(0, 100),
            type: 'missing_tenant_filter',
            severity: 'critical',
            suggestion: `Adicionar filtro 'where: { tenantId: session.user.tenantId }' na query`,
          });
        }
      }
    }

    // Verificar tenantId hardcoded
    for (const pattern of HARDCODED_PATTERNS) {
      if (pattern.test(line) && !line.includes('// safe-tenant') && !filePath.includes('seed')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          code: trimmedLine.substring(0, 100),
          type: 'hardcoded_tenant',
          severity: 'warning',
          suggestion: `Usar tenantId dinâmico da sessão: session.user.tenantId`,
        });
      }
    }

    // Verificar queries em modelos tenant-scoped sem tenantId no where
    const findManyMatch = line.match(/prisma\.(\w+)\.(findMany|findFirst|findUnique|update|delete)\s*\(\s*\{/);
    if (findManyMatch) {
      const modelName = findManyMatch[1].toLowerCase();
      if (TENANT_SCOPED_MODELS.includes(modelName)) {
        // Buscar próximas linhas para ver se tem tenantId no where
        const contextLines = lines.slice(index, Math.min(index + 15, lines.length)).join('\n');
        if (!contextLines.includes('tenantId') && !contextLines.includes('// skip-tenant-check')) {
          violations.push({
            file: relativePath,
            line: lineNum,
            code: trimmedLine.substring(0, 100),
            type: 'missing_tenant_filter',
            severity: 'critical',
            suggestion: `Modelo '${modelName}' requer filtro tenantId para isolamento multi-tenant`,
          });
        }
      }
    }
  });

  return violations;
}

async function runValidation(): Promise<ValidationResult> {
  console.log('🔍 DEV-02: Multi-tenant Isolation Validator');
  console.log('=' .repeat(50));

  const startTime = Date.now();
  const srcDir = path.join(process.cwd(), 'src');
  
  // Encontrar todos os arquivos TypeScript
  const files = await glob('**/*.{ts,tsx}', {
    cwd: srcDir,
    ignore: IGNORE_DIRS.map(d => `**/${d}/**`),
    absolute: true,
  });

  console.log(`📁 Escaneando ${files.length} arquivos...`);

  const allViolations: Violation[] = [];
  let filesScanned = 0;

  for (const file of files) {
    const violations = await scanFile(file);
    allViolations.push(...violations);
    filesScanned++;
    
    if (violations.length > 0) {
      console.log(`⚠️  ${path.relative(process.cwd(), file)}: ${violations.length} violação(ões)`);
    }
  }

  const summary = {
    critical: allViolations.filter(v => v.severity === 'critical').length,
    warning: allViolations.filter(v => v.severity === 'warning').length,
    info: allViolations.filter(v => v.severity === 'info').length,
  };

  const result: ValidationResult = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    filesScanned,
    violations: allViolations,
    summary,
    passed: summary.critical === 0,
  };

  const elapsed = Date.now() - startTime;
  console.log(`\n⏱️  Concluído em ${elapsed}ms`);
  console.log(`📊 Resumo: ${summary.critical} críticas, ${summary.warning} warnings, ${summary.info} info`);

  return result;
}

function generateMarkdownReport(result: ValidationResult): string {
  const lines = [
    '# DEV-02: Relatório de Isolamento Multi-tenant',
    '',
    `**Data:** ${result.timestamp}`,
    `**Status:** ${result.passed ? '✅ APROVADO' : '❌ REPROVADO'}`,
    '',
    '## Resumo',
    '',
    `| Severidade | Quantidade |`,
    `|------------|------------|`,
    `| 🔴 Crítico | ${result.summary.critical} |`,
    `| 🟡 Warning | ${result.summary.warning} |`,
    `| 🔵 Info | ${result.summary.info} |`,
    '',
    `**Arquivos escaneados:** ${result.filesScanned}`,
    '',
  ];

  if (result.violations.length > 0) {
    lines.push('## Violações Encontradas', '');

    // Agrupar por arquivo
    const byFile = result.violations.reduce((acc, v) => {
      if (!acc[v.file]) acc[v.file] = [];
      acc[v.file].push(v);
      return acc;
    }, {} as Record<string, Violation[]>);

    for (const [file, violations] of Object.entries(byFile)) {
      lines.push(`### ${file}`, '');
      for (const v of violations) {
        const icon = v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '🟡' : '🔵';
        lines.push(`- ${icon} **Linha ${v.line}**: ${v.type}`);
        lines.push(`  - Código: \`${v.code}\``);
        lines.push(`  - Sugestão: ${v.suggestion}`);
        lines.push('');
      }
    }
  } else {
    lines.push('## ✅ Nenhuma violação encontrada!', '');
  }

  lines.push('---', '', '*Gerado por DEV-02: Multi-tenant Isolation Validator*');

  return lines.join('\n');
}

async function main() {
  try {
    const result = await runValidation();

    // Salvar JSON
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'tenant-isolation.json'),
      JSON.stringify(result, null, 2)
    );

    // Salvar Markdown
    const mdReport = generateMarkdownReport(result);
    fs.writeFileSync(
      path.join(outputDir, 'tenant-isolation.md'),
      mdReport
    );

    console.log(`\n📄 Relatórios salvos em test-results/`);

    // Exit code baseado no resultado
    if (!result.passed) {
      console.log('\n❌ Validação FALHOU - existem violações críticas de isolamento multi-tenant');
      process.exit(1);
    }

    console.log('\n✅ Validação APROVADA - isolamento multi-tenant OK');
    process.exit(0);
  } catch (error) {
    console.error('Erro na validação:', error);
    process.exit(1);
  }
}

main();
