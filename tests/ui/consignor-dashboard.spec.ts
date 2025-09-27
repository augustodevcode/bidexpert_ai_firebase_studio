// tests/ui/consignor-dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '../../src/app/admin/users/actions';
import { createSeller } from '../../src/app/admin/sellers/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, Tenant } from '../../src/types';

const testRunId = `consignor-dash-${uuidv4().substring(0, 8)}`;
let consignorUser: UserProfileWithPermissions;
let testSeller: SellerProfileInfo;
let testTenant: Tenant;

test.describe('Módulo 4: Painel do Comitente - Navegação e Visualização', () => {

  test.beforeAll(async () => {
    console.log(`[Consignor Dashboard Test] Setting up for run: ${testRunId}`);
    
    testTenant = await prisma.tenant.create({ data: { name: `Consignor Test Tenant ${testRunId}`, subdomain: `consignor-test-${testRunId}` } });

    const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
    const consignorRole = await prisma.role.upsert({
      where: { nameNormalized: 'CONSIGNOR' },
      update: {},
      create: { name: 'Consignor', nameNormalized: 'CONSIGNOR', permissions: ['consignor_dashboard:view'] }
    });
    
    expect(userRole).toBeDefined();
    expect(consignorRole).toBeDefined();

    // Criar um usuário
    const userRes = await createUser({
      fullName: `Consignor User ${testRunId}`,
      email: `consignor-${testRunId}@test.com`,
      password: 'password123',
      roleIds: [userRole!.id, consignorRole.id],
      habilitationStatus: 'HABILITADO',
      tenantId: testTenant.id,
    });
    expect(userRes.success).toBe(true);

    // Criar o perfil de comitente (seller) e associá-lo ao usuário
    const sellerRes = await createSeller({
      name: `Comitente Company ${testRunId}`,
      isJudicial: false,
      userId: userRes.userId,
      tenantId: testTenant.id,
    } as any);
    expect(sellerRes.success).toBe(true);

    // Buscar os perfis completos para usar no teste
    consignorUser = (await prisma.user.findUnique({ where: { id: userRes.userId! }, include: { roles: { include: { role: true }}, tenants: { include: { tenant: true }}} })) as any;
    testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId! } }))!;
    
    // Vincular sellerId ao perfil de usuário para que o `useAuth` possa encontrá-lo
    await prisma.user.update({
        where: { id: consignorUser.id },
        data: { sellerId: testSeller.id }
    });

    console.log(`[Consignor Dashboard Test] Setup complete for user: ${consignorUser.email}`);
  });

  test.afterAll(async () => {
    console.log(`[Consignor Dashboard Test] Cleaning up for run: ${testRunId}`);
    try {
      if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
      if (consignorUser) {
        await prisma.usersOnRoles.deleteMany({ where: { userId: consignorUser.id }});
        await prisma.usersOnTenants.deleteMany({ where: { userId: consignorUser.id }});
        await prisma.user.delete({ where: { id: consignorUser.id } });
      }
      if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
    } catch (error) {
      console.error('[Consignor Dashboard Test] Cleanup failed:', error);
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log(`[Consignor Dashboard Test] Logging in as ${consignorUser.email}...`);
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill(consignorUser.email);
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Consignor Dashboard Test] Login successful.');
  });

  test('should navigate to the consignor dashboard and view the overview', async ({ page }) => {
    await page.getByRole('button', { name: /avatar/i }).click(); // Clica no avatar/menu do usuário
    await page.getByRole('menuitem', { name: 'Painel do Comitente' }).click();
    await page.waitForURL('/consignor-dashboard/overview');

    await expect(page.getByRole('heading', { name: /Painel do Comitente/i })).toBeVisible();
    await expect(page.getByText(/Total de Lotes Consignados/i)).toBeVisible();
    await expect(page.getByText(/Faturamento Bruto/i)).toBeVisible();
    console.log('[Consignor Dashboard Test] PASSED: Overview page loaded correctly.');
  });

  test('should navigate to "Meus Leilões" from the consignor dashboard', async ({ page }) => {
    await page.goto('/consignor-dashboard/overview');
    await page.getByRole('link', { name: 'Meus Leilões' }).click();
    await page.waitForURL('/consignor-dashboard/auctions');

    await expect(page.getByRole('heading', { name: 'Meus Leilões' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible(); // A tabela deve estar presente
    console.log('[Consignor Dashboard Test] PASSED: Navigated to "Meus Leilões" page.');
  });

  test('should navigate to "Meus Lotes" from the consignor dashboard', async ({ page }) => {
    await page.goto('/consignor-dashboard/overview');
    await page.getByRole('link', { name: 'Meus Lotes' }).click();
    await page.waitForURL('/consignor-dashboard/lots');

    await expect(page.getByRole('heading', { name: 'Meus Lotes' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    console.log('[Consignor Dashboard Test] PASSED: Navigated to "Meus Lotes" page.');
  });
});
