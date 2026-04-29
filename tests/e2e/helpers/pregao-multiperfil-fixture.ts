/**
 * @fileoverview Fixture E2E para pregão filmado multi-perfil.
 * Cria atores reais por perfil, habilita compradores, executa transições pela
 * máquina de estado oficial e dispara lances pelo BidEngineV2.
 */

import { expect, type BrowserContext, type Page } from '@playwright/test';
import { Prisma, PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import { auctionStateMachine } from '@/lib/auction-state-machine/auction-state.service';
import { lotStateMachine } from '@/lib/auction-state-machine/lot-state.service';
import { BidEngineV2 } from '@/services/bid-engine-v2.service';

import { selectTenant } from './auth-helper';

export const PREGAO_BUYER_COUNT = 10;
export const PREGAO_INITIAL_PRICE = 5_000;
export const PREGAO_BID_INCREMENT = 500;
export const PREGAO_DEFAULT_ROUNDS = Number(process.env.PREGAO_BID_ROUNDS || '3');
export const PREGAO_TEST_PASSWORD = 'Pregao@12345';

export type PregaoActorKind = 'auctionAgent' | 'admin' | 'auctioneer' | 'buyer' | 'analyst';

export interface PregaoActor {
  key: string;
  kind: PregaoActorKind;
  label: string;
  email: string;
  password: string;
  roles: string[];
  userId?: bigint;
}

export interface PregaoBuyerActor extends PregaoActor {
  kind: 'buyer';
  buyerNumber: number;
  bidderAlias: string;
  bidderProfileId?: bigint;
}

export interface PregaoActorMatrix {
  auctionAgent: PregaoActor;
  admin: PregaoActor;
  auctioneer: PregaoActor;
  analyst: PregaoActor;
  buyers: PregaoBuyerActor[];
}

export interface PregaoBidScheduleEntry {
  round: number;
  buyerNumber: number;
  buyerKey: string;
  bidderAlias: string;
  amount: number;
  idempotencyKey: string;
}

export interface PregaoBidResult extends PregaoBidScheduleEntry {
  bidId: string;
  currentBid: number;
}

export interface PregaoWinnerSummary {
  buyerKey: string;
  buyerNumber: number;
  bidderAlias: string;
  amount: number;
}

export interface PregaoFixture {
  runId: string;
  tenantId: bigint;
  auctionId: bigint;
  auctionPublicId: string;
  lotId: bigint;
  lotPublicId: string;
  auctionStageId: bigint;
  actors: PregaoActorMatrix;
  bidSchedule: PregaoBidScheduleEntry[];
  createdUserIds: bigint[];
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['manage_all', 'CAN_VALIDATE_AUCTION', 'CAN_CANCEL_OR_CLOSE'],
  LEILOEIRO: ['conduct_auctions', 'auctions:manage_assigned', 'lots:manage_assigned', 'CAN_CANCEL_OR_CLOSE'],
  COMPRADOR: ['place_bids', 'view_auctions', 'view_lots'],
  VENDEDOR: ['consignor_dashboard:view', 'auctions:manage_own', 'lots:manage_own'],
  AVALIADOR: ['documents:generate_report', 'reports:write', 'billing:read'],
};

const STATE_ADMIN_PERMISSIONS = ['CAN_VALIDATE_AUCTION', 'CAN_CANCEL_OR_CLOSE'];
const STATE_AUCTIONEER_PERMISSIONS = ['CAN_CANCEL_OR_CLOSE'];

export function createPregaoRunId(): string {
  return `pregao-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

export function buildPregaoActorMatrix(runId: string): PregaoActorMatrix {
  const suffix = runId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const actor = (kind: PregaoActorKind, label: string, roles: string[]): PregaoActor => ({
    key: kind,
    kind,
    label,
    email: `pregao.${kind}.${suffix}@bidexpert.test`,
    password: PREGAO_TEST_PASSWORD,
    roles,
  });

  return {
    auctionAgent: actor('auctionAgent', 'Agente de Leilao Pregao Filmado', ['VENDEDOR']),
    admin: actor('admin', 'Administrador Pregao Filmado', ['ADMIN']),
    auctioneer: actor('auctioneer', 'Leiloeiro Pregao Filmado', ['LEILOEIRO']),
    analyst: actor('analyst', 'Analista Pregao Filmado', ['AVALIADOR']),
    buyers: Array.from({ length: PREGAO_BUYER_COUNT }, (_, index) => {
      const buyerNumber = index + 1;
      return {
        key: `buyer-${buyerNumber.toString().padStart(2, '0')}`,
        kind: 'buyer',
        label: `Comprador Pregao Filmado ${buyerNumber.toString().padStart(2, '0')}`,
        email: `pregao.buyer.${suffix}.${buyerNumber}@bidexpert.test`,
        password: PREGAO_TEST_PASSWORD,
        roles: ['COMPRADOR'],
        buyerNumber,
        bidderAlias: `Arrematante ${buyerNumber.toString().padStart(2, '0')}`,
      } satisfies PregaoBuyerActor;
    }),
  };
}

export function buildPregaoBidSchedule(
  buyers: PregaoBuyerActor[],
  options: { runId: string; rounds?: number; initialPrice?: number; bidIncrement?: number },
): PregaoBidScheduleEntry[] {
  const rounds = options.rounds ?? PREGAO_DEFAULT_ROUNDS;
  const initialPrice = options.initialPrice ?? PREGAO_INITIAL_PRICE;
  const bidIncrement = options.bidIncrement ?? PREGAO_BID_INCREMENT;
  const schedule: PregaoBidScheduleEntry[] = [];
  let amount = initialPrice;

  for (let round = 1; round <= rounds; round += 1) {
    for (const buyer of buyers) {
      amount += bidIncrement;
      schedule.push({
        round,
        buyerNumber: buyer.buyerNumber,
        buyerKey: buyer.key,
        bidderAlias: buyer.bidderAlias,
        amount,
        idempotencyKey: makeIdempotencyKey(options.runId, round, buyer.key, amount),
      });
    }
  }

  return schedule;
}

export function resolvePregaoWinner(schedule: PregaoBidScheduleEntry[]): PregaoWinnerSummary {
  if (schedule.length === 0) {
    throw new Error('Agenda de lances vazia.');
  }

  const winner = schedule.reduce((currentWinner, entry) => (
    entry.amount >= currentWinner.amount ? entry : currentWinner
  ), schedule[0]);

  return {
    buyerKey: winner.buyerKey,
    buyerNumber: winner.buyerNumber,
    bidderAlias: winner.bidderAlias,
    amount: winner.amount,
  };
}

export function groupPregaoScheduleByRound(schedule: PregaoBidScheduleEntry[]): PregaoBidScheduleEntry[][] {
  const groups = new Map<number, PregaoBidScheduleEntry[]>();
  for (const entry of schedule) {
    const existing = groups.get(entry.round) ?? [];
    existing.push(entry);
    groups.set(entry.round, existing);
  }
  return Array.from(groups.values());
}

export function parseBrazilianCurrency(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function loginPregaoActor(page: Page, actor: PregaoActor, baseUrl: string): Promise<void> {
  await page.context().request.get(`${baseUrl}/api/public/tenants`, { timeout: 30_000 }).catch(() => undefined);
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  const emailInput = page.locator('[data-ai-id="auth-login-email-input"], input[type="email"]').first();
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"], input[type="password"]').first();
  const submitButton = page.locator('[data-ai-id="auth-login-submit-button"], button[type="submit"]').first();

  await emailInput.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => {
    const tenantTrigger = document.querySelector('[data-ai-id="auth-login-tenant-select"]');
    const lockedText = document.body.textContent?.includes('Você está acessando:');
    return Boolean(tenantTrigger && lockedText);
  }, { timeout: 45_000 }).catch(() => undefined);
  await selectTenant(page, /BidExpert Demo|BidExpert/i);
  await emailInput.fill(actor.email);
  await passwordInput.fill(actor.password);
  await expect(emailInput).toHaveValue(actor.email, { timeout: 10_000 });
  await expect(passwordInput).toHaveValue(actor.password, { timeout: 10_000 });

  await page.waitForFunction(() => {
    const submit = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement | null;
    return submit ? !submit.disabled : true;
  }, { timeout: 10_000 }).catch(() => undefined);

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/auth/login') && response.request().method() === 'POST',
    { timeout: 45_000 },
  ).catch(() => null);

  const submitted = await page.evaluate(() => {
    const form = document.querySelector('[data-ai-id="auth-login-form"]') as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
      return 'requestSubmit';
    }

    const button = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement | null;
    button?.click();
    return button ? 'buttonClick' : 'none';
  });

  const response = await responsePromise;
  await page.waitForURL((url) => !url.toString().includes('/auth/login'), { timeout: 5_000 }).catch(() => null);

  if (page.url().includes('/auth/login')) {
    const pageError = await page.locator('.text-auth-error-center, [role="alert"]').first().textContent().catch(() => null);
    if (pageError) {
      throw new Error(`Login falhou para ${actor.email}: ${pageError}`);
    }

    await page.goto(`${baseUrl}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('net::ERR_ABORTED')) {
        throw error;
      }
    });
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
  }

  if (page.url().includes('/auth/login')) {
    const pageError = await page.locator('.text-auth-error-center, [role="alert"]').first().textContent().catch(() => null);
    const formState = await page.evaluate(() => {
      const email = (document.querySelector('[data-ai-id="auth-login-email-input"]') as HTMLInputElement | null)?.value;
      const passwordLength = (document.querySelector('[data-ai-id="auth-login-password-input"]') as HTMLInputElement | null)?.value?.length ?? 0;
      const submit = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement | null;
      return { email, passwordLength, submitDisabled: submit?.disabled ?? null };
    }).catch(() => null);
    throw new Error(`Login falhou para ${actor.email}${pageError ? `: ${pageError}` : ''}; submit=${submitted}; response=${response?.status() ?? 'none'}; form=${JSON.stringify(formState)}`);
  }
}

