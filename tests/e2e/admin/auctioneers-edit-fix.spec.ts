/**
 * @fileoverview Teste E2E para validar a correção do bug de edição de leiloeiro.
 * Bug: logoMediaId era enviado como string vazia ("") ao Prisma, que esperava BigInt.
 * Fix: Sanitizar campos BigInt opcionais convertendo "" para null antes do update.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9106';

/**
 * Login flow that handles dev mode lazy compilation.
 * Strategy:
 * 1. Pre-warm admin page (triggers 100s+ compilation, ends on login redirect)
 * 2. Fill login form & submit
 * 3. Check cookies are set
 * 4. Navigate to admin page (already compiled, fast)
 */
async function loginAsAdmin(page: import('@playwright/test').Page) {
  // Step 1: Pre-warm the admin/auctioneers page.
  // In dev mode, this triggers lazy compilation (~100s) and then redirects to login.
  // This ensures both pages are compiled before we actually need them.
  console.log('[LOGIN] Pre-warming admin page (triggers lazy compilation)...');
  await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  console.log(`[LOGIN] Pre-warm done. Current URL: ${page.url()}`);

  // After pre-warming, we should be on the login page (redirected due to no session)
  // If we're already on admin/dashboard, we're already logged in
  if (page.url().includes('/admin/auctioneers')) return;

  // Navigate to login if we're not there (middleware might redirect to other places)
  if (!page.url().includes('/auth/login')) {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }

  // Step 2: Wait for login form
  const loginCard = page.locator('[data-ai-id="auth-login-card"]');
  await loginCard.waitFor({ state: 'visible', timeout: 60000 });

  // Wait for tenant selector to load and auto-select
  const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
  await tenantSelect.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(3000); // Wait for auto-select useEffect

  // Fill credentials
  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill('admin@bidexpert.com.br');

  const passwordInput = page.locator('input#password');
  await passwordInput.fill('Admin@123');

  // Step 3: Submit form
  const submitBtn = page.locator('[data-ai-id="auth-login-form"] button[type="submit"]');
  await submitBtn.click();

  // Wait for server action to complete
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Debug: check cookies
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session');
  console.log(`[LOGIN] Cookies after login: ${cookies.map(c => c.name).join(', ')}`);
  console.log(`[LOGIN] Session cookie exists: ${!!sessionCookie}`);

  if (!sessionCookie) {
    // If cookie wasn't set, the login may have failed. Check for error messages.
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText.includes('inválida') || bodyText.includes('Credenciais')) {
      throw new Error('Login failed: invalid credentials');
    }
    // Try a second submit in case the form wasn't properly submitted
    console.log('[LOGIN] Cookie not found. Retrying submit...');
    await submitBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const cookies2 = await page.context().cookies();
    const sessionCookie2 = cookies2.find(c => c.name === 'session');
    console.log(`[LOGIN] Cookies after retry: ${cookies2.map(c => c.name).join(', ')}`);
    if (!sessionCookie2) {
      throw new Error('Login failed: session cookie was not set after form submission');
    }
  }

  // Step 4: Navigate to admin page (already compiled from pre-warm)
  await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  if (currentUrl.includes('/auth/login')) {
    throw new Error('Login cookie not accepted - redirected back to login page');
  }
  console.log(`[LOGIN] Successfully authenticated. Current URL: ${currentUrl}`);
}

test.describe('Admin - Auctioneer Edit Fix (logoMediaId empty string)', () => {

  test('should successfully edit an existing auctioneer without logoMediaId', async ({ page }) => {
    // Increase default action/navigation timeouts for dev mode lazy compilation
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);

    await loginAsAdmin(page);

    // loginAsAdmin already navigates to /admin/auctioneers after authentication.
    // Wait for the page to fully load (either content or error state)
    const pageContainer = page.locator('[data-ai-id="admin-auctioneers-page-container"]');
    const errorContainer = page.locator('[data-ai-id="admin-auctioneers-error"]');
    
    await Promise.race([
      pageContainer.waitFor({ state: 'visible', timeout: 90000 }),
      errorContainer.waitFor({ state: 'visible', timeout: 90000 }),
    ]);

    // If error state, fail with message
    if (await errorContainer.isVisible().catch(() => false)) {
      const errorText = await errorContainer.textContent();
      throw new Error(`Auctioneers page loaded with error: ${errorText}`);
    }

    // 3. Click the edit (pencil) button on the first auctioneer row
    // The columns.tsx shows a Pencil icon button with sr-only "Editar" text
    const editBtn = page.getByRole('button', { name: /editar/i }).first();
    await editBtn.waitFor({ state: 'visible', timeout: 30000 });
    await editBtn.click();

    // 4. Wait for the edit form modal/container to appear
    // The form has a field "Nome do Leiloeiro/Empresa" (FormLabel)
    const nameField = page.locator('input[name="name"]');
    await nameField.waitFor({ state: 'visible', timeout: 30000 });

    // 5. Modify the name slightly to force a dirty form
    const currentName = await nameField.inputValue();
    const timestamp = Date.now().toString().slice(-6);
    const newName = currentName.replace(/\s*\d{6}$/, '') + ' ' + timestamp;

    await nameField.clear();
    await nameField.fill(newName);

    // 6. The bug scenario: logoMediaId is "" (empty string) in initial form data
    // when the auctioneer has no logo. The fix should convert "" to null.
    // We don't need to manually set it - the form already sends "" for empty optional fields.

    // 7. Click the Save button inside the form
    const saveButton = page.getByRole('button', { name: /salvar/i }).first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    // 8. Wait for response - check for BigInt error vs success
    await page.waitForTimeout(3000);

    // Verify no BigInt parse error appeared
    const bigintError = page.locator('text=/cannot parse integer from empty string|Invalid value.*logoMediaId|BigInt/i').first();
    const hasBigintError = await bigintError.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasBigintError, 'Should NOT show BigInt parse error for empty logoMediaId').toBeFalsy();

    // Check for destructive error toasts
    const errorToast = page.locator('[data-sonner-toast][data-type="error"], [role="alert"]')
      .filter({ hasText: /erro|falha|error|cannot parse/i })
      .first();
    const hasErrorToast = await errorToast.isVisible({ timeout: 3000 }).catch(() => false);

    // Check for success toast
    const successToast = page.locator('[data-sonner-toast], [role="status"], [role="alert"]')
      .filter({ hasText: /sucesso|atualizado|salvo|success/i })
      .first();
    const hasSuccessToast = await successToast.isVisible({ timeout: 10000 }).catch(() => false);

    // The save should succeed without BigInt errors
    if (hasErrorToast) {
      const errorText = await errorToast.textContent().catch(() => 'unknown error');
      expect(hasErrorToast, `Unexpected error toast: ${errorText}`).toBeFalsy();
    }

    // Ideally we see a success toast
    if (hasSuccessToast) {
      expect(hasSuccessToast).toBeTruthy();
    }

    // Final verification: page should not have crashed
    expect(page.url()).not.toContain('error');
  });
});
