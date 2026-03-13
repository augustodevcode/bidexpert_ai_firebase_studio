/**
 * @fileoverview Diagnostic test to check login page hydration and form submission mechanism.
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://demo.localhost:9006';

test.describe('Login Hydration Diagnostic', () => {
  test.setTimeout(120_000);

  test('check console errors and form hydration', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    const jsErrors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      jsErrors.push(`PAGE ERROR: ${err.message}`);
    });

    // Navigate to login
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 60_000 });
    
    // Wait a bit more for hydration
    await page.waitForTimeout(3_000);

    // Log JS errors
    console.log(`\n=== JS ERRORS (${jsErrors.length}) ===`);
    jsErrors.forEach((e, i) => console.log(`  [${i}] ${e.substring(0, 200)}`));

    // Check if React has hydrated - look for React event handlers
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('[data-ai-id="auth-login-form"]') as HTMLFormElement;
      if (!form) return { exists: false };
      
      return {
        exists: true,
        tagName: form.tagName, 
        method: form.method,
        action: form.action,
        hasOnSubmit: typeof (form as any).onsubmit === 'function',
        // React attaches handlers to the root, not to individual elements
        // Let's check __reactInternalInstance or __reactFiber
        hasReactFiber: Object.keys(form).some(k => k.startsWith('__react')),
        reactKeys: Object.keys(form).filter(k => k.startsWith('__react')).join(', '),
      };
    });
    console.log('\n=== FORM INFO ===');
    console.log(JSON.stringify(formInfo, null, 2));

    // Check the submit button
    const btnInfo = await page.evaluate(() => {
      const btn = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement;
      if (!btn) return { exists: false };
      
      return {
        exists: true,
        tagName: btn.tagName,
        type: btn.type,
        disabled: btn.disabled,
        hasReactFiber: Object.keys(btn).some(k => k.startsWith('__react')),
        innerText: btn.innerText,
        parentForm: btn.closest('form')?.getAttribute('data-ai-id'),
      };
    });
    console.log('\n=== BUTTON INFO ===');
    console.log(JSON.stringify(btnInfo, null, 2));

    // Try submitting via JS and intercepting
    console.log('\n=== ATTEMPTING FORM FILL + SUBMIT VIA JS ===');
    
    // Fill via page interactions
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.waitForTimeout(500);

    // Check if the form would submit via default (GET) or via JS handler
    const submitResult = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const form = document.querySelector('[data-ai-id="auth-login-form"]') as HTMLFormElement;
        if (!form) { resolve('NO FORM'); return; }
        
        // Intercept the submit event
        const originalHandler = form.onsubmit;
        let handlerCalled = false;
        
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          handlerCalled = true;
          resolve(`SUBMIT EVENT FIRED - preventDefault called. onsubmit exists: ${typeof originalHandler}`);
        }, { once: true, capture: true });
        
        // Trigger submit via button click
        const btn = document.querySelector('[data-ai-id="auth-login-submit-button"]') as HTMLButtonElement;
        if (btn) {
          btn.click();
        }
        
        // If no submit event fires within 2s, something is wrong
        setTimeout(() => {
          if (!handlerCalled) {
            resolve('SUBMIT EVENT DID NOT FIRE WITHIN 2s');
          }
        }, 2_000);
      });
    });
    console.log(`Submit result: ${submitResult}`);

    // Check current URL (should still be /auth/login if we prevented default)
    console.log(`URL after intercepted submit: ${page.url()}`);

    // Now let's try the actual login - navigate fresh
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5_000); // Extra wait for hydration

    // Use page.type instead of fill (simulates actual keystrokes)
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await emailInput.click();
    await emailInput.pressSequentially('admin@bidexpert.com.br', { delay: 20 });
    await passwordInput.click();
    await passwordInput.pressSequentially('Admin@123', { delay: 20 });
    
    await page.waitForTimeout(500);

    // Track navigation
    let navigated = false;
    page.on('framenavigated', () => { navigated = true; });

    // Submit with keyboard Enter
    await passwordInput.press('Enter');
    
    // Wait for navigation or timeout
    try {
      await page.waitForURL(url => !url.toString().includes('/auth/login'), { timeout: 60_000 });
      console.log(`✅ Login worked! Navigated to: ${page.url()}`);
    } catch {
      console.log(`❌ Still on login page: ${page.url()}`);
      console.log(`Frame navigated: ${navigated}`);
      
      // Capture error message if any
      const errorEl = page.locator('[data-ai-id="auth-login-error-message"], .text-auth-error-center');
      const errorText = await errorEl.textContent().catch(() => 'no error element');
      console.log(`Error element text: "${errorText}"`);
      
      // Capture page content around error area
      const bodyText = await page.textContent('body');
      if (bodyText?.includes('Erro') || bodyText?.includes('error') || bodyText?.includes('falh')) {
        console.log('Page contains error indicators');
      }
    }

    // Final JS errors
    console.log(`\n=== FINAL JS ERRORS (${jsErrors.length}) ===`);
    jsErrors.slice(-10).forEach((e, i) => console.log(`  [${i}] ${e.substring(0, 300)}`));
  });
});
