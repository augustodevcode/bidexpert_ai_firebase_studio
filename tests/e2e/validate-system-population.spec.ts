import { test, expect } from '@playwright/test';

test.describe('System Population Validation', () => {
  const BASE_URL = 'http://demo.localhost:9005';

  test.beforeEach(async ({ page }) => {
    console.log(`Navigating to home at ${BASE_URL}...`);
    await page.goto(`${BASE_URL}/`);
  });

  test('1. Basic Connectivity & Tenant Check', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('BidExpert');
    // Verify valid tenant loaded (not 404)
    await expect(page.locator('body')).not.toContainText('Tenant not found');
  });

  test('2. Validate Home Page populated data', async ({ page }) => {
    // Check Auctions
    await expect(page.getByText(/Leilão/i).first()).toBeVisible();
    
    // Check Assets/Lots images
    const images = page.locator('img');
    expect(await images.count()).toBeGreaterThan(5);
    
    // Check Categories
    await expect(page.getByText('Imóveis').first()).toBeVisible();
    await expect(page.getByText('Veículos').first()).toBeVisible();
  });

  test('3. Auction Detail & Lot Navigation', async ({ page }) => {
    // Click on first available auction or lot
    const firstAuction = page.locator('a[href*="/leilao/"]').first();
    if (await firstAuction.isVisible()) {
        await firstAuction.click();
        await expect(page.getByText('Detalhes').first()).toBeVisible();
        
        // Check lots in auction
        const lotLink = page.locator('a[href*="/lote/"]').first();
        if (await lotLink.isVisible()) {
            await lotLink.click();
            await expect(page.getByText('Lance Inicial').first()).toBeVisible();
            await expect(page.getByText('Descrição').first()).toBeVisible();
            // Check risk warnings (from seed)
            // await expect(page.getByText('Risco').first()).toBeVisible(); 
        }
    }
  });

  test('4. Admin Login & Dashboard Data', async ({ page }) => {
     await page.goto(`${BASE_URL}/auth/login`);
     await page.fill('input[type="email"]', 'admin@bidexpert.com');
     await page.fill('input[type="password"]', 'Test@12345');
     await page.click('button[type="submit"]', { timeout: 5000 }); 
     
     // Wait for redirect
     await page.waitForURL(/.*dashboard.*/, { timeout: 20000 });
     
     // Check dashboard widgets (populated counters)
     await expect(page.getByText(/Usuários|Leilões|Lotes/i).first()).toBeVisible();
  });

  test('5. Footer & Legal', async ({ page }) => {
      await expect(page.locator('footer')).toBeVisible();
      await expect(page.getByText('Termos de Serviço').first()).toBeVisible();
  });
});