export async function provisionPregaoFixture(prisma: PrismaClient, runId = createPregaoRunId()): Promise<PregaoFixture> {
  const tenant = await prisma.tenant.findFirst({ where: { subdomain: 'demo' } }) ?? await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('Nenhum tenant encontrado. Execute npm run db:seed antes do pregão filmado.');
  }

  const actors = buildPregaoActorMatrix(runId);
  const allActors = [actors.auctionAgent, actors.admin, actors.auctioneer, actors.analyst, ...actors.buyers];
  const roles = await ensureRoles(prisma, [...new Set(allActors.flatMap((actor) => actor.roles))]);
  const createdUserIds: bigint[] = [];

  for (const actor of allActors) {
    const user = await ensureActorUser(prisma, tenant.id, actor, roles);
    actor.userId = user.id;
    createdUserIds.push(user.id);
  }

  const now = new Date();
  const startDate = new Date(now.getTime() + 60_000);
  const endDate = new Date(now.getTime() + 15 * 60_000);

  const auction = await prisma.auction.create({
    data: {
      publicId: makePublicId(`auction-${runId}`),
      slug: `pregao-multiperfil-${runId}`.slice(0, 180),
      title: `Pregao Multi-Perfil Filmado ${runId}`,
      description: 'Leilao de teste criado por agente dedicado para evidencia filmada multi-perfil.',
      status: 'RASCUNHO',
      auctionDate: startDate,
      openDate: startDate,
      endDate,
      totalLots: 1,
      totalHabilitatedUsers: PREGAO_BUYER_COUNT,
      initialOffer: new Prisma.Decimal(PREGAO_INITIAL_PRICE),
      createdByUserId: actors.auctionAgent.userId,
      tenantId: tenant.id,
      updatedAt: now,
    },
  });

  const lot = await prisma.lot.create({
    data: {
      publicId: makePublicId(`lot-${runId}`),
      number: '001',
      title: `Lote Pregao Multi-Perfil ${runId}`,
      description: 'Lote criado para disputa filmada com 10 compradores reais.',
      status: 'RASCUNHO',
      type: 'MOVENTE',
      price: new Prisma.Decimal(PREGAO_INITIAL_PRICE),
      initialPrice: new Prisma.Decimal(PREGAO_INITIAL_PRICE),
      bidIncrementStep: new Prisma.Decimal(PREGAO_BID_INCREMENT),
      endDate,
      lotSpecificAuctionDate: startDate,
      auctionId: auction.id,
      tenantId: tenant.id,
      updatedAt: now,
    },
  });

  const stage = await prisma.auctionStage.create({
    data: {
      name: 'Praca Filmada Multi-Perfil',
      startDate,
      endDate,
      status: 'ABERTO',
      auctionId: auction.id,
      tenantId: tenant.id,
    },
  });

  await prisma.lotStagePrice.create({
    data: {
      lotId: lot.id,
      auctionId: auction.id,
      auctionStageId: stage.id,
      initialBid: new Prisma.Decimal(PREGAO_INITIAL_PRICE),
      bidIncrement: new Prisma.Decimal(PREGAO_BID_INCREMENT),
      tenantId: tenant.id,
    },
  });

  await enableBuyersForAuction(prisma, tenant.id, auction.id, actors.buyers);

  return {
    runId,
    tenantId: tenant.id,
    auctionId: auction.id,
    auctionPublicId: auction.publicId ?? auction.id.toString(),
    lotId: lot.id,
    lotPublicId: lot.publicId ?? lot.id.toString(),
    auctionStageId: stage.id,
    actors,
    bidSchedule: buildPregaoBidSchedule(actors.buyers, { runId }),
    createdUserIds,
  };
}

