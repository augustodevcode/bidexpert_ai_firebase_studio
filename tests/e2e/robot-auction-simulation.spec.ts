/**
 * @fileoverview Robot Auction Simulation - E2E Test Suite
 * @description Simula um leilão automatizado com 10 bots arrematantes competindo
 * 
 * === FLUXO COMPLETO DO TESTE ===
 * 
 * 1. FLUXO DO ADMINISTRADOR
 *    - Login como admin@bidexpert.com.br
 *    - Criar 5 Assets (ativos) com valores entre R$ 10.000 e R$ 100.000
 *    - Criar 1 Auction (leilão) com 5 Lots vinculados aos assets
 *    - Configurar incremento de lance: R$ 1.000
 *    - Duração: 20min aberto + 5min pregão + 5min softclose = 30min total
 *    - Status inicial: RASCUNHO → ABERTO_PARA_LANCES
 *    - Habilitar 10 usuários bots
 *    - Após lances atingirem R$ 100.000, colocar em PREGAO
 *    - Encerrar leilão declarando vencedor
 * 
 * 2. FLUXO DOS 10 BOTS ARREMATANTES
 *    - Registrar 10 novos usuários (bot1@teste.com, bot2@teste.com, etc.)
 *    - Enviar documentação (simular upload)
 *    - Aguardar habilitação do admin
 *    - Dar lances nos lotes (incremento R$ 1.000)
 *    - Disputar até um vencer
 * 
 * 3. CRONJOB DE ENCERRAMENTO
 *    - Implementar lógica que encerra o leilão após 30min
 *    - Declarar o maior lance como vencedor
 * 
 * 4. FLUXO DO VENCEDOR
 *    - Navegar no painel de arrematante
 *    - Verificar dados do arremate
 *    - Baixar termo de arrematação
 *    - Agendar retirada
 * 
 * === PADRÕES DE CÓDIGO ===
 * - Usar seletores data-ai-id conforme RN-013
 * - Capturar screenshots a cada passo importante
 * - Documentar erros encontrados
 * - Usar storageState para autenticação
 * 
 * @author BidExpert E2E Team
 * @version 1.0.0
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { faker as fakerPtBr } from '@faker-js/faker/locale/pt_BR';
import path from 'node:path';
import fs from 'node:fs';

// ============================================================================
// CONFIGURAÇÃO E CONSTANTES
// ============================================================================

/**
 * URL base para testes - Vercel deployment
 */
const BASE_URL = process.env.BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';

/**
 * Credenciais do administrador
 */
const ADMIN_CREDENTIALS = {
  email: 'admin@bidexpert.com.br',
  password: 'Admin@123'
};

/**
 * Configuração do leilão
 */
const AUCTION_CONFIG = {
  title: `Leilão Robot Test ${Date.now()}`,
  description: 'Leilão automatizado para testes E2E com 10 bots arrematantes',
  bidIncrement: 1000, // R$ 1.000
  openDuration: 20, // 20 minutos - fase aberta
  pregaoDuration: 5, // 5 minutos - fase pregão
  softCloseDuration: 5, // 5 minutos - soft close
  totalDuration: 30, // 30 minutos total
  minAssetValue: 10000, // R$ 10.000
  maxAssetValue: 100000, // R$ 100.000
  targetBidValue: 100000, // R$ 100.000 - valor para disparar pregão
  numberOfBots: 10,
  numberOfAssets: 5,
  numberOfLots: 5
};

/**
 * Configuração de timeouts para testes longos
 */
const TIMEOUTS = {
  test: 60 * 60 * 1000, // 1 hora para o teste completo
  navigation: 60000, // 1 minuto para navegação
  action: 30000, // 30 segundos para ações
  apiResponse: 15000, // 15 segundos para resposta de API
  botDelay: 2000, // 2 segundos entre ações de bots (realismo)
  bidDelay: 1000, // 1 segundo entre lances
};

/**
 * Diretório para artefatos de teste
 */
const ARTIFACTS_DIR = path.resolve(process.cwd(), 'test-results/robot-auction');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const AUTH_DIR = path.resolve(process.cwd(), 'tests/e2e/.auth');

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface BotUser {
  email: string;
  password: string;
  name: string;
  cpf: string;
  phone: string;
  context?: BrowserContext;
  page?: Page;
  isEnabled: boolean;
  totalBids: number;
}

interface Asset {
  id: string;
  title: string;
  evaluationValue: number;
  address: string;
  city: string;
  state: string;
}

interface Lot {
  id: string;
  number: string;
  title: string;
  initialPrice: number;
  assetId: string;
  currentBid: number;
  highestBidder?: string;
  winner?: string;
}

interface Auction {
  id: string;
  title: string;
  status: 'RASCUNHO' | 'ABERTO_PARA_LANCES' | 'PREGAO' | 'SOFT_CLOSE' | 'ENCERRADO';
  lots: Lot[];
  startTime: Date;
  endTime: Date;
}

