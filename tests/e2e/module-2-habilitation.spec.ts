
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9005';
const TIMEOUT = 30000;

const adminUser = {
  email: 'test.leiloeiro@bidexpert.com',
  password: 'Test@12345',
};

const newUser = {
  email: `newuser-${Date.now()}@example.com`,
  password: 'Password123!',
  name: 'New User Test',
  cpf: '12345678901', // Mock CPF
  phone: '11999999999'
};

async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await page.fill('[data-ai-id="auth-login-email-input"]', email);
  await page.fill('[data-ai-id="auth-login-password-input"]', password);
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForURL(`${BASE_URL}/**`, { timeout: TIMEOUT });
}

test.describe('Module 2: User Habilitation Flow', () => {

  test('Full Habilitation Flow: Login -> Upload Docs -> Admin Approve', async ({ page }) => {
    // 1. Login with pre-created user
    await loginUser(page, 'agent_v3@example.com', 'Password123!');
    
    // 2. Go to Documents page
    await page.goto(`${BASE_URL}/dashboard/documents`, { waitUntil: 'networkidle' });

    // Check initial status (optional, might be PENDING_DOCUMENTS)
    // await expect(page.locator('text=Documentos Pendentes')).toBeVisible();

    // 3. Upload Document
    // We need a dummy file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles({
            name: 'doc.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('dummy content')
        });
        
        // Wait for upload to finish (usually auto or click upload)
        // In DocumentUploadCard, after selecting file, a "Confirmar Envio" button appears
        const confirmBtn = page.locator('button:has-text("Confirmar Envio")');
        await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
        await confirmBtn.click();
        
        // Verify status change to "Em Análise" or "Enviado"
        // The UI shows "Enviado" (SUBMITTED) or "Em análise" (PENDING_ANALYSIS)
        // Based on DocumentUploadCard: {(status === 'PENDING_ANALYSIS' || status === 'SUBMITTED') && ...}
        // And page.tsx: status: userDoc?.status || 'NOT_SENT'
        // Let's wait for either "Enviado" or "Em análise"
        await expect(page.locator('text=Enviado').first().or(page.locator('text=Em análise').first())).toBeVisible({ timeout: 10000 });
    } else {
        console.log('No file input found, skipping upload step or adjusting test');
    }

    // Logout
    await page.goto(`${BASE_URL}/api/auth/signout`);

    // 4. Admin Approval
    await loginUser(page, adminUser.email, adminUser.password);
    await page.goto(`${BASE_URL}/admin/habilitations`, { waitUntil: 'networkidle' });

    // Find the user request
    const userRow = page.locator(`tr:has-text("Agent V3")`);
    // If list is long, might need search
    const searchInput = page.locator('input[placeholder="Buscar..."], input[type="search"]');
    if (await searchInput.isVisible()) {
        await searchInput.fill('agent_v3@example.com');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Wait for search
    }

    await expect(userRow).toBeVisible();
    
    // Click approve/details
    // Assuming there is an action button or we click the row
    if (await userRow.locator('button:has-text("Aprovar")').isVisible()) {
        await userRow.locator('button:has-text("Aprovar")').click();
    } else {
        await userRow.click();
        const approveBtn = page.locator('button:has-text("Aprovar"), button:has-text("Habilitar")');
        await approveBtn.click();
    }
    
    // Confirm if modal
    const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Sim")');
    if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
    }

    // Verify status in admin
    await expect(page.locator('text=Habilitado')).toBeVisible();

    // Logout
    await page.goto(`${BASE_URL}/api/auth/signout`);

    // 5. User check
    await loginUser(page, 'agent_v3@example.com', 'Password123!');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    // Verify user sees "Habilitado" status
    await expect(page.locator('text=Habilitado')).toBeVisible();
  });

});