export async function runPregaoOpeningLifecycle(prisma: PrismaClient, fixture: PregaoFixture): Promise<void> {
  const scheduledStart = new Date(Date.now() + 60_000);

  await prisma.auction.update({
    where: { id: fixture.auctionId },
    data: {
      auctionDate: scheduledStart,
      openDate: scheduledStart,
      endDate: new Date(Date.now() + 15 * 60_000),
      updatedAt: new Date(),
    },
  });

  const submit = await auctionStateMachine.submitForValidation({
    auctionId: fixture.auctionId.toString(),
    userId: requiredUserId(fixture.actors.auctionAgent).toString(),
    tenantId: fixture.tenantId.toString(),
  });
  assertTransition(submit.success, submit.error, 'submeter leilao para validacao');

  const approve = await auctionStateMachine.approveAuction(
    {
      auctionId: fixture.auctionId.toString(),
      validatorUserId: requiredUserId(fixture.actors.admin).toString(),
      tenantId: fixture.tenantId.toString(),
      openDate: scheduledStart,
    },
    { id: requiredUserId(fixture.actors.admin), permissions: STATE_ADMIN_PERMISSIONS },
  );
  assertTransition(approve.success, approve.error, 'aprovar e agendar leilao');

  const open = await auctionStateMachine.openAuction({
    auctionId: fixture.auctionId.toString(),
    userId: requiredUserId(fixture.actors.auctioneer).toString(),
    tenantId: fixture.tenantId.toString(),
    isAutomatic: false,
  });
  assertTransition(open.success, open.error, 'abrir leilao');

  const startLot = await lotStateMachine.startLotAuction({
    lotId: fixture.lotId.toString(),
    auctionId: fixture.auctionId.toString(),
    userId: requiredUserId(fixture.actors.auctioneer).toString(),
    tenantId: fixture.tenantId.toString(),
  });
  assertTransition(startLot.success, startLot.error, 'iniciar lote em pregao');
}