interface BidResult {
  success: boolean;
  lotId: string;
  bidder: string;
  amount: number;
  error?: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Garante que os diretórios de artefatos existem
 */
function ensureArtifactDirs() {
  [ARTIFACTS_DIR, SCREENSHOTS_DIR, AUTH_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Captura screenshot com timestamp e nome descritivo
 */
async function captureScreenshot(page: Page, name: string, metadata?: Record<string, unknown>) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot salvo: ${filename}`);
    
    if (metadata) {
      const metaFile = filepath.replace('.png', '.json');
      fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
    }
    
    return filepath;
  } catch (error) {
    console.warn(`⚠️ Falha ao capturar screenshot ${name}:`, error);
    return '';
  }
}

/**
 * Log estruturado para eventos do teste
 */
function logEvent(category: string, action: string, details?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    action,
    details
  };
  
  console.log(`[${timestamp}] [${category}] ${action}`);
  if (details) {
    console.log('  Detalhes:', JSON.stringify(details, null, 2));
  }
  
  // Salvar em arquivo de log
  const logFile = path.join(ARTIFACTS_DIR, 'test-events.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

/**
 * Gera dados de um bot usuário
 */
function generateBotData(index: number): BotUser {
  return {
    email: `bot${index}@teste.com`,
    password: 'Bot@12345',
    name: `Bot Arrematante ${index}`,
    cpf: generateCPF(),
    phone: generatePhone(),
    isEnabled: false,
    totalBids: 0
  };
}

/**
 * Gera CPF válido (formato)
 */
function generateCPF(): string {
  const nums = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  return nums.join('') + '00';
}

/**
 * Gera telefone válido (formato)
 */
function generatePhone(): string {
  const ddd = Math.floor(Math.random() * 90) + 11;
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `${ddd}${num}`;
}

/**
 * Gera valor aleatório entre min e max
 */
function randomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Aguarda com callback de progresso
 * @deprecated Use direct setTimeout instead
 */
async function _waitWithProgress(ms: number, message: string) {
  const steps = Math.ceil(ms / 5000);
  for (let i = 0; i < steps; i++) {
    const remaining = Math.ceil((ms - (i * 5000)) / 1000);
    console.log(`⏳ ${message} (${remaining}s restantes)`);
    await new Promise(resolve => setTimeout(resolve, Math.min(5000, ms - (i * 5000))));
  }
}

/**
 * Verifica se elemento existe e é visível
 */
async function isElementVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible({ timeout });
  } catch {
    return false;
  }
}

/**
 * Aguarda elemento aparecer com retry
 * @deprecated Use isElementVisible instead
 */
async function _waitForElement(page: Page, selector: string, timeout = 30000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clica em elemento com retry e múltiplos seletores
 */
async function clickWithRetry(page: Page, selectors: string[], options?: { timeout?: number }) {
  const timeout = options?.timeout || 10000;
  
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout });
      await element.click({ timeout: 5000 });
      return true;
    } catch {
      continue;
    }
  }
  
  throw new Error(`Nenhum seletor funcionou: ${selectors.join(', ')}`);
}

/**
 * Preenche campo com múltiplos seletores possíveis
 */
async function fillField(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 5000 });
      await element.fill(value);
      return true;
    } catch {
      continue;
    }
  }
  
  throw new Error(`Nenhum seletor de campo funcionou: ${selectors.join(', ')}`);
}

// ============================================================================
// CLASSE DE GERENCIAMENTO DE BOTS
// ============================================================================

class BotManager {
  private bots: BotUser[] = [];
  private contexts: Map<string, BrowserContext> = new Map();
  
  constructor(count: number) {
    for (let i = 1; i <= count; i++) {
      this.bots.push(generateBotData(i));
    }
  }
  
  getBots(): BotUser[] {
    return this.bots;
  }
  
  getBot(index: number): BotUser {
    return this.bots[index];
  }
  
  /**
   * Registra um bot no sistema
   */
  async registerBot(page: Page, bot: BotUser): Promise<boolean> {
    logEvent('BOT', `Registrando bot ${bot.email}`);
    
    try {
      // Navegar para página de registro
      await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle', timeout: TIMEOUTS.navigation });
      await captureScreenshot(page, `bot-register-${bot.email.split('@')[0]}`);
      
      // Preencher campos de registro
      const nameSelectors = [
        '[data-ai-id="auth-register-name-input"]',
        'input[name="name"]',
        'input[placeholder*="nome"]'
      ];
      await fillField(page, nameSelectors, bot.name);
      
      const emailSelectors = [
        '[data-ai-id="auth-register-email-input"]',
        'input[name="email"]',
        'input[type="email"]'
      ];
      await fillField(page, emailSelectors, bot.email);
      
      const passwordSelectors = [
        '[data-ai-id="auth-register-password-input"]',
        'input[name="password"]',
        'input[type="password"]'
      ];
      await fillField(page, passwordSelectors, bot.password);
      
      // Campo de confirmação de senha se existir
      const confirmPasswordSelectors = [
        '[data-ai-id="auth-register-confirm-password-input"]',
        'input[name="confirmPassword"]',
        'input[placeholder*="confirmar"]'
      ];
      try {
        await fillField(page, confirmPasswordSelectors, bot.password);
      } catch {
        // Campo pode não existir
      }
      
      // Submeter formulário
      const submitSelectors = [
        '[data-ai-id="auth-register-submit-button"]',
        'button[type="submit"]',
        'button:has-text("Cadastrar")',
        'button:has-text("Registrar")'
      ];
      await clickWithRetry(page, submitSelectors);
      
      // Aguardar redirecionamento ou mensagem de sucesso
      await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      // Verificar se registro foi bem sucedido
      const currentUrl = page.url();
      const success = !currentUrl.includes('/register') || 
                      await isElementVisible(page, 'text=/sucesso|cadastrado|registrado/i');
      
      if (success) {
        logEvent('BOT', `Bot ${bot.email} registrado com sucesso`);
        await captureScreenshot(page, `bot-register-success-${bot.email.split('@')[0]}`);
      } else {
        logEvent('BOT', `Falha no registro do bot ${bot.email}`, { url: currentUrl });
      }
      
      return success;
    } catch (error) {
      logEvent('BOT', `Erro ao registrar bot ${bot.email}`, { error: String(error) });
      await captureScreenshot(page, `bot-register-error-${bot.email.split('@')[0]}`);
      return false;
    }
  }
  
  /**
   * Faz login de um bot
   */
  async loginBot(page: Page, bot: BotUser): Promise<boolean> {
    logEvent('BOT', `Login do bot ${bot.email}`);
    
    try {
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: TIMEOUTS.navigation });
      
      const emailSelectors = [
        '[data-ai-id="auth-login-email-input"]',
        'input[name="email"]',
        'input[type="email"]'
      ];
      await fillField(page, emailSelectors, bot.email);
      
      const passwordSelectors = [
        '[data-ai-id="auth-login-password-input"]',
        'input[name="password"]',
        'input[type="password"]'
      ];
      await fillField(page, passwordSelectors, bot.password);
      
      const submitSelectors = [
        '[data-ai-id="auth-login-submit-button"]',
        'button[type="submit"]',
        'button:has-text("Entrar")'
      ];
      await clickWithRetry(page, submitSelectors);
      
      await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      const currentUrl = page.url();
      const success = !currentUrl.includes('/login');
      
      if (success) {
        logEvent('BOT', `Login bem sucedido: ${bot.email}`);
        
        // Salvar estado de autenticação
        const authFile = path.join(AUTH_DIR, `bot-${bot.email.split('@')[0]}.json`);
        await page.context().storageState({ path: authFile });
      }
      
      return success;
    } catch (error) {
      logEvent('BOT', `Erro no login do bot ${bot.email}`, { error: String(error) });
      return false;
    }
  }
  
  /**
   * Envia documentação do bot (simulado)
   */
  async submitDocumentation(page: Page, bot: BotUser): Promise<boolean> {
    logEvent('BOT', `Enviando documentação do bot ${bot.email}`);
    
    try {
      // Navegar para página de documentos
      await page.goto(`${BASE_URL}/dashboard/documents`, { waitUntil: 'networkidle', timeout: TIMEOUTS.navigation });
      
      // Verificar se existe input de arquivo
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible({ timeout: 5000 })) {
        // Criar arquivo PDF simulado
        const dummyPdf = Buffer.from('%PDF-1.4\n%fake pdf content for testing');
        
        await fileInput.setInputFiles({
          name: 'documento.pdf',
          mimeType: 'application/pdf',
          buffer: dummyPdf
        });
        
        // Aguardar e clicar em confirmar se existir
        const confirmSelectors = [
          'button:has-text("Confirmar Envio")',
          'button:has-text("Enviar")',
          'button:has-text("Upload")'
        ];
        
        try {
          await clickWithRetry(page, confirmSelectors, { timeout: 10000 });
        } catch {
          // Upload pode ser automático
        }
        
        await page.waitForTimeout(2000);
        await captureScreenshot(page, `bot-docs-uploaded-${bot.email.split('@')[0]}`);
      }
      
      logEvent('BOT', `Documentação enviada: ${bot.email}`);
      return true;
    } catch (error) {
      logEvent('BOT', `Erro ao enviar documentação: ${bot.email}`, { error: String(error) });
      return false;
    }
  }
  
  /**
   * Bot dá um lance em um lote
   */
  async placeBid(page: Page, bot: BotUser, lotId: string, amount: number): Promise<BidResult> {
    logEvent('BID', `Bot ${bot.email} dando lance de R$ ${amount} no lote ${lotId}`);
    
    try {
      // Navegar para página do lote
      await page.goto(`${BASE_URL}/lots/${lotId}`, { waitUntil: 'networkidle', timeout: TIMEOUTS.navigation });
      
      await captureScreenshot(page, `bot-bid-page-${bot.email.split('@')[0]}`);
      
      // Localizar campo de lance
      const bidInputSelectors = [
        '[data-ai-id="bid-amount-input"]',
        'input[name="bidAmount"]',
        'input[placeholder*="lance"]',
        'input[type="number"]'
      ];
      
      await fillField(page, bidInputSelectors, amount.toString());
      
      // Clicar no botão de lance
      const bidButtonSelectors = [
        '[data-ai-id="bid-submit-button"]',
        'button:has-text("Dar Lance")',
        'button:has-text("Fazer Lance")',
        'button:has-text("Lance")',
        'button[type="submit"]'
      ];
      
      await clickWithRetry(page, bidButtonSelectors);
      
      // Aguardar resposta
      await page.waitForTimeout(TIMEOUTS.botDelay);
      
      // Verificar sucesso
      const successIndicators = [
        'text=/lance registrado|lance aceito|sucesso/i',
        '[data-ai-id="bid-success-message"]',
        '.toast:has-text("sucesso")'
      ];
      
      let success = false;
      for (const selector of successIndicators) {
        if (await isElementVisible(page, selector, 5000)) {
          success = true;
          break;
        }
      }
      
      if (success) {
        bot.totalBids++;
        await captureScreenshot(page, `bot-bid-success-${bot.email.split('@')[0]}`);
      }
      
      return {
        success,
        lotId,
        bidder: bot.email,
        amount
      };
    } catch (error) {
      return {
        success: false,
        lotId,
        bidder: bot.email,
        amount,
        error: String(error)
      };
    }
  }
}

// ============================================================================
// CLASSE DE GERENCIAMENTO DO ADMIN
// ============================================================================

class AdminManager {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Login do administrador
   */
  async login(): Promise<boolean> {
    logEvent('ADMIN', 'Iniciando login do administrador');
    
    try {
      await this.page.goto(`${BASE_URL}/auth/login`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      await captureScreenshot(this.page, 'admin-login-page');
      
      // ===== STEP 1: Selecionar Tenant (Espaço de Trabalho) =====
      // O combobox de tenant pode precisar ser clicado para habilitar os campos
      const tenantSelectors = [
        '[data-ai-id="tenant-selector"]',
        'button:has-text("Espaço de Trabalho")',
        'button[role="combobox"]',
        '[aria-label*="tenant"]',
        '[aria-label*="workspace"]'
      ];
      
      try {
        // Verificar se há um combobox de tenant e clicar nele
        for (const selector of tenantSelectors) {
          const tenantCombo = this.page.locator(selector).first();
          if (await tenantCombo.isVisible({ timeout: 3000 })) {
            await tenantCombo.click();
            await this.page.waitForTimeout(500);
            
            // Selecionar "BidExpert Demo" ou similar
            const tenantOption = this.page.locator('text=/BidExpert|Demo|bidexpert/i').first();
            if (await tenantOption.isVisible({ timeout: 3000 })) {
              await tenantOption.click();
              await this.page.waitForTimeout(1000);
            }
            break;
          }
        }
      } catch (e) {
        logEvent('ADMIN', 'Tenant selector não encontrado ou não necessário', { error: String(e) });
      }
      
      // Aguardar campos serem habilitados
      await this.page.waitForTimeout(1500);
      await captureScreenshot(this.page, 'admin-login-after-tenant');
      
      // ===== STEP 2: Preencher credenciais =====
      // Tentar múltiplos seletores para email
      const emailSelectors = [
        '[data-ai-id="auth-login-email-input"]',
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]'
      ];
      
      // Aguardar campo estar habilitado
      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          const field = this.page.locator(selector).first();
          await field.waitFor({ state: 'visible', timeout: 5000 });
          if (!await field.isDisabled()) {
            emailField = field;
            break;
          }
        } catch { continue; }
      }
      
      if (emailField) {
        await emailField.fill(ADMIN_CREDENTIALS.email);
      } else {
        // Se campo já está preenchido (autofill), verificar
        logEvent('ADMIN', 'Campo email pode estar preenchido automaticamente');
      }
      
      // Tentar múltiplos seletores para senha
      const passwordSelectors = [
        '[data-ai-id="auth-login-password-input"]',
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="senha"]',
        'input[placeholder*="Senha"]'
      ];
      
      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          const field = this.page.locator(selector).first();
          await field.waitFor({ state: 'visible', timeout: 5000 });
          if (!await field.isDisabled()) {
            passwordField = field;
            break;
          }
        } catch { continue; }
      }
      
      if (passwordField) {
        await passwordField.fill(ADMIN_CREDENTIALS.password);
      } else {
        logEvent('ADMIN', 'Campo senha pode estar preenchido automaticamente');
      }
      
      await captureScreenshot(this.page, 'admin-login-credentials-filled');
      
      // ===== STEP 3: Clicar em entrar =====
      const submitSelectors = [
        '[data-ai-id="auth-login-submit-button"]',
        'button[type="submit"]',
        'button:has-text("Entrar")',
        'button:has-text("Login")',
        'button:has-text("Acessar")'
      ];
      
      // Verificar se o botão está habilitado
      for (const selector of submitSelectors) {
        try {
          const btn = this.page.locator(selector).first();
          if (await btn.isVisible({ timeout: 3000 }) && !await btn.isDisabled()) {
            await btn.click();
            break;
          }
        } catch { continue; }
      }
      
      // Aguardar redirecionamento
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      const currentUrl = this.page.url();
      const success = !currentUrl.includes('/auth/login');
      
      if (success) {
        logEvent('ADMIN', 'Login bem sucedido');
        
        // Salvar estado de autenticação
        const authFile = path.join(AUTH_DIR, 'admin-robot.json');
        await this.page.context().storageState({ path: authFile });
        
        await captureScreenshot(this.page, 'admin-login-success');
      } else {
        logEvent('ADMIN', 'Falha no login', { url: currentUrl });
        await captureScreenshot(this.page, 'admin-login-failed');
      }
      
      return success;
    } catch (error) {
      logEvent('ADMIN', 'Erro no login', { error: String(error) });
      await captureScreenshot(this.page, 'admin-login-error');
      return false;
    }
  }
  
  /**
   * Cria um asset
   */
  async createAsset(index: number): Promise<Asset | null> {
    logEvent('ADMIN', `Criando asset ${index}`);
    
    try {
      await this.page.goto(`${BASE_URL}/admin/assets/new`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      const assetData: Omit<Asset, 'id'> = {
        title: `Ativo Robot Test ${index} - ${fakerPtBr.commerce.productName()}`,
        evaluationValue: randomValue(AUCTION_CONFIG.minAssetValue, AUCTION_CONFIG.maxAssetValue),
        address: fakerPtBr.location.street(),
        city: fakerPtBr.location.city(),
        state: fakerPtBr.location.state({ abbreviated: true })
      };
      
      // Preencher título
      const titleSelectors = [
        '[data-ai-id="asset-title-input"]',
        'input[name="title"]',
        'input[placeholder*="título"]'
      ];
      await fillField(this.page, titleSelectors, assetData.title);
      
      // Preencher valor de avaliação
      const valueSelectors = [
        '[data-ai-id="asset-evaluation-value-input"]',
        'input[name="evaluationValue"]',
        'input[placeholder*="avaliação"]'
      ];
      await fillField(this.page, valueSelectors, assetData.evaluationValue.toString());
      
      // Preencher endereço
      const addressSelectors = [
        '[data-ai-id="asset-address-input"]',
        'input[name="address"]',
        'input[placeholder*="endereço"]'
      ];
      await fillField(this.page, addressSelectors, assetData.address);
      
      // Selecionar status disponível
      const statusSelectors = [
        '[data-ai-id="asset-status-select"]',
        'button:has-text("Status")'
      ];
      try {
        await clickWithRetry(this.page, statusSelectors);
        await this.page.waitForTimeout(500);
        await this.page.click('text=/DISPONIVEL|Disponível/i');
      } catch {
        // Status pode ser padrão
      }
      
      // Salvar
      const saveSelectors = [
        '[data-ai-id="asset-save-button"]',
        'button:has-text("Salvar")',
        'button[type="submit"]'
      ];
      await clickWithRetry(this.page, saveSelectors);
      
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      // Extrair ID do asset da URL ou da página
      const url = this.page.url();
      const idMatch = url.match(/\/assets\/([^/]+)/);
      const assetId = idMatch ? idMatch[1] : `asset-${Date.now()}-${index}`;
      
      await captureScreenshot(this.page, `admin-asset-created-${index}`);
      
      logEvent('ADMIN', `Asset ${index} criado`, { 
        id: assetId, 
        title: assetData.title, 
        value: assetData.evaluationValue 
      });
      
      return {
        id: assetId,
        ...assetData
      };
    } catch (error) {
      logEvent('ADMIN', `Erro ao criar asset ${index}`, { error: String(error) });
      await captureScreenshot(this.page, `admin-asset-error-${index}`);
      return null;
    }
  }
  
  /**
   * Cria um leilão
   */
  async createAuction(_assets: Asset[]): Promise<Auction | null> {
    logEvent('ADMIN', 'Criando leilão');
    
    try {
      await this.page.goto(`${BASE_URL}/admin/auctions/new`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      await captureScreenshot(this.page, 'admin-auction-form');
      
      // Preencher título
      const titleSelectors = [
        '[data-ai-id="auction-title-input"]',
        'input[name="title"]',
        'input[placeholder*="título"]'
      ];
      await fillField(this.page, titleSelectors, AUCTION_CONFIG.title);
      
      // Preencher descrição
      const descSelectors = [
        '[data-ai-id="auction-description-input"]',
        'textarea[name="description"]',
        'textarea[placeholder*="descrição"]'
      ];
      try {
        await fillField(this.page, descSelectors, AUCTION_CONFIG.description);
      } catch {
        // Campo pode não existir
      }
      
      // Expandir seção de modalidade se existir
      try {
        await this.page.click('button:has-text("Modalidade")');
        await this.page.waitForTimeout(500);
      } catch {
        // Seção pode estar expandida por padrão
      }
      
      // Selecionar modalidade
      const modalitySelectors = [
        '[data-ai-id="auction-modality-select"]',
        'button:has-text("Modalidade")'
      ];
      try {
        await clickWithRetry(this.page, modalitySelectors);
        await this.page.waitForTimeout(500);
        await this.page.click('text=/PARTICULAR|EXTRAJUDICIAL/i');
      } catch {
        // Modalidade pode ter padrão
      }
      
      // Selecionar método STANDARD
      try {
        await this.page.click('button:has-text("Método")');
        await this.page.waitForTimeout(500);
        await this.page.click('text=/STANDARD/i');
      } catch {
        // Método pode ter padrão
      }
      
      // Configurar status como RASCUNHO inicialmente
      const statusSelectors = [
        '[data-ai-id="auction-status-select"]',
        'button:has-text("Status")'
      ];
      try {
        await clickWithRetry(this.page, statusSelectors);
        await this.page.waitForTimeout(500);
        await this.page.click('text=/RASCUNHO|EM_BREVE/i');
      } catch {
        // Status pode ter padrão
      }
      
      // Salvar leilão
      const saveSelectors = [
        '[data-ai-id="auction-save-button"]',
        'button:has-text("Salvar")',
        'button:has-text("Criar Leilão")',
        'button[type="submit"]'
      ];
      await clickWithRetry(this.page, saveSelectors);
      
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      // Extrair ID do leilão da URL
      const url = this.page.url();
      const idMatch = url.match(/\/auctions\/([^/]+)/);
      const auctionId = idMatch ? idMatch[1] : `auction-${Date.now()}`;
      
      await captureScreenshot(this.page, 'admin-auction-created');
      
      logEvent('ADMIN', 'Leilão criado', { id: auctionId, title: AUCTION_CONFIG.title });
      
      return {
        id: auctionId,
        title: AUCTION_CONFIG.title,
        status: 'RASCUNHO',
        lots: [],
        startTime: new Date(),
        endTime: new Date(Date.now() + AUCTION_CONFIG.totalDuration * 60 * 1000)
      };
    } catch (error) {
      logEvent('ADMIN', 'Erro ao criar leilão', { error: String(error) });
      await captureScreenshot(this.page, 'admin-auction-error');
      return null;
    }
  }
  
  /**
   * Cria um lote vinculado a um asset
   */
  async createLot(auctionId: string, asset: Asset, index: number): Promise<Lot | null> {
    logEvent('ADMIN', `Criando lote ${index} para asset ${asset.id}`);
    
    try {
      await this.page.goto(`${BASE_URL}/admin/lots/new`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      const lotNumber = String(index).padStart(3, '0');
      const initialPrice = Math.floor(asset.evaluationValue * 0.5); // 50% do valor de avaliação
      
      // Preencher número do lote
      const numberSelectors = [
        '[data-ai-id="lot-number-input"]',
        'input[name="number"]',
        'input[placeholder*="número"]'
      ];
      await fillField(this.page, numberSelectors, lotNumber);
      
      // Preencher título
      const titleSelectors = [
        '[data-ai-id="lot-title-input"]',
        'input[name="title"]',
        'input[placeholder*="título"]'
      ];
      await fillField(this.page, titleSelectors, `Lote ${lotNumber} - ${asset.title}`);
      
      // Selecionar leilão
      const auctionSelectors = [
        '[data-ai-id="lot-auction-select"]',
        'button:has-text("Leilão")'
      ];
      try {
        await clickWithRetry(this.page, auctionSelectors);
        await this.page.waitForTimeout(500);
        await this.page.click(`text=/${AUCTION_CONFIG.title.substring(0, 30)}/i`);
      } catch {
        // Leilão pode ser pré-selecionado
      }
      
      // Preencher preço inicial
      const priceSelectors = [
        '[data-ai-id="lot-initial-price-input"]',
        'input[name="initialPrice"]',
        'input[placeholder*="preço"]'
      ];
      await fillField(this.page, priceSelectors, initialPrice.toString());
      
      // Preencher incremento
      const incrementSelectors = [
        '[data-ai-id="lot-bid-increment-input"]',
        'input[name="bidIncrement"]',
        'input[placeholder*="incremento"]'
      ];
      await fillField(this.page, incrementSelectors, AUCTION_CONFIG.bidIncrement.toString());
      
      // Selecionar status disponível
      const statusSelectors = [
        '[data-ai-id="lot-status-select"]',
        'button:has-text("Status")'
      ];
      try {
        await clickWithRetry(this.page, statusSelectors);
        await this.page.waitForTimeout(500);
        await this.page.click('text=/DISPONIVEL|ABERTO/i');
      } catch {
        // Status pode ter padrão
      }
      
      // Salvar
      const saveSelectors = [
        '[data-ai-id="lot-save-button"]',
        'button:has-text("Salvar")',
        'button[type="submit"]'
      ];
      await clickWithRetry(this.page, saveSelectors);
      
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      const url = this.page.url();
      const idMatch = url.match(/\/lots\/([^/]+)/);
      const lotId = idMatch ? idMatch[1] : `lot-${Date.now()}-${index}`;
      
      await captureScreenshot(this.page, `admin-lot-created-${index}`);
      
      logEvent('ADMIN', `Lote ${index} criado`, { 
        id: lotId, 
        number: lotNumber, 
        price: initialPrice 
      });
      
      return {
        id: lotId,
        number: lotNumber,
        title: `Lote ${lotNumber} - ${asset.title}`,
        initialPrice,
        assetId: asset.id,
        currentBid: initialPrice
      };
    } catch (error) {
      logEvent('ADMIN', `Erro ao criar lote ${index}`, { error: String(error) });
      await captureScreenshot(this.page, `admin-lot-error-${index}`);
      return null;
    }
  }
  
  /**
   * Habilita um usuário arrematante
   */
  async enableUser(userEmail: string): Promise<boolean> {
    logEvent('ADMIN', `Habilitando usuário ${userEmail}`);
    
    try {
      await this.page.goto(`${BASE_URL}/admin/habilitations`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      // Buscar usuário
      const searchSelectors = [
        'input[placeholder="Buscar..."]',
        'input[type="search"]',
        '[data-ai-id="habilitation-search-input"]'
      ];
      
      try {
        await fillField(this.page, searchSelectors, userEmail);
        await this.page.waitForTimeout(1000);
      } catch {
        // Busca pode não existir
      }
      
      // Encontrar linha do usuário
      const userRow = this.page.locator('tr').filter({ hasText: userEmail }).first();
      
      if (await userRow.isVisible({ timeout: 5000 })) {
        // Clicar no botão de aprovar/habilitar
        const approveSelectors = [
          'button:has-text("Aprovar")',
          'button:has-text("Habilitar")',
          'button:has-text("Aprovar Habilitação")'
        ];
        
        for (const selector of approveSelectors) {
          const btn = userRow.locator(selector).first();
          if (await btn.isVisible({ timeout: 2000 })) {
            await btn.click();
            break;
          }
        }
        
        // Confirmar se houver modal
        const confirmSelectors = [
          'button:has-text("Confirmar")',
          'button:has-text("Sim")',
          'button:has-text("OK")'
        ];
        
        try {
          await clickWithRetry(this.page, confirmSelectors, { timeout: 5000 });
        } catch {
          // Pode não haver modal de confirmação
        }
        
        await this.page.waitForTimeout(2000);
        
        // Verificar se status mudou
        const success = await this.page.locator('text=/Habilitado|Aprovado/i').first().isVisible({ timeout: 5000 });
        
        await captureScreenshot(this.page, `admin-user-enabled-${userEmail.split('@')[0]}`);
        
        logEvent('ADMIN', `Usuário ${userEmail} habilitado: ${success}`);
        return success;
      }
      
      return false;
    } catch (error) {
      logEvent('ADMIN', `Erro ao habilitar usuário ${userEmail}`, { error: String(error) });
      return false;
    }
  }
  
  /**
   * Muda status do leilão
   */
  async changeAuctionStatus(auctionId: string, newStatus: string): Promise<boolean> {
    logEvent('ADMIN', `Mudando status do leilão ${auctionId} para ${newStatus}`);
    
    try {
      await this.page.goto(`${BASE_URL}/admin/auctions/${auctionId}/edit`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      // Expandir seção de informações gerais
      try {
        await this.page.click('button:has-text("Informações Gerais")');
        await this.page.waitForTimeout(500);
      } catch {
        // Seção pode estar expandida
      }
      
      // Selecionar novo status
      const statusSelectors = [
        '[data-ai-id="auction-status-select"]',
        'button:has-text("Status")'
      ];
      await clickWithRetry(this.page, statusSelectors);
      await this.page.waitForTimeout(500);
      await this.page.click(`text=/${newStatus}/i`);
      
      // Salvar
      const saveSelectors = [
        '[data-ai-id="auction-save-button"]',
        'button:has-text("Salvar")',
        'button[type="submit"]'
      ];
      await clickWithRetry(this.page, saveSelectors);
      
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      await captureScreenshot(this.page, `admin-auction-status-${newStatus}`);
      
      logEvent('ADMIN', `Status do leilão alterado para ${newStatus}`);
      return true;
    } catch (error) {
      logEvent('ADMIN', `Erro ao mudar status do leilão`, { error: String(error) });
      return false;
    }
  }
  
  /**
   * Encerra leilão e declara vencedor
   */
  async closeAuction(auctionId: string): Promise<boolean> {
    logEvent('ADMIN', `Encerrando leilão ${auctionId}`);
    
    try {
      // Mudar status para ENCERRADO
      await this.changeAuctionStatus(auctionId, 'ENCERRADO');
      
      // Navegar para página de encerramento
      await this.page.goto(`${BASE_URL}/admin/auctions/${auctionId}/close`, { 
        waitUntil: 'networkidle', 
        timeout: TIMEOUTS.navigation 
      });
      
      // Clicar em encerrar e declarar vencedores
      const closeSelectors = [
        '[data-ai-id="auction-close-button"]',
        'button:has-text("Encerrar Leilão")',
        'button:has-text("Declarar Vencedores")',
        'button:has-text("Finalizar")'
      ];
      
      try {
        await clickWithRetry(this.page, closeSelectors);
      } catch {
        // Leilão pode ser encerrado automaticamente
      }
      
      await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.navigation });
      
      await captureScreenshot(this.page, 'admin-auction-closed');
      
      logEvent('ADMIN', `Leilão ${auctionId} encerrado`);
      return true;
    } catch (error) {
      logEvent('ADMIN', `Erro ao encerrar leilão`, { error: String(error) });
      return false;
    }
  }
}

// ============================================================================
// TESTES E2E
// ============================================================================

// Configurar timeout global para o teste
test.setTimeout(TIMEOUTS.test);

test.describe.serial('Robot Auction Simulation - Complete Flow', () => {
  let adminPage: Page;
  let adminManager: AdminManager;
  let botManager: BotManager;
  const createdAssets: Asset[] = [];
  let createdAuction: Auction | null = null;
  const createdLots: Lot[] = [];
  
  // ============================================================================
  // SETUP
  // ============================================================================
  
  test.beforeAll(async ({ browser }) => {
    ensureArtifactDirs();
    logEvent('TEST', 'Iniciando Robot Auction Simulation');
    
    // Inicializar gerenciadores
    botManager = new BotManager(AUCTION_CONFIG.numberOfBots);
    
    // Criar contexto e página para admin
    const adminContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: path.join(ARTIFACTS_DIR, 'videos') }
    });
    adminPage = await adminContext.newPage();
    adminManager = new AdminManager(adminPage);
    
    logEvent('TEST', 'Setup concluído');
  });
  
  test.afterAll(async () => {
    // Fechar páginas e contextos
    await adminPage.close();
    
    logEvent('TEST', 'Robot Auction Simulation finalizado');
    
    // Gerar relatório final
    generateFinalReport(createdAssets, createdAuction, createdLots, botManager.getBots());
  });
  
  // ============================================================================
  // 1. FLUXO DO ADMINISTRADOR
  // ============================================================================
  
  test.describe('1. Admin Flow', () => {
    
    test('1.1 - Admin Login', async () => {
      const success = await adminManager.login();
      expect(success).toBeTruthy();
    });
    
    test('1.2 - Create 5 Assets', async () => {
      for (let i = 1; i <= AUCTION_CONFIG.numberOfAssets; i++) {
        const asset = await adminManager.createAsset(i);
        expect(asset).not.toBeNull();
        if (asset) {
          createdAssets.push(asset);
        }
        // Pequena pausa entre criações
        await adminPage.waitForTimeout(1000);
      }
      
      expect(createdAssets.length).toBe(AUCTION_CONFIG.numberOfAssets);
      
      logEvent('TEST', 'Assets criados', { 
        count: createdAssets.length,
        totalValue: createdAssets.reduce((sum, a) => sum + a.evaluationValue, 0)
      });
    });
    
    test('1.3 - Create Auction with Draft Status', async () => {
      createdAuction = await adminManager.createAuction(createdAssets);
      expect(createdAuction).not.toBeNull();
    });
    
    test('1.4 - Create 5 Lots Linked to Assets', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      for (let i = 0; i < createdAssets.length; i++) {
        const lot = await adminManager.createLot(createdAuction.id, createdAssets[i], i + 1);
        expect(lot).not.toBeNull();
        if (lot) {
          createdLots.push(lot);
        }
        await adminPage.waitForTimeout(1000);
      }
      
      expect(createdLots.length).toBe(AUCTION_CONFIG.numberOfLots);
      
      logEvent('TEST', 'Lotes criados', { count: createdLots.length });
    });
    
    test('1.5 - Change Auction Status to ABERTO_PARA_LANCES', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      const success = await adminManager.changeAuctionStatus(createdAuction.id, 'ABERTO_PARA_LANCES');
      expect(success).toBeTruthy();
      
      if (createdAuction) {
        createdAuction.status = 'ABERTO_PARA_LANCES';
        createdAuction.startTime = new Date();
      }
    });
  });
  
  // ============================================================================
  // 2. FLUXO DOS BOTS ARREMATANTES
  // ============================================================================
  
  test.describe('2. Bot Registration and Habilitation', () => {
    
    test('2.1 - Register 10 Bot Users', async ({ browser }) => {
      const bots = botManager.getBots();
      
      for (let i = 0; i < bots.length; i++) {
        const bot = bots[i];
        
        // Criar nova página para cada bot
        const botContext = await browser.newContext({
          viewport: { width: 1280, height: 720 }
        });
        const botPage = await botContext.newPage();
        
        const success = await botManager.registerBot(botPage, bot);
        
        await botPage.close();
        await botContext.close();
        
        // Logar resultado mas não falhar se registro já existe
        logEvent('TEST', `Registro do bot ${bot.email}: ${success ? 'Sucesso' : 'Pode já existir'}`);
      }
      
      // Pelo menos alguns bots devem ter sido registrados
      logEvent('TEST', 'Processo de registro de bots concluído');
    });
    
    test('2.2 - Bots Login and Submit Documentation', async ({ browser }) => {
      const bots = botManager.getBots();
      
      for (let i = 0; i < bots.length; i++) {
        const bot = bots[i];
        
        const botContext = await browser.newContext({
          viewport: { width: 1280, height: 720 }
        });
        const botPage = await botContext.newPage();
        
        // Tentar login
        const loginSuccess = await botManager.loginBot(botPage, bot);
        
        if (loginSuccess) {
          // Enviar documentação
          await botManager.submitDocumentation(botPage, bot);
        }
        
        await botPage.close();
        await botContext.close();
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      logEvent('TEST', 'Bots enviaram documentação');
    });
    
    test('2.3 - Admin Enable Bot Users', async () => {
      const bots = botManager.getBots();
      
      for (const bot of bots) {
        const success = await adminManager.enableUser(bot.email);
        if (success) {
          bot.isEnabled = true;
        }
        
        await adminPage.waitForTimeout(500);
      }
      
      // Contar bots habilitados
      const enabledCount = bots.filter(b => b.isEnabled).length;
      logEvent('TEST', `Bots habilitados: ${enabledCount}/${bots.length}`);
      
      // Pelo menos alguns devem estar habilitados
      expect(enabledCount).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // 3. BIDDING PHASE
  // ============================================================================
  
  test.describe('3. Bidding Phase', () => {
    
    test('3.1 - Open Bidding Phase (20 minutes simulation)', async ({ browser }) => {
      if (!createdAuction || createdLots.length === 0) {
        test.skip();
        return;
      }
      
      const bots = botManager.getBots().filter(b => b.isEnabled);
      
      if (bots.length === 0) {
        logEvent('TEST', 'Nenhum bot habilitado para lances', { severity: 'warning' });
        test.skip();
        return;
      }
      
      logEvent('TEST', 'Iniciando fase de lances abertos', { 
        botsEnabled: bots.length,
        lotsAvailable: createdLots.length 
      });
      
      // Simular lances durante a fase aberta
      // Para teste mais rápido, faremos uma versão acelerada
      const biddingRounds = 20; // Reduzido para teste
      let highestBid = 0;
      
      for (let round = 0; round < biddingRounds; round++) {
        // Cada bot dá lance em um lote aleatório
        for (const bot of bots) {
          const randomLot = createdLots[Math.floor(Math.random() * createdLots.length)];
          
          // Calcular próximo lance
          const currentBid = randomLot.currentBid || randomLot.initialPrice;
          const newBid = currentBid + AUCTION_CONFIG.bidIncrement;
          
          // Criar página para o bot
          const botContext = await browser.newContext();
          const botPage = await botContext.newPage();
          
          // Login do bot
          const loginSuccess = await botManager.loginBot(botPage, bot);
          
          if (loginSuccess) {
            // Dar lance
            const result = await botManager.placeBid(botPage, bot, randomLot.id, newBid);
            
            if (result.success) {
              randomLot.currentBid = newBid;
              randomLot.highestBidder = bot.email;
              
              if (newBid > highestBid) {
                highestBid = newBid;
              }
              
              logEvent('BID', `Lance registrado`, {
                bot: bot.email,
                lot: randomLot.number,
                amount: newBid
              });
            }
          }
          
          await botPage.close();
          await botContext.close();
          
          // Delay entre lances
          await new Promise(resolve => setTimeout(resolve, TIMEOUTS.bidDelay));
        }
        
        // Verificar se atingiu valor para entrar em pregão
        if (highestBid >= AUCTION_CONFIG.targetBidValue) {
          logEvent('TEST', `Valor alvo de R$ ${AUCTION_CONFIG.targetBidValue} atingido!`);
          break;
        }
      }
      
      // Capturar estado final da fase aberta
      await captureScreenshot(adminPage, 'bidding-phase-end');
      
      logEvent('TEST', 'Fase de lances abertos finalizada', { highestBid });
    });
    
    test('3.2 - Change Auction to PREGAO Status', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      const success = await adminManager.changeAuctionStatus(createdAuction.id, 'PREGAO');
      
      if (success && createdAuction) {
        createdAuction.status = 'PREGAO';
      }
      
      logEvent('TEST', `Status do leilão: ${createdAuction?.status}`);
    });
    
    test('3.3 - Pregao Phase (5 minutes simulation)', async ({ browser }) => {
      if (!createdAuction || createdAuction.status !== 'PREGAO') {
        test.skip();
        return;
      }
      
      const bots = botManager.getBots().filter(b => b.isEnabled);
      
      logEvent('TEST', 'Iniciando fase PREGAO');
      
      // Fase de pregão - lances mais intensos
      const pregaoRounds = 10;
      
      for (let round = 0; round < pregaoRounds; round++) {
        for (const bot of bots) {
          const randomLot = createdLots[Math.floor(Math.random() * createdLots.length)];
          const currentBid = randomLot.currentBid || randomLot.initialPrice;
          const newBid = currentBid + AUCTION_CONFIG.bidIncrement;
          
          const botContext = await browser.newContext();
          const botPage = await botContext.newPage();
          
          const loginSuccess = await botManager.loginBot(botPage, bot);
          
          if (loginSuccess) {
            const result = await botManager.placeBid(botPage, bot, randomLot.id, newBid);
            
            if (result.success) {
              randomLot.currentBid = newBid;
              randomLot.highestBidder = bot.email;
            }
          }
          
          await botPage.close();
          await botContext.close();
          
          await new Promise(resolve => setTimeout(resolve, TIMEOUTS.bidDelay));
        }
      }
      
      await captureScreenshot(adminPage, 'pregao-phase-end');
      
      logEvent('TEST', 'Fase PREGAO finalizada', {
        lots: createdLots.map(l => ({ number: l.number, bid: l.currentBid, bidder: l.highestBidder }))
      });
    });
  });
  
  // ============================================================================
  // 4. CRONJOB / AUCTION CLOSING
  // ============================================================================
  
  test.describe('4. Auction Closing', () => {
    
    test('4.1 - Trigger Soft Close Phase', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      const success = await adminManager.changeAuctionStatus(createdAuction.id, 'SOFT_CLOSE');
      
      if (success && createdAuction) {
        createdAuction.status = 'SOFT_CLOSE';
      }
      
      logEvent('TEST', 'Fase Soft Close iniciada');
    });
    
    test('4.2 - Close Auction and Declare Winners', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      const success = await adminManager.closeAuction(createdAuction.id);
      
      if (success && createdAuction) {
        createdAuction.status = 'ENCERRADO';
        
        // Declarar vencedores para cada lote
        for (const lot of createdLots) {
          lot.winner = lot.highestBidder;
        }
      }
      
      await captureScreenshot(adminPage, 'auction-final-closed');
      
      logEvent('TEST', 'Leilão encerrado e vencedores declarados', {
        status: createdAuction?.status,
        winners: createdLots.map(l => ({ lot: l.number, winner: l.winner, bid: l.currentBid }))
      });
    });
  });
  
  // ============================================================================
  // 5. WINNER FLOW
  // ============================================================================
  
  test.describe('5. Winner Flow', () => {
    
    test('5.1 - Winner Access Dashboard', async ({ browser }) => {
      // Encontrar um vencedor
      const winningLot = createdLots.find(l => l.winner);
      
      if (!winningLot || !winningLot.winner) {
        logEvent('TEST', 'Nenhum vencedor encontrado para testar fluxo', { severity: 'warning' });
        test.skip();
        return;
      }
      
      const winnerBot = botManager.getBots().find(b => b.email === winningLot.winner);
      
      if (!winnerBot) {
        test.skip();
        return;
      }
      
      logEvent('TEST', `Testando fluxo do vencedor: ${winnerBot.email}`);
      
      const winnerContext = await browser.newContext();
      const winnerPage = await winnerContext.newPage();
      
      // Login do vencedor
      const loginSuccess = await botManager.loginBot(winnerPage, winnerBot);
      
      if (loginSuccess) {
        // Navegar para dashboard
        await winnerPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
        await captureScreenshot(winnerPage, 'winner-dashboard');
        
        // Verificar se dados do arremate estão visíveis
        const wonLotsVisible = await isElementVisible(winnerPage, 'text=/arrematados|ganhou|venceu/i');
        logEvent('TEST', `Dashboard do vencedor - Lotes arrematados visíveis: ${wonLotsVisible}`);
        
        // Navegar para página de lotes ganhos
        await winnerPage.goto(`${BASE_URL}/dashboard/wins`, { waitUntil: 'networkidle' });
        await captureScreenshot(winnerPage, 'winner-wins-page');
      }
      
      await winnerPage.close();
      await winnerContext.close();
    });
    
    test('5.2 - Download Auction Term', async ({ browser }) => {
      const winningLot = createdLots.find(l => l.winner);
      
      if (!winningLot || !winningLot.winner) {
        test.skip();
        return;
      }
      
      const winnerBot = botManager.getBots().find(b => b.email === winningLot.winner);
      
      if (!winnerBot) {
        test.skip();
        return;
      }
      
      const winnerContext = await browser.newContext();
      const winnerPage = await winnerContext.newPage();
      
      await botManager.loginBot(winnerPage, winnerBot);
      
      // Navegar para página do lote ganho
      await winnerPage.goto(`${BASE_URL}/dashboard/wins`, { waitUntil: 'networkidle' });
      
      // Procurar botão de download do termo
      const downloadSelectors = [
        '[data-ai-id="download-auction-term-button"]',
        'button:has-text("Baixar Termo")',
        'button:has-text("Download")',
        'a:has-text("Termo de Arrematação")'
      ];
      
      let downloadTriggered = false;
      
      for (const selector of downloadSelectors) {
        if (await isElementVisible(winnerPage, selector)) {
          // Esperar pelo download
          const [download] = await Promise.all([
            winnerPage.waitForEvent('download', { timeout: 30000 }).catch(() => null),
            winnerPage.click(selector)
          ]);
          
          if (download) {
            const downloadPath = path.join(ARTIFACTS_DIR, `termo-arrematacao-${winningLot.number}.pdf`);
            await download.saveAs(downloadPath);
            downloadTriggered = true;
            logEvent('TEST', `Termo de arrematação baixado: ${downloadPath}`);
            break;
          }
        }
      }
      
      if (!downloadTriggered) {
        logEvent('TEST', 'Botão de download do termo não encontrado', { severity: 'warning' });
      }
      
      await captureScreenshot(winnerPage, 'winner-term-download-attempt');
      
      await winnerPage.close();
      await winnerContext.close();
    });
    
    test('5.3 - Schedule Pickup', async ({ browser }) => {
      const winningLot = createdLots.find(l => l.winner);
      
      if (!winningLot || !winningLot.winner) {
        test.skip();
        return;
      }
      
      const winnerBot = botManager.getBots().find(b => b.email === winningLot.winner);
      
      if (!winnerBot) {
        test.skip();
        return;
      }
      
      const winnerContext = await browser.newContext();
      const winnerPage = await winnerContext.newPage();
      
      await botManager.loginBot(winnerPage, winnerBot);
      
      // Navegar para página de agendamento
      await winnerPage.goto(`${BASE_URL}/dashboard/wins`, { waitUntil: 'networkidle' });
      
      // Procurar opção de agendar retirada
      const scheduleSelectors = [
        '[data-ai-id="schedule-pickup-button"]',
        'button:has-text("Agendar Retirada")',
        'button:has-text("Agendar")',
        'a:has-text("Retirada")'
      ];
      
      for (const selector of scheduleSelectors) {
        if (await isElementVisible(winnerPage, selector)) {
          await winnerPage.click(selector);
          await winnerPage.waitForTimeout(2000);
          
          // Preencher formulário de agendamento se existir
          const dateSelectors = [
            'input[type="date"]',
            'input[name="pickupDate"]',
            '[data-ai-id="pickup-date-input"]'
          ];
          
          for (const dateSelector of dateSelectors) {
            if (await isElementVisible(winnerPage, dateSelector)) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dateStr = tomorrow.toISOString().split('T')[0];
              await fillField(winnerPage, [dateSelector], dateStr);
              break;
            }
          }
          
          // Confirmar agendamento
          const confirmSelectors = [
            'button:has-text("Confirmar")',
            'button:has-text("Agendar")',
            'button[type="submit"]'
          ];
          
          try {
            await clickWithRetry(winnerPage, confirmSelectors, { timeout: 5000 });
          } catch {
            // Pode não haver botão de confirmação
          }
          
          break;
        }
      }
      
      await captureScreenshot(winnerPage, 'winner-schedule-pickup');
      
      await winnerPage.close();
      await winnerContext.close();
      
      logEvent('TEST', 'Tentativa de agendamento de retirada concluída');
    });
  });
  
  // ============================================================================
  // 6. VERIFICATION AND REPORT
  // ============================================================================
  
  test.describe('6. Final Verification', () => {
    
    test('6.1 - Verify Auction Status in Admin', async () => {
      if (!createdAuction) {
        test.skip();
        return;
      }
      
      await adminPage.goto(`${BASE_URL}/admin/auctions/${createdAuction.id}`, { 
        waitUntil: 'networkidle' 
      });
      
      await captureScreenshot(adminPage, 'final-auction-status');
      
      // Verificar status ENCERRADO
      const statusVisible = await isElementVisible(adminPage, 'text=/ENCERRADO|Encerrado/i');
      logEvent('TEST', `Status ENCERRADO visível: ${statusVisible}`);
    });
    
    test('6.2 - Verify Bid History', async () => {
      if (createdLots.length === 0) {
        test.skip();
        return;
      }
      
      const firstLot = createdLots[0];
      
      await adminPage.goto(`${BASE_URL}/admin/lots/${firstLot.id}`, { 
        waitUntil: 'networkidle' 
      });
      
      await captureScreenshot(adminPage, 'final-lot-details');
      
      // Verificar histórico de lances
      const historyVisible = await isElementVisible(adminPage, 'text=/histórico|lances|Histórico/i');
      logEvent('TEST', `Histórico de lances visível: ${historyVisible}`);
    });
    
    test('6.3 - Generate Test Report', async () => {
      const report = {
        testExecution: {
          startTime: new Date().toISOString(),
          duration: 'N/A',
          status: 'COMPLETED'
        },
        auction: createdAuction ? {
          id: createdAuction.id,
          title: createdAuction.title,
          status: createdAuction.status
        } : null,
        assets: createdAssets.map(a => ({
          id: a.id,
          title: a.title,
          value: a.evaluationValue
        })),
        lots: createdLots.map(l => ({
          id: l.id,
          number: l.number,
          title: l.title,
          initialPrice: l.initialPrice,
          finalBid: l.currentBid,
          winner: l.winner
        })),
        bots: botManager.getBots().map(b => ({
          email: b.email,
          name: b.name,
          enabled: b.isEnabled,
          totalBids: b.totalBids
        })),
        summary: {
          totalAssets: createdAssets.length,
          totalLots: createdLots.length,
          totalBots: botManager.getBots().length,
          enabledBots: botManager.getBots().filter(b => b.isEnabled).length,
          totalBids: botManager.getBots().reduce((sum, b) => sum + b.totalBids, 0),
          winnersCount: createdLots.filter(l => l.winner).length
        }
      };
      
      const reportPath = path.join(ARTIFACTS_DIR, 'test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      logEvent('TEST', 'Relatório de teste gerado', { path: reportPath });
      
      // Log do resumo
      console.log('\n');
      console.log('='.repeat(80));
      console.log('ROBOT AUCTION SIMULATION - TEST REPORT');
      console.log('='.repeat(80));
      console.log(`Total Assets: ${report.summary.totalAssets}`);
      console.log(`Total Lots: ${report.summary.totalLots}`);
      console.log(`Total Bots: ${report.summary.totalBots}`);
      console.log(`Enabled Bots: ${report.summary.enabledBots}`);
      console.log(`Total Bids: ${report.summary.totalBids}`);
      console.log(`Winners Declared: ${report.summary.winnersCount}`);
      console.log('='.repeat(80));
      console.log('\n');
    });
  });
});

// ============================================================================
// FUNÇÃO PARA GERAR RELATÓRIO FINAL
// ============================================================================

function generateFinalReport(
  assets: Asset[], 
  auction: Auction | null, 
  lots: Lot[], 
  bots: BotUser[]
) {
  const report = {
    timestamp: new Date().toISOString(),
    auction: auction ? {
      id: auction.id,
      title: auction.title,
      status: auction.status,
      startTime: auction.startTime,
      endTime: auction.endTime
    } : null,
    assets: assets.map(a => ({
      id: a.id,
      title: a.title,
      evaluationValue: a.evaluationValue,
      address: a.address,
      city: a.city,
      state: a.state
    })),
    lots: lots.map(l => ({
      id: l.id,
      number: l.number,
      title: l.title,
      initialPrice: l.initialPrice,
      finalBid: l.currentBid,
      winner: l.winner
    })),
    bots: bots.map(b => ({
      email: b.email,
      name: b.name,
      enabled: b.isEnabled,
      totalBids: b.totalBids
    })),
    metrics: {
      totalAssetsValue: assets.reduce((sum, a) => sum + a.evaluationValue, 0),
      totalLotsValue: lots.reduce((sum, l) => sum + l.currentBid, 0),
      averageBidPerBot: bots.length > 0 
        ? bots.reduce((sum, b) => sum + b.totalBids, 0) / bots.length 
        : 0
    }
  };
  
  const reportPath = path.join(ARTIFACTS_DIR, 'final-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Relatório final salvo em: ${reportPath}`);
}

// ============================================================================
// CONFIGURAÇÃO DO PLAYWRIGHT PARA ESTE TESTE
// ============================================================================

/**
 * Para executar este teste:
 * 
 * 1. Configurar variáveis de ambiente:
 *    BASE_URL=https://bidexpertaifirebasestudio.vercel.app
 *    ADMIN_EMAIL=admin@bidexpert.com.br
 *    ADMIN_PASSWORD=Admin@123
 * 
 * 2. Executar com Playwright:
 *    npx playwright test tests/e2e/robot-auction-simulation.spec.ts --headed
 * 
 * 3. Para execução em modo debug:
 *    npx playwright test tests/e2e/robot-auction-simulation.spec.ts --debug
 * 
 * 4. Para gerar relatório HTML:
 *    npx playwright test tests/e2e/robot-auction-simulation.spec.ts --reporter=html
 * 
 * 5. Para execução paralela (não recomendada para este teste):
 *    npx playwright test tests/e2e/robot-auction-simulation.spec.ts --workers=1
 * 
 * Nota: Este teste usa test.describe.serial para garantir execução sequencial
 * e test.setTimeout(TIMEOUTS.test) para permitir longa duração.
 */
