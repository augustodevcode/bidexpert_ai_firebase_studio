// tests/ui/sidebar-navigation.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, Tenant } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../../services/user.service';
import { RoleRepository } from '../../repositories/role.repository';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';
import { callActionAsUser } from 'tests/test-utils';

const testRunId = `sidebar-nav-${uuidv4().substring(0, 8)}`;
const userService = new UserService();
const roleRepository = new RoleRepository();
const prismaClient = new PrismaClient();

let adminUser: UserProfileWithPermissions;
let consignorUser: UserProfileWithPermissions;
let testTenant: Tenant;

async function createTestUsers() {
    console.log(`[Sidebar Test] Creating users for run: ${testRunId}`);
    
    testTenant = await prismaClient.tenant.create({ data: { name: `Sidebar Test Tenant ${testRunId}`, subdomain: `sidebar-test-${testRunId}` } });

    // Ensure roles exist
    const adminRole = await roleRepository.findByNormalizedName('ADMINISTRATOR');
    const consignorRole = await roleRepository.findByNormalizedName('CONSIGNOR');
    const userRole = await roleRepository.findByNormalizedName('USER');
    expect(adminRole).toBeDefined();
    expect(consignorRole).toBeDefined();
    expect(userRole).toBeDefined();

    // Create Admin User
    const adminRes = await createUser({
        fullName: `Admin Sidebar ${testRunId}`,
        email: `admin-sidebar-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [adminRole!.id],
        habilitationStatus: 'HABILITADO',
        tenantId: testTenant.id,
    });
    expect(adminRes.success).toBe(true);
    const fetchedAdmin = await callActionAsUser(getUserProfileData, null, adminRes.userId!);
    expect(fetchedAdmin).toBeDefined();
    adminUser = fetchedAdmin!;

    // Create Consignor User
    const consignorRes = await createUser({
        fullName: `Consignor Sidebar ${testRunId}`,
        email: `consignor-sidebar-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [consignorRole!.id, userRole!.id],
        habilitationStatus: 'HABILITADO',
        tenantId: testTenant.id,
    });
     expect(consignorRes.success).toBe(true);
     const fetchedConsignor = await callActionAsUser(getUserProfileData, null, consignorRes.userId!);
     expect(fetchedConsignor).toBeDefined();
     consignorUser = fetchedConsignor!;
}

async function cleanupTestData() {
    console.log(`[Sidebar Test] Cleaning up for run: ${testRunId}`);
    const userEmails = [
        `admin-sidebar-${testRunId}@test.com`,
        `consignor-sidebar-${testRunId}@test.com`
    ];
    const users = await prismaClient.user.findMany({ where: { email: { in: userEmails } } });
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
        await prismaClient.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
        await prismaClient.usersOnTenants.deleteMany({ where: { userId: { in: userIds } } });
        await prismaClient.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (testTenant) {
        await prismaClient.tenant.delete({ where: { id: testTenant.id } });
    }
}

test.describe('Sidebar Navigation UI Validation', () => {
    test.beforeAll(async () => {
        await createTestUsers();
    });

    test.afterAll(async () => {
        await cleanupTestData();
        await prismaClient.$disconnect();
    });

    test('should display admin links for an administrator', async ({ page }) => {
        console.log('--- Test Case: Admin Sidebar UI ---');
        console.log('CRITERIA: Admin user should see all admin navigation links.');
        
        await page.goto('/auth/login');
        await page.locator('[data-ai-id="auth-login-email-input"]').fill(adminUser.email);
        await page.locator('[data-ai-id="auth-login-password-input"]').fill('password123');
        await page.locator('[data-ai-id="auth-login-submit-button"]').click();
        await page.waitForURL('/dashboard/overview');

        // Navigate to admin dashboard
        await page.goto('/admin/dashboard');
        
        const sidebar = page.locator('aside:has-text("BidExpert Admin")'); // Assumes this text is unique to admin sidebar
        
        // Check for key admin sections by their AccordionTrigger
        await expect(sidebar.getByRole('button', { name: /Gestão de Leilões/i })).toBeVisible();
        await expect(sidebar.getByRole('button', { name: /Lotes/i })).toBeVisible();
        await expect(sidebar.getByRole('button', { name: /Usuários/i })).toBeVisible();
        await expect(sidebar.getByRole('button', { name: /Gestão da Plataforma/i })).toBeVisible();
        
        // Open a group and check a specific link
        await sidebar.getByRole('button', { name: /Gestão da Plataforma/i }).click();
        await expect(sidebar.getByRole('link', { name: /Configurações/i })).toBeVisible();
        console.log('- PASSED: Admin sees all top-level admin sections and can access sub-links.');
    });

    test('should display consignor links for a consignor', async ({ page }) => {
        console.log('--- Test Case: Consignor Sidebar UI ---');
        console.log('CRITERIA: Consignor user should see the consignor dashboard links.');

        await page.goto('/auth/login');
        await page.locator('[data-ai-id="auth-login-email-input"]').fill(consignorUser.email);
        await page.locator('[data-ai-id="auth-login-password-input"]').fill('password123');
        await page.locator('[data-ai-id="auth-login-submit-button"]').click();
        await page.waitForURL('/dashboard/overview');

        // Navigate to consignor dashboard
        await page.goto('/consignor-dashboard/overview');
        
        const sidebar = page.locator('[data-ai-id="consignor-sidebar"]');
        await expect(sidebar).toBeVisible({ timeout: 10000 });

        // Check for consignor-specific links
        await expect(sidebar.getByRole('link', { name: /Meus Leilões/i })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: /Meus Lotes/i })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: /Venda Direta/i })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: /Financeiro/i })).toBeVisible();
        
        // Check that an admin-only link is NOT visible in the main content area (as a proxy for sidebar)
        await expect(page.getByRole('link', { name: /Painel Admin/i })).not.toBeVisible();
        console.log('- PASSED: Consignor sees their specific links and not admin links.');
    });
});
