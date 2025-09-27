// tests/ui/sidebar-navigation.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '../../src/app/admin/users/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, Tenant } from '../../src/types';
import { UserService } from '../../src/services/user.service';
import { RoleRepository } from '../../src/repositories/role.repository';


const testRunId = `sidebar-nav-${uuidv4().substring(0, 8)}`;
const userService = new UserService();
const roleRepository = new RoleRepository();
const prisma = new PrismaClient();

let adminUser: UserProfileWithPermissions;
let consignorUser: UserProfileWithPermissions;
let testTenant: Tenant;

async function createTestUsers() {
    console.log(`[Sidebar Test] Creating users for run: ${testRunId}`);
    
    testTenant = await prisma.tenant.create({ data: { name: `Sidebar Test Tenant ${testRunId}`, subdomain: `sidebar-test-${testRunId}` } });

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
    adminUser = (await userService.getUserById(adminRes.userId!))!;
    expect(adminUser).toBeDefined();

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
     consignorUser = (await userService.getUserById(consignorRes.userId!))!;
     expect(consignorUser).toBeDefined();
}

async function cleanupTestData() {
    console.log(`[Sidebar Test] Cleaning up for run: ${testRunId}`);
    const userEmails = [
        `admin-sidebar-${testRunId}@test.com`,
        `consignor-sidebar-${testRunId}@test.com`
    ];
    const users = await prisma.user.findMany({ where: { email: { in: userEmails } } });
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
        await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.usersOnTenants.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (testTenant) {
        await prisma.tenant.delete({ where: { id: testTenant.id } });
    }
}

test.describe('Sidebar Navigation UI Validation', () => {
    test.beforeAll(async () => {
        await cleanupTestData();
        await createTestUsers();
    });

    test.afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    test('should display admin links for an administrator', async ({ page }) => {
        console.log('--- Test Case: Admin Sidebar UI ---');
        console.log('CRITERIA: Admin user should see all admin navigation links.');
        
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill(adminUser.email);
        await page.locator('input[name="password"]').fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/dashboard/overview');

        // Navigate to admin dashboard
        await page.goto('/admin/dashboard');
        
        // Check for key admin sections
        await expect(page.getByRole('button', { name: /Gestão de Leilões/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Lotes/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Usuários/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Gestão da Plataforma/i })).toBeVisible();
        
        // Open a group and check a specific link
        await page.getByRole('button', { name: /Gestão da Plataforma/i }).click();
        await expect(page.getByRole('link', { name: /Configurações/i })).toBeVisible();
        console.log('- PASSED: Admin sees all top-level admin sections and can access sub-links.');
    });

    test('should display consignor links for a consignor', async ({ page }) => {
        console.log('--- Test Case: Consignor Sidebar UI ---');
        console.log('CRITERIA: Consignor user should see the consignor dashboard links.');

        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill(consignorUser.email);
        await page.locator('input[name="password"]').fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForURL('/dashboard/overview');

        // Navigate to consignor dashboard
        await page.goto('/consignor-dashboard/overview');

        // Check for consignor-specific links
        await expect(page.getByRole('link', { name: /Meus Leilões/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Meus Lotes/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Venda Direta/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Financeiro/i })).toBeVisible();
        
        // Check that an admin-only link is NOT visible
        await expect(page.getByRole('link', { name: /Painel Admin/i })).not.toBeVisible();
        console.log('- PASSED: Consignor sees their specific links and not admin links.');
    });
});
