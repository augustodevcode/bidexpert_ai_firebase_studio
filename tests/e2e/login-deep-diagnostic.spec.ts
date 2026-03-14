/**
 * Deep diagnostic test for login flow — tracks form state, network, and server action calls.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9006';

test.use({ viewport: { width: 1280, height: 720 } });

test('deep login diagnostic', async ({ page }) => {
  test.setTimeout(120_000);

  const allLogs: string[] = [];
  const allErrors: string[] = [];
  const allNetworkRequests: { method: string; url: string; status?: number; contentType?: string; body?: string }[] = [];

  // Capture ALL console messages
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    allLogs.push(text);
    if (msg.type() === 'error') allErrors.push(msg.text());
  });

  // Capture ALL network requests and responses
  page.on('request', (req) => {
    if (req.url().includes('login') || req.url().includes('_next/data') || req.url().includes('_rsc')) {
      allNetworkRequests.push({
        method: req.method(),
        url: req.url().substring(0, 120),
        contentType: req.headers()['content-type'] || '',
        body: req.postData()?.substring(0, 200) || '',
      });
    }
  });

  page.on('response', async (resp) => {
    if (resp.url().includes('login') || resp.url().includes('_rsc')) {
      const entry = allNetworkRequests.find(r => r.url === resp.url().substring(0, 120) && !r.status);
      if (entry) {
        entry.status = resp.status();
      } else {
        allNetworkRequests.push({
          method: resp.request().method(),
          url: resp.url().substring(0, 120),
          status: resp.status(),
          contentType: resp.headers()['content-type'] || '',
        });
      }
    }
  });

  // =====================================================
  // STEP 1: Navigate to login page
  // =====================================================
  console.log('=== STEP 1: Navigate to login ===');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 90_000 });
  console.log('Page loaded. URL:', page.url());

  // Wait for tenant selector to be populated
  await page.waitForTimeout(3000);

  // =====================================================
  // STEP 2: Check form state BEFORE filling
  // =====================================================
  console.log('=== STEP 2: Check form pre-fill ===');
  const preFillState = await page.evaluate(() => {
    const emailEl = document.querySelector('[data-ai-id="auth-login-email-input"]') as HTMLInputElement;
    const passEl = document.querySelector('[data-ai-id="auth-login-password-input"]') as HTMLInputElement;
    const submitBtn = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement;
    const tenantSelect = document.querySelector('[data-ai-id="auth-login-tenant-select"]') as HTMLButtonElement;
    return {
      emailExists: !!emailEl,
      passwordExists: !!passEl,
      submitExists: !!submitBtn,
      submitDisabled: submitBtn?.disabled,
      tenantSelectExists: !!tenantSelect,
      tenantSelectDisabled: tenantSelect?.disabled,
      tenantSelectAriaDisabled: tenantSelect?.getAttribute('aria-disabled'),
      tenantSelectText: tenantSelect?.textContent?.trim().substring(0, 50),
    };
  });
  console.log('Pre-fill state:', JSON.stringify(preFillState));

  // =====================================================
  // STEP 3: Fill form using data-ai-id selectors
  // =====================================================
  console.log('=== STEP 3: Fill form ===');

  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');

  // Use click + keyboard.type for more reliable react-hook-form interaction
  await emailInput.click();
  await emailInput.clear();
  await page.keyboard.type('admin@bidexpert.com.br', { delay: 20 });
  await page.keyboard.press('Tab');

  await passwordInput.click();
  await passwordInput.clear();
  await page.keyboard.type('Admin@123', { delay: 20 });
  await page.keyboard.press('Tab');

  // =====================================================
  // STEP 4: Check form state AFTER filling
  // =====================================================
  console.log('=== STEP 4: Check form post-fill ===');
  const postFillState = await page.evaluate(() => {
    const emailEl = document.querySelector('[data-ai-id="auth-login-email-input"]') as HTMLInputElement;
    const passEl = document.querySelector('[data-ai-id="auth-login-password-input"]') as HTMLInputElement;
    return {
      emailValue: emailEl?.value,
      passwordValue: passEl?.value ? '***' : '(empty)',
      passwordLength: passEl?.value?.length,
    };
  });
  console.log('Post-fill state:', JSON.stringify(postFillState));

  // =====================================================
  // STEP 5: Click submit and monitor everything
  // =====================================================
  console.log('=== STEP 5: Submit form ===');

  // Clear network log to only capture submit-related traffic
  const preSubmitNetworkCount = allNetworkRequests.length;

  const submitBtn = page.locator('[data-ai-id="auth-login-submit-button"]');
  const isDisabled = await submitBtn.isDisabled();
  console.log('Submit button disabled:', isDisabled);

  // Click submit
  await submitBtn.click();
  console.log('Submit button clicked');

  // Wait for network activity
  await page.waitForTimeout(5000);

  // =====================================================
  // STEP 6: Analyze results
  // =====================================================
  console.log('=== STEP 6: Analyze results ===');
  
  const postSubmitRequests = allNetworkRequests.slice(preSubmitNetworkCount);
  console.log(`Network requests after submit: ${postSubmitRequests.length}`);
  postSubmitRequests.forEach((r, i) => {
    console.log(`  [${i}] ${r.method} ${r.url} -> ${r.status || 'pending'} (${r.contentType})`);
    if (r.body) console.log(`       Body: ${r.body.substring(0, 100)}`);
  });

  // Check URL
  const currentUrl = page.url();
  console.log('Current URL after submit:', currentUrl);

  // Check for loading state (button might show spinner)
  const isLoadingAfter = await submitBtn.isDisabled();
  console.log('Submit button disabled after click:', isLoadingAfter);

  // Check for error messages
  const errorElements = await page.locator('.text-auth-error-center, [role="alert"], .text-destructive').all();
  for (const el of errorElements) {
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      const text = await el.textContent();
      console.log('Error element visible:', text);
    }
  }

  // Check console errors
  console.log(`Console errors: ${allErrors.length}`);
  allErrors.forEach((e, i) => console.log(`  [${i}] ${e.substring(0, 200)}`));

  // Check relevant console logs (warnings, infos)
  const relevantLogs = allLogs.filter(l => 
    l.includes('Login') || l.includes('login') || 
    l.includes('error') || l.includes('Error') ||
    l.includes('action') || l.includes('redirect') ||
    l.includes('tenant') || l.includes('session') ||
    l.includes('fetch')
  );
  console.log(`Relevant console logs: ${relevantLogs.length}`);
  relevantLogs.forEach((l, i) => console.log(`  [${i}] ${l.substring(0, 200)}`));

  // Wait a bit more for redirect
  await page.waitForURL('**/dashboard/**', { timeout: 10_000 }).catch(() => {});
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Check for toast notification (success or error)
  const toasts = await page.locator('[data-radix-toast-viewport] > *, [data-sonner-toast], [role="status"]').all();
  for (const t of toasts) {
    const visible = await t.isVisible().catch(() => false);
    if (visible) {
      const text = await t.textContent();
      console.log('Toast:', text);
    }
  }

  // Final check — also try to read what the page shows
  const pageBody = await page.evaluate(() => {
    // Check if there's a form validation error from react-hook-form
    const formMessages = document.querySelectorAll('[id*="form-item-message"]');
    const messages: string[] = [];
    formMessages.forEach(el => {
      if (el.textContent) messages.push(el.textContent);
    });
    return { formValidationMessages: messages };
  });
  console.log('Form validation messages:', JSON.stringify(pageBody));

  // Assert
  expect(finalUrl).toContain('/dashboard');
});