export async function placePregaoBid(prisma: PrismaClient, fixture: PregaoFixture, entry: PregaoBidScheduleEntry): Promise<PregaoBidResult> {
  const engine = new BidEngineV2();
  const buyer = fixture.actors.buyers.find((candidate) => candidate.key === entry.buyerKey);
  if (!buyer?.userId) {
    throw new Error(`Comprador sem userId para lance: ${entry.buyerKey}`);
  }

  const result = await engine.placeBid(
    {
      lotId: fixture.lotId.toString(),
      userId: buyer.userId.toString(),
      amount: entry.amount,
      bidderDisplay: buyer.label,
      bidderAlias: buyer.bidderAlias,
      bidOrigin: 'API',
      clientIdempotencyKey: entry.idempotencyKey,
      clientTimestamp: new Date().toISOString(),
    },
    { ipAddress: '127.0.0.1', userAgent: 'pregao-multiperfil-video' },
    'CLIENT_UUID',
  );

  if (!result.success || !result.bidId || !result.currentBid) {
    const lot = await prisma.lot.findUnique({ where: { id: fixture.lotId }, select: { price: true, bidsCount: true, status: true } });
    throw new Error(`Falha ao registrar lance ${entry.buyerKey} R$${entry.amount}: ${result.message}. Lote=${JSON.stringify(lot)}`);
  }

  return {
    ...entry,
    bidId: result.bidId,
    currentBid: result.currentBid,
  };
}

