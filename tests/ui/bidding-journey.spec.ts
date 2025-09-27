// tests/ui/bidding-journey.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '../../src/app/admin/users/actions';
import { createAuction } from '../../src/app/admin/auctions/actions';
import { createLot } from '../../src/app/admin/lots/actions';
import { habilitateForAuctionAction } from '../../src/app/admin/habilitations/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Tenant } from '../../src/types';

const testRunId = `bidding-journey-${uuidv4().substring(0, 8)}`;
let bidderUser: UserProfileWithPermissions;
let testAuction: Auction;
let testLot: Lot;
let testTenant: Tenant;

test.describe('Módulo 3: Jornada do Arrematante - Dar um Lance', () => {

  test.beforeAll(async () => {
    console.log(`[Bidding Journey Test] Setting up for run: ${testRunId}`);
    
    testTenant = await prisma.tenant.create({ data: { name: `Bidding Test Tenant ${testRunId}`, subdomain: `bidding-test-${testRunId}` } });

    const bidderRole = await prisma.role.upsert({
      where: { nameNormalized: 'BIDDER' },
      update: {},
      create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] }
    });

    const userRes = await createUser({
      fullName: `Bidder User ${testRunId}`,
      email: `bidder-${testRunId}@test.com`,
      password: 'password123',
      roleIds: [bidderRole.id],
      habilitationStatus: 'HABILITADO',
      tenantId: testTenant.id,
    });
    expect(userRes.success).toBe(true);
    const createdUser = await prisma.user.findUnique({where: {id: userRes.userId!}, include: {roles: {include: {role: true}}, tenants: {include: {tenant: true}}}});
    bidderUser = createdUser as any;
    expect(bidderUser).toBeDefined();

    // Criar dados para leilão e lote
    const seller = await prisma.seller.create({ data: { name: `Seller Bidding ${testRunId}`, publicId: `seller-bid-${testRunId}`, slug: `seller-bid-${testRunId}`, isJudicial: false, tenantId: testTenant.id } });
    const auctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer Bidding ${testRunId}`, publicId: `auct-bid-${testRunId}`, slug: `auct-bid-${testRunId}`, tenantId: testTenant.id } });
    const category = await prisma.lotCategory.create({ data: { name: `Cat Bidding ${testRunId}`, slug: `cat-bid-${testRunId}`, hasSubcategories: false } });

    const auctionRes = await createAuction({
      title: `Bidding Test Auction ${testRunId}`,
      status: 'ABERTO_PARA_LANCES',
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      categoryId: category.id,
      tenantId: testTenant.id
    } as any);
    expect(auctionRes.success).toBe(true);
    testAuction = (await prisma.auction.findUnique({ where: { id: auctionRes.auctionId! } })) as Auction;

    const lotRes = await createLot({
      title: `Bidding Test Lot ${testRunId}`,
      auctionId: testAuction.id,
      price: 500,
      initialPrice: 500,
      bidIncrementStep: 50,
      type: category.name,
      status: 'ABERTO_PARA_LANCES',
      endDate: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      tenantId: testTenant.id
    } as any);
    expect(lotRes.success).toBe(true);
    testLot = (await prisma.lot.findUnique({ where: { id: lotRes.lotId! } })) as Lot;
    
    // Habilitar o usuário para o leilão
    await habilitateForAuctionAction(bidderUser.id, testAuction.id);

    console.log(`[Bidding Journey Test] Setup complete.`);
  });

  test.afterAll(async () => {
    console.log(`[Bidding Journey Test] Cleaning up for run: ${testRunId}`);
    try {
      if (testLot) await prisma.lot.deleteMany({ where: { id: testLot.id } });
      if (testAuction) await prisma.auction.deleteMany({ where: { id: testAuction.id } });
      if (bidderUser) {
        await prisma.usersOnRoles.deleteMany({ where: { userId: bidderUser.id } });
        await prisma.usersOnTenants.deleteMany({ where: { userId: bidderUser.id } });
        await prisma.user.delete({ where: { id: bidderUser.id } });
      }
      await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
      if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
    } catch (error) {
      console.error('[Bidding Journey Test] Cleanup failed:', error);
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill(bidderUser.email);
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');
  });

  test('Cenário 3.1: should allow a habilitated user to place a bid', async ({ page }) => {
    console.log('[Bidding Journey Test] Navigating to lot page...');
    const lotUrl = `/auctions/${testLot.auctionId}/lots/${testLot.publicId || testLot.id}`;
    await page.goto(lotUrl);

    // 1. Localizar o painel de lances e verificar o preço inicial
    const biddingPanel = page.locator('[data-ai-id="bidding-panel-card"]');
    await expect(biddingPanel).toBeVisible();
    
    const initialPriceText = `R$ ${testLot.initialPrice!.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    await expect(biddingPanel.getByText(initialPriceText, { exact: false })).toBeVisible();
    
    // 2. Inserir um lance válido
    console.log('[Bidding Journey Test] Placing a valid bid...');
    const bidInput = biddingPanel.locator('input[type="number"]');
    const newBidAmount = testLot.initialPrice! + testLot.bidIncrementStep!;
    await bidInput.fill(String(newBidAmount));
    
    // 3. Clicar no botão para dar o lance
    const bidButton = biddingPanel.getByRole('button', { name: /Dar Lance/ });
    await bidButton.click();
    
    // 4. Verificar o resultado
    await expect(page.getByText('Sucesso!')).toBeVisible({ timeout: 10000 }); // Toast de sucesso
    
    // Verificar se o preço atual foi atualizado na UI
    const updatedPriceText = `R$ ${newBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    await expect(biddingPanel.getByText(updatedPriceText)).toBeVisible({ timeout: 5000 });

    // Verificar se o nome do usuário aparece no histórico
    const bidHistoryPanel = biddingPanel.locator('div:has-text("Histórico Recente")');
    await expect(bidHistoryPanel.getByText(bidderUser.fullName!)).toBeVisible();

    console.log('[Bidding Journey Test] PASSED: Bid placed and UI updated successfully.');
  });
});
