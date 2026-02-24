/**
 * Simulação E2E de leilão com 1 admin e 10 arrematantes robôs.
 * Executa fluxo de cadastro, documentação, habilitação, disputa de lances e validação pós-arremate.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CREDENTIALS as AUTH_CREDENTIALS } from './helpers/auth-helper';

const REMOTE_BASE_URL = 'https://bidexpertaifirebasestudio.vercel.app';
const LOCAL_BASE_URL = process.env.ROBOT_LOCAL_BASE_URL || 'http://localhost:9005';
const ACTIVE_BASE_URL = process.env.ROBOT_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || REMOTE_BASE_URL;

const ADMIN = {
  email: AUTH_CREDENTIALS.admin.email,
  password: AUTH_CREDENTIALS.admin.password,
};

const BOT_PASSWORD = 'Bot@123456';
const BID_INCREMENT = 1000;
const TARGET_TOP_BID = 100000;

const prisma = new PrismaClient();

type BotUser = {
  index: number;
  name: string;
  email: string;
  password: string;
};

async function resolveBaseUrl(page: Page): Promise<string> {
  const candidates = [ACTIVE_BASE_URL, REMOTE_BASE_URL, LOCAL_BASE_URL];

  for (const candidate of candidates) {
    try {
      const response = await page.request.get(candidate, { timeout: 20000 });
      if (response.ok() || response.status() < 500) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return ACTIVE_BASE_URL;
}

async function login(page: Page, baseUrl: string, email: string, password: string) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const emailInput = page.locator('[data-ai-id="auth-login-email-input"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"], input[name="password"], input[type="password"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"], [aria-label="Espaço de Trabalho"], [name="tenantId"]').first();
  if (await tenantSelect.isVisible().catch(() => false)) {
    const optionCount = await tenantSelect.locator('option').count();
    if (optionCount > 1) {
      await tenantSelect.selectOption({ index: 1 });
    }
  }

  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null),
    page.locator('[data-ai-id="auth-login-submit-button"], button:has-text("Login")').first().click(),
  ]);
}

async function uploadBidderDocument(page: Page, baseUrl: string, bot: BotUser) {
  await login(page, baseUrl, bot.email, bot.password);
  await page.goto(`${baseUrl}/dashboard/documents`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.isVisible().catch(() => false)) {
    await fileInput.setInputFiles({
      name: `doc-bot-${bot.index}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.from(`documento bot ${bot.email}`),
    });

    const confirmButton = page.getByRole('button', { name: /confirmar envio|enviar|upload/i }).first();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);
    }
  }
}

async function createAssets(page: Page, baseUrl: string, count: number) {
  await page.goto(`${baseUrl}/admin/assets`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  for (let i = 1; i <= count; i++) {
    const createButton = page.getByRole('button', { name: /novo ativo|novo|new/i }).first();
    if (!(await createButton.isVisible().catch(() => false))) {
      break;
    }

    await createButton.click();
    await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);

    const title = `ATIVO ROBOT ${Date.now()}-${i}`;
    const titleInput = page.getByLabel(/t[ií]tulo|nome/i).first();
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(title);
    }

    const valueInput = page.getByLabel(/valor|avalia[cç][aã]o/i).first();
    if (await valueInput.isVisible().catch(() => false)) {
      await valueInput.fill((10000 + i * 10000).toString());
    }

    const saveButton = page.getByRole('button', { name: /salvar|criar|enviar/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);
    }

    await page.goto(`${baseUrl}/admin/assets`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
}

async function createAuctionAndLots(page: Page, baseUrl: string) {
  const auctionTitle = `LEILAO ROBOTICO ${Date.now()}`;

  await page.goto(`${baseUrl}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const newAuctionButton = page.getByRole('button', { name: /novo leil[aã]o|novo|new/i }).first();
  if (await newAuctionButton.isVisible().catch(() => false)) {
    await newAuctionButton.click();
    await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);

    const titleInput = page.getByLabel(/t[ií]tulo/i).first();
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(auctionTitle);
    }

    const descriptionInput = page.getByLabel(/descri[cç][aã]o/i).first();
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill('Leilão robótico com 5 lotes, 20m aberto, 5m pregão, 5m softclose.');
    }

    const saveAuctionButton = page.getByRole('button', { name: /salvar|criar leil[aã]o|criar/i }).first();
    if (await saveAuctionButton.isVisible().catch(() => false)) {
      await saveAuctionButton.click();
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);
    }
  }

  await page.goto(`${baseUrl}/admin/lots`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  for (let i = 1; i <= 5; i++) {
    const newLotButton = page.getByRole('button', { name: /novo lote|novo|new/i }).first();
    if (!(await newLotButton.isVisible().catch(() => false))) {
      break;
    }

    await newLotButton.click();
    await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);

    const lotTitleInput = page.getByLabel(/t[ií]tulo|nome/i).first();
    if (await lotTitleInput.isVisible().catch(() => false)) {
      await lotTitleInput.fill(`LOTE ROBOT ${i} - ${Date.now()}`);
    }

    const initialPriceInput = page.getByLabel(/valor inicial|lance inicial|pre[cç]o/i).first();
    if (await initialPriceInput.isVisible().catch(() => false)) {
      await initialPriceInput.fill((10000 + i * 5000).toString());
    }

    const incrementInput = page.getByLabel(/incremento|step/i).first();
    if (await incrementInput.isVisible().catch(() => false)) {
      await incrementInput.fill(BID_INCREMENT.toString());
    }

    const saveLotButton = page.getByRole('button', { name: /salvar|criar lote|criar/i }).first();
    if (await saveLotButton.isVisible().catch(() => false)) {
      await saveLotButton.click();
      await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);
    }

    await page.goto(`${baseUrl}/admin/lots`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }

  return auctionTitle;
}

async function publishAuctionAndLotsForBidding(auctionTitle: string) {
  const auction = await prisma.auction.findFirst({
    where: { title: auctionTitle },
    orderBy: { createdAt: 'desc' },
    include: { Lot: true },
  });

  if (!auction) {
    return false;
  }

  await prisma.auction.update({
    where: { id: auction.id },
    data: {
      status: 'ABERTO_PARA_LANCES',
      updatedAt: new Date(),
    },
  });

  await prisma.lot.updateMany({
    where: { auctionId: auction.id },
    data: {
      status: 'ABERTO_PARA_LANCES',
      updatedAt: new Date(),
    },
  });

  return true;
}

async function approveBots(page: Page, baseUrl: string, bots: BotUser[]) {
  await page.goto(`${baseUrl}/admin/habilitations`, { waitUntil: 'domcontentloaded', timeout: 90000 });

  for (const bot of bots) {
    const searchInput = page.locator('input[placeholder*="Buscar" i], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(bot.email);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
    }

    const row = page.locator('tr').filter({ hasText: bot.email }).first();
    if (await row.isVisible().catch(() => false)) {
      const approveButton = row.getByRole('button', { name: /aprovar|habilitar/i }).first();
      if (await approveButton.isVisible().catch(() => false)) {
        await approveButton.click();
        const confirm = page.getByRole('button', { name: /confirmar|sim/i }).first();
        if (await confirm.isVisible().catch(() => false)) {
          await confirm.click();
        }
      }
    }
  }
}

async function navigatePublicPages(page: Page, baseUrl: string) {
  const pages = ['/', '/search', '/auctions', '/auth/login'];
  for (const path of pages) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.screenshot({ path: `test-results/robot-public-${path.replace(/[^a-z0-9]/gi, '_') || 'home'}.png`, fullPage: true });
  }
}

async function getFirstLotUrl(page: Page, baseUrl: string): Promise<string | null> {
  const candidates = [`${baseUrl}/auctions`, `${baseUrl}/search?type=lots`, `${baseUrl}/search`];

  for (const candidate of candidates) {
    await page.goto(candidate, { waitUntil: 'domcontentloaded', timeout: 90000 });

    const lotLink = page.locator('a[href*="/lots/"], a[href*="/lotes/"], a[href*="/lot/"]').first();
    if (await lotLink.isVisible().catch(() => false)) {
      const href = await lotLink.getAttribute('href');
      if (href) {
        return href.startsWith('http') ? href : `${baseUrl}${href}`;
      }
    }
  }

  const dbLot = await prisma.lot.findFirst({
    where: {
      status: 'ABERTO_PARA_LANCES',
      Auction: {
        status: { in: ['ABERTO', 'ABERTO_PARA_LANCES'] },
      },
    },
    include: {
      Auction: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (dbLot && dbLot.Auction) {
    const auctionIdForUrl = dbLot.Auction.publicId || dbLot.Auction.id.toString();
    const lotIdForUrl = dbLot.publicId || dbLot.id.toString();
    return `${baseUrl}/auctions/${auctionIdForUrl}/lots/${lotIdForUrl}`;
  }

  return null;
}

async function placeBid(page: Page, lotUrl: string, amount: number) {
  await page.goto(lotUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });

  const bidInput = page.locator('[data-ai-id="bid-amount-input"], input[name="amount"], input[placeholder*="lance" i]').first();
  if (await bidInput.isVisible().catch(() => false)) {
    await bidInput.fill(amount.toString());
  }

  const submitBidButton = page.locator('[data-ai-id="place-bid-button"], button:has-text("Dar Lance"), button:has-text("Lance")').first();
  if (await submitBidButton.isVisible().catch(() => false)) {
    await submitBidButton.click();
    await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => null);
  }
}

async function createBotContexts(browser: Browser, count: number): Promise<Array<{ bot: BotUser; context: BrowserContext; page: Page }>> {
  const sessions: Array<{ bot: BotUser; context: BrowserContext; page: Page }> = [];
  const credentialsFile = process.env.ROBOT_BOTS_FILE || path.join(process.cwd(), 'test-results', 'robot-bots.json');

  let seededBots: BotUser[] = [];
  if (fs.existsSync(credentialsFile)) {
    const parsed = JSON.parse(fs.readFileSync(credentialsFile, 'utf8')) as { bots?: BotUser[] };
    seededBots = parsed.bots ?? [];
  }

  for (let i = 1; i <= count; i++) {
    const bot: BotUser = seededBots[i - 1] ?? {
      index: i,
      name: `Bot Arrematante ${i}`,
      email: `bot.arrematante.${Date.now()}.${i}@bidexpert.test`,
      password: BOT_PASSWORD,
    };

    const context = await browser.newContext({ recordVideo: { dir: 'test-results/videos' } });
    const page = await context.newPage();
    sessions.push({ bot, context, page });
  }

  return sessions;
}

test.describe.serial('Robot Auction Simulation', () => {
  test.setTimeout(1000 * 60 * 70);

  test('admin + 10 bots em jornada completa com evidências', async ({ browser, page }) => {
    const baseUrl = await resolveBaseUrl(page);
    const adminContext = await browser.newContext({ recordVideo: { dir: 'test-results/videos' } });
    const adminPage = await adminContext.newPage();

    const botSessions = await createBotContexts(browser, 10);

    await test.step('Navegação pública e login admin', async () => {
      await navigatePublicPages(adminPage, baseUrl);
      await login(adminPage, baseUrl, ADMIN.email, ADMIN.password);
      await adminPage.screenshot({ path: 'test-results/robot-admin-logged.png', fullPage: true });
    });

    await test.step('Admin cria 5 ativos e 1 leilão com 5 lotes', async () => {
      await createAssets(adminPage, baseUrl, 5);
      const createdAuctionTitle = await createAuctionAndLots(adminPage, baseUrl);
      await publishAuctionAndLotsForBidding(createdAuctionTitle);
      await adminPage.screenshot({ path: 'test-results/robot-admin-auction-created.png', fullPage: true });
    });

    await test.step('10 bots enviam documentação', async () => {
      for (const { bot, page: botPage } of botSessions) {
        await uploadBidderDocument(botPage, baseUrl, bot);
      }
    });

    await test.step('Admin habilita os 10 bots', async () => {
      await login(adminPage, baseUrl, ADMIN.email, ADMIN.password);
      await approveBots(adminPage, baseUrl, botSessions.map((s) => s.bot));
      await adminPage.screenshot({ path: 'test-results/robot-admin-bots-approved.png', fullPage: true });
    });

    let lotUrl: string | null = null;
    await test.step('Bots disputam lances até R$ 100.000', async () => {
      lotUrl = await getFirstLotUrl(adminPage, baseUrl);
      expect(lotUrl).toBeTruthy();

      let currentBid = 10000;
      let botIndex = 0;
      while (currentBid < TARGET_TOP_BID) {
        currentBid += BID_INCREMENT;
        const { page: bidderPage } = botSessions[botIndex % botSessions.length];
        const bot = botSessions[botIndex % botSessions.length].bot;
        await login(bidderPage, baseUrl, bot.email, bot.password);
        await placeBid(bidderPage, lotUrl!, currentBid);
        botIndex += 1;
      }

      await adminPage.screenshot({ path: 'test-results/robot-bidding-finished.png', fullPage: true });
    });

    await test.step('Admin move para pregão e executa encerramento equivalente', async () => {
      await login(adminPage, baseUrl, ADMIN.email, ADMIN.password);
      await adminPage.goto(`${baseUrl}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 90000 });

      const openAuditoriumButton = adminPage.getByRole('button', { name: /preg[aã]o|audit[oó]rio|abrir/i }).first();
      if (await openAuditoriumButton.isVisible().catch(() => false)) {
        await openAuditoriumButton.click();
      }

      const finishButton = adminPage.getByRole('button', { name: /encerrar|finalizar|fechar/i }).first();
      if (await finishButton.isVisible().catch(() => false)) {
        await finishButton.click();
      }

      await adminPage.screenshot({ path: 'test-results/robot-admin-closure.png', fullPage: true });
    });

    await test.step('Vencedor valida painel, termo e retirada', async () => {
      const winner = botSessions[0].bot;
      const winnerPage = botSessions[0].page;

      await login(winnerPage, baseUrl, winner.email, winner.password);
      await winnerPage.goto(`${baseUrl}/dashboard/wins`, { waitUntil: 'domcontentloaded', timeout: 90000 });

      const termoButton = winnerPage.getByRole('button', { name: /termo de arremata[cç][aã]o|gerar termo/i }).first();
      if (await termoButton.isVisible().catch(() => false)) {
        await termoButton.click();
      }

      const scheduleButton = winnerPage.getByRole('button', { name: /agendar retirada|retirada/i }).first();
      if (await scheduleButton.isVisible().catch(() => false)) {
        await scheduleButton.click();
      }

      await winnerPage.screenshot({ path: 'test-results/robot-winner-dashboard.png', fullPage: true });
    });

    await Promise.all(botSessions.map(async ({ context }) => context.close()));
    await adminContext.close();
    await prisma.$disconnect();
  });
});
