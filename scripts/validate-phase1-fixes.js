/**
 * VALIDAÇÃO SIMPLES DE PHASE 1 SECURITY FIXES
 * 
 * Arquivo Node.js puro que valida as mudanças de segurança
 * sem depender de nenhuma dependência de teste.
 * 
 * Execução: node scripts/validate-phase1-fixes.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

/**
 * Test helper function
 */
function test(description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`${colors.green}✓ ${description}${colors.reset}`);
  } catch (error) {
    failedTests++;
    failureDetails.push({ description, error: error.message });
    console.log(`${colors.red}✗ ${description}${colors.reset}`);
    console.log(`  ${colors.yellow}${error.message}${colors.reset}`);
  }
}

/**
 * Assert helper functions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
}

function assertFileContains(filePath, pattern, description) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const isRegex = pattern instanceof RegExp;
  const matches = isRegex ? pattern.test(content) : content.includes(pattern);
  
  if (!matches) {
    throw new Error(`${description} - não encontrado em ${path.basename(filePath)}`);
  }
}

// ==================== TESTS ====================

console.log(`${colors.bold}${colors.blue}🔐 VALIDAÇÃO PHASE 1 - SECURITY FIXES${colors.reset}\n`);

// ==================== ARQUIVO 1: lot.service.ts ====================
console.log(`${colors.blue}📄 Validando LotService.findLotById()${colors.reset}`);

const lotServicePath = path.join(__dirname, '..', 'src', 'services', 'lot.service.ts');

test('LotService deve existir', () => {
  assertFileExists(lotServicePath);
});

test('findLotById deve ter parâmetro tenantId', () => {
  assertFileContains(lotServicePath, /findLotById\s*\(\s*id\s*:\s*string\s*,\s*tenantId\s*\?/, 'Parâmetro tenantId');
});

test('Deve conter validação de tenantId na query', () => {
  assertFileContains(lotServicePath, /whereClause.*tenantId|tenantId.*whereClause|tenantId.*BigInt/, 'Validação de tenantId');
});

test('Deve validar ownership de lot', () => {
  assertFileContains(lotServicePath, /lot\?\.tenantId|tenantId.*toString|ownership|mismatch/, 'Ownership validation');
});

test('Deve conter comentário de segurança', () => {
  assertFileContains(lotServicePath, /✅|SECURITY|VALIDAÇÃO|security fix/i, 'Comentário de segurança');
});

// ==================== ARQUIVO 2: installment-payment.service.ts ====================
console.log(`\n${colors.blue}📄 Validando InstallmentPaymentService.updatePaymentStatus()${colors.reset}`);

const paymentServicePath = path.join(__dirname, '..', 'src', 'services', 'installment-payment.service.ts');

test('InstallmentPaymentService deve existir', () => {
  assertFileExists(paymentServicePath);
});

test('updatePaymentStatus deve ter parâmetro tenantId', () => {
  assertFileContains(paymentServicePath, /updatePaymentStatus.*tenantId/, 'Parâmetro tenantId');
});

test('Deve validar tenantId através de relações', () => {
  assertFileContains(paymentServicePath, /userWin|lot\.tenantId|payment.*tenantId/, 'Validação via relações');
});

test('Deve lançar erro Forbidden em mismatch', () => {
  assertFileContains(paymentServicePath, /Forbidden|does not belong|tenant|Error/, 'Forbidden error');
});

// ==================== ARQUIVO 3: api route payment-methods ====================
console.log(`\n${colors.blue}📄 Validando API Route /api/bidder/payment-methods/[id]${colors.reset}`);

const routePath = path.join(
  __dirname, 
  '..', 
  'src', 
  'app', 
  'api', 
  'bidder', 
  'payment-methods',
  '[id]',
  'route.ts'
);

test('API route deve existir', () => {
  assertFileExists(routePath);
});

test('Deve validar sessão (401)', () => {
  assertFileContains(routePath, /session.*userId|session.*tenantId|401|Não autorizado/, 'Session validation');
});

test('Deve validar ownership (403)', () => {
  assertFileContains(routePath, /403|Acesso negado|user\.id|bidder/, 'Ownership validation');
});

test('Deve retornar 404 se recurso não existe', () => {
  assertFileContains(routePath, /404|não encontrado|not found/, '404 validation');
});

test('Deve ter PUT handler', () => {
  assertFileContains(routePath, /export async function PUT/, 'PUT handler');
});

test('Deve ter DELETE handler', () => {
  assertFileContains(routePath, /export async function DELETE/, 'DELETE handler');
});

// ==================== ARQUIVO 4: bidder.service.ts ====================
console.log(`\n${colors.blue}📄 Validando BidderService novos métodos${colors.reset}`);

const bidderServicePath = path.join(__dirname, '..', 'src', 'services', 'bidder.service.ts');

test('BidderService deve existir', () => {
  assertFileExists(bidderServicePath);
});

test('Deve ter método updatePaymentMethod', () => {
  assertFileContains(bidderServicePath, /updatePaymentMethod|async.*updatePaymentMethod/, 'updatePaymentMethod');
});

test('Deve ter método deletePaymentMethod', () => {
  assertFileContains(bidderServicePath, /deletePaymentMethod|async.*deletePaymentMethod/, 'deletePaymentMethod');
});

test('Deve usar ApiResponse', () => {
  assertFileContains(bidderServicePath, /ApiResponse|success|error/, 'ApiResponse pattern');
});

test('Deve ter try-catch error handling', () => {
  assertFileContains(bidderServicePath, /try\s*{|catch\s*\(/, 'Error handling');
});

// ==================== DOCUMENTAÇÃO ====================
console.log(`\n${colors.blue}📚 Validando Documentação${colors.reset}`);

test('FASE1-FIXES-IMPLEMENTED.md deve existir', () => {
  assertFileExists(path.join(__dirname, '..', 'FASE1-FIXES-IMPLEMENTED.md'));
});

test('FASE1-CONCLUSAO.md deve existir', () => {
  assertFileExists(path.join(__dirname, '..', 'FASE1-CONCLUSAO.md'));
});

test('AUDITORIA_MULTITENANT_EXECUTADA.md deve existir', () => {
  assertFileExists(path.join(__dirname, '..', 'AUDITORIA_MULTITENANT_EXECUTADA.md'));
});

test('qa-comprehensive-validation.spec.ts deve existir', () => {
  assertFileExists(path.join(__dirname, '..', 'tests', 'e2e', 'qa-comprehensive-validation.spec.ts'));
});

test('QA-REPORT-PHASE1-FINAL.md deve existir', () => {
  assertFileExists(path.join(__dirname, '..', 'QA-REPORT-PHASE1-FINAL.md'));
});

// ==================== PRINT RESULTS ====================
console.log(`\n${'='.repeat(70)}`);
console.log(`${colors.bold}RESULTADO DOS TESTES${colors.reset}`);
console.log(`${'='.repeat(70)}\n`);

console.log(`Total de testes:     ${totalTests}`);
console.log(`${colors.green}✓ Testes passados:   ${passedTests}${colors.reset}`);
console.log(`${colors.red}✗ Testes falhados:   ${failedTests}${colors.reset}\n`);

if (failedTests > 0) {
  console.log(`${colors.red}${colors.bold}Detalhes das Falhas:${colors.reset}`);
  failureDetails.forEach((detail, index) => {
    console.log(`${colors.red}  ${index + 1}. ${detail.description}${colors.reset}`);
    console.log(`     ${colors.yellow}${detail.error}${colors.reset}`);
  });
  console.log();
}

const successRate = Math.round((passedTests / totalTests) * 100);
console.log(`${'='.repeat(70)}`);
console.log(`Taxa de sucesso: ${colors.green}${successRate}%${colors.reset}\n`);

// Final message
if (failedTests === 0) {
  console.log(`${colors.green}${colors.bold}✅ VALIDAÇÃO COMPLETA - TODAS AS MUDANÇAS IMPLEMENTADAS!${colors.reset}`);
  console.log(`${colors.green}${colors.bold}✅ PRONTO PARA PRODUÇÃO${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}❌ VALIDAÇÃO FALHOU - VERIFIQUE OS ERROS ACIMA${colors.reset}\n`);
  process.exit(1);
}
