/**
 * @file DEV-03: Prisma Schema Linter
 * @description Valida consistência do schema Prisma: índices, relações, convenções de nomes.
 * 
 * Outputs:
 * - JSON: Lista de issues encontrados
 * - MD: Relatório formatado
 * - Exit code: 0 se OK, 1 se encontrou problemas críticos
 */

import * as fs from 'fs';
import * as path from 'path';

interface SchemaIssue {
  line: number;
  model?: string;
  field?: string;
  type: 'missing_index' | 'missing_relation' | 'naming_convention' | 'missing_tenant' | 'performance';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

interface LintResult {
  timestamp: string;
  schemaFile: string;
  modelsFound: number;
  issues: SchemaIssue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  passed: boolean;
}

// Campos que devem ter índice para performance
const INDEXED_FIELDS = [
  'tenantId',
  'status',
  'createdAt',
  'updatedAt',
  'email',
  'slug',
  'publicId',
  'auctionId',
  'lotId',
  'userId',
];

// Modelos que DEVEM ter tenantId
const TENANT_REQUIRED_MODELS = [
  'Auction',
  'Lot',
  'Bid',
  'User',
  'Auctioneer',
  'Consignor',
  'Participant',
  'Document',
  'Notification',
  'Message',
  'Favorite',
  'Watchlist',
  'Report',
  'Transaction',
  'Invoice',
  'Payment',
  'AuditLog',
];

function parseSchemaFile(content: string): { models: Map<string, { fields: string[], indexes: string[], line: number }> } {
  const models = new Map<string, { fields: string[], indexes: string[], line: number }>();
  const lines = content.split('\n');
  
  let currentModel: string | null = null;
  let currentFields: string[] = [];
  let currentIndexes: string[] = [];
  let modelStartLine = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Detectar início de modelo
    const modelMatch = trimmed.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      // Salvar modelo anterior se existir
      if (currentModel) {
        models.set(currentModel, { fields: currentFields, indexes: currentIndexes, line: modelStartLine });
      }
      currentModel = modelMatch[1];
      currentFields = [];
      currentIndexes = [];
      modelStartLine = index + 1;
      return;
    }

    // Detectar fim de modelo
    if (trimmed === '}' && currentModel) {
      models.set(currentModel, { fields: currentFields, indexes: currentIndexes, line: modelStartLine });
      currentModel = null;
      return;
    }

    // Coletar campos e índices
    if (currentModel) {
      // Campo
      const fieldMatch = trimmed.match(/^(\w+)\s+/);
      if (fieldMatch && !trimmed.startsWith('@@') && !trimmed.startsWith('//')) {
        currentFields.push(fieldMatch[1]);
      }
      
      // Índice
      if (trimmed.startsWith('@@index') || trimmed.startsWith('@@unique')) {
        currentIndexes.push(trimmed);
      }
    }
  });

  return { models };
}

