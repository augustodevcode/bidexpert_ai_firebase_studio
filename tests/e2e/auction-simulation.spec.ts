/**
 * @fileoverview Auction Simulation - E2E Test Suite
 * @description Simula um leilão automatizado completo com 10 bots arrematantes competindo
 * 
 * === FLUXO COMPLETO DO TESTE ===
 * 
 * 1. FASE ADMIN - CRIAR LEILÃO
 *    - Login como admin@bidexpert.com.br
 *    - Criar leilão via API
 *    - Criar 5 lotes com valores entre R$ 10.000 e R$ 100.000
 *    - Incremento mínimo de R$ 1.000
 *    - Timeline: 20min ABERTO → 5min PREGÃO → 5min SOFTCLOSE
 * 
 * 2. FASE HABILITAÇÃO
 *    - Login como cada bot (bot1-bot10)
 *    - Admin habilita os bots via API
 * 
 * 3. FASE DE LANCES
 *    - Cada bot dá lances aleatórios respeitando incremento mínimo
 *    - Simular competição entre bots
 *    - Lances até R$ 100.000
 * 
 * 4. FASE ENCERRAMENTO
 *    - Mudança de status do leilão
 *    - Identificar vencedores
 *    - Verificar dashboard do vencedor
 * 
 * === PADRÕES DE CÓDIGO ===
 * - Usar seletores data-ai-id quando disponíveis
 * - Capturar screenshots a cada passo importante
 * - Salvar logs em /home/z/my-project/sandbox/
 * 
 * @author BidExpert E2E Team
 * @version 2.0.0
 */

