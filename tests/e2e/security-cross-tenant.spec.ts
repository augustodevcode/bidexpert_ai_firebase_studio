import { test, expect } from '@playwright/test';

/**
 * Test Suite: Multi-Tenant Security - Cross-Tenant Access Prevention
 * 
 * This suite validates that Phase 1 security fixes prevent cross-tenant access.
 * Tests that users cannot access/modify resources from other tenants.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

test.describe('🔒 Cross-Tenant Security Validation', () => {

  // Setup: Use two different tenants' credentials
  const tenant1 = {
    subdomain: 'tenant1',
    email: 'user1@tenant1.com',
    password: 'test123456',
  };

  const tenant2 = {
    subdomain: 'tenant2',
    email: 'user2@tenant2.com',
    password: 'test123456',
  };

  /**
   * Test 1: Verify Lot Access is Tenant-Isolated
   * 
   * Scenario: User from Tenant A tries to access Lot from Tenant B
   * Expected: 403 Forbidden or 404 Not Found
   */
  test('should deny access to lots from another tenant', async ({ page }) => {
    // Step 1: Login as Tenant 1 user
    await page.goto(`${BASE_URL}`);
    
    // Navigate to login
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', tenant1.email);
    await page.fill('[data-testid="password-input"]', tenant1.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await page.waitForURL(`**/dashboard`);
    
    // Step 2: Try to access a lot from Tenant 2 (cross-tenant access)
    // Assuming we know Tenant 2's Lot ID is "456"
    const tenant2LotUrl = `${BASE_URL}/lots/456`;
    
    await page.goto(tenant2LotUrl);
    
    // Step 3: Verify we get 403 or 404 error
    const response = await page.evaluate(() => {
      return fetch(window.location.href)
        .then(r => r.status);
    });
    
    // Should return either 403 (Forbidden) or 404 (Not Found)
    expect([403, 404]).toContain(response);
  });

  /**
   * Test 2: Verify Payment Method Access is Tenant-Isolated
   * 
   * Scenario: User from Tenant A tries to modify Payment Method from Tenant B
   * Expected: 403 Forbidden
   */
  test('should deny modification of payment methods from another tenant', async ({ page, context }) => {
    // Step 1: Login as Tenant 2 user
    await page.goto(`${BASE_URL}`);
    
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', tenant2.email);
    await page.fill('[data-testid="password-input"]', tenant2.password);
    await page.click('[data-testid="login-button"]');
    
    // Get auth token for API calls
    const cookies = await context.cookies();
    const authToken = cookies.find(c => c.name === 'authjs.session-token')?.value;
    
    // Step 2: Try to update a Payment Method from Tenant 1 (cross-tenant)
    // Assuming Tenant 1's Payment Method ID is "789"
    const response = await page.evaluate(async (token) => {
      const res = await fetch('/api/bidder/payment-methods/789', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isDefault: true
        })
      });
      return res.status;
    }, authToken);
    
    // Step 3: Verify we get 403 Forbidden
    expect(response).toBe(403);
  });

  /**
   * Test 3: Verify Own Resources are Still Accessible
   * 
   * Scenario: User from Tenant A can access own resources
   * Expected: 200 OK
   */
  test('should allow access to own resources within tenant', async ({ page, context }) => {
    // Step 1: Login as Tenant 1 user
    await page.goto(`${BASE_URL}`);
    
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', tenant1.email);
    await page.fill('[data-testid="password-input"]', tenant1.password);
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(`**/dashboard`);
    
    // Get auth token
    const cookies = await context.cookies();
    const authToken = cookies.find(c => c.name === 'authjs.session-token')?.value;
    
    // Step 2: Access own Lot (Tenant 1's Lot ID "123")
    const lotResponse = await page.evaluate(async (token) => {
      const res = await fetch('/api/lots/123', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      return res.status;
    }, authToken);
    
    // Step 3: Should succeed (200 or 404 if lot doesn't exist, but not 403)
    expect([200, 404]).toContain(lotResponse);
    
    // Step 4: Access own Payment Method
    const paymentResponse = await page.evaluate(async (token) => {
      const res = await fetch('/api/bidder/payment-methods/123', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      return res.status;
    }, authToken);
    
    // Should succeed
    expect([200, 404]).toContain(paymentResponse);
  });

  /**
   * Test 4: Verify API Rejects Missing TenantId
   * 
   * Scenario: API request without proper tenant validation
   * Expected: 401 Unauthorized
   */
  test('should reject requests without valid session', async ({ page }) => {
    // Try to access payment methods without authentication
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/bidder/payment-methods/123');
      return res.status;
    });
    
    // Should return 401 (No session)
    expect(response).toBe(401);
  });

  /**
   * Test 5: Verify TenantId Mismatch on Lot Service
   * 
   * Scenario: Backend LotService enforces tenantId validation
   * Expected: Lot from other tenant returns null/404
   */
  test('should not leak lot data in public endpoints when tenant differs', async ({ page }) => {
    // Access public lot listing
    await page.goto(`${BASE_URL}/auctions`);
    
    // Should show only Tenant A's public auctions
    const auctionCount = await page.locator('[data-testid="auction-card"]').count();
    expect(auctionCount).toBeGreaterThan(0);
    
    // Try to access specific lot from Tenant B
    const tenant2LotUrl = `${BASE_URL}/lots/TENANT2-LOT-ID`;
    
    const response = await page.goto(tenant2LotUrl);
    
    // Should show not found or no data
    expect([null, 404]).toContain(response?.status());
  });
});

/**
 * Test 6: Payment Status Update Security
 * 
 * Validates InstallmentPaymentService security fix
 */
test.describe('💳 Payment Status Security', () => {
  test('should not allow marking other tenant payments as paid', async ({ page, context }) => {
    const tenant1 = { email: 'user1@tenant1.com', password: 'test123456' };
    
    // Login as Tenant 1
    await page.goto(`${BASE_URL}`);
    
    await page.click('[data-testid="login-link"]');
    await page.fill('[data-testid="email-input"]', tenant1.email);
    await page.fill('[data-testid="password-input"]', tenant1.password);
    await page.click('[data-testid="login-button"]');
    
    const cookies = await context.cookies();
    const token = cookies.find(c => c.name === 'authjs.session-token')?.value;
    
    // Try to mark Tenant 2's payment as paid
    const response = await page.evaluate(async (t) => {
      const res = await fetch('/api/payments/456/mark-as-paid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${t}`,
          'Content-Type': 'application/json'
        }
      });
      return res.status;
    }, token);
    
    // Should be forbidden
    expect(response).toBe(403);
  });
});

export {};
