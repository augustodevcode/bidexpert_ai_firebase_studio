// tests/test-utils.ts
import { prisma } from '@/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Asset, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, Tenant } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Note: Server Actions are imported dynamically to avoid client-side import issues

// Playwright utility functions for slow loading app
import type { Page, Locator } from '@playwright/test';

export async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const originalGetSession = require('@/app/auth/actions').getSession;
    const tenantId = user?.tenants?.[0]?.tenant.id || '1'; // Default to landlord if user has no specific tenant

    require('@/app/auth/actions').getSession = async () => user ? { userId: user.id, tenantId: tenantId, permissions: user.permissions } : null;

    try {
        return await action(...args);
    } finally {
        require('@/app/auth/actions').getSession = originalGetSession;
    }
}

export async function createTestPrerequisites(testRunId: string, prefix: string) {
    // Dynamic imports to avoid client-side import issues
    const { createUser, getUserProfileData } = await import('@/app/admin/users/actions');
    const { createSeller, getSeller } = await import('@/app/admin/sellers/actions');
    const { createJudicialProcessAction } = await import('@/app/admin/judicial-processes/actions');
    const { createAsset } = await import('@/app/admin/assets/actions');
    const { createAuctioneer } = await import('@/app/admin/auctioneers/actions');

    const tenant = await prisma.tenant.create({ data: { name: `${prefix} Tenant ${testRunId}`, subdomain: `${prefix}-${testRunId}` } });

    const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
    const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } });
    
    // Admin user must be created in the context of the new tenant
    const adminRes = await callActionAsUser(createUser, null, {
        fullName: `Admin ${prefix} ${testRunId}`,
        email: `admin-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [adminRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'HABILITADO'
    });
    const adminUser = await callActionAsUser(getUserProfileData, null, adminRes.userId!);

    const unauthorizedUserRes = await callActionAsUser(createUser, null, {
        fullName: `Unauthorized ${prefix} ${testRunId}`,
        email: `unauthorized-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [userRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'PENDING_DOCUMENTS'
    });
    const unauthorizedUser = await callActionAsUser(getUserProfileData, null, unauthorizedUserRes.userId!);
    
    const category = await prisma.lotCategory.create({ data: { name: `Cat ${prefix} ${testRunId}`, slug: `cat-${prefix}-${testRunId}`, hasSubcategories: false } });
    const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Auctioneer ${prefix} ${testRunId}` } as any);
    const auctioneer = (await prisma.auctioneer.findUnique({where: {id: auctioneerRes.auctioneerId}}))!;
    
    const uniqueUf = `${prefix.substring(0,1).toUpperCase()}${testRunId.substring(0, 1).toUpperCase()}`;
    const state = await prisma.state.upsert({ where: { uf: uniqueUf }, update: {}, create: { name: `State ${prefix} ${testRunId}`, uf: uniqueUf, slug: `st-${prefix}-${testRunId}` } });
    const court = await prisma.court.create({ data: { name: `Court ${prefix} ${testRunId}`, stateUf: state.uf, slug: `court-${prefix}-${testRunId}` } });
    const district = await prisma.judicialDistrict.create({ data: { name: `District ${prefix} ${testRunId}`, slug: `dist-${prefix}-${testRunId}`, courtId: court.id, stateId: state.id } });
    const branch = await prisma.judicialBranch.create({ data: { name: `Branch ${prefix} ${testRunId}`, slug: `branch-${prefix}-${testRunId}`, districtId: district.id } });
    
    const judicialSellerRes = await callActionAsUser(createSeller, adminUser, { name: `Vara ${prefix} ${testRunId}`, isJudicial: true, judicialBranchId: branch.id } as any);
    const judicialSeller = (await callActionAsUser(getSeller, adminUser, judicialSellerRes.sellerId!))!;

    const procRes = await callActionAsUser(createJudicialProcessAction, adminUser, { processNumber: `500-${prefix}-${testRunId}`, isElectronic: true, courtId: court.id, districtId: district.id, branchId: branch.id, sellerId: judicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] } as any);
    const judicialProcess = (await prisma.judicialProcess.findUnique({where: {id: procRes.processId}, include: { parties: true }}))!;

    const assetRes = await callActionAsUser(createAsset, adminUser, { title: `Asset para ${prefix} ${testRunId}`, judicialProcessId: judicialProcess.id, categoryId: category.id, status: 'DISPONIVEL', evaluationValue: 50000.00 } as any);
    const asset = (await prisma.asset.findUnique({where: {id: assetRes.assetId}}))!;

    return { tenant, adminUser, unauthorizedUser, category, auctioneer, judicialSeller, state, court, district, branch, judicialProcess, asset };
}

export async function cleanup(testRunId: string, prefix: string) {
    const tenant = await prisma.tenant.findFirst({ where: { name: { contains: `${prefix} Tenant ${testRunId}` } } });
    if (!tenant) return;

    try {
        const userEmails = [ `admin-${prefix}-${testRunId}@test.com`, `unauthorized-${prefix}-${testRunId}@test.com` ];
        const users = await prisma.user.findMany({ where: { email: { in: userEmails } }});
        if (users.length > 0) {
             const userIds = users.map(u => u.id);
             await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
             await prisma.usersOnTenants.deleteMany({ where: { userId: { in: userIds } } });
             await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
        await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.judicialProcess.deleteMany({ where: { processNumber: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialBranch.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialDistrict.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.court.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.state.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.tenant.delete({ where: { id: tenant.id } });

    } catch (error) {
        console.error(`[E2E Cleanup - ${prefix}] Error during cleanup:`, error);
    }
}

// Playwright utility functions for slow loading app

export async function waitForPageFullyLoaded(page: Page, timeout: number = 300000): Promise<void> {
    // Wait for network to be idle (no requests for 2 seconds)
    await page.waitForLoadState('networkidle', { timeout });

    // Wait for main content to be visible
    await page.waitForSelector('[data-ai-id="main-content"], main, #main, .main-content', {
        timeout: 60000,
        state: 'visible'
    });

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.loading-spinner, .spinner, [data-loading="true"], .animate-spin', {
        timeout: 30000,
        state: 'detached'
    });

    // Additional wait for dynamic content
    await page.waitForTimeout(3000);
}

export async function performLogin(page: Page, email: string, password: string, timeout: number = 300000): Promise<void> {
    // Navigate to login with extended timeout
    await page.goto('/auth/login', { timeout });

    // Wait for login form to be ready
    await page.waitForSelector('[data-ai-id="auth-login-form"], [data-ai-id="login-form"]', {
        timeout: 60000,
        state: 'visible'
    });

    // Fill credentials
    await page.fill('[data-ai-id="auth-login-email-input"], input[type="email"]', email);
    await page.fill('[data-ai-id="auth-login-password-input"], input[type="password"]', password);

    // Click login and wait for navigation
    await page.click('[data-ai-id="auth-login-submit-button"], button[type="submit"]');

    // Wait for successful login (dashboard or redirect)
    await page.waitForURL(/\/dashboard|\/admin/, { timeout });
    await waitForPageFullyLoaded(page, timeout);
}

export async function navigateToPage(page: Page, url: string, timeout: number = 300000): Promise<void> {
    await page.goto(url, { timeout });
    await waitForPageFullyLoaded(page, timeout);
}

export async function verifyElementsVisible(page: Page, selectors: string[], timeout: number = 60000): Promise<void> {
    for (const selector of selectors) {
        await page.waitForSelector(selector, { timeout, state: 'visible' });
    }
}

export async function clickElement(page: Page, selector: string, timeout: number = 90000): Promise<void> {
    await page.click(selector, { timeout });

    // Wait for any loading animations
    await page.waitForTimeout(3000);

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 30000 });
}

export async function waitForToast(page: Page, message: string | RegExp, timeout: number = 30000): Promise<void> {
    await page.waitForSelector(`.toast, [role="alert"], [data-ai-id*="toast"]`, {
        timeout,
        state: 'visible'
    });

    if (typeof message === 'string') {
        await page.waitForSelector(`text=${message}`, { timeout });
    } else {
        await page.waitForSelector(`text=${message.source}`, { timeout });
    }
}

export async function fillFormField(page: Page, label: string, value: string, timeout: number = 30000): Promise<void> {
    const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea, [data-ai-id*="${label.toLowerCase()}"]`);
    await field.fill(value, { timeout });
}