function lintSchema(content: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const { models } = parseSchemaFile(content);
  const lines = content.split('\n');

  // Verificar cada modelo
  for (const [modelName, modelData] of models) {
    const { fields, indexes, line } = modelData;

    // 1. Verificar se modelo tenant-scoped tem tenantId
    if (TENANT_REQUIRED_MODELS.includes(modelName)) {
      if (!fields.includes('tenantId') && !fields.includes('tenant')) {
        issues.push({
          line,
          model: modelName,
          type: 'missing_tenant',
          severity: 'critical',
          message: `Modelo ${modelName} não possui campo tenantId`,
          suggestion: `Adicionar: tenantId String @db.VarChar(36) + relação com Tenant`,
        });
      }
    }

    // 2. Verificar índices para campos comuns
    for (const field of INDEXED_FIELDS) {
      if (fields.includes(field)) {
        const hasIndex = indexes.some(idx => idx.includes(field));
        if (!hasIndex && field !== 'createdAt' && field !== 'updatedAt') {
          issues.push({
            line,
            model: modelName,
            field,
            type: 'missing_index',
            severity: 'warning',
            message: `Campo ${field} em ${modelName} não possui índice`,
            suggestion: `Adicionar: @@index([${field}])`,
          });
        }
      }
    }

    // 3. Verificar convenção de nomes (PascalCase para modelos)
    if (modelName[0] !== modelName[0].toUpperCase()) {
      issues.push({
        line,
        model: modelName,
        type: 'naming_convention',
        severity: 'info',
        message: `Modelo ${modelName} não segue PascalCase`,
        suggestion: `Renomear para ${modelName.charAt(0).toUpperCase() + modelName.slice(1)}`,
      });
    }

    // 4. Verificar se tem createdAt/updatedAt
    if (!fields.includes('createdAt')) {
      issues.push({
        line,
        model: modelName,
        type: 'missing_index',
        severity: 'info',
        message: `Modelo ${modelName} não possui campo createdAt`,
        suggestion: `Adicionar: createdAt DateTime @default(now())`,
      });
    }
  }

  // Verificar padrões no conteúdo bruto
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Verificar relações sem onDelete
    if (trimmed.includes('@relation') && !trimmed.includes('onDelete')) {
      issues.push({
        line: lineNum,
        type: 'missing_relation',
        severity: 'warning',
        message: `Relação sem onDelete definido`,
        suggestion: `Adicionar onDelete: Cascade, SetNull ou Restrict`,
      });
    }

    // Verificar campos String sem tamanho definido
    if (trimmed.match(/\w+\s+String\s*$/) && !trimmed.includes('@db.')) {
      const fieldMatch = trimmed.match(/^(\w+)\s+String/);
      if (fieldMatch) {
        issues.push({
          line: lineNum,
          field: fieldMatch[1],
          type: 'performance',
          severity: 'info',
          message: `Campo String sem tamanho definido (usará TEXT)`,
          suggestion: `Definir tamanho: @db.VarChar(255)`,
        });
      }
    }
  });

  return issues;
}

function generateMarkdownReport(result: LintResult): string {
  const lines = [
    '# DEV-03: Relatório do Prisma Schema Linter',
    '',
    `**Data:** ${result.timestamp}`,
    `**Arquivo:** ${result.schemaFile}`,
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
    `**Modelos encontrados:** ${result.modelsFound}`,
    '',
  ];

  if (result.issues.length > 0) {
    lines.push('## Issues Encontrados', '');

    // Agrupar por modelo
    const byModel = result.issues.reduce((acc, issue) => {
      const key = issue.model || 'Geral';
      if (!acc[key]) acc[key] = [];
      acc[key].push(issue);
      return acc;
    }, {} as Record<string, SchemaIssue[]>);

    for (const [model, issues] of Object.entries(byModel)) {
      lines.push(`### ${model}`, '');
      for (const issue of issues) {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        lines.push(`- ${icon} **Linha ${issue.line}** [${issue.type}]: ${issue.message}`);
        lines.push(`  - 💡 ${issue.suggestion}`);
        lines.push('');
      }
    }
  } else {
    lines.push('## ✅ Nenhum issue encontrado!', '');
  }

  lines.push('---', '', '*Gerado por DEV-03: Prisma Schema Linter*');

  return lines.join('\n');
}

async function main() {
  console.log('🔍 DEV-03: Prisma Schema Linter');
  console.log('=' .repeat(50));

  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema não encontrado:', schemaPath);
    process.exit(1);
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const { models } = parseSchemaFile(content);
  const issues = lintSchema(content);

  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  const result: LintResult = {
    timestamp: new Date().toISOString(),
    schemaFile: 'prisma/schema.prisma',
    modelsFound: models.size,
    issues,
    summary,
    passed: summary.critical === 0,
  };

  console.log(`📊 Modelos encontrados: ${models.size}`);
  console.log(`📊 Issues: ${summary.critical} críticos, ${summary.warning} warnings, ${summary.info} info`);

  // Salvar resultados
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'schema-lint.json'),
    JSON.stringify(result, null, 2)
  );

  const mdReport = generateMarkdownReport(result);
  fs.writeFileSync(
    path.join(outputDir, 'schema-lint.md'),
    mdReport
  );

  console.log(`\n📄 Relatórios salvos em test-results/`);

  if (!result.passed) {
    console.log('\n❌ Lint FALHOU - existem issues críticos no schema');
    process.exit(1);
  }

  console.log('\n✅ Lint APROVADO');
  process.exit(0);
}

main();
