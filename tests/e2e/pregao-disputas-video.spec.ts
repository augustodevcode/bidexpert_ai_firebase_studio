/**
 * @fileoverview Jornada E2E filmada do pregão multi-perfil.
 * Usa atores Playwright separados, BidEngineV2 para lances e máquina de estado
 * para abertura, arrematação e encerramento.
 */

import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

import { ensureSeedExecuted } from './helpers/auth-helper';
import {
  PREGAO_BUYER_COUNT,
  PREGAO_INITIAL_PRICE,
  finalizePregaoWithWinner,
  groupPregaoScheduleByRound,
  parseBrazilianCurrency,
  placePregaoBid,
  provisionPregaoFixture,
  resolvePregaoWinner,
  runPregaoOpeningLifecycle,
  seedPregaoActorSession,
  teardownPregaoFixture,
  type PregaoActor,
  type PregaoBidResult,
  type PregaoFixture,
} from './helpers/pregao-multiperfil-fixture';

const BASE_URL = process.env.PREGAO_BASE_URL || 'http://demo.localhost:9005';
const ARTIFACT_ROOT = 'test-results/pregao-video';
const SCREENSHOT_DIR = path.join(ARTIFACT_ROOT, 'screenshots');
const VIDEO_DIR = path.join(ARTIFACT_ROOT, 'artifacts');
const VIEWPORT = { width: 1280, height: 720 } as const;

let prisma: PrismaClient;
let fixture: PregaoFixture | undefined;