export async function selectFromDropdown(page: Page, triggerSelector: string, optionText: string | RegExp, timeout: number = 30000): Promise<void> {
    await page.click(triggerSelector, { timeout });
    await page.waitForSelector('[role="option"], [data-ai-id*="option"]', { timeout: 10000, state: 'visible' });

    if (typeof optionText === 'string') {
        await page.click(`text=${optionText}`, { timeout });
    } else {
        await page.click(`text=${optionText.source}`, { timeout });
    }
}

// Setup and Subscription utility functions

export async function completeSetupFlow(page: Page): Promise<void> {
  console.log('🔄 Completing setup flow...');

  // Should be on setup page
  await expect(page.locator('[data-ai-id="setup-main-card"]')).toBeVisible({ timeout: 60000 });

  // Step 1: Welcome - click next
  await page.click('[data-ai-id="setup-welcome-next-button"]');

  // Step 2: Seeding - populate and verify
  await page.click('[data-ai-id="setup-seeding-populate-button"]');
  // Wait for population to complete
  await expect(page.locator('[data-ai-id="setup-seeding-populate-button"]')).toHaveText(/Popular com Dados de Demonstração/, { timeout: 180000 });
  await page.click('[data-ai-id="setup-seeding-verify-button"]');

  // Step 3: Admin User - fill and submit
  await page.fill('[data-ai-id="setup-admin-fullname-input"]', 'Test Admin');
  await page.fill('[data-ai-id="setup-admin-email-input"]', 'test@admin.com');
  await page.fill('[data-ai-id="setup-admin-password-input"]', 'Test@123');
  await page.click('[data-ai-id="setup-admin-create-button"]');

  // Step 4: Finish - complete setup
  await expect(page.locator('[data-ai-id="setup-finish-button"]')).toBeVisible({ timeout: 60000 });
  await page.click('[data-ai-id="setup-finish-button"]');

  // Should redirect to admin area
  await expect(page).toHaveURL(/\/admin/, { timeout: 180000 });
  console.log('✅ Setup flow completed successfully');
}

