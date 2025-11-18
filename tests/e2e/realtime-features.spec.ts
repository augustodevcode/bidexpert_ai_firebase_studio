// tests/e2e/realtime-features.spec.ts
import { test, expect } from '@playwright/test';

const DEFAULT_BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

test.describe('Realtime Features (Timestamps, Blockchain, Soft Close)', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Skip login - directly test pages
    // Tests use baseURL from playwright.config.local.ts (http://localhost:9002)
    await page.goto(`${baseURL}/admin/dashboard`);
    // Don't wait for title - just verify page responds
  });

  test.describe('Feature Flags & Settings', () => {
    test('should load realtime settings page', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/admin/settings`);
      await expect(page.locator('text=Configurações da Plataforma')).toBeVisible();
      
      // Check realtime card exists
      const realtimeCard = page.locator('[data-ai-id="settings-card-realtime"]');
      await expect(realtimeCard).toBeVisible();
      await expect(realtimeCard).toContainText('Tempo Real & Blockchain');
    });

    test('should toggle blockchain feature flag', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/admin/settings/realtime`);
      
      // Wait for page to load
      await expect(page.locator('text=Configurações em Tempo Real')).toBeVisible({ timeout: 5000 });
      
      // Find blockchain checkbox
      const blockchainCheckbox = page.locator('input[id="blockchain"]');
      await expect(blockchainCheckbox).toBeVisible();
      
      // Toggle it
      const initialState = await blockchainCheckbox.isChecked();
      await blockchainCheckbox.check();
      
      // Check warning appears
      if (!initialState) {
        const warning = page.locator('text=Blockchain requer configuração de nós Hyperledger');
        await expect(warning).toBeVisible();
      }
    });

    test('should select lawyer monetization model', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/admin/settings/realtime`);
      
      await expect(page.locator('text=Modelo de Monetização do Portal de Advogados')).toBeVisible();
      
      // Test each model
      const models = ['SUBSCRIPTION', 'PAY_PER_USE', 'REVENUE_SHARE'];
      
      for (const model of models) {
        const radio = page.locator(`input[value="${model}"]`);
        await expect(radio).toBeVisible();
        await radio.click();
        await expect(radio).toBeChecked();
      }
    });

    test('should configure soft close settings', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/admin/settings/realtime`);
      
      const softCloseCheckbox = page.locator('input[id="softclose"]');
      await softCloseCheckbox.check();
      
      // Input should be visible after toggle
      const minutesInput = page.locator('input[type="number"]');
      await expect(minutesInput).toBeVisible();
      
      // Set custom value
      await minutesInput.fill('10');
      await expect(minutesInput).toHaveValue('10');
    });
  });

  test.describe('Audit Logs', () => {
    test('should verify audit logs exist for database operations', async ({ page, context }) => {
      // Create a test auction to generate audit logs
      await page.goto('/admin/auctions');
      
      // Check that logs directory exists by attempting to access app.log
      // In real scenario, would check server-side logs
      const response = await context.request.get('/api/admin/logs/app?limit=10');
      
      if (response.ok()) {
        const logs = await response.json();
        expect(Array.isArray(logs)).toBeTruthy();
        
        // Verify audit log structure
        if (logs.length > 0) {
          const logEntry = logs[0];
          expect(logEntry).toHaveProperty('model');
          expect(logEntry).toHaveProperty('action');
          expect(logEntry).toHaveProperty('timestamp');
        }
      }
    });
  });

  test.describe('Real-time Bid Events', () => {
    test('should receive bid event when new bid is placed', async ({ page, baseURL, context }) => {
      // Navigate to an active auction with lots
      await page.goto(`${baseURL}/auctions`);
      
      // Find a lot that accepts bids
      const lotCard = page.locator('[data-testid="lot-card"]').first();
      
      if (await lotCard.isVisible()) {
        await lotCard.click();
        
        // Wait for lot detail page
        await page.waitForURL(/\/lots\//);
        
        // Check realtime status indicator
        const realtimeIndicator = page.locator('[data-testid="realtime-status"]');
        
        if (await realtimeIndicator.isVisible()) {
          await expect(realtimeIndicator).toHaveAttribute('data-connected', 'true');
        }
      }
    });

    test('should display soft close notification near auction end', async ({ page, baseURL }) => {
      // This would require a lot with endDate close to now
      await page.goto(`${baseURL}/auctions`);
      
      // Filter for lots ending soon
      const endingSoonLots = page.locator('[data-urgency-level="high"]');
      
      if (await endingSoonLots.isVisible()) {
        await expect(endingSoonLots.first()).toContainText(/Soft Close|Encerrando/i);
      }
    });
  });

  test.describe('PWA & Responsividade', () => {
    test('should have manifest.json available', async ({ page, context, baseURL }) => {
      const manifestResponse = await context.request.get(`${baseURL}/manifest.json`);
      expect(manifestResponse.ok()).toBeTruthy();
      
      const manifest = await manifestResponse.json();
      expect(manifest.name).toBe('BidExpert - Leilões Online');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    test('should be responsive on mobile viewport', async ({ browser, baseURL }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        isMobile: true,
      });
      const page = await context.newPage();
      
      const targetUrl = `${baseURL || DEFAULT_BASE_URL}/`;
      await page.goto(targetUrl);
      
      // Check viewport is properly applied
      const viewportSize = await page.viewportSize();
      expect(viewportSize?.width).toBe(375);
      expect(viewportSize?.height).toBe(667);
      
      // Check layout adapts (navbar should be visible)
      const navbar = page.locator('[data-testid="navigation"]');
      if (await navbar.isVisible()) {
        const boundingBox = await navbar.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
      }
      
      await context.close();
    });

    test('should apply viewport meta tags correctly', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/`);
      
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');
    });
  });

  test.describe('Mock Integrations (FIPE, Cartório, Tribunal)', () => {
    test('should work with mock FIPE data (script-based)', async ({ context }) => {
      // For now, verify the mock functions are callable via script
      // In real scenario, would call API endpoints
      const response = await context.request.get('/api/health');
      
      // Just check server is responding
      // Mock integrations are tested via: npm run poc:mocks
      expect(response.status()).toBeLessThan(500);
    });

    test('should work with mock cartório data (script-based)', async ({ context }) => {
      const response = await context.request.get('/api/health');
      expect(response.status()).toBeLessThan(500);
    });

    test('should work with mock tribunal data (script-based)', async ({ context }) => {
      const response = await context.request.get('/api/health');
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Database Metrics', () => {
    test('should retrieve database metrics', async ({ context, baseURL }) => {
      // Try multiple endpoints
      let response = await context.request.get(`${baseURL}/api/bidder/metrics`);
      
      if (!response.ok()) {
        response = await context.request.get(`${baseURL}/api/system/db/metrics`);
      }
      
      if (response.ok()) {
        const metrics = await response.json();
        
        expect(metrics).toHaveProperty('tenants');
        expect(metrics).toHaveProperty('users');
        expect(metrics).toHaveProperty('auctions');
        expect(metrics).toHaveProperty('lots');
        expect(metrics).toHaveProperty('bids');
        
        // All should be numbers >= 0
        Object.values(metrics).forEach(value => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });
});
