// tests/ui/search-and-filter.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot, Tenant } from '../../types';
import { v4 as uuidv4 } from 'uuid';

let prismaClient: any;
const testRunId = `search-e2e-${uuidv4().substring(0, 8)}`;
console.log(`[search-and-filter.spec.ts] Using testRunId: ${testRunId}`);

let testTenant: Tenant;
let category1: LotCategory, category2: LotCategory;
let seller1: SellerProfileInfo, seller2: SellerProfileInfo;
let auctioneer1: AuctioneerProfileInfo;
let auction1: Auction, auction2: Auction, auction3: Auction;
let lot1: Lot, lot2: Lot, lot3: Lot;

async function createSearchTestData() {
    console.log(`[createTestData] Starting for run: ${testRunId}`);
    
    testTenant = await prismaClient.tenant.create({ data: { name: `Search Test Tenant ${testRunId}`, subdomain: `search-e2e-${testRunId}` }});

    [category1, category2] = await prismaClient.$transaction([
        prismaClient.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prismaClient.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    [seller1, seller2] = await prismaClient.$transaction([
        prismaClient.seller.create({ data: { name: `Comitente A ${testRunId}`, slug: `comitente-a-${testRunId}`, publicId: `pub-seller-a-${testRunId}`, isJudicial: false, city: 'São Paulo', state: 'SP', tenantId: testTenant.id } }),
        prismaClient.seller.create({ data: { name: `Comitente B ${testRunId}`, slug: `comitente-b-${testRunId}`, publicId: `pub-seller-b-${testRunId}`, isJudicial: false, city: 'Rio de Janeiro', state: 'RJ', tenantId: testTenant.id } })
    ]);
    
    auctioneer1 = await prismaClient.auctioneer.create({ data: { name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}`, tenantId: testTenant.id } });

    [auction1, auction2, auction3] = await prismaClient.$transaction([
        prismaClient.auction.create({ data: { title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', tenantId: testTenant.id } as any }),
        prismaClient.auction.create({ data: { title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller2.id, categoryId: category2.id, city: 'Rio de Janeiro', state: 'RJ', tenantId: testTenant.id } as any }),
        prismaClient.auction.create({ data: { title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', tenantId: testTenant.id } as any })
    ]);

    [lot1, lot2, lot3] = await prismaClient.$transaction([
        prismaClient.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', tenantId: testTenant.id } as any }),
        prismaClient.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ', tenantId: testTenant.id } as any }),
        prismaClient.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction3.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', tenantId: testTenant.id } as any })
    ]);
    console.log(`[Search E2E] Test data created.`);
}

async function cleanupSearchTestData() {
  console.log(`[Search E2E] Cleaning up test data for run: ${testRunId}`);
  if (!prismaClient) {
    console.warn('[cleanupSearchTestData] Prisma client not initialized, skipping cleanup.');
    return;
  }
  try {
    await prismaClient.lot.deleteMany({ where: { title: { contains: testRunId } } });
    await prismaClient.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prismaClient.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prismaClient.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prismaClient.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    await prismaClient.tenant.deleteMany({ where: { name: { contains: testRunId } } });
    
    console.log(`[cleanupSearchTestData] Cleanup complete for run ${testRunId}.`);
  } catch (e) {
    console.error(`[cleanupSearchTestData] Error during cleanup for run ${testRunId}:`, e);
  }
}


test.describe('Search and Filter E2E Test', () => {
    test.beforeAll(async () => {
        prismaClient = new prisma();
        await prismaClient.$connect();
        await cleanupSearchTestData();
        await createSearchTestData();
    });

    test.afterAll(async () => {
        await cleanupSearchTestData();
        await prismaClient.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
          window.localStorage.setItem('bidexpert_setup_complete', 'true');
        });
        console.log('[Search Test] Navigating to search page...');
        await page.goto('/search');
        await page.waitForLoadState('networkidle');
        const pageTitle = await page.title();
        console.log(`[Search Test] Page loaded. URL: ${page.url()}, Title: "${pageTitle}"`);
        await expect(page).toHaveTitle(/BidExpert/);
    });

    test('should filter by search term', async ({ page }) => {
        await page.getByRole('button', { name: /Lotes/ }).click();
        await page.locator('input[type="search"]').fill('Ford Ka');
        await expect(page.locator('[data-ai-id^="lot-card-"]').first()).toBeVisible();
        await expect(page.getByText(/1 lote\(s\) encontrado\(s\)/)).toBeVisible();
        await expect(page.getByText(lot1.title)).toBeVisible();
        await expect(page.getByText(lot2.title)).not.toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
        await page.getByRole('button', { name: /Lotes/ }).click();
        await page.getByRole('button', { name: 'Filtros' }).click();
        await page.locator('aside').getByRole('radio', { name: `Imóveis ${testRunId}` }).click();
        await page.locator('aside').getByRole('button', { name: 'Aplicar Filtros' }).click();

        await expect(page.getByText(/1 lote\(s\) encontrado\(s\)/)).toBeVisible();
        await expect(page.getByText(lot2.title)).toBeVisible();
        await expect(page.getByText(lot1.title)).not.toBeVisible();
    });
    
    test('should filter by location', async ({ page }) => {
        await page.getByRole('button', { name: /Lotes/ }).click();
        await page.getByRole('button', { name: 'Filtros' }).click();
        await page.locator('aside').getByLabel('Rio de Janeiro - RJ').check();
        await page.locator('aside').getByRole('button', { name: 'Aplicar Filtros' }).click();
        
        await expect(page.getByText(/1 lote\(s\) encontrado\(s\)/)).toBeVisible();
        await expect(page.getByText(lot2.title)).toBeVisible();
        await expect(page.getByText(lot1.title)).not.toBeVisible();
    });
});