export async function handleSubscriptionModal(page: Page, action: 'close' | 'subscribe' = 'close'): Promise<void> {
  console.log('🔄 Handling subscription modal...');

  const subscriptionModal = page.locator('[data-ai-id="subscription-modal"]');

  if (await subscriptionModal.isVisible({ timeout: 10000 })) {
    console.log('📧 Subscription modal appeared');

    if (action === 'close') {
      await page.click('[data-ai-id="subscription-close-button"]');
      await expect(subscriptionModal).not.toBeVisible({ timeout: 5000 });
      console.log('❌ Subscription modal closed');
    } else {
      // Subscribe with test data
      await page.fill('[data-ai-id="subscription-name-input"]', 'Test User');
      await page.fill('[data-ai-id="subscription-email-input"]', 'test@example.com');
      await page.click('[data-ai-id="subscription-submit-button"]');
      await expect(subscriptionModal).not.toBeVisible({ timeout: 15000 });
      console.log('✅ Subscribed successfully');
    }
  } else {
    console.log('📭 No subscription modal appeared');
  }
}

export async function ensureSetupComplete(page: Page, forceSetup: boolean = false): Promise<void> {
  console.log('🔄 Ensuring setup is complete...');

  // Set localStorage based on forceSetup parameter
  await page.addInitScript((force) => {
    if (force) {
      window.localStorage.setItem('bidexpert_setup_complete', 'false');
      window.localStorage.removeItem('bidexpert-subscription-popup-seen');
    } else {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    }
  }, forceSetup);

  await page.goto('/', { timeout: 300000 });

  if (forceSetup) {
    console.log('🔨 Forcing setup completion...');
    await completeSetupFlow(page);
  } else {
    // Should not redirect to setup
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 30000 });
    console.log('✅ Setup already complete');
  }
}

export async function dismissSubscriptionModal(page: Page): Promise<void> {
  console.log('🔄 Dismissing subscription modal if present...');
  await handleSubscriptionModal(page, 'close');
}
