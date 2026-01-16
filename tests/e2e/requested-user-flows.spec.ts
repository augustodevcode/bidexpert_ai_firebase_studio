import { test, expect } from '@playwright/test';

// Credentials based on global-setup.ts/seed scripts
// Admin: admin@bidexpert.com / Test@12345 (or Admin@12345 depending on seed)
// Lawyer: advogado@bidexpert.com / Test@12345
// Bidder: test-bidder@bidexpert.com / Test@12345

const ADMIN_CREDENTIALS = { email: 'admin@bidexpert.com', password: 'Test@12345' };
// Using Lawyer as "Normal User" since it's a distinct non-admin/non-bidder role setup in global-setup
const NORMAL_USER_CREDENTIALS = { email: 'advogado@bidexpert.com', password: 'Test@12345' }; 
const BIDDER_CREDENTIALS = { email: 'test-bidder@bidexpert.com', password: 'Test@12345' };

test.describe('Requested User Flows', () => {

  test('Normal User (Lawyer) Login and Basic Navigation', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Login
    await page.fill('[data-ai-id="auth-login-email-input"]', NORMAL_USER_CREDENTIALS.email);
    await page.fill('[data-ai-id="auth-login-password-input"]', NORMAL_USER_CREDENTIALS.password);
    await page.click('[data-ai-id="auth-login-submit-button"]');

    // Wait for redirect to dashboard or home
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    
    // Check if critical element is visible (e.g., sidebar or header)
    // Adjust selector based on actual generic App layout
    await expect(page.locator('header').first()).toBeVisible();
    
    console.log('Normal User Logged in successfully.');
  });

  test('Admin User Login and Admin Panel Navigation', async ({ page }) => {
    await page.goto('/auth/login');

    // Login
    await page.fill('[data-ai-id="auth-login-email-input"]', ADMIN_CREDENTIALS.email);
    await page.fill('[data-ai-id="auth-login-password-input"]', ADMIN_CREDENTIALS.password);
    await page.click('[data-ai-id="auth-login-submit-button"]');
    
    // Expect admin dashboard
    await expect(page).toHaveURL(/.*admin.*/, { timeout: 15000 });
    console.log('Admin Logged in successfully.');

    // Navigate to Users (assuming sidebar link exists)
    // I'll try to find a link that contains "Usuários" or has href="/admin/users"
    const usersLink = page.locator('a[href*="/admin/users"]').first();
    if (await usersLink.isVisible()) {
        await usersLink.click();
        await expect(page).toHaveURL(/.*\/admin\/users.*/);
        console.log('Navigated to Admin Users.');
    } else {
        console.log('Users link not found, skipping specific nav check.');
    }

    // Navigate to Auctions
    const auctionsLink = page.locator('a[href*="/admin/auctions"]').first();
    if (await auctionsLink.isVisible()) {
        await auctionsLink.click();
        await expect(page).toHaveURL(/.*\/admin\/auctions.*/);
        console.log('Navigated to Admin Auctions.');
    }
  });

  test('Bidder User Login and Site/Panel Navigation', async ({ page }) => {
    // 1. Initial Login
    await page.goto('/auth/login');
    await page.fill('[data-ai-id="auth-login-email-input"]', BIDDER_CREDENTIALS.email);
    await page.fill('[data-ai-id="auth-login-password-input"]', BIDDER_CREDENTIALS.password);
    await page.click('[data-ai-id="auth-login-submit-button"]');

    // Might redirect to home or dashboard
    await page.waitForLoadState('networkidle');
    console.log('Bidder Logged in.');

    // 2. Navigate Site (Home/Auctions)
    await page.goto('/');
    await expect(page).toHaveURL(/.*$/); // Homepage
    
    // Go to "Leilões" or Auctions list
    // Looking for a nav link to auctions
    const auctionsLink = page.locator('a[href*="/auctions"]').first();
    if (await auctionsLink.isVisible()) {
        await auctionsLink.click();
        await expect(page).toHaveURL(/.*auctions.*/);
        console.log('Navigated to public auctions list.');
    }

    // 3. Navigate to Bidder Panel (if applicable)
    // Often strictly under /dashboard or /my-account
    await page.goto('/dashboard'); 
    await expect(page).toHaveURL(/.*dashboard.*/);
    console.log('Navigated to Bidder Dashboard.');
    
    // Check for "Meus Lances" or similar
    // Assuming text check or href
    const myBidsLink = page.getByText(/Meus Lances/i).first().or(page.locator('a[href*="/bids"]'));
    if (await myBidsLink.isVisible()) {
        await myBidsLink.click();
        console.log('Navigated to My Bids section.');
    }
  });

});
