import { test, expect } from '@playwright/test';

test.describe('Admin Panel Refactor (Item 43)', () => {
  test.beforeEach(async ({ page }) => {
    // For now, I'll just navigate to the dashboard, assuming the user is logged in.
    await page.goto('/admin/dashboard');
  });

  test.describe('Unified Navigation', () => {
    test('should display all main navigation links', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Auctions' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sellers' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    });

    test('should navigate to the Assets page', async ({ page }) => {
      await page.getByRole('link', { name: 'Assets' }).click();
      await expect(page).toHaveURL(/.*\/admin\/assets/);
      await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    });

    test('should navigate to the Auctions page', async ({ page }) => {
      await page.getByRole('link', { name: 'Auctions' }).click();
      await expect(page).toHaveURL(/.*\/admin\/auctions/);
      await expect(page.getByRole('heading', { name: 'Auctions' })).toBeVisible();
    });

    test('should navigate to the Users page', async ({ page }) => {
      await page.getByRole('link', { name: 'Users' }).click();
      await expect(page).toHaveURL(/.*\/admin\/users/);
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    });
  });
});