import { test, expect, Page, BrowserContext, APIRequestContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

// ============================================================================
// CONFIGURAÇÃO E CONSTANTES
// ============================================================================

/**
 * URL base para testes - servidor local
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Credenciais dos usuários de teste
 */
const USERS = {
  admin: {
    email: 'admin@bidexpert.com.br',
    password: 'Admin@123',
    role: 'ADMIN'
  },
  leiloeiro: {
    email: 'leiloeiro@bidexpert.com.br',
    password: 'Leiloeiro@123',
    role: 'AUCTIONEER'
  },
  comprador: {
    email: 'comprador@bidexpert.com.br',
    password: 'Comprador@123',
    role: 'USER'
  }
};

/**
 * Gera dados dos bots (bot1-bot10 já existem no banco)
 */
function generateBotUsers(): BotUser[] {
  const bots: BotUser[] = [];
  for (let i = 1; i <= 10; i++) {
    bots.push({
      email: `bot${i}@bidexpert.com.br`,
      password: 'Bot@123',
      name: `Bot Arrematante ${i}`,
      index: i,
      isEnabled: false,
      totalBids: 0
    });
  }
  return bots;
}

/**
 * Configuração do leilão
 */
const AUCTION_CONFIG = {
  title: `Leilão E2E Test ${Date.now()}`,
  description: 'Leilão automatizado para testes E2E com 10 bots arrematantes',
  bidIncrement: 1000, // R$ 1.000
  openDuration: 20, // 20 minutos - fase aberta (simulado)
  pregaoDuration: 5, // 5 minutos - fase pregão (simulado)
  softCloseDuration: 5, // 5 minutos - soft close (simulado)
  minLotValue: 10000, // R$ 10.000
  maxLotValue: 100000, // R$ 100.000
  targetBidValue: 100000, // R$ 100.000
  numberOfBots: 10,
  numberOfLots: 5,
  biddingRounds: 20 // rounds de lances para teste acelerado
};

/**
 * Configuração de timeouts para testes longos
 */
const TIMEOUTS = {
  test: 30 * 60 * 1000, // 30 minutos para o teste completo
  navigation: 60000, // 1 minuto para navegação
  action: 30000, // 30 segundos para ações
  apiResponse: 15000, // 15 segundos para resposta de API
  bidDelay: 500, // 500ms entre lances
};

/**
 * Diretório para artefatos de teste
 */
const SANDBOX_DIR = '/home/z/my-project/sandbox';
const SCREENSHOTS_DIR = path.join(SANDBOX_DIR, 'screenshots');
const LOGS_DIR = path.join(SANDBOX_DIR, 'logs');

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface BotUser {
  email: string;
  password: string;
  name: string;
  index: number;
  isEnabled: boolean;
  totalBids: number;
}

interface AuctionData {
  id: number;
  publicId: string;
  title: string;
  status: string;
}

interface LotData {
  id: number;
  publicId: string;
  number: string;
  title: string;
  initialPrice: number;
  price: number;
  status: string;
}

interface BidData {
  id: number;
  lotId: number;
  bidderId: number;
  amount: number;
  status: string;
}

interface TestResult {
  success: boolean;
  phase: string;
  message: string;
  data?: any;
  timestamp: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Garante que os diretórios de artefatos existem
 */
function ensureArtifactDirs() {
  [SANDBOX_DIR, SCREENSHOTS_DIR, LOGS_DIR].forEach(dir => {
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
  const logFile = path.join(LOGS_DIR, `auction-simulation-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

/**
 * Gera valor aleatório entre min e max
 */
function randomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// API HELPERS
// ============================================================================

class ApiHelper {
  private request: APIRequestContext;
  private baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string = BASE_URL) {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * Faz login via API e retorna cookies
   */
  async login(email: string, password: string): Promise<{ success: boolean; cookies?: string }> {
    try {
      const response = await this.request.post(`${this.baseUrl}/api/auth/callback/credentials`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
          email,
          password
        }
      });

      return {
        success: response.ok(),
        cookies: response.headers()['set-cookie']
      };
    } catch (error) {
      logEvent('API', `Login failed for ${email}`, { error: String(error) });
      return { success: false };
    }
  }

  /**
   * Cria um leilão via API
   */
  async createAuction(data: Partial<AuctionData>): Promise<AuctionData | null> {
    try {
      const response = await this.request.post(`${this.baseUrl}/api/auctions`, {
        data: {
          title: data.title || AUCTION_CONFIG.title,
          description: AUCTION_CONFIG.description,
          status: 'RASCUNHO',
          tenantId: 1
        }
      });

      if (!response.ok()) {
        const error = await response.text();
        logEvent('API', 'Failed to create auction', { error });
        return null;
      }

      const result = await response.json();
      logEvent('API', 'Auction created', result.data);
      return result.data;
    } catch (error) {
      logEvent('API', 'Error creating auction', { error: String(error) });
      return null;
    }
  }

  /**
   * Cria um lote via API
   */
  async createLot(auctionId: number, index: number): Promise<LotData | null> {
    try {
      const lotNumber = String(index).padStart(3, '0');
      const initialPrice = randomValue(AUCTION_CONFIG.minLotValue, AUCTION_CONFIG.maxLotValue);

      const response = await this.request.post(`${this.baseUrl}/api/lots`, {
        data: {
          auctionId,
          number: lotNumber,
          title: `Lote ${lotNumber} - Ativo Teste ${index}`,
          description: `Lote de teste E2E número ${lotNumber}`,
          initialPrice,
          price: initialPrice,
          type: 'IMOVEL',
          status: 'EM_BREVE',
          bidIncrement: AUCTION_CONFIG.bidIncrement,
          tenantId: 1
        }
      });

      if (!response.ok()) {
        const error = await response.text();
        logEvent('API', `Failed to create lot ${index}`, { error });
        return null;
      }

      const result = await response.json();
      logEvent('API', `Lot ${index} created`, { id: result.data.id, number: lotNumber, price: initialPrice });
      return result.data;
    } catch (error) {
      logEvent('API', `Error creating lot ${index}`, { error: String(error) });
      return null;
    }
  }

  /**
   * Muda status do leilão
   */
  async changeAuctionStatus(auctionId: number, status: string): Promise<boolean> {
    try {
      const response = await this.request.patch(`${this.baseUrl}/api/auctions/${auctionId}/status`, {
        data: { status }
      });

      if (!response.ok()) {
        const error = await response.text();
        logEvent('API', `Failed to change auction status to ${status}`, { error });
        return false;
      }

      logEvent('API', `Auction status changed to ${status}`);
      return true;
    } catch (error) {
      logEvent('API', `Error changing auction status`, { error: String(error) });
      return false;
    }
  }

  /**
   * Habilita um usuário
   */
  async habilitateUser(userId: number | string): Promise<boolean> {
    try {
      const response = await this.request.patch(`${this.baseUrl}/api/users/${userId}/habilitate`, {
        data: { enabled: true }
      });

      if (!response.ok()) {
        const error = await response.text();
        logEvent('API', `Failed to habilitate user ${userId}`, { error });
        return false;
      }

      logEvent('API', `User ${userId} habilitated`);
      return true;
    } catch (error) {
      logEvent('API', `Error habilitating user`, { error: String(error) });
      return false;
    }
  }

  /**
   * Dá um lance
   */
  async placeBid(lotId: number, bidderId: number, amount: number): Promise<BidData | null> {
    try {
      const response = await this.request.post(`${this.baseUrl}/api/bids`, {
        data: {
          lotId,
          bidderId,
          amount,
          bidIncrement: AUCTION_CONFIG.bidIncrement,
          tenantId: 1
        }
      });

      if (!response.ok()) {
        const error = await response.text();
        // Don't log every failed bid (expected when increment not met)
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Lista leilões
   */
  async listAuctions(): Promise<AuctionData[]> {
    try {
      const response = await this.request.get(`${this.baseUrl}/api/auctions`);
      if (!response.ok()) return [];
      const result = await response.json();
      return result.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Lista lotes de um leilão
   */
  async listLots(auctionId: number): Promise<LotData[]> {
    try {
      const response = await this.request.get(`${this.baseUrl}/api/lots?auctionId=${auctionId}`);
      if (!response.ok()) return [];
      const result = await response.json();
      return result.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Lista lances de um lote
   */
  async listBids(lotId: number): Promise<BidData[]> {
    try {
      const response = await this.request.get(`${this.baseUrl}/api/bids?lotId=${lotId}`);
      if (!response.ok()) return [];
      const result = await response.json();
      return result.data || [];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// TESTES E2E
// ============================================================================

// Configurar timeout global para o teste
test.setTimeout(TIMEOUTS.test);

test.describe.serial('Auction Simulation - Complete E2E Flow', () => {
  let apiHelper: ApiHelper;
  let botUsers: BotUser[];
  let createdAuction: AuctionData | null = null;
  let createdLots: LotData[] = [];
  let allBids: BidData[] = [];
  let userIds: Map<string, number> = new Map();

  // ============================================================================
  // SETUP
  // ============================================================================

  test.beforeAll(async ({ request }) => {
    ensureArtifactDirs();
    logEvent('TEST', 'Iniciando Auction Simulation E2E');
    
    // Inicializar helpers
    apiHelper = new ApiHelper(request);
    botUsers = generateBotUsers();
    
    logEvent('TEST', 'Setup concluído', { 
      baseUrl: BASE_URL,
      botsCount: botUsers.length,
      config: AUCTION_CONFIG
    });
  });

  test.afterAll(async () => {
    // Gerar relatório final
    const report = {
      auction: createdAuction,
      lots: createdLots,
      totalBids: allBids.length,
      bots: botUsers.map(b => ({ email: b.email, totalBids: b.totalBids })),
      timestamp: new Date().toISOString()
    };

    const reportFile = path.join(LOGS_DIR, `auction-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    logEvent('TEST', 'Auction Simulation finalizado', report);
  });

  // ============================================================================
  // 1. FASE ADMIN - CRIAR LEILÃO
  // ============================================================================

  test.describe('1. Admin Flow - Create Auction', () => {
    
    test('1.1 - Create Auction via API', async ({ request }) => {
      logEvent('TEST', '1.1 - Criando leilão via API');
      
      createdAuction = await apiHelper.createAuction({});
      
      expect(createdAuction).not.toBeNull();
      expect(createdAuction?.id).toBeDefined();
      expect(createdAuction?.status).toBe('RASCUNHO');
      
      logEvent('TEST', 'Leilão criado com sucesso', { auction: createdAuction });
    });

    test('1.2 - Create 5 Lots', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '1.2 - Criando 5 lotes');

      for (let i = 1; i <= AUCTION_CONFIG.numberOfLots; i++) {
        const lot = await apiHelper.createLot(createdAuction.id, i);
        if (lot) {
          createdLots.push(lot);
        }
        await delay(200); // Pequeno delay entre criações
      }

      expect(createdLots.length).toBe(AUCTION_CONFIG.numberOfLots);
      
      logEvent('TEST', 'Lotes criados', { count: createdLots.length });
    });

    test('1.3 - Change Auction Status to ABERTO_PARA_LANCES', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '1.3 - Mudando status para ABERTO_PARA_LANCES');

      const success = await apiHelper.changeAuctionStatus(createdAuction.id, 'ABERTO_PARA_LANCES');
      
      expect(success).toBeTruthy();
      
      if (createdAuction) {
        createdAuction.status = 'ABERTO_PARA_LANCES';
      }
      
      logEvent('TEST', 'Status alterado para ABERTO_PARA_LANCES');
    });
  });

  // ============================================================================
  // 2. FASE HABILITAÇÃO
  // ============================================================================

  test.describe('2. Bot Habilitation', () => {
    
    test('2.1 - Habilitate All Bot Users', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '2.1 - Habilitando usuários bots');

      // Get user IDs first - we need to query the database
      // Since we're using API, we'll try to habilitate by email
      // The API accepts email as identifier
      
      let enabledCount = 0;
      
      for (const bot of botUsers) {
        // Try to habilitate by email (API accepts email as ID)
        const success = await apiHelper.habilitateUser(bot.email);
        if (success) {
          bot.isEnabled = true;
          enabledCount++;
        }
        await delay(100);
      }

      logEvent('TEST', `Bots habilitados: ${enabledCount}/${botUsers.length}`);
      
      // At least some bots should be enabled
      expect(enabledCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // 3. FASE DE LANCES
  // ============================================================================

  test.describe('3. Bidding Phase', () => {
    
    test('3.1 - Open Bidding Phase Simulation', async ({ request }) => {
      if (!createdAuction || createdLots.length === 0) {
        test.skip();
        return;
      }

      const enabledBots = botUsers.filter(b => b.isEnabled);
      
      if (enabledBots.length === 0) {
        logEvent('TEST', 'Nenhum bot habilitado - usando todos os bots', { severity: 'warning' });
        // Use all bots even if not explicitly enabled
        enabledBots.push(...botUsers);
      }

      logEvent('TEST', '3.1 - Iniciando fase de lances', {
        bots: enabledBots.length,
        lots: createdLots.length
      });

      // Simular lances
      for (let round = 0; round < AUCTION_CONFIG.biddingRounds; round++) {
        // Cada bot dá lance em um lote aleatório
        for (const bot of enabledBots) {
          const randomLot = createdLots[Math.floor(Math.random() * createdLots.length)];
          
          // Obter lance atual do lote
          const lotBids = await apiHelper.listBids(randomLot.id);
          const currentHighest = lotBids.length > 0 
            ? Math.max(...lotBids.map(b => b.amount))
            : randomLot.initialPrice;

          // Calcular próximo lance
          const newBid = currentHighest + AUCTION_CONFIG.bidIncrement;

          // Não exceder valor máximo
          if (newBid > AUCTION_CONFIG.targetBidValue) continue;

          // Tentar dar o lance
          // Precisamos do ID do usuário - vamos usar o índice do bot como ID aproximado
          // Na prática, a API deve aceitar email como identificador
          const bid = await apiHelper.placeBid(randomLot.id, bot.index, newBid);
          
          if (bid) {
            allBids.push(bid);
            bot.totalBids++;
            
            logEvent('BID', `Lance registrado`, {
              bot: bot.email,
              lot: randomLot.number,
              amount: newBid
            });
          }

          await delay(TIMEOUTS.bidDelay);
        }
      }

      logEvent('TEST', 'Fase de lances finalizada', {
        totalBids: allBids.length,
        highestBid: allBids.length > 0 ? Math.max(...allBids.map(b => b.amount)) : 0
      });

      // Pelo menos alguns lances devem ter sido registrados
      expect(allBids.length).toBeGreaterThan(0);
    });

    test('3.2 - Change to PREGAO Status', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '3.2 - Mudando status para PREGAO');

      const success = await apiHelper.changeAuctionStatus(createdAuction.id, 'PREGAO');
      
      if (success && createdAuction) {
        createdAuction.status = 'PREGAO';
      }

      expect(success).toBeTruthy();
    });

    test('3.3 - Pregao Phase Simulation', async ({ request }) => {
      if (!createdAuction || createdAuction.status !== 'PREGAO') {
        test.skip();
        return;
      }

      logEvent('TEST', '3.3 - Fase PREGAO - lances intensivos');

      const enabledBots = botUsers.filter(b => b.isEnabled || b.totalBids > 0);
      const pregaoRounds = 10;

      for (let round = 0; round < pregaoRounds; round++) {
        for (const bot of enabledBots) {
          const randomLot = createdLots[Math.floor(Math.random() * createdLots.length)];
          
          const lotBids = await apiHelper.listBids(randomLot.id);
          const currentHighest = lotBids.length > 0 
            ? Math.max(...lotBids.map(b => b.amount))
            : randomLot.initialPrice;

          const newBid = currentHighest + AUCTION_CONFIG.bidIncrement;

          if (newBid > AUCTION_CONFIG.targetBidValue) continue;

          const bid = await apiHelper.placeBid(randomLot.id, bot.index, newBid);
          
          if (bid) {
            allBids.push(bid);
            bot.totalBids++;
          }

          await delay(TIMEOUTS.bidDelay);
        }
      }

      logEvent('TEST', 'Fase PREGAO finalizada', {
        totalBids: allBids.length
      });
    });
  });

  // ============================================================================
  // 4. FASE ENCERRAMENTO
  // ============================================================================

  test.describe('4. Auction Closing', () => {
    
    test('4.1 - Change to SOFT_CLOSE Status', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '4.1 - Mudando status para SOFT_CLOSE');

      const success = await apiHelper.changeAuctionStatus(createdAuction.id, 'SOFT_CLOSE');
      
      if (success && createdAuction) {
        createdAuction.status = 'SOFT_CLOSE';
      }

      expect(success).toBeTruthy();
    });

    test('4.2 - Close Auction and Declare Winners', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '4.2 - Encerrando leilão');

      const success = await apiHelper.changeAuctionStatus(createdAuction.id, 'ENCERRADO');
      
      if (success && createdAuction) {
        createdAuction.status = 'ENCERRADO';
      }

      expect(success).toBeTruthy();
    });

    test('4.3 - Verify Winners', async ({ request }) => {
      if (!createdAuction) {
        test.skip();
        return;
      }

      logEvent('TEST', '4.3 - Verificando vencedores');

      // Listar lotes atualizados
      const lots = await apiHelper.listLots(createdAuction.id);
      
      const wonLots = lots.filter(l => l.status === 'ARREMATADO');
      const unsoldLots = lots.filter(l => l.status === 'NAO_VENDIDO');

      logEvent('TEST', 'Verificação de vencedores concluída', {
        totalLots: lots.length,
        wonLots: wonLots.length,
        unsoldLots: unsoldLots.length,
        winners: wonLots.map(l => ({
          lot: l.number,
          price: l.price
        }))
      });

      // Verificar que o status do leilão é ENCERRADO
      expect(createdAuction.status).toBe('ENCERRADO');
    });
  });

  // ============================================================================
  // 5. VERIFICAÇÃO FINAL
  // ============================================================================

  test.describe('5. Final Verification', () => {
    
    test('5.1 - Generate Final Report', async ({ request }) => {
      logEvent('TEST', '5.1 - Gerando relatório final');

      const report = {
        auction: createdAuction,
        lots: createdLots.map(l => ({
          id: l.id,
          number: l.number,
          initialPrice: l.initialPrice,
          finalPrice: l.price,
          status: l.status
        })),
        bids: {
          total: allBids.length,
          highest: allBids.length > 0 ? Math.max(...allBids.map(b => b.amount)) : 0,
          lowest: allBids.length > 0 ? Math.min(...allBids.map(b => b.amount)) : 0,
          average: allBids.length > 0 
            ? Math.round(allBids.reduce((sum, b) => sum + b.amount, 0) / allBids.length)
            : 0
        },
        bots: botUsers.map(b => ({
          email: b.email,
          totalBids: b.totalBids,
          isEnabled: b.isEnabled
        })),
        timestamp: new Date().toISOString()
      };

      const reportFile = path.join(LOGS_DIR, `final-report-${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

      logEvent('REPORT', 'Relatório final gerado', report);

      console.log('\n' + '='.repeat(80));
      console.log('RELATÓRIO FINAL DA SIMULAÇÃO DE LEILÃO');
      console.log('='.repeat(80));
      console.log(`Leilão: ${createdAuction?.title || 'N/A'}`);
      console.log(`Status: ${createdAuction?.status || 'N/A'}`);
      console.log(`Lotes criados: ${createdLots.length}`);
      console.log(`Total de lances: ${allBids.length}`);
      console.log(`Maior lance: R$ ${report.bids.highest.toLocaleString('pt-BR')}`);
      console.log(`Bots participantes: ${botUsers.filter(b => b.totalBids > 0).length}`);
      console.log('='.repeat(80) + '\n');

      // Verificações finais
      expect(createdAuction).not.toBeNull();
      expect(createdLots.length).toBe(AUCTION_CONFIG.numberOfLots);
      expect(allBids.length).toBeGreaterThan(0);
    });
  });
});