test.describe.serial('Pregão multi-perfil filmado', () => {
  test.setTimeout(20 * 60 * 1000);

  test.beforeAll(async () => {
    ensureDirs();
    await ensureSeedExecuted(BASE_URL);
    prisma = new PrismaClient();
    fixture = await provisionPregaoFixture(prisma);
  });

  test.afterAll(async () => {
    await teardownPregaoFixture(prisma, fixture);
    await prisma?.$disconnect();
  });

  test('filma criação, habilitação, disputa, arrematação e laudo com atores separados', async ({ browser }, testInfo) => {
    const f = requiredFixture();
    const contexts: BrowserContext[] = [];
    const bidResults: PregaoBidResult[] = [];
    const monitorUrl = `${BASE_URL}/auctions/${f.auctionPublicId}/monitor`;

    try {
      const camera = await openRecordedActor(browser, 'camera-monitor');
      contexts.push(camera.context);
      await camera.page.goto(monitorUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await expect(camera.page.locator('[data-ai-id="monitor-auditorium"]')).toBeVisible({ timeout: 60_000 });
      await captureStep(camera.page, '00-camera-monitor-criado');

      const auctionAgent = await openLoggedActor(browser, f.actors.auctionAgent, monitorUrl, contexts, f.tenantId);
      await captureStep(auctionAgent, '01-agente-criou-leilao-lote');

      const admin = await openAdminActor(browser, contexts, f, monitorUrl);
      await captureStep(admin, '02-admin-habilitou-compradores');

      const auctioneer = await openLoggedActor(browser, f.actors.auctioneer, monitorUrl, contexts, f.tenantId);
      await runPregaoOpeningLifecycle(prisma, f);
      await camera.page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
      await expect(camera.page.locator('[data-ai-id="monitor-auditorium"]')).toBeVisible({ timeout: 60_000 });
      await captureStep(auctioneer, '03-leiloeiro-abriu-pregao');
      await captureStep(camera.page, '04-camera-pregao-aberto');

      const buyerPages: Page[] = [];
      for (const buyer of f.actors.buyers) {
        const buyerPage = await openLoggedActor(browser, buyer, monitorUrl, contexts, f.tenantId);
        buyerPages.push(buyerPage);
      }

      await captureStep(buyerPages[0], '05-comprador-01-pronto');
      await captureStep(buyerPages[buyerPages.length - 1], '06-comprador-10-pronto');
      await assertBuyerRoleIsolation(f);
      await assertBuyerHabilitations(f);

      const groupedRounds = groupPregaoScheduleByRound(f.bidSchedule);
      for (const roundEntries of groupedRounds) {
        for (const entry of roundEntries) {
          bidResults.push(await placePregaoBid(prisma, f, entry));
        }

        const roundLastBid = roundEntries[roundEntries.length - 1];
        await expect.poll(async () => {
          const lot = await prisma.lot.findUnique({ where: { id: f.lotId }, select: { price: true, bidsCount: true } });
          return { price: Number(lot?.price ?? 0), bidsCount: lot?.bidsCount ?? 0 };
        }, {
          timeout: 30_000,
          intervals: [500, 1_000, 2_000],
        }).toEqual({ price: roundLastBid.amount, bidsCount: bidResults.length });

        await camera.page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
        await expect(camera.page.locator('[data-ai-id="monitor-current-amount"]')).toBeVisible({ timeout: 60_000 });
        await expect.poll(async () => {
          const amountText = await camera.page.locator('[data-ai-id="monitor-current-amount"]').textContent().catch(() => '');
          return parseBrazilianCurrency(amountText);
        }, {
          timeout: 30_000,
          intervals: [1_000, 2_000, 3_000],
        }).toBeGreaterThanOrEqual(roundLastBid.amount);
        await expectVisibleBidCount(camera.page, bidResults.length);
        await captureStep(camera.page, `07-camera-rodada-${roundLastBid.round}`);
      }

      const expectedWinner = resolvePregaoWinner(f.bidSchedule);
      const finalization = await finalizePregaoWithWinner(prisma, f);
      expect(finalization.winningAmount).toBe(expectedWinner.amount);

      await camera.page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
      await expect(camera.page.locator('[data-ai-id="monitor-auditorium"]')).toBeVisible({ timeout: 60_000 });
      await expectVisibleBidCount(camera.page, bidResults.length);
      await captureStep(camera.page, '08-camera-vencedor-confirmado');

      const analyst = await openLoggedActor(browser, f.actors.analyst, monitorUrl, contexts, f.tenantId);
      await captureStep(analyst, '09-analista-laudo-cobranca');
      await assertWinnerOnlyArtifacts(f, finalization.winnerUserId, finalization.reportId);

      const bidLog = {
        runId: f.runId,
        baseUrl: BASE_URL,
        auctionId: f.auctionId.toString(),
        lotId: f.lotId.toString(),
        buyerCount: PREGAO_BUYER_COUNT,
        initialPrice: PREGAO_INITIAL_PRICE,
        totalBids: bidResults.length,
        expectedWinner,
        finalization: {
          winnerUserId: finalization.winnerUserId.toString(),
          winningAmount: finalization.winningAmount,
          userWinId: finalization.userWinId.toString(),
          reportId: finalization.reportId.toString(),
        },
        bids: bidResults,
      };

      const bidLogPath = path.join(ARTIFACT_ROOT, 'bid-log.json');
      fs.writeFileSync(bidLogPath, JSON.stringify(bidLog, jsonBigIntReplacer, 2));
      await testInfo.attach('pregao-multiperfil-bid-log', {
        body: JSON.stringify(bidLog, jsonBigIntReplacer, 2),
        contentType: 'application/json',
      });
    } finally {
      for (const context of contexts.reverse()) {
        await context.close().catch(() => undefined);
      }
    }
  });
});

async function openLoggedActor(
  browser: Browser,
  actor: PregaoActor,
  evidenceUrl: string,
  contexts: BrowserContext[],
  tenantId: bigint,
): Promise<Page> {
  const { context, page } = await openRecordedActor(browser, actor.key);
  contexts.push(context);
  await seedPregaoActorSession(context, actor, BASE_URL, tenantId);
  await page.goto(evidenceUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  expect(page.url(), `${actor.key} não deve voltar para login`).not.toContain('/auth/login');
  return page;
}

async function openAdminActor(browser: Browser, contexts: BrowserContext[], f: PregaoFixture, evidenceUrl: string): Promise<Page> {
  const { context, page } = await openRecordedActor(browser, 'admin');
  contexts.push(context);
  await seedPregaoActorSession(context, f.actors.admin, BASE_URL, f.tenantId);
  await page.goto(evidenceUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  expect(page.url(), 'admin da matriz multi-perfil não deve voltar para login').not.toContain('/auth/login');
  return page;
}

async function openRecordedActor(browser: Browser, label: string): Promise<{ context: BrowserContext; page: Page }> {
  const shouldRecordVideo = label === 'camera-monitor';
  const context = await browser.newContext({
    viewport: VIEWPORT,
    ...(shouldRecordVideo ? { recordVideo: { dir: VIDEO_DIR, size: VIEWPORT } } : {}),
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.log(`[${label}] browser-error: ${message.text()}`);
    }
  });
  return { context, page };
}

async function assertBuyerRoleIsolation(f: PregaoFixture): Promise<void> {
  const buyerIds = f.actors.buyers.map((buyer) => buyer.userId).filter((id): id is bigint => Boolean(id));
  const roleAssignments = await prisma.usersOnRoles.findMany({
    where: { userId: { in: buyerIds } },
    include: { Role: { select: { name: true } } },
  });

  expect(roleAssignments.some((assignment) => assignment.Role.name === 'ADMIN')).toBe(false);
  expect(new Set(roleAssignments.filter((assignment) => assignment.Role.name === 'COMPRADOR').map((assignment) => assignment.userId.toString())).size).toBe(PREGAO_BUYER_COUNT);
}

async function assertBuyerHabilitations(f: PregaoFixture): Promise<void> {
  const count = await prisma.auctionHabilitation.count({ where: { auctionId: f.auctionId } });
  expect(count).toBe(PREGAO_BUYER_COUNT);
}

async function assertWinnerOnlyArtifacts(f: PregaoFixture, winnerUserId: bigint, reportId: bigint): Promise<void> {
  const [userWin, wonLots, report] = await Promise.all([
    prisma.userWin.findUnique({ where: { lotId: f.lotId } }),
    prisma.wonLot.findMany({ where: { auctionId: f.auctionId } }),
    prisma.report.findUnique({ where: { id: reportId } }),
  ]);

  expect(userWin?.userId).toBe(winnerUserId);
  expect(wonLots).toHaveLength(1);
  expect(report?.createdById).toBe(f.actors.analyst.userId);

  const nonWinnerUserIds = f.actors.buyers
    .map((buyer) => buyer.userId)
    .filter((userId): userId is bigint => Boolean(userId && userId !== winnerUserId));
  const leakedWins = await prisma.userWin.count({ where: { userId: { in: nonWinnerUserIds } } });
  expect(leakedWins).toBe(0);
}

async function captureStep(page: Page, label: string): Promise<void> {
  const filename = `${Date.now()}-${label.replace(/[^a-z0-9-]/gi, '_')}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: false });
}

async function expectVisibleBidCount(page: Page, expectedMinimum: number): Promise<void> {
  const counter = page.locator('[data-ai-id="monitor-bid-count"]');
  await expect(counter).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => {
    const text = await counter.textContent().catch(() => '');
    const [firstNumber] = text.match(/\d+/) ?? [];
    return firstNumber ? Number(firstNumber) : 0;
  }, {
    timeout: 30_000,
    intervals: [500, 1_000, 2_000],
  }).toBeGreaterThanOrEqual(expectedMinimum);
}

function requiredFixture(): PregaoFixture {
  if (!fixture) {
    throw new Error('Fixture de pregão não inicializada.');
  }
  return fixture;
}

function ensureDirs(): void {
  for (const directory of [ARTIFACT_ROOT, SCREENSHOT_DIR, VIDEO_DIR]) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
}

function jsonBigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}
