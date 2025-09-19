// tests/ui/sidebar-navigation.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../../services/user.service';
import { RoleRepository } from '../../repositories/role.repository';

const testRunId = `sidebar-nav-${uuidv4().substring(0, 8)}`;
const userService = new UserService();
const roleRepository = new RoleRepository();

let adminUser: UserProfileWithPermissions;
let consignorUser: UserProfileWithPermissions;

async function createTestUsers() {
    console.log(`[Sidebar Test] Creating users for run: ${testRunId}`);
    
    // Ensure roles exist
    const adminRole = await roleRepository.findByNormalizedName('ADMINISTRATOR');
    const consignorRole = await roleRepository.findByNormalizedName('CONSIGNOR');
    const userRole = await roleRepository.findByNormalizedName('USER');
    expect(adminRole).toBeDefined();
    expect(consignorRole).toBeDefined();
    expect(userRole).toBeDefined();

    // Create Admin User
    const adminRes = await userService.createUser({
        fullName: `Admin Sidebar ${testRunId}`,
        email: `admin-sidebar-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [adminRole!.id],
        habilitationStatus: 'HABILITADO'
    });
    expect(adminRes.success).toBe(true);
    adminUser = (await userService.getUserById(adminRes.userId!))!;
    expect(adminUser).toBeDefined();

    // Create Consignor User
    const consignorRes = await userService.createUser({
        fullName: `Consignor Sidebar ${testRunId}`,
        email: `consignor-sidebar-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [consignorRole!.id, userRole!.id],
        habilitationStatus: 'HABILITADO'
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
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
}

test.describe('Sidebar Navigation UI Validation', () => {
    test.beforeAll(async () => {
        await cleanupTestData();
        await createTestUsers();
    });

    test.afterAll(async () => {
        await cleanupTestData();
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