export async function finalizePregaoWithWinner(prisma: PrismaClient, fixture: PregaoFixture): Promise<{
  winnerUserId: bigint;
  winnerBidderProfileId: bigint;
  winningAmount: number;
  userWinId: bigint;
  reportId: bigint;
}> {
  const winningBid = await prisma.bid.findFirst({
    where: { auctionId: fixture.auctionId, lotId: fixture.lotId, status: 'ATIVO' },
    orderBy: [{ amount: 'desc' }, { timestamp: 'desc' }],
  });

  if (!winningBid) {
    throw new Error('Nenhum lance ativo encontrado para finalizar o pregão.');
  }

  const winningAmount = Number(winningBid.amount);
  const confirmSale = await lotStateMachine.confirmSale({
    lotId: fixture.lotId.toString(),
    auctionId: fixture.auctionId.toString(),
    userId: requiredUserId(fixture.actors.auctioneer).toString(),
    tenantId: fixture.tenantId.toString(),
    winnerId: winningBid.bidderId.toString(),
    soldPrice: winningAmount,
  });
  assertTransition(confirmSale.success, confirmSale.error, 'confirmar arrematacao');

  const closeLot = await lotStateMachine.closeLot({
    lotId: fixture.lotId.toString(),
    auctionId: fixture.auctionId.toString(),
    userId: requiredUserId(fixture.actors.auctioneer).toString(),
    tenantId: fixture.tenantId.toString(),
  });
  assertTransition(closeLot.success, closeLot.error, 'fechar lote arrematado');

  const closeAuction = await auctionStateMachine.closeAuction(
    {
      auctionId: fixture.auctionId.toString(),
      userId: requiredUserId(fixture.actors.auctioneer).toString(),
      tenantId: fixture.tenantId.toString(),
    },
    { id: requiredUserId(fixture.actors.auctioneer), permissions: STATE_AUCTIONEER_PERMISSIONS },
  );
  assertTransition(closeAuction.success, closeAuction.error, 'encerrar leilao');

  const bidderProfile = await prisma.bidderProfile.findUnique({ where: { userId: winningBid.bidderId } });
  if (!bidderProfile) {
    throw new Error('Perfil de arrematante vencedor não encontrado.');
  }

  const userWin = await prisma.userWin.upsert({
    where: { lotId: fixture.lotId },
    update: {
      userId: winningBid.bidderId,
      winningBidAmount: new Prisma.Decimal(winningAmount),
      paymentStatus: 'PENDENTE',
      invoiceUrl: `/e2e/pregao/${fixture.runId}/invoice.pdf`,
    },
    create: {
      lotId: fixture.lotId,
      userId: winningBid.bidderId,
      winningBidAmount: new Prisma.Decimal(winningAmount),
      paymentStatus: 'PENDENTE',
      invoiceUrl: `/e2e/pregao/${fixture.runId}/invoice.pdf`,
      tenantId: fixture.tenantId,
    },
  });

  await prisma.installmentPayment.upsert({
    where: { userWinId_installmentNumber: { userWinId: userWin.id, installmentNumber: 1 } },
    update: { status: 'PAGO', paymentDate: new Date(), paymentMethod: 'PIX_TESTE' },
    create: {
      userWinId: userWin.id,
      installmentNumber: 1,
      totalInstallments: 2,
      amount: new Prisma.Decimal(winningAmount / 2),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      paymentDate: new Date(),
      status: 'PAGO',
      paymentMethod: 'PIX_TESTE',
      transactionId: `pregao-${fixture.runId}-1`,
      tenantId: fixture.tenantId,
    },
  });

  await prisma.installmentPayment.upsert({
    where: { userWinId_installmentNumber: { userWinId: userWin.id, installmentNumber: 2 } },
    update: { status: 'PENDENTE' },
    create: {
      userWinId: userWin.id,
      installmentNumber: 2,
      totalInstallments: 2,
      amount: new Prisma.Decimal(winningAmount / 2),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDENTE',
      tenantId: fixture.tenantId,
    },
  });

  await prisma.wonLot.deleteMany({ where: { lotId: fixture.lotId, auctionId: fixture.auctionId } });
  await prisma.wonLot.create({
    data: {
      bidderId: bidderProfile.id,
      lotId: fixture.lotId,
      auctionId: fixture.auctionId,
      title: `Arrematacao Pregao ${fixture.runId}`,
      finalBid: new Prisma.Decimal(winningAmount),
      paymentStatus: 'PENDENTE',
      totalAmount: new Prisma.Decimal(winningAmount),
      paidAmount: new Prisma.Decimal(winningAmount / 2),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invoiceUrl: `/e2e/pregao/${fixture.runId}/invoice.pdf`,
      receiptUrl: `/e2e/pregao/${fixture.runId}/receipt-partial.pdf`,
      tenantId: fixture.tenantId,
    },
  });

  const report = await prisma.report.create({
    data: {
      name: `Laudo Pregao Multi-Perfil ${fixture.runId}`,
      description: 'Laudo e acompanhamento financeiro emitidos pelo analista para o vencedor do pregão filmado.',
      definition: {
        scenario: 'pregao-multiperfil-video',
        auctionId: fixture.auctionId.toString(),
        lotId: fixture.lotId.toString(),
        winnerUserId: winningBid.bidderId.toString(),
        winningAmount,
        payment: { installments: 2, paidInstallments: 1 },
      },
      tenantId: fixture.tenantId,
      createdById: requiredUserId(fixture.actors.analyst),
    },
  });

  return {
    winnerUserId: winningBid.bidderId,
    winnerBidderProfileId: bidderProfile.id,
    winningAmount,
    userWinId: userWin.id,
    reportId: report.id,
  };
}

