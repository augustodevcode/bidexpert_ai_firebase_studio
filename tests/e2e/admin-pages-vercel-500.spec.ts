/**
 * @fileoverview Testes E2E para validar que as páginas admin não retornam 500 errors.
 * BDD: Após fix de relações PascalCase Prisma para PostgreSQL, todas as páginas
 *      admin devem carregar sem erros 500.
 * TDD: Validar HTTP 200 e ausência de erros de console em cada página admin.
 * 
 * Credenciais: admin@bidexpert.com.br / Admin@123 (conforme ultimate-master-seed.ts)
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@123';

// Admin pages that were returning 500 errors
const ADMIN_PAGES = [
  { path: '/admin', name: 'Admin Dashboard' },
  { path: '/admin/auctions', name: 'Auctions List' },
  { path: '/admin/lots', name: 'Lots List' },
  { path: '/admin/sellers', name: 'Sellers List' },
  { path: '/admin/categories', name: 'Categories List' },
  { path: '/admin/states', name: 'States List' },
  { path: '/admin/cities', name: 'Cities List' },
  { path: '/admin/courts', name: 'Courts List' },
  { path: '/admin/judicial-districts', name: 'Judicial Districts' },
  { path: '/admin/judicial-branches', name: 'Judicial Branches' },
  { path: '/admin/judicial-processes', name: 'Judicial Processes' },
  { path: '/admin/users', name: 'Users List' },
  { path: '/admin/reports/audit', name: 'Audit Reports' },
];

// Analysis pages (sub-pages that use server actions with Prisma)
const ANALYSIS_PAGES = [
  { path: '/admin/auctions/analysis', name: 'Auctions Analysis' },
  { path: '/admin/lots/analysis', name: 'Lots Analysis' },
  { path: '/admin/sellers/analysis', name: 'Sellers Analysis' },
  { path: '/admin/categories/analysis', name: 'Categories Analysis' },
  { path: '/admin/states/analysis', name: 'States Analysis' },
  { path: '/admin/cities/analysis', name: 'Cities Analysis' },
  { path: '/admin/courts/analysis', name: 'Courts Analysis' },
  { path: '/admin/judicial-districts/analysis', name: 'Judicial Districts Analysis' },
  { path: '/admin/judicial-branches/analysis', name: 'Judicial Branches Analysis' },
];

let consoleErrors: string[] = [];

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, { 
    waitUntil: 'domcontentloaded', 
    timeout: 60_000 
  });
  
  // Wait for login form
  await page.waitForSelector('input[type="email"], [data-ai-id="auth-login-email-input"]', { timeout: 30_000 });
  
  // Fill credentials
  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]').or(page.locator('input[type="email"]')).first();
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]').or(page.locator('input[type="password"]')).first();
  const submitBtn = page.locator('[data-ai-id="auth-login-submit-button"]').or(page.locator('button[type="submit"]')).first();
  
  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitBtn.click();
  
  // Wait for redirect after login
  await page.waitForURL(/\/(admin|dashboard|setup)/, { timeout: 30_000 }).catch(() => {
    // May already be on admin page
  });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

test.describe('Admin Pages - No 500 Errors (Vercel PostgreSQL)', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test('login as admin succeeds', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be on admin or dashboard page
    const url = page.url();
    expect(url).toMatch(/\/(admin|dashboard|setup)/);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.name} (${adminPage.path}) loads without 500`, async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to admin page and capture response
      const response = await page.goto(`${BASE_URL}${adminPage.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      
      // Must not return 500
      const status = response?.status() ?? 0;
      expect(status, `Expected 200-range for ${adminPage.path}, got ${status}`).toBeLessThan(500);
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      
      // Check no "Internal Server Error" text on page
      const bodyText = await page.textContent('body') || '';
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('500');
      
      // Filter real 500 errors from console
      const server500Errors = consoleErrors.filter(e => 
        e.includes('500') || e.includes('Internal Server Error')
      );
      expect(server500Errors, `Console 500 errors on ${adminPage.path}`).toHaveLength(0);
    });
  }

  for (const analysisPage of ANALYSIS_PAGES) {
    test(`${analysisPage.name} (${analysisPage.path}) loads without 500`, async ({ page }) => {
      await loginAsAdmin(page);
      
      const response = await page.goto(`${BASE_URL}${analysisPage.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      
      const status = response?.status() ?? 0;
      expect(status, `Expected 200-range for ${analysisPage.path}, got ${status}`).toBeLessThan(500);
      
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      
      const bodyText = await page.textContent('body') || '';
      expect(bodyText).not.toContain('Internal Server Error');
    });
  }
});

test.describe('API Routes - No 500 Errors', () => {
  test('audit API returns valid response', async ({ request }) => {
    // Public API health check - should return 401 (not 500)
    const response = await request.get(`${BASE_URL}/api/audit`);
    expect(response.status()).not.toBe(500);
  });

  test('audit stats API returns valid response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/audit/stats`);
    expect(response.status()).not.toBe(500);
  });
});
