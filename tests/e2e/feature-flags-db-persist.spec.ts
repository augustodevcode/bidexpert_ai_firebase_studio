/**
 * @fileoverview E2E test: Feature Flags DB Persistence
 *
 * Validates that feature flags are stored in the database (PlatformSettings.featureFlags JSON column)
 * and NOT in localStorage. Tests the full round-trip: read defaults → update via API → verify persistence.
 *
 * BDD Scenarios:
 * - GIVEN defaults are seeded in DB
 *   WHEN GET /api/admin/feature-flags is called
 *   THEN it returns the persisted flags (not hardcoded defaults)
 *
 * - GIVEN a flag is toggled via POST /api/admin/feature-flags
 *   WHEN GET /api/admin/feature-flags is called again
 *   THEN the toggled value is persisted
 *
 * - GIVEN the app is loaded
 *   WHEN localStorage is inspected
 *   THEN NO feature flag key exists (DB-only persistence)
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin, CREDENTIALS } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9006';
const API_FLAGS = `${BASE_URL}/api/admin/feature-flags`;

test.describe('Feature Flags - DB Persistence', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('GET /api/admin/feature-flags returns seeded defaults from DB', async ({ page }) => {
    const response = await page.request.get(API_FLAGS);
    expect(response.ok()).toBe(true);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.featureFlags).toBeDefined();

    // Validate known defaults
    const flags = json.data.featureFlags;
    expect(flags.softCloseEnabled).toBe(true);
    expect(flags.softCloseMinutes).toBe(5);
    expect(flags.blockchainEnabled).toBe(false);
    expect(flags.maintenanceMode).toBe(false);
    expect(flags.pwaEnabled).toBe(true);
    expect(flags.lawyerPortalEnabled).toBe(true);
  });

  test('POST /api/admin/feature-flags persists changes to DB', async ({ page }) => {
    // Step 1: Toggle maintenanceMode ON
    const postRes = await page.request.post(API_FLAGS, {
      data: { maintenanceMode: true, debugLogsEnabled: true },
    });
    expect(postRes.ok()).toBe(true);

    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.data.maintenanceMode).toBe(true);
    expect(postJson.data.debugLogsEnabled).toBe(true);

    // Step 2: Verify via separate GET (confirms DB persistence, not just cache)
    const getRes = await page.request.get(API_FLAGS);
    const getJson = await getRes.json();
    expect(getJson.data.featureFlags.maintenanceMode).toBe(true);
    expect(getJson.data.featureFlags.debugLogsEnabled).toBe(true);
    // Other flags unchanged
    expect(getJson.data.featureFlags.softCloseEnabled).toBe(true);

    // Step 3: Revert to avoid side-effects for other tests
    await page.request.post(API_FLAGS, {
      data: { maintenanceMode: false, debugLogsEnabled: false },
    });
  });

  test('localStorage does NOT contain feature flags (DB-only persistence)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Wait for any lazy store operations

    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    
    // Ensure NO feature-flag related keys exist in localStorage
    const flagKeys = localStorageKeys.filter(k =>
      k.includes('feature') || k.includes('flag') || k.includes('featureFlags')
    );
    expect(flagKeys).toHaveLength(0);
  });

  test('PUT /api/admin/feature-flags works as alias for POST', async ({ page }) => {
    const putRes = await page.request.put(API_FLAGS, {
      data: { softCloseMinutes: 10 },
    });
    expect(putRes.ok()).toBe(true);

    const putJson = await putRes.json();
    expect(putJson.success).toBe(true);
    expect(putJson.data.softCloseMinutes).toBe(10);

    // Revert
    await page.request.put(API_FLAGS, {
      data: { softCloseMinutes: 5 },
    });
  });

  test('Partial update preserves other flags', async ({ page }) => {
    // Read current state
    const before = await (await page.request.get(API_FLAGS)).json();
    const originalPwa = before.data.featureFlags.pwaEnabled;

    // Update only one flag
    await page.request.post(API_FLAGS, {
      data: { fipeIntegrationEnabled: true },
    });

    // Verify other flags are untouched
    const after = await (await page.request.get(API_FLAGS)).json();
    expect(after.data.featureFlags.pwaEnabled).toBe(originalPwa);
    expect(after.data.featureFlags.fipeIntegrationEnabled).toBe(true);

    // Revert
    await page.request.post(API_FLAGS, {
      data: { fipeIntegrationEnabled: false },
    });
  });
});
