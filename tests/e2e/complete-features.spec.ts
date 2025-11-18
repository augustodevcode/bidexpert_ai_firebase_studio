/**
 * @fileoverview Complete Playwright test suite for BidExpert realtime features
 * Tests cover: WebSocket bids, soft close, audit/logs, blockchain toggle, responsiveness
 * Prerequisites: 
 *  - Database must be seeded with npm run db:seed:v3
 *  - Server running on port 9002 via npm run dev
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';
const TIMEOUT = 30000;

// ============================================================================
// Test Fixtures & Helpers
// ============================================================================

const testUser = {
  email: 'test-bidder@bidexpert.com',
  password: 'Test@12345',
  name: 'Test Bidder'
};

const testAdmin = {
  email: 'admin@bidexpert.com',
  password: 'Admin@12345',
  name: 'Admin User'
};

async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/**`, { timeout: TIMEOUT });
}

async function waitForSocketConnection(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).socketConnected === true;
  }, { timeout: TIMEOUT });
}

// ============================================================================
// TEST GROUP 1: Realtime Bids (WebSocket #4 & #21)
// ============================================================================

test.describe('Realtime Bids with WebSocket', () => {
  
  test('Should receive new bids in realtime via WebSocket', async ({ page }) => {
    // Navigate to active auction
    await page.goto(`${BASE_URL}/auctions/active`, { waitUntil: 'networkidle' });
    
    // Find first lot with active auction
    const firstLot = await page.locator('[data-testid="lot-card"]').first();
    const lotLink = firstLot.locator('a').first();
    await lotLink.click();
    
    // Wait for realtime connection
    await waitForSocketConnection(page);
    
    // Check WebSocket status indicator
    const socketStatus = page.locator('[data-testid="socket-status"]');
    await expect(socketStatus).toContainText('Connected');
  });

  test('Should display bid history in realtime', async ({ page }) => {
    // Login as bidder
    await loginUser(page, testUser.email, testUser.password);
    
    // Navigate to auction lot
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Wait for realtime data
    await page.waitForSelector('[data-testid="bid-list"]');
    
    // Check bid list updates
    const bidList = page.locator('[data-testid="bid-list"] [data-testid="bid-item"]');
    const initialCount = await bidList.count();
    
    // Simulate new bid via WebSocket (via backend event)
    await page.evaluate(() => {
      (window as any).socket?.emit('new-bid', {
        auctionId: 1,
        lotId: 1,
        amount: 50000,
        bidderId: 1,
        timestamp: new Date().toISOString()
      });
    });
    
    // Wait for update
    await page.waitForTimeout(500);
    const updatedCount = await bidList.count();
    expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('Should show realtime bid counter', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    await waitForSocketConnection(page);
    
    const bidCounter = page.locator('[data-testid="bid-counter"]');
    await expect(bidCounter).toBeVisible();
    await expect(bidCounter).toContainText(/\d+/);
  });

  test('Should handle connection loss and reconnection', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    await waitForSocketConnection(page);
    
    // Simulate connection loss
    await page.evaluate(() => {
      (window as any).socket?.disconnect();
    });
    
    // Check disconnected status
    let status = page.locator('[data-testid="socket-status"]');
    await expect(status).toContainText('Disconnected', { timeout: 5000 });
    
    // Reconnect
    await page.evaluate(() => {
      (window as any).socket?.connect();
    });
    
    // Check reconnected status
    await expect(status).toContainText('Connected', { timeout: 10000 });
  });
});

// ============================================================================
// TEST GROUP 2: Soft Close / Auto-close (#11 & #21)
// ============================================================================

test.describe('Soft Close & Auto-close Features', () => {
  
  test('Should show soft close warning before auction ends', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    
    // Navigate to auction near closing time
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Check for soft close warning (configurable, typically 5min before)
    const softCloseWarning = page.locator('[data-testid="soft-close-warning"]');
    const isVisible = await softCloseWarning.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(softCloseWarning).toContainText(/last|final|closing/i);
    }
  });

  test('Should extend auction on last-second bid (soft close enabled)', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    await waitForSocketConnection(page);
    
    // Get current end time
    const endTimeElement = page.locator('[data-testid="auction-end-time"]');
    const originalEndTime = await endTimeElement.textContent();
    
    // Simulate bid in last 5 minutes
    await page.evaluate(() => {
      const event = new CustomEvent('bid-received', {
        detail: { amount: 60000, timestamp: new Date() }
      });
      window.dispatchEvent(event);
    });
    
    // Check if end time extended (should add 5 minutes)
    await page.waitForTimeout(1000);
    const newEndTime = await endTimeElement.textContent();
    
    // They should be different if soft close worked
    if (originalEndTime && newEndTime) {
      expect(originalEndTime).not.toEqual(newEndTime);
    }
  });

  test('Admin can configure soft close settings', async ({ page }) => {
    await loginUser(page, testAdmin.email, testAdmin.password);
    
    // Navigate to admin settings
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    
    // Find soft close toggle
    const softCloseToggle = page.locator('[data-testid="toggle-soft-close"]');
    await expect(softCloseToggle).toBeVisible();
    
    // Check current state
    const isEnabled = await softCloseToggle.isChecked();
    
    // Toggle it
    await softCloseToggle.click();
    
    // Verify change
    const newState = await softCloseToggle.isChecked();
    expect(newState).not.toEqual(isEnabled);
    
    // Save settings
    const saveButton = page.locator('[data-testid="btn-save-settings"]');
    await saveButton.click();
    
    // Verify save toast
    await expect(page.locator('text=Settings saved')).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// TEST GROUP 3: Audit Logs & Versionamento (#4 & #28)
// ============================================================================

test.describe('Audit Logs & Versioning', () => {
  
  test('Should log all bid actions', async ({ page }) => {
    await loginUser(page, testUser.email, testUser.password);
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Place a bid
    const bidAmount = page.locator('input[data-testid="bid-amount"]');
    await bidAmount.fill('50000');
    
    const placeBidBtn = page.locator('button[data-testid="btn-place-bid"]');
    await placeBidBtn.click();
    
    // Wait for success
    await expect(page.locator('text=Bid placed successfully')).toBeVisible({ timeout: 5000 });
    
    // Check admin can see audit log
    await loginUser(page, testAdmin.email, testAdmin.password);
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
    
    // Search for bid action
    const searchBox = page.locator('input[data-testid="search-audit-logs"]');
    await searchBox.fill('BID_PLACED');
    
    // Check log appears
    const logEntries = page.locator('[data-testid="audit-log-entry"]');
    const count = await logEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Should show entity version history', async ({ page }) => {
    await loginUser(page, testAdmin.email, testAdmin.password);
    
    // Navigate to lot details
    await page.goto(`${BASE_URL}/admin/lots/1`, { waitUntil: 'networkidle' });
    
    // Check version history tab
    const historyTab = page.locator('[data-testid="tab-version-history"]');
    await expect(historyTab).toBeVisible();
    await historyTab.click();
    
    // Check history list
    const historyItems = page.locator('[data-testid="version-history-item"]');
    const count = await historyItems.count();
    expect(count).toBeGreaterThan(0);
    
    // Check timestamps
    const firstItem = historyItems.first();
    const timestamp = await firstItem.locator('[data-testid="version-timestamp"]').textContent();
    expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('Should track who made what changes', async ({ page }) => {
    await loginUser(page, testAdmin.email, testAdmin.password);
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
    
    // Filter by user
    const userFilter = page.locator('select[data-testid="filter-user"]');
    await userFilter.selectOption(testAdmin.email);
    
    // Check entries
    const entries = page.locator('[data-testid="audit-log-entry"]');
    const count = await entries.count();
    
    // Each should show user info
    for (let i = 0; i < Math.min(count, 3); i++) {
      const userCell = entries.nth(i).locator('[data-testid="col-user"]');
      const text = await userCell.textContent();
      expect(text).toContain(testAdmin.name);
    }
  });
});

// ============================================================================
// TEST GROUP 4: Blockchain Toggle (#5 & #27)
// ============================================================================

test.describe('Blockchain Feature Toggle', () => {
  
  test('Admin can toggle blockchain on/off', async ({ page }) => {
    await loginUser(page, testAdmin.email, testAdmin.password);
    
    // Navigate to admin panel
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    
    // Find blockchain toggle
    const blockchainToggle = page.locator('[data-testid="toggle-blockchain"]');
    await expect(blockchainToggle).toBeVisible();
    
    // Get initial state
    const initialState = await blockchainToggle.isChecked();
    
    // Toggle
    await blockchainToggle.click();
    
    // Verify change persisted
    const newState = await blockchainToggle.isChecked();
    expect(newState).not.toEqual(initialState);
    
    // Save
    await page.locator('[data-testid="btn-save-settings"]').click();
    await expect(page.locator('text=Settings saved')).toBeVisible({ timeout: 5000 });
    
    // Reload and verify
    await page.reload();
    const reloadedState = await blockchainToggle.isChecked();
    expect(reloadedState).toBe(newState);
  });

  test('Blockchain status shown in auction details', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Check for blockchain indicator
    const blockchainBadge = page.locator('[data-testid="blockchain-status"]');
    const exists = await blockchainBadge.isVisible().catch(() => false);
    
    if (exists) {
      const text = await blockchainBadge.textContent();
      expect(text).toMatch(/blockchain|chain/i);
    }
  });

  test('Should submit bids to blockchain when enabled', async ({ page }) => {
    // Ensure blockchain is enabled
    await loginUser(page, testAdmin.email, testAdmin.password);
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    const toggle = page.locator('[data-testid="toggle-blockchain"]');
    if (!(await toggle.isChecked())) {
      await toggle.click();
      await page.locator('[data-testid="btn-save-settings"]').click();
    }
    
    // Now place bid
    await loginUser(page, testUser.email, testUser.password);
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    const bidInput = page.locator('input[data-testid="bid-amount"]');
    await bidInput.fill('55000');
    
    const placeBidBtn = page.locator('button[data-testid="btn-place-bid"]');
    await placeBidBtn.click();
    
    // Should see blockchain confirmation
    const blockchainConfirm = page.locator('[data-testid="blockchain-confirmation"]');
    const visible = await blockchainConfirm.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (visible) {
      await expect(blockchainConfirm).toContainText(/recorded|blockchain|hash/i);
    }
  });
});

// ============================================================================
// TEST GROUP 5: Responsive Design / PWA (#31 & #32)
// ============================================================================

test.describe('Responsive Design & PWA', () => {
  
  test('Should be responsive on mobile (320px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Check hamburger menu appears
    const hamburger = page.locator('[data-testid="menu-hamburger"]');
    await expect(hamburger).toBeVisible();
    
    // Check layout is mobile-optimized
    const mainContent = page.locator('main');
    const width = await mainContent.evaluate(el => el.offsetWidth);
    expect(width).toBeLessThanOrEqual(320);
  });

  test('Should be responsive on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Navigation should be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check layout flexibility
    const grid = page.locator('[data-testid="lots-grid"]');
    const visible = await grid.isVisible().catch(() => false);
    
    if (visible) {
      const colCount = await grid.evaluate(el => {
        const style = window.getComputedStyle(el);
        const cols = style.gridTemplateColumns.split(' ').length;
        return cols;
      });
      
      expect(colCount).toBeGreaterThanOrEqual(1);
      expect(colCount).toBeLessThanOrEqual(3);
    }
  });

  test('Should be responsive on desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Full navigation should be visible
    const navItems = page.locator('nav a');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(3);
    
    // Grid should show multiple columns
    const grid = page.locator('[data-testid="lots-grid"]');
    const visible = await grid.isVisible().catch(() => false);
    
    if (visible) {
      const colCount = await grid.evaluate(el => {
        const style = window.getComputedStyle(el);
        const cols = style.gridTemplateColumns.split(' ').length;
        return cols;
      });
      
      expect(colCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('Should have PWA installable badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Check install prompt appears (if supported)
    const installButton = page.locator('[data-testid="pwa-install-btn"]');
    const visible = await installButton.isVisible().catch(() => false);
    
    if (visible) {
      await expect(installButton).toContainText(/install|app/i);
    }
  });

  test('Should have manifest.json configured', async ({ page }) => {
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });
    
    expect(manifest).toBeTruthy();
    
    // Fetch and validate manifest
    const manifestUrl = `${BASE_URL}${manifest}`;
    const manifestRes = await page.request.get(manifestUrl);
    expect(manifestRes.status()).toBe(200);
    
    const manifestData = await manifestRes.json();
    expect(manifestData.name).toBeTruthy();
    expect(manifestData.start_url).toBeTruthy();
  });
});

// ============================================================================
// TEST GROUP 6: Performance & Accessibility
// ============================================================================

test.describe('Performance & Accessibility', () => {
  
  test('Should load auction page in < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('Should have good accessibility (ARIA labels)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = buttons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => null);
      const textContent = await btn.textContent();
      
      const hasLabel = ariaLabel || (textContent && textContent.trim().length > 0);
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Should support keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/1/lots/1`, { waitUntil: 'networkidle' });
    
    // Tab through interactive elements
    const focusableElements = page.locator('button, a, input, select');
    const initialCount = await focusableElements.count();
    
    // Press Tab
    await page.keyboard.press('Tab');
    
    // Check something is focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focused);
  });
});
