
import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS, loginAs, loginAsAdmin, type CredentialRole } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';
const TIMEOUT = 30000;

const adminUser = {
  email: CREDENTIALS.admin.email,
  password: CREDENTIALS.admin.password,
};

const newUser = {
  email: `newuser-${Date.now()}@example.com`,
  password: 'Password123!',
  name: 'New User Test',
  cpf: '12345678901', // Mock CPF
  phone: '11999999999'
};

async function loginUser(page: Page, email: string, password: string) {
  // For custom credentials (e.g., newly registered users), use direct fill
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await page.fill('[data-ai-id="auth-login-email-input"]', email);
  await page.fill('[data-ai-id="auth-login-password-input"]', password);
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForURL(`${BASE_URL}/**`, { timeout: TIMEOUT });
}

test.describe('Module 2: User Habilitation Flow', () => {

  test('Full Habilitation Flow: Login -> Upload Docs -> Admin Approve', async ({ page }) => {
    // 1. Register new user
    const userEmail = `user-${Date.now()}@test.com`;
    const userPass = 'Password123!';
    
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle' });
    
    // Check if registration page loaded
    await expect(page.locator('[data-ai-id="auth-register-name-input"]')).toBeVisible();
    
    await page.fill('[data-ai-id="auth-register-name-input"]', 'New User Test');
    await page.fill('[data-ai-id="auth-register-email-input"]', userEmail);
    await page.fill('[data-ai-id="auth-register-password-input"]', userPass);
    // Check if confirm password exists, if so fill it
    if (await page.locator('[data-ai-id="auth-register-confirm-password-input"]').isVisible()) {
        await page.fill('[data-ai-id="auth-register-confirm-password-input"]', userPass);
    }
    
    await page.click('[data-ai-id="auth-register-submit-button"]');
    
    // Wait for redirect to login or dashboard
    // If it goes to login, we need to login. If dashboard, we are good.
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/auth/login')) {
        await loginUser(page, userEmail, userPass);
    } else {
        await page.waitForURL(/dashboard/, { timeout: 30000 });
    }
    
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
    // If list is long, might need search
    const searchInput = page.locator('input[placeholder="Buscar..."], input[type="search"]');
    if (await searchInput.isVisible()) {
        await searchInput.fill(userEmail);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Wait for search
    }

    const userRow = page.locator(`tr`).filter({ hasText: userEmail }).first();
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
    await loginUser(page, userEmail, userPass);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    // Verify user sees "Habilitado" status
    await expect(page.locator('text=Habilitado')).toBeVisible();
  });

});
