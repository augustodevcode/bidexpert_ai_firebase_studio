// tests/ui/habilitation-flow.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
// Server actions will be imported dynamically to avoid client-side import issues
import type { UserProfileWithPermissions, Role, DocumentType, Tenant } from '../../src/types';

const testRunId = `habil-flow-${uuidv4().substring(0, 8)}`;
let testUser: UserProfileWithPermissions;
let testDocType: DocumentType;
let testUserDocId: string;
let testTenant: Tenant;
let prismaClient = new PrismaClient();

test.describe('Módulo 2: Fluxo de Habilitação de Usuário (UI)', () => {

  test.beforeAll(async () => {
    console.log(`[Habilitation UI Test] Setting up for run: ${testRunId}`);
    
    testTenant = await prismaClient.tenant.create({ data: { name: `Habil-UI Tenant ${testRunId}`, subdomain: `habil-ui-${testRunId}` } });

    const userRole = await prismaClient.role.findFirst({ where: { name: 'USER' } });
    if (!userRole) throw new Error("Role 'USER' not found");

    const userRes = await createUser({
      fullName: `User to Habilitate ${testRunId}`,
      email: `habil-user-${testRunId}@test.com`,
      password: 'password123',
      roleIds: [userRole.id],
      habilitationStatus: 'PENDING_DOCUMENTS',
      tenantId: testTenant.id,
    });
    if (!userRes.success || !userRes.userId) throw new Error("Failed to create test user");
    
    const createdUser = await prismaClient.user.findUnique({where: {id: userRes.userId!}});
    testUser = createdUser as any;

    testDocType = await prismaClient.documentType.upsert({
      where: { name: 'RG (Frente e Verso)' },
      update: {},
      create: {
        name: 'RG (Frente e Verso)',
        description: 'Cópia digitalizada do RG',
        isRequired: true,
        appliesTo: 'PHYSICAL',
      },
    });

    // Simulate user has submitted a document, putting them in 'PENDING_ANALYSIS'
    const userDoc = await prismaClient.userDocument.create({
      data: {
        userId: testUser.id,
        documentTypeId: testDocType.id,
        fileUrl: 'https://placehold.co/600x400.png',
        fileName: 'rg-teste.png',
        status: 'PENDING_ANALYSIS',
      },
    });
    testUserDocId = userDoc.id;

    // Update user status
    await prismaClient.user.update({
      where: { id: testUser.id },
      data: { habilitationStatus: 'PENDING_ANALYSIS' }
    });

    console.log(`[Habilitation UI Test] Setup complete for user: ${testUser.email}`);
  });

  test.afterAll(async () => {
    console.log(`[Habilitation UI Test] Cleaning up for run: ${testRunId}`);
    try {
      if (testUserDocId) await prismaClient.userDocument.deleteMany({ where: { id: testUserDocId } });
      if (testUser) {
        await prismaClient.usersOnRoles.deleteMany({ where: { userId: testUser.id }});
        await prismaClient.usersOnTenants.deleteMany({ where: { userId: testUser.id }});
        await prismaClient.user.delete({ where: { id: testUser.id } });
      }
      if (testTenant) await prismaClient.tenant.delete({ where: { id: testTenant.id } });
      // Don't delete shared DocumentType
    } catch (error) {
      console.error('[Habilitation UI Test] Cleanup failed:', error);
    }
    await prismaClient.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // Login as Admin
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
  });

  test('Cenário 2.1: Admin should be able to review and approve a document', async ({ page }) => {
    // 1. Navigate to the Habilitations page
    await page.goto('/admin/habilitations');
    await expect(page.locator('[data-ai-id="admin-habilitations-page-container"]')).toBeVisible({timeout: 15000});

    // 2. Find the test user's request
    const userRow = page.getByRole('row', { name: new RegExp(testUser.fullName!, 'i') });
    await expect(userRow).toBeVisible({ timeout: 10000 });
    
    // Check for 'Em Análise' status before clicking
    await expect(userRow.getByText('Em Análise')).toBeVisible();

    // 3. Navigate to the user's document review page
    await userRow.getByRole('button', { name: 'Revisar Documentos' }).click();
    await page.waitForURL(/\/admin\/habilitations\/.*/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: new RegExp(`Revisão de Documentos: ${testUser.fullName!}`, 'i') })).toBeVisible();
    
    // 4. Find the document and approve it
    const docCard = page.locator(`div:has-text("${testDocType.name}")`).first();
    await expect(docCard).toBeVisible();
    await expect(docCard.getByText('Em Análise')).toBeVisible();
    
    console.log(`[Habilitation UI Test] Approving document "${testDocType.name}"...`);
    await docCard.getByRole('button', { name: 'Aprovar' }).click();
    
    // 5. Verify the UI updates to show "Aprovado"
    await expect(page.getByText('Documento aprovado.')).toBeVisible({timeout: 5000}); // Toast message
    await expect(docCard.getByText('Aprovado')).toBeVisible();
    console.log('[Habilitation UI Test] PASSED: Document status updated to "Aprovado" in UI.');
    
    // 6. Verify the user's overall status is now "Habilitado"
    const statusInfoCard = page.locator('[data-ai-id="my-documents-habilitation-status-card"]');
    await expect(statusInfoCard.getByText('Habilitado')).toBeVisible({ timeout: 5000 });
    console.log('[Habilitation UI Test] PASSED: User overall status updated to "Habilitado".');
  });
});