export async function teardownPregaoFixture(prisma: PrismaClient, fixture?: PregaoFixture): Promise<void> {
  if (!fixture) {
    return;
  }

  const generatedEmails = [
    fixture.actors.auctionAgent.email,
    fixture.actors.admin.email,
    fixture.actors.auctioneer.email,
    fixture.actors.analyst.email,
    ...fixture.actors.buyers.map((buyer) => buyer.email),
  ];

  const userWin = await prisma.userWin.findUnique({ where: { lotId: fixture.lotId }, select: { id: true } }).catch(() => null);
  if (userWin) {
    await prisma.installmentPayment.deleteMany({ where: { userWinId: userWin.id } }).catch(() => undefined);
  }

  await prisma.report.deleteMany({ where: { name: { contains: fixture.runId } } }).catch(() => undefined);
  await prisma.wonLot.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.userWin.deleteMany({ where: { lotId: fixture.lotId } }).catch(() => undefined);
  await prisma.bidIdempotencyLog.deleteMany({ where: { lotId: fixture.lotId } }).catch(() => undefined);
  await prisma.bid.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.auctionHabilitation.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.lotStagePrice.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.auctionStage.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.lot.deleteMany({ where: { auctionId: fixture.auctionId } }).catch(() => undefined);
  await prisma.auction.deleteMany({ where: { id: fixture.auctionId } }).catch(() => undefined);
  await prisma.auditLog.deleteMany({ where: { userId: { in: fixture.createdUserIds } } }).catch(() => undefined);
  await prisma.bidderProfile.deleteMany({ where: { userId: { in: fixture.createdUserIds } } }).catch(() => undefined);
  await prisma.usersOnRoles.deleteMany({ where: { userId: { in: fixture.createdUserIds } } }).catch(() => undefined);

  const userOnTenant = getUserOnTenantDelegate(prisma);
  await userOnTenant.deleteMany({ where: { userId: { in: fixture.createdUserIds } } }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { email: { in: generatedEmails } } }).catch(() => undefined);
}

async function ensureRoles(prisma: PrismaClient, roleNames: string[]): Promise<Record<string, { id: bigint }>> {
  const roles: Record<string, { id: bigint }> = {};
  for (const roleName of roleNames) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions: ROLE_PERMISSIONS[roleName] ?? [] },
      create: {
        name: roleName,
        nameNormalized: roleName.toUpperCase(),
        description: `Role ${roleName} para testes de pregão multi-perfil`,
        permissions: ROLE_PERMISSIONS[roleName] ?? [],
      },
      select: { id: true },
    });
    roles[roleName] = role;
  }
  return roles;
}

