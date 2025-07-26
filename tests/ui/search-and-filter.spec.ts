// tests/ui/search-and-filter.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import type { Auction, Lot, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '../../src/lib/sample-data-helpers';

let prisma: PrismaClient;

const testRunId = `search-e2e-${uuidv4().substring(0, 8)}`;

let category1: LotCategory, category2: LotCategory;
let seller1: SellerProfileInfo, seller2: SellerProfileInfo;
let auctioneer1: AuctioneerProfileInfo;
let auction1: Auction, auction2: Auction, auction3: Auction;
let lot1: Lot, lot2: Lot, lot3: Lot;

async function createSearchTestData() {
    console.log(`[Search E2E] Creating test data for run: ${testRunId}`);
    
    [category1, category2] = await prisma.$transaction([
        prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    [seller1, seller2] = await prisma.$transaction([
        prisma.seller.create({ data: { name: `Comitente A ${testRunId}`, slug: `comitente-a-${testRunId}`, publicId: `pub-seller-a-${testRunId}`, isJudicial: false } }),
        prisma.seller.create({ data: { name: `Comitente B ${testRunId}`, slug: `comitente-b-${testRunId}`, publicId: `pub-seller-b-${testRunId}`, isJudicial: false } })
    ]);
    
    auctioneer1 = await prisma.auctioneer.create({ data: { name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}` } });

    [auction1, auction2, auction3] = await prisma.$transaction([
        prisma.auction.create({ data: { title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id } as any }),
        prisma.auction.create({ data: { title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller2.id, categoryId: category2.id } as any }),
        prisma.auction.create({ data: { title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id } as any })
    ]);

    [lot1, lot2, lot3] = await prisma.$transaction([
        prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP' } as any }),
        prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ' } as any }),
        prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction3.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP' } as any })
    ]);
    console.log(`[Search E2E] Test data created.`);
}

async function cleanupSearchTestData() {
    console.log(`[Search E2E] Cleaning up test data for run: ${testRunId}`);
    try {
        if (!prisma) {
          console.log('Prisma client not initialized, skipping cleanup');
          return;
        }
        await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    } catch (e) {
        console.error("Error cleaning up search test data", e);
    }
}


test.describe('Search and Filter E2E Test', () => {
    test.beforeAll(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupSearchTestData();
        await createSearchTestData();
    });

    test.afterAll(async () => {
        await cleanupSearchTestData();
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
          window.localStorage.setItem('bidexpert_setup_complete', 'true');
        });
        await page.goto('/search');
    });

    test('should filter by search term', async ({ page }) => {
        await page.getByRole('button', { name: 'Lotes' }).click();
        await page.locator('input[type="search"]').fill('Ford Ka');
        await page.getByRole('button', { name: 'Buscar' }).click();
        await expect(page.getByText(`1 lotes encontrado(s)`)).toBeVisible();
        await expect(page.getByText(lot1.title)).toBeVisible();
        await expect(page.getByText(lot2.title)).not.toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
        await page.getByRole('button', { name: 'Lotes' }).click();
        await page.getByRole('button', { name: 'Categorias' }).click();
        await page.getByLabel(category2.name).check();
        await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
        await expect(page.getByText(`1 lotes encontrado(s)`)).toBeVisible();
        await expect(page.getByText(lot2.title)).toBeVisible();
        await expect(page.getByText(lot1.title)).not.toBeVisible();
    });
    
    test('should filter by location', async ({ page }) => {
        await page.getByRole('button', { name: 'Lotes' }).click();
        await page.getByRole('button', { name: 'Localizações' }).click();
        await page.getByLabel('Rio de Janeiro - RJ').check();
        await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
        await expect(page.getByText(`1 lotes encontrado(s)`)).toBeVisible();
        await expect(page.getByText(lot2.title)).toBeVisible();
        await expect(page.getByText(lot1.title)).not.toBeVisible();
    });
});