async function ensureActorUser(
  prisma: PrismaClient,
  tenantId: bigint,
  actor: PregaoActor | PregaoBuyerActor,
  roles: Record<string, { id: bigint }>,
): Promise<{ id: bigint }> {
  const password = await bcryptjs.hash(actor.password, 10);
  const user = await prisma.user.upsert({
    where: { email: actor.email },
    update: {
      password,
      fullName: actor.label,
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      updatedAt: new Date(),
    },
    create: {
      email: actor.email,
      password,
      fullName: actor.label,
      habilitationStatus: 'HABILITADO',
      accountType: 'PHYSICAL',
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  const userOnTenant = getUserOnTenantDelegate(prisma);
  await userOnTenant.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { assignedBy: 'pregao-multiperfil-video' },
    create: { userId: user.id, tenantId, assignedBy: 'pregao-multiperfil-video' },
  });

  for (const roleName of actor.roles) {
    const role = roles[roleName];
    if (!role) {
      throw new Error(`Role ausente para ator ${actor.key}: ${roleName}`);
    }
    await prisma.usersOnRoles.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: { assignedBy: 'pregao-multiperfil-video' },
      create: { userId: user.id, roleId: role.id, assignedBy: 'pregao-multiperfil-video' },
    });
  }

  if (actor.kind === 'buyer') {
    const bidderProfile = await prisma.bidderProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: actor.label,
        documentStatus: 'APPROVED',
        isActive: true,
        tenantId,
      },
      create: {
        userId: user.id,
        fullName: actor.label,
        documentStatus: 'APPROVED',
        isActive: true,
        tenantId,
      },
      select: { id: true },
    });
    (actor as PregaoBuyerActor).bidderProfileId = bidderProfile.id;
  }

  return user;
}

async function enableBuyersForAuction(
  prisma: PrismaClient,
  tenantId: bigint,
  auctionId: bigint,
  buyers: PregaoBuyerActor[],
): Promise<void> {
  for (const buyer of buyers) {
    await prisma.auctionHabilitation.upsert({
      where: { userId_auctionId: { userId: requiredUserId(buyer), auctionId } },
      update: { tenantId, habilitatedAt: new Date() },
      create: { userId: requiredUserId(buyer), auctionId, tenantId },
    });
  }
}

function requiredUserId(actor: PregaoActor): bigint {
  if (!actor.userId) {
    throw new Error(`Ator sem userId: ${actor.key}`);
  }
  return actor.userId;
}

function assertTransition(success: boolean, error: string | undefined, label: string): void {
  expect(success, `Falha ao ${label}: ${error ?? 'sem detalhes'}`).toBe(true);
}

function makePublicId(seed: string): string {
  return createHash('sha256').update(`${seed}-${Date.now()}-${randomUUID()}`).digest('hex').slice(0, 16);
}

function makeIdempotencyKey(runId: string, round: number, buyerKey: string, amount: number): string {
  return createHash('sha256').update(`${runId}:${round}:${buyerKey}:${amount}`).digest('hex').slice(0, 64);
}

function getUserOnTenantDelegate(prisma: PrismaClient): any {
  return (prisma as any).userOnTenant ?? (prisma as any).usersOnTenants;
}

export async function seedPregaoActorSession(
  context: BrowserContext,
  actor: PregaoActor,
  baseUrl: string,
  tenantId: bigint,
): Promise<void> {
  const userId = requiredUserId(actor);
  const secret = resolveSessionSecret(baseUrl);
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const permissions = [...new Set(actor.roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []))];
  const token = await new SignJWT({
    userId: userId.toString(),
    email: actor.email,
    tenantId: tenantId.toString(),
    roleNames: actor.roles,
    permissions,
    sellerId: null,
    auctioneerId: null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret));

  const host = new URL(baseUrl).hostname;
  await context.addCookies([
    {
      name: 'session',
      value: token,
      domain: host,
      path: '/',
      expires: expiresAt,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'magic_cookie_test',
      value: 'test_from_playwright',
      domain: host,
      path: '/',
      expires: expiresAt,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

function resolveSessionSecret(baseUrl: string): string {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }

  const port = new URL(baseUrl).port || process.env.PORT || '9028';
  return `bidexpert_local_session_secret_${port}_len_40`;
}
